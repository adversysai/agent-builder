import { NextRequest, NextResponse } from 'next/server';
import { getWorkflow, deleteWorkflow } from '@/lib/database/workflows';

export const dynamic = 'force-dynamic';

/**
 * GET /api/workflows/[workflowId] - Get a specific workflow from database
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workflowId: string }> }
) {
  try {
    const { workflowId } = await params;

    const workflow = await getWorkflow(workflowId);

    if (!workflow) {
      return NextResponse.json(
        { error: `Workflow ${workflowId} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      workflow: {
        ...workflow,
        id: workflow.customId || workflow.id, // Return customId if exists
      },
      source: 'database',
    });
  } catch (error) {
    console.error('Error fetching workflow:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch workflow',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/workflows/[workflowId] - Delete a workflow from database
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ workflowId: string }> }
) {
  try {
    const { workflowId } = await params;

    // Get the workflow first to check if it exists
    const workflow = await getWorkflow(workflowId);

    if (!workflow) {
      return NextResponse.json(
        { error: `Workflow ${workflowId} not found` },
        { status: 404 }
      );
    }

    // Delete the workflow
    await deleteWorkflow(workflowId);

    return NextResponse.json({
      success: true,
      source: 'database',
      message: `Workflow ${workflowId} deleted`,
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