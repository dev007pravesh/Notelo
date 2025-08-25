import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Text,
  StatusBar,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { setStatusBarStyle } from "expo-status-bar";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../../contexts/ThemeContext";

// Custom debounce hook
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

interface Note {
  id: string;
  shortTitle: string;
  description: string;
  addedDate: string;
  addedTime: string;
  lastModified?: number; // Optional for backward compatibility
}

const SearchScreen: React.FC = () => {
  const { theme, themeMode } = useTheme();
  const router = useRouter();
  const [searchText, setSearchText] = useState<string>("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  
  // Debounce search text with 300ms delay
  const debouncedSearchText = useDebounce(searchText, 300);

  // useFocusEffect(() => {
  //   useCallback(() => {
  //     fetchNotes();
  //   }, []);
  // });

 
  useFocusEffect(
    useCallback(()=>{
      fetchNotes();
    },[])
  )
  const fetchNotes = async () => {
    setStatusBarStyle("light");
    try {
      const notesString = await AsyncStorage.getItem("addedNotes");
      if (notesString) {
        const parsedNotes = JSON.parse(notesString);
        // Sort notes by lastModified timestamp (newest first)
        // For backward compatibility, notes without lastModified will be treated as oldest
        const sortedNotes = parsedNotes.sort((a: Note, b: Note) => {
          const aTime = a.lastModified || 0;
          const bTime = b.lastModified || 0;
          return bTime - aTime;
        });
        setNotes(sortedNotes);
        setFilteredNotes(sortedNotes);
      }
    } catch (error) {
      console.error("Error fetching notes from AsyncStorage:", error);
    }
  };

  useEffect(() => {
    // Show searching state when user is typing
    if (searchText !== debouncedSearchText) {
      setIsSearching(true);
    } else {
      setIsSearching(false);
    }
  }, [searchText, debouncedSearchText]);

  useEffect(() => {
    // Filter notes based on debounced search text
    if (debouncedSearchText) {
      const filtered = notes.filter((note) =>
        note.shortTitle.toLowerCase().includes(debouncedSearchText.toLowerCase()) ||
        note.description.toLowerCase().includes(debouncedSearchText.toLowerCase())
      );
      setFilteredNotes(filtered);
      setIsSearching(false);
    } else {
      setFilteredNotes(notes);
      setIsSearching(false);
    }
  }, [debouncedSearchText, notes]);

  const renderItem = ({ item }: { item: Note }) => (
    <TouchableOpacity 
      style={[styles.itemContainer, { backgroundColor: theme.surface, borderColor: theme.border }]} 
      activeOpacity={0.8}
      onPress={() => {
        router.push({
          pathname: "./../addNote",
          params: {
            id: item.id,
            shortTitle: item.shortTitle,
            description: item.description,
            addedDate: item.addedDate,
            addedTime: item.addedTime,
            isEditing: "true",
          },
        });
      }}
    >
      <Text style={[styles.itemTitle, { color: theme.text }]} numberOfLines={2} ellipsizeMode="tail">
        {item.shortTitle}
      </Text>
      <Text style={[styles.itemDescription, { color: theme.textSecondary }]} numberOfLines={2} ellipsizeMode="tail">
        {item.description}
      </Text>
      <Text style={[styles.itemDate, { color: theme.textMuted }]}>
        {item.addedDate} • {item.addedTime}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>

      {/* Search Input */}
      <View style={[styles.searchContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Ionicons
          name={isSearching ? "sync" : "search"}
          size={20}
          color={isSearching ? theme.primary : theme.textMuted}
          style={[styles.searchIcon, isSearching && styles.searchingIcon]}
        />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search your notes..."
          placeholderTextColor={theme.textMuted}
          value={searchText}
          onChangeText={setSearchText}
          autoCapitalize="none"
          autoCorrect={false}
          selectionColor={theme.primary}
          underlineColorAndroid="transparent"
        />
      </View>

      {/* List of Notes or Empty State */}
      {filteredNotes.length > 0 ? (
        <FlatList
          data={filteredNotes}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.emptyStateContainer}>
          <View style={[styles.emptyStateCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.emptyStateIcon, { backgroundColor: theme.primaryLight }]}>
              <Ionicons
                name={searchText ? "search-outline" : "document-text-outline"}
                size={32}
                color={theme.primary}
              />
            </View>
            <Text style={[styles.emptyStateTitle, { color: theme.text }]}>
              {searchText ? "No matching notes found" : "No notes yet"}
            </Text>
            <Text style={[styles.emptyStateSubtitle, { color: theme.textSecondary }]}>
              {searchText 
                ? "Try searching with different keywords or check your spelling"
                : "Create your first note to get started"
              }
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: StatusBar.currentHeight || 0,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    margin: 16,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
    opacity: 0.5,
  },
  searchingIcon: {
    opacity: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
    paddingVertical: 4,
    paddingHorizontal: 4,
    letterSpacing: 0.3,
  },
  listContainer: {
    paddingBottom: 100,
    paddingHorizontal: 16,
  },
  itemContainer: {
    padding: 14,
    borderRadius: 8,
    marginVertical: 3,
    borderWidth: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 3,
    letterSpacing: 0.4,
  },
  itemDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
    opacity: 0.8,
    letterSpacing: 0.2,
  },
  itemDate: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.6,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 280,
  },
  emptyStateIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.8,
    letterSpacing: 0.2,
  },
});

export default SearchScreen;
