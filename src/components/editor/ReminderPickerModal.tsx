import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import dayjs from 'dayjs';

interface ReminderPickerModalProps {
  visible: boolean;
  isDark: boolean;
  currentReminder?: Date | null;
  onSelectReminder: (date: Date | null) => void;
  onClose: () => void;
}

export const ReminderPickerModal: React.FC<ReminderPickerModalProps> = ({
  visible,
  isDark,
  currentReminder,
  onSelectReminder,
  onClose,
}) => {
  const handleOption = (targetDate: Date | null) => {
    Haptics.selectionAsync();
    onSelectReminder(targetDate);
    onClose();
  };

  // Precomputed times
  const laterToday = dayjs().hour(18).minute(0).second(0).toDate();
  const tomorrowMorning = dayjs().add(1, 'day').hour(8).minute(0).second(0).toDate();
  const nextWeek = dayjs().add(7, 'day').hour(8).minute(0).second(0).toDate();

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
              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
              borderTopColor: isDark ? '#334155' : '#E2E8F0',
            },
          ]}
        >
          <Text style={[styles.title, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>
            Set Reminder
          </Text>

          {/* Option: Later today */}
          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => handleOption(laterToday)}
          >
            <View style={styles.optionLeft}>
              <Ionicons name="time-outline" size={22} color="#6366F1" />
              <View>
                <Text style={[styles.optionTitle, { color: isDark ? '#F8FAFC' : '#1E293B' }]}>
                  Later today
                </Text>
                <Text style={[styles.optionSub, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                  6:00 PM
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Option: Tomorrow morning */}
          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => handleOption(tomorrowMorning)}
          >
            <View style={styles.optionLeft}>
              <Ionicons name="sunny-outline" size={22} color="#F59E0B" />
              <View>
                <Text style={[styles.optionTitle, { color: isDark ? '#F8FAFC' : '#1E293B' }]}>
                  Tomorrow morning
                </Text>
                <Text style={[styles.optionSub, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                  Tomorrow, 8:00 AM
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Option: Next week */}
          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => handleOption(nextWeek)}
          >
            <View style={styles.optionLeft}>
              <Ionicons name="calendar-outline" size={22} color="#10B981" />
              <View>
                <Text style={[styles.optionTitle, { color: isDark ? '#F8FAFC' : '#1E293B' }]}>
                  Next week
                </Text>
                <Text style={[styles.optionSub, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                  {dayjs(nextWeek).format('ddd, MMM D, 8:00 AM')}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Delete reminder if active */}
          {currentReminder && (
            <TouchableOpacity
              style={[styles.optionRow, styles.deleteRow]}
              onPress={() => handleOption(null)}
            >
              <View style={styles.optionLeft}>
                <Ionicons name="trash-outline" size={22} color="#EF4444" />
                <Text style={[styles.optionTitle, { color: '#EF4444' }]}>
                  Delete Reminder
                </Text>
              </View>
            </TouchableOpacity>
          )}
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
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  optionSub: {
    fontSize: 12,
    marginTop: 2,
  },
  deleteRow: {
    marginTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
  },
});
