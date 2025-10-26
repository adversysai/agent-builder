#!/usr/bin/env node

/**
 * Force Seed Security Templates Script
 * 
 * This script directly inserts security templates into the database
 * bypassing the flawed existence check
 */

const { execSync } = require('child_process');

async function forceSeedSecurityTemplates() {
  console.log('🔧 Force seeding security templates...\n');
  
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
    
    // We'll manually create the security templates based on the templates.ts file
    const securityTemplatesData = [
      {
        customId: 'test-security-template',
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
      },
      {
        customId: 'web-app-security-scanner',
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
              noteText: `Web Application Security Scanner

Tests OWASP Top 10 vulnerabilities:
1. A01: Broken Access Control
2. A02: Cryptographic Failures  
3. A03: Injection (SQL, XSS, etc.)
4. A04: Insecure Design
5. A05: Security Misconfiguration
6. A06: Vulnerable Components
7. A07: Authentication Failures
8. A08: Software Integrity Failures
9. A09: Logging Failures
10. A10: Server-Side Request Forgery

Comprehensive security assessment!`
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
              instructions: `Perform reconnaissance on the target URL: {{input.targetUrl}}

1. Use firecrawl_scrape to analyze the target website
2. Identify:
   - Web server technology and version
   - Framework and CMS information
   - Forms and input fields
   - Authentication mechanisms
   - API endpoints
   - JavaScript frameworks
   - Third-party components

3. Look for:
   - Error messages that reveal technology stack
   - Hidden directories or files
   - Security headers (or lack thereof)
   - SSL/TLS configuration issues

Return a structured analysis of the target's attack surface.`,
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
              instructions: `Based on the reconnaissance data, perform OWASP Top 10 vulnerability testing:

Target: {{input.targetUrl}}
Reconnaissance Data: {{lastOutput}}

Test for:

**A01 - Broken Access Control:**
- Test for directory traversal
- Check for privilege escalation
- Test direct object references

**A02 - Cryptographic Failures:**
- Check for HTTPS enforcement
- Test for weak encryption
- Look for sensitive data exposure

**A03 - Injection:**
- SQL injection testing
- XSS (Cross-Site Scripting) testing
- Command injection testing
- LDAP injection testing

**A04 - Insecure Design:**
- Business logic flaws
- Race conditions
- Insecure direct object references

**A05 - Security Misconfiguration:**
- Default credentials
- Unnecessary services
- Missing security headers
- Verbose error messages

**A06 - Vulnerable Components:**
- Outdated frameworks
- Known CVEs
- Third-party vulnerabilities

**A07 - Authentication Failures:**
- Weak password policies
- Session management issues
- Multi-factor authentication bypass

**A08 - Software Integrity Failures:**
- Supply chain attacks
- Code integrity issues

**A09 - Logging Failures:**
- Insufficient logging
- Log injection
- Log tampering

**A10 - Server-Side Request Forgery:**
- SSRF vulnerabilities
- Internal network access
- Port scanning capabilities

Return detailed findings with risk levels (Critical/High/Medium/Low).`,
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
              instructions: `Create a comprehensive security assessment report:

Target: {{input.targetUrl}}
Reconnaissance: {{state.variables.reconnaissance}}
Vulnerabilities: {{lastOutput}}

Format as:

# Security Assessment Report
## Target: {{input.targetUrl}}
## Assessment Date: [Current Date]

## Executive Summary
[Overall security posture and key findings]

## Vulnerability Summary
- Critical: [count]
- High: [count] 
- Medium: [count]
- Low: [count]

## Detailed Findings

### Critical Vulnerabilities
[List critical issues with remediation steps]

### High Risk Vulnerabilities  
[List high-risk issues with remediation steps]

### Medium Risk Vulnerabilities
[List medium-risk issues with remediation steps]

### Low Risk Vulnerabilities
[List low-risk issues with remediation steps]

## Recommendations
[Prioritized remediation steps]

## Next Steps
[Follow-up testing recommendations]

Make it professional and actionable for security teams.`,
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
      }
    ];
    
    console.log(`   📋 Found ${securityTemplatesData.length} security templates to insert`);
    
    // Insert each security template
    console.log('\n3. Inserting security templates...');
    let successCount = 0;
    let errorCount = 0;
    
    for (const template of securityTemplatesData) {
      try {
        console.log(`   🔧 Inserting ${template.name}...`);
        
        // Use the new insert endpoint
        const insertResponse = execSync(`curl -s -X POST http://localhost:3000/api/database/templates/insert -H "Content-Type: application/json" -d '${JSON.stringify({
          customId: template.customId,
          name: template.name,
          description: template.description,
          category: template.category,
          tags: template.tags,
          difficulty: template.difficulty,
          estimatedTime: template.estimatedTime,
          nodes: template.nodes,
          edges: template.edges,
          isTemplate: true
        })}'`, { encoding: 'utf8' });
        
        console.log(`   📊 Response: ${insertResponse}`);
        
        // Check if it was successful
        if (insertResponse.includes('success') || insertResponse.includes('id')) {
          console.log(`   ✅ Successfully inserted ${template.name}`);
          successCount++;
        } else {
          console.log(`   ❌ Failed to insert ${template.name}: ${insertResponse}`);
          errorCount++;
        }
        
      } catch (error) {
        console.log(`   ❌ Error inserting ${template.name}: ${error.message}`);
        errorCount++;
      }
    }
    
    // Verify the templates were inserted
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
    
    console.log(`\n📊 Insertion Summary:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    
    return successCount > 0;
    
  } catch (error) {
    console.error('❌ Force seeding failed:', error.message);
    return false;
  }
}

// Run the force seeding
if (require.main === module) {
  forceSeedSecurityTemplates()
    .then(success => {
      console.log(success ? '\n🎉 Security templates seeded successfully!' : '\n❌ Failed to seed security templates');
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Force seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { forceSeedSecurityTemplates };
