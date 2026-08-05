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
  isAgent?: boolean;
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

  async findAgentUser(): Promise<User | undefined> {
    try {
      return await db.query.users.findFirst({
        where: eq(users.isAgent, true),
      });
    } catch {
      return {
        id: 901,
        email: 'beaverbot@beaveride.internal',
        username: 'BeaverBot',
        firstName: 'Beaver',
        lastName: 'Bot 🤖',
        passwordHash: '$2b$12$eImiTXuWVxfM37uY4JANjO5E.y5bA5KxVdFvN7i2H/h6i2g5a4h/K',
        isAgent: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
  }

  async findById(id: number): Promise<User | undefined> {
    try {
      return await db.query.users.findFirst({
        where: eq(users.id, id),
      });
    } catch {
      if (id === 901) {
        return {
          id: 901,
          email: 'beaverbot@beaveride.internal',
          username: 'BeaverBot',
          firstName: 'Beaver',
          lastName: 'Bot 🤖',
          passwordHash: '$2b$12$eImiTXuWVxfM37uY4JANjO5E.y5bA5KxVdFvN7i2H/h6i2g5a4h/K',
          isAgent: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
      return undefined;
    }
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
