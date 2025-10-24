import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database/client';

export const dynamic = 'force-dynamic';

/**
 * POST /api/fix-workflow-models - Fix workflow models from Groq to Anthropic
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Finding workflows with Groq models...');
    
    // Get all workflows
    const result = await db.query('SELECT * FROM workflow');
    console.log(`Found ${result.rows.length} workflows`);
    
    let updatedCount = 0;
    
    for (const workflow of result.rows) {
      let needsUpdate = false;
      const updatedNodes = workflow.nodes.map((node: any) => {
        if (node.data && node.data.model && node.data.model.startsWith('groq/')) {
          console.log(`🔄 Updating node ${node.id} (${node.data.nodeName}) from ${node.data.model} to anthropic/claude-sonnet-4-20250514`);
          needsUpdate = true;
          return {
            ...node,
            data: {
              ...node.data,
              model: 'anthropic/claude-sonnet-4-20250514'
            }
          };
        }
        return node;
      });
      
      if (needsUpdate) {
        console.log(`📝 Updating workflow ${workflow.customId || workflow.id} (${workflow.name})`);
        
        await db.query(`
          UPDATE workflow 
          SET nodes = $1, "updatedAt" = $2
          WHERE id = $3
        `, [
          JSON.stringify(updatedNodes),
          new Date().toISOString(),
          workflow.id
        ]);
        
        console.log(`✅ Updated workflow ${workflow.customId || workflow.id}`);
        updatedCount++;
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Updated ${updatedCount} workflows`,
      updatedCount
    });
    
  } catch (error) {
    console.error('❌ Error updating workflows:', error);
    return NextResponse.json(
      {
        error: 'Failed to update workflows',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
