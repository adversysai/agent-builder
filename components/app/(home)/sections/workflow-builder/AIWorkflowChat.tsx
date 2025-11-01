'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Bot, User, Loader2, CheckCircle, AlertCircle, Eye, Download, Sparkles, MessageSquare, Trash2, Globe, BarChart3, ShoppingCart, Calendar, Heart, Braces, ChevronDown, Settings, StopCircle, Edit, Copy, Maximize2, Minimize2, Search, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Workflow } from '@/lib/workflow/types';
import { MarkdownRenderer } from '@/components/shared/MarkdownRenderer';

interface AIWorkflowChatProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyWorkflow: (workflow: Workflow) => void;
  currentWorkflow?: {
    nodes: any[];
    edges: any[];
    name?: string;
    description?: string;
  };
  latestExecution?: {
    id: string;
    status: string;
    nodeResults: Record<string, any>;
    output?: any;
    startedAt: string;
    completedAt?: string;
  };
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  workflow?: Workflow;
  thinking?: string;
  error?: string;
  tokenCount?: {
    input: number;
    output: number;
    total: number;
  };
}

// Utility function to estimate token count (rough approximation)
const estimateTokenCount = (text: string): number => {
  // Rough approximation: 1 token ≈ 4 characters for English text
  return Math.ceil(text.length / 4);
};

// Helper function to truncate node results
const truncateNodeResults = (nodeResults: Record<string, any>): Record<string, any> => {
  const truncated: Record<string, any> = {};
  for (const [nodeId, result] of Object.entries(nodeResults)) {
    truncated[nodeId] = {
      ...result,
      output: typeof result.output === 'string' && result.output.length > 1000
        ? result.output.substring(0, 1000) + `... (truncated, ${result.output.length - 1000} more characters)`
        : result.output
    };
  }
  return truncated;
};

// Helper function to truncate final output
const truncateOutput = (output: any): any => {
  if (typeof output === 'string' && output.length > 2000) {
    return output.substring(0, 2000) + `... (truncated, ${output.length - 2000} more characters)`;
  }
  return output;
};

// Helper function to format execution summary
const formatExecutionSummary = (execution: any): string => {
  const completedAt = execution.completedAt ? new Date(execution.completedAt).toLocaleString() : 'In Progress';
  const nodeCount = Object.keys(execution.nodeResults || {}).length;
  return `Execution ${execution.id} (${execution.status}) - ${nodeCount} nodes - Completed: ${completedAt}`;
};

