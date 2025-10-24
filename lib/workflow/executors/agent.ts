import 'server-only';
import { WorkflowNode, WorkflowState } from '../types';
import { substituteVariables } from '../variable-substitution';
import { resolveMCPServers, migrateMCPData } from '@/lib/mcp/resolver';
import { extractRateLimitInfo, getRateLimitMessage } from '../rate-limiter';
import { optimizePrompt, isPromptTooLong } from '../token-optimizer';
import { providerRateLimiter } from '../token-bucket';

/**
 * Execute Agent Node with Rate Limiting and Retry Logic
 * Server-side only - called from API routes
 */
export async function executeAgentNode(
  node: WorkflowNode,
  state: WorkflowState,
  apiKeys?: { anthropic?: string; groq?: string; openai?: string; firecrawl?: string },
  maxRetries: number = 3
): Promise<any> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Wait for rate limit token before making the request
      const provider = node.data.model?.split('/')[0] || 'anthropic';
      const hasToken = await providerRateLimiter.waitForToken(provider, 30000);
      
      if (!hasToken) {
        throw new Error('Rate limit token timeout. Please try again later.');
      }
      
      return await executeAgentNodeInternal(node, state, apiKeys);
    } catch (error) {
      lastError = error;
      
      // Check if it's a rate limit error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
        const rateLimitInfo = extractRateLimitInfo(error);
        
        // If this is the last attempt, throw the error
        if (attempt === maxRetries) {
          const message = getRateLimitMessage(rateLimitInfo);
          throw new Error(message);
        }
        
        // Wait before retrying with exponential backoff
        const retryAfter = rateLimitInfo?.retryAfter || 60;
        const backoffDelay = Math.min(retryAfter * 1000, 1000 * Math.pow(2, attempt)); // Exponential backoff, max 60s
        console.log(`Rate limited. Waiting ${Math.ceil(backoffDelay/1000)} seconds before retry ${attempt + 1}/${maxRetries}...`);
        
        // Wait for the calculated delay
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
        continue;
      }
      
      // For non-rate-limit errors, throw immediately
      throw error;
    }
  }
  
  throw lastError;
}

/**
 * Internal agent execution function
 */
