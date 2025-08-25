import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Link, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { nanoid } from "nanoid";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CustomHeader from "../../components/header";
import { useTheme } from "../../contexts/ThemeContext";
import FullPageLoader from "../../components/loader";
import { useFocusEffect } from "@react-navigation/native";

interface Note {
  id: string;
  shortTitle: string;
  description: string;
  addedDate: string;
  addedTime: string;
  lastModified?: number; // Optional for backward compatibility
}

export default function HomeScreen() {
  const { theme, themeMode } = useTheme();
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [listView, setListView] = useState(true);
  
  // Sort options
  const [sortOption, setSortOption] = useState<'newest' | 'oldest' | 'title' | 'date'>('newest');
  
  // Load view preference from storage
  const loadViewPreference = useCallback(async () => {
    try {
      const storedView = await AsyncStorage.getItem("notelo_view_preference");
      if (storedView !== null) {
        setListView(storedView === "list");
      }
    } catch (error) {
      console.error("Error loading view preference:", error);
    }
  }, []);

  // Save view preference to storage
  const saveViewPreference = useCallback(async (isListView: boolean) => {
    try {
      await AsyncStorage.setItem("notelo_view_preference", isListView ? "list" : "grid");
    } catch (error) {
      console.error("Error saving view preference:", error);
    }
  }, []);

  // Load sort preference from storage
  const loadSortPreference = useCallback(async () => {
    try {
      const storedSort = await AsyncStorage.getItem("notelo_sort_preference");
      if (storedSort !== null) {
        setSortOption(storedSort as 'newest' | 'oldest' | 'title' | 'date');
      }
    } catch (error) {
      console.error("Error loading sort preference:", error);
    }
  }, []);

  // Save sort preference to storage
  const saveSortPreference = useCallback(async (option: 'newest' | 'oldest' | 'title' | 'date') => {
    try {
      await AsyncStorage.setItem("notelo_sort_preference", option);
    } catch (error) {
      console.error("Error saving sort preference:", error);
    }
  }, []);

  // Sort notes based on sort option with error handling
  const sortNotes = useCallback((notesToSort: Note[], option: 'newest' | 'oldest' | 'title' | 'date') => {
    try {
      if (!Array.isArray(notesToSort) || notesToSort.length === 0) {
        return [];
      }

      const sortedNotes = [...notesToSort];
      
      switch (option) {
        case 'newest':
          return sortedNotes.sort((a, b) => {
            const aTime = a.lastModified || new Date(`${a.addedDate}T${a.addedTime}`).getTime() || 0;
            const bTime = b.lastModified || new Date(`${b.addedDate}T${b.addedTime}`).getTime() || 0;
            return bTime - aTime;
          });
        case 'oldest':
          return sortedNotes.sort((a, b) => {
            const aTime = a.lastModified || new Date(`${a.addedDate}T${a.addedTime}`).getTime() || 0;
            const bTime = b.lastModified || new Date(`${b.addedDate}T${b.addedTime}`).getTime() || 0;
            return aTime - bTime;
          });
        case 'title':
          return sortedNotes.sort((a, b) => {
            const titleA = (a.shortTitle || '').trim().toLowerCase();
            const titleB = (b.shortTitle || '').trim().toLowerCase();
            return titleA.localeCompare(titleB);
          });
        case 'date':
          return sortedNotes.sort((a, b) => {
            try {
              const dateA = new Date(`${a.addedDate}T${a.addedTime}`);
              const dateB = new Date(`${b.addedDate}T${b.addedTime}`);
              
              // Handle invalid dates
              if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
                return 0; // Keep original order for invalid dates
              }
              
              return dateB.getTime() - dateA.getTime();
            } catch (dateError) {
              console.warn('Error parsing date for sorting:', dateError);
              return 0; // Keep original order on date parsing errors
            }
          });
        default:
          return sortedNotes;
      }
    } catch (error) {
      console.error('Error sorting notes:', error);
      return notesToSort; // Return original array on error
    }
  }, []);
  const [loading, setLoading] = useState(true);
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);

  // Load notes from storage
  const loadNotes = useCallback(async () => {
    try {
      const storedNotes = await AsyncStorage.getItem("addedNotes");
      if (storedNotes) {
        const notes = JSON.parse(storedNotes);
        // Sort notes based on current sort option
        const sortedNotes = sortNotes(notes, sortOption);
        setNotes(sortedNotes);
      }
    } catch (error) {
      console.error("Error loading notes:", error);
    } finally {
      setLoading(false);
    }
  }, [sortOption]);

  // Save notes to storage
  const saveNotes = useCallback(async (newNotes: Note[]) => {
    try {
      await AsyncStorage.setItem("addedNotes", JSON.stringify(newNotes));
    } catch (error) {
      console.error("Error saving notes:", error);
    }
  }, []);

  // Toggle view between list and grid
  const toggleView = () => {
    const newListView = !listView;
    setListView(newListView);
    saveViewPreference(newListView);
  };

  // Handle sort option change with error handling
  const handleSortChange = (option: 'newest' | 'oldest' | 'title' | 'date') => {
    try {
      setSortOption(option);
      saveSortPreference(option);
      
      // Re-sort current notes
      if (notes && notes.length > 0) {
        const sortedNotes = sortNotes(notes, option);
        setNotes(sortedNotes);
      }
    } catch (error) {
      console.error('Error changing sort option:', error);
      // Fallback to default sorting
      setSortOption('newest');
      saveSortPreference('newest');
    }
  };

  // Handle note selection
  const toggleNoteSelection = (noteId: string) => {
    setSelectedNotes(prev => 
      prev.includes(noteId) 
        ? prev.filter(id => id !== noteId)
        : [...prev, noteId]
    );
  };

  // Delete selected notes
  const deleteSelectedNotes = () => {
    const updatedNotes = notes.filter(note => !selectedNotes.includes(note.id));
    setNotes(updatedNotes);
    saveNotes(updatedNotes);
    setSelectedNotes([]);
  };

  useEffect(() => {
    loadNotes();
    loadViewPreference();
    loadSortPreference();
  }, [loadNotes, loadViewPreference, loadSortPreference]);

  // Reload notes when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadNotes();
      loadViewPreference();
      loadSortPreference();
    }, [loadNotes, loadViewPreference, loadSortPreference])
  );

  if (loading) {
    return <FullPageLoader />;
  }

  const renderNoteItem = ({ item }: { item: Note }) => {
    const isSelected = selectedNotes.includes(item.id);
    
    return (
      <TouchableOpacity
        style={[
          styles.noteContainer,
          {
            backgroundColor: isSelected ? theme.primaryLight : theme.surface,
            borderColor: theme.border,
          },
        ]}
        onPress={() => {
          if (selectedNotes.length > 0) {
            // If notes are selected, toggle selection
            toggleNoteSelection(item.id);
          } else {
            // If no notes are selected, navigate to edit with all note details
            router.push({
              pathname: "/addNote",
              params: {
                id: item.id,
                shortTitle: item.shortTitle,
                description: item.description,
                addedDate: item.addedDate,
                addedTime: item.addedTime,
                isEditing: "true"
              }
            });
          }
        }}
        onLongPress={() => toggleNoteSelection(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.noteContent}>
                  <Text
          style={[
            styles.noteTitle,
            {
              color: isSelected ? theme.white : theme.text,
            },
          ]}
          numberOfLines={2}
        >
          {item.shortTitle}
        </Text>
        <Text
          style={[
            styles.noteDescription,
            {
              color: isSelected ? theme.white : theme.textSecondary,
            },
          ]}
          numberOfLines={3}
        >
          {item.description}
        </Text>
        <View style={styles.noteMeta}>
          <Text
            style={[
              styles.noteDate,
              {
                color: isSelected ? theme.white : theme.textMuted,
              },
            ]}
          >
            {item.addedDate}
          </Text>
          <Text
            style={[
              styles.noteTime,
              {
                color: isSelected ? theme.white : theme.textMuted,
              },
            ]}
          >
            {item.addedTime}
          </Text>
        </View>
        </View>
      </TouchableOpacity>
    );
  };
  
  const renderGridItem = ({ item, index }: { item: Note; index: number }) => {
    const isSelected = selectedNotes.includes(item.id);
    console.log('Grid item data:', item);
    
    return (
      <TouchableOpacity
        style={[
          styles.gridItem,
          {
            backgroundColor: isSelected ? theme.primaryLight : theme.surface,
            borderColor: theme.border,
            marginTop: index < 2 ? 0 : 4, // Ensure first row has no top margin
            marginRight: index % 2 === 1 ? 0 : 8, // Remove right margin for items in right column
          },
        ]}
        onPress={() => {
          if (selectedNotes.length > 0) {
            // If notes are selected, toggle selection
            toggleNoteSelection(item.id);
          } else {
            // If no notes are selected, navigate to edit with all note details
            router.push({
              pathname: "/addNote",
              params: {
                id: item.id,
                shortTitle: item.shortTitle,
                description: item.description,
                addedDate: item.addedDate,
                addedTime: item.addedTime,
                isEditing: "true"
              }
            });
          }
        }}
        onLongPress={() => toggleNoteSelection(item.id)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.gridTitle,
            {
              color: isSelected ? theme.white : theme.text,
            },
          ]}
          numberOfLines={2}
        >
          {item.shortTitle || "Untitled Note"}
        </Text>
        <Text
    style={[
      styles.gridDescription,
      {
        color: isSelected ? theme.white : theme.textSecondary,
      },
    ]}
    numberOfLines={2}
  >
    {item.description}
  </Text>
        <View style={styles.gridSpacer} />
        <View style={styles.gridMeta}>
          <Text
            style={[
              styles.gridDate,
              {
                color: isSelected ? theme.white : theme.textMuted,
              },
            ]}
          >
            {item.addedDate || "No Date"}
          </Text>
          <Text
            style={[
              styles.gridTime,
              {
                color: isSelected ? theme.white : theme.textMuted,
              },
            ]}
          >
            {item.addedTime || "No Time"}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <StatusBar style={themeMode === "dark" ? "light" : "dark"} backgroundColor={theme.background} />
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <CustomHeader
          title="NoteLo"
          notes={notes}
          toggleView={toggleView}
          listView={listView}
          selectedNotes={selectedNotes}
          onDeleteSelected={deleteSelectedNotes}
          sortOption={sortOption}
          onSortChange={handleSortChange}
        />

        {notes.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <View style={styles.iconContainer}>
              <Ionicons name="document-text-outline" size={48} color={theme.textMuted} />
            </View>
            <Text style={[styles.emptyStateTitle, { color: theme.text }]}>
              No Notes Yet
            </Text>
            <Text style={[styles.emptyStateSubtitle, { color: theme.textSecondary }]}>
              Create your first note to get started
            </Text>
            <TouchableOpacity
              style={[styles.addNoteButton, { backgroundColor: theme.primary }]}
              onPress={() => router.push("/addNote")}
              activeOpacity={0.7}
            >
              <Text style={[styles.addNoteButtonText, { color: theme.white }]}>
                Create Your First Note
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>


            <FlatList
              data={notes}
              renderItem={listView ? renderNoteItem : renderGridItem}
              keyExtractor={(item) => item.id}
              key={listView ? "list" : "grid"}
              numColumns={listView ? 1 : 2}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
            />

            <TouchableOpacity
              style={[styles.floatingButton, { backgroundColor: theme.primary }]}
              onPress={() => router.push("/addNote")}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={24} color={theme.white} />
            </TouchableOpacity>
          </>
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  gridContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  noteContainer: {
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  noteContent: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  noteDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  noteMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  noteDate: {
    fontSize: 12,
  },
  noteTime: {
    fontSize: 12,
  },
  gridItem: {
    flex: 1,
    marginHorizontal: 0,
    marginVertical: 4,
    marginRight: 8,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    height: 140,
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  gridSpacer: {
    flex: 1,
  },
  gridTitle: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 20,
    textAlign: "left",
    marginBottom: 8,
  },
  gridDescription: {
    fontSize: 14,
    marginTop: 0,
    marginBottom: 12,
    lineHeight: 20,
    textAlign: "left",
  },
  gridMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 0,
  },
  gridDate: {
    fontSize: 12,
    marginTop: 0,
    textAlign: "left",
  },
  gridTime: {
    fontSize: 12,
    marginTop: 0,
    textAlign: "right",
  },
  floatingButton: {
    position: "absolute",
    bottom: 30,
    right: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  iconContainer: {
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateSubtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  addNoteButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  addNoteButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },

});
