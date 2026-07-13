import { sql } from 'drizzle-orm';
import { db } from '../db/client.js';

export class HealthRepository {
  async checkDatabase(): Promise<boolean> {
    await db.execute(sql`select 1`);
    return true;
  }
}
