import { NextRequest, NextResponse } from 'next/server';
import { saveWorkflow } from '@/lib/database/workflows';

export const dynamic = 'force-dynamic';

/**
 * POST /api/database/templates/insert - Insert new template into database
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      customId, 
      userId = 'system-templates',
      name, 
      description, 
      category, 
      tags, 
      difficulty, 
      estimatedTime, 
      nodes, 
      edges,
      isTemplate = true 
    } = body;

    if (!customId || !name || !nodes || !edges) {
      return NextResponse.json(
        { error: 'Missing required fields: customId, name, nodes, edges' },
        { status: 400 }
      );
    }

    console.log(`🔧 Inserting template: ${name} (${customId})`);

    // Create the template using saveWorkflow
    const template = await saveWorkflow({
      customId,
      userId,
      name,
      description,
      category,
      tags: tags || [],
      difficulty,
      estimatedTime,
      nodes,
      edges,
      isTemplate,
      isPublic: true
    });

    console.log(`✅ Successfully inserted template: ${name}`);

    return NextResponse.json({
      success: true,
      template,
      message: `Successfully inserted template: ${name}`
    });

  } catch (error) {
    console.error('❌ Error inserting template:', error);
    return NextResponse.json(
      {
        error: 'Failed to insert template',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error
      },
      { status: 500 }
    );
  }
}
