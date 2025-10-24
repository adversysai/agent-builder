import { NextRequest, NextResponse } from 'next/server';
import { getTemplates, getTemplateByCustomId, updateTemplateStructure } from '@/lib/database/workflows';

// GET /api/database/templates - List all templates
export async function GET(request: NextRequest) {
  try {
    const templates = await getTemplates();
    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error listing templates:', error);
    return NextResponse.json({ error: 'Failed to list templates' }, { status: 500 });
  }
}

// POST /api/database/templates - Update template structure
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customId, nodes, edges } = body;
    
    const result = await updateTemplateStructure(customId, nodes, edges);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
  }
}
