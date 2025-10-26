/**
 * Conversation History Management for AI Workflow Generation
 * Handles multi-turn conversations with Claude for iterative workflow refinement
 */

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  workflow?: any;
  thinking?: string;
  error?: string;
}

export interface ConversationState {
  messages: ConversationMessage[];
  currentWorkflow: any | null;
  iteration: number;
  tokenUsage: {
    input: number;
    output: number;
    total: number;
  };
}

export class ConversationManager {
  private state: ConversationState;
  private maxMessages: number = 20; // Limit conversation history
  private maxTokens: number = 50000; // Token limit for context

  constructor() {
    this.state = {
      messages: [],
      currentWorkflow: null,
      iteration: 0,
      tokenUsage: {
        input: 0,
        output: 0,
        total: 0
      }
    };
  }

  /**
   * Add a user message to the conversation
   */
  addUserMessage(content: string): void {
    this.state.messages.push({
      role: 'user',
      content,
      timestamp: new Date()
    });
    
    this.trimConversation();
  }

  /**
   * Add an assistant response to the conversation
   */
  addAssistantMessage(content: string, workflow?: any, thinking?: string, error?: string): void {
    this.state.messages.push({
      role: 'assistant',
      content,
      timestamp: new Date(),
      workflow,
      thinking,
      error
    });

    if (workflow) {
      this.state.currentWorkflow = workflow;
      this.state.iteration++;
    }

    this.trimConversation();
  }

  /**
   * Get conversation history for API calls
   */
  getConversationHistory(): any[] {
    return this.state.messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }

  /**
   * Get the current workflow being discussed
   */
  getCurrentWorkflow(): any | null {
    return this.state.currentWorkflow;
  }

  /**
   * Get conversation context for refinement
   */
  getConversationContext(): string {
    const recentMessages = this.state.messages.slice(-6); // Last 6 messages
    const context = recentMessages.map(msg => 
      `${msg.role}: ${msg.content}`
    ).join('\n');
    
    return context;
  }

  /**
   * Check if we need to start a new conversation
   */
  shouldStartNewConversation(): boolean {
    // Start new conversation if:
    // 1. No messages yet
    // 2. Last message was an error
    // 3. Token usage is too high
    // 4. Too many iterations
    
    if (this.state.messages.length === 0) return true;
    
    const lastMessage = this.state.messages[this.state.messages.length - 1];
    if (lastMessage.error) return true;
    
    if (this.state.tokenUsage.total > this.maxTokens) return true;
    
    if (this.state.iteration > 10) return true;
    
    return false;
  }

  /**
   * Generate refinement prompt based on conversation history
   */
  generateRefinementPrompt(userInput: string): string {
    const context = this.getConversationContext();
    const currentWorkflow = this.getCurrentWorkflow();
    
    if (!currentWorkflow) {
      return userInput; // First time generation
    }

    // Refinement prompt
    return `Based on our conversation, please modify the workflow:

Current workflow: ${currentWorkflow.name}
${currentWorkflow.description || ''}

Previous context:
${context}

New request: ${userInput}

Please update the workflow according to the new requirements while maintaining the existing structure where possible.`;
  }

  /**
   * Update token usage
   */
  updateTokenUsage(inputTokens: number, outputTokens: number): void {
    this.state.tokenUsage.input += inputTokens;
    this.state.tokenUsage.output += outputTokens;
    this.state.tokenUsage.total += inputTokens + outputTokens;
  }

  /**
   * Get conversation statistics
   */
  getStats(): {
    messageCount: number;
    iteration: number;
    tokenUsage: any;
    hasWorkflow: boolean;
  } {
    return {
      messageCount: this.state.messages.length,
      iteration: this.state.iteration,
      tokenUsage: this.state.tokenUsage,
      hasWorkflow: !!this.state.currentWorkflow
    };
  }

  /**
   * Clear conversation history
   */
  clear(): void {
    this.state = {
      messages: [],
      currentWorkflow: null,
      iteration: 0,
      tokenUsage: {
        input: 0,
        output: 0,
        total: 0
      }
    };
  }

  /**
   * Trim conversation to stay within limits
   */
  private trimConversation(): void {
    if (this.state.messages.length > this.maxMessages) {
      // Keep first message (system context) and last N messages
      const firstMessage = this.state.messages[0];
      const recentMessages = this.state.messages.slice(-(this.maxMessages - 1));
      this.state.messages = [firstMessage, ...recentMessages];
    }
  }

  /**
   * Export conversation for debugging
   */
  exportConversation(): any {
    return {
      ...this.state,
      messages: this.state.messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp.toISOString()
      }))
    };
  }

  /**
   * Import conversation from export
   */
  importConversation(data: any): void {
    this.state = {
      ...data,
      messages: data.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }))
    };
  }
}

/**
 * Global conversation manager instance
 */
export const conversationManager = new ConversationManager();

/**
 * Utility functions for conversation management
 */
export const ConversationUtils = {
  /**
   * Estimate token count for a text
   */
  estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
  },

  /**
   * Check if a prompt is too long for context
   */
  isPromptTooLong(prompt: string, maxTokens: number = 10000): boolean {
    return this.estimateTokens(prompt) > maxTokens;
  },

  /**
   * Truncate text to fit within token limit
   */
  truncateToTokens(text: string, maxTokens: number): string {
    const estimatedTokens = this.estimateTokens(text);
    if (estimatedTokens <= maxTokens) return text;
    
    const ratio = maxTokens / estimatedTokens;
    const targetLength = Math.floor(text.length * ratio);
    
    return text.substring(0, targetLength) + '...';
  },

  /**
   * Generate conversation summary
   */
  generateSummary(messages: ConversationMessage[]): string {
    const userMessages = messages.filter(m => m.role === 'user');
    const assistantMessages = messages.filter(m => m.role === 'assistant');
    
    return `Conversation Summary:
- ${userMessages.length} user messages
- ${assistantMessages.length} assistant responses
- ${assistantMessages.filter(m => m.workflow).length} workflows generated
- ${assistantMessages.filter(m => m.error).length} errors encountered`;
  }
};
