import { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  SafeAreaView,
  StatusBar,
  BackHandler,
  Alert,
} from "react-native";
import Colors from "../constants/colors";
import Entypo from "@expo/vector-icons/Entypo";
import Ionicons from "@expo/vector-icons/Ionicons";
import AntDesign from "@expo/vector-icons/AntDesign";
import { Link } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import dayjs from "dayjs";
import { useRouter } from "expo-router"; // For Expo Router
import { nanoid } from "nanoid";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import useBackPressHandler from "../components/BackHandler";
import FullPageLoader from "../components/loader";
const { width, height } = Dimensions.get("window");
import showToast from "../utils/toast";
import Toast from "react-native-toast-message";
const numberOfLines = 25;

const EditableMultilineComponent: React.FC = () => {
  // useBackPressHandler();

  const { id, shortTitle, description, addedDate, addedTime } =
    useLocalSearchParams<{
      id: string;
      shortTitle: string;
      description: string;
      addedDate: string;
      addedTime: string;
    }>();
  const router = useRouter();
  const [headerText, setHeaderText] = useState<string>("");
  const [multilineText, setMultilineText] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isLoad, setIsLoad] = useState<boolean>(false);
  const [isEdited, setIsEdited] = useState<boolean>(false);
  const inputRef = useRef<TextInput>(null);

  const renderLines = () => {
    // Define the number of lines you want in the background
    const lines = [];

    for (let i = 0; i <= numberOfLines; i++) {
      lines.push(<View key={i} style={styles.line} />);
    }

    return lines;
  };

  interface Note {
    id: string;
    shortTitle: string;
    description: string;
    addedDate: string;
    addedTime: string;
  }

  const saveNote = async (newNote: Note) => {
    try {
      const notesString = await AsyncStorage.getItem("addedNotes");
      let notes: Note[] = notesString ? JSON.parse(notesString) : [];

      // Find if a note with the same ID already exists
      const existingNoteIndex = notes.findIndex((note) => note.id === id);

      if (existingNoteIndex !== -1) {
        // Update the existing note
        notes[existingNoteIndex] = newNote;
      } else {
        // Add the new note
        notes.push(newNote);
      }

      await AsyncStorage.setItem("addedNotes", JSON.stringify(notes));
      // await AsyncStorage.removeItem('addedNotes');
      console.log("Note added successfully!");
    } catch (error) {
      console.error("Error saving note:", error);
    }
  };

  // Usage example
  const newNote: Note = {
    id: id || Math.random().toString(36).substr(2, 9),
    shortTitle: headerText.trim(),
    description: multilineText.trim(),
    addedDate: dayjs().format("YYYY-MM-DD"),
    addedTime: dayjs().format("hh:mm A"),
  };

  const handleSubmit = async () => {
    // setIsProcessing(true);
    setIsEdited(false);
    handleTouchOutside();
    try {
      // console.log("length of text is:", newNote.description.trim().length);
      if (
        newNote.description.trim().length > 0 &&
        newNote.shortTitle.trim().length > 0
      ) {
        // setIsLoad(true);
        await saveNote(newNote); // Assuming saveNote is an async
        // setTimeout(() => {
        //   router.push("./(tabs)");
        //   // setIsLoad(false)
        // }, 1000);
      } else {
        // setIsLoad(false);
        showToast({
          type: 2, // Error
          title: "Error",
          text: "Can't save an empty note. Please add some text.",
        });
        // console.error("Note cannot be empty.");
      }
    } catch (error) {
      console.error("Error saving note:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleIsEdit = () => {
    setIsEdited(true);
  };

  const handleTouchOutside = () => {
    // Blur the TextInput when tapping outside
    inputRef.current?.blur();
  };

  useFocusEffect(
    useCallback(() => {
      if (id) {
        // If ID exists, pre-fill the form with existing note details
        setHeaderText(shortTitle || "");
        setMultilineText(description || "");
      } else {
        // Reset fields for new note
        setHeaderText("");
        setMultilineText("");
      }
    }, [id, shortTitle, description])
  );

  const deleteNote = () => {
    Alert.alert(
      "Delete Note",
      "Are you sure? you want to move the note to the trash can ?",
      [
        {
          text: "No, Exit",
          // onPress: () => router.push("./(tabs)"),
          style: "destructive", // Makes the button red on iOS
        },
        {
          text: "Delete",
          onPress: async () => {
            try {
              const currentNotesString = await AsyncStorage.getItem(
                "addedNotes"
              );

              // console.log('-----remove------',currentNotesString);
              // return false;
              if (currentNotesString) {
                const currentNotes: Note[] = JSON.parse(currentNotesString);
                const updatedNotes = currentNotes.filter(
                  (note) => note.id != id
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
                await AsyncStorage.setItem(
                  "addedNotes",
                  JSON.stringify(sortedNotes)
                );
              }
            } catch (error) {
              console.error("Error removing selected notes:", error);
            }
            setTimeout(() => {
              router.push("./(tabs)");
            }, 1000);
          },
        },
      ],
      { cancelable: true }
    );
  };

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

  useEffect(() => {
    const backAction = () => {
      if (
        newNote.description.trim().length > 0 &&
        newNote.shortTitle.trim().length > 0 &&
        isEdited
      ) {
        Alert.alert(
          "Unsaved Note",
          "You have unsaved changes. Do you want to save the note before exiting?",
          [
            {
              text: "No, Exit",
              onPress: () => router.push("./(tabs)"),
              style: "destructive", // Makes the button red on iOS
            },
            {
              text: "Save",
              onPress: async () => {
                setIsLoad(true);
                await saveNote(newNote);
                setTimeout(() => {
                  router.push("./(tabs)");
                }, 1000);
              },
            },
          ],
          { cancelable: true }
        );
      } else {
        // If there's nothing to save, simply exit the app
        router.push("./(tabs)");
        // BackHandler.exitApp();
      }
      return true; // Indicate that the back press is handled
    };

    // Add the back press event listener
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    // Clean up the event listener on unmount
    return () => backHandler.remove();
  }, [router, newNote, saveNote, setIsLoad]);

  // console.log("-=id", id);

  return (
    <>
      {isLoad ? (
        <FullPageLoader />
      ) : (
        <SafeAreaView style={styles.container}>
          {/* Header Input */}
          <View style={styles.containerHeader}>
            {isEdited ? (
              <TouchableOpacity
                style={styles.doneIcon}
                disabled={isProcessing}
                onPress={() => {
                  handleSubmit();
                }}
              >
                <Ionicons
                  name="checkmark-done-outline"
                  size={20}
                  color={Colors.lightSlate}
                />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.doneIcon}
                disabled={isProcessing}
                onPress={() => {
                  router.push("./(tabs)");
                }}
              >
                <Ionicons
                  name="arrow-back-outline"
                  size={20}
                  color={Colors.lightSlate}
                />
              </TouchableOpacity>
            )}

            <TextInput
              ref={inputRef}
              onKeyPress={toggleIsEdit}
              style={styles.headerInput}
              value={headerText}
              onChangeText={setHeaderText}
              placeholder="Enter text"
              placeholderTextColor="#666"
              selectionColor={Colors.background}
              maxLength={30}
            />
            {id && (
              <TouchableOpacity
                style={styles.verticleDot}
                onPress={() => deleteNote()}
              >
                {/* <Entypo name="dots-three-vertical" size={20} color={Colors.lightSlate} /> */}
                <AntDesign name="delete" size={20} color={Colors.lightSlate} />
              </TouchableOpacity>
            )}
          </View>

          {/* Multiline Text Input with Lines in the Background */}
          <TouchableOpacity style={styles.multilineContainer}>
            <ScrollView
              style={styles.scrollContainer}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}
            >
              {renderLines()}
              <TextInput
                ref={inputRef}
                onKeyPress={toggleIsEdit}
                style={styles.multilineInput}
                value={multilineText}
                onChangeText={(text) => {
                  setMultilineText(text);
                  !id &&
                    headerText.length <= 5 &&
                    setHeaderText(text.substring(0, 18));
                }}
                multiline={true}
                textAlignVertical="top" // Align text to the top in multiline input
                placeholder="Enter list items here..."
                placeholderTextColor="#666"
                numberOfLines={numberOfLines}
                selectionColor={Colors.lightSlate}
                // editable = {isEdited}
              />
            </ScrollView>
          </TouchableOpacity>
          <Toast />
        </SafeAreaView>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: StatusBar.currentHeight || 0,
    // padding: 10,
    backgroundColor: Colors.black,
  },
  headerInput: {
    backgroundColor: Colors.lightSlate, // Yellow color similar to the image
    flex: 1,
    color: Colors.background,
    fontSize: 18,
    padding: 8,
  },
  // header styling
  containerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 50,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightSlate,
    margin: 1,
    paddingHorizontal:8,
  },
  verticleDot: {
    flex: 0.2,
    alignItems: "center",
  },
  doneIcon: {
    flex: 0.2,
    alignItems: "center",
  },
  textHeader: {
    fontSize: 30,
    color: Colors.lightSlate,
    fontFamily: "cafenty",
  },
  multilineContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 5,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: Colors.lightSlate,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
  line: {
    height: 32, // Approximate line height for each line
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.lightSlate,
    width: width - 10, // Full width of the container minus padding
    alignSelf: "center",
  },
  multilineInput: {
    position: "absolute", // Overlay the text input over the lines
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 10,
    color: Colors.lightSlate,
    fontSize: 16,
    lineHeight: 32,
  },
});

export default EditableMultilineComponent;
