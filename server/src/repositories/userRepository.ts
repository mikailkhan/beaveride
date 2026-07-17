import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { users } from '../db/schema.js';

export type User = typeof users.$inferSelect;

type CreateUserData = {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
};

export class UserRepository {
  async findByEmail(email: string): Promise<User | undefined> {
    return db.query.users.findFirst({
      where: eq(users.email, email),
    });
  }

  async findByUsername(username: string): Promise<User | undefined> {
    return db.query.users.findFirst({
      where: eq(users.username, username),
    });
  }

  async findById(id: number): Promise<User | undefined> {
    return db.query.users.findFirst({
      where: eq(users.id, id),
    });
  }

  async create(data: CreateUserData): Promise<User> {
    const [user] = await db.insert(users).values(data).returning();
    if (!user) {
      throw new Error('User insert returned no rows');
    }
    return user;
  }

  async update(id: number, data: Partial<Pick<User, 'email' | 'firstName' | 'lastName' | 'passwordHash'>>): Promise<User> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    if (!user) {
      throw new Error('User update returned no rows');
    }
    return user;
  }
}
