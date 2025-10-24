import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database/client';
import { listTemplates, getTemplate } from '@/lib/workflow/templates';

export const dynamic = 'force-dynamic';

/**
 * POST /api/database/templates/seed - Seed official templates to NeonDB
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🌱 Starting template seeding...');

    // Get all templates from static file
    const templateList = listTemplates();
    const seededTemplates: string[] = [];
    const skippedTemplates: string[] = [];

    for (const templateInfo of templateList) {
      const template = getTemplate(templateInfo.id);
      if (!template) continue;

      try {
        // Check if template already exists
        const existingTemplate = await db.query(
          'SELECT id FROM workflow WHERE "customId" = $1',
          [template.id]
        );

        if (existingTemplate.rows.length > 0) {
          console.log(`⚠️  Template ${template.name} already exists, skipping`);
          skippedTemplates.push(template.name);
          continue;
        }

        // Insert template into database
        const result = await db.query(`
          INSERT INTO workflow (
            "customId", name, description, category, tags, difficulty, 
            "estimatedTime", nodes, edges, "isTemplate", "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
          RETURNING id
        `, [
          template.id,
          template.name,
          template.description,
          template.category,
          JSON.stringify(template.tags),
          template.difficulty,
          template.estimatedTime,
          JSON.stringify(template.nodes),
          JSON.stringify(template.edges),
          true
        ]);

        if (result.rows.length > 0) {
          seededTemplates.push(template.name);
          console.log(`✅ Seeded template: ${template.name}`);
        } else {
          skippedTemplates.push(template.name);
        }
      } catch (error) {
        console.error(`❌ Failed to seed template ${template.name}:`, error);
        skippedTemplates.push(template.name);
      }
    }

    console.log(`🎉 Template seeding completed: ${seededTemplates.length} seeded, ${skippedTemplates.length} skipped`);

    return NextResponse.json({
      success: true,
      seeded: seededTemplates.length,
      skipped: skippedTemplates.length,
      total: templateList.length,
      seededTemplates,
      skippedTemplates,
      message: `Seeded ${seededTemplates.length} templates, skipped ${skippedTemplates.length}`,
    });
  } catch (error) {
    console.error('❌ Error seeding templates:', error);
    return NextResponse.json(
      {
        error: 'Failed to seed templates',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
