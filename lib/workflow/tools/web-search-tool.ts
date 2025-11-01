export const webSearchTool = {
  type: "function" as const,
  function: {
    name: "web_search",
    description: "Search the web for real-time information using Tavily API. Use this when the user asks about current events, specific websites, companies, or any information that requires up-to-date web data.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query to find relevant information on the web"
        },
        maxResults: {
          type: "number",
          description: "Maximum number of search results to return (default: 5)",
          default: 5
        },
        includeAnswer: {
          type: "boolean",
          description: "Whether to include a direct answer in the search results (default: true)",
          default: true
        }
      },
      required: ["query"]
    }
  }
};

export const webSearchToolHandler = async (args: {
  query: string;
  maxResults?: number;
  includeAnswer?: boolean;
}) => {
  try {
    // Use absolute URL for server-side requests
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/web-search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: args.query,
        maxResults: args.maxResults || 5,
        includeAnswer: args.includeAnswer !== false
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Web search failed: ${errorData.error || response.statusText}`);
    }

    const results = await response.json();
    return results;
  } catch (error) {
    console.error('Web search tool error:', error);
    throw error;
  }
};

// Server-side direct Tavily call (bypasses internal /api/web-search)
export const webSearchDirect = async (args: {
  query: string;
  maxResults?: number;
  includeAnswer?: boolean;
}) => {
  const { getServerAPIKeys } = await import('@/lib/api/config');
  const apiKeys = getServerAPIKeys();
  const tavilyApiKey = apiKeys.tavily || process.env.TAVILY_API_KEY;

  if (!tavilyApiKey) {
    throw new Error('Tavily API key not configured');
  }

  const tavilyResponse = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: tavilyApiKey,
      query: args.query,
      search_depth: 'advanced',
      include_answer: args.includeAnswer !== false,
      max_results: args.maxResults || 5,
    }),
  });

  if (!tavilyResponse.ok) {
    const errorData = await tavilyResponse.json().catch(() => ({}));
    throw new Error(`Tavily API error: ${errorData.error || tavilyResponse.statusText}`);
  }

  return await tavilyResponse.json();
};
