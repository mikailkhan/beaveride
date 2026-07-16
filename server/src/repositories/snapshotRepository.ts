import { desc, eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { codeSnapshots } from '../db/schema.js';

export class SnapshotRepository {
  async getLatestSnapshot(roomId: number): Promise<Buffer | null> {
    const row = await db.query.codeSnapshots.findFirst({
      where: eq(codeSnapshots.roomId, roomId),
      orderBy: desc(codeSnapshots.createdAt),
    });
    return row ? row.snapshot : null;
  }

  async saveSnapshot(roomId: number, snapshot: Buffer, userId: number): Promise<void> {
    await db.insert(codeSnapshots).values({
      roomId,
      snapshot,
      createdBy: userId,
    });
  }
}
