import { eq, asc } from 'drizzle-orm';
import { db } from '../db/client.js';
import { projectFiles } from '../db/schema.js';

export interface ProjectFile {
  id: number;
  roomId: number;
  parentId: number | null;
  name: string;
  type: 'file' | 'directory';
  content: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class FileRepository {
  async getFileTree(roomId: number): Promise<ProjectFile[]> {
    return db
      .select()
      .from(projectFiles)
      .where(eq(projectFiles.roomId, roomId))
      .orderBy(asc(projectFiles.name));
  }

  async getFileById(id: number): Promise<ProjectFile | null> {
    const file = await db.query.projectFiles.findFirst({
      where: eq(projectFiles.id, id),
    });
    return file || null;
  }

  async createFile(data: {
    roomId: number;
    parentId: number | null;
    name: string;
    type: 'file' | 'directory';
    content?: string;
  }): Promise<ProjectFile> {
    const [inserted] = await db
      .insert(projectFiles)
      .values({
        roomId: data.roomId,
        parentId: data.parentId,
        name: data.name,
        type: data.type,
        content: data.content ?? null,
      })
      .returning();

    if (!inserted) {
      throw new Error('Failed to insert project file');
    }
    return inserted;
  }

  async updateFileContent(id: number, content: string): Promise<void> {
    await db
      .update(projectFiles)
      .set({ content, updatedAt: new Date() })
      .where(eq(projectFiles.id, id));
  }

  async renameFile(id: number, newName: string): Promise<void> {
    await db
      .update(projectFiles)
      .set({ name: newName, updatedAt: new Date() })
      .where(eq(projectFiles.id, id));
  }

  async deleteFile(id: number): Promise<void> {
    await db.delete(projectFiles).where(eq(projectFiles.id, id));
  }
}
