import './setupTestEnv.js';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, closeDb } from '../db/client.js';

async function run() {
  console.log('Running Drizzle migrations...');
  await migrate(db, { migrationsFolder: 'server/drizzle' });
  console.log('✓ Migrations applied successfully!');
  await closeDb();
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
