import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { KEEP_COLORS, KeepColor } from '../../constants/keepColors';
import { useSettingsStore } from '../../store/useSettingsStore';

interface ColorPaletteModalProps {
  visible: boolean;
  selectedColorHex?: string;
  onSelectColor: (colorHex: string) => void;
  onClose: () => void;
}

export const ColorPaletteModal: React.FC<ColorPaletteModalProps> = ({
  visible,
  selectedColorHex = '#FFFFFF',
  onSelectColor,
  onClose,
}) => {
  const { theme } = useSettingsStore();
  const isDark = theme === 'dark';

  const handleSelect = (color: KeepColor) => {
    Haptics.selectionAsync();
    onSelectColor(isDark ? color.dark : color.light);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <View
          style={[
            styles.container,
            {
              backgroundColor: isDark ? '#202124' : '#FFFFFF',
              borderColor: isDark ? '#3C4043' : '#E8EAED',
            },
          ]}
        >
          <Text style={[styles.title, { color: isDark ? '#E8EAED' : '#202124' }]}>
            Colour
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.colorRow}
          >
            {KEEP_COLORS.map((c) => {
              const hex = isDark ? c.dark : c.light;
              const isSelected =
                selectedColorHex.toLowerCase() === hex.toLowerCase() ||
                selectedColorHex.toLowerCase() === c.light.toLowerCase() ||
                selectedColorHex.toLowerCase() === c.dark.toLowerCase() ||
                (c.id === 'default' && (!selectedColorHex || selectedColorHex === '#FFFFFF'));

              return (
                <TouchableOpacity
                  key={c.id}
                  style={[
                    styles.colorCircle,
                    {
                      backgroundColor: hex,
                      borderColor: isSelected ? '#F59E0B' : isDark ? c.borderDark : c.borderLight,
                      borderWidth: isSelected ? 3 : 1.5,
                    },
                  ]}
                  activeOpacity={0.7}
                  onPress={() => handleSelect(c)}
                >
                  {isSelected && (
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color={isDark ? '#F8FAFC' : '#1E293B'}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    paddingTop: 16,
    paddingBottom: 36,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
    marginBottom: 14,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 6,
  },
  colorCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
