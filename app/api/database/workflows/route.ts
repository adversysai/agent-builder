import { NextRequest, NextResponse } from 'next/server';
import { 
  listWorkflows, 
  getWorkflow, 
  getWorkflowByCustomId, 
  getTemplateByCustomId,
  saveWorkflow,
  deleteWorkflow,
  getTemplates,
  updateTemplateStructure
} from '@/lib/database/workflows';

// GET /api/database/workflows - List workflows
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    const workflows = await listWorkflows(userId || undefined);
    return NextResponse.json(workflows);
  } catch (error) {
    console.error('Error listing workflows:', error);
    return NextResponse.json({ error: 'Failed to list workflows' }, { status: 500 });
  }
}

// POST /api/database/workflows - Create/update workflow
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const workflow = await saveWorkflow(body);
    return NextResponse.json(workflow);
  } catch (error) {
    console.error('Error saving workflow:', error);
    return NextResponse.json({ error: 'Failed to save workflow' }, { status: 500 });
  }
}

// DELETE /api/database/workflows - Delete workflow
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Workflow ID is required' }, { status: 400 });
    }
    
    await deleteWorkflow(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting workflow:', error);
    return NextResponse.json({ error: 'Failed to delete workflow' }, { status: 500 });
  }
}
