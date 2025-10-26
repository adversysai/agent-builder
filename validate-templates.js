#!/usr/bin/env node

/**
 * Template Validation Script
 * 
 * This script validates that all workflow templates are:
 * 1. Properly defined in the templates file
 * 2. Functionally correct with proper node structure
 * 3. Security templates have proper security testing capabilities
 */

// Simple validation without database connection
function validateTemplates() {
  console.log('🔍 Starting template validation...\n');
  
  const results = {
    total: 0,
    valid: 0,
    invalid: 0,
    errors: [],
    warnings: []
  };

  try {
    // Import templates dynamically
    const templates = require('./lib/workflow/templates.ts');
    
    // Get template list
    const templateList = templates.listTemplates();
    results.total = templateList.length;
    
    console.log(`📋 Found ${templateList.length} templates to validate:\n`);
    
    for (const templateInfo of templateList) {
      console.log(`🔍 Validating: ${templateInfo.name} (${templateInfo.id})`);
      
      try {
        // Get full template definition
        const template = templates.getTemplate(templateInfo.id);
        if (!template) {
          results.errors.push(`Template ${templateInfo.id} not found in definitions`);
          results.invalid++;
          continue;
        }

        // Validate template structure
        const validation = validateTemplateStructure(template);
        if (!validation.valid) {
          results.errors.push(`Template ${templateInfo.id}: ${validation.error}`);
          results.invalid++;
          continue;
        }

        // Validate security templates specifically
        if (template.category === 'Security') {
          const securityValidation = validateSecurityTemplate(template);
          if (!securityValidation.valid) {
            results.warnings.push(`Security template ${templateInfo.id}: ${securityValidation.warning}`);
          }
        }

        results.valid++;
        console.log(`  ✅ Valid\n`);
        
      } catch (error) {
        results.errors.push(`Template ${templateInfo.id}: ${error.message}`);
        results.invalid++;
        console.log(`  ❌ Error: ${error.message}\n`);
      }
    }

    // Print summary
    console.log('\n📊 Validation Summary:');
    console.log(`Total templates: ${results.total}`);
    console.log(`Valid: ${results.valid}`);
    console.log(`Invalid: ${results.invalid}`);
    console.log(`Errors: ${results.errors.length}`);
    console.log(`Warnings: ${results.warnings.length}`);

    if (results.errors.length > 0) {
      console.log('\n❌ Errors:');
      results.errors.forEach(error => console.log(`  - ${error}`));
    }

    if (results.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      results.warnings.forEach(warning => console.log(`  - ${warning}`));
    }

    return results;

  } catch (error) {
    console.error('❌ Validation failed:', error);
    throw error;
  }
}

function validateTemplateStructure(template) {
  const errors = [];

  // Required fields
  if (!template.id) errors.push('Missing id');
  if (!template.name) errors.push('Missing name');
  if (!template.description) errors.push('Missing description');
  if (!template.category) errors.push('Missing category');
  if (!template.nodes || !Array.isArray(template.nodes)) errors.push('Missing or invalid nodes array');
  if (!template.edges || !Array.isArray(template.edges)) errors.push('Missing or invalid edges array');

  // Node validation
  if (template.nodes) {
    const nodeIds = new Set();
    const hasStart = template.nodes.some(node => node.type === 'start');
    const hasEnd = template.nodes.some(node => node.type === 'end');

    if (!hasStart) errors.push('Missing start node');
    if (!hasEnd) errors.push('Missing end node');

    template.nodes.forEach((node, index) => {
      if (!node.id) errors.push(`Node ${index}: Missing id`);
      if (!node.type) errors.push(`Node ${index}: Missing type`);
      if (!node.data) errors.push(`Node ${index}: Missing data`);
      
      if (node.id && nodeIds.has(node.id)) {
        errors.push(`Duplicate node id: ${node.id}`);
      }
      nodeIds.add(node.id);
    });
  }

  // Edge validation
  if (template.edges) {
    const nodeIds = new Set(template.nodes.map(n => n.id));
    
    template.edges.forEach((edge, index) => {
      if (!edge.id) errors.push(`Edge ${index}: Missing id`);
      if (!edge.source) errors.push(`Edge ${index}: Missing source`);
      if (!edge.target) errors.push(`Edge ${index}: Missing target`);
      
      if (edge.source && !nodeIds.has(edge.source)) {
        errors.push(`Edge ${index}: Source node '${edge.source}' not found`);
      }
      if (edge.target && !nodeIds.has(edge.target)) {
        errors.push(`Edge ${index}: Target node '${edge.target}' not found`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    error: errors.join(', ')
  };
}

function validateSecurityTemplate(template) {
  const warnings = [];

  // Check for security-specific nodes
  const hasAgentNodes = template.nodes.some(node => node.type === 'agent');
  if (!hasAgentNodes) {
    warnings.push('No agent nodes found for security testing');
  }

  // Check for security testing capabilities
  const hasSecurityInstructions = template.nodes.some(node => 
    node.type === 'agent' && 
    node.data.instructions && 
    (node.data.instructions.includes('security') || 
     node.data.instructions.includes('vulnerability') ||
     node.data.instructions.includes('injection') ||
     node.data.instructions.includes('authentication'))
  );

  if (!hasSecurityInstructions) {
    warnings.push('No security testing instructions found in agent nodes');
  }

  // Check for proper input variables
  const startNode = template.nodes.find(node => node.type === 'start');
  if (startNode && startNode.data.inputVariables) {
    const hasTargetInput = startNode.data.inputVariables.some(input => 
      input.name.includes('target') || input.name.includes('url')
    );
    if (!hasTargetInput) {
      warnings.push('No target URL input variable found');
    }
  }

  return {
    valid: warnings.length === 0,
    warning: warnings.join(', ')
  };
}

// Run validation
if (require.main === module) {
  try {
    const results = validateTemplates();
    console.log('\n🎉 Template validation completed!');
    process.exit(results.invalid > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  }
}

module.exports = { validateTemplates, validateTemplateStructure, validateSecurityTemplate };
