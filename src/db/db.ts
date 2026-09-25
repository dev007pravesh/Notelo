import * as SQLite from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';

// Open native SQLite database synchronously (Expo SDK 53)
export const expoDb = SQLite.openDatabaseSync('notelo.db');

// Ensure newly added columns exist immediately on existing databases
try {
  expoDb.execSync(`ALTER TABLE notes ADD COLUMN order_index INTEGER NOT NULL DEFAULT 0;`);
} catch {
  // Column already exists, safe to ignore
}

// Initialize Drizzle ORM
export const db = drizzle(expoDb, { schema });

/**
 * Initializes database pragmas, creates tables and virtual FTS5 tables if they don't exist.
 * This runs cleanly on startup without needing complex external migration runners on the mobile device.
 */
export async function initDatabase(): Promise<void> {
  // 1. Performance Pragmas
  expoDb.execSync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    PRAGMA synchronous = NORMAL;
  `);

  // 2. Base Tables DDL
  expoDb.execSync(`
    CREATE TABLE IF NOT EXISTS folders (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL UNIQUE,
      color TEXT DEFAULT '#64748B',
      icon TEXT DEFAULT 'folder',
      order_index INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    );

    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY NOT NULL,
      folder_id TEXT REFERENCES folders(id) ON DELETE SET NULL,
      title TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      note_type TEXT NOT NULL DEFAULT 'text',
      color TEXT NOT NULL DEFAULT '#FFFFFF',
      is_pinned INTEGER NOT NULL DEFAULT 0,
      is_archived INTEGER NOT NULL DEFAULT 0,
      is_deleted INTEGER NOT NULL DEFAULT 0,
      deleted_at INTEGER,
      is_locked INTEGER NOT NULL DEFAULT 0,
      reminder_at INTEGER,
      order_index INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    );

    CREATE TABLE IF NOT EXISTS checklist_items (
      id TEXT PRIMARY KEY NOT NULL,
      note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
      text TEXT NOT NULL DEFAULT '',
      is_completed INTEGER NOT NULL DEFAULT 0,
      order_index INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    );

    CREATE TABLE IF NOT EXISTS labels (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    );

    CREATE TABLE IF NOT EXISTS note_labels (
      note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
      label_id TEXT NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
      PRIMARY KEY (note_id, label_id)
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id TEXT PRIMARY KEY NOT NULL,
      note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
      local_uri TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      file_size INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    );
  `);

  // 3. Dynamic Column Migrations (MUST run BEFORE creating indexes on new columns!)
  try {
    expoDb.execSync(`ALTER TABLE notes ADD COLUMN order_index INTEGER NOT NULL DEFAULT 0;`);
  } catch {
    // Column already exists, safe to ignore
  }

  // 4. Create Indexes
  try {
    expoDb.execSync(`
      CREATE INDEX IF NOT EXISTS idx_notes_folder ON notes(folder_id);
      CREATE INDEX IF NOT EXISTS idx_notes_pinned ON notes(is_pinned);
      CREATE INDEX IF NOT EXISTS idx_notes_archived ON notes(is_archived);
      CREATE INDEX IF NOT EXISTS idx_notes_deleted ON notes(is_deleted);
      CREATE INDEX IF NOT EXISTS idx_notes_order ON notes(order_index);
      CREATE INDEX IF NOT EXISTS idx_notes_updated ON notes(updated_at);
      CREATE INDEX IF NOT EXISTS idx_notes_active_feed ON notes(is_archived, is_deleted, is_pinned DESC, order_index ASC, updated_at DESC);
      CREATE INDEX IF NOT EXISTS idx_checklist_note ON checklist_items(note_id);
      CREATE INDEX IF NOT EXISTS idx_attachments_note ON attachments(note_id);
      CREATE INDEX IF NOT EXISTS idx_note_labels_label ON note_labels(label_id);
      CREATE INDEX IF NOT EXISTS idx_note_labels_note ON note_labels(note_id);
    `);
  } catch (indexError) {
    console.warn('Index creation warning:', indexError);
  }

  // 3. FTS5 Virtual Table for Instant Search
  try {
    expoDb.execSync(`
      CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
        note_id UNINDEXED,
        title,
        content
      );
    `);
  } catch (error) {
    console.warn('FTS5 table initialization skipped or not supported on this platform:', error);
  }
}
