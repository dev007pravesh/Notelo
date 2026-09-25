import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNotesStore } from '../../store/useNotesStore';
import { FoldersRepository } from '../../db/repositories/foldersRepository';

interface FolderPickerModalProps {
  visible: boolean;
  isDark: boolean;
  selectedFolderId: string | null;
  onChangeFolder: (folderId: string | null) => void;
  onClose: () => void;
}

export const FolderPickerModal: React.FC<FolderPickerModalProps> = ({
  visible,
  isDark,
  selectedFolderId,
  onChangeFolder,
  onClose,
}) => {
  const { folders, fetchFoldersAndLabels } = useNotesStore();
  const [newFolderName, setNewFolderName] = useState('');

  const handleSelectFolder = (id: string | null) => {
    Haptics.selectionAsync();
    onChangeFolder(id);
    onClose();
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const created = await FoldersRepository.createFolder({
        id: `folder_${Date.now()}`,
        name: newFolderName.trim(),
        color: '#6366F1',
        icon: 'folder',
        orderIndex: folders.length,
      });
      setNewFolderName('');
      await fetchFoldersAndLabels();
      onChangeFolder(created.id);
      onClose();
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
            styles.container,
            {
              backgroundColor: isDark ? '#202124' : '#FFFFFF',
              borderTopColor: isDark ? '#3C4043' : '#E8EAED',
            },
          ]}
        >
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Ionicons name="folder-outline" size={20} color="#F59E0B" />
              <Text style={[styles.title, { color: isDark ? '#E8EAED' : '#202124' }]}>
                Move to Folder
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color={isDark ? '#9AA0A6' : '#5F6368'} />
            </TouchableOpacity>
          </View>

          {/* New Folder Input */}
          <View style={styles.inputRow}>
            <TextInput
              value={newFolderName}
              onChangeText={setNewFolderName}
              placeholder="Create new folder"
              placeholderTextColor={isDark ? '#9AA0A6' : '#70757A'}
              style={[
                styles.textInput,
                {
                  color: isDark ? '#E8EAED' : '#202124',
                  borderColor: isDark ? '#3C4043' : '#DADCE0',
                  backgroundColor: isDark ? '#2D2E30' : '#F1F3F4',
                },
              ]}
              onSubmitEditing={handleCreateFolder}
            />
            <TouchableOpacity style={styles.addBtn} onPress={handleCreateFolder}>
              <Ionicons name="add" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Folders List */}
          <ScrollView style={styles.scrollList} showsVerticalScrollIndicator={false}>
            {/* None (Unassigned) option */}
            <TouchableOpacity
              style={[
                styles.folderRow,
                selectedFolderId === null && [
                  styles.folderRowSelected,
                  { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.12)' : '#FEF3C7' },
                ],
              ]}
              onPress={() => handleSelectFolder(null)}
            >
              <Ionicons
                name="file-tray-outline"
                size={20}
                color={selectedFolderId === null ? '#F59E0B' : isDark ? '#9AA0A6' : '#5F6368'}
              />
              <Text
                style={[
                  styles.folderText,
                  {
                    color: selectedFolderId === null ? (isDark ? '#FBBF24' : '#D97706') : isDark ? '#E8EAED' : '#202124',
                    fontWeight: selectedFolderId === null ? '700' : '500',
                  },
                ]}
              >
                No Folder (Unassigned)
              </Text>
              {selectedFolderId === null && (
                <Ionicons name="checkmark-circle" size={20} color="#F59E0B" />
              )}
            </TouchableOpacity>

            {folders.map((folder) => {
              const isSelected = selectedFolderId === folder.id;
              return (
                <TouchableOpacity
                  key={folder.id}
                  style={[
                    styles.folderRow,
                    isSelected && [
                      styles.folderRowSelected,
                      { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.12)' : '#FEF3C7' },
                    ],
                  ]}
                  onPress={() => handleSelectFolder(folder.id)}
                >
                  <Ionicons
                    name="folder-outline"
                    size={20}
                    color={isSelected ? '#F59E0B' : isDark ? '#9AA0A6' : '#5F6368'}
                  />
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.folderText,
                      {
                        color: isSelected ? (isDark ? '#FBBF24' : '#D97706') : isDark ? '#E8EAED' : '#202124',
                        fontWeight: isSelected ? '700' : '500',
                      },
                    ]}
                  >
                    {folder.name}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={20} color="#F59E0B" />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    paddingTop: 18,
    paddingBottom: 36,
    paddingHorizontal: 20,
    maxHeight: '65%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  textInput: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14.5,
  },
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollList: {
    maxHeight: 260,
  },
  folderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 12,
    marginBottom: 4,
  },
  folderRowSelected: {
    borderRadius: 12,
  },
  folderText: {
    flex: 1,
    fontSize: 15,
  },
});
