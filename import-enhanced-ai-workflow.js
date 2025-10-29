const fs = require('fs');
const path = require('path');

async function importEnhancedAIWorkflow() {
  try {
    // Read the enhanced workflow JSON
    const workflowPath = path.join(__dirname, 'enhanced-ai-detection-workflow.json');
    const workflowData = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));
    
    console.log('🚀 Importing Enhanced AI Detection Workflow...');
    console.log('📋 Workflow Details:');
    console.log(`   Name: ${workflowData.name}`);
    console.log(`   Description: ${workflowData.description}`);
    console.log(`   Category: ${workflowData.category}`);
    console.log(`   Nodes: ${workflowData.nodes.length}`);
    console.log(`   Edges: ${workflowData.edges.length}`);
    
    // Import the workflow
    const response = await fetch('http://localhost:3000/api/workflows', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer your-api-key-here' // You'll need to add your actual API key
      },
      body: JSON.stringify(workflowData)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Enhanced AI Detection Workflow imported successfully!');
      console.log(`   Workflow ID: ${result.workflowId}`);
      console.log(`   URL: http://localhost:3000/workflows/${result.workflowId}`);
      return result;
    } else {
      const error = await response.text();
      console.error('❌ Failed to import workflow:', error);
      return null;
    }
  } catch (error) {
    console.error('❌ Error importing workflow:', error);
    return null;
  }
}

// Run the import
importEnhancedAIWorkflow();
