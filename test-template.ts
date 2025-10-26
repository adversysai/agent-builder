import { Workflow } from './lib/workflow/types';

const testTemplate: Workflow = {
  id: 'test-security-template',
  name: 'Test Security Template',
  description: 'A simple test template',
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
        ],
      },
    },
    {
      id: 'end',
      type: 'end',
      position: { x: 400, y: 200 },
      data: {
        nodeType: 'end',
        label: 'End',
        nodeName: 'End',
      },
    },
  ],
  edges: [
    { id: 'e1', source: 'start', target: 'end' },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export { testTemplate };
