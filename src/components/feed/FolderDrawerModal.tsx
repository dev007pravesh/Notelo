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
import { Folder } from '../../db/schema';

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

  // Long press folder action states
  const [actionFolder, setActionFolder] = useState<Folder | null>(null);
  const [renameText, setRenameText] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const handleSelectFolder = async (folderId: string | null | 'all') => {
    Haptics.selectionAsync();
    await setActiveFolder(folderId);
    onClose();
  };

  const handleLongPressFolder = (folder: Folder) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActionFolder(folder);
    setRenameText(folder.name);
    setIsRenaming(false);
    setIsConfirmingDelete(false);
  };

  const handleCloseActionModal = () => {
    setActionFolder(null);
    setIsRenaming(false);
    setIsConfirmingDelete(false);
  };

  const handleSaveRename = async () => {
    if (!actionFolder || !renameText.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await FoldersRepository.updateFolder(actionFolder.id, {
        name: renameText.trim(),
      });
      await fetchFoldersAndLabels();
      handleCloseActionModal();
    } catch (e) {
      console.error('Error renaming folder:', e);
    }
  };

  const handleConfirmDelete = async () => {
    if (!actionFolder) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    try {
      const isCurrentActive = activeFolderId === actionFolder.id;
      await FoldersRepository.deleteFolder(actionFolder.id);
      if (isCurrentActive) {
        await setActiveFolder('all');
      }
      await fetchFoldersAndLabels();
      handleCloseActionModal();
    } catch (e) {
      console.error('Error deleting folder:', e);
    }
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
              backgroundColor: isDark ? '#202124' : '#FFFFFF',
              borderRightColor: isDark ? '#3C4043' : '#E8EAED',
            },
          ]}
        >
          {/* Drawer Header */}
          <View style={styles.drawerHeader}>
            <Text style={[styles.drawerBrand, { color: isDark ? '#E8EAED' : '#202124' }]}>
              Notelo
            </Text>
            <Text style={[styles.drawerSub, { color: isDark ? '#9AA0A6' : '#5F6368' }]}>
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
                  { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.16)' : '#FEF3C7' },
                ],
              ]}
              onPress={() => handleSelectFolder('all')}
            >
              <Ionicons
                name="bulb-outline"
                size={22}
                color={activeFolderId === 'all' ? '#F59E0B' : isDark ? '#9AA0A6' : '#5F6368'}
              />
              <Text
                style={[
                  styles.navItemText,
                  {
                    color: activeFolderId === 'all' ? (isDark ? '#FBBF24' : '#D97706') : isDark ? '#E8EAED' : '#202124',
                    fontWeight: activeFolderId === 'all' ? '700' : '500',
                  },
                ]}
              >
                Notes
              </Text>
            </TouchableOpacity>

            {/* Folders Section Header */}
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: isDark ? '#9AA0A6' : '#70757A' }]}>
                FOLDERS
              </Text>
              <TouchableOpacity
                onPress={() => setIsCreatingFolder(!isCreatingFolder)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name={isCreatingFolder ? 'close' : 'add'}
                  size={20}
                  color={isDark ? '#9AA0A6' : '#5F6368'}
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
                  placeholderTextColor={isDark ? '#9AA0A6' : '#70757A'}
                  style={[
                    styles.newFolderInput,
                    {
                      color: isDark ? '#E8EAED' : '#202124',
                      borderColor: isDark ? '#3C4043' : '#E0E0E0',
                      backgroundColor: isDark ? '#2D2E30' : '#F1F3F4',
                    },
                  ]}
                  autoFocus
                  onSubmitEditing={handleCreateFolder}
                />
                <TouchableOpacity
                  style={[styles.createFolderBtn, { backgroundColor: '#F59E0B' }]}
                  onPress={handleCreateFolder}
                >
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
                      { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.16)' : '#FEF3C7' },
                    ],
                  ]}
                  onPress={() => handleSelectFolder(folder.id)}
                  onLongPress={() => handleLongPressFolder(folder)}
                  delayLongPress={350}
                >
                  <Ionicons
                    name="folder-outline"
                    size={21}
                    color={isSelected ? '#F59E0B' : isDark ? '#9AA0A6' : '#5F6368'}
                  />
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.navItemText,
                      {
                        color: isSelected ? (isDark ? '#FBBF24' : '#D97706') : isDark ? '#E8EAED' : '#202124',
                        fontWeight: isSelected ? '700' : '500',
                      },
                    ]}
                  >
                    {folder.name}
                  </Text>
                </TouchableOpacity>
              );
            })}

            <View style={[styles.divider, { backgroundColor: isDark ? '#3C4043' : '#E8EAED' }]} />

            {/* Archive */}
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => {
                onClose();
                router.push('/archive' as any);
              }}
            >
              <Ionicons name="archive-outline" size={21} color={isDark ? '#9AA0A6' : '#5F6368'} />
              <Text style={[styles.navItemText, { color: isDark ? '#E8EAED' : '#202124' }]}>
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
              <Ionicons name="trash-outline" size={21} color={isDark ? '#9AA0A6' : '#5F6368'} />
              <Text style={[styles.navItemText, { color: isDark ? '#E8EAED' : '#202124' }]}>
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
              <Ionicons name="settings-outline" size={21} color={isDark ? '#9AA0A6' : '#5F6368'} />
              <Text style={[styles.navItemText, { color: isDark ? '#E8EAED' : '#202124' }]}>
                Settings
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Action Dialog Overlay (Rename / Delete) */}
        {actionFolder && (
          <View style={styles.actionModalOverlay}>
            <TouchableWithoutFeedback onPress={handleCloseActionModal}>
              <View style={styles.actionBackdrop} />
            </TouchableWithoutFeedback>

            <View
              style={[
                styles.actionCard,
                {
                  backgroundColor: isDark ? '#2D2E30' : '#FFFFFF',
                  borderColor: isDark ? '#3C4043' : '#E8EAED',
                },
              ]}
            >
              {/* Header */}
              <View style={styles.actionHeader}>
                <View style={[styles.actionIconContainer, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.16)' : '#FEF3C7' }]}>
                  <Ionicons name="folder-outline" size={20} color="#F59E0B" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={[styles.actionTitle, { color: isDark ? '#E8EAED' : '#202124' }]}>
                    {actionFolder.name}
                  </Text>
                  <Text style={[styles.actionSubtitle, { color: isDark ? '#9AA0A6' : '#5F6368' }]}>
                    Folder options
                  </Text>
                </View>
                <TouchableOpacity onPress={handleCloseActionModal} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close" size={20} color={isDark ? '#9AA0A6' : '#5F6368'} />
                </TouchableOpacity>
              </View>

              {isRenaming ? (
                /* Inline Rename Form */
                <View style={styles.renameForm}>
                  <Text style={[styles.inputLabel, { color: isDark ? '#9AA0A6' : '#5F6368' }]}>
                    Rename folder
                  </Text>
                  <TextInput
                    value={renameText}
                    onChangeText={setRenameText}
                    placeholder="Folder name"
                    placeholderTextColor={isDark ? '#9AA0A6' : '#70757A'}
                    style={[
                      styles.renameInput,
                      {
                        color: isDark ? '#E8EAED' : '#202124',
                        borderColor: isDark ? '#5F6368' : '#D1D5DB',
                        backgroundColor: isDark ? '#202124' : '#F9FAFB',
                      },
                    ]}
                    autoFocus
                    selectTextOnFocus
                    onSubmitEditing={handleSaveRename}
                  />
                  <View style={styles.actionButtonsRow}>
                    <TouchableOpacity
                      style={[styles.dialogBtn, { backgroundColor: isDark ? '#3C4043' : '#E5E7EB' }]}
                      onPress={() => setIsRenaming(false)}
                    >
                      <Text style={[styles.dialogBtnText, { color: isDark ? '#E8EAED' : '#374151' }]}>
                        Cancel
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.dialogBtn, { backgroundColor: '#F59E0B' }]}
                      onPress={handleSaveRename}
                    >
                      <Text style={[styles.dialogBtnText, { color: '#FFFFFF', fontWeight: '700' }]}>
                        Save
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : isConfirmingDelete ? (
                /* Delete Confirmation Form */
                <View style={styles.confirmDeleteContainer}>
                  <Text style={[styles.confirmDeleteTitle, { color: isDark ? '#FCA5A5' : '#DC2626' }]}>
                    Delete this folder?
                  </Text>
                  <Text style={[styles.confirmDeleteMessage, { color: isDark ? '#D1D5DB' : '#4B5563' }]}>
                    Notes inside will remain safe and accessible in All Notes.
                  </Text>
                  <View style={styles.actionButtonsRow}>
                    <TouchableOpacity
                      style={[styles.dialogBtn, { backgroundColor: isDark ? '#3C4043' : '#E5E7EB' }]}
                      onPress={() => setIsConfirmingDelete(false)}
                    >
                      <Text style={[styles.dialogBtnText, { color: isDark ? '#E8EAED' : '#374151' }]}>
                        Cancel
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.dialogBtn, { backgroundColor: '#EF4444' }]}
                      onPress={handleConfirmDelete}
                    >
                      <Text style={[styles.dialogBtnText, { color: '#FFFFFF', fontWeight: '700' }]}>
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                /* Main Action Options (Rename / Delete) */
                <View style={styles.actionOptionsList}>
                  <TouchableOpacity
                    style={[styles.actionOptionItem, { borderBottomColor: isDark ? '#3C4043' : '#F3F4F6' }]}
                    onPress={() => setIsRenaming(true)}
                  >
                    <View style={[styles.optionIconCircle, { backgroundColor: isDark ? '#3C4043' : '#F3F4F6' }]}>
                      <Ionicons name="pencil-outline" size={18} color={isDark ? '#E8EAED' : '#374151'} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.actionOptionText, { color: isDark ? '#E8EAED' : '#202124' }]}>
                        Rename folder
                      </Text>
                      <Text style={[styles.actionOptionHint, { color: isDark ? '#9AA0A6' : '#6B7280' }]}>
                        Change the name of this folder
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={isDark ? '#5F6368' : '#9CA3AF'} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionOptionItem}
                    onPress={() => setIsConfirmingDelete(true)}
                  >
                    <View style={[styles.optionIconCircle, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2' }]}>
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.actionOptionText, { color: '#EF4444' }]}>
                        Delete folder
                      </Text>
                      <Text style={[styles.actionOptionHint, { color: isDark ? '#9AA0A6' : '#6B7280' }]}>
                        Remove folder (keeps notes safe)
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={isDark ? '#5F6368' : '#9CA3AF'} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}
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
    ...StyleSheet.absoluteFill,
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
  actionModalOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    elevation: 20,
    paddingHorizontal: 20,
  },
  actionBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  actionCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.15)',
  },
  actionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  actionSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  actionOptionsList: {
    gap: 6,
  },
  actionOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  optionIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionOptionText: {
    fontSize: 14.5,
    fontWeight: '600',
  },
  actionOptionHint: {
    fontSize: 11.5,
    marginTop: 1,
  },
  renameForm: {
    paddingVertical: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  renameInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 16,
  },
  confirmDeleteContainer: {
    paddingVertical: 4,
  },
  confirmDeleteTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  confirmDeleteMessage: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  dialogBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
  },
  dialogBtnText: {
    fontSize: 13.5,
    fontWeight: '600',
  },
});
