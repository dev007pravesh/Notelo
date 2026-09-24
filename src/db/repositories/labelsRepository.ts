import { eq, asc } from 'drizzle-orm';
import { db } from '../db';
import { labels, Label, NewLabel } from '../schema';

export class LabelsRepository {
  static async getAllLabels(): Promise<Label[]> {
    return db.select().from(labels).orderBy(asc(labels.name));
  }

  static async getLabelById(id: string): Promise<Label | null> {
    const rows = await db.select().from(labels).where(eq(labels.id, id)).limit(1);
    return rows[0] || null;
  }

  static async createLabel(data: NewLabel): Promise<Label> {
    await db.insert(labels).values(data);
    const created = await this.getLabelById(data.id);
    return created!;
  }

  static async updateLabel(id: string, name: string): Promise<void> {
    await db.update(labels).set({ name }).where(eq(labels.id, id));
  }

  static async deleteLabel(id: string): Promise<void> {
    await db.delete(labels).where(eq(labels.id, id));
  }
}
