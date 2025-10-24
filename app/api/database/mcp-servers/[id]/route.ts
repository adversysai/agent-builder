import { NextRequest, NextResponse } from 'next/server';
import { 
  updateMCPServer, 
  deleteMCPServer, 
  toggleMCPEnabled, 
  updateConnectionStatus 
} from '@/lib/database/mcpServers';

// PUT /api/database/mcp-servers/[id] - Update MCP server
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { userId, ...updates } = body;
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    const server = await updateMCPServer(id, userId, updates);
    return NextResponse.json(server);
  } catch (error) {
    console.error('Error updating MCP server:', error);
    return NextResponse.json({ error: 'Failed to update MCP server' }, { status: 500 });
  }
}

// DELETE /api/database/mcp-servers/[id] - Delete MCP server
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    await deleteMCPServer(id, userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting MCP server:', error);
    return NextResponse.json({ error: 'Failed to delete MCP server' }, { status: 500 });
  }
}

// PATCH /api/database/mcp-servers/[id] - Toggle enabled status or update connection status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { userId, action, enabled, status } = body;
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    let server;
    
    if (action === 'toggle') {
      server = await toggleMCPEnabled(id, userId, enabled);
    } else if (action === 'connection') {
      server = await updateConnectionStatus(id, userId, status);
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    
    return NextResponse.json(server);
  } catch (error) {
    console.error('Error updating MCP server:', error);
    return NextResponse.json({ error: 'Failed to update MCP server' }, { status: 500 });
  }
}
