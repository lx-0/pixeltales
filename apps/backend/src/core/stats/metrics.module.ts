import { Module, Provider } from '@nestjs/common';
import { IMetricsAdapter, METRICS_ADAPTER } from './adapters/metrics.adapter.interface';
import { OlapAdapter } from './adapters/olap.adapter';
import { TimeSeriesAdapter } from './adapters/time-series.adapter';
import { DefaultMetricFormatter } from './formatters/default.formatter';
import { METRIC_FORMATTER } from './formatters/metric.formatter.interface';
import { StatsCollectorService } from './stats-collector.service';

// Define providers for the adapters array
const metricsAdapterProviders: Provider[] = [
  TimeSeriesAdapter,
  OlapAdapter,
  {
    provide: METRICS_ADAPTER,
    useFactory: (...adapters: IMetricsAdapter[]) => adapters,
    inject: [TimeSeriesAdapter, OlapAdapter],
  },
];

@Module({
  // imports: [CoreModule], // Uncomment if EventBusModule is separate and needed
  providers: [
    StatsCollectorService,
    {
      provide: METRIC_FORMATTER,
      useClass: DefaultMetricFormatter,
    },
    ...metricsAdapterProviders,
  ],
  exports: [StatsCollectorService], // Export service if needed by other modules
})
export class MetricsModule {}
