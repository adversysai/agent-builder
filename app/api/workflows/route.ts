import { NextRequest, NextResponse } from 'next/server';
import { listWorkflows, saveWorkflow, deleteWorkflow } from '@/lib/database/workflows';

export const dynamic = 'force-dynamic';

/**
 * GET /api/workflows - List all workflows
 * Uses NeonDB for storage
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    const workflows = await listWorkflows(userId || undefined);

    return NextResponse.json({
      workflows: workflows.map((w: any) => ({
        id: w.customId || w.id,
        name: w.name,
        description: w.description,
        category: w.category,
        tags: w.tags,
        difficulty: w.difficulty,
        estimatedTime: w.estimatedTime,
        nodes: w.nodes,
        edges: w.edges,
        createdAt: w.createdAt,
        updatedAt: w.updatedAt,
        nodeCount: w.nodes?.length || 0,
        edgeCount: w.edges?.length || 0,
      })),
      total: workflows.length,
      source: 'neondb',
    });
  } catch (error) {
    console.error('Error fetching workflows:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch workflows',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workflows - Save a workflow to NeonDB
 */
export async function POST(request: NextRequest) {
  try {
    let workflow;
    try {
      const body = await request.text();
      if (!body || body.trim() === '') {
        return NextResponse.json(
          { error: 'Request body is empty' },
          { status: 400 }
        );
      }
      workflow = JSON.parse(body);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    if (!workflow.id && !workflow.name) {
      return NextResponse.json(
        { error: 'Workflow must have either id or name' },
        { status: 400 }
      );
    }

    // Validate workflow has required fields
    if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
      return NextResponse.json(
        { error: 'Workflow must have a nodes array' },
        { status: 400 }
      );
    }

    if (!workflow.edges || !Array.isArray(workflow.edges)) {
      return NextResponse.json(
        { error: 'Workflow must have an edges array' },
        { status: 400 }
      );
    }

    // Get user ID from request headers or use a default
    const userId = workflow.userId || 'system-user';

    const savedWorkflow = await saveWorkflow({
      id: workflow.id,
      customId: workflow.id,
      userId: userId,
      name: workflow.name || 'Untitled Workflow',
      description: workflow.description,
      category: workflow.category,
      tags: workflow.tags,
      difficulty: workflow.difficulty,
      estimatedTime: workflow.estimatedTime,
      nodes: workflow.nodes,
      edges: workflow.edges,
      // settings: workflow.settings || {}, // Removed settings as it's not in the Workflow type
      isTemplate: workflow.isTemplate || false,
    });

    return NextResponse.json({
      success: true,
      workflowId: savedWorkflow?.id,
      source: 'neondb',
      message: 'Workflow saved successfully',
    });
  } catch (error) {
    console.error('Error saving workflow:', error);
    return NextResponse.json(
      {
        error: 'Failed to save workflow',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/workflows?id=xxx - Delete a workflow from NeonDB
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get('id');

    if (!workflowId) {
      return NextResponse.json(
        { error: 'Workflow ID is required' },
        { status: 400 }
      );
    }

    const result = await deleteWorkflow(workflowId);

    if (!result) {
      return NextResponse.json(
        { error: `Workflow ${workflowId} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      source: 'neondb',
      message: 'Workflow deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting workflow:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete workflow',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

