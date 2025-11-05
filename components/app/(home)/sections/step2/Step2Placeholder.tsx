"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { listTemplates } from "@/lib/workflow/templates";
import { Trash2, CheckSquare, Square, X } from "lucide-react";

interface Step2PlaceholderProps {
  onReset: () => void;
  onCreateWorkflow: () => void;
  onLoadWorkflow?: (workflowId: string) => void;
  onLoadTemplate?: (templateId: string) => void;
}

interface Workflow {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
}

export default function Step2Placeholder({ onReset, onCreateWorkflow, onLoadWorkflow, onLoadTemplate }: Step2PlaceholderProps) {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [activeTab, setActiveTab] = useState<"workflows" | "templates">("templates");
  const [selectedWorkflows, setSelectedWorkflows] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const templates = listTemplates();

  // Organize templates by category
  const securityTemplates = templates.filter(template => 
    template.category === 'Security' || 
    template.tags?.includes('security') ||
    template.name.toLowerCase().includes('security')
  );
  
  const generalTemplates = templates.filter(template => 
    template.category !== 'Security' && 
    !template.tags?.includes('security') &&
    !template.name.toLowerCase().includes('security')
  );

  useEffect(() => {
    // Load workflows from API
    const loadWorkflows = async () => {
      try {
        const response = await fetch('/api/workflows');
        const data = await response.json();

        if (data.workflows && Array.isArray(data.workflows)) {
          setWorkflows(data.workflows.map((w: any) => ({
            id: w.id,
            title: w.name,
            description: w.description,
            createdAt: new Date(w.updatedAt || w.createdAt).toLocaleDateString(),
          })));
        }
      } catch (error) {
        console.error('Error loading workflows:', error);
      }
    };

    loadWorkflows();
  }, []);


  // Delete individual workflow
  const deleteWorkflow = async (workflowId: string) => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/workflows/${workflowId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setWorkflows(prev => prev.filter(w => w.id !== workflowId));
        setSelectedWorkflows(prev => {
          const newSet = new Set(prev);
          newSet.delete(workflowId);
          return newSet;
        });
      } else {
        console.error('Failed to delete workflow');
      }
    } catch (error) {
      console.error('Error deleting workflow:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Delete selected workflows
  const deleteSelectedWorkflows = async () => {
    if (selectedWorkflows.size === 0) return;
    
    try {
      setIsDeleting(true);
      const deletePromises = Array.from(selectedWorkflows).map(workflowId =>
        fetch(`/api/workflows/${workflowId}`, { method: 'DELETE' })
      );
      
      await Promise.all(deletePromises);
      
      setWorkflows(prev => prev.filter(w => !selectedWorkflows.has(w.id)));
      setSelectedWorkflows(new Set());
    } catch (error) {
      console.error('Error deleting workflows:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle workflow selection
  const toggleWorkflowSelection = (workflowId: string) => {
    setSelectedWorkflows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(workflowId)) {
        newSet.delete(workflowId);
      } else {
        newSet.add(workflowId);
      }
      return newSet;
    });
  };

  // Select all workflows
  const selectAllWorkflows = () => {
    setSelectedWorkflows(new Set(workflows.map(w => w.id)));
  };

  // Deselect all workflows
  const deselectAllWorkflows = () => {
    setSelectedWorkflows(new Set());
  };

  // Handle workflow card click (avoid triggering when clicking delete button)
  const handleWorkflowClick = (workflowId: string, event: React.MouseEvent) => {
    // If clicking on delete button or checkbox, don't load workflow
    if ((event.target as HTMLElement).closest('.delete-button') || 
        (event.target as HTMLElement).closest('.checkbox-button')) {
      return;
    }
    onLoadWorkflow?.(workflowId);
  };

  return (
    <div className="max-w-[900px] mx-auto w-full">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-24"
      >
        <h2 className="text-title-h2 text-accent-black mb-8">Get Started</h2>
        <p className="text-body-large text-black-alpha-48">
          Create a new workflow, use a template, or continue where you left off
        </p>
      </motion.div>

      {/* Tabs */}
      <div className="flex justify-center gap-8 mb-24">
        <button
          onClick={() => setActiveTab("workflows")}
          className={`px-20 py-10 rounded-8 text-body-medium transition-all ${
            activeTab === "workflows"
              ? "bg-heat-100 text-white"
              : "bg-background-base text-accent-black hover:bg-black-alpha-4 border border-border-faint"
          }`}
        >
          Your Workflows ({workflows.length})
        </button>
        <button
          onClick={() => setActiveTab("templates")}
          className={`px-20 py-10 rounded-8 text-body-medium transition-all ${
            activeTab === "templates"
              ? "bg-heat-100 text-white"
              : "bg-background-base text-accent-black hover:bg-black-alpha-4 border border-border-faint"
          }`}
        >
          Templates ({templates.length})
        </button>
      </div>

      {/* Bulk Actions for Workflows */}
      {activeTab === "workflows" && workflows.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex justify-between items-center mb-16 p-16 bg-background-base rounded-8 border border-border-faint"
        >
          <div className="flex items-center gap-12">
            <button
              onClick={selectedWorkflows.size === workflows.length ? deselectAllWorkflows : selectAllWorkflows}
              className="flex items-center gap-6 text-body-small text-accent-black hover:text-heat-100 transition-colors"
            >
              {selectedWorkflows.size === workflows.length ? (
                <CheckSquare className="w-16 h-16" />
              ) : (
                <Square className="w-16 h-16" />
              )}
              {selectedWorkflows.size === workflows.length ? 'Deselect All' : 'Select All'}
            </button>
            {selectedWorkflows.size > 0 && (
              <span className="text-body-small text-black-alpha-48">
                {selectedWorkflows.size} selected
              </span>
            )}
          </div>
          
          {selectedWorkflows.size > 0 && (
            <button
              onClick={deleteSelectedWorkflows}
              disabled={isDeleting}
              className="flex items-center gap-6 px-12 py-6 text-body-small text-red-600 hover:text-red-700 hover:bg-red-50 rounded-6 transition-all disabled:opacity-50"
            >
              <Trash2 className="w-14 h-14" />
              Delete Selected ({selectedWorkflows.size})
            </button>
          )}
        </motion.div>
      )}

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 mb-32">
        {/* Create Workflow Tile - Always first */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.5,
            delay: 0,
            ease: "easeOut"
          }}
          className="relative cursor-pointer"
          onClick={onCreateWorkflow}
        >
          <div className="bg-accent-white rounded-12 p-24 border-2 border-dashed border-border-light hover:border-heat-100 transition-all h-full flex items-center justify-center min-h-[160px]">
            <div className="text-center">
              <div className="w-48 h-48 rounded-full bg-heat-4 flex items-center justify-center mx-auto mb-12">
                <svg className="w-24 h-24 text-heat-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="text-label-large text-accent-black font-medium">Create Workflow</h3>
            </div>
          </div>
        </motion.div>

        {/* Show Workflows or Templates based on tab */}
        {activeTab === "workflows" ? (
          workflows.length > 0 ? (
            workflows.map((workflow, index) => (
              <motion.div
                key={`workflow-${workflow.id || index}-${index}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.5,
                  delay: (index + 1) * 0.1,
                  ease: "easeOut"
                }}
                className="relative"
                onClick={(e) => handleWorkflowClick(workflow.id, e)}
              >
                <div className={`bg-accent-white rounded-12 p-24 border transition-all h-full min-h-[160px] group cursor-pointer ${
                  selectedWorkflows.has(workflow.id) 
                    ? 'border-heat-100 bg-heat-4 bg-opacity-5' 
                    : 'border-border-faint hover:border-heat-100 hover:shadow-sm'
                }`}>
                  <div className="absolute inset-0 rounded-12 bg-gradient-to-br from-heat-4 to-transparent opacity-0 group-hover:opacity-10 transition-opacity" />
                  
                  {/* Selection Checkbox */}
                  <button
                    className="checkbox-button absolute top-12 right-12 z-10 p-6 hover:bg-black-alpha-8 rounded-6 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWorkflowSelection(workflow.id);
                    }}
                  >
                    {selectedWorkflows.has(workflow.id) ? (
                      <CheckSquare className="w-16 h-16 text-heat-100" />
                    ) : (
                      <Square className="w-16 h-16 text-black-alpha-48" />
                    )}
                  </button>

                  {/* Delete Button */}
                  <button
                    className="delete-button absolute top-12 right-40 z-10 p-6 hover:bg-red-50 rounded-6 transition-colors opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteWorkflow(workflow.id);
                    }}
                    disabled={isDeleting}
                  >
                    <Trash2 className="w-16 h-16 text-red-500 hover:text-red-600" />
                  </button>

                  <div className="relative pr-32">
                    <h3 className="text-label-large text-accent-black font-medium mb-8">{workflow.title}</h3>
                    {workflow.description && (
                      <p className="text-body-small text-black-alpha-48 mb-12 line-clamp-2">{workflow.description}</p>
                    )}
                    
                    
                    <p className="text-body-small text-black-alpha-32">Updated {workflow.createdAt}</p>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-1 lg:col-span-3 flex items-center justify-center min-h-[160px]">
              <p className="text-body-medium text-black-alpha-48">No saved workflows yet</p>
            </div>
          )
        ) : (
          <div className="col-span-1 lg:col-span-3 space-y-32">
            {/* Security Templates Section */}
            {securityTemplates.length > 0 && (
              <div>
                <div className="flex items-center gap-8 mb-16">
                  <div className="w-4 h-4 rounded-full bg-red-500"></div>
                  <h3 className="text-label-large text-accent-black font-medium">Security Templates</h3>
                  <span className="text-body-small text-black-alpha-48">({securityTemplates.length})</span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
                  {securityTemplates.map((template, index) => (
                    <motion.div
                      key={template.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        duration: 0.5,
                        delay: (index + 1) * 0.1,
                        ease: "easeOut"
                      }}
                      className="relative cursor-pointer"
                      onClick={() => onLoadTemplate?.(template.id)}
                    >
                      <div className="bg-accent-white rounded-12 p-24 border border-border-faint hover:border-gray-700 hover:shadow-md transition-all h-full min-h-[160px] relative overflow-hidden group">
                        <div className="relative">
                          <h3 className="text-label-large text-accent-black font-medium mb-8">{template.name}</h3>
                          <p className="text-body-small text-black-alpha-48">{template.description}</p>
                          <div className="mt-12 inline-flex items-center gap-6 text-body-small text-accent-black group-hover:text-gray-700">
                            <span>Use template</span>
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* General Templates Section */}
            {generalTemplates.length > 0 && (
              <div>
                <div className="flex items-center gap-8 mb-16">
                  <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                  <h3 className="text-label-large text-accent-black font-medium">General Templates</h3>
                  <span className="text-body-small text-black-alpha-48">({generalTemplates.length})</span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
                  {generalTemplates.map((template, index) => (
                    <motion.div
                      key={template.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        duration: 0.5,
                        delay: (index + 1) * 0.1,
                        ease: "easeOut"
                      }}
                      className="relative cursor-pointer"
                      onClick={() => onLoadTemplate?.(template.id)}
                    >
                      <div className="bg-accent-white rounded-12 p-24 border border-border-faint hover:border-gray-700 hover:shadow-md transition-all h-full min-h-[160px] relative overflow-hidden group">
                        <div className="relative">
                          <h3 className="text-label-large text-accent-black font-medium mb-8">{template.name}</h3>
                          <p className="text-body-small text-black-alpha-48">{template.description}</p>
                          <div className="mt-12 inline-flex items-center gap-6 text-body-small text-accent-black group-hover:text-gray-700">
                            <span>Use template</span>
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* No templates message */}
            {securityTemplates.length === 0 && generalTemplates.length === 0 && (
              <div className="col-span-1 lg:col-span-3 flex items-center justify-center min-h-[160px]">
                <p className="text-body-medium text-black-alpha-48">No templates available</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="flex justify-center"
      >
        <button
          onClick={onReset}
          className="px-24 py-12 text-label-large text-black-alpha-48 hover:text-accent-black transition-colors"
        >
          Back
        </button>
      </motion.div>
    </div>
  );
}