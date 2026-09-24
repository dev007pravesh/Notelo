import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useNotesStore } from '../../store/useNotesStore';
import { FoldersRepository } from '../../db/repositories/foldersRepository';

interface FolderDrawerModalProps {
  visible: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}

export const FolderDrawerModal: React.FC<FolderDrawerModalProps> = ({
  visible,
  onClose,
  onOpenSettings,
}) => {
  const router = useRouter();
  const { theme } = useSettingsStore();
  const { folders, activeFolderId, setActiveFolder, fetchFoldersAndLabels } = useNotesStore();

  const isDark = theme === 'dark';
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const handleSelectFolder = async (folderId: string | null | 'all') => {
    Haptics.selectionAsync();
    await setActiveFolder(folderId);
    onClose();
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await FoldersRepository.createFolder({
        id: `folder_${Date.now()}`,
        name: newFolderName.trim(),
        color: '#6366F1',
        icon: 'folder',
        orderIndex: folders.length,
      });
      setNewFolderName('');
      setIsCreatingFolder(false);
      await fetchFoldersAndLabels();
    } catch (e) {
      console.error('Error creating folder:', e);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <View
          style={[
            styles.drawerContent,
            {
              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
              borderRightColor: isDark ? '#334155' : '#E2E8F0',
            },
          ]}
        >
          {/* Drawer Header */}
          <View style={styles.drawerHeader}>
            <Text style={[styles.drawerBrand, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>
              Notelo
            </Text>
            <Text style={[styles.drawerSub, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              Google Keep Edition
            </Text>
          </View>

          <ScrollView style={styles.scrollList} showsVerticalScrollIndicator={false}>
            {/* All Notes */}
            <TouchableOpacity
              style={[
                styles.navItem,
                activeFolderId === 'all' && [
                  styles.navItemActive,
                  { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.2)' : '#EEF2FF' },
                ],
              ]}
              onPress={() => handleSelectFolder('all')}
            >
              <Ionicons
                name="bulb-outline"
                size={22}
                color={activeFolderId === 'all' ? '#6366F1' : isDark ? '#94A3B8' : '#475569'}
              />
              <Text
                style={[
                  styles.navItemText,
                  {
                    color: activeFolderId === 'all' ? '#6366F1' : isDark ? '#F8FAFC' : '#1E293B',
                    fontWeight: activeFolderId === 'all' ? '700' : '500',
                  },
                ]}
              >
                Notes
              </Text>
            </TouchableOpacity>

            {/* Folders Section Header */}
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: isDark ? '#64748B' : '#94A3B8' }]}>
                FOLDERS
              </Text>
              <TouchableOpacity
                onPress={() => setIsCreatingFolder(!isCreatingFolder)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name={isCreatingFolder ? 'close' : 'add'}
                  size={20}
                  color={isDark ? '#94A3B8' : '#64748B'}
                />
              </TouchableOpacity>
            </View>

            {/* New Folder Inline Input */}
            {isCreatingFolder && (
              <View style={styles.newFolderInputRow}>
                <TextInput
                  value={newFolderName}
                  onChangeText={setNewFolderName}
                  placeholder="New folder name"
                  placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                  style={[
                    styles.newFolderInput,
                    {
                      color: isDark ? '#F8FAFC' : '#0F172A',
                      borderColor: isDark ? '#475569' : '#CBD5E1',
                    },
                  ]}
                  autoFocus
                  onSubmitEditing={handleCreateFolder}
                />
                <TouchableOpacity style={styles.createFolderBtn} onPress={handleCreateFolder}>
                  <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}

            {/* Folders List */}
            {folders.map((folder) => {
              const isSelected = activeFolderId === folder.id;
              return (
                <TouchableOpacity
                  key={folder.id}
                  style={[
                    styles.navItem,
                    isSelected && [
                      styles.navItemActive,
                      { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.2)' : '#EEF2FF' },
                    ],
                  ]}
                  onPress={() => handleSelectFolder(folder.id)}
                >
                  <Ionicons
                    name="folder-outline"
                    size={21}
                    color={isSelected ? '#6366F1' : isDark ? '#94A3B8' : '#475569'}
                  />
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.navItemText,
                      {
                        color: isSelected ? '#6366F1' : isDark ? '#F8FAFC' : '#1E293B',
                        fontWeight: isSelected ? '700' : '500',
                      },
                    ]}
                  >
                    {folder.name}
                  </Text>
                </TouchableOpacity>
              );
            })}

            <View style={[styles.divider, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }]} />

            {/* Archive */}
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => {
                onClose();
                router.push('/archive' as any);
              }}
            >
              <Ionicons name="archive-outline" size={21} color={isDark ? '#94A3B8' : '#475569'} />
              <Text style={[styles.navItemText, { color: isDark ? '#F8FAFC' : '#1E293B' }]}>
                Archive
              </Text>
            </TouchableOpacity>

            {/* Trash */}
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => {
                onClose();
                router.push('/trash' as any);
              }}
            >
              <Ionicons name="trash-outline" size={21} color={isDark ? '#94A3B8' : '#475569'} />
              <Text style={[styles.navItemText, { color: isDark ? '#F8FAFC' : '#1E293B' }]}>
                Trash
              </Text>
            </TouchableOpacity>

            {/* Settings */}
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => {
                onClose();
                onOpenSettings();
              }}
            >
              <Ionicons name="settings-outline" size={21} color={isDark ? '#94A3B8' : '#475569'} />
              <Text style={[styles.navItemText, { color: isDark ? '#F8FAFC' : '#1E293B' }]}>
                Settings
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  drawerContent: {
    width: '78%',
    maxWidth: 320,
    height: '100%',
    paddingTop: Platform.OS === 'android' ? 44 : 54,
    paddingBottom: 24,
    paddingHorizontal: 16,
    borderRightWidth: 1,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  drawerHeader: {
    paddingHorizontal: 8,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.15)',
    marginBottom: 12,
  },
  drawerBrand: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  drawerSub: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  scrollList: {
    flex: 1,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 24,
    marginBottom: 4,
  },
  navItemActive: {
    borderRadius: 24,
  },
  navItemText: {
    fontSize: 15,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  newFolderInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  newFolderInput: {
    flex: 1,
    height: 38,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 14,
  },
  createFolderBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    marginVertical: 12,
    marginHorizontal: 8,
  },
});
