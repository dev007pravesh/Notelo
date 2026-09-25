import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  GestureResponderEvent,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeSvgImage } from '../common/SafeSvgImage';
import { NoteWithDetails } from '../../db/repositories/notesRepository';
import { resolveKeepColor } from '../../constants/keepColors';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useNotesStore } from '../../store/useNotesStore';

interface NoteCardProps {
  note: NoteWithDetails;
  onPress: (id?: string) => void;
  folderName?: string;
  isDark?: boolean;
  isSelected?: boolean;
  isSelectionMode?: boolean;
  onToggleSelection?: (id: string) => void;
  onTogglePin?: (id: string) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

const NoteCardComponent: React.FC<NoteCardProps> = ({
  note,
  onPress,
  folderName,
  isDark: isDarkProp,
  isSelected: isSelectedProp,
  isSelectionMode: isSelectionModeProp,
  onToggleSelection,
  onTogglePin,
  onDragStart,
  onDragEnd,
}) => {
  // If props are passed, use them directly (0 store subscription overhead for 1000 items)
  const isDark = isDarkProp ?? (useSettingsStore.getState().theme === 'dark');
  const isSelected = isSelectedProp ?? false;
  const isSelectionMode = isSelectionModeProp ?? false;

  const colorStyle = resolveKeepColor(note.color, isDark);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const touchStartY = useRef(0);
  const touchStartX = useRef(0);
  const hasMovedFar = useRef(false);
  const isDragging = useRef(false);
  const hasReordered = useRef(false);
  const holdTimer = useRef<any>(null);
  const [isDragElevated, setIsDragElevated] = useState(false);

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (onToggleSelection) {
      onToggleSelection(note.id);
    } else {
      useNotesStore.getState().toggleSelection(note.id);
    }
  };

  const handleCardPress = () => {
    if (isSelectionMode) {
      Haptics.selectionAsync();
      if (onToggleSelection) {
        onToggleSelection(note.id);
      } else {
        useNotesStore.getState().toggleSelection(note.id);
      }
    } else {
      onPress(note.id);
    }
  };

  const handleTouchStart = (e: GestureResponderEvent) => {
    touchStartY.current = e.nativeEvent.pageY;
    touchStartX.current = e.nativeEvent.pageX;
    hasMovedFar.current = false;
    isDragging.current = false;
    hasReordered.current = false;

    if (holdTimer.current) clearTimeout(holdTimer.current);

    holdTimer.current = setTimeout(() => {
      isDragging.current = true;
      setIsDragElevated(true);
      onDragStart?.();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Animated.spring(scaleAnim, {
        toValue: 1.05,
        friction: 6,
        tension: 60,
        useNativeDriver: true,
      }).start();
    }, 220);
  };

  const handleTouchMove = (e: GestureResponderEvent) => {
    const currentY = e.nativeEvent.pageY;
    const currentX = e.nativeEvent.pageX;
    const dy = currentY - touchStartY.current;
    const dx = currentX - touchStartX.current;

    if (!isDragging.current) {
      if (Math.abs(dy) > 8 || Math.abs(dx) > 8) {
        hasMovedFar.current = true;
        if (holdTimer.current) clearTimeout(holdTimer.current);
      }
    } else {
      if (dy < -42) {
        touchStartY.current = currentY;
        hasReordered.current = true;
        useNotesStore.getState().moveNote(note.id, 'up');
        Haptics.selectionAsync();
      } else if (dy > 42) {
        touchStartY.current = currentY;
        hasReordered.current = true;
        useNotesStore.getState().moveNote(note.id, 'down');
        Haptics.selectionAsync();
      }
    }
  };

