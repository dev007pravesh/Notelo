import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

export type ViewMode = 'grid' | 'list';
export type ThemeMode = 'light' | 'dark' | 'system';

interface SettingsState {
  viewMode: ViewMode;
  theme: ThemeMode;
  appLockEnabled: boolean;
  biometricAuthEnabled: boolean;
  isAppLocked: boolean;
  hasPasscode: boolean;
  autoBackupEnabled: boolean;
  lastBackupTimestamp: number | null;
  lastBackupSize: number | null;
  isInitialized: boolean;

  // Actions
  setViewMode: (mode: ViewMode) => Promise<void>;
  setTheme: (theme: ThemeMode) => Promise<void>;
  setAppLockEnabled: (enabled: boolean) => Promise<void>;
  setBiometricAuthEnabled: (enabled: boolean) => Promise<void>;
  setIsAppLocked: (locked: boolean) => void;
  setPasscode: (pin: string) => Promise<void>;
  verifyPasscode: (pin: string) => Promise<boolean>;
  removePasscode: () => Promise<void>;
  setAutoBackupEnabled: (enabled: boolean) => Promise<void>;
  setLastBackupInfo: (timestamp: number, size: number) => Promise<void>;
  initializeSettings: () => Promise<void>;
}

const STORAGE_KEYS = {
  VIEW_MODE: 'notelo_view_mode',
  THEME: 'notelo_theme_mode',
  APP_LOCK_ENABLED: 'notelo_app_lock_enabled',
  BIOMETRIC_ENABLED: 'notelo_biometric_enabled',
  AUTO_BACKUP: 'notelo_auto_backup_enabled',
  LAST_BACKUP_TIME: 'notelo_last_backup_time',
  LAST_BACKUP_SIZE: 'notelo_last_backup_size',
};

const SECURE_KEYS = {
  PIN_HASH: 'notelo_secure_pin_hash',
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  viewMode: 'grid',
  theme: 'light',
  appLockEnabled: false,
  biometricAuthEnabled: true,
  isAppLocked: false,
  hasPasscode: false,
  autoBackupEnabled: false,
  lastBackupTimestamp: null,
  lastBackupSize: null,
  isInitialized: false,

  setViewMode: async (mode: ViewMode) => {
    set({ viewMode: mode });
    await AsyncStorage.setItem(STORAGE_KEYS.VIEW_MODE, mode);
  },

  setTheme: async (theme: ThemeMode) => {
    set({ theme });
    await AsyncStorage.setItem(STORAGE_KEYS.THEME, theme);
  },

  setAppLockEnabled: async (enabled: boolean) => {
    set({ appLockEnabled: enabled });
    await AsyncStorage.setItem(STORAGE_KEYS.APP_LOCK_ENABLED, enabled ? 'true' : 'false');
  },

  setBiometricAuthEnabled: async (enabled: boolean) => {
    set({ biometricAuthEnabled: enabled });
    await AsyncStorage.setItem(STORAGE_KEYS.BIOMETRIC_ENABLED, enabled ? 'true' : 'false');
  },

  setIsAppLocked: (locked: boolean) => {
    set({ isAppLocked: locked });
  },

  setPasscode: async (pin: string) => {
    const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, pin);
    await SecureStore.setItemAsync(SECURE_KEYS.PIN_HASH, hash);
    set({ hasPasscode: true, appLockEnabled: true });
    await AsyncStorage.setItem(STORAGE_KEYS.APP_LOCK_ENABLED, 'true');
  },

  verifyPasscode: async (pin: string) => {
    const savedHash = await SecureStore.getItemAsync(SECURE_KEYS.PIN_HASH);
    if (!savedHash) return false;
    const inputHash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, pin);
    return savedHash === inputHash;
  },

  removePasscode: async () => {
    await SecureStore.deleteItemAsync(SECURE_KEYS.PIN_HASH);
    set({ hasPasscode: false, appLockEnabled: false, isAppLocked: false });
    await AsyncStorage.setItem(STORAGE_KEYS.APP_LOCK_ENABLED, 'false');
  },

  setAutoBackupEnabled: async (enabled: boolean) => {
    set({ autoBackupEnabled: enabled });
    await AsyncStorage.setItem(STORAGE_KEYS.AUTO_BACKUP, enabled ? 'true' : 'false');
  },

  setLastBackupInfo: async (timestamp: number, size: number) => {
    set({ lastBackupTimestamp: timestamp, lastBackupSize: size });
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.LAST_BACKUP_TIME, timestamp.toString()),
      AsyncStorage.setItem(STORAGE_KEYS.LAST_BACKUP_SIZE, size.toString()),
    ]);
  },

  initializeSettings: async () => {
    try {
      const [viewMode, theme, lockEnabled, biometric, autoBackup, pinHash, lastTime, lastSize] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.VIEW_MODE),
        AsyncStorage.getItem(STORAGE_KEYS.THEME),
        AsyncStorage.getItem(STORAGE_KEYS.APP_LOCK_ENABLED),
        AsyncStorage.getItem(STORAGE_KEYS.BIOMETRIC_ENABLED),
        AsyncStorage.getItem(STORAGE_KEYS.AUTO_BACKUP),
        SecureStore.getItemAsync(SECURE_KEYS.PIN_HASH),
        AsyncStorage.getItem(STORAGE_KEYS.LAST_BACKUP_TIME),
        AsyncStorage.getItem(STORAGE_KEYS.LAST_BACKUP_SIZE),
      ]);

      const isLockOn = lockEnabled === 'true' && !!pinHash;

      set({
        viewMode: (viewMode as ViewMode) || 'grid',
        theme: (theme as ThemeMode) || 'light',
        appLockEnabled: isLockOn,
        biometricAuthEnabled: biometric !== 'false',
        isAppLocked: isLockOn, // Start locked if lock is enabled
        hasPasscode: !!pinHash,
        autoBackupEnabled: autoBackup === 'true',
        lastBackupTimestamp: lastTime ? parseInt(lastTime, 10) : null,
        lastBackupSize: lastSize ? parseInt(lastSize, 10) : null,
        isInitialized: true,
      });
    } catch (e) {
      console.error('Error initializing settings:', e);
      set({ isInitialized: true });
    }
  },
}));
