import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Try to import something that might cause an error
    const { validateSchedule } = await import('@/lib/scheduling/scheduler');
    return NextResponse.json({ message: 'Import test successful!' });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ 
      message: 'Import test failed', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
