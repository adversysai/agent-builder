import { NextResponse } from 'next/server';
import { runMigrations } from '@/lib/database/migrate';

// POST /api/database/migrate - Run database migrations
export async function POST() {
  try {
    console.log('🚀 Starting database migration...');
    const success = await runMigrations();
    
    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Database migrations completed successfully!' 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Migration failed' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
