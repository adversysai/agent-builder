import { NextRequest, NextResponse } from 'next/server';
import { getWorkflow, getWorkflowByCustomId, getTemplateByCustomId } from '@/lib/database/workflows';

// GET /api/database/workflows/[id] - Get workflow by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'id', 'customId', or 'template'
    
    let workflow;
    
    if (type === 'template') {
      workflow = await getTemplateByCustomId(id);
    } else if (type === 'customId') {
      workflow = await getWorkflowByCustomId(id);
    } else {
      workflow = await getWorkflow(id);
    }
    
    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }
    
    return NextResponse.json(workflow);
  } catch (error) {
    console.error('Error getting workflow:', error);
    return NextResponse.json({ error: 'Failed to get workflow' }, { status: 500 });
  }
}
