import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Test basic functionality
    return NextResponse.json({ message: 'Import test successful!' });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ 
      message: 'Import test failed', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
