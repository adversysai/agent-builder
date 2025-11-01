# FDA Pre-Market Cybersecurity Guide Workflow Generation Prompt

Use this prompt in the AI Workflow Generator to create a comprehensive FDA pre-market cybersecurity analysis workflow.

---

## Prompt Text

Create a comprehensive multi-step workflow for analyzing FDA pre-market cybersecurity guidance documents. The workflow should leverage multiple AI models based on their strengths and use web crawling and search capabilities.

**Workflow Requirements:**

### Step 1: Initial Research and Document Discovery
- Use **Tavily MCP** to search for FDA pre-market cybersecurity guidance documents, regulations, and related materials
- Search queries should include: "FDA pre-market cybersecurity guidance", "medical device cybersecurity FDA", "FDA cybersecurity submission requirements"
- The workflow should start with a Start node that accepts a search query or specific FDA document URL as input
- Use an Agent node with **OpenAI (gpt-4o)** to refine search queries and extract relevant URLs
- Store discovered URLs in workflow variables for later processing

### Step 2: Document Crawling and Content Extraction
- Use **Firecrawl MCP** to crawl FDA websites and extract full content from discovered guidance documents
- For each discovered URL, use Firecrawl's scrape tool to extract the complete document content
- Use a While Loop node to iterate through all discovered URLs
- Store raw document content in workflow variables, maintaining source URLs for reference
- Use **OpenAI (gpt-4o)** in an Agent node to extract document metadata (title, publication date, document type, sections)

### Step 3: Large Document Processing with Gemini
- For each crawled document, use an Agent node with **Google Gemini (gemini-2.5-pro)** to process the full document content
- Gemini should be used because documents can be very long (FDA guidance documents often exceed 100K tokens)
- Task Gemini to: extract key cybersecurity requirements, identify compliance sections, summarize technical requirements, and create structured analysis
- Store Gemini's analysis in variables for each document

### Step 4: Section-by-Section Analysis
- Use a Transform node to split documents into logical sections (using section headers or natural breaks)
- For each section, use **Gemini (gemini-2.5-pro)** again to perform deep analysis:
  - Identify specific cybersecurity controls mentioned
  - Extract compliance requirements
  - Note implementation recommendations
  - Flag any critical security requirements
- Use a While Loop to process all sections
- Aggregate section analyses into comprehensive document summaries

### Step 5: Cross-Document Analysis and Synthesis
- Use **Gemini (gemini-2.5-pro)** to analyze all documents together and identify:
  - Common themes across FDA guidance documents
  - Conflicting requirements (if any)
  - Evolving guidance patterns
  - Compliance checklist items that appear across multiple documents
- This step requires the large context window to process multiple complete documents simultaneously

### Step 6: Structured Summary Generation
- Use **OpenAI (gpt-4o)** to create concise, actionable summaries from Gemini's detailed analysis
- OpenAI should format the output as structured JSON with:
  - Executive summary
  - Key cybersecurity requirements checklist
  - Implementation recommendations
  - Compliance timeline guidance
  - Risk categories and controls
- OpenAI is ideal here because the input is already processed and condensed, fitting within shorter context windows

### Step 7: Compliance Gap Analysis
- Use **OpenAI (gpt-4o)** to compare extracted requirements against a baseline (provided as input variable)
- Generate gap analysis identifying missing controls or requirements
- Format as actionable compliance report

### Step 8: Final Report Assembly
- Use an Agent node with **OpenAI (gpt-4o)** to compile all analyses into a comprehensive FDA pre-market cybersecurity compliance report
- Include: document sources, key findings, requirements checklist, gap analysis, and recommendations
- Output should be formatted for easy consumption (markdown or structured JSON)

### Technical Requirements:
- **Firecrawl MCP**: Use for crawling FDA.gov domains and extracting full document content
- **Tavily MCP**: Use for initial web searches to discover relevant FDA guidance documents
- **OpenAI (gpt-4o)**: Use for tasks requiring shorter context windows - query refinement, metadata extraction, summarization, report formatting
- **Google Gemini (gemini-2.5-pro)**: Use for large document analysis, multi-document synthesis, and deep content analysis requiring large context windows
- Include error handling nodes to manage API failures
- Use conditional logic (If/Else nodes) to route based on document length or analysis results
- Store all intermediate results in workflow variables for traceability

### Workflow Structure:
1. Start node → Accepts: searchQuery (optional), documentUrls (optional), baselineRequirements (optional)
2. Tavily Search → Find relevant FDA documents
3. OpenAI Agent → Refine queries and extract URLs
4. Firecrawl Loop → Crawl all discovered documents
5. OpenAI Agent → Extract metadata
6. Gemini Agent → Process full documents (large context)
7. Transform → Split into sections
8. Gemini Loop → Analyze each section (large context)
9. Gemini Agent → Cross-document analysis (large context)
10. OpenAI Agent → Generate structured summaries
11. OpenAI Agent → Gap analysis
12. OpenAI Agent → Final report assembly
13. End node → Return comprehensive compliance report

Generate this workflow with proper node connections, variable substitutions, and MCP tool configurations.

---

## Usage Instructions

1. Copy the prompt text (everything under "## Prompt Text")
2. Paste it into the AI Workflow Generator chat interface
3. The generator will create a complete workflow with all specified nodes and configurations
4. Ensure you have API keys configured for:
   - OpenAI
   - Google (Gemini)
   - Firecrawl
   - Tavily

