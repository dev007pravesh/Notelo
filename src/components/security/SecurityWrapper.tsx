import React, { useEffect, useRef } from 'react';
import { AppState, AppStateStatus, StyleSheet, View } from 'react-native';
import { useSettingsStore } from '../../store/useSettingsStore';
import { AppLockScreen } from './AppLockScreen';

const AUTO_LOCK_TIMEOUT_MS = 30_000; // 30 seconds

export const SecurityWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    appLockEnabled,
    isAppLocked,
    isInitialized,
    setIsAppLocked,
    initializeSettings,
  } = useSettingsStore();

  const backgroundTimestampRef = useRef<number | null>(null);

  useEffect(() => {
    initializeSettings();
  }, []);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        backgroundTimestampRef.current = Date.now();
      } else if (nextAppState === 'active') {
        if (backgroundTimestampRef.current && appLockEnabled) {
          const elapsed = Date.now() - backgroundTimestampRef.current;
          if (elapsed > AUTO_LOCK_TIMEOUT_MS) {
            setIsAppLocked(true);
          }
        }
        backgroundTimestampRef.current = null;
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [appLockEnabled]);

  return (
    <View style={styles.container}>
      {children}
      {isInitialized && appLockEnabled && isAppLocked && <AppLockScreen />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
