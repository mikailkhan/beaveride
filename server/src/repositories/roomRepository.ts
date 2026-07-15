import { and, eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import {
  rooms,
  userRooms,
  programmingLanguages,
  statuses,
  users,
} from '../db/schema.js';

export type Room = typeof rooms.$inferSelect;
export type UserRoom = typeof userRooms.$inferSelect;

export class RoomRepository {
  async findById(id: number) {
    return db.query.rooms.findFirst({
      where: eq(rooms.id, id),
      with: {
        programmingLanguage: true,
        status: true,
      },
    });
  }

  async findByUserId(userId: number) {
    return db
      .select({
        id: rooms.id,
        title: rooms.title,
        createdAt: rooms.createdAt,
        updatedAt: rooms.updatedAt,
        role: userRooms.role,
        canRun: userRooms.canRun,
        language: programmingLanguages.language,
        status: statuses.state,
      })
      .from(rooms)
      .innerJoin(userRooms, eq(rooms.id, userRooms.roomId))
      .innerJoin(programmingLanguages, eq(rooms.programmingLanguageId, programmingLanguages.id))
      .innerJoin(statuses, eq(rooms.statusId, statuses.id))
      .where(eq(userRooms.userId, userId));
  }

  async create(title: string, programmingLanguageId: number, statusId: number): Promise<Room> {
    const [room] = await db
      .insert(rooms)
      .values({ title, programmingLanguageId, statusId })
      .returning();
    if (!room) {
      throw new Error('Room insert returned no rows');
    }
    return room;
  }

  async addMember(roomId: number, userId: number, role: 'owner' | 'editor' | 'viewer', canRun: boolean): Promise<UserRoom> {
    const [membership] = await db
      .insert(userRooms)
      .values({ roomId, userId, role, canRun })
      .returning();
    if (!membership) {
      throw new Error('UserRoom insert returned no rows');
    }
    return membership;
  }

  async findMembership(roomId: number, userId: number) {
    return db.query.userRooms.findFirst({
      where: and(eq(userRooms.roomId, roomId), eq(userRooms.userId, userId)),
    });
  }

  async findMembers(roomId: number) {
    return db
      .select({
        id: users.id,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        role: userRooms.role,
        canRun: userRooms.canRun,
        joinedAt: userRooms.joinedAt,
      })
      .from(userRooms)
      .innerJoin(users, eq(userRooms.userId, users.id))
      .where(eq(userRooms.roomId, roomId));
  }

  async findLanguageByName(name: string) {
    return db.query.programmingLanguages.findFirst({
      where: eq(programmingLanguages.language, name),
    });
  }

  async findStatusByState(state: string) {
    return db.query.statuses.findFirst({
      where: eq(statuses.state, state),
    });
  }
}
