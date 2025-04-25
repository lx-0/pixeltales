import { Metric } from '@pixeltales/contracts';

/**
 * Interface for adapters that write metrics to different storage backends.
 */
export interface IMetricsAdapter {
  /**
   * Writes a single metric point to the backend.
   * @param metric The metric data point to write.
   */
  writePoint(metric: Metric): Promise<void>;

  /**
   * Writes a batch of metric points to the backend.
   * Optional: Adapters can implement this for efficiency.
   * @param metrics An array of metric data points to write.
   */
  batchInsert?(metrics: Metric[]): Promise<void>;
}

/**
 * Injection token for the metrics adapter interface.
 */
export const METRICS_ADAPTER = 'METRICS_ADAPTER';
