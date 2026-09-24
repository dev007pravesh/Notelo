import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '../../store/useSettingsStore';

interface KeepBottomBarProps {
  onNewTextNote: () => void;
  onNewChecklistNote: () => void;
  onNewDrawingNote: () => void;
  onNewAudioNote: () => void;
  onNewImageNote: () => void;
}

export const KeepBottomBar: React.FC<KeepBottomBarProps> = ({
  onNewTextNote,
  onNewChecklistNote,
  onNewDrawingNote,
  onNewAudioNote,
  onNewImageNote,
}) => {
  const { theme } = useSettingsStore();
  const isDark = theme === 'dark';

  const handleAction = (callback: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    callback();
  };

  return (
    <View style={styles.outerContainer}>
      <View
        style={[
          styles.bar,
          {
            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
            borderTopColor: isDark ? '#334155' : '#E2E8F0',
          },
        ]}
      >
        {/* Quick Capture Action Icons */}
        <View style={styles.quickGroup}>
          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.6}
            onPress={() => handleAction(onNewChecklistNote)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="checkbox-outline" size={23} color={isDark ? '#94A3B8' : '#475569'} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.6}
            onPress={() => handleAction(onNewDrawingNote)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons name="brush" size={23} color={isDark ? '#94A3B8' : '#475569'} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.6}
            onPress={() => handleAction(onNewAudioNote)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="mic-outline" size={23} color={isDark ? '#94A3B8' : '#475569'} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.6}
            onPress={() => handleAction(onNewImageNote)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="image-outline" size={23} color={isDark ? '#94A3B8' : '#475569'} />
          </TouchableOpacity>
        </View>

        {/* Floating Action Button (FAB) on Right */}
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.8}
          onPress={() => handleAction(onNewTextNote)}
        >
          <Ionicons name="add" size={30} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: Platform.OS === 'ios' ? 76 : 60,
    paddingBottom: Platform.OS === 'ios' ? 20 : 6,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 8,
  },
  quickGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: Platform.OS === 'ios' ? 4 : 0,
  },
});
