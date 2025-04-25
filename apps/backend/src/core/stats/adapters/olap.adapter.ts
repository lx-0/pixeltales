import { Injectable, Logger } from '@nestjs/common';
import { IMetricsAdapter } from './metrics.adapter.interface';
import { Metric } from '@pixeltales/contracts';

@Injectable()
export class OlapAdapter implements IMetricsAdapter {
  private readonly logger = new Logger(OlapAdapter.name);

  async writePoint(metric: Metric): Promise<void> {
    // OLAP databases typically prefer batch inserts.
    // This method might log a warning or simply call batchInsert with a single item.
    this.logger.warn(
      `[OLAP] writePoint called for metric ${metric.name}. Consider batching for OLAP stores.`,
    );
    await this.batchInsert([metric]);
  }

  async batchInsert(metrics: Metric[]): Promise<void> {
    // TODO: Implement actual logic to batch insert into an OLAP DB (e.g., ClickHouse)
    this.logger.debug(`[OLAP] Batch writing ${metrics.length} metrics.`);
    // Simulate async database operation
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}
