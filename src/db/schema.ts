import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Folders / Notebooks
export const folders = sqliteTable('folders', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  color: text('color').default('#64748B'),
  icon: text('icon').default('folder'),
  orderIndex: integer('order_index').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
});

// Notes Table
export const notes = sqliteTable('notes', {
  id: text('id').primaryKey(),
  folderId: text('folder_id').references(() => folders.id, { onDelete: 'set null' }),
  title: text('title').notNull().default(''),
  content: text('content').notNull().default(''),
  noteType: text('note_type', { enum: ['text', 'checklist'] }).notNull().default('text'),
  color: text('color').notNull().default('#FFFFFF'),
  isPinned: integer('is_pinned', { mode: 'boolean' }).notNull().default(false),
  isArchived: integer('is_archived', { mode: 'boolean' }).notNull().default(false),
  isDeleted: integer('is_deleted', { mode: 'boolean' }).notNull().default(false),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
  isLocked: integer('is_locked', { mode: 'boolean' }).notNull().default(false),
  reminderAt: integer('reminder_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
});

// Checklist Items
export const checklistItems = sqliteTable('checklist_items', {
  id: text('id').primaryKey(),
  noteId: text('note_id').notNull().references(() => notes.id, { onDelete: 'cascade' }),
  text: text('text').notNull().default(''),
  isCompleted: integer('is_completed', { mode: 'boolean' }).notNull().default(false),
  orderIndex: integer('order_index').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
});

// Labels / Tags Table
export const labels = sqliteTable('labels', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
});

// Note-to-Label Many-to-Many
export const noteLabels = sqliteTable('note_labels', {
  noteId: text('note_id').notNull().references(() => notes.id, { onDelete: 'cascade' }),
  labelId: text('label_id').notNull().references(() => labels.id, { onDelete: 'cascade' }),
});

// Attachments (Images, Audio Voice Memos)
export const attachments = sqliteTable('attachments', {
  id: text('id').primaryKey(),
  noteId: text('note_id').notNull().references(() => notes.id, { onDelete: 'cascade' }),
  localUri: text('local_uri').notNull(),
  mimeType: text('mime_type').notNull(), // 'image/jpeg', 'audio/m4a'
  fileSize: integer('file_size').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
});

// TypeScript Types
export type Folder = typeof folders.$inferSelect;
export type NewFolder = typeof folders.$inferInsert;

export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;

export type ChecklistItem = typeof checklistItems.$inferSelect;
export type NewChecklistItem = typeof checklistItems.$inferInsert;

export type Label = typeof labels.$inferSelect;
export type NewLabel = typeof labels.$inferInsert;

export type NoteLabel = typeof noteLabels.$inferSelect;
export type NewNoteLabel = typeof noteLabels.$inferInsert;

export type Attachment = typeof attachments.$inferSelect;
export type NewAttachment = typeof attachments.$inferInsert;
