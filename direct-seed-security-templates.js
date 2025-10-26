#!/usr/bin/env node

/**
 * Direct Seed Security Templates Script
 * 
 * This script directly inserts security templates into the database
 * using the same patterns as the working templates
 */

const { execSync } = require('child_process');
const fs = require('fs');

async function directSeedSecurityTemplates() {
  console.log('🔧 Direct seeding security templates...\n');
  
  try {
    // First, let's check what's currently in the database
    console.log('1. Checking current database state...');
    const templatesResponse = execSync('curl -s http://localhost:3000/api/database/templates', { encoding: 'utf8' });
    const templates = JSON.parse(templatesResponse);
    console.log(`   📋 Current templates: ${templates.length}`);
    
    // Check for security templates
    const securityTemplates = templates.filter(t => t.category === 'Security');
    console.log(`   🔒 Security templates: ${securityTemplates.length}`);
    
    if (securityTemplates.length > 0) {
      console.log('   ✅ Security templates already exist:');
      securityTemplates.forEach(t => {
        console.log(`      - ${t.name} (${t.customId})`);
      });
      return true;
    }
    
    // Get the security templates from the static file
    console.log('\n2. Getting security templates from static file...');
    
    // Read the templates.ts file and extract security templates
    const templatesFile = fs.readFileSync('./lib/workflow/templates.ts', 'utf8');
    
    // Create a simple test security template first
    const testSecurityTemplate = {
      customId: 'test-security-template',
      userId: 'system-templates',
      name: 'Test Security Template',
      description: 'A simple test template for basic security testing',
      category: 'Security',
      tags: ['security', 'test'],
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
      ]
    };
    
    console.log(`   📋 Created test security template`);
    
    // Insert the test template using a file-based approach
    console.log('\n3. Inserting test security template...');
    
    // Write the template to a temporary file
    const tempFile = '/tmp/security_template.json';
    fs.writeFileSync(tempFile, JSON.stringify(testSecurityTemplate, null, 2));
    
    // Use curl with file input to avoid shell escaping issues
    try {
      const insertResponse = execSync(`curl -s -X POST http://localhost:3000/api/database/templates/insert -H "Content-Type: application/json" -d @${tempFile}`, { encoding: 'utf8' });
      console.log(`   📊 Response: ${insertResponse}`);
      
      // Check if it was successful
      if (insertResponse.includes('success') || insertResponse.includes('id')) {
        console.log(`   ✅ Successfully inserted test security template`);
      } else {
        console.log(`   ❌ Failed to insert test security template: ${insertResponse}`);
      }
    } catch (error) {
      console.log(`   ❌ Error inserting test security template: ${error.message}`);
    }
    
    // Clean up temp file
    try {
      fs.unlinkSync(tempFile);
    } catch (e) {
      // Ignore cleanup errors
    }
    
    // Verify the template was inserted
    console.log('\n4. Verifying insertion...');
    const templatesResponse2 = execSync('curl -s http://localhost:3000/api/database/templates', { encoding: 'utf8' });
    const templates2 = JSON.parse(templatesResponse2);
    console.log(`   📋 Total templates after insertion: ${templates2.length}`);
    
    const securityTemplates2 = templates2.filter(t => t.category === 'Security');
    console.log(`   🔒 Security templates after insertion: ${securityTemplates2.length}`);
    
    if (securityTemplates2.length > 0) {
      console.log('   ✅ Security templates found:');
      securityTemplates2.forEach(t => {
        console.log(`      - ${t.name} (${t.customId})`);
      });
    }
    
    // Now let's try to insert the remaining security templates
    console.log('\n5. Inserting remaining security templates...');
    
    // Create a comprehensive security template
    const webAppSecurityTemplate = {
      customId: 'web-app-security-scanner',
      userId: 'system-templates',
      name: 'Web Application Security Scanner',
      description: 'Comprehensive OWASP Top 10 security testing for web applications',
      category: 'Security',
      tags: ['security', 'owasp', 'web-app', 'vulnerability', 'scanning'],
      difficulty: 'intermediate',
      estimatedTime: '5-8 minutes',
      nodes: [
        {
          id: 'start',
          type: 'start',
          position: { x: 100, y: 350 },
          data: {
            nodeType: 'start',
            label: 'Start',
            nodeName: 'Start',
            inputVariables: [
              {
                name: 'targetUrl',
                type: 'string',
                required: true,
                description: 'Target URL to test (e.g., https://example.com)',
                defaultValue: 'https://example.com'
              },
              {
                name: 'testDepth',
                type: 'string',
                required: false,
                description: 'Test depth: basic, standard, or comprehensive',
                defaultValue: 'standard'
              }
            ]
          }
        },
        {
          id: 'note-overview',
          type: 'note',
          position: { x: 100, y: 100 },
          data: {
            nodeType: 'note',
            label: 'Security Scanner Overview',
            noteText: 'Web Application Security Scanner\n\nTests OWASP Top 10 vulnerabilities:\n1. A01: Broken Access Control\n2. A02: Cryptographic Failures\n3. A03: Injection (SQL, XSS, etc.)\n4. A04: Insecure Design\n5. A05: Security Misconfiguration\n6. A06: Vulnerable Components\n7. A07: Authentication Failures\n8. A08: Software Integrity Failures\n9. A09: Logging Failures\n10. A10: Server-Side Request Forgery\n\nComprehensive security assessment!'
          }
        },
        {
          id: 'reconnaissance',
          type: 'agent',
          position: { x: 350, y: 350 },
          data: {
            nodeType: 'agent',
            label: 'Reconnaissance & Discovery',
            nodeName: 'Reconnaissance & Discovery',
            instructions: 'Perform reconnaissance on the target URL: {{input.targetUrl}}\n\n1. Use firecrawl_scrape to analyze the target website\n2. Identify:\n   - Web server technology and version\n   - Framework and CMS information\n   - Forms and input fields\n   - Authentication mechanisms\n   - API endpoints\n   - JavaScript frameworks\n   - Third-party components\n\n3. Look for:\n   - Error messages that reveal technology stack\n   - Hidden directories or files\n   - Security headers (or lack thereof)\n   - SSL/TLS configuration issues\n\nReturn a structured analysis of the target\'s attack surface.',
            model: 'anthropic/claude-sonnet-4-5-20250929',
            outputFormat: 'Text',
            mcpTools: [
              {
                name: 'Firecrawl',
                url: 'https://mcp.firecrawl.dev/{FIRECRAWL_API_KEY}/v2/mcp',
                authType: 'url',
                label: 'Firecrawl'
              }
            ]
          }
        },
        {
          id: 'vulnerability-scan',
          type: 'agent',
          position: { x: 600, y: 350 },
          data: {
            nodeType: 'agent',
            label: 'Vulnerability Assessment',
            nodeName: 'Vulnerability Assessment',
            instructions: 'Based on the reconnaissance data, perform OWASP Top 10 vulnerability testing:\n\nTarget: {{input.targetUrl}}\nReconnaissance Data: {{lastOutput}}\n\nTest for:\n\n**A01 - Broken Access Control:**\n- Test for directory traversal\n- Check for privilege escalation\n- Test direct object references\n\n**A02 - Cryptographic Failures:**\n- Check for HTTPS enforcement\n- Test for weak encryption\n- Look for sensitive data exposure\n\n**A03 - Injection:**\n- SQL injection testing\n- XSS (Cross-Site Scripting) testing\n- Command injection testing\n- LDAP injection testing\n\n**A04 - Insecure Design:**\n- Business logic flaws\n- Race conditions\n- Insecure direct object references\n\n**A05 - Security Misconfiguration:**\n- Default credentials\n- Unnecessary services\n- Missing security headers\n- Verbose error messages\n\n**A06 - Vulnerable Components:**\n- Outdated frameworks\n- Known CVEs\n- Third-party vulnerabilities\n\n**A07 - Authentication Failures:**\n- Weak password policies\n- Session management issues\n- Multi-factor authentication bypass\n\n**A08 - Software Integrity Failures:**\n- Supply chain attacks\n- Code integrity issues\n\n**A09 - Logging Failures:**\n- Insufficient logging\n- Log injection\n- Log tampering\n\n**A10 - Server-Side Request Forgery:**\n- SSRF vulnerabilities\n- Internal network access\n- Port scanning capabilities\n\nReturn detailed findings with risk levels (Critical/High/Medium/Low).',
            model: 'anthropic/claude-sonnet-4-5-20250929',
            outputFormat: 'Text'
          }
        },
        {
          id: 'generate-report',
          type: 'agent',
          position: { x: 850, y: 350 },
          data: {
            nodeType: 'agent',
            label: 'Generate Security Report',
            nodeName: 'Generate Security Report',
            instructions: 'Create a comprehensive security assessment report:\n\nTarget: {{input.targetUrl}}\nReconnaissance: {{state.variables.reconnaissance}}\nVulnerabilities: {{lastOutput}}\n\nFormat as:\n\n# Security Assessment Report\n## Target: {{input.targetUrl}}\n## Assessment Date: [Current Date]\n\n## Executive Summary\n[Overall security posture and key findings]\n\n## Vulnerability Summary\n- Critical: [count]\n- High: [count]\n- Medium: [count]\n- Low: [count]\n\n## Detailed Findings\n\n### Critical Vulnerabilities\n[List critical issues with remediation steps]\n\n### High Risk Vulnerabilities\n[List high-risk issues with remediation steps]\n\n### Medium Risk Vulnerabilities\n[List medium-risk issues with remediation steps]\n\n### Low Risk Vulnerabilities\n[List low-risk issues with remediation steps]\n\n## Recommendations\n[Prioritized remediation steps]\n\n## Next Steps\n[Follow-up testing recommendations]\n\nMake it professional and actionable for security teams.',
            model: 'anthropic/claude-sonnet-4-5-20250929',
            outputFormat: 'Text'
          }
        },
        {
          id: 'end',
          type: 'end',
          position: { x: 1100, y: 350 },
          data: {
            nodeType: 'end',
            label: 'End',
            nodeName: 'End'
          }
        }
      ],
      edges: [
        { id: 'e1', source: 'start', target: 'reconnaissance' },
        { id: 'e2', source: 'reconnaissance', target: 'vulnerability-scan' },
        { id: 'e3', source: 'vulnerability-scan', target: 'generate-report' },
        { id: 'e4', source: 'generate-report', target: 'end' }
      ]
    };
    
    // Write the comprehensive template to a temporary file
    const tempFile2 = '/tmp/web_app_security_template.json';
    fs.writeFileSync(tempFile2, JSON.stringify(webAppSecurityTemplate, null, 2));
    
    // Insert the comprehensive template
    try {
      const insertResponse2 = execSync(`curl -s -X POST http://localhost:3000/api/database/templates/insert -H "Content-Type: application/json" -d @${tempFile2}`, { encoding: 'utf8' });
      console.log(`   📊 Response: ${insertResponse2}`);
      
      if (insertResponse2.includes('success') || insertResponse2.includes('id')) {
        console.log(`   ✅ Successfully inserted Web Application Security Scanner`);
      } else {
        console.log(`   ❌ Failed to insert Web Application Security Scanner: ${insertResponse2}`);
      }
    } catch (error) {
      console.log(`   ❌ Error inserting Web Application Security Scanner: ${error.message}`);
    }
    
    // Clean up temp file
    try {
      fs.unlinkSync(tempFile2);
    } catch (e) {
      // Ignore cleanup errors
    }
    
    // Final verification
    console.log('\n6. Final verification...');
    const templatesResponse3 = execSync('curl -s http://localhost:3000/api/database/templates', { encoding: 'utf8' });
    const templates3 = JSON.parse(templatesResponse3);
    console.log(`   📋 Total templates: ${templates3.length}`);
    
    const securityTemplates3 = templates3.filter(t => t.category === 'Security');
    console.log(`   🔒 Security templates: ${securityTemplates3.length}`);
    
    if (securityTemplates3.length > 0) {
      console.log('   ✅ Security templates found:');
      securityTemplates3.forEach(t => {
        console.log(`      - ${t.name} (${t.customId})`);
      });
    }
    
    console.log('\n🎉 Direct seeding completed!');
    return securityTemplates3.length > 0;
    
  } catch (error) {
    console.error('❌ Direct seeding failed:', error.message);
    return false;
  }
}

// Run the direct seeding
if (require.main === module) {
  directSeedSecurityTemplates()
    .then(success => {
      console.log(success ? '\n🎉 Security templates seeded successfully!' : '\n❌ Failed to seed security templates');
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Direct seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { directSeedSecurityTemplates };
