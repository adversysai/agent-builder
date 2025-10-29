# GitHub MCP Integration Guide

## Overview

GitHub MCP integration enables powerful AI detection and security analysis workflows by connecting to GitHub's API for repository management, code search, and security advisory analysis.

## Features

### 🔍 **AI Detection Capabilities**
- **AI Asset Discovery**: Find AI models, frameworks, and integrations across repositories
- **Shadow AI Detection**: Identify unauthorized AI usage and create security issues
- **Compliance Checking**: Ensure AI usage meets security standards
- **Data Exposure Scanning**: Detect sensitive data being sent to AI services
- **Comprehensive Auditing**: Complete AI security assessment workflows

### 🛠️ **GitHub API Tools**
- **Code Search**: Search repositories for AI patterns and usage
- **Repository Management**: List and analyze repositories
- **Security Advisories**: Check for AI-related security issues
- **Issue Creation**: Automatically create security issues for violations
- **Content Analysis**: Read and analyze file contents

## Setup

### 1. GitHub Token Configuration

Add your GitHub personal access token to your environment:

```bash
# .env.local
GITHUB_TOKEN=your_github_personal_access_token_here
```

**Required Scopes:**
- `repo` - Access to repositories
- `read:org` - Read organization data
- `read:user` - Read user data

### 2. GitHub MCP Server

The GitHub MCP server is automatically configured and available in:
- **Settings Panel**: MCP Registry section
- **Workflow Canvas**: MCP node selector
- **AI Chat**: Recommended for code analysis workflows

## AI Detection Templates

### 1. AI Asset Discovery Scanner
**Purpose**: Comprehensive AI usage detection across repositories
**Features**:
- Scans repositories for AI models (OpenAI, Anthropic, Google, etc.)
- Detects AI frameworks (LangChain, LlamaIndex, Transformers)
- Identifies MCP servers and integrations
- Generates AI inventory reports

**Input Variables**:
- `owner`: GitHub organization or username
- `includePrivate`: Include private repositories (optional)

### 2. Shadow AI Detection System
**Purpose**: Find unauthorized AI usage and create security issues
**Features**:
- Searches for unauthorized AI services
- Compares against approved AI list
- Creates security issues for violations
- Generates violation reports

**Input Variables**:
- `owner`: GitHub organization to scan
- `approvedAIList`: Comma-separated list of approved AI services

### 3. AI Security Compliance Checker
**Purpose**: Ensure AI usage meets security standards
**Features**:
- Checks AI usage against compliance rules
- Analyzes security advisories
- Assesses compliance status
- Creates compliance issues for violations

**Input Variables**:
- `owner`: GitHub organization to check
- `complianceRules`: Compliance rules and requirements

### 4. AI Data Exposure Scanner
**Purpose**: Detect sensitive data being sent to AI services
**Features**:
- Scans for sensitive data in AI calls
- Identifies PII, PHI, credentials, and financial data
- Assesses exposure risk levels
- Creates security issues for high-risk exposures

**Input Variables**:
- `owner`: GitHub organization to scan
- `sensitiveDataTypes`: Types of sensitive data to detect

### 5. Comprehensive AI Security Audit
**Purpose**: Complete AI security assessment
**Features**:
- Combines all detection methods
- Provides executive summary
- Generates comprehensive audit reports
- Creates master security issues

**Input Variables**:
- `owner`: GitHub organization to audit
- `complianceRules`: Compliance rules and requirements

## Usage Examples

### Basic AI Detection Workflow

```javascript
// 1. List repositories
const repos = await githubMCP.listRepositories({
  owner: 'your-org',
  type: 'all',
  sort: 'updated'
});

// 2. Search for AI patterns
const aiPatterns = await githubMCP.searchCode({
  query: 'openai OR anthropic OR gpt- OR claude-',
  owner: 'your-org',
  repo: 'repository-name'
});

// 3. Analyze findings
const analysis = await agent.analyze({
  instructions: 'Analyze AI usage patterns and assess risks',
  data: aiPatterns
});
```

### Shadow AI Detection

```javascript
// 1. Search for unauthorized AI usage
const unauthorizedAI = await githubMCP.searchCode({
  query: 'api.openai.com OR api.anthropic.com OR api.groq.com',
  owner: 'your-org',
  repo: 'repository-name'
});

// 2. Check against approved list
const violations = await agent.identifyViolations({
  findings: unauthorizedAI,
  approvedList: 'openai,anthropic'
});

// 3. Create security issue if violations found
if (violations.length > 0) {
  await githubMCP.createIssue({
    owner: 'your-org',
    repo: 'repository-name',
    title: '🚨 Shadow AI Detection: Unauthorized AI Usage Found',
    body: `Violations found: ${violations.join(', ')}`,
    labels: ['security', 'shadow-ai', 'violation']
  });
}
```

## Security Considerations

### Data Protection
- **Sensitive Data**: Be cautious when scanning repositories with sensitive information
- **Access Control**: Ensure GitHub token has appropriate scopes
- **Rate Limits**: GitHub API has rate limits; workflows handle this automatically

### Compliance
- **Privacy**: Respect user privacy when scanning repositories
- **Authorization**: Only scan repositories you have permission to access
- **Data Retention**: Consider data retention policies for audit reports

## Troubleshooting

### Common Issues

1. **GitHub Token Not Set**
   ```
   Error: GITHUB_TOKEN not configured
   ```
   **Solution**: Add `GITHUB_TOKEN=your_token` to `.env.local`

2. **Rate Limit Exceeded**
   ```
   Error: GitHub API rate limit exceeded
   ```
   **Solution**: Wait for rate limit reset or reduce scan scope

3. **Repository Access Denied**
   ```
   Error: Repository not found or access denied
   ```
   **Solution**: Check repository permissions and token scopes

### Debug Mode

Enable debug logging to troubleshoot issues:

```javascript
// Set debug environment variable
process.env.DEBUG = 'github-mcp:*';
```

## Best Practices

### 1. **Incremental Scanning**
- Start with small repository sets
- Use pagination for large organizations
- Implement rate limiting for large scans

### 2. **Security Issue Management**
- Use consistent labeling for security issues
- Include detailed violation information
- Set up notifications for critical findings

### 3. **Compliance Monitoring**
- Regular compliance checks
- Automated violation detection
- Executive reporting

### 4. **Data Protection**
- Minimize sensitive data exposure
- Use secure token storage
- Implement access controls

## Advanced Usage

### Custom AI Detection Patterns

```javascript
// Custom search patterns for specific AI services
const customPatterns = {
  openai: 'openai.com OR gpt- OR text-davinci',
  anthropic: 'anthropic.com OR claude-',
  google: 'generativelanguage.googleapis.com OR gemini-',
  frameworks: 'langchain OR llamaindex OR transformers'
};
```

### Integration with CI/CD

```yaml
# GitHub Actions workflow
name: AI Security Scan
on: [push, pull_request]
jobs:
  ai-security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run AI Security Scan
        run: |
          # Execute AI detection workflow
          node scripts/ai-security-scan.js
```

## Support

For issues and questions:
- **Documentation**: Check this guide and inline help
- **GitHub Issues**: Report bugs and feature requests
- **Community**: Join our Discord for discussions

## Changelog

### v1.0.0 - Initial Release
- ✅ GitHub MCP server integration
- ✅ 5 AI detection security templates
- ✅ Code search and repository analysis
- ✅ Security advisory integration
- ✅ Automated issue creation
- ✅ Comprehensive audit workflows
