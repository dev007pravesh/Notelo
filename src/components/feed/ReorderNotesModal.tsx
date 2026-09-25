import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  PanResponder,
  Animated,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNotesStore } from '../../store/useNotesStore';
import { NoteWithDetails } from '../../db/repositories/notesRepository';

interface ReorderNotesModalProps {
  visible: boolean;
  onClose: () => void;
  isDark: boolean;
}

const ITEM_HEIGHT = 74;

export const ReorderNotesModal: React.FC<ReorderNotesModalProps> = ({
  visible,
  onClose,
  isDark,
}) => {
  const { notes, reorderNotes, resetNoteOrder } = useNotesStore();

  // Local working copy of notes
  const [localNotes, setLocalNotes] = useState<NoteWithDetails[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // Sync with store when modal opens
  useEffect(() => {
    if (visible) {
      setLocalNotes([...notes]);
      setDraggingId(null);
    }
  }, [visible, notes]);

  const pinnedNotes = localNotes.filter((n) => n.isPinned);
  const otherNotes = localNotes.filter((n) => !n.isPinned);

  const moveItem = (id: string, direction: 'up' | 'down') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLocalNotes((prev) => {
      const idx = prev.findIndex((n) => n.id === id);
      if (idx === -1) return prev;

      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;

      // Don't cross pinned / unpinned boundary
      if (prev[idx].isPinned !== prev[targetIdx].isPinned) return prev;

      const updated = [...prev];
      const [moved] = updated.splice(idx, 1);
      updated.splice(targetIdx, 0, moved);
      return updated;
    });
  };

  const handleSave = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await reorderNotes(localNotes);
    onClose();
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Note Order',
      'Do you want to reset notes to chronological order (newest first)?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await resetNoteOrder();
            onClose();
          },
        },
      ]
    );
  };

  const renderNoteRow = (note: NoteWithDetails, index: number, sectionArray: NoteWithDetails[]) => {
    const isFirst = index === 0;
    const isLast = index === sectionArray.length - 1;
    const isCurrentlyDragging = draggingId === note.id;

    // Determine card background
    let cardBg = isDark ? '#2D2E30' : '#FFFFFF';
    if (note.color && note.color !== '#FFFFFF' && note.color !== '#202124') {
      cardBg = note.color;
    }

    return (
      <View
        key={note.id}
        style={[
          styles.noteRow,
          {
            backgroundColor: cardBg,
            borderColor: isCurrentlyDragging
              ? '#F59E0B'
              : isDark
              ? '#3C4043'
              : '#E2E8F0',
            borderWidth: isCurrentlyDragging ? 2 : 1,
            transform: [{ scale: isCurrentlyDragging ? 1.03 : 1 }],
            shadowOpacity: isCurrentlyDragging ? 0.25 : 0.05,
          },
        ]}
      >
        {/* Left Indicator */}
        <View
          style={[
            styles.colorStripe,
            { backgroundColor: note.isPinned ? '#F59E0B' : (isDark ? '#4B5563' : '#CBD5E1') },
          ]}
        />

        {/* Note Content Info */}
        <View style={styles.noteContentArea}>
          <View style={styles.titleRow}>
            {note.isPinned && (
              <Ionicons
                name="pin"
                size={14}
                color="#F59E0B"
                style={{ marginRight: 4 }}
              />
            )}
            <Text
              style={[
                styles.noteTitle,
                { color: isDark ? '#E8EAED' : '#1E293B' },
              ]}
              numberOfLines={1}
            >
              {note.title.trim().length > 0 ? note.title : 'Untitled Note'}
            </Text>
          </View>
          <Text
            style={[
              styles.noteSnippet,
              { color: isDark ? '#9AA0A6' : '#64748B' },
            ]}
            numberOfLines={1}
          >
            {note.content.trim().length > 0
              ? note.content.replace(/\n/g, ' ')
              : 'No additional text'}
          </Text>
        </View>

        {/* Nudge Buttons & Drag Handle */}
        <View style={styles.actionButtonsRow}>
          {/* Move Up Button */}
          <TouchableOpacity
            style={[
              styles.nudgeBtn,
              {
                opacity: isFirst ? 0.25 : 1,
                backgroundColor: isDark ? '#3C4043' : '#F1F5F9',
              },
            ]}
            disabled={isFirst}
            onPress={() => moveItem(note.id, 'up')}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
          >
            <Ionicons
              name="chevron-up"
              size={18}
              color={isDark ? '#E8EAED' : '#334155'}
            />
          </TouchableOpacity>

          {/* Move Down Button */}
          <TouchableOpacity
            style={[
              styles.nudgeBtn,
              {
                opacity: isLast ? 0.25 : 1,
                backgroundColor: isDark ? '#3C4043' : '#F1F5F9',
              },
            ]}
            disabled={isLast}
            onPress={() => moveItem(note.id, 'down')}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
          >
            <Ionicons
              name="chevron-down"
              size={18}
              color={isDark ? '#E8EAED' : '#334155'}
            />
          </TouchableOpacity>

          {/* Drag Handle Indicator */}
          <View
            style={[
              styles.dragHandle,
              { backgroundColor: isDark ? '#3C4043' : '#F1F5F9' },
            ]}
          >
            <Ionicons
              name="reorder-two"
              size={20}
              color={isDark ? '#9AA0A6' : '#64748B'}
            />
          </View>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.modalOverlay,
          { backgroundColor: isDark ? 'rgba(0,0,0,0.75)' : 'rgba(15,23,42,0.5)' },
        ]}
      >
        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: isDark ? '#1C1D1F' : '#FFFFFF',
              borderColor: isDark ? '#2D2E30' : '#E2E8F0',
            },
          ]}
        >
          {/* Header */}
          <View
            style={[
              styles.header,
              { borderBottomColor: isDark ? '#2D2E30' : '#E2E8F0' },
            ]}
          >
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name="close"
                size={24}
                color={isDark ? '#9AA0A6' : '#64748B'}
              />
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
              <Text
                style={[
                  styles.headerTitle,
                  { color: isDark ? '#F3F4F6' : '#1E293B' },
                ]}
              >
                Rearrange Notes
              </Text>
              <Text
                style={[
                  styles.headerSubtitle,
                  { color: isDark ? '#9AA0A6' : '#64748B' },
                ]}
              >
                Use ▲ and ▼ to order your notes
              </Text>
            </View>

            {/* Done Button */}
            <TouchableOpacity
              onPress={handleSave}
              style={styles.doneBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>

          {/* Notes List */}
          <ScrollView
            style={styles.scrollList}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Pinned Section */}
            {pinnedNotes.length > 0 && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeaderRow}>
                  <Ionicons name="pin" size={14} color="#F59E0B" />
                  <Text
                    style={[
                      styles.sectionHeaderText,
                      { color: isDark ? '#F59E0B' : '#D97706' },
                    ]}
                  >
                    PINNED ({pinnedNotes.length})
                  </Text>
                </View>
                {pinnedNotes.map((note, index) =>
                  renderNoteRow(note, index, pinnedNotes)
                )}
              </View>
            )}

            {/* Other Notes Section */}
            {otherNotes.length > 0 && (
              <View style={styles.sectionContainer}>
                {pinnedNotes.length > 0 && (
                  <View style={styles.sectionHeaderRow}>
                    <Ionicons
                      name="document-text-outline"
                      size={14}
                      color={isDark ? '#9AA0A6' : '#64748B'}
                    />
                    <Text
                      style={[
                        styles.sectionHeaderText,
                        { color: isDark ? '#9AA0A6' : '#64748B' },
                      ]}
                    >
                      OTHERS ({otherNotes.length})
                    </Text>
                  </View>
                )}
                {otherNotes.map((note, index) =>
                  renderNoteRow(note, index, otherNotes)
                )}
              </View>
            )}

            {localNotes.length === 0 && (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="file-tray-outline"
                  size={44}
                  color={isDark ? '#4B5563' : '#94A3B8'}
                />
                <Text
                  style={[
                    styles.emptyText,
                    { color: isDark ? '#9AA0A6' : '#64748B' },
                  ]}
                >
                  No active notes to rearrange
                </Text>
              </View>
            )}

            {/* Reset Order Button at the bottom */}
            {localNotes.length > 1 && (
              <TouchableOpacity
                style={[
                  styles.resetOrderBtn,
                  {
                    borderColor: isDark ? '#3C4043' : '#CBD5E1',
                    backgroundColor: isDark ? '#242526' : '#F8FAFC',
                  },
                ]}
                onPress={handleReset}
              >
                <Ionicons
                  name="refresh-outline"
                  size={16}
                  color={isDark ? '#9AA0A6' : '#64748B'}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.resetOrderText,
                    { color: isDark ? '#9AA0A6' : '#64748B' },
                  ]}
                >
                  Reset to Chronological Order
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    height: '84%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  closeBtn: {
    padding: 4,
    marginRight: 8,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  doneBtn: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  scrollList: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  sectionHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    marginBottom: 8,
    paddingVertical: 10,
    paddingRight: 10,
    minHeight: ITEM_HEIGHT,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
  },
  colorStripe: {
    width: 4,
    height: '70%',
    borderRadius: 2,
    marginHorizontal: 10,
  },
  noteContentArea: {
    flex: 1,
    paddingRight: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  noteTitle: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  noteSnippet: {
    fontSize: 12,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nudgeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dragHandle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 10,
  },
  resetOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
  },
  resetOrderText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
