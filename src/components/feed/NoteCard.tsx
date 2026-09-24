import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeIn, Layout } from 'react-native-reanimated';
import { SafeSvgImage } from '../common/SafeSvgImage';
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

  // Media attachments detection
  const coverImage = note.attachments?.find((a) => a.mimeType.startsWith('image'));
  const hasAudio = note.attachments?.some((a) => a.mimeType.startsWith('audio'));

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      layout={Layout.springify().damping(18)}
      style={styles.wrapper}
    >
      <TouchableOpacity
        activeOpacity={0.82}
        onPress={handleCardPress}
        onLongPress={handleLongPress}
        style={[
          styles.card,
          {
            backgroundColor: colorStyle.bg,
            borderColor: isSelected ? '#F59E0B' : colorStyle.border,
            borderWidth: isSelected ? 2 : 1,
          },
        ]}
      >
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

        {/* Selection Checkbox Badge */}
        {isSelectionMode && (
          <View style={[styles.selectBadge, isSelected && styles.selectBadgeActive]}>
            {isSelected && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
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
                    note.title.trim().length === 0 && { paddingRight: 22 },
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
                    note.title.trim().length === 0 && { paddingRight: 22 },
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
  selectBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
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
    borderColor: '#F59E0B',
    backgroundColor: '#F59E0B',
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
    paddingRight: 22, // Space for pin button
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
