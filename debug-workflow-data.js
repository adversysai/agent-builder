#!/usr/bin/env node

/**
 * Debug Workflow Data
 * Check what's actually stored in the database for the workflow
 */

const { Pool } = require('pg');

async function debugWorkflowData() {
  console.log('🔍 Debugging Workflow Data...\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Get the workflow data
    const result = await pool.query(`
      SELECT id, name, description, nodes, edges, "createdAt"
      FROM workflow 
      WHERE id = 'workflow_1761370678006' OR "customId" = 'workflow_1761370678006'
      ORDER BY "createdAt" DESC 
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      console.log('❌ Workflow not found');
      return;
    }

    const workflow = result.rows[0];
    console.log('📋 Workflow Found:');
    console.log('  ID:', workflow.id);
    console.log('  Name:', workflow.name);
    console.log('  Description:', workflow.description);
    console.log('  Created:', workflow.createdAt);
    
    console.log('\n🔍 Nodes:');
    const nodes = JSON.parse(workflow.nodes);
    nodes.forEach((node, index) => {
      console.log(`  ${index + 1}. ${node.id} (${node.type})`);
      console.log(`     Label: ${node.data?.label || 'N/A'}`);
      console.log(`     NodeType: ${node.data?.nodeType || 'N/A'}`);
      
      if (node.type === 'mcp') {
        console.log(`     MCP Servers:`, node.data?.mcpServers || 'None');
        console.log(`     MCP Action:`, node.data?.mcpAction || 'None');
        console.log(`     MCP Params:`, node.data?.mcpParams || 'None');
      }
      console.log('');
    });

    console.log('🔍 Edges:');
    const edges = JSON.parse(workflow.edges);
    edges.forEach((edge, index) => {
      console.log(`  ${index + 1}. ${edge.id}: ${edge.source} -> ${edge.target}`);
    });

  } catch (error) {
    console.error('❌ Database Error:', error.message);
  } finally {
    await pool.end();
  }
}

debugWorkflowData();
