import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, createUnauthorizedResponse } from '@/lib/api/auth';
import { getLLMApiKey } from '@/lib/api/llm-keys';
import { getNodeFixPrompt } from '@/lib/workflow/prompts/node-fix-prompt';
import { WorkflowSchema } from '@/lib/workflow/schemas/workflow-schema';
import { Workflow, WorkflowNode, WorkflowEdge } from '@/lib/workflow/types';

export const dynamic = 'force-dynamic';

interface FixNodeRequest {
  node: WorkflowNode;
  workflow: {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
    name?: string;
    description?: string;
  };
  error?: {
    message: string;
    type?: string;
    nodeId?: string;
  };
  executionContext?: {
    nodeResults?: Record<string, any>;
    variables?: Record<string, any>;
  };
  userId?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Validate authentication
    const authResult = await validateApiKey(request);
    if (!authResult.authenticated) {
      return createUnauthorizedResponse(authResult.error || 'Authentication required');
    }

    const body: FixNodeRequest = await request.json();
    const { node, workflow, error, executionContext, userId } = body;

    // Validate required fields
    if (!node || !workflow || !workflow.nodes || !workflow.edges) {
      return NextResponse.json(
        { error: 'Node and workflow context are required' },
        { status: 400 }
      );
    }

    // Get Gemini API key (required for this feature)
    const googleApiKey = userId 
      ? await getLLMApiKey('google', userId) 
      : process.env.GOOGLE_API_KEY;

    if (!googleApiKey) {
      return NextResponse.json(
        { error: 'Google API key is required for Fix With AI feature. Please configure your Google API key in Settings.' },
        { status: 400 }
      );
    }

