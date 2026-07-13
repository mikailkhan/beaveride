import { sql } from 'drizzle-orm';
import { closeDb, db } from '../db/client.js';
import { programmingLanguages, statuses } from '../db/schema.js';

const seed = async () => {
  await db
    .insert(programmingLanguages)
    .values([{ language: 'javascript' }])
    .onConflictDoNothing();

  await db
    .insert(statuses)
    .values([{ state: 'active' }, { state: 'archived' }, { state: 'trash' }, { state: 'deleted' }])
    .onConflictDoNothing();

  await db.execute(sql`select 1`);
};

seed()
  .then(async () => {
    await closeDb();
    console.log('Seed completed');
  })
  .catch(async (error: unknown) => {
    await closeDb();
    console.error(error);
    process.exit(1);
  });
