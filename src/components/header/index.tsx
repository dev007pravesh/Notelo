import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Pressable,
  StatusBar,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons"; // Make sure you have @expo/vector-icons installed
import { useTheme } from "../../contexts/ThemeContext";
import Entypo from "@expo/vector-icons/Entypo";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

type Note = {
  id: string;
  shortTitle: string;
  description: string;
  addedDate: string;
  addedTime: string;
};

type CustomHeaderProps = {
  title: string;
  showBackButton?: boolean; // Make showBackButton optional,
  notes:Note[];
  toggleView?: () => void;
  listView: boolean; // Add listView as a required prop
  selectedNotes: string[];
  onDeleteSelected: () => void;
};

const CustomHeader = ({
  title,
  showBackButton,
  notes,
  toggleView,
  listView,
  selectedNotes,
  onDeleteSelected,
}: CustomHeaderProps) => {
  const navigation = useNavigation();
  const { theme, themeMode, toggleTheme } = useTheme();

  const toggleListView = () => {
    if (toggleView) {
      toggleView(); // Call toggleView only if it is defined
    }
  };

  console.log('noteLen========',notes)

  return (
    <View style={[styles.container, { 
      backgroundColor: theme.background,
      borderBottomColor: theme.border 
    }]}>
      {showBackButton && (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backButton, { 
            backgroundColor: theme.surface,
            borderColor: theme.border 
          }]}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
      )}
      
      <View style={[styles.titleContainer, { 
        backgroundColor: theme.surface,
        borderColor: theme.border 
      }]}>
        <Text style={[styles.text, { color: theme.primary }]}>NoteLo</Text>
      </View>
      
      <View style={styles.rightActions}>
        {/* Theme Toggle Button */}
        <TouchableOpacity 
          onPress={toggleTheme}
          style={[styles.themeButton, { 
            backgroundColor: theme.surface,
            borderColor: theme.border 
          }]}
          activeOpacity={0.7}
        >
          <Ionicons
            name={themeMode === 'light' ? 'moon' : 'sunny'}
            size={22}
            color={theme.primary}
          />
        </TouchableOpacity>
        
        {/* View Toggle Button - only show if more than 1 note */}
        {notes.length > 1 && (
          <TouchableOpacity 
            onPress={toggleListView}
            style={[styles.toggleButton, { 
              backgroundColor: theme.surface,
              borderColor: theme.border 
            }]}
            activeOpacity={0.7}
          >
            {listView ? (
              <MaterialCommunityIcons
                name="view-grid"
                size={24}
                color={theme.text}
              />
            ) : (
              <MaterialCommunityIcons
                name="view-sequential"
                size={24}
                color={theme.text}
              />
            )}
          </TouchableOpacity>
        )}
        
        {/* Delete Button - only show when notes are selected */}
        {selectedNotes.length > 0 && (
          <TouchableOpacity 
            onPress={onDeleteSelected}
            style={[styles.deleteButton, { 
              backgroundColor: theme.error,
              borderColor: theme.border 
            }]}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={20} color={theme.white} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 80,
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  titleContainer: {
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  text: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeButton: {
    padding: 10,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
  },
  toggleButton: {
    padding: 10,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
  },
  deleteButton: {
    padding: 10,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
  },

});

export default CustomHeader;
