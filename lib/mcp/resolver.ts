/**
 * MCP Resolver
 * Fetches MCP configurations from database at runtime
 * This ensures executors always use the latest configuration
 */

import { db } from "@/lib/database/client";

/**
 * Resolve multiple MCP server IDs to their full configurations
 */
export async function resolveMCPServers(serverIds: string[]): Promise<any[]> {
  if (!serverIds || serverIds.length === 0) {
    return [];
  }

  // Handle legacy format (full config objects instead of IDs)
  if (typeof serverIds[0] === 'object') {
    return serverIds as any[];
  }

  try {
    const result = await db.query(
      'SELECT * FROM "mcpServer" WHERE id = ANY($1)',
      [serverIds]
    );

    // Transform to the format expected by executors
    return result.rows.map(server => ({
      name: server.name,
      url: server.url,
      description: server.description,
      authType: server.authType,
      accessToken: server.accessToken,
      availableTools: server.tools || [],
      headers: server.headers,
    }));
  } catch (error) {
    console.error('Error resolving MCP servers:', error);
    return [];
  }
}

/**
 * Resolve a single MCP server ID to its configuration
 */
export async function resolveMCPServer(serverId: string): Promise<any | null> {
  if (!serverId) {
    return null;
  }

  try {
    const result = await db.query(
      'SELECT * FROM "mcpServer" WHERE id = $1',
      [serverId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const server = result.rows[0];
    return {
      name: server.name,
      url: server.url,
      description: server.description,
      authType: server.authType,
      accessToken: server.accessToken,
      availableTools: server.tools || [],
      headers: server.headers,
    };
  } catch (error) {
    console.error('Error resolving MCP server:', error);
    return null;
  }
}

/**
 * Get all available MCP servers for a user
 */
export async function getAllMCPServers(userId: string): Promise<any[]> {
  try {
    const result = await db.query(
      'SELECT * FROM "mcpServer" WHERE "userId" = $1 AND enabled = true',
      [userId]
    );

    return result.rows.map(server => ({
      name: server.name,
      url: server.url,
      description: server.description,
      authType: server.authType,
      accessToken: server.accessToken,
      availableTools: server.tools || [],
      headers: server.headers,
    }));
  } catch (error) {
    console.error('Error getting MCP servers:', error);
    return [];
  }
}

/**
 * Migrate MCP data from old format to new format
 * Handles backward compatibility for different MCP data structures
 */
export function migrateMCPData(data: any): any {
  if (!data) return data;

  const migrated = { ...data };

  // Handle legacy mcpTools format
  if (migrated.mcpTools && Array.isArray(migrated.mcpTools)) {
    // Check if it's already in the new format (has server IDs)
    const hasServerIds = migrated.mcpTools.some((tool: any) => typeof tool === 'string');
    
    if (hasServerIds) {
      // Convert server IDs to mcpServerIds
      migrated.mcpServerIds = migrated.mcpTools;
      delete migrated.mcpTools;
    }
  }

  // Handle legacy tools format (convert to mcpServerIds if needed)
  if (migrated.tools && Array.isArray(migrated.tools)) {
    // Check if tools are server IDs or full configurations
    const isServerIds = migrated.tools.every((tool: any) => typeof tool === 'string');
    
    if (isServerIds) {
      migrated.mcpServerIds = migrated.tools;
      delete migrated.tools;
    }
  }

  // Ensure mcpServerIds is an array
  if (migrated.mcpServerIds && !Array.isArray(migrated.mcpServerIds)) {
    migrated.mcpServerIds = [migrated.mcpServerIds];
  }

  return migrated;
}