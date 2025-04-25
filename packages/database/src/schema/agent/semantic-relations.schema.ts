import { relations } from 'drizzle-orm';
import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { uuid } from '../../uuid'; // Import uuid helper
import { semanticConcepts } from './semantic-concepts.schema';

// TODO: Define agent table if needed or confirm agentId source

/**
 * Stores relationships (edges) between concepts in the agent's knowledge graph.
 * Part of the Semantic Memory / Ontology system.
 */
export const semanticRelations = sqliteTable(
  'semantic_relations',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => uuid()), // Use text UUID
    agentId: text('agent_id').notNull(), // Agent who holds this belief about the relation
    sourceConceptId: text('source_concept_id') // Change FK to text
      .notNull()
      // Define foreign key reference to semanticConcepts table's integer PK
      .references(() => semanticConcepts.id, { onDelete: 'cascade' }),
    targetConceptId: text('target_concept_id') // Change FK to text
      .notNull()
      .references(() => semanticConcepts.id, { onDelete: 'cascade' }),
    relationType: text('relation_type').notNull(), // e.g., 'is_a', 'has_property', 'causes', 'located_in'
    strength: real('strength').default(1.0), // Optional strength/confidence of the relation
    // Store metadata as text, let Drizzle parse based on $type
    metadata: text('metadata', { mode: 'json' }).$type<Record<string, any>>(),
    // Store timestamps as integers (Unix epoch milliseconds)
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().defaultNow(),
    lastUpdated: integer('last_updated', { mode: 'timestamp_ms' }).notNull().defaultNow(),
  },
  (table) => [
    index('relation_agent_id_idx').on(table.agentId),
    index('relation_source_concept_id_idx').on(table.sourceConceptId),
    index('relation_target_concept_id_idx').on(table.targetConceptId),
    index('relation_relation_type_idx').on(table.relationType),
  ],
);

// Define relations for Drizzle ORM usage (syntax remains the same)
export const semanticRelationRelations = relations(semanticRelations, ({ one }) => ({
  sourceConcept: one(semanticConcepts, {
    fields: [semanticRelations.sourceConceptId],
    references: [semanticConcepts.id],
    relationName: 'source_relations',
  }),
  targetConcept: one(semanticConcepts, {
    fields: [semanticRelations.targetConceptId],
    references: [semanticConcepts.id],
    relationName: 'target_relations',
  }),
  // agent: one(agents, { // If an 'agents' table exists
  //   fields: [semanticRelations.agentId],
  //   references: [agents.id],
  // }),
}));

// Also define the inverse relation on the concepts table (syntax remains the same)
export const semanticConceptRelations = relations(semanticConcepts, ({ many }) => ({
  sourceRelations: many(semanticRelations, {
    relationName: 'source_relations',
  }),
  targetRelations: many(semanticRelations, {
    relationName: 'target_relations',
  }),
}));
