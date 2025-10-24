import { NextRequest, NextResponse } from 'next/server';
import { getTemplateByCustomId } from '@/lib/database/workflows';

// GET /api/database/templates/[customId] - Get template by custom ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customId: string }> }
) {
  try {
    const { customId } = await params;
    const template = await getTemplateByCustomId(customId);
    
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }
    
    return NextResponse.json(template);
  } catch (error) {
    console.error('Error getting template:', error);
    return NextResponse.json({ error: 'Failed to get template' }, { status: 500 });
  }
}
