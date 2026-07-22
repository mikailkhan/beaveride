import { desc, eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { chatMessages, users } from '../db/schema.js';

export interface ChatMessageWithUser {
  id: number;
  roomId: number;
  userId: number;
  message: string;
  createdAt: Date;
  user: {
    username: string;
    firstName: string;
    lastName: string;
  };
}

export class ChatRepository {
  async getAllMessages(roomId: number): Promise<ChatMessageWithUser[]> {
    const rows = await db
      .select({
        id: chatMessages.id,
        roomId: chatMessages.roomId,
        userId: chatMessages.userId,
        message: chatMessages.message,
        createdAt: chatMessages.createdAt,
        user: {
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(chatMessages)
      .innerJoin(users, eq(chatMessages.userId, users.id))
      .where(eq(chatMessages.roomId, roomId))
      .orderBy(desc(chatMessages.createdAt));

    // Return in chronological order (oldest first)
    return rows.reverse();
  }

  async getRecentMessages(roomId: number, limit = 1000): Promise<ChatMessageWithUser[]> {
    return this.getAllMessages(roomId);
  }

  async insertMessage(roomId: number, userId: number, message: string): Promise<ChatMessageWithUser> {
    const [inserted] = await db
      .insert(chatMessages)
      .values({
        roomId,
        userId,
        message,
      })
      .returning();

    if (!inserted) {
      throw new Error('Failed to insert chat message');
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    return {
      ...inserted,
      user: {
        username: user?.username || 'Anonymous',
        firstName: user?.firstName || 'Anonymous',
        lastName: user?.lastName || '',
      },
    };
  }
}
