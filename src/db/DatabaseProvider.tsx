import React, { createContext, useContext, useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { initDatabase } from './db';
import { AsyncStorageMigrationService } from './migration/AsyncStorageMigrationService';

interface DatabaseContextValue {
  isReady: boolean;
  migratedCount: number;
}

const DatabaseContext = createContext<DatabaseContextValue>({
  isReady: false,
  migratedCount: 0,
});

export const useDatabase = () => useContext(DatabaseContext);

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [migratedCount, setMigratedCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function setup() {
      try {
        // 1. Initialize SQLite tables, pragmas & FTS5
        await initDatabase();

        // 2. Run legacy AsyncStorage migration if needed
        const result = await AsyncStorageMigrationService.migrateIfNeeded();
        if (isMounted) {
          setMigratedCount(result.migratedCount);
          setIsReady(true);
        }
      } catch (error) {
        console.error('Database initialization error:', error);
        // Fallback to ready so app doesn't stay permanently stuck
        if (isMounted) setIsReady(true);
      }
    }

    setup();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading Notelo...</Text>
      </View>
    );
  }

  return (
    <DatabaseContext.Provider value={{ isReady, migratedCount }}>
      {children}
    </DatabaseContext.Provider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
});
