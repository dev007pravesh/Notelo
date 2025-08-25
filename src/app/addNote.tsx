import { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  SafeAreaView,
  StatusBar,
  BackHandler,
} from "react-native";
import { useTheme } from "../contexts/ThemeContext";
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
import CustomAlert from "../components/CustomAlert";
const { width, height } = Dimensions.get("window");
import showToast from "../utils/toast";
import Toast from "react-native-toast-message";
const numberOfLines = 25;

const EditableMultilineComponent: React.FC = () => {
  // useBackPressHandler();
  const { theme, themeMode } = useTheme();

  const { id, shortTitle, description, addedDate, addedTime, isEditing } = useLocalSearchParams<{
    id?: string;
    shortTitle?: string;
    description?: string;
    addedDate?: string;
    addedTime?: string;
    isEditing?: string;
  }>();
  const router = useRouter();
  const [headerText, setHeaderText] = useState<string>("");
  const [multilineText, setMultilineText] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isLoad, setIsLoad] = useState<boolean>(false);
  const [isEdited, setIsEdited] = useState<boolean>(false);
  const [containerHeight, setContainerHeight] = useState<number>(0);
  const [showDeleteAlert, setShowDeleteAlert] = useState<boolean>(false);
  const [showUnsavedAlert, setShowUnsavedAlert] = useState<boolean>(false);
  const inputRef = useRef<TextInput>(null);

  const renderLines = () => {
    // Calculate number of lines based on container height
    const lineHeight = 34; // Height of each line
    const calculatedLines = Math.max(20, Math.floor(containerHeight / lineHeight));
    const lines = [];

    for (let i = 0; i <= calculatedLines; i++) {
      lines.push(<View key={i} style={[styles.line, { borderBottomColor: theme.textMuted }]} />);
    }

    return lines;
  };

  interface Note {
    id: string;
    shortTitle: string;
    description: string;
    addedDate: string;
    addedTime: string;
    lastModified: number; // Timestamp for sorting
  }

  const [existingNote, setExistingNote] = useState<Note | null>(null);



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

      // Sort notes by lastModified timestamp (newest first)
      notes.sort((a, b) => b.lastModified - a.lastModified);

      await AsyncStorage.setItem("addedNotes", JSON.stringify(notes));
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
    addedDate: existingNote ? existingNote.addedDate : dayjs().format("YYYY-MM-DD"),
    addedTime: existingNote ? existingNote.addedTime : dayjs().format("hh:mm A"),
    lastModified: Date.now(), // Current timestamp for sorting
  };

  const handleSubmit = async () => {
    // setIsProcessing(true);
    handleTouchOutside();
    try {
      // console.log("length of text is:", newNote.description.trim().length);
      if (
        newNote.description.trim().length > 0 &&
        newNote.shortTitle.trim().length > 0
      ) {
        // setIsLoad(true);
        await saveNote(newNote); // Assuming saveNote is an async
        setIsEdited(false);
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
      if (id && isEditing === "true") {
        // If editing existing note, use passed parameters
        setHeaderText(shortTitle || "");
        setMultilineText(description || "");
        setExistingNote({
          id: id,
          shortTitle: shortTitle || "",
          description: description || "",
          addedDate: addedDate || dayjs().format("YYYY-MM-DD"),
          addedTime: addedTime || dayjs().format("hh:mm A"),
          lastModified: Date.now(),
        });
      } else {
        // Reset fields for new note
        setHeaderText("");
        setMultilineText("");
        setExistingNote(null);
      }
    }, [id, shortTitle, description, addedDate, addedTime, isEditing])
  );

  const deleteNote = () => {
    setShowDeleteAlert(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const currentNotesString = await AsyncStorage.getItem("addedNotes");

      if (currentNotesString) {
        const currentNotes: Note[] = JSON.parse(currentNotesString);
        const updatedNotes = currentNotes.filter((note) => note.id != id);

        const sortedNotes: Note[] = updatedNotes.sort((a, b) => {
          // Combine date and time into a single Date object
          const dateA = new Date(
            `${a.addedDate}T${convertTimeTo24Hour(a.addedTime)}`
          );
          const dateB = new Date(
            `${b.addedDate}T${convertTimeTo24Hour(b.addedTime)}`
          );

          // Sort in descending order
          return dateB.getTime() - dateA.getTime();
        });

        // Save updated notes back to AsyncStorage
        await AsyncStorage.setItem("addedNotes", JSON.stringify(sortedNotes));
      }
    } catch (error) {
      console.error("Error removing selected notes:", error);
    }
    setShowDeleteAlert(false);
    setTimeout(() => {
      router.push("./(tabs)");
    }, 1000);
  };

  const handleUnsavedAlertExit = () => {
    setShowUnsavedAlert(false);
    router.push("./(tabs)");
  };

  const handleUnsavedAlertSave = async () => {
    setShowUnsavedAlert(false);
    setIsLoad(true);
    await saveNote(newNote);
    setTimeout(() => {
      router.push("./(tabs)");
    }, 1000);
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
        setShowUnsavedAlert(true);
        return true; // Indicate that the back press is handled
      } else {
        // If there's nothing to save, simply exit the app
        router.push("./(tabs)");
        // BackHandler.exitApp();
        return true; // Indicate that the back press is handled
      }
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
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
          {/* Header Input */}
          <View style={[styles.containerHeader, { backgroundColor: theme.background }]}>
            {/* Left Icon */}
            {isEdited ? (
              <TouchableOpacity
                style={styles.headerIcon}
                disabled={isProcessing}
                onPress={() => {
                  handleSubmit();
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="checkmark-done-outline"
                  size={24}
                  color={theme.success}
                />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.headerIcon}
                disabled={isProcessing}
                onPress={() => {
                  router.push("./(tabs)");
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="arrow-back-outline"
                  size={24}
                  color={theme.primary}
                />
              </TouchableOpacity>
            )}

            {/* Center Input */}
            <TextInput
              ref={inputRef}
              style={[
                styles.headerInput, 
                { 
                  color: theme.text, 
                  backgroundColor: theme.surface, 
                  borderColor: theme.border 
                }
              ]}
              value={headerText}
              onChangeText={(text) => {
                setHeaderText(text);
                toggleIsEdit();
              }}
              placeholder="Note title..."
              placeholderTextColor={theme.textMuted}
              maxLength={50}
              selectionColor={theme.primary}
              underlineColorAndroid="transparent"
              autoCorrect={false}
              autoCapitalize="none"
            />

            {/* Right Icon - Only show delete for existing notes */}
            {id && (
              <TouchableOpacity
                style={styles.headerIcon}
                disabled={isProcessing}
                onPress={() => deleteNote()}
                activeOpacity={0.7}
              >
                <Ionicons name="trash" size={24} color="#ef4444" />
              </TouchableOpacity>
            )}
          </View>

          {/* Multiline Text Input with Lines in the Background */}
          <TouchableOpacity 
            style={[
              styles.multilineContainer, 
              { 
                backgroundColor: theme.background, 
                borderColor: theme.border 
              }
            ]}
            onLayout={(event) => {
              const { height } = event.nativeEvent.layout;
              setContainerHeight(height);
            }}
          >
            <ScrollView
              style={styles.scrollContainer}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}
            >
              {renderLines()}
              <TextInput
                ref={inputRef}
                style={[styles.multilineInput, { color: theme.text }]}
                value={multilineText}
                maxLength={10000}
                onChangeText={(text) => {
                  setMultilineText(text);
                  toggleIsEdit();
                  !id &&
                    headerText.length <= 5 &&
                    setHeaderText(text.substring(0, 18));
                }}
                multiline={true}
                textAlignVertical="top" // Align text to the top in multiline input
                placeholder="Start writing your note..."
                placeholderTextColor={theme.textMuted}
                numberOfLines={numberOfLines}
                selectionColor={theme.primary}
                underlineColorAndroid="transparent"
                autoCorrect={false}
                autoCapitalize="none"
              />
            </ScrollView>
            {/* Character Counter */}
            <View style={styles.characterCounter}>
              <Text style={[
                styles.counterText,
                { color: theme.textMuted },
                multilineText.length >= 9000 && { color: theme.warning },
                multilineText.length >= 10000 && { color: theme.error }
              ]}>
                {multilineText.length.toLocaleString()}/10,000
              </Text>
            </View>
          </TouchableOpacity>
          <Toast />
        </SafeAreaView>
      )}

      {/* Custom Delete Alert */}
      <CustomAlert
        visible={showDeleteAlert}
        title="Delete Note"
        message="Are you sure you want to delete this note? This action cannot be undone."
        onCancel={() => setShowDeleteAlert(false)}
        onConfirm={handleDeleteConfirm}
        confirmText="Delete"
        cancelText="Cancel"
        type="delete"
      />

      {/* Custom Unsaved Notes Alert */}
      <CustomAlert
        visible={showUnsavedAlert}
        title="Unsaved Note"
        message="You have unsaved changes. Do you want to save the note before exiting?"
        onCancel={handleUnsavedAlertExit}
        onConfirm={handleUnsavedAlertSave}
        confirmText="Save"
        cancelText="No, Exit"
        type="warning"
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: StatusBar.currentHeight || 0,

  },
  headerInput: {

    flex: 1,

    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    fontWeight: '400',
    borderWidth: 1,

    marginHorizontal: 8,
  },
  // header styling
  containerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 70,

    paddingHorizontal: 20,
    paddingTop: 10,
  },
  verticleDot: {
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  headerIcon: {
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  doneIcon: {
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  textHeader: {
    fontSize: 30,
    fontFamily: "cafenty",
  },
  multilineContainer: {
    flex: 1,

    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,

    marginHorizontal: 16,
    marginTop: 8,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
  line: {
    height: 34, // Increased to match text line height better
    borderBottomWidth: 1.2,

    width: "100%", // Full width of the container
    paddingLeft: 12, // Reduced padding for better space utilization
    opacity: 0.4, // Make lines more visible like notebook paper
  },
  multilineInput: {
    position: "absolute", // Overlay the text input over the lines
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12, // Reduced padding for better space utilization
    paddingTop: 6, // Fine-tuned to align text baseline with lines
    paddingBottom: 20,

    fontSize: 15,
    lineHeight: 34, // Match the line height exactly
    textAlignVertical: "top",
    fontWeight: '400',
  },
  characterCounter: {
    position: 'absolute',
    bottom: 8,
    right: 12,

    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  counterText: {
    fontSize: 12,

    fontWeight: '500',
  },
  counterWarning: {

  },
  counterError: {

    fontWeight: '600',
  },
});

export default EditableMultilineComponent;