export default function AIWorkflowChat({ isOpen, onClose, onApplyWorkflow, currentWorkflow, latestExecution }: AIWorkflowChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState('auto');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [hoveredModel, setHoveredModel] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [pendingAction, setPendingAction] = useState<null | 'web_search' | 'workflow_generation'>(null);
  const [showToolMenu, setShowToolMenu] = useState(false);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const toolMenuRef = useRef<HTMLDivElement>(null);

  // Find the last assistant message for copy functionality
  const lastAssistantMessage = messages.filter(m => m.role === 'assistant').pop();

  // Available models for workflow generation
  const availableModels = [
    { id: 'auto', name: 'Auto (Best Available)', description: 'Automatically select the best available model' },
    { id: 'openai', name: 'OpenAI GPT-4o', description: 'Best for analysis and reasoning tasks' },
    { id: 'anthropic', name: 'Anthropic Claude', description: 'Best for complex workflows with MCP tools' },
    { id: 'google', name: 'Google Gemini', description: 'Best for large context and multilingual tasks' },
    { id: 'groq', name: 'Groq (Fastest)', description: 'Fastest response times' },
  ];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle Escape key to close chat
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Handle click outside to close model dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setShowModelDropdown(false);
      }
      if (toolMenuRef.current && !toolMenuRef.current.contains(event.target as Node)) {
        setShowToolMenu(false);
      }
    };

    if (showModelDropdown || showToolMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showModelDropdown, showToolMenu]);

  const handleSendMessage = async () => {
    if (!input.trim() || isGenerating) return;

    const inputTokens = estimateTokenCount(input.trim());
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
      tokenCount: {
        input: inputTokens,
        output: 0,
        total: inputTokens,
      },
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsGenerating(true);

    const controller = new AbortController();
    setAbortController(controller);

    try {
      // Infer intent for status indicator
      const wantsWorkflow = /\b(create|generate|build)\b.*\bworkflow\b/i.test(input);
      const wantsWebSearch = selectedTools.includes('web_search');
      const inferredAction: null | 'web_search' | 'workflow_generation' = wantsWebSearch
        ? 'web_search'
        : wantsWorkflow
          ? 'workflow_generation'
          : null;

      // Add temporary status message in the chat stream
      let statusMessageId: string | null = null;
      if (inferredAction) {
        setPendingAction(inferredAction);
        statusMessageId = `status-${Date.now()}`;
        const statusText = inferredAction === 'web_search'
          ? '🔎 Performing web search...'
          : '🧩 Creating workflow...';
        const statusMessage: ChatMessage = {
          id: statusMessageId,
          role: 'assistant',
          content: statusText,
          timestamp: new Date(),
          tokenCount: { input: 0, output: 0, total: 0 },
        };
        setMessages(prev => [...prev, statusMessage]);
      }
      const response = await fetch('/api/workflows/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: input.trim(),
          conversationHistory: conversationHistory,
          currentWorkflow: currentWorkflow,
          preferredModel: selectedModel, // Pass the selected model
          selectedTools: selectedTools, // Pass selected tools
          executionContext: latestExecution ? {
            executionId: latestExecution.id,
            status: latestExecution.status,
            nodeResults: truncateNodeResults(latestExecution.nodeResults),
            output: truncateOutput(latestExecution.output),
            completedAt: latestExecution.completedAt,
          } : undefined,
        }),
        signal: controller.signal,
      });

      // Check if response is HTML (error page) instead of JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const htmlText = await response.text();
        console.error('Received HTML instead of JSON:', htmlText.substring(0, 200));
        throw new Error('Server returned an error page instead of JSON. Please check the API endpoint.');
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse response as JSON:', jsonError);
        const responseText = await response.text();
        console.error('Response content:', responseText.substring(0, 500));
        throw new Error('Invalid JSON response from server. Please try again.');
      }

      if (!response.ok) {
        // Handle different error types
        if (data.error === 'Claude declined to generate workflow') {
          const errorMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `I understand you're looking for help with a workflow, but I can't assist with that particular request. ${data.suggestion || 'Please try rephrasing your request with more specific, legitimate use cases.'}`,
            timestamp: new Date(),
            error: data.details,
          };
          setMessages(prev => [...prev, errorMessage]);
          return;
        }
        
        // Show more detailed error information
        const errorDetails = data.details || data.validationErrors || data.error;
        const errorMessage = `Failed to generate workflow: ${errorDetails}`;
        console.error('Workflow generation error:', data);
        throw new Error(errorMessage);
      }

      // Remove temporary status message if present
      if (statusMessageId) {
        setMessages(prev => prev.filter(m => m.id !== statusMessageId));
      }
      setPendingAction(null);

      // Handle conversational responses vs workflow generation
      let responseContent: string;
      let workflow: Workflow | undefined;
      
      if (data.isConversational) {
        // This is a conversational response (like "hi" -> "Hello! I'm here to help...")
        responseContent = data.message;
        workflow = undefined;
      } else if (data.workflow) {
        // This is a workflow generation response
        responseContent = 'I\'ve generated a workflow for you! You can preview, apply, or download it.';
        workflow = data.workflow;
      } else {
        // Fallback for unexpected responses
        responseContent = 'I couldn\'t generate a workflow from your request. Please try rephrasing your request.';
        workflow = undefined;
      }
      
      const outputTokens = estimateTokenCount(responseContent);
      const totalTokens = inputTokens + outputTokens;

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseContent,
        timestamp: new Date(),
        workflow: workflow,
        thinking: data.thinking,
        tokenCount: {
          input: inputTokens,
          output: outputTokens,
          total: totalTokens,
        },
      };

      setMessages(prev => [...prev, assistantMessage]);
      setConversationHistory(prev => [...prev, userMessage, assistantMessage]);
    } catch (error: any) {
      // Clear pending status and remove status message if any
      setPendingAction(null);
      setMessages(prev => prev.filter(m => !m.id.startsWith('status-')));
      if (error.name === 'AbortError') {
        console.log('Generation cancelled by user');
        return;
      }
      
      console.error('Workflow generation error:', error);
      
      // Provide more specific error messages based on error type
      let errorContent = 'Sorry, I encountered an error while generating your workflow. Please try again.';
      
      if (error.message.includes('Server returned an error page')) {
        errorContent = 'The server is experiencing issues. Please check if the API endpoint is running correctly.';
      } else if (error.message.includes('Invalid JSON response')) {
        errorContent = 'The server returned an invalid response. Please try again in a moment.';
      } else if (error.message.includes('Failed to generate workflow')) {
        errorContent = 'Failed to generate workflow. Please check your request and try again.';
      } else if (error.message.includes('API key')) {
        errorContent = 'API key issue detected. Please check your configuration.';
      }
      
      const errorTokens = estimateTokenCount(errorContent);
      const totalErrorTokens = inputTokens + errorTokens;

      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorContent,
        timestamp: new Date(),
        error: error.message,
        tokenCount: {
          input: inputTokens,
          output: errorTokens,
          total: totalErrorTokens,
        },
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
      setAbortController(null);
    }
  };

  const handleStopGeneration = () => {
    if (abortController) {
      abortController.abort();
      setIsGenerating(false);
      setAbortController(null);
    }
  };

  const handleEditMessage = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditedContent(content);
  };

  const handleSaveEdit = async (messageId: string) => {
    // Remove messages after the edited one
    const messageIndex = messages.findIndex(m => m.id === messageId);
    const updatedMessages = messages.slice(0, messageIndex);
    
    setMessages(updatedMessages);
    setInput(editedContent);
    setEditingMessageId(null);
    setEditedContent('');
    
    // Trigger new generation
    await handleSendMessage();
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditedContent('');
  };

  const handleCopyMessage = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
      toast.success('Copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy');
    }
  };


  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    // Focus the input field after setting the suggestion
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleApplyWorkflow = (workflow: Workflow) => {
    onApplyWorkflow(workflow);
    onClose();
    toast.success('Workflow applied successfully!');
  };

  const handlePreviewWorkflow = (workflow: Workflow) => {
    // TODO: Implement workflow preview modal
    console.log('Preview workflow:', workflow);
    toast.info('Workflow preview coming soon!');
  };

  const handleDownloadWorkflow = (workflow: Workflow) => {
    const dataStr = JSON.stringify(workflow, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${workflow.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Workflow downloaded!');
  };

  const handleClickOutside = (event: React.MouseEvent) => {
    // Only close if clicking on the backdrop (not the panel content)
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setConversationHistory([]);
    toast.info('Conversation cleared');
  };

  const toggleTool = (toolName: string) => {
    setSelectedTools(prev => 
      prev.includes(toolName) 
        ? prev.filter(t => t !== toolName)
        : [...prev, toolName]
    );
  };

  const availableTools = [
    { id: 'web_search', name: 'Web Search', icon: Search, description: 'Search the web for real-time information' },
    { id: 'data_analysis', name: 'Data Analysis', icon: () => <span className="text-sm">📊</span>, description: 'Analyze and process data' },
    { id: 'workflow_builder', name: 'Workflow Builder', icon: () => <span className="text-sm">🔧</span>, description: 'Create and modify workflows' }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 bg-black-alpha-20"
            onClick={handleClickOutside}
          />
          
          {/* Chat Panel */}
          <motion.div
            initial={{ x: '100%', y: '100%' }}
            animate={{ 
              x: 0, 
              y: 0,
              width: isExpanded ? 'calc(100vw - 80px)' : '480px'
            }}
            exit={{ x: '100%', y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={`h-[80vh] bg-background-base border-l border-border-faint shadow-2xl flex flex-col absolute bottom-0 right-0 ai-chat-interface ${
              isExpanded ? 'max-w-[1400px]' : ''
            }`}
            dir="ltr"
            style={{ direction: 'ltr', textAlign: 'left' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-16 py-12 border-b border-border-faint bg-accent-white">
              <div className="flex items-center gap-12">
                <div className="w-6 h-6 rounded-full bg-heat-100 flex items-center justify-center group">
                  <Sparkles className="w-3 h-3 text-white group-hover:scale-110 transition-transform" />
                </div>
                <h2 className="text-sm font-semibold text-accent-black">AI Workflow Generator</h2>
              </div>
              <div className="flex items-center gap-8">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="px-16 py-8 bg-background-base hover:bg-heat-4 hover:bg-opacity-10 rounded-8 transition-colors group border border-border-faint"
                  title={isExpanded ? "Collapse" : "Expand"}
                >
                  {isExpanded ? (
                    <Minimize2 className="w-6 h-6 text-accent-black group-hover:text-heat-100" />
                  ) : (
                    <Maximize2 className="w-6 h-6 text-accent-black group-hover:text-heat-100" />
                  )}
                </button>
                <button
                  onClick={clearConversation}
                  className="px-16 py-8 bg-background-base hover:bg-heat-4 hover:bg-opacity-10 rounded-8 transition-colors group border border-border-faint"
                  title="Clear conversation"
                >
                  <Trash2 className="w-6 h-6 text-accent-black group-hover:text-heat-100" />
                </button>
                <button
                  onClick={onClose}
                  className="px-16 py-8 bg-background-base hover:bg-accent-crimson hover:bg-opacity-10 rounded-8 transition-colors group border border-border-faint"
                  title="Close AI Generator"
                >
                  <X className="w-6 h-6 text-accent-black group-hover:text-accent-crimson" />
                </button>
              </div>
            </div>

            {/* Execution Context Indicator */}
            {latestExecution && (
              <div className="flex items-center gap-8 px-16 py-8 bg-blue-50 border-b border-blue-200">
                <CheckCircle className="w-14 h-14 text-blue-600" />
                <span className="text-xs text-blue-700">
                  Context: Execution from {new Date(latestExecution.completedAt || latestExecution.startedAt).toLocaleString()}
                </span>
                <button
                  onClick={() => {
                    // Clear execution context by refreshing the component
                    window.location.reload();
                  }}
                  className="ml-auto text-xs text-blue-600 hover:text-blue-700"
                >
                  Clear
                </button>
              </div>
            )}


            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-16 space-y-16" dir="ltr" style={{ direction: 'ltr', textAlign: 'left' }}>
              {messages.length === 0 && (
                <div className="text-center py-24 px-16">
                  <div className="w-16 h-16 mx-auto mb-24 rounded-full bg-heat-4 bg-opacity-10 flex items-center justify-center">
                    <MessageSquare className="w-8 h-8 text-heat-100" />
                  </div>
                  <h3 className="text-lg font-semibold text-accent-black mb-12">
                    {currentWorkflow ? 'Enhance your workflow' : 'Describe your workflow'}
                  </h3>
                  <p className="text-sm text-black-alpha-48 mb-24 max-w-sm mx-auto">
                    {currentWorkflow 
                      ? `I can see your current workflow "${currentWorkflow.name || 'Untitled'}" with ${currentWorkflow.nodes.length} nodes. Tell me what you'd like to add or modify.`
                      : "Tell me what you want your workflow to do and I'll create it for you"
                    }
                  </p>
                  <div className="space-y-12">
                    <p className="font-medium text-sm text-black-alpha-60">
                      {currentWorkflow ? 'Try these enhancements:' : 'Try these examples:'}
                    </p>
                    <div className="grid gap-12 max-w-md mx-auto">
                      {currentWorkflow ? (
                        <>
                          <button
                            onClick={() => handleSuggestionClick("Add error handling and validation to this workflow")}
                            className="group p-16 text-left bg-accent-white border border-border-faint rounded-12 hover:border-heat-100 hover:shadow-sm transition-all duration-200 relative overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-gradient-to-br from-heat-4 to-transparent opacity-0 group-hover:opacity-10 transition-opacity"></div>
                            <div className="flex items-center gap-12 relative">
                              <div className="w-8 h-8 rounded-12 bg-heat-4 bg-opacity-10 flex items-center justify-center">
                                <CheckCircle className="w-4 h-4 text-heat-100" />
                              </div>
                              <div className="flex-1">
                                <span className="text-sm text-accent-black font-medium block">
                                  Add error handling and validation
                                </span>
                                <p className="text-xs text-black-alpha-48 mt-4">
                                  Make the workflow more robust with error handling
                                </p>
                              </div>
                            </div>
                          </button>
                          
                          <button
                            onClick={() => handleSuggestionClick("Add a data processing step to this workflow")}
                            className="group p-16 text-left bg-accent-white border border-border-faint rounded-12 hover:border-heat-100 hover:shadow-sm transition-all duration-200 relative overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-gradient-to-br from-heat-4 to-transparent opacity-0 group-hover:opacity-10 transition-opacity"></div>
                            <div className="flex items-center gap-12 relative">
                              <div className="w-8 h-8 rounded-12 bg-heat-4 bg-opacity-10 flex items-center justify-center">
                                <Braces className="w-4 h-4 text-heat-100" />
                              </div>
                              <div className="flex-1">
                                <span className="text-sm text-accent-black font-medium block">
                                  Add data processing step
                                </span>
                                <p className="text-xs text-black-alpha-48 mt-4">
                                  Transform and process data between steps
                                </p>
                              </div>
                            </div>
                          </button>
                          
                          <button
                            onClick={() => handleSuggestionClick("Add a reporting and analysis step to this workflow")}
                            className="group p-16 text-left bg-accent-white border border-border-faint rounded-12 hover:border-heat-100 hover:shadow-sm transition-all duration-200 relative overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-gradient-to-br from-heat-4 to-transparent opacity-0 group-hover:opacity-10 transition-opacity"></div>
                            <div className="flex items-center gap-12 relative">
                              <div className="w-8 h-8 rounded-12 bg-heat-4 bg-opacity-10 flex items-center justify-center">
                                <BarChart3 className="w-4 h-4 text-heat-100" />
                              </div>
                              <div className="flex-1">
                                <span className="text-sm text-accent-black font-medium block">
                                  Add reporting and analysis
                                </span>
                                <p className="text-xs text-black-alpha-48 mt-4">
                                  Generate insights and reports from the workflow
                                </p>
                              </div>
                            </div>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleSuggestionClick("Scrape a website and summarize the content")}
                          className="group p-16 text-left bg-accent-white border border-border-faint rounded-12 hover:border-heat-100 hover:shadow-sm transition-all duration-200 relative overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-heat-4 to-transparent opacity-0 group-hover:opacity-10 transition-opacity"></div>
                          <div className="flex items-center gap-12 relative">
                            <div className="w-8 h-8 rounded-12 bg-heat-4 bg-opacity-10 flex items-center justify-center">
                              <Globe className="w-4 h-4 text-heat-100" />
                            </div>
                            <div className="flex-1">
                              <span className="text-sm text-accent-black font-medium block">
                                Scrape a website and summarize the content
                              </span>
                              <p className="text-xs text-black-alpha-48 mt-4">
                                Extract and analyze web content automatically
                              </p>
                            </div>
                          </div>
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleSuggestionClick("Research multiple companies and create a report")}
                        className="group p-16 text-left bg-accent-white border border-border-faint rounded-12 hover:border-heat-100 hover:shadow-sm transition-all duration-200 relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-heat-4 to-transparent opacity-0 group-hover:opacity-10 transition-opacity"></div>
                        <div className="flex items-center gap-12 relative">
                          <div className="w-8 h-8 rounded-12 bg-heat-4 bg-opacity-10 flex items-center justify-center">
                            <BarChart3 className="w-4 h-4 text-heat-100" />
                          </div>
                          <div className="flex-1">
                            <span className="text-sm text-accent-black font-medium block">
                              Research multiple companies and create a report
                            </span>
                            <p className="text-xs text-black-alpha-48 mt-4">
                              Gather data from multiple sources and generate insights
                            </p>
                          </div>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => handleSuggestionClick("Monitor prices across different sites")}
                        className="group p-16 text-left bg-accent-white border border-border-faint rounded-12 hover:border-heat-100 hover:shadow-sm transition-all duration-200 relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-heat-4 to-transparent opacity-0 group-hover:opacity-10 transition-opacity"></div>
                        <div className="flex items-center gap-12 relative">
                          <div className="w-8 h-8 rounded-12 bg-heat-4 bg-opacity-10 flex items-center justify-center">
                            <ShoppingCart className="w-4 h-4 text-heat-100" />
                          </div>
                          <div className="flex-1">
                            <span className="text-sm text-accent-black font-medium block">
                              Monitor prices across different sites
                            </span>
                            <p className="text-xs text-black-alpha-48 mt-4">
                              Track and compare prices from various e-commerce sites
                            </p>
                          </div>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => handleSuggestionClick("Create a social media content calendar")}
                        className="group p-16 text-left bg-accent-white border border-border-faint rounded-12 hover:border-heat-100 hover:shadow-sm transition-all duration-200 relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-heat-4 to-transparent opacity-0 group-hover:opacity-10 transition-opacity"></div>
                        <div className="flex items-center gap-12 relative">
                          <div className="w-8 h-8 rounded-12 bg-heat-4 bg-opacity-10 flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-heat-100" />
                          </div>
                          <div className="flex-1">
                            <span className="text-sm text-accent-black font-medium block">
                              Create a social media content calendar
                            </span>
                            <p className="text-xs text-black-alpha-48 mt-4">
                              Generate and schedule social media posts automatically
                            </p>
                          </div>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => handleSuggestionClick("Analyze customer feedback and sentiment")}
                        className="group p-16 text-left bg-accent-white border border-border-faint rounded-12 hover:border-heat-100 hover:shadow-sm transition-all duration-200 relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-heat-4 to-transparent opacity-0 group-hover:opacity-10 transition-opacity"></div>
                        <div className="flex items-center gap-12 relative">
                          <div className="w-8 h-8 rounded-12 bg-heat-4 bg-opacity-10 flex items-center justify-center">
                            <Heart className="w-4 h-4 text-heat-100" />
                          </div>
                          <div className="flex-1">
                            <span className="text-sm text-accent-black font-medium block">
                              Analyze customer feedback and sentiment
                            </span>
                            <p className="text-xs text-black-alpha-48 mt-4">
                              Process reviews and feedback to extract insights
                            </p>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className="flex gap-12 group"
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === 'user' 
                      ? 'bg-heat-100 text-white' 
                      : 'bg-heat-4 bg-opacity-10 text-heat-100'
                  }`}>
                    {message.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                  </div>
                  
                  <div className="flex-1 max-w-[85%]" dir="ltr" style={{ direction: 'ltr', textAlign: 'left' }}>
                    <div className={`relative inline-block p-16 rounded-12 ${
                      message.role === 'user'
                        ? 'bg-heat-100 text-white'
                        : 'bg-background-lighter border border-border-faint text-accent-black'
                    }`}>
                      <div className="text-sm leading-relaxed" dir="ltr" style={{ direction: 'ltr', textAlign: 'left' }}>
                        <MarkdownRenderer content={message.content} />
                      </div>
                      
                      {message.error && (
                        <div className="mt-12 p-12 bg-accent-crimson bg-opacity-10 border border-accent-crimson border-opacity-20 rounded-12 text-accent-crimson text-xs">
                          <div className="flex items-center gap-8 mb-8">
                            <AlertCircle className="w-3 h-3" />
                            <span className="font-medium">Error</span>
                          </div>
                          <p className="text-xs" dir="ltr" style={{ direction: 'ltr', textAlign: 'left' }}>{message.error}</p>
                        </div>
                      )}
                      
                      {message.thinking && (
                        <div className="mt-12 p-12 bg-heat-4 bg-opacity-10 border border-heat-100 border-opacity-20 rounded-12 text-heat-100 text-xs">
                          <div className="flex items-center gap-8 mb-8">
                            <Bot className="w-3 h-3" />
                            <span className="font-medium">
                              {(() => {
                                const model = availableModels.find(m => m.id === selectedModel);
                                const modelName = model?.name || 'AI';
                                return `${modelName}'s Thinking`;
                              })()}
                            </span>
                          </div>
                          <p className="text-xs whitespace-pre-wrap leading-relaxed" dir="ltr" style={{ direction: 'ltr', textAlign: 'left' }}>{message.thinking}</p>
                        </div>
                      )}
                      
                      {message.workflow && (
                        <div className="mt-16 p-16 bg-heat-4 bg-opacity-10 border border-heat-100 border-opacity-20 rounded-12 relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-br from-heat-4 to-transparent opacity-5"></div>
                          <div className="flex items-center gap-12 mb-12 relative">
                            <div className="w-6 h-6 rounded-full bg-heat-100 flex items-center justify-center">
                              <CheckCircle className="w-3 h-3 text-white" />
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-accent-black">
                                {message.workflow.name}
                              </h4>
                              <p className="text-xs text-black-alpha-48">
                                {message.workflow.description || 'No description provided'}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-8 relative">
                            <button
                              onClick={() => handleApplyWorkflow(message.workflow!)}
                              className="flex items-center gap-6 px-10 py-6 bg-accent-forest hover:bg-accent-forest hover:bg-opacity-90 text-white text-xs font-medium rounded-12 transition-all duration-200 hover:scale-105"
                            >
                              <CheckCircle className="w-3 h-3" />
                              Apply
                            </button>
                            <button
                              onClick={() => handlePreviewWorkflow(message.workflow!)}
                              className="flex items-center gap-6 px-10 py-6 bg-heat-100 hover:bg-heat-100 hover:bg-opacity-90 text-white text-xs font-medium rounded-12 transition-all duration-200 hover:scale-105"
                            >
                              <Eye className="w-3 h-3" />
                              Preview
                            </button>
                            <button
                              onClick={() => handleDownloadWorkflow(message.workflow!)}
                              className="flex items-center gap-6 px-10 py-6 bg-black-alpha-48 hover:bg-black-alpha-64 text-white text-xs font-medium rounded-12 transition-all duration-200 hover:scale-105"
                            >
                              <Download className="w-3 h-3" />
                              Download
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Copy button for assistant messages */}
                    {message.role === 'assistant' && (
                      <button
                        onClick={() => handleCopyMessage(message.content, message.id)}
                        className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity p-8 hover:bg-black-alpha-4 rounded-8 bg-background-base border border-border-faint shadow-sm"
                        title="Copy message"
                      >
                        {copiedMessageId === message.id ? (
                          <CheckCircle className="w-4 h-4 text-heat-100" />
                        ) : (
                          <Copy className="w-4 h-4 text-accent-black" />
                        )}
                      </button>
                    )}
                    
                    {/* Edit functionality for user messages */}
                    {message.role === 'user' && (
                      <div className="flex items-center gap-8 mt-8">
                        {editingMessageId === message.id ? (
                          <>
                            <textarea
                              value={editedContent}
                              onChange={(e) => setEditedContent(e.target.value)}
                              className="w-full p-8 border border-border-faint rounded-8 text-sm"
                              rows={3}
                            />
                            <div className="flex gap-4">
                              <button 
                                onClick={() => handleSaveEdit(message.id)}
                                className="px-8 py-4 bg-heat-100 text-white rounded-6 text-xs hover:bg-heat-90"
                              >
                                Save
                              </button>
                              <button 
                                onClick={handleCancelEdit}
                                className="px-8 py-4 bg-black-alpha-10 text-black-alpha-64 rounded-6 text-xs hover:bg-black-alpha-20"
                              >
                                Cancel
                              </button>
                            </div>
                          </>
                        ) : (
                          <button
                            onClick={() => handleEditMessage(message.id, message.content)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-6 hover:bg-black-alpha-4 rounded-6"
                            title="Edit message"
                          >
                            <Edit className="w-14 h-14 text-black-alpha-48" />
                          </button>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-xs text-black-alpha-40 mt-2">
                      <span>{message.timestamp.toLocaleTimeString()}</span>
                      {message.tokenCount && (
                        <span className="px-1.5 py-0.5 bg-black-alpha-10 rounded-4 text-xs font-mono">
                          {message.tokenCount.total} tokens
                        </span>
                      )}
                      {message.role === 'assistant' && (
                        <button
                          onClick={() => handleCopyMessage(message.content, message.id)}
                          className="px-1.5 py-0.5 bg-black-alpha-10 hover:bg-black-alpha-20 rounded-4 text-xs font-mono transition-colors"
                          title="Copy message"
                        >
                          Copy
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {isGenerating && (
                <div className="flex gap-12">
                  <div className="w-6 h-6 rounded-full bg-heat-4 bg-opacity-10 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3 h-3 text-heat-100" />
                  </div>
                  <div className="flex-1">
                    <div className="inline-block p-16 bg-background-lighter border border-border-faint rounded-12">
                      <div className="flex items-center gap-8">
                        <Loader2 className="w-3 h-3 animate-spin text-heat-100" />
                        <span className="text-sm text-accent-black font-medium">
                          {(() => {
                            const model = availableModels.find(m => m.id === selectedModel);
                            const modelName = model?.name || 'AI';
                            return `${modelName} is designing your workflow...`;
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}


              <div ref={messagesEndRef} />
            </div>


            {/* Input */}
            <div className="p-16 border-t border-border-faint bg-accent-white" dir="ltr" style={{ direction: 'ltr', textAlign: 'left' }}>
              {/* Tool Selection */}
              <div className="mb-12">
                <div className="flex items-center gap-8 mb-8">
                  <span className="text-xs text-black-alpha-48 font-medium">Tools:</span>
                  <div className="flex items-center gap-4">
                    {selectedTools.map(toolId => {
                      const tool = availableTools.find(t => t.id === toolId);
                      return tool ? (
                        <div key={toolId} className="flex items-center gap-4 px-8 py-4 bg-heat-100 text-white rounded-4 text-xs">
                          <tool.icon className="w-3 h-3" />
                          <span>{tool.name}</span>
                          <button
                            onClick={() => toggleTool(toolId)}
                            className="hover:bg-white hover:bg-opacity-20 rounded-2 p-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : null;
                    })}
                    <div className="relative" ref={toolMenuRef}>
                      <button
                        onClick={() => setShowToolMenu(!showToolMenu)}
                        className="flex items-center gap-4 px-8 py-4 border border-border-faint hover:bg-black-alpha-5 rounded-4 text-xs transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Tool</span>
                      </button>
                      
                      {showToolMenu && (
                        <div className="absolute top-full left-0 mt-4 bg-white border border-border-faint rounded-8 shadow-lg z-10 min-w-200">
                          {availableTools.map(tool => (
                            <button
                              key={tool.id}
                              onClick={() => {
                                toggleTool(tool.id);
                                setShowToolMenu(false);
                              }}
                              className="w-full flex items-center gap-8 px-12 py-8 hover:bg-black-alpha-5 text-left text-xs"
                            >
                              <tool.icon className="w-4 h-4" />
                              <div>
                                <div className="font-medium">{tool.name}</div>
                                <div className="text-black-alpha-48">{tool.description}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Model Selector */}
              <div className="mb-12 flex items-center justify-between">
                <div className="flex items-center gap-8">
                  <Settings className="w-4 h-4 text-black-alpha-48" />
                  <span className="text-xs text-black-alpha-48 font-medium">Model:</span>
                </div>
                <div className="relative" ref={modelDropdownRef}>
                  <button
                    onClick={() => {
                      setShowModelDropdown(!showModelDropdown);
                      if (!showModelDropdown) {
                        setHoveredModel(selectedModel);
                      }
                    }}
                    className="flex items-center gap-6 px-8 py-4 bg-background-base border border-border-faint rounded-8 hover:border-heat-100 transition-colors text-xs shadow-sm"
                  >
                    <span className="text-accent-black">
                      {availableModels.find(m => m.id === selectedModel)?.name || 'Auto (Best Available)'}
                    </span>
                    <ChevronDown className={`w-3 h-3 text-black-alpha-48 transition-transform ${showModelDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  
                  <AnimatePresence>
                    {showModelDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-full right-0 mb-4 w-[480px] flex bg-accent-white border border-border-faint rounded-12 shadow-lg z-50 overflow-hidden"
                      >
                        {/* Model List Panel */}
                        <div className="flex-1">
                          <div className="px-12 py-6 text-xs text-black-alpha-48 border-b border-border-faint">
                            * to switch models
                          </div>
                          {availableModels.map((model) => (
                            <button
                              key={model.id}
                              onClick={() => {
                                setSelectedModel(model.id);
                                setShowModelDropdown(false);
                              }}
                              onMouseEnter={() => setHoveredModel(model.id)}
                              onMouseLeave={() => setHoveredModel(selectedModel)}
                              className={`w-full text-left px-12 py-8 hover:bg-heat-4 hover:bg-opacity-10 transition-colors flex items-center justify-between ${
                                selectedModel === model.id ? 'bg-heat-4 bg-opacity-10' : ''
                              }`}
                            >
                              <div className="flex-1">
                                <div className="text-xs font-medium text-accent-black">
                                  {model.name}
                                </div>
                              </div>
                              {selectedModel === model.id && (
                                <div className="w-4 h-4 rounded-full bg-heat-100 flex items-center justify-center">
                                  <CheckCircle className="w-3 h-3 text-white" />
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                        
                        {/* Description Panel */}
                        <div className="w-48 bg-background-lighter border-l border-border-faint p-12">
                          <div className="text-xs font-medium text-accent-black mb-8">
                            {hoveredModel ? availableModels.find(m => m.id === hoveredModel)?.name : 'Select a model'}
                          </div>
                          <div className="text-xs text-black-alpha-48 leading-relaxed">
                            {hoveredModel ? availableModels.find(m => m.id === hoveredModel)?.description : 'Hover over a model to see its description and best use cases.'}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="relative bg-background-base border border-border-faint rounded-12 shadow-sm">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Start building..."
                  className="w-full p-16 border-0 rounded-12 resize-none focus:ring-0 focus:outline-none bg-transparent text-accent-black placeholder-black-alpha-40 transition-all duration-200 text-sm leading-relaxed min-h-[60px] max-h-[120px]"
                  dir="ltr"
                  rows={2}
                  disabled={isGenerating}
                  style={{ 
                    direction: 'ltr',
                    textAlign: 'left',
                    paddingRight: '60px',
                    fontFamily: 'inherit'
                  }}
                />
                <button
                  onClick={isGenerating ? handleStopGeneration : handleSendMessage}
                  disabled={!isGenerating && !input.trim()}
                  className={`absolute right-8 top-1/2 transform -translate-y-1/2 rounded-12 transition-all duration-200 hover:scale-105 disabled:hover:scale-100 flex items-center justify-center shadow-lg border-2 ${
                    isGenerating 
                      ? 'w-12 h-12 bg-accent-crimson hover:bg-red-600 text-white border-red-300' 
                      : 'w-10 h-10 bg-heat-100 hover:bg-heat-100 hover:bg-opacity-90 disabled:bg-black-alpha-20 disabled:cursor-not-allowed text-white border-green-300'
                  }`}
                  title={isGenerating ? "Stop generating" : "Send message"}
                >
                  {isGenerating ? (
                    <StopCircle className="w-6 h-6" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
              
              {messages.length > 0 && (
                <div className="mt-12 flex justify-between items-center">
                  <div className="flex items-center gap-12">
                    <span className="text-xs text-black-alpha-40">
                      {messages.length} message{messages.length !== 1 ? 's' : ''}
                    </span>
                    {(() => {
                      const totalTokens = messages.reduce((sum, msg) => sum + (msg.tokenCount?.total || 0), 0);
                      const inputTokens = messages.reduce((sum, msg) => sum + (msg.tokenCount?.input || 0), 0);
                      const outputTokens = messages.reduce((sum, msg) => sum + (msg.tokenCount?.output || 0), 0);
                      
                      return totalTokens > 0 ? (
                        <div className="flex items-center gap-8 text-xs text-black-alpha-40">
                          <span className="px-6 py-2 bg-black-alpha-10 rounded-12 font-mono">
                            {totalTokens} total
                          </span>
                          <span className="px-6 py-2 bg-heat-4 bg-opacity-10 rounded-12 font-mono text-heat-100">
                            {inputTokens} in
                          </span>
                          <span className="px-6 py-2 bg-accent-forest bg-opacity-10 rounded-12 font-mono text-accent-forest">
                            {outputTokens} out
                          </span>
                        </div>
                      ) : null;
                    })()}
                  </div>
                  <button
                    onClick={onClose}
                    className="text-xs text-black-alpha-48 hover:text-black-alpha-72 px-8 py-4 rounded-12 hover:bg-heat-4 hover:bg-opacity-10 transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}