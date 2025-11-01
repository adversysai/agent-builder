import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { validateApiKey, createUnauthorizedResponse } from '@/lib/api/auth';
import { getLLMApiKey } from '@/lib/api/llm-keys';
import { Workflow } from '@/lib/workflow/types';
import { webSearchTool, webSearchDirect } from '@/lib/workflow/tools/web-search-tool';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Helper function to format search results
function formatSearchResults(results: any): string {
  if (!results.results || !Array.isArray(results.results)) {
    return 'No search results found.';
  }
  
  let formatted = '';
  if (results.answer) {
    formatted += `**Answer:** ${results.answer}\n\n`;
  }
  
  formatted += '**Sources:**\n\n';
  results.results.forEach((result: any, index: number) => {
    formatted += `${index + 1}. **${result.title}**\n`;
    formatted += `   - URL: ${result.url}\n`;
    if (result.content) {
      formatted += `   - Summary: ${result.content.substring(0, 200)}...\n`;
    }
    formatted += '\n';
  });
  
  return formatted;
}

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Validate authentication
    const authResult = await validateApiKey(request);
    if (!authResult.authenticated) {
      return createUnauthorizedResponse(authResult.error || 'Authentication required');
    }

    const { prompt, conversationHistory = [], userId, currentWorkflow, preferredModel, executionContext, selectedTools = [] } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required and must be a string' },
        { status: 400 }
      );
    }

    // Determine which model to use for workflow generation
    // Priority: 1. Admin preference, 2. Available API keys, 3. Fallback to OpenAI
    let selectedProvider = 'openai'; // Default to OpenAI
    let selectedModel = 'gpt-4o';
    let apiKey: string | null = null;
    let client: any = null;

    // Check available API keys
    const availableKeys = {
      anthropic: userId ? await getLLMApiKey('anthropic', userId) : process.env.ANTHROPIC_API_KEY,
      openai: userId ? await getLLMApiKey('openai', userId) : process.env.OPENAI_API_KEY,
      google: userId ? await getLLMApiKey('google', userId) : process.env.GOOGLE_API_KEY,
      groq: userId ? await getLLMApiKey('groq', userId) : process.env.GROQ_API_KEY,
    };

    // Get model preference (user selection takes priority over admin setting)
    const adminPreference = process.env.WORKFLOW_GENERATOR_MODEL || 'auto';
    const finalPreference = preferredModel || adminPreference;

    // Select model based on preference and availability
    if (finalPreference === 'auto') {
      // Auto-select best available model: OpenAI (best for analysis), Anthropic, Google, Groq
      if (availableKeys.openai) {
        selectedProvider = 'openai';
        selectedModel = 'gpt-4o';
        apiKey = availableKeys.openai;
      } else if (availableKeys.anthropic) {
        selectedProvider = 'anthropic';
        selectedModel = 'claude-sonnet-4-5-20250929';
        apiKey = availableKeys.anthropic;
      } else if (availableKeys.google) {
        selectedProvider = 'google';
        selectedModel = 'gemini-2.5-pro';
        apiKey = availableKeys.google;
      } else if (availableKeys.groq) {
        selectedProvider = 'groq';
        selectedModel = 'gpt-oss-120b';
        apiKey = availableKeys.groq;
      }
    } else {
      // Use user-specified preference
      if (finalPreference === 'openai' && availableKeys.openai) {
        selectedProvider = 'openai';
        selectedModel = 'gpt-4o';
        apiKey = availableKeys.openai;
      } else if (finalPreference === 'anthropic' && availableKeys.anthropic) {
        selectedProvider = 'anthropic';
        selectedModel = 'claude-sonnet-4-5-20250929';
        apiKey = availableKeys.anthropic;
      } else if (finalPreference === 'google' && availableKeys.google) {
        selectedProvider = 'google';
        selectedModel = 'gemini-2.5-pro';
        apiKey = availableKeys.google;
      } else if (finalPreference === 'groq' && availableKeys.groq) {
        selectedProvider = 'groq';
        selectedModel = 'gpt-oss-120b';
        apiKey = availableKeys.groq;
      } else {
        // Fallback to auto-selection if preferred model not available
        if (availableKeys.openai) {
          selectedProvider = 'openai';
          selectedModel = 'gpt-4o';
          apiKey = availableKeys.openai;
        } else if (availableKeys.anthropic) {
          selectedProvider = 'anthropic';
          selectedModel = 'claude-sonnet-4-5-20250929';
          apiKey = availableKeys.anthropic;
        } else if (availableKeys.google) {
          selectedProvider = 'google';
          selectedModel = 'gemini-2.5-pro';
          apiKey = availableKeys.google;
        } else if (availableKeys.groq) {
          selectedProvider = 'groq';
          selectedModel = 'gpt-oss-120b';
          apiKey = availableKeys.groq;
        }
      }
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'No API keys configured. Please add at least one API key (OpenAI, Anthropic, Google, or Groq).' },
        { status: 500 }
      );
    }

    console.log(`🤖 Workflow generation using ${selectedProvider} (${selectedModel}) - User preference: ${finalPreference}, Admin setting: ${adminPreference}`);

    // Create appropriate client based on selected provider
    if (selectedProvider === 'anthropic') {
      const Anthropic = (await import('@anthropic-ai/sdk')).default;
      client = new Anthropic({ apiKey });
    } else if (selectedProvider === 'openai') {
      const OpenAI = (await import('openai')).default;
      client = new OpenAI({ apiKey });
    } else if (selectedProvider === 'google') {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      client = new GoogleGenerativeAI(apiKey);
    } else if (selectedProvider === 'groq') {
      const OpenAI = (await import('openai')).default;
      client = new OpenAI({
        apiKey,
        baseURL: 'https://api.groq.com/openai/v1',
      });
    }

    // Build conversation history - clean message format
    const cleanMessages = conversationHistory.map((msg: any) => ({
      role: msg.role,
      content: msg.content
    }));
    
    const messages = [
      ...cleanMessages,
      { role: 'user' as const, content: prompt }
    ];

    // Generate workflow using the selected provider
    let response;
    let systemPrompt = await getWorkflowGeneratorPrompt(currentWorkflow);

    // Add execution context to system prompt if available
    if (executionContext) {
      systemPrompt += `\n\n## Recent Workflow Execution Results\n\n`;
      systemPrompt += `Execution ID: ${executionContext.executionId}\n`;
      systemPrompt += `Status: ${executionContext.status}\n`;
      systemPrompt += `Completed: ${executionContext.completedAt}\n\n`;
      systemPrompt += `Node Results:\n${JSON.stringify(executionContext.nodeResults, null, 2)}\n\n`;
      systemPrompt += `Final Output:\n${JSON.stringify(executionContext.output, null, 2)}\n\n`;
      systemPrompt += `You can now answer questions about these results, provide insights, suggest improvements, or create visualizations.`;
    }


    if (selectedProvider === 'anthropic') {
      // Anthropic with thinking
      response = await client.messages.create({
        model: selectedModel,
        max_tokens: 12000,
        messages,
        system: systemPrompt,
        thinking: {
          type: 'enabled',
          budget_tokens: 10000
        }
      });
    } else if (selectedProvider === 'openai') {
      // OpenAI with conditional tool calling
      const tools = selectedTools.includes('web_search') ? [webSearchTool] : [];
      const toolChoice = selectedTools.includes('web_search') ? 'auto' : 'none';
      
      response = await client.chat.completions.create({
        model: selectedModel,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        tools: tools,
        tool_choice: toolChoice,
        max_tokens: 12000,
        temperature: 0.7,
      });
    } else if (selectedProvider === 'google') {
      // Google Gemini - properly handle conversation history like OpenAI
      const model = client.getGenerativeModel({ 
        model: selectedModel,
        systemInstruction: systemPrompt,
      });
      
      // Convert messages to Gemini format (contents array with role and parts)
      // Gemini uses 'user' and 'model' roles (instead of 'assistant')
      const contents = messages.map((msg: any) => {
        const role = msg.role === 'assistant' ? 'model' : 'user';
        return {
          role: role,
          parts: [{ text: msg.content }],
        };
      });
      
      const result = await model.generateContent({ contents });
      const responseText = result.response.text();
      
      // Extract usage information if available
      // Note: usageMetadata is a property, not a method, and may not always be available
      const usageMetadata = result.response.usageMetadata || null;
      const usage = usageMetadata ? {
        input_tokens: usageMetadata.promptTokenCount || 0,
        output_tokens: usageMetadata.candidatesTokenCount || 0,
        total_tokens: (usageMetadata.promptTokenCount || 0) + (usageMetadata.candidatesTokenCount || 0),
        prompt_tokens: usageMetadata.promptTokenCount || 0,
        completion_tokens: usageMetadata.candidatesTokenCount || 0,
      } : {
        input_tokens: 0,
        output_tokens: 0,
        total_tokens: 0,
        prompt_tokens: 0,
        completion_tokens: 0,
      };
      
      response = { 
        content: [{ text: responseText }],
        usage: usage,
      };
    } else if (selectedProvider === 'groq') {
      // Groq (OpenAI compatible)
      response = await client.chat.completions.create({
        model: selectedModel,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        max_tokens: 12000,
        temperature: 0.7,
      });
    }

    // Extract the generated workflow from the response
    let generatedWorkflow: Workflow;
    
    try {
      // Get response text based on provider
      let responseText: string;
      
      if (selectedProvider === 'anthropic') {
        // Handle Anthropic response format - look for text content (skip thinking)
        let textContent: any = null;
        
        // Find the text content (skip thinking content)
        for (const content of response.content) {
          if (content.type === 'text') {
            textContent = content;
            break;
          }
        }
        
        if (!textContent) {
          throw new Error('No text content found in Anthropic response');
        }
        
        responseText = textContent.text;
      } else if (selectedProvider === 'openai' || selectedProvider === 'groq') {
        // Handle OpenAI/Groq response format with tool calling
        const message = response.choices[0].message;
        
        // Check if the model wants to call a tool
        if (message.tool_calls && message.tool_calls.length > 0) {
          const toolCall = message.tool_calls[0];
          
          if (toolCall.function.name === 'web_search') {
            try {
              const args = JSON.parse(toolCall.function.arguments);
              console.log('🔍 AI requested web search:', args.query);
              
              // Execute web search
              const searchResults = await webSearchDirect(args);
              
              // Create a follow-up message with search results
              const searchContext = `Web search results for "${args.query}":\n\n${formatSearchResults(searchResults)}`;
              
              // Make another API call with the search results
              const followUpResponse = await client.chat.completions.create({
                model: selectedModel,
                messages: [
                  { role: 'system', content: systemPrompt },
                  ...messages,
                  { role: 'assistant', content: `I'll search for information about "${args.query}" to help you.` },
                  { role: 'user', content: `Here are the search results: ${searchContext}` }
                ],
                max_tokens: 12000,
                temperature: 0.7,
              });
              
              responseText = followUpResponse.choices[0].message.content || '';
            } catch (error) {
              console.error('Tool call error:', error);
              responseText = `I encountered an error while searching: ${error instanceof Error ? error.message : 'Unknown error'}`;
            }
          } else {
            responseText = message.content || 'I received a tool call but don\'t know how to handle it.';
          }
        } else {
          responseText = message.content || '';
        }
      } else if (selectedProvider === 'google') {
        // Handle Google response format
        responseText = response.content[0].text;
      } else {
        throw new Error(`Unknown provider: ${selectedProvider}`);
      }
      
      console.log(`${selectedProvider} response text:`, responseText);
      
      // Try to extract JSON from the text (might be wrapped in markdown)
      let jsonText = responseText;
      
      // Look for JSON code blocks
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      } else {
        // Look for JSON object in the text
        const jsonObjectMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonObjectMatch) {
          jsonText = jsonObjectMatch[0];
        }
      }
      
      console.log('Extracted JSON text:', jsonText);
      
      // Check if the response is plain text (conversational) or JSON (workflow)
      if (!jsonText.trim().startsWith('{') && !jsonText.trim().startsWith('[')) {
        // This is a conversational response, not a workflow
        return NextResponse.json({
          success: true,
          isConversational: true,
          message: responseText,
          workflow: null
        });
      }
      
      // This is a workflow JSON response
      generatedWorkflow = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse generated workflow:', parseError);
      console.error('Raw response:', response);
      return NextResponse.json(
        { 
          error: 'Failed to generate valid workflow',
          details: `${selectedProvider} response could not be parsed as JSON`,
          parseError: parseError instanceof Error ? parseError.message : 'Unknown parse error',
          rawResponse: response
        },
        { status: 500 }
      );
    }

    // Normalize common LLM mismatches and enforce repo scoping before validation
    if (generatedWorkflow && Array.isArray(generatedWorkflow.nodes)) {
      for (const node of generatedWorkflow.nodes) {
        const nodeType = node.data?.nodeType || node.type;
        if (nodeType === 'agent') {
          const fmt = node.data?.outputFormat;
          if (fmt === 'Markdown') {
            node.data.outputFormat = 'Text';
            console.log(`Normalized outputFormat 'Markdown' -> 'Text' for agent node ${node.id}`);
          }
        }

        // Enforce GitHub scoping rules on MCP nodes
        if (nodeType === 'mcp') {
          const action = node.data?.mcpAction;
          const params = node.data?.mcpParams || {};
          // Ensure we have repo variables as placeholders
          const repoSlugVar = '{{repoSlug}}';
          const ownerVar = '{{owner}}';
          const repoNameVar = '{{repoName}}';

          if (action === 'search_code') {
            if (typeof params.query === 'string') {
              if (!/\brepo:\s*\{\{/.test(params.query)) {
                node.data.mcpParams.query = `${params.query} repo:${repoSlugVar}`.trim();
                console.log(`Appended repo filter to GitHub query for node ${node.id}`);
              }
            }
          }

          if (action === 'list_repository_security_advisories') {
            if (!('owner' in params)) node.data.mcpParams.owner = ownerVar;
            if (!('repo' in params)) node.data.mcpParams.repo = repoNameVar;
          }
        }
      }
    }

    // Validate the generated workflow using the schema
    const { validateGeneratedWorkflow } = await import('@/lib/workflow/schemas/workflow-schema');
    const validationResult = validateGeneratedWorkflow(generatedWorkflow);
    if (!validationResult.success) {
      console.error('Workflow validation errors:', validationResult.errors);
      console.error('Generated workflow:', JSON.stringify(generatedWorkflow, null, 2));
      
      // For development, try to fix common validation issues
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 Attempting to fix validation errors in development mode...');
        
        // Fix common issues
        for (const node of generatedWorkflow.nodes || []) {
          const nodeType = node.data?.nodeType || node.type;
          
          // Fix start nodes missing inputVariables
          if (nodeType === 'start') {
            if (!node.data.inputVariables) {
              node.data.inputVariables = [];
              console.log(`Fixed missing inputVariables for start node ${node.id}`);
            }
          }
          
          // Fix agent nodes missing required fields
          if (nodeType === 'agent') {
            if (!node.data.instructions) {
              node.data.instructions = 'Process the input data and provide a response.';
              console.log(`Fixed missing instructions for agent node ${node.id}`);
            }
            if (!node.data.model) {
              node.data.model = 'anthropic/claude-sonnet-4-5-20250929';
              console.log(`Fixed missing model for agent node ${node.id}`);
            }
          }
          
          // Fix MCP nodes missing required fields
          if (nodeType === 'mcp') {
            if (!node.data.mcpServers || node.data.mcpServers.length === 0) {
              node.data.mcpServers = [{
                id: 'tavily-default',
                name: 'Tavily',
                url: 'https://mcp.tavily.com/{TAVILY_API_KEY}/mcp',
                authType: 'url',
                label: 'Tavily'
              }] as any;
              console.log(`Fixed missing mcpServers for MCP node ${node.id}`);
            }
            if (!node.data.mcpAction) {
              node.data.mcpAction = 'search';
              console.log(`Fixed missing mcpAction for MCP node ${node.id}`);
            }
          }
        }
        
        // Re-validate after fixes
        const revalidationResult = validateGeneratedWorkflow(generatedWorkflow);
        if (revalidationResult.success) {
          console.log('✅ Successfully fixed validation errors');
        } else {
          console.error('❌ Could not fix all validation errors:', revalidationResult.errors);
          return NextResponse.json(
            { 
              error: 'Generated workflow has validation errors',
              validationErrors: revalidationResult.errors,
              workflow: generatedWorkflow,
              details: `Validation failed with ${revalidationResult.errors.length} errors: ${revalidationResult.errors.join(', ')}`
            },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          { 
            error: 'Generated workflow has validation errors',
            validationErrors: validationResult.errors,
            workflow: generatedWorkflow,
            details: `Validation failed with ${validationResult.errors.length} errors: ${validationResult.errors.join(', ')}`
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      workflow: generatedWorkflow,
      thinking: (response as any).thinking, // Include Claude's reasoning
      usage: response.usage
    });

  } catch (error) {
    console.error('Workflow generation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate workflow',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Get the comprehensive workflow generator system prompt
 */
async function getWorkflowGeneratorPrompt(currentWorkflow?: any): Promise<string> {
  const { WORKFLOW_GENERATOR_PROMPT } = await import('@/lib/workflow/prompts/workflow-generator-prompt');
  
  // If there's a current workflow, add context about it
  if (currentWorkflow && currentWorkflow.nodes && currentWorkflow.nodes.length > 0) {
    const workflowContext = `
## CURRENT WORKFLOW CONTEXT

You are working with an existing workflow that has the following structure:

**Workflow Name**: ${currentWorkflow.name || 'Untitled Workflow'}
**Description**: ${currentWorkflow.description || 'No description provided'}

**Current Nodes (${currentWorkflow.nodes.length} total):**
${currentWorkflow.nodes.map((node: any, index: number) => {
  const nodeData = node.data || {};
  const nodeName = nodeData.nodeName || nodeData.label || node.id;
  const nodeType = node.type || 'unknown';
  return `${index + 1}. **${nodeName}** (${nodeType}) - Position: (${node.position?.x || 0}, ${node.position?.y || 0})`;
}).join('\n')}

**Current Connections (${currentWorkflow.edges.length} total):**
${currentWorkflow.edges.map((edge: any, index: number) => {
  return `${index + 1}. ${edge.source} → ${edge.target}`;
}).join('\n')}

## WORKFLOW MODIFICATION MODES

Based on the user's request, you can:

1. **CREATE NEW WORKFLOW**: If the user wants a completely new workflow, ignore the current workflow and create a fresh one.

2. **ADD TO EXISTING WORKFLOW**: If the user wants to add nodes/functionality to the current workflow:
   - Analyze the existing structure
   - Identify where to add new nodes
   - Maintain the existing flow while adding new capabilities
   - Use appropriate positioning to avoid overlaps
   - Connect new nodes logically to the existing flow

3. **MODIFY EXISTING WORKFLOW**: If the user wants to change the current workflow:
   - Understand what needs to be modified
   - Preserve the overall structure where possible
   - Make targeted changes to specific nodes or connections
   - Ensure the modified workflow remains functional

4. **ENHANCE EXISTING WORKFLOW**: If the user wants to improve the current workflow:
   - Add missing connections or logic
   - Optimize the flow
   - Add error handling or validation
   - Improve the overall structure

## POSITIONING GUIDELINES FOR MODIFICATIONS

When adding to or modifying an existing workflow:
- **New nodes**: Position them to the right of existing nodes (x: max existing x + 350)
- **Parallel branches**: Use different y positions (y: 200, 500, 800, etc.)
- **Avoid overlaps**: Check existing positions and space accordingly
- **Maintain flow**: Ensure logical left-to-right flow
- **End node**: Always position at the far right (x: 1500+)

## RESPONSE FORMAT FOR MODIFICATIONS

When modifying an existing workflow, return the COMPLETE workflow including:
- All existing nodes (preserve their data and positioning)
- All existing edges (preserve connections)
- New nodes with appropriate positioning
- New edges connecting to existing flow
- Updated workflow metadata if needed

**IMPORTANT**: Always return the complete workflow structure, not just the additions.

---

`;
    
    return workflowContext + WORKFLOW_GENERATOR_PROMPT;
  }
  
  return WORKFLOW_GENERATOR_PROMPT;
}

