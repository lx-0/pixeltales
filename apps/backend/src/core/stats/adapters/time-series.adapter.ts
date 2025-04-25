import { Injectable, Logger } from '@nestjs/common';
import { Metric } from '@pixeltales/contracts';
import { IMetricsAdapter } from './metrics.adapter.interface';

@Injectable()
export class TimeSeriesAdapter implements IMetricsAdapter {
  private readonly logger = new Logger(TimeSeriesAdapter.name);

  async writePoint(metric: Metric): Promise<void> {
    // TODO: Implement actual logic to write to a Time Series DB (e.g., InfluxDB)
    this.logger.debug(`[TimeSeries] Writing metric: ${metric.name}`);
    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  async batchInsert(metrics: Metric[]): Promise<void> {
    // Optional: Implement efficient batch insertion for Time Series DB
    this.logger.debug(`[TimeSeries] Batch writing ${metrics.length} metrics.`);
    for (const metric of metrics) {
      await this.writePoint(metric); // Basic implementation: call writePoint individually
    }
  }
}
