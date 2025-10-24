import { db } from './client';

export interface ApiKey {
  id: string;
  key: string;
  keyPrefix: string;
  userId: string;
  name: string;
  usageCount: number;
  createdAt: string;
  revokedAt?: string;
}

// Generate secure random token
function generateSecureToken(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Simple hash function
function hashKey(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return 'hash_' + Math.abs(hash).toString(36) + '_' + key.length;
}

// Generate new API key
export async function generateApiKey(userId: string, name: string) {
  const key = `sk_live_${generateSecureToken(32)}`;
  const keyHash = hashKey(key);
  const keyPrefix = key.substring(0, 15) + '...';
  const now = new Date().toISOString();

  const result = await db.query(`
    INSERT INTO "userApiKeys" (key, "keyPrefix", "userId", name, "usageCount", "createdAt")
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `, [keyHash, keyPrefix, userId, name, 0, now]);

  return {
    id: result.rows[0].id,
    key, // Only time user sees this!
    keyPrefix,
    name,
  };
}

// List user's API keys
export async function listApiKeys(userId: string) {
  const result = await db.query(`
    SELECT * FROM "userApiKeys" 
    WHERE "userId" = $1 AND "revokedAt" IS NULL 
    ORDER BY "createdAt" DESC
  `, [userId]);
  return result.rows;
}

// Revoke API key
export async function revokeApiKey(id: string, userId: string) {
  const result = await db.query(`
    UPDATE "userApiKeys" 
    SET "revokedAt" = $1
    WHERE id = $2 AND "userId" = $3
    RETURNING *
  `, [new Date().toISOString(), id, userId]);
  
  if (result.rows.length === 0) {
    throw new Error('API key not found or unauthorized');
  }
  
  return { success: true };
}

// Verify API key
export async function verifyApiKey(key: string) {
  const keyHash = hashKey(key);
  
  const result = await db.query(`
    SELECT * FROM "userApiKeys" 
    WHERE key = $1 AND "revokedAt" IS NULL
  `, [keyHash]);
  
  const apiKey = result.rows[0];
  
  if (!apiKey) {
    return { valid: false, error: 'Invalid API key' };
  }
  
  // Update usage stats
  await db.query(`
    UPDATE "userApiKeys" 
    SET "lastUsedAt" = $1, "usageCount" = "usageCount" + 1
    WHERE id = $2
  `, [new Date().toISOString(), apiKey.id]);
  
  return {
    valid: true,
    userId: apiKey.userId,
  };
}
