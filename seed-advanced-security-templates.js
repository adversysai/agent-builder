#!/usr/bin/env node

/**
 * Seed Advanced Security Templates Script
 * 
 * This script seeds advanced security templates to make the agent builder
 * an unstoppable security-focused platform
 */

const { execSync } = require('child_process');
const fs = require('fs');

async function seedAdvancedSecurityTemplates() {
  console.log('🛡️ Seeding advanced security templates...\n');
  
  try {
    // Check current state
    console.log('1. Checking current database state...');
    const templatesResponse = execSync('curl -s http://localhost:3000/api/database/templates', { encoding: 'utf8' });
    const templates = JSON.parse(templatesResponse);
    console.log(`   📋 Current templates: ${templates.length}`);
    
    const securityTemplates = templates.filter(t => t.category === 'Security');
    console.log(`   🔒 Security templates: ${securityTemplates.length}`);
    
    // Define advanced security templates
    const advancedSecurityTemplates = [
      {
        customId: 'network-penetration-tester',
        userId: 'system-templates',
        name: 'Network Penetration Tester',
        description: 'Comprehensive network security assessment and penetration testing',
        category: 'Security',
        tags: ['security', 'penetration-testing', 'network', 'vulnerability', 'red-team'],
        difficulty: 'advanced',
        estimatedTime: '10-15 minutes',
        nodes: [
          {
            id: 'start',
            type: 'start',
            position: { x: 100, y: 400 },
            data: {
              nodeType: 'start',
              label: 'Start',
              nodeName: 'Start',
              inputVariables: [
                {
                  name: 'targetNetwork',
                  type: 'string',
                  required: true,
                  description: 'Target network range or IP address (e.g., 192.168.1.0/24)',
                  defaultValue: '192.168.1.0/24'
                },
                {
                  name: 'scanDepth',
                  type: 'string',
                  required: false,
                  description: 'Scan depth: quick, standard, or comprehensive',
                  defaultValue: 'comprehensive'
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
              label: 'Network Penetration Testing',
              noteText: 'Network Penetration Tester\n\nComprehensive network security assessment:\n• Port scanning and service enumeration\n• Vulnerability assessment\n• Network topology mapping\n• Service exploitation testing\n• Privilege escalation testing\n• Network segmentation testing\n\nAdvanced penetration testing capabilities!'
            }
          },
          {
            id: 'network-discovery',
            type: 'agent',
            position: { x: 350, y: 300 },
            data: {
              nodeType: 'agent',
              label: 'Network Discovery',
              nodeName: 'Network Discovery & Reconnaissance',
              instructions: 'Perform comprehensive network discovery and reconnaissance:\n\nTarget Network: {{input.targetNetwork}}\nScan Depth: {{input.scanDepth}}\n\n1. **Network Topology Discovery:**\n   - Identify active hosts and devices\n   - Map network topology and architecture\n   - Discover network segments and VLANs\n   - Identify network devices (routers, switches, firewalls)\n\n2. **Port Scanning:**\n   - Scan all common ports (1-65535)\n   - Identify open services and versions\n   - Detect service banners and fingerprints\n   - Identify operating systems and versions\n\n3. **Service Enumeration:**\n   - Enumerate running services\n   - Identify service versions and configurations\n   - Detect security mechanisms (firewalls, IDS/IPS)\n   - Identify network protocols and services\n\n4. **Vulnerability Discovery:**\n   - Scan for known vulnerabilities\n   - Identify misconfigurations\n   - Detect weak authentication mechanisms\n   - Identify exposed services and data\n\nReturn detailed network reconnaissance report with discovered hosts, services, and potential attack vectors.',
              model: 'anthropic/claude-sonnet-4-5-20250929',
              outputFormat: 'Text'
            }
          },
          {
            id: 'vulnerability-assessment',
            type: 'agent',
            position: { x: 600, y: 200 },
            data: {
              nodeType: 'agent',
              label: 'Vulnerability Assessment',
              nodeName: 'Vulnerability Assessment',
              instructions: 'Perform comprehensive vulnerability assessment:\n\nTarget Network: {{input.targetNetwork}}\nNetwork Discovery: {{lastOutput}}\n\n1. **Vulnerability Scanning:**\n   - Scan for CVE vulnerabilities\n   - Test for configuration weaknesses\n   - Identify security misconfigurations\n   - Detect outdated software and services\n\n2. **Service Testing:**\n   - Test for weak authentication\n   - Identify default credentials\n   - Test for privilege escalation\n   - Identify information disclosure\n\n3. **Network Security Testing:**\n   - Test firewall rules and ACLs\n   - Identify network segmentation issues\n   - Test for network sniffing vulnerabilities\n   - Identify routing and switching vulnerabilities\n\n4. **Protocol Security Testing:**\n   - Test for protocol vulnerabilities\n   - Identify weak encryption\n   - Test for protocol downgrade attacks\n   - Identify protocol implementation flaws\n\nReturn detailed vulnerability assessment with risk ratings and exploitation potential.',
              model: 'anthropic/claude-sonnet-4-5-20250929',
              outputFormat: 'Text'
            }
          },
          {
            id: 'exploitation-testing',
            type: 'agent',
            position: { x: 600, y: 400 },
            data: {
              nodeType: 'agent',
              label: 'Exploitation Testing',
              nodeName: 'Exploitation Testing',
              instructions: 'Perform controlled exploitation testing:\n\nTarget Network: {{input.targetNetwork}}\nNetwork Discovery: {{state.variables[\'network-discovery\']}}\nVulnerabilities: {{state.variables[\'vulnerability-assessment\']}}\n\n1. **Controlled Exploitation:**\n   - Test for remote code execution\n   - Attempt privilege escalation\n   - Test for lateral movement\n   - Identify persistence mechanisms\n\n2. **Social Engineering Testing:**\n   - Test for phishing vulnerabilities\n   - Identify weak authentication\n   - Test for credential harvesting\n   - Identify information disclosure\n\n3. **Physical Security Testing:**\n   - Test for physical access vulnerabilities\n   - Identify weak physical controls\n   - Test for social engineering\n   - Identify physical security bypasses\n\n4. **Post-Exploitation:**\n   - Test for data exfiltration\n   - Identify sensitive data exposure\n   - Test for privilege escalation\n   - Identify persistence mechanisms\n\nReturn detailed exploitation report with successful attacks and remediation recommendations.',
              model: 'anthropic/claude-sonnet-4-5-20250929',
              outputFormat: 'Text'
            }
          },
          {
            id: 'generate-penetration-report',
            type: 'agent',
            position: { x: 850, y: 300 },
            data: {
              nodeType: 'agent',
              label: 'Generate Penetration Report',
              nodeName: 'Generate Penetration Testing Report',
              instructions: 'Create comprehensive penetration testing report:\n\nTarget Network: {{input.targetNetwork}}\nNetwork Discovery: {{state.variables[\'network-discovery\']}}\nVulnerabilities: {{state.variables[\'vulnerability-assessment\']}}\nExploitation: {{state.variables[\'exploitation-testing\']}}\n\nFormat as:\n\n# Network Penetration Testing Report\n## Target: {{input.targetNetwork}}\n## Assessment Date: [Current Date]\n\n## Executive Summary\n[Overall security posture and key findings]\n\n## Network Topology\n[Network architecture and discovered devices]\n\n## Vulnerability Summary\n- Critical: [count]\n- High: [count]\n- Medium: [count]\n- Low: [count]\n\n## Detailed Findings\n### Critical Vulnerabilities\n[List critical vulnerabilities with proof of concept]\n\n### High Risk Vulnerabilities\n[List high-risk vulnerabilities]\n\n### Medium Risk Vulnerabilities\n[List medium-risk vulnerabilities]\n\n### Low Risk Vulnerabilities\n[List low-risk vulnerabilities]\n\n## Exploitation Results\n[Successful exploitation attempts and impact]\n\n## Risk Assessment\n[Overall risk assessment and business impact]\n\n## Recommendations\n[Prioritized remediation steps]\n\n## Next Steps\n[Follow-up testing and monitoring recommendations]\n\nMake it actionable for security teams and management.',
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
          { id: 'e1', source: 'start', target: 'network-discovery' },
          { id: 'e2', source: 'network-discovery', target: 'vulnerability-assessment' },
          { id: 'e3', source: 'network-discovery', target: 'exploitation-testing' },
          { id: 'e4', source: 'vulnerability-assessment', target: 'generate-penetration-report' },
          { id: 'e5', source: 'exploitation-testing', target: 'generate-penetration-report' },
          { id: 'e6', source: 'generate-penetration-report', target: 'end' }
        ]
      },
      {
        customId: 'cloud-security-auditor',
        userId: 'system-templates',
        name: 'Cloud Security Auditor',
        description: 'Comprehensive cloud security assessment for AWS, Azure, and GCP',
        category: 'Security',
        tags: ['security', 'cloud', 'aws', 'azure', 'gcp', 'compliance'],
        difficulty: 'advanced',
        estimatedTime: '8-12 minutes',
        nodes: [
          {
            id: 'start',
            type: 'start',
            position: { x: 100, y: 400 },
            data: {
              nodeType: 'start',
              label: 'Start',
              nodeName: 'Start',
              inputVariables: [
                {
                  name: 'cloudProvider',
                  type: 'string',
                  required: true,
                  description: 'Cloud provider (aws, azure, gcp)',
                  defaultValue: 'aws'
                },
                {
                  name: 'accountId',
                  type: 'string',
                  required: true,
                  description: 'Cloud account ID or subscription ID',
                  defaultValue: ''
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
              label: 'Cloud Security Auditor',
              noteText: 'Cloud Security Auditor\n\nComprehensive cloud security assessment:\n• Identity and Access Management (IAM)\n• Network Security Groups (NSG)\n• Storage Security (S3, Blob, GCS)\n• Database Security (RDS, CosmosDB, Cloud SQL)\n• Container Security (ECS, AKS, GKE)\n• Serverless Security (Lambda, Functions)\n• Compliance (SOC2, PCI-DSS, HIPAA)\n\nMulti-cloud security testing!'
            }
          },
          {
            id: 'cloud-discovery',
            type: 'agent',
            position: { x: 350, y: 300 },
            data: {
              nodeType: 'agent',
              label: 'Cloud Discovery',
              nodeName: 'Cloud Infrastructure Discovery',
              instructions: 'Perform comprehensive cloud infrastructure discovery:\n\nCloud Provider: {{input.cloudProvider}}\nAccount ID: {{input.accountId}}\n\n1. **Resource Discovery:**\n   - Discover all cloud resources\n   - Map resource relationships\n   - Identify resource configurations\n   - Discover resource dependencies\n\n2. **Identity and Access Management:**\n   - Analyze IAM policies and roles\n   - Identify overprivileged accounts\n   - Test for privilege escalation\n   - Identify weak authentication\n\n3. **Network Security:**\n   - Analyze security groups and NACLs\n   - Test for network segmentation\n   - Identify exposed services\n   - Test for network vulnerabilities\n\n4. **Storage Security:**\n   - Test for public storage buckets\n   - Identify weak access controls\n   - Test for data encryption\n   - Identify data exposure risks\n\nReturn detailed cloud infrastructure analysis with security findings.',
              model: 'anthropic/claude-sonnet-4-5-20250929',
              outputFormat: 'Text'
            }
          },
          {
            id: 'compliance-testing',
            type: 'agent',
            position: { x: 600, y: 200 },
            data: {
              nodeType: 'agent',
              label: 'Compliance Testing',
              nodeName: 'Compliance Testing',
              instructions: 'Perform comprehensive compliance testing:\n\nCloud Provider: {{input.cloudProvider}}\nAccount ID: {{input.accountId}}\nCloud Discovery: {{lastOutput}}\n\n1. **SOC2 Compliance:**\n   - Test for security controls\n   - Verify access controls\n   - Test for monitoring and logging\n   - Verify data protection\n\n2. **PCI-DSS Compliance:**\n   - Test for payment card data protection\n   - Verify encryption requirements\n   - Test for access controls\n   - Verify network security\n\n3. **HIPAA Compliance:**\n   - Test for healthcare data protection\n   - Verify encryption requirements\n   - Test for access controls\n   - Verify audit logging\n\n4. **ISO27001 Compliance:**\n   - Test for information security controls\n   - Verify risk management\n   - Test for incident response\n   - Verify continuous monitoring\n\nReturn detailed compliance assessment with gaps and recommendations.',
              model: 'anthropic/claude-sonnet-4-5-20250929',
              outputFormat: 'Text'
            }
          },
          {
            id: 'security-testing',
            type: 'agent',
            position: { x: 600, y: 400 },
            data: {
              nodeType: 'agent',
              label: 'Security Testing',
              nodeName: 'Cloud Security Testing',
              instructions: 'Perform comprehensive cloud security testing:\n\nCloud Provider: {{input.cloudProvider}}\nAccount ID: {{input.accountId}}\nCloud Discovery: {{state.variables[\'cloud-discovery\']}}\n\n1. **Container Security:**\n   - Test for container vulnerabilities\n   - Test for container runtime security\n   - Test for container orchestration security\n   - Test for container image security\n\n2. **Serverless Security:**\n   - Test for function vulnerabilities\n   - Test for function permissions\n   - Test for function data access\n   - Test for function execution security\n\n3. **Database Security:**\n   - Test for database vulnerabilities\n   - Test for database access controls\n   - Test for database encryption\n   - Test for database backup security\n\n4. **API Security:**\n   - Test for API vulnerabilities\n   - Test for API authentication\n   - Test for API authorization\n   - Test for API rate limiting\n\nReturn detailed security testing results with vulnerabilities and recommendations.',
              model: 'anthropic/claude-sonnet-4-5-20250929',
              outputFormat: 'Text'
            }
          },
          {
            id: 'generate-cloud-report',
            type: 'agent',
            position: { x: 850, y: 300 },
            data: {
              nodeType: 'agent',
              label: 'Generate Cloud Report',
              nodeName: 'Generate Cloud Security Report',
              instructions: 'Create comprehensive cloud security report:\n\nCloud Provider: {{input.cloudProvider}}\nAccount ID: {{input.accountId}}\nCloud Discovery: {{state.variables[\'cloud-discovery\']}}\nCompliance: {{state.variables[\'compliance-testing\']}}\nSecurity Testing: {{state.variables[\'security-testing\']}}\n\nFormat as:\n\n# Cloud Security Assessment Report\n## Provider: {{input.cloudProvider}}\n## Account: {{input.accountId}}\n## Assessment Date: [Current Date]\n\n## Executive Summary\n[Overall cloud security posture and key findings]\n\n## Infrastructure Overview\n[Cloud infrastructure and resource analysis]\n\n## Security Findings\n### Critical Security Issues\n[List critical security vulnerabilities]\n\n### High Risk Security Issues\n[List high-risk security vulnerabilities]\n\n### Medium Risk Security Issues\n[List medium-risk security vulnerabilities]\n\n### Low Risk Security Issues\n[List low-risk security vulnerabilities]\n\n## Compliance Assessment\n### SOC2 Compliance\n[SOC2 compliance status and gaps]\n\n### PCI-DSS Compliance\n[PCI-DSS compliance status and gaps]\n\n### HIPAA Compliance\n[HIPAA compliance status and gaps]\n\n### ISO27001 Compliance\n[ISO27001 compliance status and gaps]\n\n## Recommendations\n[Prioritized remediation steps for cloud security]\n\n## Next Steps\n[Follow-up testing and monitoring recommendations]\n\nMake it actionable for cloud security teams and management.',
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
          { id: 'e1', source: 'start', target: 'cloud-discovery' },
          { id: 'e2', source: 'cloud-discovery', target: 'compliance-testing' },
          { id: 'e3', source: 'cloud-discovery', target: 'security-testing' },
          { id: 'e4', source: 'compliance-testing', target: 'generate-cloud-report' },
          { id: 'e5', source: 'security-testing', target: 'generate-cloud-report' },
          { id: 'e6', source: 'generate-cloud-report', target: 'end' }
        ]
      }
    ];
    
    console.log(`\n2. Seeding ${advancedSecurityTemplates.length} advanced security templates...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const template of advancedSecurityTemplates) {
      try {
        console.log(`   🔧 Inserting ${template.name}...`);
        
        // Write template to temp file
        const tempFile = `/tmp/advanced_security_template_${template.customId}.json`;
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
  seedAdvancedSecurityTemplates()
    .then(success => {
      console.log(success ? '\n🎉 Advanced security templates seeded successfully!' : '\n❌ Failed to seed advanced security templates');
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedAdvancedSecurityTemplates };
