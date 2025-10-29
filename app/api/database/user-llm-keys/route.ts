import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database/client';
import { auth } from '@clerk/nextjs/server';

// GET /api/database/user-llm-keys?userId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get user's LLM keys - first check what columns exist
    const result = await db.query(
      'SELECT id, "userId", provider, label, "isActive", "createdAt", "updatedAt", "lastUsedAt", "usageCount" FROM "userLLMKeys" WHERE "userId" = $1 ORDER BY "createdAt" DESC',
      [userId]
    );

    const userLLMKeys = result.rows.map(row => ({
      id: row.id,
      userId: row.userId,
      provider: row.provider,
      key: row.label || `${row.provider} key`, // Use label as display key
      active: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      lastUsedAt: row.lastUsedAt,
      usageCount: row.usageCount || 0,
    }));

    return NextResponse.json(userLLMKeys);
  } catch (error) {
    console.error('Error fetching user LLM keys:', error);
    return NextResponse.json({ error: 'Failed to fetch user LLM keys' }, { status: 500 });
  }
}

// POST /api/database/user-llm-keys
export async function POST(request: NextRequest) {
  try {
    const { userId, provider, apiKey, label } = await request.json();

    if (!userId || !provider || !apiKey) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate provider
    const validProviders = ['anthropic', 'openai', 'groq', 'google'];
    if (!validProviders.includes(provider)) {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }

    // Check if user already has a key for this provider
    const existingKey = await db.query(
      'SELECT id FROM "userLLMKeys" WHERE "userId" = $1 AND provider = $2',
      [userId, provider]
    );

    const now = new Date().toISOString();

    if (existingKey.rows.length > 0) {
      // Update existing key
      await db.query(
        'UPDATE "userLLMKeys" SET label = $1, "isActive" = true, "updatedAt" = $2 WHERE "userId" = $3 AND provider = $4',
        [label || `${provider} key`, now, userId, provider]
      );

      // Deactivate other keys for this provider
      await db.query(
        'UPDATE "userLLMKeys" SET "isActive" = false WHERE "userId" = $1 AND provider = $2 AND id != $3',
        [userId, provider, existingKey.rows[0].id]
      );

      return NextResponse.json({ id: existingKey.rows[0].id, success: true });
    } else {
      // Create new key
      const result = await db.query(
        'INSERT INTO "userLLMKeys" ("userId", provider, label, "isActive", "createdAt", "updatedAt", "usageCount") VALUES ($1, $2, $3, true, $4, $5, 0) RETURNING id',
        [userId, provider, label || `${provider} key`, now, now]
      );

      return NextResponse.json({ id: result.rows[0].id, success: true });
    }
  } catch (error) {
    console.error('Error upserting user LLM key:', error);
    return NextResponse.json({ error: 'Failed to save user LLM key' }, { status: 500 });
  }
}
