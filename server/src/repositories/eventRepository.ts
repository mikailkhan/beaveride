import { and, asc, count, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { db } from '../db/client.js';
import { activityEvents } from '../db/schema.js';
import {
  ActivityActorType,
  ActivityEvent,
  ActivityEventType,
  ActivityOutcome,
  NewActivityEvent,
} from '../types/activityTypes.js';

export interface EventQueryFilters {
  actorId?: number | undefined;
  actorType?: ActivityActorType | undefined;
  fileId?: number | undefined;
  eventType?: ActivityEventType | undefined;
  outcome?: ActivityOutcome | undefined;
  fromTime?: Date | undefined;
  toTime?: Date | undefined;
  correlationId?: string | undefined;
}

export interface PaginationOptions {
  limit?: number | undefined;
  offset?: number | undefined;
}

export class EventRepository {
  async append(event: NewActivityEvent & { eventId: string; occurredAt: Date }): Promise<ActivityEvent> {
    return await db.transaction(async (tx) => {
      // Calculate next monotonic sequence number for the room
      const [seqResult] = await tx
        .select({
          maxSeq: sql<number>`COALESCE(MAX(${activityEvents.seq}), 0) + 1`,
        })
        .from(activityEvents)
        .where(eq(activityEvents.roomId, event.roomId));

      const nextSeq = Number(seqResult?.maxSeq ?? 1);

      const [inserted] = await tx
        .insert(activityEvents)
        .values({
          eventId: event.eventId,
          roomId: event.roomId,
          seq: nextSeq,
          occurredAt: event.occurredAt,
          actorId: event.actorId ?? null,
          actorName: event.actorName,
          actorType: event.actorType ?? 'human',
          eventType: event.eventType,
          targetFileId: event.targetFileId ?? null,
          targetScope: event.targetScope ?? null,
          targetUnitName: event.targetUnitName ?? null,
          outcome: event.outcome ?? null,
          reason: event.reason ?? null,
          correlationId: event.correlationId ?? null,
          versionRef: event.versionRef ?? null,
          versionProduced: event.versionProduced ?? null,
          metadata: event.metadata ?? null,
        })
        .returning();

      if (!inserted) {
        throw new Error('Failed to insert activity event');
      }

      return {
        ...inserted,
        occurredAt: inserted.occurredAt.toISOString(),
      } as unknown as ActivityEvent;
    });
  }

  async queryByRoom(
    roomId: number,
    filters: EventQueryFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<{ events: ActivityEvent[]; total: number }> {
    const conditions = [eq(activityEvents.roomId, roomId)];

    if (filters.actorId !== undefined) {
      conditions.push(eq(activityEvents.actorId, filters.actorId));
    }
    if (filters.actorType) {
      conditions.push(eq(activityEvents.actorType, filters.actorType));
    }
    if (filters.fileId !== undefined) {
      conditions.push(eq(activityEvents.targetFileId, filters.fileId));
    }
    if (filters.eventType) {
      conditions.push(eq(activityEvents.eventType, filters.eventType));
    }
    if (filters.outcome) {
      conditions.push(eq(activityEvents.outcome, filters.outcome));
    }
    if (filters.fromTime) {
      conditions.push(gte(activityEvents.occurredAt, filters.fromTime));
    }
    if (filters.toTime) {
      conditions.push(lte(activityEvents.occurredAt, filters.toTime));
    }
    if (filters.correlationId) {
      conditions.push(eq(activityEvents.correlationId, filters.correlationId));
    }

    const whereClause = and(...conditions);

    const [countResult] = await db
      .select({ totalCount: count() })
      .from(activityEvents)
      .where(whereClause);

    const total = countResult ? Number(countResult.totalCount) : 0;
    const limit = pagination.limit ?? 50;
    const offset = pagination.offset ?? 0;

    const rows = await db
      .select()
      .from(activityEvents)
      .where(whereClause)
      .orderBy(desc(activityEvents.seq))
      .limit(limit)
      .offset(offset);

    const events = rows.map((r) => ({
      ...r,
      occurredAt: r.occurredAt.toISOString(),
    })) as unknown as ActivityEvent[];

    return { events, total };
  }

  async queryByCorrelation(correlationId: string): Promise<ActivityEvent[]> {
    const rows = await db
      .select()
      .from(activityEvents)
      .where(eq(activityEvents.correlationId, correlationId))
      .orderBy(asc(activityEvents.seq));

    return rows.map((r) => ({
      ...r,
      occurredAt: r.occurredAt.toISOString(),
    })) as unknown as ActivityEvent[];
  }

  async queryByFile(roomId: number, fileId: number): Promise<ActivityEvent[]> {
    const rows = await db
      .select()
      .from(activityEvents)
      .where(and(eq(activityEvents.roomId, roomId), eq(activityEvents.targetFileId, fileId)))
      .orderBy(desc(activityEvents.seq));

    return rows.map((r) => ({
      ...r,
      occurredAt: r.occurredAt.toISOString(),
    })) as unknown as ActivityEvent[];
  }

  async exportByRoom(roomId: number): Promise<ActivityEvent[]> {
    const rows = await db
      .select()
      .from(activityEvents)
      .where(eq(activityEvents.roomId, roomId))
      .orderBy(asc(activityEvents.seq));

    return rows.map((r) => ({
      ...r,
      occurredAt: r.occurredAt.toISOString(),
    })) as unknown as ActivityEvent[];
  }

  async getRecentEvents(roomId: number, limit = 50): Promise<ActivityEvent[]> {
    const rows = await db
      .select()
      .from(activityEvents)
      .where(eq(activityEvents.roomId, roomId))
      .orderBy(desc(activityEvents.seq))
      .limit(limit);

    return rows.map((r) => ({
      ...r,
      occurredAt: r.occurredAt.toISOString(),
    })) as unknown as ActivityEvent[];
  }
}
