import {
  Text,
  View,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  StatusBar,
  Pressable,
} from "react-native";
import { useState, useCallback, useEffect } from "react";
import { Link } from "expo-router";
import CustomHeader from "../../components/header";
import Colors from "../../constants/colors";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import dayjs from "dayjs";

interface Note {
  id: string;
  shortTitle: string;
  description: string;
  addedDate: string;
  addedTime: string;
}

const Index: React.FC = () => {
  const [addedNotes, setAddedNotes] = useState<Note[]>([]);

  const fetchAddedNotes = async () => {
    try {
      const notesString = await AsyncStorage.getItem("addedNotes");
      console.log("notesString=========>", notesString);
      if (notesString) {
        const notes: Note[] = JSON.parse(notesString);
        const sortedNotes: Note[] = notes.sort((a, b) => {
          // Combine date and time into a single Date object
          const dateA = new Date(
            `${a.addedDate}T${convertTimeTo24Hour(a.addedTime)}`
          );
          const dateB = new Date(
            `${b.addedDate}T${convertTimeTo24Hour(b.addedTime)}`
          );

          // Sort in descending order
          return dateB.getTime() - dateA.getTime(); // If you want ascending, use dateA.getTime() - dateB.getTime()
        });
        setAddedNotes(sortedNotes);
      } else {
        setAddedNotes([]); // Set to empty if no notes found
      }
    } catch (error) {
      console.error("Error fetching notes from AsyncStorage:", error);
    }
  };
  // Function to convert 12-hour format to 24-hour format
  const convertTimeTo24Hour = (time: string): string => {
    const [timePart, modifier] = time.split(" ");
    let [hours, minutes] = timePart.split(":").map(Number);

    if (modifier === "PM" && hours < 12) {
      hours += 12; // Convert PM hours to 24-hour format
    }
    if (modifier === "AM" && hours === 12) {
      hours = 0; // Convert 12 AM to 0 hours
    }

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:00`; // Return time in HH:MM:SS format
  };

  // Fetch notes when the screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchAddedNotes();
    }, [])
  );

  const renderNote = ({ item }: { item: Note}) => (
    // <Link href='./../addNote' asChild>
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
      <Pressable
        style={styles.noteContainer}
        onLongPress={() => console.log("------------onlong press active")}
      >
        <Text style={styles.title} numberOfLines={4}>
          {item.shortTitle}
        </Text>
        <Text style={styles.description} numberOfLines={4}>
          {item.description}
        </Text>
        <Text style={styles.date}>
          {item.addedDate} - {item.addedTime}
        </Text>
      </Pressable>
    </Link>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <CustomHeader title="Home" showBackButton={false} />
      {addedNotes.length > 0 ? (
        <>
          <FlatList
            data={addedNotes}
            renderItem={renderNote}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.listContainer}
          />
          <Link href="./../addNote" replace asChild>
            <TouchableOpacity style={styles.floatingButton}>
              <FontAwesome name="plus" size={24} color={Colors.background} />
            </TouchableOpacity>
          </Link>
        </>
      ) : (
        <View style={styles.container}>
          <Link href="./../addNote" replace asChild>
            <TouchableOpacity style={styles.buttonContainer}>
              <FontAwesome
                name="sticky-note"
                size={100}
                color={Colors.lightSlate}
              />
              <Text style={styles.buttonTxt}>Add note</Text>
            </TouchableOpacity>
          </Link>
        </View>
      )}
    </SafeAreaView>
  );
};
export default Index;
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: StatusBar.currentHeight || 0,
  },
  listContainer: {
    padding: 10,
  },
  columnWrapper: {
    justifyContent: "space-between",
  },
  noteContainer: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 15,
    marginVertical: 10,
    flex: 1,
    margin: 5,
  },
  title: {
    fontSize: 16,
    fontFamily: "requiner",
    color: Colors.lightSlate,
    marginBottom: 5,
  },
  description: {
    fontSize: 14,
    // fontFamily:'premint',
    color: Colors.lightSlate,
    marginBottom: 5,
  },
  date: {
    fontSize: 12,
    color: Colors.lightSlate,
  },
  floatingButton: {
    position: "absolute",
    // alignSelf:'center',
    bottom: 30,
    right: 40,
    backgroundColor: Colors.lightSlate, // Color of the button
    borderRadius: 30, // Makes it circular
    borderWidth: 1,
    borderColor: Colors.lightSlate,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  buttonTxt: {
    fontSize: 20,
    color: Colors.lightSlate,
    fontFamily: "requiner",
  },
});
