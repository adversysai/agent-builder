import { NextRequest } from 'next/server';
import { LangGraphExecutor } from '@/lib/workflow/langgraph';
import { validateApiKey, createUnauthorizedResponse } from '@/lib/api/auth';
import { getWorkflow } from '@/lib/database/workflows';

export const dynamic = 'force-dynamic';

/**
 * Re-run workflow from a specific node
 * Executes the target node and all downstream nodes, preserving upstream state
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workflowId: string }> }
) {
  // Validate API key
  const authResult = await validateApiKey(request);
  if (!authResult.authenticated) {
    return createUnauthorizedResponse(authResult.error || 'Authentication required');
  }

  const { workflowId } = await params;
  const body = await request.json();
  const { nodeId, preserveState = true } = body;

  if (!nodeId) {
    return new Response(
      JSON.stringify({ error: 'nodeId is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Create SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: string, data: any) => {
        try {
          if (controller.desiredSize === null) {
            console.warn('SSE controller is closed, skipping event:', event);
            return;
          }
          const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        } catch (error) {
          console.error('Failed to send SSE event:', error);
        }
      };

      try {
        // Get workflow from database
        const workflowDoc = await getWorkflow(workflowId);

        if (!workflowDoc) {
          sendEvent('error', {
            error: `Workflow ${workflowId} not found`,
            workflowId,
          });
          controller.close();
          return;
        }

        const workflow = {
          ...workflowDoc,
          id: workflowDoc.customId || workflowDoc.id,
        };

        // Find the target node
        const targetNode = workflow.nodes.find(n => n.id === nodeId);
        if (!targetNode) {
          sendEvent('error', {
            error: `Node ${nodeId} not found in workflow`,
            workflowId,
            nodeId,
          });
          controller.close();
          return;
        }

        // Get API keys
        const { getLLMApiKey } = await import('@/lib/api/llm-keys');
        const userId = authResult.userId;
        
        const apiKeys = {
          anthropic: (userId ? await getLLMApiKey('anthropic', userId) : undefined) || process.env.ANTHROPIC_API_KEY,
          groq: (userId ? await getLLMApiKey('groq', userId) : undefined) || process.env.GROQ_API_KEY,
          openai: (userId ? await getLLMApiKey('openai', userId) : undefined) || process.env.OPENAI_API_KEY,
          firecrawl: process.env.FIRECRAWL_API_KEY,
          arcade: process.env.ARCADE_API_KEY,
          tavily: process.env.TAVILY_API_KEY,
          github: process.env.GITHUB_TOKEN,
          google: (userId ? await getLLMApiKey('google', userId) : undefined) || process.env.GOOGLE_API_KEY,
        };

        const executionId = `exec_${Date.now()}`;

        sendEvent('workflow_started', {
          workflowId,
          workflowName: workflow.name,
          nodeId,
          executionId,
          timestamp: new Date().toISOString(),
        });

        // Create LangGraph executor with progress callback
        const nodeResults: Record<string, any> = {};
        
        const executor = new LangGraphExecutor(
          workflow as any,
          (nodeId, result) => {
            nodeResults[nodeId] = result;
            sendEvent('node_completed', {
              nodeId,
              result,
              nodeResults: { [nodeId]: result },
              executionId,
              timestamp: new Date().toISOString(),
            });
          },
          apiKeys
        );

        // Get preserved upstream node results from the request if available
        // This will be passed from the frontend with the preserved state
        const preservedNodeResults = preserveState ? (body.preservedNodeResults || {}) : {};

        // Execute from the specific node
        const executionStream = await executor.executeFromNode(
          nodeId,
          preservedNodeResults
        );

        // Stream execution results
        for await (const chunk of executionStream) {
          if (chunk.currentNodeId) {
            sendEvent('node_started', {
              nodeId: chunk.currentNodeId,
              executionId,
              timestamp: new Date().toISOString(),
            });
          }

          if (chunk.nodeResults) {
            sendEvent('node_completed', {
              nodeResults: chunk.nodeResults,
              executionId,
              timestamp: new Date().toISOString(),
            });
          }

          if (chunk.pendingAuth) {
            sendEvent('pending_auth', {
              pendingAuth: chunk.pendingAuth,
              executionId,
              timestamp: new Date().toISOString(),
            });
            controller.close();
            return;
          }
        }

        // Send completion event
        sendEvent('workflow_completed', {
          status: 'completed',
          results: nodeResults,
          executionId,
          timestamp: new Date().toISOString(),
        });

        controller.close();
      } catch (error) {
        console.error('Error re-running node:', error);
        sendEvent('error', {
          error: error instanceof Error ? error.message : 'Unknown error',
          workflowId,
          nodeId,
          timestamp: new Date().toISOString(),
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

