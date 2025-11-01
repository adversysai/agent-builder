import { NextRequest, NextResponse } from 'next/server';
import { getServerAPIKeys } from '@/lib/api/config';

export async function POST(request: NextRequest) {
  try {
    const { query, maxResults = 5, includeAnswer = true } = await request.json();
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required and must be a string' }, { status: 400 });
    }

    const apiKeys = getServerAPIKeys();
    const tavilyApiKey = apiKeys.tavily || process.env.TAVILY_API_KEY;

    if (!tavilyApiKey) {
      return NextResponse.json({ error: 'Tavily API key not configured' }, { status: 500 });
    }

    console.log(`🔍 Performing web search for: "${query}"`);

    const tavilyResponse = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: tavilyApiKey,
        query,
        search_depth: 'advanced',
        include_answer: includeAnswer,
        max_results: maxResults,
      }),
    });

    if (!tavilyResponse.ok) {
      const errorData = await tavilyResponse.json().catch(() => ({}));
      console.error('Tavily API error:', errorData);
      return NextResponse.json({ 
        error: `Tavily API error: ${errorData.error || tavilyResponse.statusText}` 
      }, { status: tavilyResponse.status });
    }

    const data = await tavilyResponse.json();
    console.log(`✅ Web search completed for: "${query}"`);
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Web search API error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to perform web search' 
    }, { status: 500 });
  }
}