import { db } from './client';

export interface MCPServer {
  id: string;
  name: string;
  description: string;
  url: string;
  enabled: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// List user's MCP servers
export async function listUserMCPs(userId: string): Promise<MCPServer[]> {
  const result = await db.query(`
    SELECT * FROM "mcpServer" 
    WHERE "userId" = $1 
    ORDER BY "createdAt" DESC
  `, [userId]);
  
  return result.rows;
}

// Get enabled MCP servers
export async function getEnabledMCPs(userId: string): Promise<MCPServer[]> {
  const result = await db.query(`
    SELECT * FROM "mcpServer" 
    WHERE "userId" = $1 AND enabled = true
    ORDER BY "createdAt" DESC
  `, [userId]);
  
  return result.rows;
}

// Add new MCP server
export async function addMCPServer(
  userId: string, 
  name: string, 
  description: string, 
  url: string
): Promise<MCPServer> {
  const now = new Date().toISOString();
  
  const result = await db.query(`
    INSERT INTO "mcpServer" (
      "userId", name, description, url, enabled, "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `, [userId, name, description, url, true, now, now]);
  
  return result.rows[0];
}

// Update MCP server
export async function updateMCPServer(
  id: string, 
  userId: string, 
  updates: Partial<MCPServer>
): Promise<MCPServer> {
  const now = new Date().toISOString();
  const setClause = Object.keys(updates)
    .filter(key => key !== 'id' && key !== 'userId' && key !== 'createdAt')
    .map((key, index) => `"${key}" = $${index + 3}`)
    .join(', ');
  
  const values = [id, userId, ...Object.values(updates).filter((_, index) => 
    Object.keys(updates)[index] !== 'id' && 
    Object.keys(updates)[index] !== 'userId' && 
    Object.keys(updates)[index] !== 'createdAt'
  )];
  
  const result = await db.query(`
    UPDATE "mcpServer" 
    SET ${setClause}, "updatedAt" = $${values.length + 1}
    WHERE id = $1 AND "userId" = $2
    RETURNING *
  `, [...values, now]);
  
  return result.rows[0];
}

// Delete MCP server
export async function deleteMCPServer(id: string, userId: string): Promise<void> {
  await db.query(`
    DELETE FROM "mcpServer" 
    WHERE id = $1 AND "userId" = $2
  `, [id, userId]);
}

// Toggle MCP server enabled status
export async function toggleMCPEnabled(id: string, userId: string, enabled: boolean): Promise<MCPServer> {
  const now = new Date().toISOString();
  
  const result = await db.query(`
    UPDATE "mcpServer" 
    SET enabled = $3, "updatedAt" = $4
    WHERE id = $1 AND "userId" = $2
    RETURNING *
  `, [id, userId, enabled, now]);
  
  return result.rows[0];
}

// Update connection status
export async function updateConnectionStatus(
  id: string, 
  userId: string, 
  status: 'connected' | 'disconnected' | 'error'
): Promise<MCPServer> {
  const now = new Date().toISOString();
  
  const result = await db.query(`
    UPDATE "mcpServer" 
    SET "connectionStatus" = $3, "updatedAt" = $4
    WHERE id = $1 AND "userId" = $2
    RETURNING *
  `, [id, userId, status, now]);
  
  return result.rows[0];
}

// Seed official MCP servers
export async function seedOfficialMCPs(userId: string): Promise<MCPServer[]> {
  const officialServers = [
    {
      name: 'Filesystem MCP',
      description: 'Access to local filesystem operations',
      url: 'mcp://filesystem',
    },
    {
      name: 'Web Search MCP',
      description: 'Search the web for information',
      url: 'mcp://web-search',
    },
    {
      name: 'Database MCP',
      description: 'Database operations and queries',
      url: 'mcp://database',
    }
  ];

  const results: MCPServer[] = [];
  const now = new Date().toISOString();

  for (const server of officialServers) {
    try {
      const result = await db.query(`
        INSERT INTO "mcpServer" (
          "userId", name, description, url, enabled, "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT ("userId", url) DO NOTHING
        RETURNING *
      `, [userId, server.name, server.description, server.url, true, now, now]);
      
      if (result.rows.length > 0) {
        results.push(result.rows[0]);
      }
    } catch (error) {
      console.error('Error seeding official MCP server:', error);
    }
  }

  return results;
}

// Cleanup official MCP servers
export async function cleanupOfficialMCPs(userId: string): Promise<void> {
  await db.query(`
    DELETE FROM "mcpServer" 
    WHERE "userId" = $1 AND url LIKE 'mcp://%'
  `, [userId]);
}
