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
  sortOption: 'newest' | 'oldest' | 'title' | 'date';
  onSortChange: (option: 'newest' | 'oldest' | 'title' | 'date') => void;
};

const CustomHeader = ({
  title,
  showBackButton,
  notes,
  toggleView,
  listView,
  selectedNotes,
  onDeleteSelected,
  sortOption,
  onSortChange,
}: CustomHeaderProps) => {
  const navigation = useNavigation();
  const { theme, themeMode, toggleTheme } = useTheme();
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Close dropdown when tapping outside
  const handleOutsideTouch = () => {
    if (showSortDropdown) {
      setShowSortDropdown(false);
    }
  };

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
      {/* Touchable overlay to close dropdown when tapping outside */}
      {showSortDropdown && (
        <TouchableOpacity
          style={[styles.overlay, { 
            top: -1000,
            left: -1000,
            right: -1000,
            bottom: -1000,
          }]}
          activeOpacity={1}
          onPress={handleOutsideTouch}
        />
      )}
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
        
        {/* Sort Button - only show if more than 1 note */}
        {notes.length > 1 && (
          <TouchableOpacity 
            onPress={() => setShowSortDropdown(!showSortDropdown)}
            style={[styles.sortButton, { 
              backgroundColor: showSortDropdown ? theme.primary + '20' : theme.surface,
              borderColor: showSortDropdown ? theme.primary : theme.border 
            }]}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="funnel-outline" 
              size={22} 
              color={theme.primary} 
            />
          </TouchableOpacity>
        )}

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

      {/* Sort Dropdown */}
      {showSortDropdown && (
        <TouchableOpacity
          style={[styles.sortDropdown, { 
            backgroundColor: theme.surface,
            borderColor: theme.border 
          }]}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Dropdown Header */}
          <View style={[styles.dropdownHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.dropdownTitle, { color: theme.text }]}>
              Sort Notes
            </Text>
          </View>
          
          <TouchableOpacity
            style={[styles.sortOption, { 
              backgroundColor: sortOption === 'newest' ? theme.primary + '20' : 'transparent'
            }]}
            onPress={() => {
              onSortChange('newest');
              setShowSortDropdown(false);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.sortOptionContent}>
              <Ionicons 
                name="time-outline" 
                size={18} 
                color={sortOption === 'newest' ? theme.primary : theme.textMuted} 
              />
              <View style={styles.sortOptionTextContainer}>
                <Text style={[styles.sortOptionText, { 
                  color: sortOption === 'newest' ? theme.primary : theme.text 
                }]}>
                  Newest First
                </Text>
                <Text style={[styles.sortOptionSubtext, { 
                  color: sortOption === 'newest' ? theme.primary + '80' : theme.textMuted 
                }]}>
                  Latest modified notes
                </Text>
              </View>
            </View>
            {sortOption === 'newest' && (
              <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.sortOption, { 
              backgroundColor: sortOption === 'oldest' ? theme.primary + '20' : 'transparent'
            }]}
            onPress={() => {
              onSortChange('oldest');
              setShowSortDropdown(false);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.sortOptionContent}>
              <Ionicons 
                name="time-outline" 
                size={18} 
                color={sortOption === 'oldest' ? theme.primary : theme.textMuted} 
              />
              <View style={styles.sortOptionTextContainer}>
                <Text style={[styles.sortOptionText, { 
                  color: sortOption === 'oldest' ? theme.primary : theme.text 
                }]}>
                  Oldest First
                </Text>
                <Text style={[styles.sortOptionSubtext, { 
                  color: sortOption === 'oldest' ? theme.primary + '80' : theme.textMuted 
                }]}>
                  Earliest modified notes
                </Text>
              </View>
            </View>
            {sortOption === 'oldest' && (
              <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.sortOption, { 
              backgroundColor: sortOption === 'title' ? theme.primary + '20' : 'transparent'
            }]}
            onPress={() => {
              onSortChange('title');
              setShowSortDropdown(false);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.sortOptionContent}>
              <Ionicons 
                name="text-outline" 
                size={18} 
                color={sortOption === 'title' ? theme.primary : theme.textMuted} 
              />
              <View style={styles.sortOptionTextContainer}>
                <Text style={[styles.sortOptionText, { 
                  color: sortOption === 'title' ? theme.primary : theme.text 
                }]}>
                  By Title
                </Text>
                <Text style={[styles.sortOptionSubtext, { 
                  color: sortOption === 'title' ? theme.primary + '80' : theme.textMuted 
                }]}>
                  Alphabetical order
                </Text>
              </View>
            </View>
            {sortOption === 'title' && (
              <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.sortOption, { 
              backgroundColor: sortOption === 'date' ? theme.primary + '20' : 'transparent'
            }]}
            onPress={() => {
              onSortChange('date');
              setShowSortDropdown(false);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.sortOptionContent}>
              <Ionicons 
                name="calendar-outline" 
                size={18} 
                color={sortOption === 'date' ? theme.primary : theme.textMuted} 
              />
              <View style={styles.sortOptionTextContainer}>
                <Text style={[styles.sortOptionText, { 
                  color: sortOption === 'date' ? theme.primary : theme.text 
                }]}>
                  By Date
                </Text>
                <Text style={[styles.sortOptionSubtext, { 
                  color: sortOption === 'date' ? theme.primary + '80' : theme.textMuted 
                }]}>
                  Creation date order
                </Text>
              </View>
            </View>
            {sortOption === 'date' && (
              <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    backgroundColor: 'transparent',
    zIndex: 999,
  },
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
  sortButton: {
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
  sortDropdown: {
    position: 'absolute',
    top: '100%',
    right: 20,
    borderRadius: 12,
    borderWidth: 1,
    padding: 8,
    minWidth: 150,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1001,
  },
  sortOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sortOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sortOptionTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  sortOptionText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  sortOptionSubtext: {
    fontSize: 12,
    fontWeight: '400',
    opacity: 0.8,
  },
  dropdownHeader: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    marginBottom: 4,
  },
  dropdownTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.3,
  },

});

export default CustomHeader;
