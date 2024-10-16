import { useState, useCallback, useEffect } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  SafeAreaView,
  StatusBar,
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

const { width, height } = Dimensions.get("window");
const numberOfLines = 25;

const EditableMultilineComponent: React.FC = () => {
  useBackPressHandler();

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

  const handlePress = async () => {
    // setIsProcessing(true);
    try {
      console.log("length of text is:", newNote.description.trim().length);
      if (
        newNote.description.trim().length > 0 &&
        newNote.shortTitle.trim().length > 0
      ) {
        await saveNote(newNote); // Assuming saveNote is an async
        // Once the processing is done, navigate
        // await AsyncStorage.removeItem('addedNotes');
        setTimeout(() => {
          router.push("./(tabs)");
        }, 1000);
      } else {
        console.error("Note cannot be empty.");
      }
    } catch (error) {
      console.error("Error saving note:", error);
    } finally {
      setIsProcessing(false);
    }
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

  const reSet = () => {
    setHeaderText("");
    setMultilineText("");
    setIsProcessing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Input */}
      <View style={styles.containerHeader}>
        <TouchableOpacity
          style={styles.doneIcon}
          disabled={isProcessing}
          onPress={() => {
            handlePress();
            console.log("done chalega kya");
          }}
        >
          <Ionicons
            name="checkmark-done-outline"
            size={20}
            color={Colors.lightSlate}
          />
        </TouchableOpacity>

        <TextInput
          style={styles.headerInput}
          value={headerText}
          onChangeText={setHeaderText}
          placeholder="Enter text"
          placeholderTextColor="#666"
          selectionColor={Colors.background}
          maxLength={30}
        />

        <TouchableOpacity style={styles.verticleDot} onPress={() => reSet()}>
          <AntDesign name="delete" size={20} color={Colors.lightSlate} />
        </TouchableOpacity>
      </View>

      {/* Multiline Text Input with Lines in the Background */}
      <View style={styles.multilineContainer}>
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {renderLines()}
          <TextInput
            style={styles.multilineInput}
            value={multilineText}
            onChangeText={(text) => {
              setMultilineText(text);
              !id && setHeaderText(text.substring(0, 18));
            }}
            multiline={true}
            textAlignVertical="top" // Align text to the top in multiline input
            placeholder="Enter list items here..."
            placeholderTextColor="#666"
            numberOfLines={numberOfLines}
            selectionColor={Colors.lightSlate}
            // editable = {false}
          />
        </ScrollView>
      </View>
    </SafeAreaView>
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
