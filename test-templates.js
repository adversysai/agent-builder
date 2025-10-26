#!/usr/bin/env node

/**
 * Test Templates Script
 * 
 * This script tests the template seeding and validates security templates
 */

const { execSync } = require('child_process');

async function testTemplates() {
  console.log('🔍 Testing template seeding...\n');
  
  try {
    // Test database connection
    console.log('1. Testing database connection...');
    const dbTest = execSync('curl -s http://localhost:3000/api/test-db', { encoding: 'utf8' });
    const dbResult = JSON.parse(dbTest);
    console.log(`   ✅ Database connection: ${dbResult.success ? 'OK' : 'FAILED'}`);
    
    // Get current templates
    console.log('\n2. Checking current templates...');
    const templatesResponse = execSync('curl -s http://localhost:3000/api/database/templates', { encoding: 'utf8' });
    const templates = JSON.parse(templatesResponse);
    console.log(`   📋 Found ${templates.length} templates in database`);
    
    // Check for security templates
    const securityTemplates = templates.filter(t => t.category === 'Security');
    console.log(`   🔒 Security templates: ${securityTemplates.length}`);
    
    if (securityTemplates.length === 0) {
      console.log('   ⚠️  No security templates found - seeding them...');
      
      // Seed templates
      console.log('\n3. Seeding security templates...');
      const seedResponse = execSync('curl -s -X POST http://localhost:3000/api/database/templates/seed', { encoding: 'utf8' });
      const seedResult = JSON.parse(seedResponse);
      console.log(`   📊 Seeding result: ${seedResult.message}`);
      console.log(`   ✅ Seeded: ${seedResult.seeded}`);
      console.log(`   ⏭️  Skipped: ${seedResult.skipped}`);
      
      // Check templates again
      console.log('\n4. Verifying security templates after seeding...');
      const templatesResponse2 = execSync('curl -s http://localhost:3000/api/database/templates', { encoding: 'utf8' });
      const templates2 = JSON.parse(templatesResponse2);
      const securityTemplates2 = templates2.filter(t => t.category === 'Security');
      console.log(`   🔒 Security templates after seeding: ${securityTemplates2.length}`);
      
      if (securityTemplates2.length > 0) {
        console.log('   📋 Security templates found:');
        securityTemplates2.forEach(t => {
          console.log(`      - ${t.name} (${t.customId})`);
        });
      }
    } else {
      console.log('   ✅ Security templates already present:');
      securityTemplates.forEach(t => {
        console.log(`      - ${t.name} (${t.customId})`);
      });
    }
    
    // Validate template structure
    console.log('\n5. Validating template structure...');
    let validTemplates = 0;
    let invalidTemplates = 0;
    
    templates.forEach(template => {
      const errors = [];
      
      // Check required fields
      if (!template.name) errors.push('Missing name');
      if (!template.description) errors.push('Missing description');
      if (!template.nodes || !Array.isArray(template.nodes)) errors.push('Missing or invalid nodes');
      if (!template.edges || !Array.isArray(template.edges)) errors.push('Missing or invalid edges');
      
      // Check for start and end nodes
      const hasStart = template.nodes.some(n => n.type === 'start');
      const hasEnd = template.nodes.some(n => n.type === 'end');
      if (!hasStart) errors.push('Missing start node');
      if (!hasEnd) errors.push('Missing end node');
      
      if (errors.length === 0) {
        validTemplates++;
      } else {
        invalidTemplates++;
        console.log(`   ❌ ${template.name}: ${errors.join(', ')}`);
      }
    });
    
    console.log(`   📊 Template validation: ${validTemplates} valid, ${invalidTemplates} invalid`);
    
    // Test security template functionality
    console.log('\n6. Testing security template functionality...');
    const securityTemplatesForTest = templates.filter(t => t.category === 'Security');
    
    if (securityTemplatesForTest.length > 0) {
      securityTemplatesForTest.forEach(template => {
        console.log(`   🔍 Testing ${template.name}:`);
        
        // Check for agent nodes with security instructions
        const agentNodes = template.nodes.filter(n => n.type === 'agent');
        const hasSecurityInstructions = agentNodes.some(n => 
          n.data.instructions && 
          (n.data.instructions.includes('security') || 
           n.data.instructions.includes('vulnerability') ||
           n.data.instructions.includes('injection'))
        );
        
        if (hasSecurityInstructions) {
          console.log(`      ✅ Has security testing instructions`);
        } else {
          console.log(`      ⚠️  Missing security testing instructions`);
        }
        
        // Check for proper input variables
        const startNode = template.nodes.find(n => n.type === 'start');
        if (startNode && startNode.data.inputVariables) {
          const hasTargetInput = startNode.data.inputVariables.some(input => 
            input.name.includes('target') || input.name.includes('url')
          );
          if (hasTargetInput) {
            console.log(`      ✅ Has target URL input`);
          } else {
            console.log(`      ⚠️  Missing target URL input`);
          }
        }
      });
    }
    
    console.log('\n🎉 Template testing completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Template testing failed:', error.message);
    return false;
  }
}

// Run the test
if (require.main === module) {
  testTemplates()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testTemplates };
