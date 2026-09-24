import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  BackHandler,
  Platform,
} from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import dayjs from "dayjs";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import FullPageLoader from "../components/loader";
import CustomAlert from "../components/CustomAlert";
import showToast from "../utils/toast";
import Toast from "react-native-toast-message";

const LINE_HEIGHT = 34;

interface Note {
  id: string;
  shortTitle: string;
  description: string;
  addedDate: string;
  addedTime: string;
  lastModified: number;
}

const EditableMultilineComponent: React.FC = () => {
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
  const [inputHeight, setInputHeight] = useState<number>(0);
  const [showDeleteAlert, setShowDeleteAlert] = useState<boolean>(false);
  const [showUnsavedAlert, setShowUnsavedAlert] = useState<boolean>(false);
  const [existingNote, setExistingNote] = useState<Note | null>(null);

  const inputRef = useRef<TextInput>(null);
  const titleInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Dynamic calculations for ruled lines
  const totalContentHeight = Math.max(containerHeight, inputHeight + LINE_HEIGHT * 6);
  const totalLines = Math.max(25, Math.ceil(totalContentHeight / LINE_HEIGHT));

  // Word count calculation
  const wordCount = useMemo(() => {
    const trimmed = multilineText.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  }, [multilineText]);

  const renderLines = () => {
    const lines = [];
    for (let i = 0; i < totalLines; i++) {
      lines.push(
        <View
          key={i}
          style={[
            styles.line,
            { borderBottomColor: theme.textMuted }
          ]}
        />
      );
    }
    return lines;
  };

  const saveNote = async (noteToSave: Note) => {
    try {
      const notesString = await AsyncStorage.getItem("addedNotes");
      let notes: Note[] = notesString ? JSON.parse(notesString) : [];

      const existingNoteIndex = notes.findIndex((note) => note.id === id);

      if (existingNoteIndex !== -1) {
        notes[existingNoteIndex] = noteToSave;
      } else {
        notes.push(noteToSave);
      }

      notes.sort((a, b) => b.lastModified - a.lastModified);
      await AsyncStorage.setItem("addedNotes", JSON.stringify(notes));
    } catch (error) {
      console.error("Error saving note:", error);
    }
  };

  const newNote: Note = useMemo(() => ({
    id: id || Math.random().toString(36).substring(2, 11),
    shortTitle: headerText.trim(),
    description: multilineText.trim(),
    addedDate: existingNote ? existingNote.addedDate : dayjs().format("YYYY-MM-DD"),
    addedTime: existingNote ? existingNote.addedTime : dayjs().format("hh:mm A"),
    lastModified: Date.now(),
  }), [id, headerText, multilineText, existingNote]);

  const handleSubmit = async () => {
    inputRef.current?.blur();
    titleInputRef.current?.blur();
    setIsProcessing(true);

    try {
      if (newNote.description.trim().length > 0 && newNote.shortTitle.trim().length > 0) {
        await saveNote(newNote);
        setIsEdited(false);
        showToast({
          type: 1,
          title: "Saved",
          text: "Note saved successfully!",
        });
      } else {
        showToast({
          type: 2,
          title: "Incomplete Note",
          text: "Please add both a title and some note content.",
        });
      }
    } catch (error) {
      console.error("Error saving note:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleIsEdit = () => {
    if (!isEdited) {
      setIsEdited(true);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (id && isEditing === "true") {
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
        setIsEdited(false);
      } else {
        setHeaderText("");
        setMultilineText("");
        setExistingNote(null);
        setIsEdited(false);
      }
    }, [id, shortTitle, description, addedDate, addedTime, isEditing])
  );

  const deleteNote = () => {
    setShowDeleteAlert(true);
  };

  const convertTimeTo24Hour = (time: string): string => {
    const [timePart, modifier] = time.split(" ");
    let [hours, minutes] = timePart.split(":").map(Number);

    if (modifier === "PM" && hours < 12) {
      hours += 12;
    }
    if (modifier === "AM" && hours === 12) {
      hours = 0;
    }

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:00`;
  };

  const handleDeleteConfirm = async () => {
    try {
      const currentNotesString = await AsyncStorage.getItem("addedNotes");

      if (currentNotesString) {
        const currentNotes: Note[] = JSON.parse(currentNotesString);
        const updatedNotes = currentNotes.filter((note) => note.id !== id);

        const sortedNotes = updatedNotes.sort((a, b) => {
          const dateA = new Date(`${a.addedDate}T${convertTimeTo24Hour(a.addedTime)}`);
          const dateB = new Date(`${b.addedDate}T${convertTimeTo24Hour(b.addedTime)}`);
          return dateB.getTime() - dateA.getTime();
        });

        await AsyncStorage.setItem("addedNotes", JSON.stringify(sortedNotes));
      }
    } catch (error) {
      console.error("Error removing selected notes:", error);
    }
    setShowDeleteAlert(false);
    showToast({
      type: 1,
      title: "Deleted",
      text: "Note has been removed.",
    });
    setTimeout(() => {
      router.push("./(tabs)");
    }, 400);
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
    }, 400);
  };

  const handleBackPress = () => {
    if (
      newNote.description.trim().length > 0 &&
      newNote.shortTitle.trim().length > 0 &&
      isEdited
    ) {
      setShowUnsavedAlert(true);
    } else {
      router.push("./(tabs)");
    }
  };

  useEffect(() => {
    const backAction = () => {
      if (
        newNote.description.trim().length > 0 &&
        newNote.shortTitle.trim().length > 0 &&
        isEdited
      ) {
        setShowUnsavedAlert(true);
        return true;
      } else {
        router.push("./(tabs)");
        return true;
      }
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [router, newNote, isEdited]);

  const displayDate = existingNote
    ? `${existingNote.addedDate} · ${existingNote.addedTime}`
    : `${dayjs().format("MMM D, YYYY")} · ${dayjs().format("hh:mm A")}`;

  return (
    <>
      {isLoad ? (
        <FullPageLoader />
      ) : (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
          {/* Top Modern Header Bar */}
          <View style={[styles.headerBar, { borderBottomColor: theme.border }]}>
            {/* Back Button */}
            <TouchableOpacity
              style={[
                styles.iconButton,
                { 
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                }
              ]}
              onPress={handleBackPress}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={20} color={theme.text} />
            </TouchableOpacity>

            {/* Note Status Badge */}
            <View style={[styles.statusBadge, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View 
                style={[
                  styles.statusDot, 
                  { backgroundColor: isEdited ? theme.accent : theme.success }
                ]} 
              />
              <Text style={[styles.statusText, { color: theme.textSecondary }]}>
                {isEdited ? "Unsaved changes" : (id ? "Saved" : "New Note")}
              </Text>
            </View>

            {/* Right Actions */}
            <View style={styles.rightActionsGroup}>
              {/* Delete Button for existing notes */}
              {id && (
                <TouchableOpacity
                  style={[
                    styles.iconButton,
                    styles.deleteIconButton,
                    { backgroundColor: theme.error + "15", borderColor: theme.error + "40" }
                  ]}
                  disabled={isProcessing}
                  onPress={deleteNote}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={19} color={theme.error} />
                </TouchableOpacity>
              )}

              {/* Save / Done Button */}
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  isEdited
                    ? { backgroundColor: theme.primary, borderColor: theme.primary }
                    : { backgroundColor: theme.surface, borderColor: theme.border }
                ]}
                disabled={isProcessing}
                onPress={handleSubmit}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isEdited ? "checkmark" : "checkmark-done"}
                  size={20}
                  color={isEdited ? "#ffffff" : theme.success}
                />
                {isEdited && (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Note Metadata and Title Bar */}
          <View style={styles.titleSection}>
            <TextInput
              ref={titleInputRef}
              style={[styles.titleInput, { color: theme.text }]}
              value={headerText}
              onChangeText={(text) => {
                setHeaderText(text);
                toggleIsEdit();
              }}
              placeholder="Note Title"
              placeholderTextColor={theme.textMuted}
              maxLength={80}
              selectionColor={theme.primary}
              underlineColorAndroid="transparent"
              autoCorrect={false}
              autoCapitalize="sentences"
              returnKeyType="next"
              onSubmitEditing={() => inputRef.current?.focus()}
            />

            {/* Metadata Pills */}
            <View style={styles.metaRow}>
              <View style={[styles.metaChip, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Ionicons name="calendar-outline" size={13} color={theme.textMuted} />
                <Text style={[styles.metaChipText, { color: theme.textMuted }]}>
                  {displayDate}
                </Text>
              </View>

              <View style={[styles.metaChip, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <MaterialCommunityIcons name="text-box-outline" size={13} color={theme.textMuted} />
                <Text style={[styles.metaChipText, { color: theme.textMuted }]}>
                  {wordCount} {wordCount === 1 ? "word" : "words"}
                </Text>
              </View>
            </View>
          </View>

          {/* Lined Notebook Canvas */}
          <View
            style={[
              styles.notebookCanvas,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
            onLayout={(event) => {
              const { height } = event.nativeEvent.layout;
              setContainerHeight(height);
            }}
          >
            <ScrollView
              ref={scrollViewRef}
              style={styles.scrollContainer}
              contentContainerStyle={[
                styles.contentContainer,
                { minHeight: totalLines * LINE_HEIGHT },
              ]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Ruled Notebook Lines Layer */}
              <View style={styles.linesBackground} pointerEvents="none">
                {renderLines()}
              </View>

              {/* Note Content Multiline Input */}
              <TextInput
                ref={inputRef}
                style={[
                  styles.multilineInput,
                  {
                    color: theme.text,
                    minHeight: totalLines * LINE_HEIGHT,
                  },
                ]}
                value={multilineText}
                maxLength={10000}
                onChangeText={(text) => {
                  setMultilineText(text);
                  toggleIsEdit();
                  if (!id && headerText.length <= 3) {
                    const firstLine = text.split("\n")[0];
                    if (firstLine.trim().length > 0) {
                      setHeaderText(firstLine.substring(0, 30));
                    }
                  }
                }}
                onContentSizeChange={(e) => {
                  setInputHeight(e.nativeEvent.contentSize.height);
                }}
                multiline={true}
                scrollEnabled={false}
                textAlignVertical="top"
                placeholder="Start writing your thoughts, ideas, or notes here..."
                placeholderTextColor={theme.textMuted}
                selectionColor={theme.primary}
                underlineColorAndroid="transparent"
                autoCorrect={false}
                autoCapitalize="sentences"
              />
            </ScrollView>

            {/* Bottom Character Counter Badge */}
            <View style={[styles.bottomStatsPill, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text
                style={[
                  styles.counterText,
                  { color: theme.textMuted },
                  multilineText.length >= 9000 && { color: theme.warning, fontWeight: "600" },
                  multilineText.length >= 10000 && { color: theme.error, fontWeight: "700" },
                ]}
              >
                {multilineText.length.toLocaleString()}/10,000
              </Text>
            </View>
          </View>
          <Toast />
        </SafeAreaView>
      )}

      {/* Delete Confirmation Alert */}
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

      {/* Unsaved Changes Alert */}
      <CustomAlert
        visible={showUnsavedAlert}
        title="Unsaved Changes"
        message="You have unsaved changes. Would you like to save before leaving?"
        onCancel={handleUnsavedAlertExit}
        onConfirm={handleUnsavedAlertSave}
        confirmText="Save"
        cancelText="Discard"
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
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteIconButton: {
    marginRight: 8,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  rightActionsGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  titleSection: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 10,
  },
  titleInput: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 0.2,
    paddingVertical: 4,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    gap: 5,
  },
  metaChipText: {
    fontSize: 11,
    fontWeight: "500",
  },
  notebookCanvas: {
    flex: 1,
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 14,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    position: "relative",
  },
  linesBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  line: {
    height: LINE_HEIGHT,
    borderBottomWidth: 1,
    width: "100%",
    opacity: 0.3,
  },
  multilineInput: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 6 : 6,
    paddingBottom: 45,
    fontSize: 15,
    lineHeight: LINE_HEIGHT,
    includeFontPadding: false,
    textAlignVertical: "top",
    fontWeight: "400",
  },
  bottomStatsPill: {
    position: "absolute",
    bottom: 10,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  counterText: {
    fontSize: 11,
    fontWeight: "500",
  },
});

export default EditableMultilineComponent;
