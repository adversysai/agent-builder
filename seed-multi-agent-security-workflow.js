#!/usr/bin/env node

/**
 * Seed Multi-Agent Security Workflow Script
 * 
 * This script creates an advanced multi-agent security workflow
 * that demonstrates unstoppable agent collaboration
 */

const { execSync } = require('child_process');
const fs = require('fs');

async function seedMultiAgentSecurityWorkflow() {
  console.log('🤖 Seeding multi-agent security workflow...\n');
  
  try {
    // Check current state
    console.log('1. Checking current database state...');
    const templatesResponse = execSync('curl -s http://localhost:3000/api/database/templates', { encoding: 'utf8' });
    const templates = JSON.parse(templatesResponse);
    console.log(`   📋 Current templates: ${templates.length}`);
    
    const securityTemplates = templates.filter(t => t.category === 'Security');
    console.log(`   🔒 Security templates: ${securityTemplates.length}`);
    
    // Define multi-agent security workflow
    const multiAgentSecurityWorkflow = {
      customId: 'multi-agent-security-team',
      userId: 'system-templates',
      name: 'Multi-Agent Security Team',
      description: 'Unstoppable security testing with specialized AI agents working together',
      category: 'Security',
      tags: ['security', 'multi-agent', 'collaboration', 'ai-team', 'advanced'],
      difficulty: 'advanced',
      estimatedTime: '15-20 minutes',
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
                name: 'targetSystem',
                type: 'string',
                required: true,
                description: 'Target system to test (URL, IP, or system identifier)',
                defaultValue: 'https://example.com'
              },
              {
                name: 'testScope',
                type: 'string',
                required: false,
                description: 'Test scope: web-app, network, cloud, mobile, or comprehensive',
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
            label: 'Multi-Agent Security Team',
            noteText: 'Multi-Agent Security Team\n\nUnstoppable security testing with specialized AI agents:\n• Reconnaissance Agent - Discovers attack surface\n• Vulnerability Agent - Identifies security flaws\n• Exploitation Agent - Tests for vulnerabilities\n• Lateral Movement Agent - Simulates advanced attacks\n• Data Exfiltration Agent - Tests data protection\n• Reporting Agent - Synthesizes findings\n\nAI agents collaborate like a real security team!'
          }
        },
        {
          id: 'reconnaissance-agent',
          type: 'agent',
          position: { x: 300, y: 300 },
          data: {
            nodeType: 'agent',
            label: 'Reconnaissance Agent',
            nodeName: 'Reconnaissance Agent',
            instructions: `You are a reconnaissance specialist AI agent. Your mission is to discover the attack surface of: {{input.targetSystem}}

**Your Role**: Lead reconnaissance specialist
**Team Context**: You are part of a multi-agent security team. Your findings will be used by other specialized agents.

**Tasks**:
1. **Target Discovery**:
   - Identify all accessible endpoints and services
   - Map the technology stack and versions
   - Discover hidden or administrative interfaces
   - Identify third-party integrations and dependencies

2. **Attack Surface Mapping**:
   - Catalog all input vectors (forms, APIs, parameters)
   - Identify authentication mechanisms
   - Map network topology and services
   - Discover data storage and processing systems

3. **Information Gathering**:
   - Collect metadata and version information
   - Identify development and staging environments
   - Discover error messages and debugging information
   - Gather social engineering information

4. **Threat Intelligence**:
   - Research known vulnerabilities for identified technologies
   - Identify potential attack vectors
   - Assess security posture indicators
   - Document findings for the team

**Output Format**: Provide a comprehensive reconnaissance report with:
- Target overview and scope
- Discovered services and technologies
- Identified attack vectors
- Recommended focus areas for other agents
- Risk assessment and priority ranking

**Team Handoff**: Your findings will be used by:
- Vulnerability Agent (for vulnerability assessment)
- Exploitation Agent (for attack development)
- Lateral Movement Agent (for advanced attacks)

Remember: You are the eyes and ears of the security team. Your thorough reconnaissance enables the entire team to be more effective.`,
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
          id: 'vulnerability-agent',
          type: 'agent',
          position: { x: 500, y: 200 },
          data: {
            nodeType: 'agent',
            label: 'Vulnerability Agent',
            nodeName: 'Vulnerability Assessment Agent',
            instructions: `You are a vulnerability assessment specialist AI agent. Your mission is to identify security vulnerabilities based on reconnaissance data.

**Your Role**: Vulnerability assessment specialist
**Team Context**: You work with the Reconnaissance Agent's findings to identify security flaws.

**Input Data**: Reconnaissance findings from {{state.variables.reconnaissance_agent}}

**Tasks**:
1. **Vulnerability Analysis**:
   - Analyze reconnaissance data for security weaknesses
   - Identify OWASP Top 10 vulnerabilities
   - Test for common security misconfigurations
   - Assess authentication and authorization flaws

2. **Technology-Specific Testing**:
   - Test for framework-specific vulnerabilities
   - Identify version-specific security issues
   - Assess third-party component vulnerabilities
   - Test for API security weaknesses

3. **Risk Assessment**:
   - Categorize vulnerabilities by severity
   - Assess exploitability and impact
   - Identify attack chains and combinations
   - Prioritize findings for exploitation

4. **Exploitation Planning**:
   - Develop proof-of-concept exploits
   - Identify attack prerequisites
   - Plan exploitation sequences
   - Document exploitation techniques

**Output Format**: Provide a detailed vulnerability assessment with:
- Categorized vulnerability findings
- Risk ratings and impact assessment
- Exploitation potential and prerequisites
- Recommended attack vectors for the Exploitation Agent

**Team Handoff**: Your findings will be used by:
- Exploitation Agent (for actual attack testing)
- Lateral Movement Agent (for advanced attack planning)

Remember: You are the vulnerability expert. Your thorough analysis enables the team to focus on the most critical security issues.`,
            model: 'anthropic/claude-sonnet-4-5-20250929',
            outputFormat: 'Text'
          }
        },
        {
          id: 'exploitation-agent',
          type: 'agent',
          position: { x: 500, y: 400 },
          data: {
            nodeType: 'agent',
            label: 'Exploitation Agent',
            nodeName: 'Exploitation Testing Agent',
            instructions: `You are an exploitation specialist AI agent. Your mission is to test and exploit vulnerabilities identified by the team.

**Your Role**: Exploitation specialist
**Team Context**: You work with findings from Reconnaissance Agent and Vulnerability Agent.

**Input Data**: 
- Reconnaissance: {{state.variables.reconnaissance_agent}}
- Vulnerabilities: {{state.variables.vulnerability_agent}}

**Tasks**:
1. **Exploit Development**:
   - Develop working exploits for identified vulnerabilities
   - Test exploit reliability and effectiveness
   - Create proof-of-concept demonstrations
   - Document exploitation techniques

2. **Attack Testing**:
   - Execute controlled exploitation attempts
   - Test for privilege escalation
   - Attempt to bypass security controls
   - Validate attack impact and scope

3. **Persistence Testing**:
   - Test for persistent access mechanisms
   - Identify backdoor opportunities
   - Test for privilege maintenance
   - Assess long-term access potential

4. **Impact Assessment**:
   - Evaluate exploitation success rates
   - Assess data access and modification capabilities
   - Test for system control and manipulation
   - Document exploitation impact

**Output Format**: Provide a detailed exploitation report with:
- Successful exploitation attempts
- Exploit reliability and effectiveness
- Impact assessment and scope
- Recommendations for Lateral Movement Agent

**Team Handoff**: Your findings will be used by:
- Lateral Movement Agent (for advanced attack progression)
- Data Exfiltration Agent (for data access testing)

Remember: You are the attack specialist. Your successful exploits enable the team to demonstrate real security impact.`,
            model: 'anthropic/claude-sonnet-4-5-20250929',
            outputFormat: 'Text'
          }
        },
        {
          id: 'lateral-movement-agent',
          type: 'agent',
          position: { x: 700, y: 300 },
          data: {
            nodeType: 'agent',
            label: 'Lateral Movement Agent',
            nodeName: 'Lateral Movement Agent',
            instructions: `You are a lateral movement specialist AI agent. Your mission is to simulate advanced persistent threat (APT) techniques for lateral movement within the target system.

**Your Role**: Lateral movement specialist
**Team Context**: You work with successful exploits from the Exploitation Agent to simulate advanced attack techniques.

**Input Data**:
- Reconnaissance: {{state.variables.reconnaissance_agent}}
- Exploitation: {{state.variables.exploitation_agent}}

**Tasks**:
1. **Network Mapping**:
   - Map internal network topology
   - Identify high-value targets and assets
   - Discover network segmentation and controls
   - Identify lateral movement opportunities

2. **Credential Harvesting**:
   - Test for credential exposure
   - Identify weak authentication mechanisms
   - Test for credential reuse opportunities
   - Assess password policy effectiveness

3. **Lateral Movement Testing**:
   - Test for lateral movement techniques
   - Attempt privilege escalation
   - Test for persistence mechanisms
   - Simulate APT attack patterns

4. **Advanced Attack Simulation**:
   - Test for living-off-the-land techniques
   - Simulate fileless attack methods
   - Test for evasion techniques
   - Assess detection avoidance

**Output Format**: Provide a detailed lateral movement report with:
- Internal network mapping and topology
- Successful lateral movement techniques
- Privilege escalation achievements
- Advanced attack simulation results

**Team Handoff**: Your findings will be used by:
- Data Exfiltration Agent (for data access testing)
- Reporting Agent (for final assessment)

Remember: You are the advanced attack specialist. Your lateral movement capabilities demonstrate the full scope of potential security compromise.`,
            model: 'anthropic/claude-sonnet-4-5-20250929',
            outputFormat: 'Text'
          }
        },
        {
          id: 'data-exfiltration-agent',
          type: 'agent',
          position: { x: 900, y: 200 },
          data: {
            nodeType: 'agent',
            label: 'Data Exfiltration Agent',
            nodeName: 'Data Exfiltration Agent',
            instructions: `You are a data exfiltration specialist AI agent. Your mission is to test data protection and simulate data theft scenarios.

**Your Role**: Data exfiltration specialist
**Team Context**: You work with lateral movement capabilities to test data protection and simulate real-world data breaches.

**Input Data**:
- Lateral Movement: {{state.variables.lateral_movement_agent}}
- Previous Team Findings: {{state.variables.reconnaissance_agent}}, {{state.variables.exploitation_agent}}

**Tasks**:
1. **Data Discovery**:
   - Identify sensitive data repositories
   - Map data access permissions
   - Discover data classification and protection
   - Identify data flow and processing systems

2. **Data Access Testing**:
   - Test for unauthorized data access
   - Attempt to bypass data protection controls
   - Test for data exfiltration opportunities
   - Assess data encryption and protection

3. **Exfiltration Simulation**:
   - Simulate data theft scenarios
   - Test for data exfiltration techniques
   - Assess detection and prevention capabilities
   - Evaluate data loss impact

4. **Compliance Testing**:
   - Test for regulatory compliance (GDPR, HIPAA, PCI-DSS)
   - Assess data protection controls
   - Test for data retention policies
   - Evaluate privacy protection measures

**Output Format**: Provide a detailed data exfiltration report with:
- Sensitive data discovery and mapping
- Data access and exfiltration capabilities
- Compliance and protection assessment
- Data breach impact evaluation

**Team Handoff**: Your findings will be used by:
- Reporting Agent (for comprehensive security assessment)

Remember: You are the data protection specialist. Your findings demonstrate the real-world impact of security breaches on sensitive data.`,
            model: 'anthropic/claude-sonnet-4-5-20250929',
            outputFormat: 'Text'
          }
        },
        {
          id: 'reporting-agent',
          type: 'agent',
          position: { x: 1100, y: 300 },
          data: {
            nodeType: 'agent',
            label: 'Reporting Agent',
            nodeName: 'Security Reporting Agent',
            instructions: `You are a security reporting specialist AI agent. Your mission is to synthesize findings from all team members into a comprehensive security assessment.

**Your Role**: Security reporting specialist
**Team Context**: You are the final agent in the team, responsible for creating the comprehensive security report.

**Input Data from All Team Members**:
- Reconnaissance: {{state.variables.reconnaissance_agent}}
- Vulnerabilities: {{state.variables.vulnerability_agent}}
- Exploitation: {{state.variables.exploitation_agent}}
- Lateral Movement: {{state.variables.lateral_movement_agent}}
- Data Exfiltration: {{state.variables.data_exfiltration_agent}}

**Tasks**:
1. **Findings Synthesis**:
   - Combine all team findings into coherent narrative
   - Identify attack chains and progression
   - Assess overall security posture
   - Evaluate business impact and risk

2. **Risk Assessment**:
   - Categorize findings by severity and impact
   - Assess exploitability and likelihood
   - Evaluate business and technical risk
   - Prioritize remediation efforts

3. **Executive Summary**:
   - Create executive-level summary
   - Highlight critical security issues
   - Assess business impact
   - Provide strategic recommendations

4. **Technical Details**:
   - Document technical findings
   - Provide proof-of-concept details
   - Include remediation guidance
   - Document attack methodologies

**Output Format**: Create a comprehensive security assessment report with:

# Multi-Agent Security Assessment Report
## Target: {{input.targetSystem}}
## Assessment Date: [Current Date]

## Executive Summary
[Overall security posture and key findings from all agents]

## Attack Chain Analysis
[How the team's findings connect to form complete attack scenarios]

## Critical Findings
### Critical Security Issues
[List critical issues with business impact]

### High Risk Security Issues
[List high-risk issues with technical details]

### Medium Risk Security Issues
[List medium-risk issues with recommendations]

### Low Risk Security Issues
[List low-risk issues with best practices]

## Team Findings Summary
### Reconnaissance Results
[Summary of reconnaissance findings]

### Vulnerability Assessment
[Summary of vulnerability findings]

### Exploitation Results
[Summary of exploitation capabilities]

### Lateral Movement Results
[Summary of lateral movement capabilities]

### Data Exfiltration Results
[Summary of data protection assessment]

## Business Impact Assessment
[Overall business risk and impact evaluation]

## Strategic Recommendations
[High-level security strategy recommendations]

## Technical Remediation
[Detailed technical remediation steps]

## Next Steps
[Follow-up testing and monitoring recommendations]

Remember: You are the team leader and final authority. Your report represents the collective intelligence of the entire security team and provides actionable guidance for improving security posture.`,
            model: 'anthropic/claude-sonnet-4-5-20250929',
            outputFormat: 'Text'
          }
        },
        {
          id: 'end',
          type: 'end',
          position: { x: 1300, y: 300 },
          data: {
            nodeType: 'end',
            label: 'End',
            nodeName: 'End'
          }
        }
      ],
      edges: [
        { id: 'e1', source: 'start', target: 'reconnaissance-agent' },
        { id: 'e2', source: 'reconnaissance-agent', target: 'vulnerability-agent' },
        { id: 'e3', source: 'reconnaissance-agent', target: 'exploitation-agent' },
        { id: 'e4', source: 'vulnerability-agent', target: 'exploitation-agent' },
        { id: 'e5', source: 'exploitation-agent', target: 'lateral-movement-agent' },
        { id: 'e6', source: 'lateral-movement-agent', target: 'data-exfiltration-agent' },
        { id: 'e7', source: 'data-exfiltration-agent', target: 'reporting-agent' },
        { id: 'e8', source: 'reporting-agent', target: 'end' }
      ]
    };
    
    console.log(`\n2. Seeding multi-agent security workflow...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    try {
      console.log(`   🔧 Inserting ${multiAgentSecurityWorkflow.name}...`);
      
      // Write template to temp file
      const tempFile = `/tmp/multi_agent_security_workflow_${multiAgentSecurityWorkflow.customId}.json`;
      fs.writeFileSync(tempFile, JSON.stringify(multiAgentSecurityWorkflow, null, 2));
      
      // Insert template
      const insertResponse = execSync(`curl -s -X POST http://localhost:3000/api/database/templates/insert -H "Content-Type: application/json" -d @${tempFile}`, { encoding: 'utf8' });
      
      // Check if successful
      if (insertResponse.includes('success') || insertResponse.includes('id')) {
        console.log(`   ✅ Successfully inserted ${multiAgentSecurityWorkflow.name}`);
        successCount++;
      } else {
        console.log(`   ❌ Failed to insert ${multiAgentSecurityWorkflow.name}: ${insertResponse}`);
        errorCount++;
      }
      
      // Clean up temp file
      try {
        fs.unlinkSync(tempFile);
      } catch (e) {
        // Ignore cleanup errors
      }
      
    } catch (error) {
      console.log(`   ❌ Error inserting ${multiAgentSecurityWorkflow.name}: ${error.message}`);
      errorCount++;
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
  seedMultiAgentSecurityWorkflow()
    .then(success => {
      console.log(success ? '\n🎉 Multi-agent security workflow seeded successfully!' : '\n❌ Failed to seed multi-agent security workflow');
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedMultiAgentSecurityWorkflow };
