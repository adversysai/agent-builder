# Zapier MCP Variable Substitution Fix

## Issue
Template variables like `{{input.email_receiver}}` and `{{input.message_body}}` were being passed literally to Zapier MCP tools instead of being substituted with actual values. This caused errors like "Recipient address required" because Zapier received the literal string `{{input.email_receiver}}` instead of an actual email address.

## Root Cause
Variable substitution was happening **AFTER** instruction construction, which meant:
1. Parameters with template variables were used directly
2. Instructions were constructed with literal template strings
3. Zapier received instructions like: `"Send an email to {{input.email_receiver}} with subject..."`

## The Fix
Variable substitution must happen **BEFORE** constructing instructions. The fix adds variable substitution as the first step when processing Zapier MCP parameters.

### Implementation
**Location**: `lib/workflow/executors/mcp.ts`

**In `executeMCPNode` (Zapier-specific executor)**:
```typescript
// Get params from nodeData
let params = nodeData.mcpParams || nodeData.params || {};

// ✅ FIX: Substitute variables BEFORE constructing instructions
if (params && typeof params === 'object') {
  const substitutedParams: any = {};
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string' && (value.includes('{{') || value.includes('${'))) {
      const substituted = substituteVariables(value, state);
      substitutedParams[key] = (substituted !== null && substituted !== undefined && substituted !== value) 
        ? substituted 
        : value;
    } else {
      substitutedParams[key] = value;
    }
  }
  params = substitutedParams;
  console.log('✅ Substituted variables in params:', params);
}

// THEN construct instructions from substituted params
if (!params.instructions && typeof params === 'object' && Object.keys(params).length > 0) {
  // ... construct instructions using substituted params
}
```

**In `executeGenericMCPServer` (generic MCP executor)**:
Same pattern applied - variable substitution happens before instruction construction.

## Why This Matters

### Order Matters
1. ❌ **Wrong Order**: Construct instructions → Substitute variables → Send to Zapier
   - Instructions contain: `"Send email to {{input.email_receiver}}"`
   - Zapier can't parse template variables

2. ✅ **Correct Order**: Substitute variables → Construct instructions → Send to Zapier
   - Params become: `{ to: "test@example.com", ... }`
   - Instructions contain: `"Send email to test@example.com"`
   - Zapier receives valid instructions

### Template Variable Detection
The fix checks for template variables using:
- `value.includes('{{')` - Handlebars/Mustache style
- `value.includes('${')` - Template literal style

Only strings with these patterns are substituted, avoiding unnecessary processing.

### Safety Checks
- Only substitutes if result is not null/undefined
- Only uses substituted value if it's different from original
- Falls back to original value if substitution fails

## Affected Executors
1. ✅ `executeMCPNode` - Main Zapier MCP executor
2. ✅ `executeGenericMCPServer` - Generic MCP executor (for Zapier fallback)

## Testing
After the fix:
- ✅ Template variables are substituted correctly
- ✅ Instructions contain actual values
- ✅ Zapier receives valid instructions
- ✅ Tools execute successfully

## Key Lesson
**Always substitute variables BEFORE using them to construct derived values (like instructions).**

The order of operations matters:
1. Get raw input with template variables
2. Substitute variables → get actual values
3. Use actual values to construct derived data
4. Send to external services

## Related Files
- `lib/workflow/executors/mcp.ts` - Main fix location
- `lib/workflow/variable-substitution.ts` - Variable substitution utility
- `lib/workflow/executors/agent.ts` - Agent executor (may need similar fix if it constructs instructions)

## Date Fixed
November 4, 2025

