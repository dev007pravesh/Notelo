import { eq, and, desc, sql, like, or } from 'drizzle-orm';
import { db, expoDb } from '../db';
import { notes, checklistItems, noteLabels, labels, Note, NewNote, ChecklistItem, NewChecklistItem } from '../schema';

export interface NoteWithDetails extends Note {
  checklists?: ChecklistItem[];
  labelIds?: string[];
}

export class NotesRepository {
  /**
   * Fetch all active (non-archived, non-deleted) notes, optionally filtered by folder.
   */
  static async getActiveNotes(folderId?: string | null): Promise<NoteWithDetails[]> {
    const conditions = [eq(notes.isArchived, false), eq(notes.isDeleted, false)];
    if (folderId !== undefined) {
      if (folderId === null) {
        conditions.push(sql`${notes.folderId} IS NULL`);
      } else {
        conditions.push(eq(notes.folderId, folderId));
      }
    }

    const rows = await db
      .select()
      .from(notes)
      .where(and(...conditions))
      .orderBy(desc(notes.isPinned), desc(notes.updatedAt));

    return this.attachChecklistsAndLabels(rows);
  }

  /**
   * Fetch archived notes.
   */
  static async getArchivedNotes(): Promise<NoteWithDetails[]> {
    const rows = await db
      .select()
      .from(notes)
      .where(and(eq(notes.isArchived, true), eq(notes.isDeleted, false)))
      .orderBy(desc(notes.updatedAt));

    return this.attachChecklistsAndLabels(rows);
  }

  /**
   * Fetch trash notes.
   */
  static async getTrashNotes(): Promise<NoteWithDetails[]> {
    const rows = await db
      .select()
      .from(notes)
      .where(eq(notes.isDeleted, true))
      .orderBy(desc(notes.updatedAt));

    return this.attachChecklistsAndLabels(rows);
  }

  /**
   * Fetch a single note by ID with its checklist items and labels.
   */
  static async getNoteById(id: string): Promise<NoteWithDetails | null> {
    const rows = await db.select().from(notes).where(eq(notes.id, id)).limit(1);
    if (rows.length === 0) return null;

    const [withDetails] = await this.attachChecklistsAndLabels(rows);
    return withDetails || null;
  }

  /**
   * Insert or update a note.
   */
  static async upsertNote(
    noteData: NewNote,
    checklistsList?: Array<Omit<NewChecklistItem, 'noteId'>>,
    labelIdList?: string[]
  ): Promise<NoteWithDetails> {
    const now = new Date();
    const finalData = {
      ...noteData,
      updatedAt: now,
      createdAt: noteData.createdAt || now,
    };

    await db.transaction(async (tx) => {
      await tx.insert(notes).values(finalData).onConflictDoUpdate({
        target: notes.id,
        set: {
          folderId: finalData.folderId,
          title: finalData.title,
          content: finalData.content,
          noteType: finalData.noteType,
          color: finalData.color,
          isPinned: finalData.isPinned,
          isArchived: finalData.isArchived,
          isDeleted: finalData.isDeleted,
          deletedAt: finalData.deletedAt,
          isLocked: finalData.isLocked,
          reminderAt: finalData.reminderAt,
          updatedAt: now,
        },
      });

      // Update checklists if provided
      if (checklistsList !== undefined) {
        await tx.delete(checklistItems).where(eq(checklistItems.noteId, finalData.id));
        if (checklistsList.length > 0) {
          await tx.insert(checklistItems).values(
            checklistsList.map((item, index) => ({
              ...item,
              noteId: finalData.id,
              orderIndex: item.orderIndex ?? index,
            }))
          );
        }
      }

      // Update labels if provided
      if (labelIdList !== undefined) {
        await tx.delete(noteLabels).where(eq(noteLabels.noteId, finalData.id));
        if (labelIdList.length > 0) {
          await tx.insert(noteLabels).values(
            labelIdList.map((labelId) => ({
              noteId: finalData.id,
              labelId,
            }))
          );
        }
      }

      // Update FTS5 index
      try {
        expoDb.runSync(`DELETE FROM notes_fts WHERE note_id = ?`, [finalData.id]);
        if (!finalData.isDeleted) {
          expoDb.runSync(
            `INSERT INTO notes_fts (note_id, title, content) VALUES (?, ?, ?)`,
            [finalData.id, finalData.title || '', finalData.content || '']
          );
        }
      } catch {
        // Fallback if FTS not available
      }
    });

    const updated = await this.getNoteById(finalData.id);
    return updated!;
  }

