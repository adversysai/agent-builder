import { WorkflowState } from './types';

/**
 * Replace variable references like {{state.variables.node_1.price}} with actual values
 */
export function substituteVariables(text: string, state: WorkflowState): string {
  if (!text) return text;

  // Find all {{variable}} patterns
  const pattern = /\{\{([^}]+)\}\}/g;

  return text.replace(pattern, (match, expression) => {
    try {
      // Clean up the expression
      const cleanExpr = expression.trim();

      // Evaluate the expression against state
      const value = evaluateExpression(cleanExpr, state);

      // Convert value to string
      if (value === null || value === undefined) {
        return match; // Keep original if not found
      }

      if (typeof value === 'object') {
        // Special handling for GitHub MCP responses
        if (expression === 'lastOutput' && value.results && Array.isArray(value.results)) {
          // Try to extract repository name from GitHub MCP response
          const githubResult = value.results.find((result: any) => 
            result.server && result.server.toLowerCase().includes('github')
          );
          
          if (githubResult && githubResult.data && githubResult.data.items) {
            // Extract repository from search results
            const firstItem = githubResult.data.items[0];
            if (firstItem && firstItem.repository) {
              return firstItem.repository.full_name || firstItem.repository.name;
            }
          }
          
          // If no repository found, try to extract from error or other data
          if (githubResult && githubResult.data && githubResult.data.repository) {
            return githubResult.data.repository.full_name || githubResult.data.repository.name;
          }
          
          // If this is a failed list_repositories call, try to extract from the original input
          if (githubResult && githubResult.error && githubResult.error.includes('404')) {
            // Look for repository name in the error context or try to use the original input
            console.log('🔍 GitHub list_repositories failed, trying to extract repo from context');
            // Try to get the original repository from state
            const originalRepo = state.variables?.input?.repository;
            if (originalRepo && typeof originalRepo === 'string') {
              // Extract owner/repo from full GitHub URL
              const githubMatch = originalRepo.match(/https:\/\/github\.com\/([^\/]+)\/([^\/\s]+)/);
              if (githubMatch) {
                const [, owner, repo] = githubMatch;
                return `${owner}/${repo}`;
              }
              return originalRepo;
            }
            // Fallback
            return 'adversysai/adversys-ide';
          }
        }
        
        return JSON.stringify(value);
      }

      return String(value);
    } catch (e) {
      console.warn(`Failed to substitute variable: ${expression}`, e);
      return match; // Keep original on error
    }
  });
}

/**
 * Safely evaluate expression like "state.variables.node_1.price" or simpler "node_1.price"
 */
