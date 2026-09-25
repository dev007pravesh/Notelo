import { eq, asc } from 'drizzle-orm';
import { db } from '../db';
import { folders, Folder, NewFolder, notes } from '../schema';

export class FoldersRepository {
  static async getAllFolders(): Promise<Folder[]> {
    return db.select().from(folders).orderBy(asc(folders.orderIndex), asc(folders.name));
  }

  static async getFolderById(id: string): Promise<Folder | null> {
    const rows = await db.select().from(folders).where(eq(folders.id, id)).limit(1);
    return rows[0] || null;
  }

  static async createFolder(data: NewFolder): Promise<Folder> {
    await db.insert(folders).values(data);
    const created = await this.getFolderById(data.id);
    return created!;
  }

  static async updateFolder(id: string, updates: Partial<Omit<Folder, 'id' | 'createdAt'>>): Promise<void> {
    await db.update(folders).set(updates).where(eq(folders.id, id));
  }

  static async deleteFolder(id: string): Promise<void> {
    await db.update(notes).set({ folderId: null }).where(eq(notes.folderId, id));
    await db.delete(folders).where(eq(folders.id, id));
  }
}
