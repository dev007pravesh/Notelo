import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import dayjs from 'dayjs';
import { db, expoDb } from '../db';
import { notes } from '../schema';
import { sql } from 'drizzle-orm';

const MIGRATION_FLAG_KEY = 'has_migrated_v1_to_v2';
const LEGACY_STORAGE_KEY = 'addedNotes';

interface LegacyNote {
  id?: string;
  shortTitle?: string;
  description?: string;
  addedDate?: string; // "YYYY-MM-DD"
  addedTime?: string; // "hh:mm A"
  lastModified?: number; // epoch ms
}

export class AsyncStorageMigrationService {
  /**
   * Checks whether legacy notes from AsyncStorage need to be migrated to SQLite.
   * Runs exactly once on app update. Safe, idempotent, and non-destructive.
   */
  static async migrateIfNeeded(): Promise<{ migratedCount: number; alreadyMigrated: boolean }> {
    try {
      // 1. Check if already migrated
      const hasMigrated = await SecureStore.getItemAsync(MIGRATION_FLAG_KEY);
      if (hasMigrated === 'true') {
        return { migratedCount: 0, alreadyMigrated: true };
      }

      // 2. Read legacy notes from AsyncStorage
      const rawData = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
      if (!rawData) {
        // No legacy notes present, mark migrated and exit
        await SecureStore.setItemAsync(MIGRATION_FLAG_KEY, 'true');
        return { migratedCount: 0, alreadyMigrated: false };
      }

      const legacyNotes: LegacyNote[] = JSON.parse(rawData);
      if (!Array.isArray(legacyNotes) || legacyNotes.length === 0) {
        await SecureStore.setItemAsync(MIGRATION_FLAG_KEY, 'true');
        return { migratedCount: 0, alreadyMigrated: false };
      }

      console.log(`[Migration] Found ${legacyNotes.length} legacy notes in AsyncStorage. Starting migration to SQLite...`);

      // 3. Batch insert in a single transaction
      let insertedCount = 0;
      await db.transaction(async (tx) => {
        for (const item of legacyNotes) {
          const id = item.id || `migrated_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
          const title = (item.shortTitle || '').trim();
          const content = (item.description || '').trim();

          // Calculate createdAt from addedDate & addedTime, fallback to lastModified or now
          let createdAt = new Date();
          if (item.addedDate) {
            const dateTimeStr = item.addedTime ? `${item.addedDate} ${item.addedTime}` : item.addedDate;
            const parsed = dayjs(dateTimeStr, ['YYYY-MM-DD hh:mm A', 'YYYY-MM-DD']);
            if (parsed.isValid()) {
              createdAt = parsed.toDate();
            }
          } else if (item.lastModified) {
            createdAt = new Date(item.lastModified);
          }

          const updatedAt = item.lastModified ? new Date(item.lastModified) : createdAt;

          await tx
            .insert(notes)
            .values({
              id,
              title,
              content,
              noteType: 'text',
              color: '#FFFFFF',
              isPinned: false,
              isArchived: false,
              isDeleted: false,
              createdAt,
              updatedAt,
            })
            .onConflictDoNothing();

          // Update FTS5 index
          try {
            expoDb.runSync(
              `INSERT INTO notes_fts (note_id, title, content) VALUES (?, ?, ?)`,
              [id, title, content]
            );
          } catch {
            // Ignore if FTS not available
          }

          insertedCount++;
        }
      });

      // 4. Mark migration complete in SecureStore
      await SecureStore.setItemAsync(MIGRATION_FLAG_KEY, 'true');
      console.log(`[Migration] Successfully migrated ${insertedCount} notes from AsyncStorage to SQLite.`);

      return { migratedCount: insertedCount, alreadyMigrated: false };
    } catch (error) {
      console.error('[Migration] Failed to migrate legacy notes to SQLite:', error);
      // We do NOT set the flag so it will safely retry next launch
      throw error;
    }
  }
}
