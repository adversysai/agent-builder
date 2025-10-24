export class FirecrawlMCPClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      // Test Firecrawl API directly
      const response = await fetch('https://api.firecrawl.dev/v0/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'https://example.com',
          formats: ['markdown'],
          onlyMainContent: true
        })
      });

      if (response.ok) {
        return { success: true };
      } else {
        const error = await response.text();
        return { success: false, error: `Firecrawl API error: ${response.status} - ${error}` };
      }
    } catch (error) {
      return { 
        success: false, 
        error: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  async getTools(): Promise<any[]> {
    return [
      {
        name: 'scrape_url',
        description: 'Scrape a URL and extract content using Firecrawl',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'The URL to scrape'
            },
            formats: {
              type: 'array',
              items: { type: 'string' },
              description: 'Output formats (markdown, html, text)',
              default: ['markdown']
            },
            onlyMainContent: {
              type: 'boolean',
              description: 'Extract only main content',
              default: true
            }
          },
          required: ['url']
        }
      },
      {
        name: 'crawl_website',
        description: 'Crawl a website starting from a URL',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'The starting URL to crawl'
            },
            maxDepth: {
              type: 'number',
              description: 'Maximum crawl depth',
              default: 2
            },
            limit: {
              type: 'number',
              description: 'Maximum number of pages to crawl',
              default: 10
            }
          },
          required: ['url']
        }
      }
    ];
  }

  async executeTool(toolName: string, parameters: any): Promise<any> {
    try {
      switch (toolName) {
        case 'scrape_url':
          return await this.scrapeUrl(parameters);
        case 'crawl_website':
          return await this.crawlWebsite(parameters);
        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }
    } catch (error) {
      throw new Error(`Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async scrapeUrl(params: { url: string; formats?: string[]; onlyMainContent?: boolean }) {
    const response = await fetch('https://api.firecrawl.dev/v0/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: params.url,
        formats: params.formats || ['markdown'],
        onlyMainContent: params.onlyMainContent !== false
      })
    });

    if (!response.ok) {
      throw new Error(`Firecrawl API error: ${response.status}`);
    }

    return await response.json();
  }

  private async crawlWebsite(params: { url: string; maxDepth?: number; limit?: number }) {
    const response = await fetch('https://api.firecrawl.dev/v0/crawl', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: params.url,
        maxDepth: params.maxDepth || 2,
        limit: params.limit || 10
      })
    });

    if (!response.ok) {
      throw new Error(`Firecrawl API error: ${response.status}`);
    }

    return await response.json();
  }
}
