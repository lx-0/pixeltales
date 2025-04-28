import {
  agentSelfModels,
  episodicMemoryEntries,
  experiments,
  hypotheses,
  metrics,
  planNodes,
  plans,
  reflectionReports,
  rewards,
  semanticConcepts,
  semanticFacts,
  semanticRelations,
} from './schema';
import {
  charactersTable,
  messagesTable,
  sceneConfigsTable,
  scenesTable,
  sceneStateSnapshotsTable,
} from './schema/v1/db-schema';

// Combine all schemas into one object for the provider
export const schema = {
  // V1
  sceneConfigsTable,
  scenesTable,
  sceneStateSnapshotsTable,
  charactersTable,
  messagesTable,
  // New agent schemas
  agentSelfModels,
  episodicMemoryEntries,
  experiments,
  hypotheses,
  metrics,
  planNodes,
  plans,
  reflectionReports,
  rewards,
  semanticConcepts,
  semanticFacts,
  semanticRelations,
};
