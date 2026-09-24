import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { NotesRepository, NoteWithDetails } from '../db/repositories/notesRepository';
import { NoteCard } from '../components/feed/NoteCard';
import { useSettingsStore } from '../store/useSettingsStore';
import { useNotesStore } from '../store/useNotesStore';

export default function ArchiveScreen() {
  const router = useRouter();
  const { theme, viewMode } = useSettingsStore();
  const { fetchNotes } = useNotesStore();
  const isDark = theme === 'dark';

  const [archivedNotes, setArchivedNotes] = useState<NoteWithDetails[]>([]);
  const [loading, setLoading] = useState(false);

  const loadArchived = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await NotesRepository.getArchivedNotes();
      setArchivedNotes(rows);
    } catch (e) {
      console.error('Error loading archive:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadArchived();
  }, [loadArchived]);

  const handleNotePress = (note: NoteWithDetails) => {
    router.push({
      pathname: '/addNote',
      params: { id: note.id },
    });
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? '#1F1F1F' : '#FFFFFF' }]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Top Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: isDark ? '#202124' : '#FFFFFF',
            borderBottomColor: isDark ? '#3C4043' : '#E8EAED',
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={isDark ? '#E8EAED' : '#202124'} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: isDark ? '#E8EAED' : '#202124' }]}>
          Archive
        </Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {archivedNotes.length === 0 && !loading ? (
          <View style={styles.emptyContainer}>
            <View
              style={[
                styles.emptyIconCircle,
                { backgroundColor: isDark ? '#2D2E30' : '#FEF3C7' },
              ]}
            >
              <Ionicons
                name="archive-outline"
                size={48}
                color={isDark ? '#FBBF24' : '#F59E0B'}
              />
            </View>
            <Text style={[styles.emptyTitle, { color: isDark ? '#E8EAED' : '#202124' }]}>
              Your archived notes appear here
            </Text>
          </View>
        ) : (
          <FlashList
            data={archivedNotes}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <NoteCard
                note={item}
                onPress={() => handleNotePress(item)}
              />
            )}
            numColumns={viewMode === 'grid' ? 2 : 1}
            masonry={viewMode === 'grid'}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={loadArchived}
                tintColor="#6366F1"
                colors={['#6366F1']}
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
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
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
});
