import React, { useEffect, useState } from "react";
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
import { Link } from "expo-router";
import { setStatusBarStyle } from "expo-status-bar";

const SearchScreen: React.FC = () => {
  const [searchText, setSearchText] = useState<string>("");
  const [notes, setNotes] = useState<any[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<any[]>([]);

  useEffect(() => {
    setStatusBarStyle("light");
    const fetchNotes = async () => {
      try {
        const notesString = await AsyncStorage.getItem("addedNotes");
        if (notesString) {
          const parsedNotes = JSON.parse(notesString);
          setNotes(parsedNotes);
          setFilteredNotes(parsedNotes);
        }
      } catch (error) {
        console.error("Error fetching notes from AsyncStorage:", error);
      }
    };

    fetchNotes();
  }, []);

  useEffect(() => {
    // Filter notes based on search text
    if (searchText) {
      const filtered = notes.filter((note) =>
        note.shortTitle.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredNotes(filtered);
    } else {
      setFilteredNotes(notes);
    }
  }, [searchText, notes]);

  const renderItem = ({ item }: { item: any }) => (
    <Link
      href={{
        pathname: "./../addNote",
        params: {
          id: item.id,
          shortTitle: item.shortTitle,
          description: item.description,
          addedDate: item.addedDate,
          addedTime: item.addedTime,
        },
      }}
      replace
      asChild
    >
      <TouchableOpacity style={styles.itemContainer}>
        <Text style={styles.itemText}>{item.shortTitle}</Text>
      </TouchableOpacity>
    </Link>
    
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#25292e" />
      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#c2d4d4" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search..."
          placeholderTextColor="#c2d4d4"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* List of Notes */}
      <FlatList
        data={filteredNotes}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#25292e",
    paddingTop: StatusBar.currentHeight || 0,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#1e2327",
    borderRadius: 5,
    margin: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: "#c2d4d4",
    fontSize: 18,
  },
  listContainer: {
    paddingBottom: 20,
  },
  itemContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#444",
  },
  itemText: {
    color: "#c2d4d4",
    fontSize: 16,
  },
});

export default SearchScreen;