  /**
   * Search notes using FTS5 with fallback to LIKE.
   */
  static async searchNotes(query: string): Promise<NoteWithDetails[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    try {
      // Try FTS5 MATCH first
      const ftsResults = expoDb.getAllSync<{ note_id: string }>(
        `SELECT note_id FROM notes_fts WHERE notes_fts MATCH ? LIMIT 100`,
        [`${trimmed}*`]
      );

      if (ftsResults.length > 0) {
        const ids = ftsResults.map((r) => r.note_id);
        const rows = await db
          .select()
          .from(notes)
          .where(
            and(
              sql`${notes.id} IN (${sql.join(ids.map((id) => sql`${id}`), sql`, `)})`,
              eq(notes.isDeleted, false)
            )
          )
          .orderBy(desc(notes.updatedAt));

        return this.attachChecklistsAndLabels(rows);
      }
    } catch {
      // Fallback to LIKE
    }

    const rows = await db
      .select()
      .from(notes)
      .where(
        and(
          eq(notes.isDeleted, false),
          or(
            like(notes.title, `%${trimmed}%`),
            like(notes.content, `%${trimmed}%`)
          )
        )
      )
      .orderBy(desc(notes.updatedAt));

    return this.attachChecklistsAndLabels(rows);
  }

  /**
   * Toggle Pin status.
   */
  static async togglePin(id: string, isPinned: boolean): Promise<void> {
    await db
      .update(notes)
      .set({ isPinned, updatedAt: new Date() })
      .where(eq(notes.id, id));
  }

  /**
   * Soft delete (Move to Trash).
   */
  static async moveToTrash(id: string): Promise<void> {
    await db
      .update(notes)
      .set({ isDeleted: true, deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(notes.id, id));

    try {
      expoDb.runSync(`DELETE FROM notes_fts WHERE note_id = ?`, [id]);
    } catch {
      // Ignore
    }
  }

  /**
   * Restore from Trash.
   */
  static async restoreFromTrash(id: string): Promise<void> {
    await db
      .update(notes)
      .set({ isDeleted: false, deletedAt: null, updatedAt: new Date() })
      .where(eq(notes.id, id));

    const note = await this.getNoteById(id);
    if (note) {
      try {
        expoDb.runSync(
          `INSERT INTO notes_fts (note_id, title, content) VALUES (?, ?, ?)`,
          [note.id, note.title, note.content]
        );
      } catch {
        // Ignore
      }
    }
  }

  /**
   * Permanent Delete.
   */
  static async deletePermanently(id: string): Promise<void> {
    await db.delete(notes).where(eq(notes.id, id));
    try {
      expoDb.runSync(`DELETE FROM notes_fts WHERE note_id = ?`, [id]);
    } catch {
      // Ignore
    }
  }

  /**
   * Attach checklist items and label IDs to notes.
   */
  private static async attachChecklistsAndLabels(noteList: Note[]): Promise<NoteWithDetails[]> {
    if (noteList.length === 0) return [];
    const noteIds = noteList.map((n) => n.id);

    // Fetch checklist items
    const allChecklists = await db
      .select()
      .from(checklistItems)
      .where(sql`${checklistItems.noteId} IN (${sql.join(noteIds.map((id) => sql`${id}`), sql`, `)})`)
      .orderBy(checklistItems.orderIndex);

    // Fetch note labels
    const allNoteLabels = await db
      .select()
      .from(noteLabels)
      .where(sql`${noteLabels.noteId} IN (${sql.join(noteIds.map((id) => sql`${id}`), sql`, `)})`);

    const checklistsByNoteId = new Map<string, ChecklistItem[]>();
    for (const item of allChecklists) {
      const list = checklistsByNoteId.get(item.noteId) || [];
      list.push(item);
      checklistsByNoteId.set(item.noteId, list);
    }

    const labelsByNoteId = new Map<string, string[]>();
    for (const item of allNoteLabels) {
      const list = labelsByNoteId.get(item.noteId) || [];
      list.push(item.labelId);
      labelsByNoteId.set(item.noteId, list);
    }

    return noteList.map((n) => ({
      ...n,
      checklists: checklistsByNoteId.get(n.id) || [],
      labelIds: labelsByNoteId.get(n.id) || [],
    }));
  }
}
