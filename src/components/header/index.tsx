import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Pressable,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons"; // Make sure you have @expo/vector-icons installed
import Colors from "../../constants/colors";
import Entypo from "@expo/vector-icons/Entypo";

type CustomHeaderProps = {
  title: string;
  showBackButton?: boolean; // Make showBackButton optional
};

const CustomHeader = ({ title, showBackButton }: CustomHeaderProps) => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      {showBackButton && (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
      )}
      <View style={styles.backButton}>
        <Text style={styles.text}>NoteLo</Text>
      </View>
      <TouchableOpacity onPress={() => console.log("pressed")}>
        <Entypo
          name="dots-three-vertical"
          size={20}
          color={Colors.lightSlate}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 50,
    backgroundColor: Colors.background,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightSlate,
  },
  backButton: {},
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.lightSlate,
  },
  text: {
    fontSize: 30,
    color: Colors.lightSlate,
    fontFamily: "cafenty",
  },
});

export default CustomHeader;
