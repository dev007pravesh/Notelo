import React, { useState } from "react";
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
import Header from "./../components/header/addNoteHeader";
import Entypo from "@expo/vector-icons/Entypo";
import Ionicons from "@expo/vector-icons/Ionicons";
import AntDesign from "@expo/vector-icons/AntDesign";
import { Link } from "expo-router";

const { width, height } = Dimensions.get("window");
const numberOfLines = 25;

const EditableMultilineComponent: React.FC = () => {
  const [headerText, setHeaderText] = useState<string>("");
  const [multilineText, setMultilineText] = useState<string>(
    "Bhjh\nHhh\nHui\nJuij\nHuh\nJjk\nJjj\nJjk\nJi\nUu"
  );

  const renderLines = () => {
    // Define the number of lines you want in the background
    const lines = [];

    for (let i = 0; i <= numberOfLines; i++) {
      lines.push(<View key={i} style={styles.line} />);
    }

    return lines;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Input */}
      <View style={styles.containerHeader}>
        <Link href={'./(tabs)'} asChild>
        <TouchableOpacity
          style={styles.doneIcon}
          onPress={()=>{
            console.log('done chalega kya')
          }}
        >
          <Ionicons
            name="checkmark-done-outline"
            size={20}
            color={Colors.lightSlate}
          />
        </TouchableOpacity>
        </Link>
       
        <TextInput
          style={styles.headerInput}
          value={headerText}
          onChangeText={setHeaderText}
          placeholder="Enter text"
          placeholderTextColor="#666"
          selectionColor={Colors.background}
          maxLength={30}
        />

        <TouchableOpacity
          style={styles.verticleDot}
          onPress={() => console.log("pressed done")}
        >
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
            onChangeText={setMultilineText}
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
