import { Inject, Injectable, Logger } from '@nestjs/common';
import { Metric } from '@pixeltales/contracts';
import { metrics } from '@pixeltales/database'; // Import the metrics schema
import { DRIZZLE_INSTANCE, DatabaseSchema } from '../../../db/drizzle.provider'; // Import Drizzle types
import { IMetricsAdapter } from './metrics.adapter.interface';

/**
 * Adapter for writing metrics to the SQLite `metrics` table,
 * simulating an OLAP Database interface for now.
 */
@Injectable()
export class OlapAdapter implements IMetricsAdapter {
  private readonly logger = new Logger(OlapAdapter.name);

  constructor(@Inject(DRIZZLE_INSTANCE) private readonly db: DatabaseSchema) {}

  async writePoint(metric: Metric): Promise<void> {
    this.logger.verbose(`Writing metric point to SQLite (OLAP): ${metric.name}`);
    // OLAP typically prefers batch, but for SQLite target, single insert is fine.
    if (!this.db) {
      this.logger.error('Drizzle instance is not available in OlapAdapter.writePoint');
      return;
    }
    try {
      await this.db.insert(metrics).values({
        name: metric.name,
        timestamp: new Date(metric.timestamp),
        tags: metric.tags,
        fields: metric.fields,
      });
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Failed to write metric point (OLAP): ${metric.name} - ${error.message}`,
          error.stack,
        );
      } else {
        this.logger.error(
          `Failed to write metric point (OLAP): ${metric.name} - Unknown error`,
          error,
        );
      }
    }
  }

  async batchInsert(metricsToInsert: Metric[]): Promise<void> {
    if (metricsToInsert.length === 0) return;
    this.logger.verbose(`Batch writing ${metricsToInsert.length} metrics to SQLite (OLAP).`);

    if (!this.db) {
      this.logger.error('Drizzle instance is not available in OlapAdapter.batchInsert');
      return;
    }

    const values = metricsToInsert.map((metric) => ({
      name: metric.name,
      timestamp: new Date(metric.timestamp),
      tags: metric.tags,
      fields: metric.fields,
    }));

    try {
      await this.db.insert(metrics).values(values);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Failed to batch write (OLAP) ${metricsToInsert.length} metrics - ${error.message}`,
          error.stack,
        );
      } else {
        this.logger.error(
          `Failed to batch write (OLAP) ${metricsToInsert.length} metrics - Unknown error`,
          error,
        );
      }
    }
  }
}
