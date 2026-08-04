import { eq, sql } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { closeDb, db } from '../db/client.js';
import { programmingLanguages, statuses, users } from '../db/schema.js';

const seed = async () => {
  await db
    .insert(programmingLanguages)
    .values([
      { language: 'javascript' },
      { language: 'typescript' },
      { language: 'python' },
      { language: 'go' },
    ])
    .onConflictDoNothing();

  await db
    .insert(statuses)
    .values([{ state: 'active' }, { state: 'archived' }, { state: 'trash' }, { state: 'deleted' }])
    .onConflictDoNothing();

  const existingAgent = await db.select().from(users).where(eq(users.username, 'BeaverBot'));
  if (existingAgent.length === 0) {
    const passwordHash = await bcrypt.hash('system_agent_secret_pass_123!', 12);
    await db.insert(users).values({
      email: 'beaverbot@beaveride.internal',
      username: 'BeaverBot',
      firstName: 'Beaver',
      lastName: 'Bot 🤖',
      passwordHash,
      isAgent: true,
    });
  }

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
