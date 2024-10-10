import React, { useState } from 'react';
import { View, TextInput, StyleSheet, ScrollView } from 'react-native';
import Colors from '../constants/colors';  // Assuming you have Colors.background defined

export default function AddNote() {
  const [text, setText] = useState('');

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <TextInput
          style={styles.textInput}
          placeholder="Write your notes here..."
          placeholderTextColor="#fff"
          multiline
          value={text}
          onChangeText={setText}
        />
        {/* This overlay will provide the "lines" underneath each row of text */}
        <View style={styles.linesContainer}>
          {Array(0) // Adjust this number for how many lines you want
            .fill()
            .map((_, index) => (
              <View key={index} style={styles.line} />
            ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.background, // Notebook background
  },
  textInput: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    fontSize: 16,
    lineHeight: 35,  // Adjust spacing between text lines
    color: '#fff',  // White text color
    textAlignVertical: 'top',  // Ensures multiline text starts from the top
    zIndex:-10,
  },
  linesContainer: {
    position: 'absolute',
    top: 10,  // Offset to align with text input's padding
    left: 10,
    right: 10,
    bottom: 10,
  },
  line: {
    borderBottomColor: '#fff',  // White lines
    borderBottomWidth: 1,
    height: 35,  // Height between each line (matches lineHeight in TextInput)
  },
});
