#!/usr/bin/env node

/**
 * Test All Security Templates Script
 * 
 * This script tests all security templates for functionality
 */

const { execSync } = require('child_process');

async function testAllSecurityTemplates() {
  console.log('🔧 Testing all security templates...\n');
  
  try {
    // Get all templates
    console.log('1. Getting all templates from database...');
    const templatesResponse = execSync('curl -s http://localhost:3000/api/database/templates', { encoding: 'utf8' });
    const templates = JSON.parse(templatesResponse);
    console.log(`   📋 Total templates: ${templates.length}`);
    
    // Filter security templates
    const securityTemplates = templates.filter(t => t.category === 'Security');
    console.log(`   🔒 Security templates: ${securityTemplates.length}`);
    
    if (securityTemplates.length === 0) {
      console.log('   ❌ No security templates found!');
      return false;
    }
    
    console.log('\n2. Security templates found:');
    securityTemplates.forEach((t, index) => {
      console.log(`   ${index + 1}. ${t.name} (${t.customId})`);
      console.log(`      - Description: ${t.description}`);
      console.log(`      - Difficulty: ${t.difficulty}`);
      console.log(`      - Estimated Time: ${t.estimatedTime}`);
      console.log(`      - Tags: ${t.tags.join(', ')}`);
      console.log(`      - Nodes: ${t.nodes.length}`);
      console.log(`      - Edges: ${t.edges.length}`);
      console.log('');
    });
    
    // Test template structure
    console.log('3. Testing template structure...');
    let validTemplates = 0;
    let invalidTemplates = 0;
    
    securityTemplates.forEach(template => {
      const errors = [];
      
      // Check required fields
      if (!template.name) errors.push('Missing name');
      if (!template.customId) errors.push('Missing customId');
      if (!template.category) errors.push('Missing category');
      if (!template.nodes || !Array.isArray(template.nodes)) errors.push('Invalid nodes');
      if (!template.edges || !Array.isArray(template.edges)) errors.push('Invalid edges');
      
      // Check nodes structure
      if (template.nodes && Array.isArray(template.nodes)) {
        template.nodes.forEach((node, index) => {
          if (!node.id) errors.push(`Node ${index} missing id`);
          if (!node.type) errors.push(`Node ${index} missing type`);
          if (!node.data) errors.push(`Node ${index} missing data`);
        });
      }
      
      // Check edges structure
      if (template.edges && Array.isArray(template.edges)) {
        template.edges.forEach((edge, index) => {
          if (!edge.id) errors.push(`Edge ${index} missing id`);
          if (!edge.source) errors.push(`Edge ${index} missing source`);
          if (!edge.target) errors.push(`Edge ${index} missing target`);
        });
      }
      
      // Check for start and end nodes
      const nodeTypes = template.nodes.map(n => n.type);
      if (!nodeTypes.includes('start')) errors.push('Missing start node');
      if (!nodeTypes.includes('end')) errors.push('Missing end node');
      
      if (errors.length === 0) {
        console.log(`   ✅ ${template.name} - Valid`);
        validTemplates++;
      } else {
        console.log(`   ❌ ${template.name} - Invalid:`);
        errors.forEach(error => console.log(`      - ${error}`));
        invalidTemplates++;
      }
    });
    
    console.log(`\n📊 Structure Validation:`);
    console.log(`   ✅ Valid templates: ${validTemplates}`);
    console.log(`   ❌ Invalid templates: ${invalidTemplates}`);
    
    // Test security template functionality
    console.log('\n4. Testing security template functionality...');
    
    securityTemplates.forEach(template => {
      console.log(`   🔍 Testing ${template.name}:`);
      
      // Check for agent nodes with security instructions
      const agentNodes = template.nodes.filter(n => n.type === 'agent');
      const hasSecurityInstructions = agentNodes.some(n =>
        n.data.instructions && (
          n.data.instructions.toLowerCase().includes('security') ||
          n.data.instructions.toLowerCase().includes('vulnerability') ||
          n.data.instructions.toLowerCase().includes('injection') ||
          n.data.instructions.toLowerCase().includes('xss') ||
          n.data.instructions.toLowerCase().includes('owasp') ||
          n.data.instructions.toLowerCase().includes('llm security') ||
          n.data.instructions.toLowerCase().includes('api key security') ||
          n.data.instructions.toLowerCase().includes('jailbreak') ||
          n.data.instructions.toLowerCase().includes('adversarial') ||
          n.data.instructions.toLowerCase().includes('authentication') ||
          n.data.instructions.toLowerCase().includes('access control') ||
          n.data.instructions.toLowerCase().includes('sql injection') ||
          n.data.instructions.toLowerCase().includes('prompt injection')
        )
      );
      
      console.log(`      - Has agent nodes with security instructions: ${hasSecurityInstructions ? '✅' : '❌'}`);
      
      // Check for MCP tools integration
      const hasMCPTools = agentNodes.some(n => 
        n.data.mcpTools && Array.isArray(n.data.mcpTools) && n.data.mcpTools.length > 0
      );
      console.log(`      - Has MCP tools integration: ${hasMCPTools ? '✅' : '❌'}`);
      
      // Check for proper input variables
      const startNode = template.nodes.find(n => n.type === 'start');
      const hasInputVariables = startNode && startNode.data.inputVariables && Array.isArray(startNode.data.inputVariables) && startNode.data.inputVariables.length > 0;
      console.log(`      - Has input variables: ${hasInputVariables ? '✅' : '❌'}`);
      
      // Check for proper workflow structure
      const hasProperStructure = template.nodes.length >= 2 && template.edges.length >= 1;
      console.log(`      - Has proper workflow structure: ${hasProperStructure ? '✅' : '❌'}`);
      
      // Check for security-specific features
      const hasSecurityFeatures = template.tags.some(tag => 
        ['security', 'owasp', 'injection', 'xss', 'authentication', 'llm', 'jailbreak', 'adversarial'].includes(tag.toLowerCase())
      );
      console.log(`      - Has security-specific features: ${hasSecurityFeatures ? '✅' : '❌'}`);
      
      console.log('');
    });
    
    // Test template execution readiness
    console.log('5. Testing template execution readiness...');
    
    const executionReadyTemplates = securityTemplates.filter(template => {
      const agentNodes = template.nodes.filter(n => n.type === 'agent');
      const hasSecurityInstructions = agentNodes.some(n =>
        n.data.instructions && (
          n.data.instructions.toLowerCase().includes('security') ||
          n.data.instructions.toLowerCase().includes('vulnerability') ||
          n.data.instructions.toLowerCase().includes('injection') ||
          n.data.instructions.toLowerCase().includes('xss') ||
          n.data.instructions.toLowerCase().includes('owasp') ||
          n.data.instructions.toLowerCase().includes('llm security') ||
          n.data.instructions.toLowerCase().includes('api key security') ||
          n.data.instructions.toLowerCase().includes('jailbreak') ||
          n.data.instructions.toLowerCase().includes('adversarial')
        )
      );
      
      const startNode = template.nodes.find(n => n.type === 'start');
      const hasInputVariables = startNode && startNode.data.inputVariables && Array.isArray(startNode.data.inputVariables) && startNode.data.inputVariables.length > 0;
      
      const hasProperStructure = template.nodes.length >= 2 && template.edges.length >= 1;
      
      return hasSecurityInstructions && hasInputVariables && hasProperStructure;
    });
    
    console.log(`   📊 Execution-ready templates: ${executionReadyTemplates.length}/${securityTemplates.length}`);
    
    if (executionReadyTemplates.length > 0) {
      console.log('   ✅ Execution-ready templates:');
      executionReadyTemplates.forEach(t => {
        console.log(`      - ${t.name} (${t.customId})`);
      });
    }
    
    // Final summary
    console.log('\n6. Final Summary:');
    console.log(`   📋 Total security templates: ${securityTemplates.length}`);
    console.log(`   ✅ Valid templates: ${validTemplates}`);
    console.log(`   ❌ Invalid templates: ${invalidTemplates}`);
    console.log(`   🚀 Execution-ready templates: ${executionReadyTemplates.length}`);
    
    if (validTemplates === securityTemplates.length && executionReadyTemplates.length === securityTemplates.length) {
      console.log('\n🎉 All security templates are fully functional and ready for testing!');
      return true;
    } else {
      console.log('\n⚠️  Some security templates have issues that need to be addressed.');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Testing failed:', error.message);
    return false;
  }
}

// Run the testing
if (require.main === module) {
  testAllSecurityTemplates()
    .then(success => {
      console.log(success ? '\n🎉 All security templates are fully functional!' : '\n❌ Some security templates have issues');
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Testing failed:', error);
      process.exit(1);
    });
}

module.exports = { testAllSecurityTemplates };
