import { NextRequest, NextResponse } from 'next/server';
import { 
  listUserMCPs, 
  addMCPServer, 
  seedOfficialMCPs, 
  cleanupOfficialMCPs 
} from '@/lib/database/mcpServers';

// GET /api/database/mcp-servers - List user's MCP servers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    const servers = await listUserMCPs(userId);
    return NextResponse.json(servers);
  } catch (error) {
    console.error('Error listing MCP servers:', error);
    return NextResponse.json({ error: 'Failed to list MCP servers' }, { status: 500 });
  }
}

// POST /api/database/mcp-servers - Add MCP server or seed official servers
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, name, description, url } = body;
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    if (action === 'seed') {
      const servers = await seedOfficialMCPs(userId);
      return NextResponse.json(servers);
    } else if (action === 'add') {
      if (!name || !url) {
        return NextResponse.json({ error: 'Name and URL are required' }, { status: 400 });
      }
      
      const server = await addMCPServer(userId, name, description || '', url);
      return NextResponse.json(server);
    } else if (action === 'cleanup') {
      await cleanupOfficialMCPs(userId);
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error handling MCP server request:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
