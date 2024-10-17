import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import Colors from "../constants/colors"; // Adjust the path based on your project structure

const FullPageLoader: React.FC = () => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.lightSlate} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
});

export default FullPageLoader;
