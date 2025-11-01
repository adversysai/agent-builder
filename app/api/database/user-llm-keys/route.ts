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

    // Get user's LLM keys - handle missing columns gracefully
    // First check if usageCount and lastUsedAt columns exist
    let result;
    try {
      result = await db.query(
        'SELECT id, "userId", provider, "isActive", "createdAt", "updatedAt", COALESCE("usageCount", 0) as "usageCount", "lastUsedAt" FROM "userLLMKeys" WHERE "userId" = $1 ORDER BY "createdAt" DESC',
        [userId]
      );
    } catch (error: any) {
      // If columns don't exist, select without them
      if (error?.code === '42703' && (error?.message?.includes('usageCount') || error?.message?.includes('lastUsedAt'))) {
        console.log('⚠️ usageCount/lastUsedAt columns missing, using fallback query');
        result = await db.query(
          'SELECT id, "userId", provider, "isActive", "createdAt", "updatedAt" FROM "userLLMKeys" WHERE "userId" = $1 ORDER BY "createdAt" DESC',
          [userId]
        );
        // Add default values for missing columns
        result.rows.forEach(row => {
          row.usageCount = 0;
          row.lastUsedAt = null;
        });
      } else {
        throw error;
      }
    }

    const userLLMKeys = result.rows.map(row => ({
      id: row.id,
      userId: row.userId,
      provider: row.provider,
      key: `${row.provider} key`, // derive display label client-side to avoid schema drift
      active: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      usageCount: row.usageCount || 0,
      lastUsedAt: row.lastUsedAt || null,
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
    const { userId, provider, apiKey } = await request.json();

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
        'UPDATE "userLLMKeys" SET "isActive" = true, "updatedAt" = $1 WHERE "userId" = $2 AND provider = $3',
        [now, userId, provider]
      );

      // Deactivate other keys for this provider
      await db.query(
        'UPDATE "userLLMKeys" SET "isActive" = false WHERE "userId" = $1 AND provider = $2 AND id != $3',
        [userId, provider, existingKey.rows[0].id]
      );

      return NextResponse.json({ id: existingKey.rows[0].id, success: true });
    } else {
      // Create new key - handle missing usageCount column gracefully
      let result;
      try {
        result = await db.query(
          'INSERT INTO "userLLMKeys" ("userId", provider, "isActive", "createdAt", "updatedAt", "usageCount") VALUES ($1, $2, true, $3, $4, 0) RETURNING id',
          [userId, provider, now, now]
        );
      } catch (error: any) {
        // If usageCount column doesn't exist, insert without it
        if (error?.code === '42703' && error?.message?.includes('usageCount')) {
          console.log('⚠️ usageCount column missing, inserting without it');
          result = await db.query(
            'INSERT INTO "userLLMKeys" ("userId", provider, "isActive", "createdAt", "updatedAt") VALUES ($1, $2, true, $3, $4) RETURNING id',
            [userId, provider, now, now]
          );
        } else {
          throw error;
        }
      }

      return NextResponse.json({ id: result.rows[0].id, success: true });
    }
  } catch (error) {
    console.error('Error upserting user LLM key:', error);
    return NextResponse.json({ error: 'Failed to save user LLM key' }, { status: 500 });
  }
}
