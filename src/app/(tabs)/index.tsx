import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useNotesStore } from '../../store/useNotesStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { NoteCard } from '../../components/feed/NoteCard';
import { KeepHeader } from '../../components/feed/KeepHeader';
import { KeepBottomBar } from '../../components/feed/KeepBottomBar';
import { SelectionActionBar } from '../../components/feed/SelectionActionBar';
import { FolderDrawerModal } from '../../components/feed/FolderDrawerModal';
import { NoteWithDetails } from '../../db/repositories/notesRepository';

type FeedItem =
  | { type: 'header'; title: string; id: string }
  | { type: 'note'; note: NoteWithDetails; id: string };

export default function HomeScreen() {
  const router = useRouter();
  const { theme, viewMode } = useSettingsStore();
  const {
    notes,
    folders,
    activeFolderId,
    isSelectionMode,
    isLoading,
    fetchNotes,
    fetchFoldersAndLabels,
  } = useNotesStore();

  const isDark = theme === 'dark';
  const [drawerVisible, setDrawerVisible] = useState(false);

  useEffect(() => {
    fetchNotes();
    fetchFoldersAndLabels();
  }, []);

  const onRefresh = useCallback(async () => {
    await fetchNotes();
    await fetchFoldersAndLabels();
  }, [fetchNotes, fetchFoldersAndLabels]);

  // Map folder id to folder name for card badges
  const folderMap = useMemo(() => {
    const map = new Map<string, string>();
    folders.forEach((f) => map.set(f.id, f.name));
    return map;
  }, [folders]);

  // Separate pinned and unpinned notes
  const pinnedNotes = useMemo(() => notes.filter((n) => n.isPinned), [notes]);
  const otherNotes = useMemo(() => notes.filter((n) => !n.isPinned), [notes]);

  // Construct items with section headers if pinned notes exist
  const feedItems = useMemo<FeedItem[]>(() => {
    if (pinnedNotes.length === 0) {
      return otherNotes.map((n) => ({ type: 'note', note: n, id: n.id }));
    }

    const items: FeedItem[] = [
      { type: 'header', title: 'PINNED', id: 'section_header_pinned' },
      ...pinnedNotes.map((n) => ({ type: 'note' as const, note: n, id: n.id })),
    ];

    if (otherNotes.length > 0) {
      items.push({ type: 'header', title: 'OTHERS', id: 'section_header_others' });
      items.push(...otherNotes.map((n) => ({ type: 'note' as const, note: n, id: n.id })));
    }

    return items;
  }, [pinnedNotes, otherNotes]);

  const handleNotePress = (note: NoteWithDetails) => {
    router.push({
      pathname: '/addNote',
      params: { id: note.id },
    });
  };

  const handleCreateNote = (type: 'text' | 'checklist' | 'drawing' | 'audio' | 'image') => {
    router.push({
      pathname: '/addNote',
      params: {
        newType: type,
        folderId: activeFolderId !== 'all' && activeFolderId ? activeFolderId : undefined,
      },
    });
  };

  const renderItem = ({ item }: { item: FeedItem }) => {
    if (item.type === 'header') {
      return (
        <View style={styles.sectionHeaderContainer}>
          <Text style={[styles.sectionHeaderText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
            {item.title}
          </Text>
        </View>
      );
    }

    const folderName = item.note.folderId ? folderMap.get(item.note.folderId) : undefined;
    return (
      <NoteCard
        note={item.note}
        onPress={() => handleNotePress(item.note)}
        folderName={folderName}
      />
    );
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDark ? '#1F1F1F' : '#FFFFFF' },
      ]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Top Header or Selection Bar */}
      {isSelectionMode ? (
        <SelectionActionBar />
      ) : (
        <KeepHeader
          onMenuPress={() => setDrawerVisible(true)}
          onSettingsPress={() => router.push('/settings' as any)}
        />
      )}

      {/* Main Feed: Masonry FlashList */}
      <View style={styles.feedWrapper}>
        {notes.length === 0 && !isLoading ? (
          <View style={styles.emptyContainer}>
            <View
              style={[
                styles.emptyIconCircle,
                { backgroundColor: isDark ? '#2D2E30' : '#FEF3C7' },
              ]}
            >
              <Ionicons
                name="bulb-outline"
                size={48}
                color={isDark ? '#FBBF24' : '#F59E0B'}
              />
            </View>
            <Text style={[styles.emptyTitle, { color: isDark ? '#E8EAED' : '#202124' }]}>
              Notes you add appear here
            </Text>
            <Text style={[styles.emptySubtitle, { color: isDark ? '#9AA0A6' : '#5F6368' }]}>
              Tap the buttons below to capture ideas, checklists, and voice memos
            </Text>
          </View>
        ) : (
          <FlashList
            data={feedItems}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            numColumns={viewMode === 'grid' ? 2 : 1}
            masonry={viewMode === 'grid'}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={onRefresh}
                tintColor="#F59E0B"
                colors={['#F59E0B']}
              />
            }
          />
        )}
      </View>

      {/* Google Keep Bottom Action Bar */}
      {!isSelectionMode && (
        <KeepBottomBar
          onNewTextNote={() => handleCreateNote('text')}
          onNewChecklistNote={() => handleCreateNote('checklist')}
          onNewDrawingNote={() => handleCreateNote('drawing')}
          onNewAudioNote={() => handleCreateNote('audio')}
          onNewImageNote={() => handleCreateNote('image')}
        />
      )}

      {/* Folder Navigation Drawer */}
      <FolderDrawerModal
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        onOpenSettings={() => {
          setDrawerVisible(false);
          router.push('/settings' as any);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  feedWrapper: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
    paddingTop: 4,
  },
  sectionHeaderContainer: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    width: '100%',
  },
  sectionHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    marginTop: -40,
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
