import { NextResponse } from 'next/server';
import { db } from '@/lib/database/client';

export async function GET() {
  try {
    // Test database connection
    const result = await db.query('SELECT NOW() as current_time');
    return NextResponse.json({ 
      success: true, 
      message: 'Database connection successful',
      timestamp: result.rows[0].current_time 
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
