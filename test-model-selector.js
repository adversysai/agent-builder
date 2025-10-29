#!/usr/bin/env node

/**
 * Test script for the model selector in AI Workflow Generator
 * This script tests the workflow generation API with different model preferences
 */

const testModelSelector = async () => {
  const baseUrl = 'http://localhost:3000';
  
  const testPrompt = "Create a simple workflow that takes a URL as input and returns a summary of the webpage content.";
  
  console.log('🧪 Testing Model Selector in AI Workflow Generator\n');
  
  // Test with different model preferences
  const testCases = [
    { name: 'Auto Selection', model: 'auto' },
    { name: 'OpenAI Preference', model: 'openai' },
    { name: 'Anthropic Preference', model: 'anthropic' },
    { name: 'Google Preference', model: 'google' },
    { name: 'Groq Preference', model: 'groq' },
  ];
  
  for (const testCase of testCases) {
    console.log(`\n📋 Testing: ${testCase.name} (${testCase.model})`);
    console.log('─'.repeat(50));
    
    try {
      const response = await fetch(`${baseUrl}/api/workflows/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: testPrompt,
          conversationHistory: [],
          userId: null, // Use environment API keys
          preferredModel: testCase.model, // Pass the selected model
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
  console.log('\nTo test the UI:');
  console.log('1. Run: npm run dev');
  console.log('2. Open the AI Workflow Generator');
  console.log('3. Look for the "Workflow Generator Model" dropdown above the input');
  console.log('4. Select different models and generate workflows');
};

// Run the test
testModelSelector().catch(console.error);