function evaluateExpression(expression: string, state: WorkflowState): any {
  // Support both patterns:
  // 1. Full: "state.variables.node_1.price"
  // 2. Simple: "node_1.price" (auto-adds state.variables prefix)

  let normalizedExpr = expression;

  // If expression doesn't start with "state", assume it's a simple node reference
  if (!expression.startsWith('state.')) {
    // Check if it's a known shorthand
    if (expression === 'input' || expression.startsWith('input.')) {
      // Support both input.query (maps to state.variables.input.input.query) and input directly
      // Try nested first (for JSON inputs), then direct
      normalizedExpr = `state.variables.${expression}`;
    } else if (expression === 'lastOutput' || expression.startsWith('lastOutput.')) {
      normalizedExpr = `state.variables.${expression}`;
    } else {
      // Assume it's a node reference like "scrape_website.markdown"
      normalizedExpr = `state.variables.${expression}`;
    }
  }

  // Parse dot notation path
  const parts = normalizedExpr.split('.');

  let current: any = { state };

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }

    // Handle array indexing like items[0]
    const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
    if (arrayMatch) {
      const [, arrayName, index] = arrayMatch;
      current = current[arrayName]?.[parseInt(index)];
    } else {
      current = current[part];
    }
  }

  // Repo helper variables: owner, repoName, repoSlug
  const needsRepoVars = (
    normalizedExpr === 'state.variables.owner' ||
    normalizedExpr === 'state.variables.repoName' ||
    normalizedExpr === 'state.variables.repoSlug'
  );
  if (needsRepoVars) {
    const repoUrl = state.variables?.input?.repoUrl || state.variables?.repoUrl || state.variables?.input?.repositoryUrl;
    const { owner, repoName, repoSlug } = deriveRepoVars(String(repoUrl || ''));
    if (normalizedExpr.endsWith('.owner')) return owner || undefined;
    if (normalizedExpr.endsWith('.repoName')) return repoName || undefined;
    if (normalizedExpr.endsWith('.repoSlug')) return repoSlug || undefined;
  }

  // Special handling for input.X pattern - try multiple resolution strategies
  if (current === undefined && normalizedExpr.startsWith('state.variables.input.')) {
    const inputPath = normalizedExpr.replace('state.variables.input.', '');

    // Strategy 1: Try nested .input.input.X (for JSON inputs)
    const nestedValue = state.variables?.input?.input?.[inputPath];
    if (nestedValue !== undefined) {
      return nestedValue;
    }

    // Strategy 2: Try direct variable access (e.g., state.variables.query when input.query is requested)
    if (state.variables?.[inputPath] !== undefined) {
      return state.variables[inputPath];
    }

    // Strategy 3: Try traversing the full nested path manually
    const nestedPath = `state.variables.input.input.${inputPath}`;
    const nestedParts = nestedPath.split('.');
    let nestedCurrent: any = { state };
    for (const part of nestedParts) {
      if (nestedCurrent === null || nestedCurrent === undefined) break;
      nestedCurrent = nestedCurrent[part];
    }
    if (nestedCurrent !== undefined) {
      return nestedCurrent;
    }

    // Strategy 4: Aliases for common repo inputs
    // Map input.repository or input.repo to owner/repo extracted from repoUrl
    if (['repository', 'repo'].includes(inputPath)) {
      const repoUrl = state.variables?.input?.repoUrl || state.variables?.repoUrl || state.variables?.input?.repositoryUrl;
      const { repoSlug } = deriveRepoVars(String(repoUrl || ''));
      if (repoSlug) return repoSlug;
      // If a plain owner/repo was provided somewhere
      const directRepo = state.variables?.input?.repo || state.variables?.repo || state.variables?.input?.repository;
      if (typeof directRepo === 'string') {
        return directRepo;
      }
    }
  }

  return current;
}

/**
 * Extract all variable references from text
 */
export function extractVariableReferences(text: string): string[] {
  if (!text) return [];

  const pattern = /\{\{([^}]+)\}\}/g;
  const matches: string[] = [];
  let match;

  while ((match = pattern.exec(text)) !== null) {
    matches.push(match[1].trim());
  }

  return matches;
}

/**
 * Validate that all variable references exist in state
 */
export function validateVariableReferences(
  text: string,
  state: WorkflowState
): { valid: boolean; missing: string[] } {
  const references = extractVariableReferences(text);
  const missing: string[] = [];

  for (const ref of references) {
    try {
      const value = evaluateExpression(ref, state);
      if (value === undefined) {
        missing.push(ref);
      }
    } catch (e) {
      missing.push(ref);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Get available variables from state for autocomplete/picker
 */
export function getAvailableVariables(state: WorkflowState): Array<{
  path: string;
  value: any;
  type: string;
}> {
  const variables: Array<{ path: string; value: any; type: string }> = [];

  // Add top-level variables
  variables.push({
    path: 'state.variables.input',
    value: state.variables.input,
    type: typeof state.variables.input,
  });

  variables.push({
    path: 'state.variables.lastOutput',
    value: state.variables.lastOutput,
    type: typeof state.variables.lastOutput,
  });

  // Add all custom variables
  Object.keys(state.variables).forEach(key => {
    if (key !== 'input' && key !== 'lastOutput') {
      const value = state.variables[key];
      variables.push({
        path: `state.variables.${key}`,
        value,
        type: typeof value,
      });

      // If it's an object, add nested properties
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        Object.keys(value).forEach(nestedKey => {
          variables.push({
            path: `state.variables.${key}.${nestedKey}`,
            value: value[nestedKey],
            type: typeof value[nestedKey],
          });
        });
      }
    }
  });

  return variables;
}

/**
 * Derive repo helper variables from a GitHub URL
 */
export function deriveRepoVars(repoUrl: string): { owner?: string; repoName?: string; repoSlug?: string } {
  if (!repoUrl || typeof repoUrl !== 'string') return {};
  const match = repoUrl.match(/https:\/\/github\.com\/([^\/]+)\/([^\/#?\s]+)/);
  if (!match) return {};
  const owner = match[1];
  const repoName = match[2];
  return { owner, repoName, repoSlug: `${owner}/${repoName}` };
}
