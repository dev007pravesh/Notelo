import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
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

    // 2. Read SQLite database file
    const dbPath = expoDb.databasePath;
    const dbBase64 = await FileSystem.readAsStringAsync(dbPath, {
      encoding: FileSystem.EncodingType.Base64,
    });
    zip.file('notelo.db', dbBase64, { base64: true });

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
   * Export the backup file via native share sheet (AirDrop, WhatsApp, Drive, Files, etc.).
   */
  static async exportBackup(specificPath?: string): Promise<boolean> {
    try {
      let targetPath = specificPath;
      if (!targetPath) {
        const result = await this.createLocalBackup();
        targetPath = result.backupPath;
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
   * Pick a backup ZIP file and restore notelo.db and attachments offline.
   */
  static async pickAndRestoreBackup(): Promise<{
    success: boolean;
    manifest?: BackupManifest;
    message: string;
  }> {
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
  static async restoreBackupFromFile(fileUri: string): Promise<{
    success: boolean;
    manifest?: BackupManifest;
    message: string;
  }> {
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

      // 4. Overwrite SQLite database file
      const dbBase64 = await dbFile.async('base64');
      const dbPath = expoDb.databasePath;

      await FileSystem.writeAsStringAsync(dbPath, dbBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // 5. Run WAL checkpoint to synchronize
      this.checkpointDatabase();

      // 6. Reload notes and folders in Zustand store
      await useNotesStore.getState().fetchNotes();

      return {
        success: true,
        manifest,
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
