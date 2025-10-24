#!/usr/bin/env node

// Script to fix workflow models from Groq to Anthropic
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function fixWorkflowModels() {
  try {
    console.log('🔍 Finding workflows with Groq models...');
    
    // Get all workflows
    const result = await pool.query('SELECT * FROM workflow');
    console.log(`Found ${result.rows.length} workflows`);
    
    for (const workflow of result.rows) {
      let needsUpdate = false;
      const updatedNodes = workflow.nodes.map(node => {
        if (node.data && node.data.model && node.data.model.startsWith('groq/')) {
          console.log(`🔄 Updating node ${node.id} (${node.data.nodeName}) from ${node.data.model} to anthropic/claude-sonnet-4-20250514`);
          needsUpdate = true;
          return {
            ...node,
            data: {
              ...node.data,
              model: 'anthropic/claude-sonnet-4-20250514'
            }
          };
        }
        return node;
      });
      
      if (needsUpdate) {
        console.log(`📝 Updating workflow ${workflow.customId || workflow.id} (${workflow.name})`);
        
        await pool.query(`
          UPDATE workflow 
          SET nodes = $1, "updatedAt" = $2
          WHERE id = $3
        `, [
          JSON.stringify(updatedNodes),
          new Date().toISOString(),
          workflow.id
        ]);
        
        console.log(`✅ Updated workflow ${workflow.customId || workflow.id}`);
      }
    }
    
    console.log('🎉 All workflows updated successfully!');
  } catch (error) {
    console.error('❌ Error updating workflows:', error);
  } finally {
    await pool.end();
  }
}

fixWorkflowModels();
