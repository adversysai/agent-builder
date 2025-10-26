#!/usr/bin/env node

/**
 * Debug Tavily Workflow Execution
 * Test the actual workflow execution to see what's happening
 */

const fetch = require('node-fetch');

async function debugTavilyWorkflow() {
  console.log('🔍 Debugging Tavily Workflow Execution...\n');

  try {
    // Test the workflow execution
    const response = await fetch('http://localhost:3000/api/workflows/workflow_1761370678006/execute-stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: {
          url: 'http://testphp.vulnweb.com/'
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    console.log('✅ Workflow execution started');
    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
    
    // Read the streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    let result = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      result += chunk;
      console.log('📦 Chunk:', chunk);
    }
    
    console.log('\n📋 Full Response:');
    console.log(result);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugTavilyWorkflow();
