import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ChecklistItem } from '../../db/schema';

interface ChecklistEditorProps {
  items: ChecklistItem[];
  onChange: (items: ChecklistItem[]) => void;
  isDark: boolean;
}

export const ChecklistEditor: React.FC<ChecklistEditorProps> = ({ items, onChange, isDark }) => {
  const [showCompleted, setShowCompleted] = useState(true);

  const activeItems = items.filter((i) => !i.isCompleted);
  const completedItems = items.filter((i) => i.isCompleted);

  const handleToggle = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = items.map((i) => (i.id === id ? { ...i, isCompleted: !i.isCompleted } : i));
    onChange(updated);
  };

  const handleTextChange = (id: string, text: string) => {
    const updated = items.map((i) => (i.id === id ? { ...i, text } : i));
    onChange(updated);
  };

  const handleDelete = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = items.filter((i) => i.id !== id);
    onChange(updated);
  };

  const handleAddItem = () => {
    Haptics.selectionAsync();
    const newItem: ChecklistItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      noteId: '',
      text: '',
      isCompleted: false,
      orderIndex: items.length,
      createdAt: new Date(),
    };
    onChange([...items, newItem]);
  };

  return (
    <View style={styles.container}>
      {/* Active Items */}
      {activeItems.map((item, index) => (
        <View key={item.id} style={styles.itemRow}>
          <TouchableOpacity
            style={styles.checkboxTouch}
            onPress={() => handleToggle(item.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name="square-outline"
              size={22}
              color={isDark ? '#94A3B8' : '#64748B'}
            />
          </TouchableOpacity>

          <TextInput
            value={item.text}
            onChangeText={(txt) => handleTextChange(item.id, txt)}
            placeholder="List item"
            placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
            style={[
              styles.input,
              { color: isDark ? '#F8FAFC' : '#0F172A' },
            ]}
            multiline={false}
            returnKeyType="next"
            onSubmitEditing={handleAddItem}
          />

          <TouchableOpacity
            onPress={() => handleDelete(item.id)}
            style={styles.deleteTouch}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={18} color={isDark ? '#64748B' : '#94A3B8'} />
          </TouchableOpacity>
        </View>
      ))}

      {/* Add New Item Row */}
      <TouchableOpacity style={styles.addItemRow} onPress={handleAddItem} activeOpacity={0.6}>
        <Ionicons name="add" size={22} color="#6366F1" />
        <Text style={[styles.addItemText, { color: '#6366F1' }]}>List item</Text>
      </TouchableOpacity>

      {/* Completed Items Collapsible Section */}
      {completedItems.length > 0 && (
        <View style={styles.completedSection}>
          <TouchableOpacity
            style={styles.completedHeader}
            onPress={() => setShowCompleted(!showCompleted)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={showCompleted ? 'chevron-down' : 'chevron-forward'}
              size={18}
              color={isDark ? '#94A3B8' : '#64748B'}
            />
            <Text style={[styles.completedHeaderText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              {completedItems.length} checked {completedItems.length === 1 ? 'item' : 'items'}
            </Text>
          </TouchableOpacity>

          {showCompleted &&
            completedItems.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <TouchableOpacity
                  style={styles.checkboxTouch}
                  onPress={() => handleToggle(item.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="checkbox" size={22} color="#6366F1" />
                </TouchableOpacity>

                <TextInput
                  value={item.text}
                  onChangeText={(txt) => handleTextChange(item.id, txt)}
                  style={[
                    styles.input,
                    styles.completedInput,
                    { color: isDark ? '#64748B' : '#94A3B8' },
                  ]}
                  multiline={false}
                />

                <TouchableOpacity
                  onPress={() => handleDelete(item.id)}
                  style={styles.deleteTouch}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close" size={18} color={isDark ? '#64748B' : '#94A3B8'} />
                </TouchableOpacity>
              </View>
            ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  checkboxTouch: {
    paddingRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
    fontWeight: '400',
  },
  completedInput: {
    textDecorationLine: 'line-through',
  },
  deleteTouch: {
    paddingLeft: 8,
  },
  addItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 4,
    marginTop: 4,
  },
  addItemText: {
    fontSize: 15,
    fontWeight: '500',
  },
  completedSection: {
    marginTop: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
    paddingTop: 12,
  },
  completedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  completedHeaderText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
