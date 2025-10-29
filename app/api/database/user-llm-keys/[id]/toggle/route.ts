import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database/client';

// PATCH /api/database/user-llm-keys/[id]/toggle
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { isActive } = await request.json();
    const { id } = await params;

    if (typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'isActive must be a boolean' }, { status: 400 });
    }

    // Update the key's active status
    const result = await db.query(
      'UPDATE "userLLMKeys" SET "isActive" = $1, "updatedAt" = $2 WHERE id = $3 RETURNING id, "userId", provider',
      [isActive, new Date().toISOString(), id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Key not found' }, { status: 404 });
    }

    const key = result.rows[0];

    // If activating this key, deactivate other keys for the same provider
    if (isActive) {
      await db.query(
        'UPDATE "userLLMKeys" SET "isActive" = false WHERE "userId" = $1 AND provider = $2 AND id != $3',
        [key.userId, key.provider, id]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error toggling user LLM key:', error);
    return NextResponse.json({ error: 'Failed to toggle user LLM key' }, { status: 500 });
  }
}
