import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as SQLite from 'expo-sqlite';
import JSZip from 'jszip';
import { Platform } from 'react-native';
import { expoDb } from '../db/db';
import { notesRepository } from '../db/repositories/notesRepository';
import { useSettingsStore } from '../store/useSettingsStore';
import { useNotesStore } from '../store/useNotesStore';

export interface BackupManifest {
  version: number;
  appName: string;
  backupTimestamp: number;
  platform: string;
  totalNotes: number;
  totalAttachments: number;
  createdAt: string;
}

export interface RestoreStats {
  foldersCount: number;
  notesCount: number;
  activeNotesCount: number;
  trashNotesCount: number;
  archivedNotesCount: number;
  attachmentsCount: number;
}

export interface RestoreResult {
  success: boolean;
  manifest?: BackupManifest;
  stats?: RestoreStats;
  message: string;
}

export interface DriveBackupFile {
  id: string;
  name: string;
  size?: string;
  createdTime?: string;
  modifiedTime?: string;
}

export class BackupService {
  private static readonly BACKUPS_DIR = `${FileSystem.documentDirectory}backups/`;
  private static readonly ATTACHMENTS_DIR = `${FileSystem.documentDirectory}attachments/`;

  /**
   * Ensure directory exists.
   */
  private static async ensureDirectoryExists(dirUri: string): Promise<void> {
    const dirInfo = await FileSystem.getInfoAsync(dirUri);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(dirUri, { intermediates: true });
    }
  }

  /**
   * Run full SQLite WAL Checkpoint to flush memory journal into notelo.db.
   */
  static checkpointDatabase(): void {
    try {
      expoDb.execSync('PRAGMA wal_checkpoint(FULL);');
    } catch (e) {
      console.warn('SQLite WAL checkpoint warning:', e);
    }
  }

  /**
   * Package notelo.db and all media attachments into a timestamped ZIP archive.
   */
  static async createLocalBackup(): Promise<{
    backupPath: string;
    fileName: string;
    size: number;
    manifest: BackupManifest;
  }> {
    // 1. Flush SQLite WAL to disk
    this.checkpointDatabase();

    await this.ensureDirectoryExists(this.BACKUPS_DIR);

    const zip = new JSZip();

    // 2. Read SQLite database using native SQLite serialization (in-memory, scheme & permission independent)
    const dbUint8Array = await expoDb.serializeAsync();
    zip.file('notelo.db', dbUint8Array);

    // 3. Read media attachments
    let attachmentsCount = 0;
    const attachDirInfo = await FileSystem.getInfoAsync(this.ATTACHMENTS_DIR);
    if (attachDirInfo.exists && attachDirInfo.isDirectory) {
      const files = await FileSystem.readDirectoryAsync(this.ATTACHMENTS_DIR);
      for (const fileName of files) {
        try {
          const filePath = `${this.ATTACHMENTS_DIR}${fileName}`;
          const fileInfo = await FileSystem.getInfoAsync(filePath);
          if (fileInfo.exists && !fileInfo.isDirectory) {
            const fileBase64 = await FileSystem.readAsStringAsync(filePath, {
              encoding: FileSystem.EncodingType.Base64,
            });
            zip.file(`attachments/${fileName}`, fileBase64, { base64: true });
            attachmentsCount++;
          }
        } catch (err) {
          console.warn(`Could not add attachment ${fileName} to backup:`, err);
        }
      }
    }

    // 4. Create metadata manifest
    const allNotes = await notesRepository.getAllNotes();
    const now = Date.now();
    const manifest: BackupManifest = {
      version: 1,
      appName: 'Notelo',
      backupTimestamp: now,
      platform: Platform.OS,
      totalNotes: allNotes.length,
      totalAttachments: attachmentsCount,
      createdAt: new Date().toISOString(),
    };

    zip.file('manifest.json', JSON.stringify(manifest, null, 2));

    // 5. Generate ZIP archive
    const zipBase64 = await zip.generateAsync({
      type: 'base64',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    const fileName = `notelo_backup_${now}.zip`;
    const backupPath = `${this.BACKUPS_DIR}${fileName}`;

    await FileSystem.writeAsStringAsync(backupPath, zipBase64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const backupInfo = await FileSystem.getInfoAsync(backupPath);
    const size = backupInfo.exists && 'size' in backupInfo ? (backupInfo.size ?? 0) : 0;

    // Update settings store
    await useSettingsStore.getState().setLastBackupInfo(now, size);

    return {
      backupPath,
      fileName,
      size,
      manifest,
    };
  }

  /**
   * Get the most recent local backup file if one exists.
   */
  static async getLatestLocalBackupPath(): Promise<string | null> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.BACKUPS_DIR);
      if (!dirInfo.exists) return null;
      const files = await FileSystem.readDirectoryAsync(this.BACKUPS_DIR);
      const zipFiles = files.filter((f) => f.endsWith('.zip'));
      if (zipFiles.length === 0) return null;
      zipFiles.sort().reverse();
      return `${this.BACKUPS_DIR}${zipFiles[0]}`;
    } catch {
      return null;
    }
  }

  /**
   * Export the backup file via native share sheet (AirDrop, WhatsApp, Drive, Files, etc.).
   */
  static async exportBackup(specificPath?: string): Promise<boolean> {
    try {
      let targetPath = specificPath;
      if (!targetPath) {
        // Reuse latest existing backup if present to avoid redundant slow compression
        const latest = await this.getLatestLocalBackupPath();
        if (latest) {
          targetPath = latest;
        } else {
          const result = await this.createLocalBackup();
          targetPath = result.backupPath;
        }
      }

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        throw new Error('Sharing is not available on this device');
      }

      await Sharing.shareAsync(targetPath, {
        mimeType: 'application/zip',
        dialogTitle: 'Export Notelo Backup',
        UTI: 'public.zip-archive',
      });

      return true;
    } catch (e) {
      console.error('Failed to export backup:', e);
      throw e;
    }
  }

  /**
   * Download / Save backup ZIP directly to the device storage.
   * On Android: uses StorageAccessFramework to create and save into a dedicated 'Notelo' folder (e.g. Downloads/Notelo).
   * On iOS / other: falls back to native sharing with 'Save to Files' dialog.
   */
  static async downloadBackupToDevice(specificPath?: string): Promise<{
    success: boolean;
    folderName?: string;
    filePath?: string;
    message: string;
  }> {
    try {
      let targetPath = specificPath;
      let targetFileName = `notelo_backup_${Date.now()}.zip`;

      if (!targetPath) {
        const result = await this.createLocalBackup();
        targetPath = result.backupPath;
        targetFileName = result.fileName;
      } else {
        const parts = targetPath.split('/');
        targetFileName = parts[parts.length - 1] || targetFileName;
      }

      if (Platform.OS === 'android') {
        const { StorageAccessFramework } = FileSystem;
        if (!StorageAccessFramework) {
          await this.exportBackup(targetPath);
          return { success: true, message: 'Shared via system sheet' };
        }

        // Request directory permission (suggesting Download folder initially)
        let initialUri: string | undefined;
        try {
          initialUri = StorageAccessFramework.getUriForDirectoryInRoot('Download');
        } catch {
          // Ignore if getUriForDirectoryInRoot is unsupported on specific vendor ROMs
        }

        const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync(initialUri);

        if (!permissions.granted) {
          return {
            success: false,
            message: 'Folder access permission was not granted.',
          };
        }

        const parentUri = permissions.directoryUri;
        let noteloFolderUri = parentUri;

        // Check if user already picked a Notelo folder or if we should create a 'Notelo' subfolder
        const decodedParent = decodeURIComponent(parentUri);
        const alreadyInNotelo =
          decodedParent.endsWith('/Notelo') ||
          decodedParent.endsWith('%2FNotelo') ||
          decodedParent.endsWith(':Notelo');

        if (!alreadyInNotelo) {
          try {
            const files = await StorageAccessFramework.readDirectoryAsync(parentUri);
            const existingNotelo = files.find((uri) => {
              const decoded = decodeURIComponent(uri);
              return (
                decoded.endsWith('/Notelo') ||
                decoded.endsWith('%2FNotelo') ||
                decoded.endsWith(':Notelo')
              );
            });

            if (existingNotelo) {
              noteloFolderUri = existingNotelo;
            } else {
              noteloFolderUri = await StorageAccessFramework.makeDirectoryAsync(parentUri, 'Notelo');
            }
          } catch (e) {
            console.warn('Could not create Notelo subfolder, saving in chosen folder:', e);
            noteloFolderUri = parentUri;
          }
        }

        // Read local backup zip base64
        const zipBase64 = await FileSystem.readAsStringAsync(targetPath, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // Create file inside Notelo folder
        const cleanBaseName = targetFileName.replace(/\.zip$/i, '');
        const createdFileUri = await StorageAccessFramework.createFileAsync(
          noteloFolderUri,
          cleanBaseName,
          'application/zip'
        );

        await FileSystem.writeAsStringAsync(createdFileUri, zipBase64, {
          encoding: FileSystem.EncodingType.Base64,
        });

        return {
          success: true,
          folderName: 'Notelo',
          filePath: createdFileUri,
          message: 'Backup downloaded successfully to your Notelo folder!',
        };
      } else {
        const isAvailable = await Sharing.isAvailableAsync();
        if (!isAvailable) {
          throw new Error('Sharing is not available on this device');
        }

        await Sharing.shareAsync(targetPath, {
          mimeType: 'application/zip',
          dialogTitle: 'Save Notelo Backup to Files',
          UTI: 'public.zip-archive',
        });

        return {
          success: true,
          folderName: 'Files',
          message: 'Saved to Files successfully!',
        };
      }
    } catch (e: any) {
      console.error('Failed to download backup to device:', e);
      return {
        success: false,
        message: e?.message || 'Failed to save backup to device',
      };
    }
  }

  /**
   * Pick a backup ZIP file and restore notelo.db and attachments offline.
   */
  static async pickAndRestoreBackup(): Promise<RestoreResult> {
    try {
      const pickerResult = await DocumentPicker.getDocumentAsync({
        type: ['application/zip', 'application/x-zip-compressed', 'application/octet-stream', '*/*'],
        copyToCacheDirectory: true,
      });

      if (pickerResult.canceled || !pickerResult.assets || pickerResult.assets.length === 0) {
        return { success: false, message: 'Backup selection cancelled' };
      }

      const selectedAsset = pickerResult.assets[0];
      return await this.restoreBackupFromFile(selectedAsset.uri);
    } catch (e: any) {
      console.error('Error during backup import:', e);
      return { success: false, message: e?.message || 'Restore failed' };
    }
  }

  /**
   * Restore notelo.db and attachments from a specific ZIP file URI.
   */
  static async restoreBackupFromFile(fileUri: string): Promise<RestoreResult> {
    try {
      const zipBase64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const zip = await JSZip.loadAsync(zipBase64, { base64: true });

      // 1. Verify notelo.db exists in zip
      const dbFile = zip.file('notelo.db');
      if (!dbFile) {
        return { success: false, message: 'Invalid Notelo backup: notelo.db not found' };
      }

      // 2. Read manifest if present
      let manifest: BackupManifest | undefined;
      const manifestFile = zip.file('manifest.json');
      if (manifestFile) {
        try {
          const manifestText = await manifestFile.async('text');
          manifest = JSON.parse(manifestText);
        } catch {
          // Non-fatal if manifest parsing fails
        }
      }

      // 3. Unpack attachments
      await this.ensureDirectoryExists(this.ATTACHMENTS_DIR);
      const attachmentFiles = zip.filter((path) => path.startsWith('attachments/') && !path.endsWith('/'));

      for (const item of attachmentFiles) {
        const itemFileName = item.name.replace('attachments/', '');
        if (itemFileName) {
          const fileData = await item.async('base64');
          await FileSystem.writeAsStringAsync(`${this.ATTACHMENTS_DIR}${itemFileName}`, fileData, {
            encoding: FileSystem.EncodingType.Base64,
          });
        }
      }

      // 4. Overwrite SQLite database safely using atomic transactional table restore
      // Extract notelo.db from ZIP into a temporary SQLite database file
      const dbBase64 = await dbFile.async('base64');
      const sqliteDir = `${FileSystem.documentDirectory}SQLite/`;
      await this.ensureDirectoryExists(sqliteDir);
      const tempRestoreUri = `${sqliteDir}temp_restore.db`;

      // Clean up previous temporary database if exists
      await FileSystem.deleteAsync(tempRestoreUri, { idempotent: true });
      await FileSystem.deleteAsync(`${tempRestoreUri}-wal`, { idempotent: true });
      await FileSystem.deleteAsync(`${tempRestoreUri}-shm`, { idempotent: true });

      await FileSystem.writeAsStringAsync(tempRestoreUri, dbBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const tempDb = SQLite.openDatabaseSync('temp_restore.db');

      let tempFolders: any[] = [];
      let tempLabels: any[] = [];
      let tempNotes: any[] = [];
      let tempChecklists: any[] = [];
      let tempNoteLabels: any[] = [];
      let tempAttachments: any[] = [];

      try {
        tempFolders = tempDb.getAllSync<any>('SELECT * FROM folders');
      } catch (err) {
        console.warn('[BackupService] Could not read folders from backup db:', err);
      }

      try {
        tempLabels = tempDb.getAllSync<any>('SELECT * FROM labels');
      } catch (err) {
        console.warn('[BackupService] Could not read labels from backup db:', err);
      }

      try {
        tempNotes = tempDb.getAllSync<any>('SELECT * FROM notes');
      } catch (err) {
        console.warn('[BackupService] Could not read notes from backup db:', err);
      }

      try {
        tempChecklists = tempDb.getAllSync<any>('SELECT * FROM checklist_items');
      } catch (err) {
        console.warn('[BackupService] Could not read checklist_items from backup db:', err);
      }

      try {
        tempNoteLabels = tempDb.getAllSync<any>('SELECT * FROM note_labels');
      } catch (err) {
        console.warn('[BackupService] Could not read note_labels from backup db:', err);
      }

      try {
        tempAttachments = tempDb.getAllSync<any>('SELECT * FROM attachments');
      } catch (err) {
        console.warn('[BackupService] Could not read attachments from backup db:', err);
      }

      console.log(
        `[BackupService] Extracted ${tempFolders.length} folders, ${tempNotes.length} notes, ${tempChecklists.length} checklists, ${tempAttachments.length} attachments`
      );

      // Close and cleanup temporary DB
      try {
        tempDb.closeSync();
      } catch {}

      try {
        SQLite.deleteDatabaseSync('temp_restore.db');
      } catch {
        await FileSystem.deleteAsync(tempRestoreUri, { idempotent: true });
      }

      // Safeguard: Check that we actually extracted something if manifest indicated notes
      if (tempNotes.length === 0 && tempFolders.length === 0 && manifest && manifest.totalNotes > 0) {
        throw new Error('Failed to read notes from backup archive. The backup database could not be loaded.');
      }

      // Atomic in-database replacement (prevents all OS file lock and Java IOException issues)
      expoDb.withTransactionSync(() => {
        expoDb.execSync('PRAGMA foreign_keys = OFF;');

        expoDb.execSync(`
          DELETE FROM note_labels;
          DELETE FROM checklist_items;
          DELETE FROM attachments;
          DELETE FROM notes;
          DELETE FROM labels;
          DELETE FROM folders;
        `);

        try {
          expoDb.execSync('DELETE FROM notes_fts;');
        } catch {}

        // Insert Folders
        if (tempFolders.length > 0) {
          const folderStmt = expoDb.prepareSync(
            'INSERT OR REPLACE INTO folders (id, name, color, icon, order_index, created_at) VALUES (?, ?, ?, ?, ?, ?)'
          );
          try {
            for (const f of tempFolders) {
              folderStmt.executeSync([
                f.id,
                f.name,
                f.color ?? '#64748B',
                f.icon ?? 'folder',
                f.order_index ?? 0,
                f.created_at ?? Math.floor(Date.now() / 1000),
              ]);
            }
          } finally {
            folderStmt.finalizeSync();
          }
        }

        // Insert Labels
        if (tempLabels.length > 0) {
          const labelStmt = expoDb.prepareSync(
            'INSERT OR REPLACE INTO labels (id, name, created_at) VALUES (?, ?, ?)'
          );
          try {
            for (const l of tempLabels) {
              labelStmt.executeSync([
                l.id,
                l.name,
                l.created_at ?? Math.floor(Date.now() / 1000),
              ]);
            }
          } finally {
            labelStmt.finalizeSync();
          }
        }

        // Insert Notes
        if (tempNotes.length > 0) {
          const noteStmt = expoDb.prepareSync(`
            INSERT OR REPLACE INTO notes (
              id, folder_id, title, content, note_type, color,
              is_pinned, is_archived, is_deleted, deleted_at,
              is_locked, reminder_at, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
          try {
            for (const n of tempNotes) {
              noteStmt.executeSync([
                n.id,
                n.folder_id ?? null,
                n.title ?? '',
                n.content ?? '',
                n.note_type ?? 'text',
                n.color ?? '#FFFFFF',
                n.is_pinned ? 1 : 0,
                n.is_archived ? 1 : 0,
                n.is_deleted ? 1 : 0,
                n.deleted_at ?? null,
                n.is_locked ? 1 : 0,
                n.reminder_at ?? null,
                n.created_at ?? Math.floor(Date.now() / 1000),
                n.updated_at ?? Math.floor(Date.now() / 1000),
              ]);
            }
          } finally {
            noteStmt.finalizeSync();
          }

          // Populate FTS5 for restored notes
          try {
            const ftsStmt = expoDb.prepareSync('INSERT INTO notes_fts (note_id, title, content) VALUES (?, ?, ?)');
            try {
              for (const n of tempNotes) {
                if (!n.is_deleted) {
                  ftsStmt.executeSync([n.id, n.title ?? '', n.content ?? '']);
                }
              }
            } finally {
              ftsStmt.finalizeSync();
            }
          } catch (ftsErr) {
            console.warn('FTS rebuild skipped:', ftsErr);
          }
        }

        // Insert Checklist Items
        if (tempChecklists.length > 0) {
          const checklistStmt = expoDb.prepareSync(
            'INSERT OR REPLACE INTO checklist_items (id, note_id, text, is_completed, order_index, created_at) VALUES (?, ?, ?, ?, ?, ?)'
          );
          try {
            for (const c of tempChecklists) {
              checklistStmt.executeSync([
                c.id,
                c.note_id,
                c.text ?? '',
                c.is_completed ? 1 : 0,
                c.order_index ?? 0,
                c.created_at ?? Math.floor(Date.now() / 1000),
              ]);
            }
          } finally {
            checklistStmt.finalizeSync();
          }
        }

        // Insert Note Labels
        if (tempNoteLabels.length > 0) {
          const nlStmt = expoDb.prepareSync(
            'INSERT OR REPLACE INTO note_labels (note_id, label_id) VALUES (?, ?)'
          );
          try {
            for (const nl of tempNoteLabels) {
              nlStmt.executeSync([nl.note_id, nl.label_id]);
            }
          } finally {
            nlStmt.finalizeSync();
          }
        }

        // Insert Attachments
        if (tempAttachments.length > 0) {
          const attachStmt = expoDb.prepareSync(
            'INSERT OR REPLACE INTO attachments (id, note_id, local_uri, mime_type, file_size, created_at) VALUES (?, ?, ?, ?, ?, ?)'
          );
          try {
            for (const a of tempAttachments) {
              const fileName = a.local_uri ? a.local_uri.split('/').pop() : '';
              const correctedUri = fileName ? `${this.ATTACHMENTS_DIR}${fileName}` : a.local_uri;
              attachStmt.executeSync([
                a.id,
                a.note_id,
                correctedUri,
                a.mime_type,
                a.file_size ?? 0,
                a.created_at ?? Math.floor(Date.now() / 1000),
              ]);
            }
          } finally {
            attachStmt.finalizeSync();
          }
        }

        expoDb.execSync('PRAGMA foreign_keys = ON;');
      });

      this.checkpointDatabase();

      // 5. Reload notes, folders, and labels in Zustand store
      await useNotesStore.getState().fetchFoldersAndLabels();
      await useNotesStore.getState().fetchNotes('all');

      const stats: RestoreStats = {
        foldersCount: tempFolders.length,
        notesCount: tempNotes.length,
        activeNotesCount: tempNotes.filter((n) => !n.is_deleted && !n.is_archived).length,
        trashNotesCount: tempNotes.filter((n) => n.is_deleted).length,
        archivedNotesCount: tempNotes.filter((n) => n.is_archived && !n.is_deleted).length,
        attachmentsCount: tempAttachments.length,
      };

      return {
        success: true,
        manifest,
        stats,
        message: 'Notes and attachments restored successfully!',
      };
    } catch (e: any) {
      console.error('Failed to unpack and restore backup:', e);
      return { success: false, message: e?.message || 'Restore failed' };
    }
  }

  /**
   * Google Drive AppData REST Sync Service
   * Interacts directly with Google Drive REST API v3 using the hidden appDataFolder.
   */
  static GoogleDrive = {
    /**
     * Upload backup zip archive to Google Drive appDataFolder.
     */
    async uploadBackup(accessToken: string, backupFilePath: string, fileName: string): Promise<string> {
      const fileInfo = await FileSystem.getInfoAsync(backupFilePath);
      if (!fileInfo.exists) {
        throw new Error('Backup file does not exist');
      }

      const metadata = {
        name: fileName,
        parents: ['appDataFolder'],
        mimeType: 'application/zip',
        description: 'Notelo WhatsApp-Style App Backup',
      };

      const fileBase64 = await FileSystem.readAsStringAsync(backupFilePath, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Multipart upload format
      const boundary = 'foo_bar_baz';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/zip\r\n' +
        'Content-Transfer-Encoding: base64\r\n\r\n' +
        fileBase64 +
        closeDelimiter;

      const response = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: multipartRequestBody,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Google Drive upload failed: ${response.status} - ${errorText}`);
      }

      const json = await response.json();
      return json.id;
    },

    /**
     * List all backup files stored in appDataFolder.
     */
    async listBackups(accessToken: string): Promise<DriveBackupFile[]> {
      const url =
        'https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&fields=files(id,name,size,modifiedTime,createdTime)&orderBy=modifiedTime desc';

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Google Drive list failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return (data.files || []) as DriveBackupFile[];
    },

    /**
     * Download a backup from Google Drive and restore locally.
     */
    async downloadAndRestore(accessToken: string, fileId: string): Promise<{ success: boolean; message: string }> {
      const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
      const tempPath = `${FileSystem.cacheDirectory}drive_restore_${Date.now()}.zip`;

      const downloadResult = await FileSystem.downloadAsync(downloadUrl, tempPath, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (downloadResult.status !== 200) {
        throw new Error(`Download failed with status ${downloadResult.status}`);
      }

      return await BackupService.restoreBackupFromFile(downloadResult.uri);
    },
  };
}
