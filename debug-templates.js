#!/usr/bin/env node

/**
 * Debug Templates Script
 * 
 * This script debugs the template seeding and database issues
 */

const { execSync } = require('child_process');

async function debugTemplates() {
  console.log('🔍 Debugging template issues...\n');
  
  try {
    // Check what templates are in the static file
    console.log('1. Checking static templates file...');
    const fs = require('fs');
    const templatesFile = fs.readFileSync('./lib/workflow/templates.ts', 'utf8');
    
    // Count templates in the file
    const templateMatches = templatesFile.match(/id: '[^']+'/g);
    console.log(`   📋 Found ${templateMatches ? templateMatches.length : 0} template definitions in file`);
    
    // Check for security templates in the file
    const securityMatches = templatesFile.match(/category: 'Security'/g);
    console.log(`   🔒 Security templates in file: ${securityMatches ? securityMatches.length : 0}`);
    
    // Check database directly
    console.log('\n2. Checking database directly...');
    const dbTest = execSync('curl -s http://localhost:3000/api/test-db', { encoding: 'utf8' });
    const dbResult = JSON.parse(dbTest);
    console.log(`   ✅ Database connection: ${dbResult.success ? 'OK' : 'FAILED'}`);
    
    // Get all templates from database
    console.log('\n3. Getting all templates from database...');
    const templatesResponse = execSync('curl -s http://localhost:3000/api/database/templates', { encoding: 'utf8' });
    const templates = JSON.parse(templatesResponse);
    console.log(`   📋 Total templates in database: ${templates.length}`);
    
    // Group by category
    const categories = {};
    templates.forEach(t => {
      const cat = t.category || 'Unknown';
      categories[cat] = (categories[cat] || 0) + 1;
    });
    
    console.log('   📊 Templates by category:');
    Object.entries(categories).forEach(([cat, count]) => {
      console.log(`      ${cat}: ${count}`);
    });
    
    // Check for security templates specifically
    const securityTemplates = templates.filter(t => t.category === 'Security');
    console.log(`\n   🔒 Security templates: ${securityTemplates.length}`);
    
    if (securityTemplates.length > 0) {
      securityTemplates.forEach(t => {
        console.log(`      - ${t.name} (${t.customId})`);
      });
    }
    
    // Check if templates exist but are not being returned
    console.log('\n4. Checking for missing security templates...');
    
    // Try to seed templates again to see what happens
    console.log('\n5. Attempting to seed templates...');
    const seedResponse = execSync('curl -s -X POST http://localhost:3000/api/database/templates/seed', { encoding: 'utf8' });
    const seedResult = JSON.parse(seedResponse);
    console.log(`   📊 Seeding result: ${seedResult.message}`);
    console.log(`   ✅ Seeded: ${seedResult.seeded}`);
    console.log(`   ⏭️  Skipped: ${seedResult.skipped}`);
    
    if (seedResult.skippedTemplates && seedResult.skippedTemplates.length > 0) {
      console.log('   📋 Skipped templates:');
      seedResult.skippedTemplates.forEach(name => {
        console.log(`      - ${name}`);
      });
    }
    
    // Check if the issue is with the API response
    console.log('\n6. Checking API response structure...');
    if (templates.length > 0) {
      const firstTemplate = templates[0];
      console.log('   📋 First template structure:');
      console.log(`      - ID: ${firstTemplate.id}`);
      console.log(`      - Name: ${firstTemplate.name}`);
      console.log(`      - Category: ${firstTemplate.category}`);
      console.log(`      - Custom ID: ${firstTemplate.customId}`);
      console.log(`      - Is Template: ${firstTemplate.isTemplate}`);
      console.log(`      - Created: ${firstTemplate.createdAt}`);
    }
    
    // Check if there are templates with different categories
    console.log('\n7. Checking for templates with different categories...');
    const allCategories = [...new Set(templates.map(t => t.category))];
    console.log(`   📊 All categories found: ${allCategories.join(', ')}`);
    
    // Check if there are any templates that might be security-related
    const securityRelated = templates.filter(t => 
      t.name.toLowerCase().includes('security') || 
      t.name.toLowerCase().includes('test') ||
      t.tags && t.tags.some(tag => tag.toLowerCase().includes('security'))
    );
    
    if (securityRelated.length > 0) {
      console.log('   🔍 Security-related templates found:');
      securityRelated.forEach(t => {
        console.log(`      - ${t.name} (${t.category}) - ${t.tags ? t.tags.join(', ') : 'No tags'}`);
      });
    }
    
    console.log('\n🎉 Debug completed!');
    return true;
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    return false;
  }
}

// Run the debug
if (require.main === module) {
  debugTemplates()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Debug failed:', error);
      process.exit(1);
    });
}

module.exports = { debugTemplates };
