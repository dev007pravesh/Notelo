import React, { useEffect, useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Text,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useNotesStore } from "../../store/useNotesStore";
import { useSettingsStore } from "../../store/useSettingsStore";
import { NoteCard } from "../../components/feed/NoteCard";
import { NoteWithDetails } from "../../db/repositories/notesRepository";

export default function SearchScreen() {
  const router = useRouter();
  const { notes, searchQuery, setSearchQuery } = useNotesStore();
  const { theme } = useSettingsStore();
  const isDark = theme === 'dark';

  const [inputVal, setInputVal] = useState(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(inputVal);
    }, 250);
    return () => clearTimeout(timer);
  }, [inputVal, setSearchQuery]);

  const filteredNotes = inputVal.trim()
    ? notes.filter(
        (n) =>
          n.title.toLowerCase().includes(inputVal.toLowerCase()) ||
          n.content.toLowerCase().includes(inputVal.toLowerCase())
      )
    : [];

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDark ? '#1F1F1F' : '#FFFFFF' },
      ]}
      edges={['top']}
    >
      {/* Search Header */}
      <View
        style={[
          styles.searchBar,
          {
            backgroundColor: isDark ? '#2D2E30' : '#F1F3F4',
            borderColor: isDark ? '#3C4043' : '#E8EAED',
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons
            name="arrow-back"
            size={22}
            color={isDark ? '#E8EAED' : '#5F6368'}
          />
        </TouchableOpacity>

        <TextInput
          style={[styles.input, { color: isDark ? '#E8EAED' : '#202124' }]}
          placeholder="Search your notes..."
          placeholderTextColor={isDark ? '#9AA0A6' : '#70757A'}
          value={inputVal}
          onChangeText={setInputVal}
          autoFocus
          returnKeyType="search"
        />

        {inputVal.length > 0 && (
          <TouchableOpacity onPress={() => setInputVal('')} style={styles.clearButton}>
            <Ionicons
              name="close-circle"
              size={20}
              color={isDark ? '#9AA0A6' : '#70757A'}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Results List */}
      <FlatList
        data={filteredNotes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }: { item: NoteWithDetails }) => (
          <NoteCard
            note={item}
            onPress={() => router.push({ pathname: '/addNote', params: { id: item.id } })}
          />
        )}
        ListEmptyComponent={
          inputVal.trim().length > 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="search-outline"
                size={48}
                color={isDark ? '#5F6368' : '#9AA0A6'}
              />
              <Text
                style={[
                  styles.emptyText,
                  { color: isDark ? '#9AA0A6' : '#5F6368' },
                ]}
              >
                No matching notes found
              </Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text
                style={[
                  styles.emptySubtext,
                  { color: isDark ? '#64748B' : '#94A3B8' },
                ]}
              >
                Type words, tags, or phrases to search
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 10,
    paddingHorizontal: 12,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  backButton: {
    padding: 6,
    marginRight: 6,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
  },
  clearButton: {
    padding: 6,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
  },
});
