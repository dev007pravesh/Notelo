import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeIn, Layout } from 'react-native-reanimated';
import { NoteWithDetails } from '../../db/repositories/notesRepository';
import { resolveKeepColor } from '../../constants/keepColors';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useNotesStore } from '../../store/useNotesStore';

interface NoteCardProps {
  note: NoteWithDetails;
  onPress: () => void;
  folderName?: string;
}

export const NoteCard: React.FC<NoteCardProps> = ({ note, onPress, folderName }) => {
  const { theme } = useSettingsStore();
  const { selectedNoteIds, isSelectionMode, toggleSelection, togglePin } = useNotesStore();

  const isDark = theme === 'dark';
  const isSelected = selectedNoteIds.includes(note.id);
  const colorStyle = resolveKeepColor(note.color, isDark);

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleSelection(note.id);
  };

  const handleCardPress = () => {
    if (isSelectionMode) {
      Haptics.selectionAsync();
      toggleSelection(note.id);
    } else {
      onPress();
    }
  };

  const handlePinPress = (e: any) => {
    e.stopPropagation?.();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    togglePin(note.id);
  };

  const hasChecklists = note.checklists && note.checklists.length > 0;
  const visibleChecklists = hasChecklists ? note.checklists!.slice(0, 4) : [];
  const remainingChecklistsCount = hasChecklists ? Math.max(0, note.checklists!.length - 4) : 0;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      layout={Layout.springify().damping(18)}
      style={[styles.wrapper]}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleCardPress}
        onLongPress={handleLongPress}
        style={[
          styles.card,
          {
            backgroundColor: colorStyle.bg,
            borderColor: isSelected ? '#6366F1' : colorStyle.border,
            borderWidth: isSelected ? 2.5 : 1,
          },
        ]}
      >
        {/* Selection Checkbox Badge */}
        {isSelectionMode && (
          <View style={[styles.selectBadge, isSelected && styles.selectBadgeActive]}>
            {isSelected && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
          </View>
        )}

        {/* Pin Button / Indicator */}
        {!isSelectionMode && (
          <TouchableOpacity
            style={styles.pinButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={handlePinPress}
          >
            <MaterialCommunityIcons
              name={note.isPinned ? 'pin' : 'pin-outline'}
              size={18}
              color={note.isPinned ? '#6366F1' : isDark ? '#94A3B8' : '#64748B'}
            />
          </TouchableOpacity>
        )}

        {/* Note Title */}
        {note.title.trim().length > 0 && (
          <Text
            numberOfLines={2}
            style={[styles.title, { color: isDark ? '#F8FAFC' : '#0F172A' }]}
          >
            {note.title}
          </Text>
        )}

        {/* Checklist Items Preview */}
        {hasChecklists && (
          <View style={styles.checklistContainer}>
            {visibleChecklists.map((item) => (
              <View key={item.id} style={styles.checklistItemRow}>
                <Ionicons
                  name={item.isCompleted ? 'checkbox' : 'square-outline'}
                  size={15}
                  color={item.isCompleted ? '#6366F1' : isDark ? '#94A3B8' : '#64748B'}
                />
                <Text
                  numberOfLines={1}
                  style={[
                    styles.checklistItemText,
                    { color: isDark ? '#CBD5E1' : '#334155' },
                    item.isCompleted && styles.checklistCompletedText,
                  ]}
                >
                  {item.text || 'Item'}
                </Text>
              </View>
            ))}
            {remainingChecklistsCount > 0 && (
              <Text style={[styles.moreItemsText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                +{remainingChecklistsCount} more items
              </Text>
            )}
          </View>
        )}

        {/* Text Note Content Preview (when no checklists) */}
        {!hasChecklists && note.content.trim().length > 0 && (
          <Text
            numberOfLines={7}
            style={[styles.content, { color: isDark ? '#CBD5E1' : '#334155' }]}
          >
            {note.content}
          </Text>
        )}

        {/* Footer: Folder chip & Reminder badge */}
        {(folderName || note.reminderAt) && (
          <View style={styles.footerRow}>
            {folderName && (
              <View
                style={[
                  styles.folderChip,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
                ]}
              >
                <Ionicons name="folder-outline" size={11} color={isDark ? '#94A3B8' : '#475569'} />
                <Text style={[styles.folderChipText, { color: isDark ? '#94A3B8' : '#475569' }]}>
                  {folderName}
                </Text>
              </View>
            )}

            {note.reminderAt && (
              <View
                style={[
                  styles.reminderChip,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
                ]}
              >
                <Ionicons name="alarm-outline" size={11} color={isDark ? '#94A3B8' : '#475569'} />
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    padding: 4,
    width: '100%',
  },
  card: {
    borderRadius: 14,
    padding: 14,
    minHeight: 80,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1.5,
  },
  selectBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#94A3B8',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  selectBadgeActive: {
    borderColor: '#6366F1',
    backgroundColor: '#6366F1',
  },
  pinButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 4,
    zIndex: 5,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    letterSpacing: 0.1,
    marginBottom: 6,
    paddingRight: 24, // Space for pin button
  },
  content: {
    fontSize: 13.5,
    lineHeight: 19,
    fontWeight: '400',
  },
  checklistContainer: {
    marginTop: 4,
    gap: 5,
  },
  checklistItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  checklistItemText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  checklistCompletedText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  moreItemsText: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  folderChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  folderChipText: {
    fontSize: 11,
    fontWeight: '500',
  },
  reminderChip: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
});
