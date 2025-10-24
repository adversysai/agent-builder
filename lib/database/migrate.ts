import { db } from './client';
import fs from 'fs';
import path from 'path';

export async function runMigrations() {
  try {
    console.log('🔄 Running database migrations...');
    
    // Read the schema SQL file
    const schemaPath = path.join(process.cwd(), 'lib/database/schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await db.query(statement);
          console.log('✅ Executed:', statement.substring(0, 50) + '...');
        } catch (error) {
          // Ignore errors for statements that might already exist
          if (error instanceof Error && error.message.includes('already exists')) {
            console.log('⚠️  Skipped (already exists):', statement.substring(0, 50) + '...');
          } else {
            console.error('❌ Error executing statement:', error);
            throw error;
          }
        }
      }
    }
    
    console.log('✅ Database migrations completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return false;
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations()
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
