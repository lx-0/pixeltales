import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  AddObservationParams,
  Observation,
  RetrieveObservationsParams,
} from '@pixeltales/contracts';
import * as schema from '@pixeltales/database';
import { and, eq, gte, lte, sql } from 'drizzle-orm';
import { DRIZZLE_INSTANCE, DatabaseSchema } from '../../db/drizzle.provider';
import { IMemoryInterface } from './memory.interface';

@Injectable()
export class EpisodicMemoryService
  implements Pick<IMemoryInterface, 'addObservation' | 'retrieveObservations'>
{
  private readonly logger = new Logger(EpisodicMemoryService.name);

  constructor(@Inject(DRIZZLE_INSTANCE) private db: DatabaseSchema) {}

  async addObservation(agentId: string, params: AddObservationParams): Promise<void> {
    this.logger.debug(`Adding observation for agent ${agentId}`);
    try {
      await this.db.insert(schema.episodicMemoryEntries).values({
        agentId: agentId,
        timestamp: params.timestamp ? new Date(params.timestamp) : new Date(), // Convert number to Date for Drizzle/SQLite
        eventType: params.eventType, // Use field from contract type
        content: params.content,
        conversationId: params.conversationId, // Use field from contract type
        associatedVisualIds: params.associatedVisualIds, // Use field from contract type
        metadata: params.metadata, // Use field from contract type
      });
      this.logger.verbose(`Added observation for agent ${agentId}`);
    } catch (error) {
      this.logger.error(
        `Failed to add observation for agent ${agentId}`,
        error instanceof Error ? error.stack : error,
      );
      // Re-throw or handle appropriately
      throw error;
    }
  }

  async retrieveObservations(
    agentId: string,
    params: RetrieveObservationsParams,
  ): Promise<Observation[]> {
    this.logger.debug(`Retrieving observations for agent ${agentId}`);
    const limit = params.limit ?? 50; // Default limit

    // Build query conditions dynamically using imported params type
    const conditions = [eq(schema.episodicMemoryEntries.agentId, agentId)];

    if (params.timeFilter?.startTime) {
      conditions.push(
        gte(schema.episodicMemoryEntries.timestamp, new Date(params.timeFilter.startTime)), // Convert number to Date
      );
    }
    if (params.timeFilter?.endTime) {
      conditions.push(
        lte(schema.episodicMemoryEntries.timestamp, new Date(params.timeFilter.endTime)), // Convert number to Date
      );
    }
    if (params.eventType) {
      conditions.push(eq(schema.episodicMemoryEntries.eventType, params.eventType)); // Use field from contract type
    }
    if (params.visualIdFilter) {
      // TODO: Implement visualIdFilter logic for SQLite
    }
    if (params.query) {
      // TODO: Implement semantic search based on params.query
    }

    try {
      const results = await this.db
        .select()
        .from(schema.episodicMemoryEntries)
        .where(and(...conditions))
        .orderBy(sql`${schema.episodicMemoryEntries.timestamp} DESC`)
        .limit(limit);

      this.logger.verbose(`Retrieved ${results.length} observations for agent ${agentId}`);

      // Map DB result to contract Observation type
      const contractObservations: Observation[] = results.map((dbObs) => ({
        ...dbObs,
        timestamp: dbObs.timestamp.getTime(),
        metadata: dbObs.metadata ?? undefined,
        associatedVisualIds: dbObs.associatedVisualIds ?? undefined,
      }));

      return contractObservations.reverse();
    } catch (error) {
      this.logger.error(
        `Failed to retrieve observations for agent ${agentId}`,
        error instanceof Error ? error.stack : error,
      );
      return []; // Return empty array on error
    }
  }
}
