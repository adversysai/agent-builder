const { validateGeneratedWorkflow } = require('./lib/workflow/schemas/workflow-schema.ts');

// Test the generated workflow from the logs
const testWorkflow = {
  "name": "Security Training Material Generator",
  "description": "Analyzes testphp.vulnweb.com to create comprehensive security training materials including vulnerability analysis, learning objectives, hands-on exercises, and a complete training guide for security professionals",
  "category": "Security Training",
  "tags": ["security", "education", "training", "vulnerability-analysis", "penetration-testing"],
  "difficulty": "advanced",
  "estimatedTime": "5-7 minutes",
  "nodes": [
    {
      "id": "start",
      "type": "start",
      "position": {"x": 100, "y": 350},
      "data": {
        "nodeType": "start",
        "label": "Start",
        "nodeName": "Start",
        "inputVariables": [
          {
            "name": "targetUrl",
            "type": "string",
            "required": true,
            "description": "URL of testphp.vulnweb.com",
            "default": "http://testphp.vulnweb.com"
          }
        ]
      }
    }
  ],
  "edges": []
};

console.log('Testing validation...');
const result = validateGeneratedWorkflow(testWorkflow);
console.log('Validation result:', result);
