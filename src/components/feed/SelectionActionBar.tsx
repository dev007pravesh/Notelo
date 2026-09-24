import React from 'react';
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

interface SelectionActionBarProps {
  onMoveToFolderPress?: () => void;
}

export const SelectionActionBar: React.FC<SelectionActionBarProps> = ({ onMoveToFolderPress }) => {
  const { theme } = useSettingsStore();
  const {
    selectedNoteIds,
    notes,
    clearSelection,
    selectAll,
    bulkTogglePin,
    bulkMoveToTrash,
  } = useNotesStore();

  const isDark = theme === 'dark';
  const selectedCount = selectedNoteIds.length;

  // Check if all selected are pinned
  const selectedNotes = notes.filter((n) => selectedNoteIds.includes(n.id));
  const allPinned = selectedNotes.length > 0 && selectedNotes.every((n) => n.isPinned);

  const handleTogglePin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    bulkTogglePin(!allPinned);
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    bulkMoveToTrash();
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#1E293B' : '#EEF2FF',
          borderBottomColor: isDark ? '#334155' : '#C7D2FE',
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
          <Ionicons name="close" size={24} color={isDark ? '#F8FAFC' : '#1E1B4B'} />
        </TouchableOpacity>
        <Text style={[styles.countText, { color: isDark ? '#F8FAFC' : '#1E1B4B' }]}>
          {selectedCount}
        </Text>
      </View>

      {/* Right: Actions */}
      <View style={styles.rightGroup}>
        <TouchableOpacity
          style={styles.btn}
          onPress={handleTogglePin}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons
            name={allPinned ? 'pin-off-outline' : 'pin-outline'}
            size={22}
            color={isDark ? '#F8FAFC' : '#1E1B4B'}
          />
        </TouchableOpacity>

        {onMoveToFolderPress && (
          <TouchableOpacity
            style={styles.btn}
            onPress={onMoveToFolderPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="folder-outline" size={22} color={isDark ? '#F8FAFC' : '#1E1B4B'} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.btn}
          onPress={handleDelete}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={22} color="#EF4444" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btn}
          onPress={selectAll}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="checkmark-done" size={22} color={isDark ? '#F8FAFC' : '#1E1B4B'} />
        </TouchableOpacity>
      </View>
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
