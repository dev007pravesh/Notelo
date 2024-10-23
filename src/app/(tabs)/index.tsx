import {
  Text,
  View,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  StatusBar,
  Pressable,
  BackHandler,
} from "react-native";
import { useState, useCallback, useEffect } from "react";
import { Link } from "expo-router";
import CustomHeader from "../../components/header";
import Colors from "../../constants/colors";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import AntDesign from "@expo/vector-icons/AntDesign";
import FullPageLoader from "../../components/loader";

interface Note {
  id: string;
  shortTitle: string;
  description: string;
  addedDate: string;
  addedTime: string;
}

const Index: React.FC = () => {
  const [addedNotes, setAddedNotes] = useState<Note[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<string[]>([]);
  const [isItemSelected, setIsItemSelected] = useState<boolean>(false);
  const [isLoad, setIsLoad] = useState<boolean>(false);
  const [listView, setlistView] = useState<boolean>(true);

  const fetchAddedNotes = async () => {
    try {
      setIsLoad(true);
      const notesString = await AsyncStorage.getItem("addedNotes");
      // console.log("notesString=========>", notesString);
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
        setIsLoad(false);
      } else {
        setAddedNotes([]); // Set to empty if no notes found
        setIsLoad(false);
      }
    } catch (error) {
      setIsLoad(false);
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

  const removeSelectedNotes = async () => {
    try {
      const currentNotesString = await AsyncStorage.getItem("addedNotes");
      if (currentNotesString) {
        const currentNotes: Note[] = JSON.parse(currentNotesString);
        const updatedNotes = currentNotes.filter(
          (note) => !selectedIndex.includes(note.id)
        );

        const sortedNotes: Note[] = updatedNotes.sort((a, b) => {
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

        // Save updated notes back to AsyncStorage
        await AsyncStorage.setItem("addedNotes", JSON.stringify(sortedNotes));

        // Update the state with the new notes
        setAddedNotes(sortedNotes);
        setIsItemSelected(false);
      }
    } catch (error) {
      console.error("Error removing selected notes:", error);
    }
  };
  // Fetch notes when the screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchAddedNotes();
    }, [])
  );
  const handleLongPress = (id: string) => {
    if (selectedIndex.includes(id)) {
      // If item is already selected, deselect it
      setSelectedIndex((prev) => prev.filter((itemId) => itemId !== id));
    } else {
      // If item is not selected, select it
      setSelectedIndex((prev) => [...prev, id]);
    }

    // Set isItemSelected to true when any item is selected
    // console.log('selectedIndex.length',selectedIndex)
    setIsItemSelected(true);
  };

  const handlePress = (id: string) => {
    console.log("isItemSelected====>", isItemSelected);
    if (isItemSelected) {
      // If any item is selected, toggle the selected item
      setSelectedIndex((prev) =>
        prev.includes(id)
          ? prev.filter((itemId) => itemId !== id)
          : [...prev, id]
      );
    }
  };

  useEffect(() => {
    const isSlectedStatus = selectedIndex.length == 0 ? false : true;

    setIsItemSelected(isSlectedStatus);
  }, [selectedIndex]);

  useEffect(() => {
    const backAction = () => {
      // Exit the app when back button is pressed
      BackHandler.exitApp();

      // Return true to indicate that the back press is handled
      return true;
    };

    // Add the back press event listener
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    // Clean up the event listener on unmount
    return () => backHandler.remove();
  }, []);

  const renderNote = ({ item }: { item: Note }) => {
    const isSelected = selectedIndex.includes(item.id);
    const uri = !isItemSelected ? "./../addNote" : "";

    return (
      <Link
        href={{
          pathname: uri,
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
        <TouchableOpacity
          style={{ flex: 1, }}
          onLongPress={() => handleLongPress(item.id)}
          onPress={() => handlePress(item.id)}
        >
          <View
            style={[
              styles.noteContainer,
              isSelected && { backgroundColor: "#73a1b1" },
            ]}
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
          </View>
        </TouchableOpacity>
      </Link>
    );
  };

  const toggleListView = ()=>{
    setlistView(!listView);
  }

  return (
    <>
      {isLoad ? (
        <FullPageLoader />
      ) : (
        <SafeAreaView style={styles.safeArea}>
          {isItemSelected ? (
            <View style={styles.headerContainer}>
              <TouchableOpacity onPress={() => removeSelectedNotes()}>
                <AntDesign name="delete" size={20} color={Colors.lightSlate} />
              </TouchableOpacity>
            </View>
          ) : (
            <CustomHeader title="Home" showBackButton={false} toggleView= {toggleListView} />
          )}

          {addedNotes.length > 0 ? (
            <>
              <FlatList
                data={addedNotes}
                renderItem={renderNote}
                keyExtractor={(item) => item.id.toString()}
                numColumns={listView ? 1 : 2}
                // Add a key prop to force a fresh render when changing the view
                key={listView ? 'list' : 'grid'} 
                columnWrapperStyle={listView ? undefined : styles.columnWrapper}
                contentContainerStyle={styles.listContainer}
              />
              <Link href="./../addNote" replace asChild>
                <TouchableOpacity style={styles.floatingButton}>
                  <FontAwesome
                    name="plus"
                    size={24}
                    color={Colors.lightSlate}
                  />
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
      )}
    </>
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
    backgroundColor: Colors.lightSlate,
    borderRadius: 8,
    padding: 15,
    // marginVertical: 10,
    flex: 1,
    margin: 5,
  },
  title: {
    fontSize: 16,
    fontFamily: "requiner",
    color: Colors.background,
    marginBottom: 5,
  },
  description: {
    fontSize: 14,
    // fontFamily:'premint',
    color: Colors.background,
    marginBottom: 5,
  },
  date: {
    fontSize: 12,
    color: Colors.background,
  },
  floatingButton: {
    position: "absolute",
    // alignSelf:'center',
    bottom: 30,
    right: 40,
    backgroundColor: Colors.background, // Color of the button
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
  selectedNote: {
    backgroundColor: "#ccc", // The background color when the item is selected
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    height: 50,
    backgroundColor: Colors.background,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightSlate,
  },
});
