import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import dayjs from 'dayjs';
import { NotesRepository, NoteWithDetails } from '../db/repositories/notesRepository';
import { resolveKeepColor } from '../constants/keepColors';
import { useSettingsStore } from '../store/useSettingsStore';
import { useNotesStore } from '../store/useNotesStore';

export default function TrashScreen() {
  const router = useRouter();
  const { theme, viewMode } = useSettingsStore();
  const { fetchNotes } = useNotesStore();
  const isDark = theme === 'dark';

  const [trashNotes, setTrashNotes] = useState<NoteWithDetails[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTrash = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await NotesRepository.getTrashNotes();

      // Check auto-purge (>30 days)
      const now = Date.now();
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      const validNotes: NoteWithDetails[] = [];

      for (const note of rows) {
        if (note.deletedAt && now - new Date(note.deletedAt).getTime() > thirtyDaysMs) {
          await NotesRepository.deletePermanently(note.id);
        } else {
          validNotes.push(note);
        }
      }

      setTrashNotes(validNotes);
    } catch (e) {
      console.error('Error loading trash:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTrash();
  }, [loadTrash]);

  const handleRestore = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await NotesRepository.restoreFromTrash(id);
    await loadTrash();
    await fetchNotes();
  };

  const handleDeletePermanently = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Delete Forever',
      'This note will be permanently deleted and cannot be recovered.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: async () => {
            await NotesRepository.deletePermanently(id);
            await loadTrash();
          },
        },
      ]
    );
  };

  const handleEmptyTrash = () => {
    if (trashNotes.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      'Empty Trash',
      'All notes in Trash will be permanently deleted. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Empty Trash',
          style: 'destructive',
          onPress: async () => {
            for (const n of trashNotes) {
              await NotesRepository.deletePermanently(n.id);
            }
            await loadTrash();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? '#1F1F1F' : '#FFFFFF' }]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: isDark ? '#202124' : '#FFFFFF',
            borderBottomColor: isDark ? '#3C4043' : '#E8EAED',
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={isDark ? '#E8EAED' : '#202124'} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: isDark ? '#E8EAED' : '#202124' }]}>
            Trash
          </Text>
        </View>

        {trashNotes.length > 0 && (
          <TouchableOpacity onPress={handleEmptyTrash} style={styles.emptyTrashBtn}>
            <Text style={styles.emptyTrashText}>Empty Trash</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Banner */}
      <View
        style={[
          styles.banner,
          { backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#FEF2F2' },
        ]}
      >
        <Ionicons name="information-circle-outline" size={18} color="#EF4444" />
        <Text style={[styles.bannerText, { color: isDark ? '#FCA5A5' : '#991B1B' }]}>
          Notes in Trash are deleted after 30 days.
        </Text>
      </View>

      {/* Trash List */}
      <View style={styles.content}>
        {trashNotes.length === 0 && !loading ? (
          <View style={styles.emptyContainer}>
            <View
              style={[
                styles.emptyIconCircle,
                { backgroundColor: isDark ? '#2D2E30' : '#FEF3C7' },
              ]}
            >
              <Ionicons
                name="trash-outline"
                size={48}
                color={isDark ? '#FBBF24' : '#F59E0B'}
              />
            </View>
            <Text style={[styles.emptyTitle, { color: isDark ? '#E8EAED' : '#202124' }]}>
              No notes in Trash
            </Text>
          </View>
        ) : (
          <FlashList
            data={trashNotes}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const colorStyle = resolveKeepColor(item.color, isDark);
              return (
                <View style={styles.cardWrapper}>
                  <View
                    style={[
                      styles.card,
                      { backgroundColor: colorStyle.bg, borderColor: colorStyle.border },
                    ]}
                  >
                    {item.title.trim().length > 0 && (
                      <Text
                        numberOfLines={1}
                        style={[styles.cardTitle, { color: isDark ? '#F8FAFC' : '#0F172A' }]}
                      >
                        {item.title}
                      </Text>
                    )}
                    <Text
                      numberOfLines={4}
                      style={[styles.cardContent, { color: isDark ? '#CBD5E1' : '#334155' }]}
                    >
                      {item.content || 'Checklist / Empty note'}
                    </Text>

                    {/* Actions Row */}
                    <View style={styles.cardActions}>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => handleRestore(item.id)}
                      >
                        <Ionicons name="refresh-outline" size={16} color="#6366F1" />
                        <Text style={styles.restoreText}>Restore</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => handleDeletePermanently(item.id)}
                      >
                        <Ionicons name="trash" size={16} color="#EF4444" />
                        <Text style={styles.deleteText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            }}
            numColumns={viewMode === 'grid' ? 2 : 1}
            masonry={viewMode === 'grid'}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={loadTrash}
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
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
  emptyTrashBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  emptyTrashText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  bannerText: {
    fontSize: 13,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  cardWrapper: {
    padding: 4,
    width: '100%',
  },
  card: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  cardContent: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
    paddingTop: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  restoreText: {
    color: '#6366F1',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
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
