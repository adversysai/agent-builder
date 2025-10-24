import { NextRequest, NextResponse } from 'next/server';
import { listApiKeys, generateApiKey, revokeApiKey } from '@/lib/database/apiKeys';

// GET /api/database/api-keys - List API keys
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    const apiKeys = await listApiKeys(userId);
    return NextResponse.json(apiKeys);
  } catch (error) {
    console.error('Error listing API keys:', error);
    return NextResponse.json({ error: 'Failed to list API keys' }, { status: 500 });
  }
}

// POST /api/database/api-keys - Generate API key
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, userId } = body;
    
    if (!name || !userId) {
      return NextResponse.json({ error: 'Name and userId are required' }, { status: 400 });
    }
    
    const apiKey = await generateApiKey(userId, name);
    return NextResponse.json(apiKey);
  } catch (error) {
    console.error('Error generating API key:', error);
    return NextResponse.json({ error: 'Failed to generate API key' }, { status: 500 });
  }
}
