import { sql } from 'drizzle-orm';

export const sqlNow = sql`(cast(strftime('%s', 'now') as integer) * 1000)`;
