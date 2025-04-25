import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { uuid } from '../../uuid'; // Import uuid helper

/**
 * Stores aggregated or key metrics data. Primary storage for high-frequency
 * metrics is expected to be a TimeSeriesDB (e.g., InfluxDB), but this table
 * can be used for summaries, specific event tracking, or OLAP-style analysis.
 * Aligns with the Metric contract schema.
 */
export const metrics = sqliteTable(
  'metrics',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => uuid()), // Use text UUID
    // Store timestamp as integer (Unix epoch milliseconds)
    timestamp: integer('timestamp', { mode: 'timestamp_ms' }).notNull().defaultNow(),
    name: text('name').notNull(), // Metric name (e.g., 'agent_response_time')
    // Store tags and fields as text, let Drizzle parse based on $type
    tags: text('tags', { mode: 'json' }).$type<Record<string, string>>(),
    fields: text('fields', { mode: 'json' }).notNull().$type<Record<string, number>>(),
  },
  (table) => [
    index('metric_timestamp_idx').on(table.timestamp),
    index('metric_name_idx').on(table.name),
    // Add index for JSON functions if needed
  ],
);
