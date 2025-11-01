"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Sparkles, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { WorkflowNode, WorkflowEdge } from "@/lib/workflow/types";

interface FixWithAIPanelProps {
  node: WorkflowNode;
  workflow: {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
    name?: string;
    description?: string;
  };
  error?: {
    message: string;
    type?: string;
  };
  executionContext?: {
    nodeResults?: Record<string, any>;
    variables?: Record<string, any>;
  };
  onClose: () => void;
  onApplyFix: (fixedNode: WorkflowNode) => void;
}

interface FixResponse {
  fixedNode: WorkflowNode;
  explanation: string;
  issues: string[];
  changes: string[];
  confidence: "high" | "medium" | "low";
  validationWarnings?: string[];
}

export default function FixWithAIPanel({
  node,
  workflow,
  error,
  executionContext,
  onClose,
  onApplyFix,
}: FixWithAIPanelProps) {
  const [isFixing, setIsFixing] = useState(false);
  const [fixResult, setFixResult] = useState<FixResponse | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleFixWithAI = async () => {
    setIsFixing(true);
    setFixResult(null);
    setShowPreview(false);

    try {
      const response = await fetch("/api/nodes/fix-with-ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          node,
          workflow,
          error,
          executionContext,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || "Failed to generate fix");
      }

      const result: FixResponse = await response.json();
      setFixResult(result);
      setShowPreview(true);
    } catch (error: any) {
      console.error("Fix with AI error:", error);
      toast.error("Failed to fix node", {
        description: error.message || "Please try again",
      });
    } finally {
      setIsFixing(false);
    }
  };

  const handleApplyFix = () => {
    if (!fixResult?.fixedNode) return;

    try {
      onApplyFix(fixResult.fixedNode);
      toast.success("Node fixed successfully", {
        description: "The node configuration has been updated",
      });
      onClose();
    } catch (error: any) {
      toast.error("Failed to apply fix", {
        description: error.message || "Please try again",
      });
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case "high":
        return "text-green-600 bg-green-50 border-green-200";
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "low":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-16 shadow-2xl max-w-2xl w-full mx-20 max-h-[85vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-24 border-b border-gray-200 flex-shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-12">
              <Sparkles className="w-20 h-20 text-purple-600" />
              <div>
                <h3 className="text-title-h4 text-gray-900">Fix With AI</h3>
                <p className="text-body-small text-gray-600 mt-4">
                  {node.data.nodeName || node.data.label || node.id}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-32 h-32 rounded-8 hover:bg-gray-100 transition-colors flex items-center justify-center"
            >
              <X className="w-16 h-16 text-gray-600" />
            </button>
          </div>

          {/* Content */}
          <div className="p-24 overflow-y-auto flex-1 space-y-20">
            {!fixResult ? (
              <>
                {/* Error Display */}
                {error && (
                  <div className="p-16 bg-red-50 border border-red-200 rounded-12">
                    <div className="flex items-start gap-12">
                      <AlertCircle className="w-16 h-16 text-red-600 flex-shrink-0 mt-2" />
                      <div className="flex-1">
                        <p className="text-body-small font-medium text-red-900">Error Detected</p>
                        <p className="text-body-small text-red-700 mt-4">{error.message}</p>
                        {error.type && (
                          <p className="text-xs text-red-600 mt-4">Type: {error.type}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Workflow Context */}
                <div className="p-16 bg-blue-50 border border-blue-200 rounded-12">
                  <p className="text-body-small font-medium text-blue-900 mb-8">
                    Workflow Context
                  </p>
                  <div className="space-y-8 text-body-small text-blue-800">
                    <p>
                      <strong>Workflow:</strong> {workflow.name || "Unnamed"}
                    </p>
                    <p>
                      <strong>Total Nodes:</strong> {workflow.nodes.length}
                    </p>
                    <p>
                      <strong>Node Role:</strong> {node.data.nodeType || node.type}
                    </p>
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-12">
                  <button
                    onClick={handleFixWithAI}
                    disabled={isFixing}
                    className="w-full px-16 py-12 bg-purple-600 hover:bg-purple-700 text-white rounded-12 text-body-medium font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-8"
                  >
                    {isFixing ? (
                      <>
                        <Loader2 className="w-16 h-16 animate-spin" />
                        Analyzing node with Gemini AI...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-16 h-16" />
                        Fix With AI
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Fix Result */}
                <div className="space-y-16">
                  {/* Confidence Badge */}
                  <div className={`px-12 py-8 rounded-8 border inline-flex items-center gap-8 ${getConfidenceColor(fixResult.confidence)}`}>
                    <span className="text-body-small font-medium">
                      Confidence: {fixResult.confidence.toUpperCase()}
                    </span>
                  </div>

                  {/* Explanation */}
                  <div className="p-16 bg-gray-50 border border-gray-200 rounded-12">
                    <p className="text-body-small font-medium text-gray-900 mb-8">
                      AI Analysis
                    </p>
                    <p className="text-body-small text-gray-700 whitespace-pre-wrap">
                      {fixResult.explanation}
                    </p>
                  </div>

                  {/* Issues Found */}
                  {fixResult.issues.length > 0 && (
                    <div className="p-16 bg-yellow-50 border border-yellow-200 rounded-12">
                      <p className="text-body-small font-medium text-yellow-900 mb-12">
                        Issues Found
                      </p>
                      <ul className="space-y-8">
                        {fixResult.issues.map((issue, idx) => (
                          <li key={idx} className="text-body-small text-yellow-800 flex items-start gap-8">
                            <span className="text-yellow-600 mt-2">•</span>
                            <span>{issue}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Changes Made */}
                  {fixResult.changes.length > 0 && (
                    <div className="p-16 bg-green-50 border border-green-200 rounded-12">
                      <p className="text-body-small font-medium text-green-900 mb-12">
                        Changes Made
                      </p>
                      <ul className="space-y-8">
                        {fixResult.changes.map((change, idx) => (
                          <li key={idx} className="text-body-small text-green-800 flex items-start gap-8">
                            <CheckCircle className="w-14 h-14 text-green-600 mt-1 flex-shrink-0" />
                            <span>{change}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Validation Warnings */}
                  {fixResult.validationWarnings && fixResult.validationWarnings.length > 0 && (
                    <div className="p-16 bg-orange-50 border border-orange-200 rounded-12">
                      <p className="text-body-small font-medium text-orange-900 mb-12">
                        Validation Warnings
                      </p>
                      <ul className="space-y-8">
                        {fixResult.validationWarnings.map((warning, idx) => (
                          <li key={idx} className="text-body-small text-orange-800 flex items-start gap-8">
                            <AlertCircle className="w-14 h-14 text-orange-600 mt-1 flex-shrink-0" />
                            <span>{warning}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Preview Toggle */}
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="w-full px-16 py-12 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-12 text-body-medium font-medium transition-colors"
                  >
                    {showPreview ? "Hide" : "Show"} Fixed Configuration
                  </button>

                  {/* Preview */}
                  {showPreview && (
                    <div className="p-16 bg-gray-50 border border-gray-200 rounded-12">
                      <p className="text-body-small font-medium text-gray-900 mb-12">
                        Fixed Node Configuration
                      </p>
                      <pre className="text-xs text-gray-700 overflow-auto max-h-300 p-12 bg-white rounded-8 border border-gray-200">
                        {JSON.stringify(fixResult.fixedNode.data, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-12 pt-12">
                    <button
                      onClick={handleApplyFix}
                      className="flex-1 px-16 py-12 bg-purple-600 hover:bg-purple-700 text-white rounded-12 text-body-medium font-medium transition-colors flex items-center justify-center gap-8"
                    >
                      <CheckCircle className="w-16 h-16" />
                      Apply Fix
                    </button>
                    <button
                      onClick={() => {
                        setFixResult(null);
                        setShowPreview(false);
                      }}
                      className="px-16 py-12 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-12 text-body-medium font-medium transition-colors"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={onClose}
                      className="px-16 py-12 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-12 text-body-medium font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