    // Import Google Generative AI
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(googleApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

    // Build comprehensive system prompt
    const systemPrompt = await getNodeFixPrompt({
      node,
      workflow,
      error,
      executionContext,
    });

    // Call Gemini for analysis
    console.log(`🔧 Analyzing node ${node.id} with Gemini for fix...`);

    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{ text: systemPrompt }]
      }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.3, // Lower temperature for more deterministic fixes
        maxOutputTokens: 8192, // Increase to maximum for Gemini 2.5 Pro (supports up to 8192 output tokens)
      },
    } as any);

    const response = await result.response;
    
    // Log response structure for debugging
    console.log('📊 Gemini response structure:', {
      hasCandidates: !!response.candidates,
      candidatesLength: response.candidates?.length || 0,
      hasPromptFeedback: !!response.promptFeedback,
    });
    
    // Check for blocked or filtered responses
    if (response.candidates && response.candidates.length > 0) {
      const candidate = response.candidates[0];
      console.log('📋 Candidate details:', {
        finishReason: candidate.finishReason,
        hasContent: !!candidate.content,
        contentParts: candidate.content?.parts?.length || 0,
      });
      
      if (candidate.finishReason && candidate.finishReason !== 'STOP') {
        console.error('⚠️ Gemini response finish reason:', candidate.finishReason);
        
        // Handle MAX_TOKENS - response was truncated but may still be useful
        if (candidate.finishReason === 'MAX_TOKENS') {
          console.warn('⚠️ Response truncated due to token limit, but will attempt to parse anyway');
          // Don't return error yet - try to extract what we have
        } else {
          // For other finish reasons (SAFETY, etc.), return error
          const safetyRatings = candidate.safetyRatings || [];
          return NextResponse.json(
            {
              error: `AI response was blocked: ${candidate.finishReason}`,
              message: safetyRatings.length > 0 
                ? `Content was filtered due to: ${safetyRatings.map((r: any) => r.category).join(', ')}`
                : 'The AI model filtered the response. Please try again or simplify the request.',
            },
            { status: 400 }
          );
        }
      }
      
      // Check if content exists
      if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        // For MAX_TOKENS, content might still be available via response.text()
        if (candidate.finishReason !== 'MAX_TOKENS') {
          console.error('❌ Gemini candidate has no content parts');
          return NextResponse.json(
            {
              error: 'Empty AI response content',
              message: 'The AI model returned a response with no content parts.',
            },
            { status: 500 }
          );
        } else {
          console.warn('⚠️ MAX_TOKENS finish reason with no content parts - will try response.text()');
        }
      }
    } else {
      console.error('❌ Gemini response has no candidates');
      return NextResponse.json(
        {
          error: 'No AI response candidates',
          message: 'The AI model did not return any response candidates.',
        },
        { status: 500 }
      );
    }

    let responseText = '';
    try {
      responseText = response.text();
    } catch (error: any) {
      console.error('❌ Error extracting text from Gemini response:', error);
      console.error('❌ Response object:', JSON.stringify(response, null, 2).substring(0, 500));
      return NextResponse.json(
        {
          error: 'Failed to extract text from AI response',
          message: error.message || 'The AI model did not return valid text.',
        },
        { status: 500 }
      );
    }

    if (!responseText || responseText.trim().length === 0) {
      console.error('❌ Gemini returned empty response text');
      console.error('❌ Response object structure:', {
        candidates: response.candidates?.length,
        text: typeof response.text,
      });
      return NextResponse.json(
        {
          error: 'Empty AI response',
          message: 'The AI model returned an empty response. Please try again.',
        },
        { status: 500 }
      );
    }

    console.log('📝 Raw Gemini response (first 500 chars):', responseText.substring(0, 500));

    // Parse JSON response - try multiple strategies
    let fixResponse: any;
    try {
      // Strategy 1: Direct parse
      fixResponse = JSON.parse(responseText);
    } catch (e1) {
      try {
        // Strategy 2: Extract JSON from markdown code blocks
        const codeBlockMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        if (codeBlockMatch) {
          fixResponse = JSON.parse(codeBlockMatch[1]);
        } else {
          throw e1;
        }
      } catch (e2) {
        try {
          // Strategy 3: Extract any JSON object
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            fixResponse = JSON.parse(jsonMatch[0]);
          } else {
            throw e2;
          }
        } catch (e3) {
          // Strategy 4: Try to find JSON after "Response Format" or similar markers
          const afterMarker = responseText.split(/\{/);
          if (afterMarker.length > 1) {
            // Find the largest JSON-like structure
            let bestMatch = null;
            let bestLength = 0;
            for (let i = 1; i < afterMarker.length; i++) {
              const candidate = '{' + afterMarker[i];
              const jsonMatch = candidate.match(/(\{[\s\S]*?\})/);
              if (jsonMatch && jsonMatch[0].length > bestLength) {
                bestMatch = jsonMatch[0];
                bestLength = jsonMatch[0].length;
              }
            }
            if (bestMatch) {
              try {
                fixResponse = JSON.parse(bestMatch);
              } catch {
                throw e3;
              }
            } else {
              throw e3;
            }
          } else {
            console.error('❌ Failed to parse Gemini response:', responseText);
            throw new Error(`Failed to parse AI response as JSON. Response preview: ${responseText.substring(0, 200)}`);
          }
        }
      }
    }

    // Validate fix response structure
    if (!fixResponse.fixedNode || !fixResponse.explanation) {
      return NextResponse.json(
        { error: 'Invalid AI response format. Expected fixedNode and explanation.' },
        { status: 500 }
      );
    }

    // Validate the fixed node against schema
    let validationErrors: string[] = [];
    try {
      // Validate as a complete workflow with single node to use WorkflowSchema
      const tempWorkflow = {
        name: workflow.name || 'temp',
        nodes: [fixResponse.fixedNode],
        edges: [],
      };
      WorkflowSchema.parse(tempWorkflow);
    } catch (error: any) {
      if (error?.name === 'ZodError' || error?.issues) {
        // @ts-ignore - Zod error structure
        const zodError = error as any;
        if (zodError.errors || zodError.issues) {
          const issues = zodError.errors || zodError.issues;
          validationErrors = issues.map((err: any) => 
            `${err.path.join('.')}: ${err.message}`
          );
        }
      } else {
        validationErrors = [error?.message || 'Validation failed'];
      }
      console.warn('⚠️ AI-generated fix failed validation:', validationErrors);
    }

    if (validationErrors.length > 0) {
      // Return the fix anyway but with a warning
      return NextResponse.json({
        fixedNode: fixResponse.fixedNode,
        explanation: fixResponse.explanation,
        issues: fixResponse.issues || [],
        changes: fixResponse.changes || [],
        confidence: fixResponse.confidence || 'medium',
        validationWarnings: validationErrors,
      });
    }

    console.log(`✅ Node fix generated successfully for ${node.id}`);

    // Return fixed configuration
    return NextResponse.json({
      fixedNode: fixResponse.fixedNode,
      explanation: fixResponse.explanation,
      issues: fixResponse.issues || [],
      changes: fixResponse.changes || [],
      confidence: fixResponse.confidence || 'medium',
      validationWarnings: [],
    });

  } catch (error: any) {
    console.error('❌ Node fix error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      {
        error: 'Failed to generate node fix',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

