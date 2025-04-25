import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { uuid } from '../../uuid'; // Import uuid helper

// TODO: Define agent table if needed or confirm agentId source

/**
 * Stores abstract concepts, categories, and their properties.
 * Forms the nodes of the agent's knowledge graph (Ontology).
 */
export const semanticConcepts = sqliteTable(
  'semantic_concepts',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => uuid()), // Use text UUID
    agentId: text('agent_id').notNull(), // Agent who holds this concept
    name: text('name').notNull(), // The human-readable name of the concept
    description: text('description'), // Optional description of the concept
    category: text('category'), // Optional category for hierarchical structure
    // Store properties as text, let Drizzle parse based on $type
    properties: text('properties', { mode: 'json' }).$type<Record<string, any>>(),
    confidence: real('confidence').notNull().default(1.0), // Confidence score (0.0 to 1.0)
    // Store timestamps as integers (Unix epoch milliseconds)
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().defaultNow(),
    lastUpdated: integer('last_updated', { mode: 'timestamp_ms' }).notNull().defaultNow(),
    // Store embedding as text, let Drizzle parse based on $type
    embedding: text('embedding', { mode: 'json' }),
  },
  (table) => [
    index('concept_agent_id_idx').on(table.agentId),
    index('concept_name_idx').on(table.name),
    index('concept_category_idx').on(table.category),
    // Add index for JSON functions if needed
  ],
);

// Relations might need adjustments if defined later
// Keep relations import from drizzle-orm needed for semantic-relations.schema.ts
// export const semanticConceptRelations = relations(semanticConcepts, ({ many }) => ({
//   sourceRelations: many(semanticRelations, { relationName: 'source_relations' }),
//   targetRelations: many(semanticRelations, { relationName: 'target_relations' }),
// }));
