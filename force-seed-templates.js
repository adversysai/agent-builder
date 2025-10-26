#!/usr/bin/env node

/**
 * Force Seed Templates Script
 * 
 * This script forces the seeding of security templates by bypassing the "already exists" check
 */

const { execSync } = require('child_process');

async function forceSeedTemplates() {
  console.log('🔧 Force seeding security templates...\n');
  
  try {
    // First, let's check what's actually in the database
    console.log('1. Checking current database state...');
    const templatesResponse = execSync('curl -s http://localhost:3000/api/database/templates', { encoding: 'utf8' });
    const templates = JSON.parse(templatesResponse);
    console.log(`   📋 Current templates: ${templates.length}`);
    
    // Check for any security templates
    const securityTemplates = templates.filter(t => t.category === 'Security');
    console.log(`   🔒 Security templates: ${securityTemplates.length}`);
    
    // Check if the issue is that templates exist but with different customId
    const testSecurityTemplate = templates.find(t => t.name.includes('Security') || t.name.includes('Test'));
    if (testSecurityTemplate) {
      console.log(`   🔍 Found potential security template: ${testSecurityTemplate.name} (${testSecurityTemplate.customId})`);
    }
    
    // Let's try to manually insert a security template to test
    console.log('\n2. Testing manual template insertion...');
    
    // Create a simple test security template
    const testTemplate = {
      customId: 'test-security-manual',
      name: 'Manual Security Test',
      description: 'Manually inserted security template for testing',
      category: 'Security',
      tags: ['security', 'test', 'manual'],
      difficulty: 'simple',
      estimatedTime: '1 minute',
      nodes: [
        {
          id: 'start',
          type: 'start',
          position: { x: 100, y: 200 },
          data: {
            nodeType: 'start',
            label: 'Start',
            nodeName: 'Start',
            inputVariables: [
              {
                name: 'targetUrl',
                type: 'string',
                required: true,
                description: 'Target URL to test',
                defaultValue: 'https://example.com'
              }
            ]
          }
        },
        {
          id: 'end',
          type: 'end',
          position: { x: 400, y: 200 },
          data: {
            nodeType: 'end',
            label: 'End',
            nodeName: 'End'
          }
        }
      ],
      edges: [
        { id: 'e1', source: 'start', target: 'end' }
      ],
      isTemplate: true
    };
    
    // Try to insert this template directly
    console.log('   🔧 Attempting to insert manual test template...');
    
    // We'll use the existing API to insert this template
    const insertResponse = execSync(`curl -s -X POST http://localhost:3000/api/database/templates -H "Content-Type: application/json" -d '${JSON.stringify(testTemplate)}'`, { encoding: 'utf8' });
    console.log(`   📊 Insert response: ${insertResponse}`);
    
    // Check if the template was inserted
    console.log('\n3. Verifying insertion...');
    const templatesResponse2 = execSync('curl -s http://localhost:3000/api/database/templates', { encoding: 'utf8' });
    const templates2 = JSON.parse(templatesResponse2);
    console.log(`   📋 Templates after insertion: ${templates2.length}`);
    
    const securityTemplates2 = templates2.filter(t => t.category === 'Security');
    console.log(`   🔒 Security templates after insertion: ${securityTemplates2.length}`);
    
    if (securityTemplates2.length > 0) {
      console.log('   ✅ Security templates found:');
      securityTemplates2.forEach(t => {
        console.log(`      - ${t.name} (${t.customId})`);
      });
    }
    
    // Now let's try to understand why the original seeding isn't working
    console.log('\n4. Analyzing seeding issue...');
    
    // Check if there's a database constraint or issue
    console.log('   🔍 The issue might be:');
    console.log('      - Templates exist but with different customId');
    console.log('      - Database constraint preventing insertion');
    console.log('      - Seeding logic has a bug');
    console.log('      - Templates are being filtered out by the API');
    
    // Let's check if we can find any templates with security-related names
    const allTemplates = templates2;
    const securityRelated = allTemplates.filter(t => 
      t.name.toLowerCase().includes('security') || 
      t.name.toLowerCase().includes('test') ||
      t.description?.toLowerCase().includes('security') ||
      (t.tags && t.tags.some(tag => tag.toLowerCase().includes('security')))
    );
    
    console.log(`\n   🔍 Security-related templates: ${securityRelated.length}`);
    securityRelated.forEach(t => {
      console.log(`      - ${t.name} (${t.category}) - ${t.customId}`);
    });
    
    console.log('\n🎉 Force seeding analysis completed!');
    return true;
    
  } catch (error) {
    console.error('❌ Force seeding failed:', error.message);
    return false;
  }
}

// Run the force seeding
if (require.main === module) {
  forceSeedTemplates()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Force seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { forceSeedTemplates };
