import { db } from './client';

export async function runSimpleMigrations() {
  try {
    console.log('🔄 Running simple database migrations...');
    
    // Create mcpServer table
    await db.query(`
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
      )
    `);
    console.log('✅ Created mcpServer table');

    // Create userApiKeys table
    await db.query(`
      CREATE TABLE IF NOT EXISTS "userApiKeys" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "userId" TEXT NOT NULL,
        name TEXT NOT NULL,
        "keyPrefix" TEXT NOT NULL,
        key TEXT NOT NULL,
        "usageCount" INTEGER DEFAULT 0,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "revokedAt" TIMESTAMP WITH TIME ZONE
      )
    `);
    console.log('✅ Created userApiKeys table');

    // Create userLLMKeys table
    await db.query(`
      CREATE TABLE IF NOT EXISTS "userLLMKeys" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "userId" TEXT NOT NULL,
        provider TEXT NOT NULL,
        "apiKey" TEXT NOT NULL,
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log('✅ Created userLLMKeys table');

    // Add customId column to workflow table if it doesn't exist
    try {
      await db.query(`
        ALTER TABLE workflow ADD COLUMN "customId" TEXT UNIQUE
      `);
      console.log('✅ Added customId column to workflow table');
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) {
        console.log('⚠️  customId column already exists in workflow table');
      } else {
        throw error;
      }
    }

    // Add revokedAt column to userApiKeys if it doesn't exist
    try {
      await db.query(`
        ALTER TABLE "userApiKeys" ADD COLUMN "revokedAt" TIMESTAMP WITH TIME ZONE
      `);
      console.log('✅ Added revokedAt column to userApiKeys table');
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) {
        console.log('⚠️  revokedAt column already exists in userApiKeys table');
      } else {
        throw error;
      }
    }

    // Create indexes
    await db.query(`CREATE INDEX IF NOT EXISTS idx_mcpServer_userId ON "mcpServer"("userId")`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_mcpServer_enabled ON "mcpServer"(enabled)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_userApiKeys_userId ON "userApiKeys"("userId")`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_userLLMKeys_userId ON "userLLMKeys"("userId")`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_workflow_customId ON workflow("customId")`);
    console.log('✅ Created indexes');

    console.log('✅ All migrations completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return false;
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runSimpleMigrations()
    .then(success => {
      if (success) {
        console.log('🎉 All migrations completed!');
        process.exit(0);
      } else {
        console.error('💥 Migration failed!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Migration error:', error);
      process.exit(1);
    });
}
