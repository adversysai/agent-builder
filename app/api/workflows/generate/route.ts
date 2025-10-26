import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { validateApiKey, createUnauthorizedResponse } from '@/lib/api/auth';
import { getLLMApiKey } from '@/lib/api/llm-keys';
import { Workflow } from '@/lib/workflow/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Validate authentication
    const authResult = await validateApiKey(request);
    if (!authResult.authenticated) {
      return createUnauthorizedResponse(authResult.error || 'Authentication required');
    }

    const { prompt, conversationHistory = [], userId, currentWorkflow } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required and must be a string' },
        { status: 400 }
      );
    }

    // Get user's API key if available
    const userApiKey = userId ? await getLLMApiKey('anthropic', userId) : null;
    const apiKey = userApiKey || process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Anthropic API key not configured' },
        { status: 500 }
      );
    }

    // Create Anthropic client with user's key
    const client = new Anthropic({ apiKey });

    // Build conversation history - clean message format for Anthropic
    const cleanMessages = conversationHistory.map((msg: any) => ({
      role: msg.role,
      content: msg.content
    }));
    
    const messages = [
      ...cleanMessages,
      { role: 'user' as const, content: prompt }
    ];

    // Generate workflow using Claude with extended thinking
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 12000, // Must be greater than thinking budget
      messages,
      system: await getWorkflowGeneratorPrompt(currentWorkflow),
      thinking: {
        type: 'enabled',
        budget_tokens: 10000 // Allow Claude to think through complex logic
      }
    });

    // Extract the generated workflow from the response
    let generatedWorkflow: Workflow;
    
    try {
      // Handle different response formats - look for text content (skip thinking)
      let textContent: any = null;
      
      // Find the text content (skip thinking content)
      for (const content of response.content) {
        if (content.type === 'text') {
          textContent = content;
          break;
        }
      }
      
      if (!textContent) {
        throw new Error('No text content found in Claude response');
      }
      
      console.log('Claude response text:', textContent.text);
      
      // Try to extract JSON from the text (Claude might wrap it in markdown)
      let jsonText = textContent.text;
      
      // Look for JSON code blocks
      const jsonMatch = textContent.text.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      } else {
        // Look for JSON object in the text
        const jsonObjectMatch = textContent.text.match(/\{[\s\S]*\}/);
        if (jsonObjectMatch) {
          jsonText = jsonObjectMatch[0];
        }
      }
      
      console.log('Extracted JSON text:', jsonText);
      
      // Check if the response is plain text (not JSON) - likely a refusal or explanation
      if (!jsonText.trim().startsWith('{') && !jsonText.trim().startsWith('[')) {
        return NextResponse.json(
          { 
            error: 'Claude declined to generate workflow',
            details: 'Claude provided an explanation instead of a workflow. This might be due to safety concerns or unclear requirements.',
            claudeResponse: jsonText,
            suggestion: 'Please try rephrasing your request with more specific, legitimate use cases.'
          },
          { status: 400 }
        );
      }
      
      generatedWorkflow = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse generated workflow:', parseError);
      console.error('Raw response:', response.content);
      return NextResponse.json(
        { 
          error: 'Failed to generate valid workflow',
          details: 'Claude response could not be parsed as JSON',
          parseError: parseError instanceof Error ? parseError.message : 'Unknown parse error',
          rawResponse: response.content
        },
        { status: 500 }
      );
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

