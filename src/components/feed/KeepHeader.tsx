import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useNotesStore } from '../../store/useNotesStore';

interface KeepHeaderProps {
  onMenuPress: () => void;
  onSettingsPress: () => void;
  onReorderPress?: () => void;
}

export const KeepHeader: React.FC<KeepHeaderProps> = ({
  onMenuPress,
  onSettingsPress,
  onReorderPress,
}) => {
  const { theme, viewMode, setViewMode } = useSettingsStore();
  const { searchQuery, setSearchQuery } = useNotesStore();

  const isDark = theme === 'dark';

  const handleToggleViewMode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setViewMode(viewMode === 'grid' ? 'list' : 'grid');
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.pillCapsule,
          {
            backgroundColor: isDark ? '#2D2E30' : '#F1F3F4',
            borderColor: isDark ? '#3C4043' : '#E8EAED',
          },
        ]}
      >
        {/* Left: Drawer Menu Icon */}
        <TouchableOpacity
          style={styles.iconButton}
          activeOpacity={0.6}
          onPress={onMenuPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="menu" size={22} color={isDark ? '#E8EAED' : '#5F6368'} />
        </TouchableOpacity>

        {/* Center: Search Input */}
        <View style={styles.searchSection}>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search your notes"
            placeholderTextColor={isDark ? '#9AA0A6' : '#70757A'}
            style={[styles.searchInput, { color: isDark ? '#E8EAED' : '#202124' }]}
            returnKeyType="search"
            clearButtonMode="never"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={18} color={isDark ? '#9AA0A6' : '#70757A'} />
            </TouchableOpacity>
          )}
        </View>

        {/* Right Actions: View Toggle & Settings Avatar */}
        <View style={styles.rightActions}>
          {onReorderPress && (
            <TouchableOpacity
              style={styles.iconButton}
              activeOpacity={0.6}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onReorderPress();
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name="swap-vertical-outline"
                size={20}
                color={isDark ? '#E8EAED' : '#5F6368'}
              />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.6}
            onPress={handleToggleViewMode}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons
              name={viewMode === 'grid' ? 'view-agenda-outline' : 'view-grid-outline'}
              size={21}
              color={isDark ? '#E8EAED' : '#5F6368'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.avatarButton}
            activeOpacity={0.7}
            onPress={onSettingsPress}
          >
            <View style={styles.avatarInner}>
              <Ionicons name="settings-outline" size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 10 : 8,
    paddingBottom: 10,
  },
  pillCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  searchSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
    paddingVertical: 0,
  },
  clearButton: {
    padding: 2,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  avatarButton: {
    padding: 2,
  },
  avatarInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
