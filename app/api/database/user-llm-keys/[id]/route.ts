import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database/client';

// DELETE /api/database/user-llm-keys/[id]?userId=xxx
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Delete the key
    const result = await db.query(
      'DELETE FROM "userLLMKeys" WHERE id = $1 AND "userId" = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Key not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user LLM key:', error);
    return NextResponse.json({ error: 'Failed to delete user LLM key' }, { status: 500 });
  }
}