  const handleTouchEnd = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);

    if (isDragging.current) {
      isDragging.current = false;
      setIsDragElevated(false);
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 50,
        useNativeDriver: true,
      }).start();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onDragEnd?.();

      if (hasReordered.current) {
        useNotesStore.getState().saveCurrentNoteOrder();
      } else {
        handleLongPress();
      }
    } else if (!hasMovedFar.current) {
      handleCardPress();
    }
  };

  const handleTouchCancel = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    if (isDragging.current) {
      isDragging.current = false;
      setIsDragElevated(false);
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
      onDragEnd?.();
    }
  };

  const handlePinPress = (e: any) => {
    e.stopPropagation?.();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onTogglePin) {
      onTogglePin(note.id);
    } else {
      useNotesStore.getState().togglePin(note.id);
    }
  };

  const hasChecklists = note.checklists && note.checklists.length > 0;
  const visibleChecklists = hasChecklists ? note.checklists!.slice(0, 4) : [];
  const remainingChecklistsCount = hasChecklists ? Math.max(0, note.checklists!.length - 4) : 0;

  // Media attachments detection
  const coverImage = note.attachments?.find((a) => a.mimeType.startsWith('image'));
  const hasAudio = note.attachments?.some((a) => a.mimeType.startsWith('audio'));

  return (
    <View style={styles.wrapper}>
      <Animated.View
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        style={[
          styles.card,
          {
            backgroundColor: colorStyle.bg,
            borderColor: isDragElevated
              ? '#F59E0B'
              : isSelected
              ? '#F59E0B'
              : colorStyle.border,
            borderWidth: isDragElevated || isSelected ? 2.5 : 1,
            transform: [{ scale: scaleAnim }],
            elevation: isDragElevated ? 12 : isSelected ? 4 : 1,
            zIndex: isDragElevated ? 999 : 1,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: isDragElevated ? 6 : 1 },
            shadowOpacity: isDragElevated ? 0.35 : 0.08,
            shadowRadius: isDragElevated ? 10 : 3,
          },
        ]}
      >
        {/* Subtle Selected Highlight Overlay (Clean border + tint selection) */}
        {isSelected && (
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: isDark
                  ? 'rgba(245, 158, 11, 0.12)'
                  : 'rgba(245, 158, 11, 0.08)',
                zIndex: 2,
              },
            ]}
          />
        )}

        {/* Cover Image Thumbnail (Signature Keep Feature) */}
        {coverImage && !note.isLocked && (
          coverImage.localUri.endsWith('.svg') ? (
            <View style={[styles.coverThumbnail, { overflow: 'hidden' }]}>
              <SafeSvgImage uri={coverImage.localUri} width="100%" height="100%" />
            </View>
          ) : (
            <Image
              source={{ uri: coverImage.localUri }}
              style={styles.coverThumbnail}
              resizeMode="cover"
            />
          )
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
              color={note.isPinned ? '#F59E0B' : colorStyle.textSecondary}
            />
          </TouchableOpacity>
        )}

        <View style={styles.contentPadding}>
          {/* Locked Note Masking */}
          {note.isLocked ? (
            <View style={styles.lockedContainer}>
              <View style={[styles.lockedIconBg, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7' }]}>
                <MaterialCommunityIcons name="shield-lock" size={24} color="#F59E0B" />
              </View>
              <Text style={[styles.lockedTitle, { color: colorStyle.textPrimary }]}>
                Locked Note
              </Text>
              <Text style={[styles.lockedSubtitle, { color: colorStyle.textSecondary }]}>
                Tap to view content
              </Text>
            </View>
          ) : (
            <>
              {/* Note Title */}
              {note.title.trim().length > 0 && (
                <Text
                  numberOfLines={2}
                  style={[styles.title, { color: colorStyle.textPrimary }]}
                >
                  {note.title}
                </Text>
              )}

              {/* Checklist Items Preview */}
              {hasChecklists && (
                <View
                  style={[
                    styles.checklistContainer,
                    note.title.trim().length === 0 && { paddingRight: 24 },
                  ]}
                >
                  {visibleChecklists.map((item) => (
                    <View key={item.id} style={styles.checklistItemRow}>
                      <Ionicons
                        name={item.isCompleted ? 'checkbox' : 'square-outline'}
                        size={15}
                        color={item.isCompleted ? '#F59E0B' : colorStyle.textSecondary}
                      />
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.checklistItemText,
                          { color: colorStyle.textPrimary },
                          item.isCompleted && styles.checklistCompletedText,
                        ]}
                      >
                        {item.text || 'Item'}
                      </Text>
                    </View>
                  ))}
                  {remainingChecklistsCount > 0 && (
                    <Text style={[styles.moreItemsText, { color: colorStyle.textSecondary }]}>
                      +{remainingChecklistsCount} more items
                    </Text>
                  )}
                </View>
              )}

              {/* Text Note Content Preview (when no checklists) */}
              {!hasChecklists && note.content.trim().length > 0 && (
                <Text
                  numberOfLines={7}
                  style={[
                    styles.content,
                    { color: colorStyle.textSecondary },
                    note.title.trim().length === 0 && { paddingRight: 24 },
                  ]}
                >
                  {note.content}
                </Text>
              )}

              {/* Voice Memo Badge */}
              {hasAudio && (
                <View
                  style={[
                    styles.audioBadge,
                    {
                      backgroundColor: isDark ? 'rgba(245, 158, 11, 0.16)' : 'rgba(245, 158, 11, 0.12)',
                    },
                  ]}
                >
                  <Ionicons name="mic" size={12} color="#F59E0B" />
                  <Text style={[styles.audioBadgeText, { color: isDark ? '#FBBF24' : '#D97706' }]}>
                    Voice memo
                  </Text>
                </View>
              )}

              {/* Footer: Folder chip, Label tags & Reminder badge */}
              {(folderName || (note.labels && note.labels.length > 0) || note.reminderAt) && (
                <View style={styles.footerRow}>
                  {folderName && (
                    <View
                      style={[
                        styles.chip,
                        { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' },
                      ]}
                    >
                      <Ionicons name="folder-outline" size={11} color={colorStyle.textSecondary} />
                      <Text style={[styles.chipText, { color: colorStyle.textSecondary }]}>
                        {folderName}
                      </Text>
                    </View>
                  )}

                  {note.labels &&
                    note.labels.slice(0, 2).map((label) => (
                      <View
                        key={label.id}
                        style={[
                          styles.chip,
                          { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' },
                        ]}
                      >
                        <Text style={[styles.chipText, { color: colorStyle.textSecondary }]}>
                          #{label.name}
                        </Text>
                      </View>
                    ))}

                  {note.reminderAt && (
                    <View
                      style={[
                        styles.chip,
                        { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' },
                      ]}
                    >
                      <Ionicons name="alarm-outline" size={11} color={colorStyle.textSecondary} />
                    </View>
                  )}
                </View>
              )}
            </>
          )}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    padding: 4,
    width: '100%',
  },
  card: {
    borderRadius: 14,
    overflow: 'hidden',
    minHeight: 76,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1.5,
  },
  coverThumbnail: {
    width: '100%',
    height: 120,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  contentPadding: {
    padding: 13,
  },
  pinButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
    zIndex: 5,
  },
  title: {
    fontSize: 15.5,
    fontWeight: '700',
    lineHeight: 21,
    letterSpacing: 0.1,
    marginBottom: 6,
    paddingRight: 26, // Space for pin button or selection badge
  },
  content: {
    fontSize: 13.5,
    lineHeight: 19,
    fontWeight: '400',
  },
  checklistContainer: {
    marginTop: 2,
    gap: 4,
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
    opacity: 0.55,
  },
  moreItemsText: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  audioBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 12,
    marginTop: 8,
  },
  audioBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '500',
  },
  lockedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  lockedIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  lockedTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  lockedSubtitle: {
    fontSize: 11.5,
  },
});

export const NoteCard = React.memo(NoteCardComponent);

