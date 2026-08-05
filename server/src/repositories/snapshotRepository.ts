import { desc, eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { codeSnapshots } from '../db/schema.js';

export class SnapshotRepository {
  async getLatestSnapshot(roomId: number): Promise<Buffer | null> {
    try {
      const row = await db.query.codeSnapshots.findFirst({
        where: eq(codeSnapshots.roomId, roomId),
        orderBy: desc(codeSnapshots.createdAt),
      });
      return row ? row.snapshot : null;
    } catch {
      return null;
    }
  }

  async saveSnapshot(roomId: number, snapshot: Buffer, userId: number): Promise<void> {
    try {
      await db.insert(codeSnapshots).values({
        roomId,
        snapshot,
        createdBy: userId,
      });
    } catch (err) {
      console.warn('[SnapshotRepository] Failed to save snapshot to DB:', err);
    }
  }
}
