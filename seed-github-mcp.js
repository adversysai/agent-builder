#!/usr/bin/env node

/**
 * Seed GitHub MCP to Database
 * 
 * Adds GitHub MCP server to the database for existing users
 */

const { execSync } = require('child_process');

async function seedGitHubMCP() {
  console.log('🌱 Seeding GitHub MCP to database...\n');
  
  try {
    // Check if GitHub MCP already exists
    console.log('1. Checking existing GitHub MCP...');
    const existingCheck = execSync('curl -s "http://localhost:3000/api/database/mcp-servers?userId=system-templates"', { encoding: 'utf8' });
    const existing = JSON.parse(existingCheck);
    const githubExists = existing.some(mcp => mcp.name === 'GitHub');
    
    if (githubExists) {
      console.log('   ✅ GitHub MCP already exists in database');
      return;
    }
    
    console.log('   📋 GitHub MCP not found, proceeding with seeding...');
    
    // Add GitHub MCP to database
    console.log('\n2. Adding GitHub MCP to database...');
    const addGitHubMCP = execSync(`curl -s -X POST "http://localhost:3000/api/database/mcp-servers" \
      -H "Content-Type: application/json" \
      -d '{
        "action": "add",
        "userId": "system-templates",
        "name": "GitHub",
        "description": "GitHub repository management, code search, and security analysis",
        "url": "https://api.github.com",
        "category": "productivity",
        "authType": "api-key",
        "tools": ["search_code", "list_repositories", "get_repository_content", "list_global_security_advisories", "list_repository_security_advisories", "create_issue", "add_issue_comment"],
        "enabled": true,
        "isOfficial": true
      }'`, { encoding: 'utf8' });
    
    const result = JSON.parse(addGitHubMCP);
    console.log('   ✅ GitHub MCP added to database');
    console.log('   📋 Result:', result);
    
    // Verify addition
    console.log('\n3. Verifying GitHub MCP addition...');
    const verifyCheck = execSync('curl -s "http://localhost:3000/api/database/mcp-servers?userId=system-templates"', { encoding: 'utf8' });
    const verify = JSON.parse(verifyCheck);
    const githubAdded = verify.find(mcp => mcp.name === 'GitHub');
    
    if (githubAdded) {
      console.log('   ✅ GitHub MCP successfully added and verified');
      console.log('   📋 GitHub MCP Details:');
      console.log(`      - ID: ${githubAdded.id}`);
      console.log(`      - Name: ${githubAdded.name}`);
      console.log(`      - Category: ${githubAdded.category}`);
      console.log(`      - Tools: ${githubAdded.tools.length} available`);
      console.log(`      - Status: ${githubAdded.enabled ? 'Enabled' : 'Disabled'}`);
    } else {
      console.log('   ❌ GitHub MCP not found after addition');
      throw new Error('GitHub MCP addition failed');
    }
    
    console.log('\n🎉 GitHub MCP seeding completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ GitHub MCP added to database');
    console.log('   ✅ Available in Settings panel');
    console.log('   ✅ Available in workflow canvas');
    console.log('   ✅ AI detection templates ready');
    
    console.log('\n🚀 Next Steps:');
    console.log('   1. Set GITHUB_TOKEN in your .env.local file');
    console.log('   2. GitHub MCP will appear in Settings panel');
    console.log('   3. AI detection templates available in workflow canvas');
    console.log('   4. Test with AI detection workflows');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

// Run seeding
seedGitHubMCP();
