import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useNotesStore } from '../../store/useNotesStore';
import { ColorPaletteModal } from '../editor/ColorPaletteModal';
import { ReminderPickerModal } from '../editor/ReminderPickerModal';
import { LabelPickerModal } from '../editor/LabelPickerModal';
import { FolderPickerModal } from '../editor/FolderPickerModal';

interface SelectionActionBarProps {
  onMoveToFolderPress?: () => void;
  onRearrangePress?: () => void;
}

export const SelectionActionBar: React.FC<SelectionActionBarProps> = ({
  onMoveToFolderPress,
  onRearrangePress,
}) => {
  const { theme } = useSettingsStore();
  const {
    selectedNoteIds,
    notes,
    clearSelection,
    selectAll,
    bulkTogglePin,
    bulkMoveToTrash,
    bulkMoveToFolder,
    bulkSetColor,
    bulkSetReminder,
    bulkAddLabel,
    moveNote,
  } = useNotesStore();

  const isDark = theme === 'dark';
  const selectedCount = selectedNoteIds.length;

  const [colorModalVisible, setColorModalVisible] = useState(false);
  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const [labelModalVisible, setLabelModalVisible] = useState(false);
  const [folderModalVisible, setFolderModalVisible] = useState(false);

  // Check if all selected are pinned
  const selectedNotes = notes.filter((n) => selectedNoteIds.includes(n.id));
  const allPinned = selectedNotes.length > 0 && selectedNotes.every((n) => n.isPinned);

  // Check if all loaded notes are selected
  const isAllSelected = notes.length > 0 && selectedCount === notes.length;

  const handleTogglePin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    bulkTogglePin(!allPinned);
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    bulkMoveToTrash();
  };

  const handleToggleSelectAll = () => {
    Haptics.selectionAsync();
    if (isAllSelected) {
      clearSelection();
    } else {
      selectAll();
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#2D2E30' : '#FEF3C7',
          borderBottomColor: isDark ? '#3C4043' : '#FDE68A',
        },
      ]}
    >
      {/* Left: Close & Count */}
      <View style={styles.leftGroup}>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => {
            Haptics.selectionAsync();
            clearSelection();
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close" size={24} color={isDark ? '#E8EAED' : '#202124'} />
        </TouchableOpacity>
        <Text style={[styles.countText, { color: isDark ? '#E8EAED' : '#202124' }]}>
          {selectedCount}
        </Text>
      </View>

      {/* Right: Bulk Actions */}
      <View style={styles.rightGroup}>
        {/* Bulk Pin */}
        <TouchableOpacity
          style={styles.btn}
          onPress={handleTogglePin}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <MaterialCommunityIcons
            name={allPinned ? 'pin-off-outline' : 'pin-outline'}
            size={20}
            color={isDark ? '#E8EAED' : '#202124'}
          />
        </TouchableOpacity>

        {/* Bulk Reminder */}
        <TouchableOpacity
          style={styles.btn}
          onPress={() => setReminderModalVisible(true)}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Ionicons name="notifications-outline" size={19} color={isDark ? '#E8EAED' : '#202124'} />
        </TouchableOpacity>

        {/* Bulk Color */}
        <TouchableOpacity
          style={styles.btn}
          onPress={() => setColorModalVisible(true)}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Ionicons name="color-palette-outline" size={19} color={isDark ? '#E8EAED' : '#202124'} />
        </TouchableOpacity>

        {/* Bulk Folder */}
        <TouchableOpacity
          style={styles.btn}
          onPress={() => setFolderModalVisible(true)}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Ionicons name="folder-outline" size={19} color={isDark ? '#E8EAED' : '#202124'} />
        </TouchableOpacity>

        {/* Bulk Label */}
        <TouchableOpacity
          style={styles.btn}
          onPress={() => setLabelModalVisible(true)}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Ionicons name="pricetag-outline" size={19} color={isDark ? '#E8EAED' : '#202124'} />
        </TouchableOpacity>

        {/* Full Rearrange Button */}
        {onRearrangePress && (
          <TouchableOpacity
            style={styles.btn}
            onPress={() => {
              Haptics.selectionAsync();
              onRearrangePress();
            }}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Ionicons
              name="swap-vertical-outline"
              size={20}
              color="#F59E0B"
            />
          </TouchableOpacity>
        )}

        {/* Bulk Delete */}
        <TouchableOpacity
          style={styles.btn}
          onPress={handleDelete}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Ionicons name="trash-outline" size={19} color="#EF4444" />
        </TouchableOpacity>

        {/* Select All */}
        <TouchableOpacity
          style={styles.btn}
          onPress={handleToggleSelectAll}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <MaterialCommunityIcons
            name="format-list-checks"
            size={22}
            color={isAllSelected ? '#F59E0B' : (isDark ? '#E8EAED' : '#202124')}
          />
        </TouchableOpacity>
      </View>

      {/* Bulk Color Modal */}
      <ColorPaletteModal
        visible={colorModalVisible}
        selectedColorHex="#FFFFFF"
        onSelectColor={async (col) => {
          await bulkSetColor(col);
          setColorModalVisible(false);
        }}
        onClose={() => setColorModalVisible(false)}
      />

      {/* Bulk Reminder Modal */}
      <ReminderPickerModal
        visible={reminderModalVisible}
        isDark={isDark}
        currentReminder={null}
        onSelectReminder={async (date) => {
          await bulkSetReminder(date);
          setReminderModalVisible(false);
        }}
        onClose={() => setReminderModalVisible(false)}
      />

      {/* Bulk Folder Modal */}
      <FolderPickerModal
        visible={folderModalVisible}
        isDark={isDark}
        selectedFolderId={null}
        onChangeFolder={async (fId) => {
          await bulkMoveToFolder(fId);
          setFolderModalVisible(false);
        }}
        onClose={() => setFolderModalVisible(false)}
      />

      {/* Bulk Label Modal */}
      <LabelPickerModal
        visible={labelModalVisible}
        isDark={isDark}
        selectedLabelIds={[]}
        onChangeLabels={async (newLabelIds) => {
          for (const lId of newLabelIds) {
            await bulkAddLabel(lId);
          }
          setLabelModalVisible(false);
        }}
        onClose={() => setLabelModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: 1,
    paddingTop: Platform.OS === 'android' ? 4 : 0,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  countText: {
    fontSize: 18,
    fontWeight: '700',
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  btn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
