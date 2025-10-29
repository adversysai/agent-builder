/**
 * GitHub MCP Executor
 * 
 * Handles GitHub API operations for AI detection and security analysis
 * Integrates with GitHub's official MCP server for repository management
 */

import { WorkflowNode, WorkflowState } from '../types';
import { substituteVariables } from '../variable-substitution';

export interface GitHubAPIResponse {
  success: boolean;
  data?: any;
  error?: string;
  rateLimit?: {
    remaining: number;
    reset: number;
  };
}

/**
 * Execute GitHub MCP Node
 * Handles GitHub API operations for AI detection workflows
 */
export async function executeGitHubMCPNode(
  node: WorkflowNode,
  state: WorkflowState,
  githubToken?: string
): Promise<GitHubAPIResponse> {
  const { data } = node;
  const nodeData = data as any;
  const action = nodeData.mcpAction || 'search_code';
  const mcpParams = nodeData.mcpParams || {};

  if (!githubToken) {
    return {
      success: false,
      error: 'GitHub token is required for GitHub MCP operations'
    };
  }

  // Substitute variables in mcpParams
  const substitutedParams: any = {};
  for (const key in mcpParams) {
    let substitutedValue = mcpParams[key];
    
    // Only substitute variables if the value is a string
    if (typeof substitutedValue === 'string') {
      substitutedValue = substituteVariables(substitutedValue, state);
      
      // Special handling for GitHub URLs - extract owner/repo from full URLs
      if (substitutedValue && typeof substitutedValue === 'string' && substitutedValue.includes('https://github.com/')) {
        const githubMatch = substitutedValue.match(/https:\/\/github\.com\/([^\/]+)\/([^\/\s]+)/);
        if (githubMatch) {
          const [, owner, repo] = githubMatch;
          substitutedValue = `${owner}/${repo}`;
          console.log('🔍 GitHub MCP - Extracted owner/repo from URL:', substitutedValue);
        }
      }
      
      // Special handling for query parameter - extract repo name from GitHub URL
      if (key === 'query' && substitutedValue && typeof substitutedValue === 'string') {
        // If the query contains a GitHub URL, extract just the owner/repo part
        const githubUrlMatch = substitutedValue.match(/repo:https:\/\/github\.com\/([^\/]+\/[^\/\s]+)/);
        if (githubUrlMatch) {
          const repoName = githubUrlMatch[1];
          substitutedValue = substitutedValue.replace(
            `repo:https://github.com/${repoName}`,
            `repo:${repoName}`
          );
          console.log('🔍 GitHub MCP - Extracted repo name from URL:', repoName);
        }
      }
    }
    
    substitutedParams[key] = substitutedValue;
  }

  console.log('🔍 GitHub MCP - Original params:', mcpParams);
  console.log('🔍 GitHub MCP - Substituted params:', substitutedParams);

  try {
    switch (action) {
      case 'search_code':
        return await searchCode(substitutedParams, githubToken);
      
      case 'list_repositories':
        return await listRepositories(substitutedParams, githubToken);
      
      case 'get_repository_content':
        return await getRepositoryContent(substitutedParams, githubToken);
      
      case 'list_global_security_advisories':
        return await listGlobalSecurityAdvisories(substitutedParams, githubToken);
      
      case 'list_repository_security_advisories':
        return await listRepositorySecurityAdvisories(substitutedParams, githubToken);
      
      case 'create_issue':
        return await createIssue(substitutedParams, githubToken);
      
      case 'add_issue_comment':
        return await addIssueComment(substitutedParams, githubToken);
      
      default:
        return {
          success: false,
          error: `Unknown GitHub action: ${action}`
        };
    }
  } catch (error) {
    console.error('GitHub MCP execution error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Search code in repositories for AI patterns
 */
async function searchCode(nodeData: any, githubToken: string): Promise<GitHubAPIResponse> {
  const { query, owner, repo, language, sort = 'indexed', order = 'desc' } = nodeData;
  
  if (!query) {
    return {
      success: false,
      error: 'Search query is required'
    };
  }

  console.log('🔍 GitHub searchCode - query:', query);
  console.log('🔍 GitHub searchCode - owner:', owner);
  console.log('🔍 GitHub searchCode - repo:', repo);

  // If the query already contains repo: syntax, use it as-is
  // Otherwise, construct the search query
  let searchQuery = query;
  if (repo && !query.includes('repo:')) {
    searchQuery = `${query} repo:${owner}/${repo}`;
  } else if (owner && !query.includes('user:') && !query.includes('repo:')) {
    searchQuery = `${query} user:${owner}`;
  }

  console.log('🔍 GitHub searchCode - final searchQuery:', searchQuery);

  const url = new URL('https://api.github.com/search/code');
  url.searchParams.set('q', searchQuery);
  url.searchParams.set('sort', sort);
  url.searchParams.set('order', order);
  if (language) {
    url.searchParams.set('language', language);
  }

  console.log('🔍 GitHub searchCode - API URL:', url.toString());

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${githubToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Dexflow-AI-Detection/1.0'
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('🔍 GitHub API error:', response.status, errorData);
    return {
      success: false,
      error: `GitHub API error: ${response.status} ${errorData.message || response.statusText}`
    };
  }

  const data = await response.json();
  
  console.log('🔍 GitHub searchCode - results count:', data.total_count);
  
  return {
    success: true,
    data: {
      totalCount: data.total_count,
      items: data.items,
      query: searchQuery
    },
    rateLimit: {
      remaining: parseInt(response.headers.get('x-ratelimit-remaining') || '0'),
      reset: parseInt(response.headers.get('x-ratelimit-reset') || '0')
    }
  };
}

/**
 * List repositories for a user or organization
 */
async function listRepositories(nodeData: any, githubToken: string): Promise<GitHubAPIResponse> {
  const { owner, type = 'all', sort = 'updated', direction = 'desc', perPage = 30 } = nodeData;
  
  if (!owner) {
    return {
      success: false,
      error: 'Owner is required'
    };
  }

  const url = new URL(`https://api.github.com/users/${owner}/repos`);
  url.searchParams.set('type', type);
  url.searchParams.set('sort', sort);
  url.searchParams.set('direction', direction);
  url.searchParams.set('per_page', perPage.toString());

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${githubToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Dexflow-AI-Detection/1.0'
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return {
      success: false,
      error: `GitHub API error: ${response.status} ${errorData.message || response.statusText}`
    };
  }

  const data = await response.json();
  
  return {
    success: true,
    data: {
      repositories: data,
      count: data.length
    },
    rateLimit: {
      remaining: parseInt(response.headers.get('x-ratelimit-remaining') || '0'),
      reset: parseInt(response.headers.get('x-ratelimit-reset') || '0')
    }
  };
}

/**
 * Get repository content (file contents)
 */
async function getRepositoryContent(nodeData: any, githubToken: string): Promise<GitHubAPIResponse> {
  const { owner, repo, path, ref } = nodeData;
  
  if (!owner || !repo || !path) {
    return {
      success: false,
      error: 'Owner, repo, and path are required'
    };
  }

  const url = new URL(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`);
  if (ref) {
    url.searchParams.set('ref', ref);
  }

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${githubToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Dexflow-AI-Detection/1.0'
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return {
      success: false,
      error: `GitHub API error: ${response.status} ${errorData.message || response.statusText}`
    };
  }

  const data = await response.json();
  
  return {
    success: true,
    data: {
      content: data.content,
      encoding: data.encoding,
      size: data.size,
      sha: data.sha,
      path: data.path
    },
    rateLimit: {
      remaining: parseInt(response.headers.get('x-ratelimit-remaining') || '0'),
      reset: parseInt(response.headers.get('x-ratelimit-reset') || '0')
    }
  };
}

/**
 * List global security advisories
 */
async function listGlobalSecurityAdvisories(nodeData: any, githubToken: string): Promise<GitHubAPIResponse> {
  const { 
    type, 
    severity, 
    ecosystem, 
    cveId, 
    ghsaId, 
    isWithdrawn, 
    published, 
    updated, 
    modified,
    sort = 'updated',
    direction = 'desc',
    perPage = 30
  } = nodeData;

  const url = new URL('https://api.github.com/advisories');
  
  // Add query parameters
  if (type) url.searchParams.set('type', type);
  if (severity) url.searchParams.set('severity', severity);
  if (ecosystem) url.searchParams.set('ecosystem', ecosystem);
  if (cveId) url.searchParams.set('cve_id', cveId);
  if (ghsaId) url.searchParams.set('ghsa_id', ghsaId);
  if (isWithdrawn !== undefined) url.searchParams.set('is_withdrawn', isWithdrawn.toString());
  if (published) url.searchParams.set('published', published);
  if (updated) url.searchParams.set('updated', updated);
  if (modified) url.searchParams.set('modified', modified);
  
  url.searchParams.set('sort', sort);
  url.searchParams.set('direction', direction);
  url.searchParams.set('per_page', perPage.toString());

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${githubToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Dexflow-AI-Detection/1.0'
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return {
      success: false,
      error: `GitHub API error: ${response.status} ${errorData.message || response.statusText}`
    };
  }

  const data = await response.json();
  
  return {
    success: true,
    data: {
      advisories: data,
      count: data.length
    },
    rateLimit: {
      remaining: parseInt(response.headers.get('x-ratelimit-remaining') || '0'),
      reset: parseInt(response.headers.get('x-ratelimit-reset') || '0')
    }
  };
}

/**
 * List repository security advisories
 */
async function listRepositorySecurityAdvisories(nodeData: any, githubToken: string): Promise<GitHubAPIResponse> {
  const { owner, repo, state, sort = 'updated', direction = 'desc' } = nodeData;
  
  if (!owner || !repo) {
    return {
      success: false,
      error: 'Owner and repo are required'
    };
  }

  const url = new URL(`https://api.github.com/repos/${owner}/${repo}/security-advisories`);
  if (state) url.searchParams.set('state', state);
  url.searchParams.set('sort', sort);
  url.searchParams.set('direction', direction);

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${githubToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Dexflow-AI-Detection/1.0'
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return {
      success: false,
      error: `GitHub API error: ${response.status} ${errorData.message || response.statusText}`
    };
  }

  const data = await response.json();
  
  return {
    success: true,
    data: {
      advisories: data,
      count: data.length
    },
    rateLimit: {
      remaining: parseInt(response.headers.get('x-ratelimit-remaining') || '0'),
      reset: parseInt(response.headers.get('x-ratelimit-reset') || '0')
    }
  };
}

/**
 * Create a new issue
 */
async function createIssue(nodeData: any, githubToken: string): Promise<GitHubAPIResponse> {
  const { owner, repo, title, body, labels, assignees } = nodeData;
  
  if (!owner || !repo || !title) {
    return {
      success: false,
      error: 'Owner, repo, and title are required'
    };
  }

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${githubToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'Dexflow-AI-Detection/1.0'
    },
    body: JSON.stringify({
      title,
      body,
      labels: labels || [],
      assignees: assignees || []
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return {
      success: false,
      error: `GitHub API error: ${response.status} ${errorData.message || response.statusText}`
    };
  }

  const data = await response.json();
  
  return {
    success: true,
    data: {
      issue: data,
      number: data.number,
      url: data.html_url
    },
    rateLimit: {
      remaining: parseInt(response.headers.get('x-ratelimit-remaining') || '0'),
      reset: parseInt(response.headers.get('x-ratelimit-reset') || '0')
    }
  };
}

/**
 * Add comment to an issue
 */
async function addIssueComment(nodeData: any, githubToken: string): Promise<GitHubAPIResponse> {
  const { owner, repo, issueNumber, body } = nodeData;
  
  if (!owner || !repo || !issueNumber || !body) {
    return {
      success: false,
      error: 'Owner, repo, issue number, and body are required'
    };
  }

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/comments`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${githubToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'Dexflow-AI-Detection/1.0'
    },
    body: JSON.stringify({ body })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return {
      success: false,
      error: `GitHub API error: ${response.status} ${errorData.message || response.statusText}`
    };
  }

  const data = await response.json();
  
  return {
    success: true,
    data: {
      comment: data,
      id: data.id,
      url: data.html_url
    },
    rateLimit: {
      remaining: parseInt(response.headers.get('x-ratelimit-remaining') || '0'),
      reset: parseInt(response.headers.get('x-ratelimit-reset') || '0')
    }
  };
}
