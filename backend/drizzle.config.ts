import type { Config } from 'drizzle-kit';
import path from 'path';

export default {
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'turso',
  dbCredentials: {
    url: `file:${path.join(__dirname, 'data/gold.db')}`,
  },
} satisfies Config;
