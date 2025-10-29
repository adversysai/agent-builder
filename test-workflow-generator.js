#!/usr/bin/env node

/**
 * Test script for the workflow generator with different providers
 * This script tests the workflow generation API with different model preferences
 */

const testWorkflowGeneration = async () => {
  const baseUrl = 'http://localhost:3000';
  
  const testPrompt = "Create a simple workflow that takes a URL as input and returns a summary of the webpage content.";
  
  console.log('🧪 Testing Workflow Generator with Different Providers\n');
  
  // Test with different model preferences
  const testCases = [
    { name: 'Auto Selection (Default)', env: {} },
    { name: 'OpenAI Preference', env: { WORKFLOW_GENERATOR_MODEL: 'openai' } },
    { name: 'Anthropic Preference', env: { WORKFLOW_GENERATOR_MODEL: 'anthropic' } },
    { name: 'Google Preference', env: { WORKFLOW_GENERATOR_MODEL: 'google' } },
    { name: 'Groq Preference', env: { WORKFLOW_GENERATOR_MODEL: 'groq' } },
  ];
  
  for (const testCase of testCases) {
    console.log(`\n📋 Testing: ${testCase.name}`);
    console.log('─'.repeat(50));
    
    try {
      // Set environment variables for this test
      if (testCase.env.WORKFLOW_GENERATOR_MODEL) {
        process.env.WORKFLOW_GENERATOR_MODEL = testCase.env.WORKFLOW_GENERATOR_MODEL;
      }
      
      const response = await fetch(`${baseUrl}/api/workflows/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: testPrompt,
          conversationHistory: [],
          userId: null, // Use environment API keys
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        console.log(`✅ Success! Generated workflow with ${data.workflow?.nodes?.length || 0} nodes`);
        console.log(`   Model used: ${data.model || 'Unknown'}`);
        console.log(`   Workflow name: ${data.workflow?.name || 'Unknown'}`);
      } else {
        console.log(`❌ Failed: ${data.error}`);
        console.log(`   Details: ${data.details || 'No details available'}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n🏁 Test completed!');
  console.log('\nTo test with your own API keys:');
  console.log('1. Add your API keys to .env.local');
  console.log('2. Set WORKFLOW_GENERATOR_MODEL in .env.local to your preferred model');
  console.log('3. Run: npm run dev');
  console.log('4. Try the AI Workflow Generator in the UI');
};

// Run the test
testWorkflowGeneration().catch(console.error);
