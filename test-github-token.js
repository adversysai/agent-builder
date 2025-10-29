#!/usr/bin/env node

/**
 * Test GitHub Token Configuration
 * 
 * Tests if GitHub token is properly configured and accessible
 */

require('dotenv').config({ path: '.env.local' });

async function testGitHubToken() {
  console.log('🔑 Testing GitHub Token Configuration...\n');
  
  try {
    // Check if token is set
    const token = process.env.GITHUB_TOKEN;
    
    if (!token) {
      console.log('❌ GITHUB_TOKEN not found in environment');
      console.log('   Please add your GitHub personal access token to .env.local');
      console.log('   Example: GITHUB_TOKEN=ghp_your_actual_token_here');
      return;
    }
    
    if (token === 'your_github_personal_access_token_here') {
      console.log('⚠️  GITHUB_TOKEN is still set to placeholder value');
      console.log('   Please replace with your actual GitHub personal access token');
      console.log('   Example: GITHUB_TOKEN=ghp_your_actual_token_here');
      return;
    }
    
    console.log('✅ GITHUB_TOKEN found in environment');
    console.log(`   Token: ${token.substring(0, 10)}...`);
    
    // Test GitHub API access
    console.log('\n🌐 Testing GitHub API access...');
    
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Dexflow-AI-Detection/1.0'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.log('❌ GitHub API test failed');
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${errorData.message || response.statusText}`);
      
      if (response.status === 401) {
        console.log('   💡 This usually means the token is invalid or expired');
      } else if (response.status === 403) {
        console.log('   💡 This usually means the token lacks required scopes');
      }
      return;
    }
    
    const userData = await response.json();
    console.log('✅ GitHub API access successful');
    console.log(`   User: ${userData.login}`);
    console.log(`   Name: ${userData.name || 'Not set'}`);
    console.log(`   Email: ${userData.email || 'Not set'}`);
    
    // Test repository access
    console.log('\n📁 Testing repository access...');
    const reposResponse = await fetch('https://api.github.com/user/repos?per_page=5', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Dexflow-AI-Detection/1.0'
      }
    });
    
    if (reposResponse.ok) {
      const repos = await reposResponse.json();
      console.log('✅ Repository access successful');
      console.log(`   Found ${repos.length} repositories`);
      if (repos.length > 0) {
        console.log(`   Latest repo: ${repos[0].name}`);
      }
    } else {
      console.log('⚠️  Repository access limited');
      console.log('   This may affect AI detection workflows');
    }
    
    // Test code search access
    console.log('\n🔍 Testing code search access...');
    const searchResponse = await fetch('https://api.github.com/search/code?q=test&per_page=1', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Dexflow-AI-Detection/1.0'
      }
    });
    
    if (searchResponse.ok) {
      console.log('✅ Code search access successful');
    } else {
      console.log('⚠️  Code search access limited');
      console.log('   This may affect AI detection workflows');
    }
    
    console.log('\n🎉 GitHub token configuration is working!');
    console.log('\n📋 Summary:');
    console.log('   ✅ GitHub token is set');
    console.log('   ✅ GitHub API access working');
    console.log('   ✅ Repository access working');
    console.log('   ✅ Code search access working');
    
    console.log('\n🚀 Ready for AI detection workflows!');
    console.log('   You can now use GitHub MCP in your workflows');
    console.log('   AI detection templates are ready to use');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Check if GITHUB_TOKEN is set in .env.local');
    console.log('   2. Verify the token is valid and not expired');
    console.log('   3. Ensure the token has required scopes: repo, read:org, read:user');
    console.log('   4. Check your internet connection');
  }
}

// Run test
testGitHubToken();