async function executeAgentNodeInternal(
  node: WorkflowNode,
  state: WorkflowState,
  apiKeys?: { anthropic?: string; groq?: string; openai?: string; firecrawl?: string }
): Promise<any> {
  const { data } = node;

  try {
    // Substitute variables in instructions
    const originalInstructions = data.instructions || 'Process the input';
    const instructions = substituteVariables(originalInstructions, state);

    // Build context from previous node output
    const lastOutput = state.variables?.lastOutput;

    // Migrate data if using old format
    const migratedData = migrateMCPData(data);

    // Resolve MCP server IDs to full configurations
    let mcpTools = migratedData.mcpTools || [];
    if (migratedData.mcpServerIds && migratedData.mcpServerIds.length > 0) {
      // Fetch MCP configurations from registry
      mcpTools = await resolveMCPServers(migratedData.mcpServerIds);
    }

    // Validate API keys are provided
    if (!apiKeys) {
      throw new Error('API keys are required for server-side execution');
    }

    // Server-side execution only
    if (process.env.MOCK_AGENT_RESPONSE) {
      type MockConfig = string | Record<string, unknown>;
      let mockConfig: MockConfig = process.env.MOCK_AGENT_RESPONSE;
      try {
        mockConfig = JSON.parse(process.env.MOCK_AGENT_RESPONSE);
      } catch (e) {
        // Keep raw string if parsing fails
      }

      let mockOutput: unknown = mockConfig;
      if (mockConfig && typeof mockConfig === 'object') {
        const nodeKey = node.id;
        const nodeName = node.data.nodeName as string | undefined;
        mockOutput = mockConfig[nodeKey] ?? (nodeName ? mockConfig[nodeName] : undefined) ?? mockConfig.default ?? mockOutput;
      }

      if (mockOutput !== undefined) {
        const mockChatUpdates = data.includeChatHistory
          ? [
              { role: 'user', content: data.instructions || '' },
              { role: 'assistant', content: typeof mockOutput === 'string' ? mockOutput : JSON.stringify(mockOutput) },
            ]
          : [];

        return {
          __agentValue: mockOutput,
          __agentToolCalls: [],
          __chatHistoryUpdates: mockChatUpdates,
          __variableUpdates: { lastOutput: mockOutput },
        };
      }
    }

    // Use the already-substituted instructions from line 20
    // Don't re-process or append context if variables are already substituted
    let contextualPrompt = instructions;
    
    // Optimize prompt if it's too long to prevent rate limiting
    if (isPromptTooLong(contextualPrompt)) {
      console.log('⚠️ Prompt is very long, optimizing to prevent rate limiting...');
      contextualPrompt = optimizePrompt(contextualPrompt, 8000); // Limit to 8k tokens
    }

    // Prepare messages
    let messages = data.includeChatHistory && state.chatHistory.length > 0
      ? [
          ...state.chatHistory,
          { role: 'user' as const, content: contextualPrompt },
        ]
      : [{ role: 'user' as const, content: contextualPrompt }];

    // Apply token optimization to the entire message context
    const fullContext = messages.map(m => m.content).join('\n');
    const estimatedTokens = Math.ceil(fullContext.length / 4);
    console.log(`🔍 Token analysis: ${estimatedTokens} estimated tokens, ${fullContext.length} characters`);
    
    // Circuit breaker: If content is extremely large, force aggressive optimization
    if (estimatedTokens > 25000) {
      console.log('🚨 CIRCUIT BREAKER: Content exceeds 25k tokens, forcing ultra-aggressive optimization');
      const userMessage = messages[messages.length - 1];
      if (userMessage && userMessage.content) {
        // Force ultra-aggressive optimization
        userMessage.content = optimizePrompt(userMessage.content, 3000); // Limit to 3k tokens
        console.log(`🚨 Circuit breaker applied: Content reduced to ${userMessage.content.length} characters`);
      }
    }
    
    if (isPromptTooLong(fullContext, 15000)) { // Use 15k as threshold (leaving 15k buffer for safety)
      console.log('⚠️ Full message context is very long, optimizing to prevent rate limiting...');
      console.log(`📊 Before optimization: ${fullContext.length} characters, ~${estimatedTokens} tokens`);
      
      // Optimize the user message (which contains the main content)
      const userMessage = messages[messages.length - 1];
      if (userMessage && userMessage.content) {
        const originalLength = userMessage.content.length;
        userMessage.content = optimizePrompt(userMessage.content, 5000); // Limit user content to 5k tokens
        console.log(`✂️ Optimized user message: ${originalLength} → ${userMessage.content.length} characters`);
      }
      
      // If chat history is included, truncate it to keep only recent messages
      if (data.includeChatHistory && state.chatHistory.length > 0) {
        const recentHistory = state.chatHistory.slice(-3); // Keep only last 3 messages
        messages = [
          ...recentHistory,
          { role: 'user' as const, content: userMessage.content },
        ];
        console.log(`📝 Truncated chat history: ${state.chatHistory.length} → ${recentHistory.length} messages`);
      }
      
      const optimizedContext = messages.map(m => m.content).join('\n');
      const optimizedTokens = Math.ceil(optimizedContext.length / 4);
      console.log(`✅ After optimization: ${optimizedContext.length} characters, ~${optimizedTokens} tokens`);
    }

    // Parse model string (handle models with slashes like groq/openai/gpt-oss-120b)
    const modelString = data.model || 'anthropic/claude-sonnet-4-5-20250929';
    let provider: string;
    let modelName: string;

    if (modelString.includes('/')) {
      const firstSlashIndex = modelString.indexOf('/');
      provider = modelString.substring(0, firstSlashIndex);
      modelName = modelString.substring(firstSlashIndex + 1);
    } else {
      provider = 'openai';
      modelName = modelString;
    }

    // Use native SDKs for better MCP support
    let responseText = '';
    interface LLMUsage {
      input_tokens?: number;
      output_tokens?: number;
      total_tokens?: number;
      prompt_tokens?: number;
      completion_tokens?: number;
      [key: string]: unknown;
    }
    let usage: LLMUsage = {
      input_tokens: 0,
      output_tokens: 0,
      total_tokens: 0,
      prompt_tokens: 0,
      completion_tokens: 0,
    };
    let toolCalls: any[] = [];

    // Check if MCP tools are configured
    // mcpTools already resolved above from mcpServerIds or mcpTools
    const hasMcpTools = mcpTools.length > 0;

    if (provider === 'anthropic' && apiKeys?.anthropic) {
      // Use native Anthropic SDK for MCP support
      const Anthropic = (await import('@anthropic-ai/sdk')).default;
      const client = new Anthropic({ apiKey: apiKeys.anthropic });

      if (hasMcpTools) {
        // Separate Arcade from real MCP tools
        const arcadeTools = mcpTools.filter((mcp: any) => mcp.name?.toLowerCase().includes('arcade'));
        const realMcpTools = mcpTools.filter((mcp: any) => !mcp.name?.toLowerCase().includes('arcade'));

        if (arcadeTools.length > 0) {
          console.warn('⚠️ Arcade tools detected in MCP config - these will be skipped');
        }

        // Build MCP servers configuration
        const mcpServers = realMcpTools.map((mcp: any) => ({
          type: 'url' as const,
          url: mcp.url.includes('{FIRECRAWL_API_KEY}')
            ? mcp.url.replace('{FIRECRAWL_API_KEY}', apiKeys.firecrawl || '')
            : mcp.url,
          name: mcp.name,
          authorization_token: mcp.accessToken,
        }));

        const response = await client.beta.messages.create({
          model: modelName,
          max_tokens: 4096,
          messages: messages as any,
          mcp_servers: mcpServers as any,
          betas: ['mcp-client-2025-04-04'],
        } as any);

        // Extract text and tool information from content
        // Handle both standard tool_use and mcp_tool_use formats
        const toolUses = response.content.filter((item: any) =>
          item.type === 'tool_use' || item.type === 'mcp_tool_use'
        );
        const toolResults = response.content.filter((item: any) =>
          item.type === 'tool_result' || item.type === 'mcp_tool_result'
        );
        const textBlocks = response.content.filter((item: any) => item.type === 'text');

        responseText = textBlocks.map((item: any) => item.text).join('\n');
        usage = (response.usage as any) || {};

        // Format tool calls for logging and UI display
        toolCalls = toolUses.map((item: any, idx: number) => {
          const toolCall: any = {
            type: item.type,
            name: item.name,
            server_name: item.server_name || 'MCP',
            arguments: item.input, // Map 'input' to 'arguments' for UI compatibility
            tool_use_id: item.id,
          };

          // Include tool result if available - extract output correctly for both formats
          if (toolResults[idx]) {
            const result = toolResults[idx] as any;
            if (result.is_error) {
              toolCall.output = { error: result.content };
            } else if (Array.isArray(result.content)) {
              toolCall.output = result.content[0]?.text || result.content;
            } else {
              toolCall.output = result.content;
            }
          }

          return toolCall;
        });
      } else {
        // Regular Anthropic call without MCP
        const response = await client.messages.create({
          model: modelName,
          max_tokens: 4096,
          messages: messages as any,
        });

        responseText = response.content[0].type === 'text' ? response.content[0].text : '';
        usage = (response.usage as any) || {};
      }
    } else if (provider === 'openai' && apiKeys?.openai) {
      const hasMcpTools = mcpTools && mcpTools.length > 0;

      if (hasMcpTools) {
        // Use native OpenAI SDK for function calling
        const OpenAI = (await import('openai')).default;
        const client = new OpenAI({ apiKey: apiKeys.openai });

        // Convert MCP tools to OpenAI function format
        const tools = mcpTools.map((mcp: any) => ({
          type: "function" as const,
          function: {
            name: mcp.name || mcp.toolName || 'unknown_tool',
            description: mcp.description || 'No description',
            parameters: {
              type: "object",
              properties: mcp.schema?.properties || {},
              required: mcp.schema?.required || []
            }
          }
        }));

        // First call with tools
        const response = await client.chat.completions.create({
          model: modelName,
          messages: messages as any,
          tools,
          tool_choice: "auto"
        });

        const message = response.choices[0].message;
        usage = (response.usage as unknown as LLMUsage) || ({} as LLMUsage);

        // Handle tool calls
        if (message.tool_calls && message.tool_calls.length > 0) {
          // Execute MCP tools
          const toolResults = await Promise.all(
            message.tool_calls.map(async (call: any) => {
              try {
                // Find the MCP server for this tool
                const mcpServer = mcpTools.find((m: any) =>
                  (m.name || m.toolName) === call.function.name
                );

                if (!mcpServer) {
                  throw new Error(`MCP server not found for tool: ${call.function.name}`);
                }

                // Parse arguments
                const args = JSON.parse(call.function.arguments);

                // Call MCP tool via HTTP
                const mcpResponse = await fetch(mcpServer.url, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    ...(mcpServer.authToken && { 'Authorization': `Bearer ${mcpServer.authToken}` })
                  },
                  body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: Date.now(),
                    method: 'tools/call',
                    params: {
                      name: call.function.name,
                      arguments: args
                    }
                  })
                });

                const result = await mcpResponse.json();
                return {
                  tool_call_id: call.id,
                  role: "tool" as const,
                  content: JSON.stringify(result.result || result)
                };
              } catch (error) {
                return {
                  tool_call_id: call.id,
                  role: "tool" as const,
                  content: JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' })
                };
              }
            })
          );

          // Second call with tool results
          const finalResponse = await client.chat.completions.create({
            model: modelName,
            messages: [
              ...messages as any,
              message,
              ...toolResults
            ]
          });

          responseText = finalResponse.choices[0].message.content || '';
          usage = {
            ...usage,
            prompt_tokens: (usage.prompt_tokens || 0) + (finalResponse.usage?.prompt_tokens || 0),
            completion_tokens: (usage.completion_tokens || 0) + (finalResponse.usage?.completion_tokens || 0),
            total_tokens: (usage.total_tokens || 0) + (finalResponse.usage?.total_tokens || 0),
          };

          // Track tool calls
          toolCalls = message.tool_calls.map((call: any, idx) => ({
            id: call.id,
            name: call.function.name,
            arguments: JSON.parse(call.function.arguments),
            output: toolResults[idx] ? JSON.parse(toolResults[idx].content) : null
          }));
        } else {
          responseText = message.content || '';
        }
      } else {
        // Regular OpenAI call without MCP tools
        const { ChatOpenAI } = await import('@langchain/openai');
        const model = new ChatOpenAI({
          apiKey: apiKeys.openai,
          model: modelName,
        });

        const response = await model.invoke(messages);
        responseText = response.content as string;
        usage = response.response_metadata?.usage || {};
      }
    } else if (provider === 'groq' && apiKeys?.groq) {
      const hasMcpTools = mcpTools && mcpTools.length > 0;

      if (hasMcpTools) {
        // Use Groq Responses API for MCP support
        const OpenAI = (await import('openai')).default;
        const client = new OpenAI({
          apiKey: apiKeys.groq,
          baseURL: 'https://api.groq.com/openai/v1',
        });

        // Convert MCP tools to Groq Responses API format
        const tools = mcpTools.map((mcp: any) => ({
          type: "mcp" as const,
          server_label: mcp.name || mcp.toolName || 'unknown_tool',
          server_url: mcp.url,
        }));

        // Use Responses API endpoint for MCP support
        const response = await client.responses.create({
          model: modelName,
          input: messages[messages.length - 1].content as string,
          tools,
        } as any);

        responseText = (response as any).output_text || '';
        usage = (response as any).usage || {};

        // Track tool calls if available
        const outputs = (response as any).output || [];
        toolCalls = outputs
          .filter((o: any) => o.type === 'tool_use')
          .map((o: any) => ({
            id: o.id,
            name: o.name,
            arguments: o.input,
            output: null,
          }));
      } else {
        // Regular Groq chat completions for non-MCP calls
        const { ChatOpenAI } = await import('@langchain/openai');
        const model = new ChatOpenAI({
          apiKey: apiKeys.groq,
          model: modelName,
          configuration: {
            baseURL: 'https://api.groq.com/openai/v1',
          },
        });

        const response = await model.invoke(messages);
        responseText = response.content as string;
        usage = response.response_metadata?.usage || {};
      }
    } else {
      throw new Error(`No API key available for provider: ${provider}`);
    }

    // Prepare chat history updates (IMMUTABLE - don't mutate state)
    const serverChatUpdates = data.includeChatHistory
      ? [
          { role: 'user', content: data.instructions || '' },
          { role: 'assistant', content: responseText },
        ]
      : [];

    let output: unknown = responseText;
    if (data.outputFormat === 'JSON') {
      try {
        output = JSON.parse(responseText);
      } catch (e) {
        console.warn('Could not parse JSON output, using raw text');
      }
    }

    // Return immutable updates (don't mutate state)
    return {
      __agentValue: output,
      __agentToolCalls: toolCalls,
      __chatHistoryUpdates: serverChatUpdates,
      __variableUpdates: { lastOutput: output },
    };
  } catch (error) {
    console.error('Agent execution error:', error);

    // User-friendly error messages
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('API key') || errorMessage.includes('api_key')) {
      throw new Error('Missing API key. Please add your LLM provider key in Settings.');
    }

    if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
      const rateLimitInfo = extractRateLimitInfo(error);
      const message = getRateLimitMessage(rateLimitInfo);
      throw new Error(message);
    }

    if (errorMessage.includes('No API key available')) {
      throw new Error('No API key configured. Please add an Anthropic, OpenAI, or Groq API key in your .env.local file.');
    }

    throw new Error(`Agent execution failed: ${errorMessage}`);
  }
}

