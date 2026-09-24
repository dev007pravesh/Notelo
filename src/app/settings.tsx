import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSettingsStore, ViewMode, ThemeMode } from '../store/useSettingsStore';
import { BackupService, BackupManifest } from '../services/backupService';
import dayjs from 'dayjs';

export default function SettingsScreen() {
  const {
    viewMode,
    theme,
    appLockEnabled,
    biometricAuthEnabled,
    hasPasscode,
    autoBackupEnabled,
    lastBackupTimestamp,
    lastBackupSize,
    setViewMode,
    setTheme,
    setAppLockEnabled,
    setBiometricAuthEnabled,
    setPasscode,
    removePasscode,
    setAutoBackupEnabled,
  } = useSettingsStore();

  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pinStep, setPinStep] = useState<'create' | 'confirm'>('create');
  const [enteredPin, setEnteredPin] = useState('');
  const [firstPin, setFirstPin] = useState('');
  const [pinError, setPinError] = useState('');

  // Handle Backup Now
  const handleBackupNow = async () => {
    try {
      setIsBackingUp(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const result = await BackupService.createLocalBackup();

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Backup Complete',
        `Successfully backed up ${result.manifest.totalNotes} notes and ${result.manifest.totalAttachments} attachments (${(result.size / 1024).toFixed(1)} KB).`,
        [
          { text: 'OK' },
          {
            text: 'Share / Export',
            onPress: () => BackupService.exportBackup(result.backupPath),
          },
        ]
      );
    } catch (e: any) {
      console.error('Backup error:', e);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Backup Failed', e?.message || 'Could not complete backup');
    } finally {
      setIsBackingUp(false);
    }
  };

  // Handle Export Backup
  const handleExportBackup = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await BackupService.exportBackup();
    } catch (e: any) {
      Alert.alert('Export Failed', e?.message || 'Could not export backup archive');
    }
  };

  // Handle Restore
  const handleRestore = async () => {
    Alert.alert(
      'Restore Backup',
      'Restoring a backup will unpack your saved notes, checklists, and attachments into your local storage. Do you want to continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Choose Backup File',
          onPress: async () => {
            try {
              setIsRestoring(true);
              const result = await BackupService.pickAndRestoreBackup();
              if (result.success) {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert(
                  'Restore Successful',
                  result.manifest
                    ? `Restored ${result.manifest.totalNotes} notes and ${result.manifest.totalAttachments} attachments.`
                    : 'Notes and attachments restored successfully!'
                );
              } else if (result.message !== 'Backup selection cancelled') {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                Alert.alert('Restore Failed', result.message);
              }
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to restore backup');
            } finally {
              setIsRestoring(false);
            }
          },
        },
      ]
    );
  };

  // Handle App Lock toggle
  const handleToggleAppLock = async (value: boolean) => {
    if (value) {
      if (!hasPasscode) {
        // Open PIN modal
        setPinStep('create');
        setEnteredPin('');
        setFirstPin('');
        setPinError('');
        setPinModalVisible(true);
      } else {
        await setAppLockEnabled(true);
      }
    } else {
      Alert.alert(
        'Disable App Lock',
        'Are you sure you want to remove passcode protection from Notelo?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: async () => {
              await removePasscode();
            },
          },
        ]
      );
    }
  };

  // Handle PIN input in keypad
  const handleKeypadPress = async (digit: string) => {
    if (enteredPin.length >= 4) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newPin = enteredPin + digit;
    setEnteredPin(newPin);

    if (newPin.length === 4) {
      if (pinStep === 'create') {
        setFirstPin(newPin);
        setPinStep('confirm');
        setEnteredPin('');
      } else {
        // Confirm step
        if (newPin === firstPin) {
          await setPasscode(newPin);
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setPinModalVisible(false);
          Alert.alert('Success', 'Passcode successfully set and App Lock enabled!');
        } else {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setPinError('Passcodes do not match. Try again.');
          setPinStep('create');
          setEnteredPin('');
          setFirstPin('');
        }
      }
    }
  };

  const handleKeypadDelete = async () => {
    if (enteredPin.length > 0) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setEnteredPin(enteredPin.slice(0, -1));
    }
  };

  const formattedBackupDate = lastBackupTimestamp
    ? dayjs(lastBackupTimestamp).format('MMM D, YYYY [at] h:mm A')
    : 'Never';

  const formattedBackupSize = lastBackupSize
    ? lastBackupSize > 1024 * 1024
      ? `${(lastBackupSize / (1024 * 1024)).toFixed(1)} MB`
      : `${(lastBackupSize / 1024).toFixed(0)} KB`
    : '0 KB';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* SECTION: BACKUP & RESTORE */}
        <Text style={styles.sectionHeader}>BACKUP & RESTORE</Text>
        <View style={styles.card}>
          <View style={styles.backupHeader}>
            <View style={styles.backupIconContainer}>
              <MaterialCommunityIcons name="shield-sync-outline" size={28} color="#10B981" />
            </View>
            <View style={styles.backupInfo}>
              <Text style={styles.backupTitle}>Zero-Server Backup</Text>
              <Text style={styles.backupSubtitle}>
                Private offline archive with database & attachments
              </Text>
            </View>
          </View>

          <View style={styles.backupMetaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Last Local Backup</Text>
              <Text style={styles.metaValue}>{formattedBackupDate}</Text>
            </View>
            <View style={styles.metaItemRight}>
              <Text style={styles.metaLabel}>Backup Size</Text>
              <Text style={styles.metaValue}>{formattedBackupSize}</Text>
            </View>
          </View>

          {/* Action: Backup Now */}
          <TouchableOpacity
            style={[styles.primaryButton, isBackingUp && { opacity: 0.7 }]}
            onPress={handleBackupNow}
            disabled={isBackingUp || isRestoring}
          >
            {isBackingUp ? (
              <ActivityIndicator color="#000000" size="small" />
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={20} color="#000000" />
                <Text style={styles.primaryButtonText}>Back Up Now</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.cardDivider} />

          {/* Secondary Actions */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleExportBackup}
              disabled={isBackingUp || isRestoring}
            >
              <Feather name="share-2" size={17} color="#FFFFFF" />
              <Text style={styles.secondaryButtonText}>Export ZIP</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleRestore}
              disabled={isBackingUp || isRestoring}
            >
              {isRestoring ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Feather name="download" size={17} color="#FFFFFF" />
                  <Text style={styles.secondaryButtonText}>Restore ZIP</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.cardDivider} />

          {/* Auto Backup Toggle */}
          <View style={styles.row}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.rowTitle}>Auto-Backup to Local Archive</Text>
              <Text style={styles.rowSubtitle}>
                Automatically snapshot database and media weekly
              </Text>
            </View>
            <Switch
              value={autoBackupEnabled}
              onValueChange={setAutoBackupEnabled}
              trackColor={{ false: '#374151', true: '#10B981' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* SECTION: SECURITY & APP LOCK */}
        <Text style={styles.sectionHeader}>SECURITY</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.rowTitle}>App Lock (PIN Passcode)</Text>
              <Text style={styles.rowSubtitle}>
                Require 4-digit PIN when opening Notelo
              </Text>
            </View>
            <Switch
              value={appLockEnabled}
              onValueChange={handleToggleAppLock}
              trackColor={{ false: '#374151', true: '#6366F1' }}
              thumbColor="#FFFFFF"
            />
          </View>

          {appLockEnabled && (
            <>
              <View style={styles.cardDivider} />
              <View style={styles.row}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.rowTitle}>Biometric Authentication</Text>
                  <Text style={styles.rowSubtitle}>
                    Use Face ID or Fingerprint to unlock
                  </Text>
                </View>
                <Switch
                  value={biometricAuthEnabled}
                  onValueChange={setBiometricAuthEnabled}
                  trackColor={{ false: '#374151', true: '#6366F1' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={styles.cardDivider} />
              <TouchableOpacity
                style={styles.clickableRow}
                onPress={() => {
                  setPinStep('create');
                  setEnteredPin('');
                  setFirstPin('');
                  setPinError('');
                  setPinModalVisible(true);
                }}
              >
                <Text style={styles.clickableRowText}>Change Passcode</Text>
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* SECTION: DISPLAY & PREFERENCES */}
        <Text style={styles.sectionHeader}>DISPLAY & PREFERENCES</Text>
        <View style={styles.card}>
          {/* Feed View Mode */}
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Default Note Layout</Text>
              <Text style={styles.rowSubtitle}>Masonry Grid or Single Column List</Text>
            </View>
            <View style={styles.segmentedControl}>
              <TouchableOpacity
                style={[
                  styles.segmentOption,
                  viewMode === 'grid' && styles.segmentOptionActive,
                ]}
                onPress={() => setViewMode('grid')}
              >
                <Ionicons
                  name="grid-outline"
                  size={16}
                  color={viewMode === 'grid' ? '#000000' : '#9CA3AF'}
                />
                <Text
                  style={[
                    styles.segmentText,
                    viewMode === 'grid' && styles.segmentTextActive,
                  ]}
                >
                  Grid
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.segmentOption,
                  viewMode === 'list' && styles.segmentOptionActive,
                ]}
                onPress={() => setViewMode('list')}
              >
                <Ionicons
                  name="list-outline"
                  size={16}
                  color={viewMode === 'list' ? '#000000' : '#9CA3AF'}
                />
                <Text
                  style={[
                    styles.segmentText,
                    viewMode === 'list' && styles.segmentTextActive,
                  ]}
                >
                  List
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* SECTION: ABOUT & PRIVACY */}
        <Text style={styles.sectionHeader}>ABOUT NOTELO</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowTitle}>App Version</Text>
            <Text style={styles.metaValue}>1.0.4 (Build 5)</Text>
          </View>
          <View style={styles.cardDivider} />
          <View style={styles.row}>
            <Text style={styles.rowTitle}>Database Engine</Text>
            <Text style={styles.metaValue}>SQLite 3 (WAL + FTS5)</Text>
          </View>
          <View style={styles.cardDivider} />
          <View style={styles.row}>
            <Text style={styles.rowTitle}>Privacy Architecture</Text>
            <Text style={[styles.metaValue, { color: '#10B981' }]}>100% Offline & Private</Text>
          </View>
        </View>
      </ScrollView>

      {/* PIN SETUP MODAL */}
      <Modal
        visible={pinModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPinModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setPinModalVisible(false)}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Set Passcode</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.pinContent}>
            <MaterialCommunityIcons name="lock-outline" size={48} color="#6366F1" />
            <Text style={styles.pinPrompt}>
              {pinStep === 'create' ? 'Enter a 4-digit passcode' : 'Confirm your 4-digit passcode'}
            </Text>

            {/* PIN Dots */}
            <View style={styles.dotsContainer}>
              {[0, 1, 2, 3].map((index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    enteredPin.length > index && styles.dotFilled,
                  ]}
                />
              ))}
            </View>

            {pinError ? <Text style={styles.errorText}>{pinError}</Text> : null}
          </View>

          {/* Keypad */}
          <View style={styles.keypad}>
            {[
              ['1', '2', '3'],
              ['4', '5', '6'],
              ['7', '8', '9'],
              ['', '0', 'delete'],
            ].map((row, rIndex) => (
              <View key={rIndex} style={styles.keypadRow}>
                {row.map((val, cIndex) => {
                  if (val === '') {
                    return <View key={cIndex} style={styles.keyEmpty} />;
                  }
                  if (val === 'delete') {
                    return (
                      <TouchableOpacity
                        key={cIndex}
                        style={styles.key}
                        onPress={handleKeypadDelete}
                      >
                        <Ionicons name="backspace-outline" size={26} color="#FFFFFF" />
                      </TouchableOpacity>
                    );
                  }
                  return (
                    <TouchableOpacity
                      key={cIndex}
                      style={styles.key}
                      onPress={() => handleKeypadPress(val)}
                    >
                      <Text style={styles.keyText}>{val}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F12',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2027',
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.2,
    marginTop: 20,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#1A1A22',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#262734',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#262734',
    marginVertical: 14,
  },
  backupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  backupIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  backupInfo: {
    flex: 1,
  },
  backupTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  backupSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  backupMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#121217',
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
  },
  metaItem: {
    flex: 1,
  },
  metaItemRight: {
    alignItems: 'flex-end',
  },
  metaLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  metaValue: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
    marginTop: 3,
  },
  primaryButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#252632',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  rowSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  clickableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  clickableRowText: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '600',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#121217',
    borderRadius: 8,
    padding: 3,
  },
  segmentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  segmentOptionActive: {
    backgroundColor: '#FFFFFF',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  segmentTextActive: {
    color: '#000000',
    fontWeight: '700',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#0F0F12',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pinContent: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  pinPrompt: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 24,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#4B5563',
  },
  dotFilled: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginTop: 14,
  },
  keypad: {
    paddingHorizontal: 36,
    marginTop: 'auto',
    marginBottom: 40,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  key: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1E1F29',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyEmpty: {
    width: 72,
    height: 72,
  },
  keyText: {
    fontSize: 26,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
