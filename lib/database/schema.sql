-- Create missing tables for Open Agent Builder

-- Create mcpServer table
CREATE TABLE IF NOT EXISTS "mcpServer" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  "connectionStatus" TEXT DEFAULT 'disconnected',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create userApiKeys table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS "userApiKeys" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  name TEXT NOT NULL,
  "keyPrefix" TEXT NOT NULL,
  key TEXT NOT NULL,
  "usageCount" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "revokedAt" TIMESTAMP WITH TIME ZONE
);

-- Create userLLMKeys table
CREATE TABLE IF NOT EXISTS "userLLMKeys" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  provider TEXT NOT NULL,
  "apiKey" TEXT NOT NULL,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to existing tables
-- Add customId column to workflow table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'workflow' AND column_name = 'customId') THEN
    ALTER TABLE workflow ADD COLUMN "customId" TEXT UNIQUE;
  END IF;
END $$;

-- Add revokedAt column to userApiKeys if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'userApiKeys' AND column_name = 'revokedAt') THEN
    ALTER TABLE "userApiKeys" ADD COLUMN "revokedAt" TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mcpServer_userId ON "mcpServer"("userId");
CREATE INDEX IF NOT EXISTS idx_mcpServer_enabled ON "mcpServer"(enabled);
CREATE INDEX IF NOT EXISTS idx_userApiKeys_userId ON "userApiKeys"("userId");
CREATE INDEX IF NOT EXISTS idx_userLLMKeys_userId ON "userLLMKeys"("userId");
CREATE INDEX IF NOT EXISTS idx_workflow_customId ON workflow("customId");
