import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import dayjs from 'dayjs';
import { SafeSvgImage } from '../components/common/SafeSvgImage';
import { useSettingsStore } from '../store/useSettingsStore';
import { useNotesStore } from '../store/useNotesStore';
import { NotesRepository } from '../db/repositories/notesRepository';
import { ChecklistItem } from '../db/schema';
import { resolveKeepColor } from '../constants/keepColors';
import { ColorPaletteModal } from '../components/editor/ColorPaletteModal';
import { ChecklistEditor } from '../components/editor/ChecklistEditor';
import { ImageLightboxModal } from '../components/editor/ImageLightboxModal';
import { AudioRecorderModal } from '../components/editor/AudioRecorderModal';
import { AudioPlayerWidget } from '../components/editor/AudioPlayerWidget';
import { DrawingCanvasModal, DrawingPath } from '../components/editor/DrawingCanvasModal';
import { ReminderPickerModal } from '../components/editor/ReminderPickerModal';
import { LabelPickerModal } from '../components/editor/LabelPickerModal';
import { ReminderNotificationService } from '../services/reminderNotificationService';

const { width } = Dimensions.get('window');

export default function NoteEditorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; newType?: string; folderId?: string }>();
  const noteId = params.id;

  const { theme } = useSettingsStore();
  const { saveNote, moveToTrash, fetchNotes } = useNotesStore();
  const isDark = theme === 'dark';

  // State
  const [currentId, setCurrentId] = useState<string>(
    () => noteId || `note_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  );
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [noteType, setNoteType] = useState<'text' | 'checklist'>(
    params.newType === 'checklist' ? 'checklist' : 'text'
  );
  const [color, setColor] = useState('#FFFFFF');
  const [isPinned, setIsPinned] = useState(false);
  const [isArchived, setIsArchived] = useState(false);
  const [reminderAt, setReminderAt] = useState<Date | null>(null);
  const [labelIds, setLabelIds] = useState<string[]>([]);
  const [folderId, setFolderId] = useState<string | null>(params.folderId || null);
  const [checklists, setChecklists] = useState<ChecklistItem[]>([]);
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [audioUris, setAudioUris] = useState<string[]>([]);
  const [lastEditedTime, setLastEditedTime] = useState<string>('Just now');

  // Modals
  const [colorModalVisible, setColorModalVisible] = useState(false);
  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const [labelModalVisible, setLabelModalVisible] = useState(false);
  const [audioModalVisible, setAudioModalVisible] = useState(false);
  const [drawingModalVisible, setDrawingModalVisible] = useState(false);
  const [editingDrawingUri, setEditingDrawingUri] = useState<string | null>(null);
  const [editingDrawingPaths, setEditingDrawingPaths] = useState<DrawingPath[]>([]);
  const [lightboxUri, setLightboxUri] = useState<string | null>(null);

  // Auto-save debounce timer ref
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialLoadRef = useRef(true);

  const handleStartEditDrawing = async (uri: string) => {
    try {
      const fileContent = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      const match = fileContent.match(/<!-- NOTELO_DRAWING_DATA: ([\s\S]*?) -->/);
      let initialPaths: DrawingPath[] = [];
      if (match && match[1]) {
        try {
          initialPaths = JSON.parse(match[1]);
        } catch (parseErr) {
          console.warn('Failed to parse drawing data JSON:', parseErr);
        }
      }
      setEditingDrawingUri(uri);
      setEditingDrawingPaths(initialPaths);
      setLightboxUri(null);
      setDrawingModalVisible(true);
    } catch (e) {
      console.error('Error opening drawing for edit:', e);
      setEditingDrawingUri(uri);
      setEditingDrawingPaths([]);
      setLightboxUri(null);
      setDrawingModalVisible(true);
    }
  };

  // Load existing note if noteId exists
  useEffect(() => {
    async function loadExisting() {
      if (!noteId) {
        if (params.newType === 'checklist') {
          setChecklists([
            {
              id: `item_${Date.now()}_1`,
              noteId: currentId,
              text: '',
              isCompleted: false,
              orderIndex: 0,
              createdAt: new Date(),
            },
          ]);
        } else if (params.newType === 'drawing') {
          setDrawingModalVisible(true);
        } else if (params.newType === 'audio') {
          setAudioModalVisible(true);
        }
        isInitialLoadRef.current = false;
        return;
      }

      try {
        const existing = await NotesRepository.getNoteById(noteId);
        if (existing) {
          setTitle(existing.title);
          setContent(existing.content);
          setNoteType(existing.noteType);
          setColor(existing.color);
          setIsPinned(existing.isPinned);
          setIsArchived(existing.isArchived);
          setFolderId(existing.folderId);
          setChecklists(existing.checklists || []);
          setLabelIds(existing.labelIds || []);
          if (existing.attachments && existing.attachments.length > 0) {
            const imgs = existing.attachments
              .filter((a) => a.mimeType.startsWith('image'))
              .map((a) => a.localUri);
            const auds = existing.attachments
              .filter((a) => a.mimeType.startsWith('audio'))
              .map((a) => a.localUri);
            setImageUris(imgs);
            setAudioUris(auds);
          }
          if (existing.reminderAt) {
            setReminderAt(new Date(existing.reminderAt));
          }
          setLastEditedTime(dayjs(existing.updatedAt).format('h:mm A'));
        }
      } catch (e) {
        console.error('Error loading note:', e);
      } finally {
        isInitialLoadRef.current = false;
      }
    }

    loadExisting();
  }, [noteId]);

  // Debounced Auto-Save
  const triggerAutoSave = useCallback(() => {
    if (isInitialLoadRef.current) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      // Don't save empty notes if new
      const hasContent =
        title.trim().length > 0 ||
        content.trim().length > 0 ||
        checklists.some((c) => c.text.trim().length > 0) ||
        imageUris.length > 0 ||
        audioUris.length > 0;

      if (!hasContent) return;

      const currentAttachments = [
        ...imageUris.map((u) => ({
          localUri: u,
          mimeType: u.endsWith('.svg') ? 'image/svg+xml' : 'image/jpeg',
        })),
        ...audioUris.map((u) => ({ localUri: u, mimeType: 'audio/m4a' })),
      ];

      try {
        await saveNote(
          {
            id: currentId,
            folderId,
            title: title.trim(),
            content: content.trim(),
            noteType,
            color,
            isPinned,
            isArchived,
            reminderAt,
            isDeleted: false,
          },
          noteType === 'checklist' ? checklists : undefined,
          labelIds,
          currentAttachments
        );
        setLastEditedTime(dayjs().format('h:mm A'));
      } catch (e) {
        console.error('Auto-save error:', e);
      }
    }, 500);
  }, [currentId, folderId, title, content, noteType, color, isPinned, isArchived, reminderAt, checklists, labelIds, imageUris, audioUris]);

  // Trigger auto-save on state change
  useEffect(() => {
    triggerAutoSave();
  }, [title, content, noteType, color, isPinned, isArchived, reminderAt, checklists, labelIds, imageUris, audioUris]);

  const handleBack = async () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    const hasContent =
      title.trim().length > 0 ||
      content.trim().length > 0 ||
      checklists.some((c) => c.text.trim().length > 0) ||
      imageUris.length > 0 ||
      audioUris.length > 0;

    if (hasContent) {
      const currentAttachments = [
        ...imageUris.map((u) => ({ localUri: u, mimeType: 'image/jpeg' })),
        ...audioUris.map((u) => ({ localUri: u, mimeType: 'audio/m4a' })),
      ];
      await saveNote(
        {
          id: currentId,
          folderId,
          title: title.trim(),
          content: content.trim(),
          noteType,
          color,
          isPinned,
          isArchived,
          reminderAt,
          isDeleted: false,
        },
        noteType === 'checklist' ? checklists : undefined,
        labelIds,
        currentAttachments
      );
    }
    await fetchNotes();
    router.back();
  };

  const handleTogglePin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsPinned(!isPinned);
  };

  const handleToggleArchive = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsArchived(!isArchived);
    setTimeout(() => {
      router.back();
    }, 200);
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Move to Trash', 'Are you sure you want to delete this note?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (noteId) {
            await moveToTrash(noteId);
          }
          router.back();
        },
      },
    ]);
  };

  const handlePickImage = async () => {
    Haptics.selectionAsync();
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.85,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        const sourceUri = result.assets[0].uri;
        const attachmentsDir = `${FileSystem.documentDirectory}attachments/`;
        const dirInfo = await FileSystem.getInfoAsync(attachmentsDir);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(attachmentsDir, { intermediates: true });
        }

        const fileName = `img_${Date.now()}.jpg`;
        const destUri = `${attachmentsDir}${fileName}`;
        await FileSystem.copyAsync({ from: sourceUri, to: destUri });

        setImageUris((prev) => [...prev, destUri]);
        triggerAutoSave();
      }
    } catch (e) {
      console.error('Error picking image:', e);
    }
  };

  const colorStyle = resolveKeepColor(color, isDark);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colorStyle.bg }]}
      edges={['top', 'left', 'right', 'bottom']}
    >
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={colorStyle.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setReminderModalVisible(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={reminderAt ? 'notifications' : 'notifications-outline'}
              size={22}
              color={reminderAt ? '#F59E0B' : colorStyle.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleTogglePin}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons
              name={isPinned ? 'pin' : 'pin-outline'}
              size={23}
              color={isPinned ? '#F59E0B' : colorStyle.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleToggleArchive}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={isArchived ? 'archive' : 'archive-outline'}
              size={22}
              color={isArchived ? '#F59E0B' : colorStyle.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Editor Body */}
      <ScrollView
        style={styles.scrollBody}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Images Attachment Gallery */}
        {imageUris.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.imageGallery}
          >
            {imageUris.map((uri, index) => (
              <TouchableOpacity
                key={index}
                activeOpacity={0.8}
                onPress={() => setLightboxUri(uri)}
              >
                {uri.endsWith('.svg') ? (
                  <View style={[styles.imageThumb, { overflow: 'hidden' }]}>
                    <SafeSvgImage uri={uri} width="100%" height="100%" />
                  </View>
                ) : (
                  <Image source={{ uri }} style={styles.imageThumb} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Audio Memos */}
        {audioUris.map((uri, index) => (
          <AudioPlayerWidget
            key={index}
            uri={uri}
            isDark={isDark}
            onDelete={() => setAudioUris((prev) => prev.filter((_, i) => i !== index))}
          />
        ))}

        {/* Title Input */}
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Title"
          placeholderTextColor={colorStyle.textSecondary}
          style={[styles.titleInput, { color: colorStyle.textPrimary }]}
          multiline
          scrollEnabled={false}
          autoCapitalize="sentences"
        />

        {/* Note Body: Plain Text or Checklist */}
        {noteType === 'checklist' ? (
          <ChecklistEditor
            items={checklists}
            onChange={setChecklists}
            isDark={isDark}
          />
        ) : (
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="Note"
            placeholderTextColor={colorStyle.textSecondary}
            style={[styles.bodyInput, { color: colorStyle.textPrimary }]}
            multiline
            scrollEnabled={false}
            textAlignVertical="top"
            autoCapitalize="sentences"
          />
        )}
      </ScrollView>

      {/* Bottom Status & Actions Toolbar */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colorStyle.bg,
            borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          },
        ]}
      >
        {/* Left Actions: Palette, Checklist Toggle, Image, Audio, Canvas */}
        <View style={styles.bottomActionsGroup}>
          <TouchableOpacity
            style={styles.toolBtn}
            onPress={() => setColorModalVisible(true)}
          >
            <Ionicons name="color-palette-outline" size={22} color={colorStyle.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toolBtn}
            onPress={() => {
              Haptics.selectionAsync();
              if (noteType === 'text') {
                setNoteType('checklist');
                if (checklists.length === 0) {
                  setChecklists([
                    {
                      id: `item_${Date.now()}`,
                      noteId: currentId,
                      text: content.trim(),
                      isCompleted: false,
                      orderIndex: 0,
                      createdAt: new Date(),
                    },
                  ]);
                }
              } else {
                setNoteType('text');
              }
            }}
          >
            <Ionicons
              name={noteType === 'checklist' ? 'list' : 'checkbox-outline'}
              size={22}
              color={noteType === 'checklist' ? '#F59E0B' : colorStyle.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.toolBtn} onPress={handlePickImage}>
            <Ionicons name="image-outline" size={22} color={colorStyle.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.toolBtn} onPress={() => setAudioModalVisible(true)}>
            <Ionicons name="mic-outline" size={22} color={colorStyle.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.toolBtn} onPress={() => setDrawingModalVisible(true)}>
            <MaterialCommunityIcons name="brush" size={22} color={colorStyle.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Right Info: Edited Time & Delete */}
        <View style={styles.rightBottomGroup}>
          <Text style={[styles.editedText, { color: colorStyle.textSecondary }]}>
            Edited {lastEditedTime}
          </Text>

          <TouchableOpacity
            style={styles.toolBtn}
            onPress={() => setLabelModalVisible(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={labelIds.length > 0 ? 'pricetag' : 'pricetag-outline'}
              size={20}
              color={labelIds.length > 0 ? '#F59E0B' : colorStyle.textSecondary}
            />
          </TouchableOpacity>

          {noteId && (
            <TouchableOpacity
              style={styles.toolBtn}
              onPress={handleDelete}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>



      {/* Modals */}
      <ColorPaletteModal
        visible={colorModalVisible}
        selectedColorHex={color}
        onSelectColor={setColor}
        onClose={() => setColorModalVisible(false)}
      />

      <ReminderPickerModal
        visible={reminderModalVisible}
        isDark={isDark}
        currentReminder={reminderAt}
        onSelectReminder={async (date) => {
          setReminderAt(date);
          if (date) {
            await ReminderNotificationService.scheduleNoteReminder(
              currentId,
              title,
              content,
              date
            );
          } else {
            await ReminderNotificationService.cancelNoteReminder(currentId);
          }
        }}
        onClose={() => setReminderModalVisible(false)}
      />

      <LabelPickerModal
        visible={labelModalVisible}
        isDark={isDark}
        selectedLabelIds={labelIds}
        onChangeLabels={setLabelIds}
        onClose={() => setLabelModalVisible(false)}
      />

      <AudioRecorderModal
        visible={audioModalVisible}
        isDark={isDark}
        onClose={() => setAudioModalVisible(false)}
        onRecordingComplete={(uri) => setAudioUris((prev) => [...prev, uri])}
      />

      <DrawingCanvasModal
        visible={drawingModalVisible}
        isDark={isDark}
        initialPaths={editingDrawingPaths}
        onClose={() => {
          setDrawingModalVisible(false);
          setEditingDrawingUri(null);
          setEditingDrawingPaths([]);
        }}
        onSaveDrawing={async (svgData) => {
          try {
            const attachmentsDir = `${FileSystem.documentDirectory}attachments/`;
            const dirInfo = await FileSystem.getInfoAsync(attachmentsDir);
            if (!dirInfo.exists) {
              await FileSystem.makeDirectoryAsync(attachmentsDir, { intermediates: true });
            }
            const isEditing = !!editingDrawingUri;
            const targetUri = isEditing
              ? editingDrawingUri
              : `${attachmentsDir}drawing_${Date.now()}.svg`;

            await FileSystem.writeAsStringAsync(targetUri, svgData, {
              encoding: FileSystem.EncodingType.UTF8,
            });

            if (!isEditing) {
              setImageUris((prev) => [...prev, targetUri]);
            } else {
              setImageUris((prev) => [...prev]);
            }

            setEditingDrawingUri(null);
            setEditingDrawingPaths([]);
            triggerAutoSave();
          } catch (e) {
            console.error('Error saving drawing:', e);
          }
        }}
      />

      <ImageLightboxModal
        visible={!!lightboxUri}
        imageUri={lightboxUri}
        onClose={() => setLightboxUri(null)}
        onDelete={() => {
          if (lightboxUri) {
            setImageUris((prev) => prev.filter((u) => u !== lightboxUri));
          }
        }}
        onEditDrawing={
          lightboxUri && lightboxUri.endsWith('.svg')
            ? () => handleStartEditDrawing(lightboxUri)
            : undefined
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 40,
  },
  imageGallery: {
    gap: 10,
    marginBottom: 16,
  },
  imageThumb: {
    width: width * 0.7,
    height: 180,
    borderRadius: 12,
  },
  titleInput: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.2,
    paddingVertical: 6,
    marginBottom: 12,
  },
  bodyInput: {
    fontSize: 16,
    lineHeight: 24,
    minHeight: 250,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  bottomActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toolBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightBottomGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editedText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
