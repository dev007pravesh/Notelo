import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNotesStore } from '../../store/useNotesStore';
import { LabelsRepository } from '../../db/repositories/labelsRepository';

interface LabelPickerModalProps {
  visible: boolean;
  isDark: boolean;
  selectedLabelIds: string[];
  onChangeLabels: (labelIds: string[]) => void;
  onClose: () => void;
}

export const LabelPickerModal: React.FC<LabelPickerModalProps> = ({
  visible,
  isDark,
  selectedLabelIds,
  onChangeLabels,
  onClose,
}) => {
  const { labels, fetchFoldersAndLabels } = useNotesStore();
  const [newLabelName, setNewLabelName] = useState('');

  const handleToggleLabel = (id: string) => {
    Haptics.selectionAsync();
    if (selectedLabelIds.includes(id)) {
      onChangeLabels(selectedLabelIds.filter((l) => l !== id));
    } else {
      onChangeLabels([...selectedLabelIds, id]);
    }
  };

  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const created = await LabelsRepository.createLabel({
        id: `label_${Date.now()}`,
        name: newLabelName.trim(),
      });
      setNewLabelName('');
      await fetchFoldersAndLabels();
      onChangeLabels([...selectedLabelIds, created.id]);
    } catch (e) {
      console.error('Error creating label:', e);
    }
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
              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
              borderTopColor: isDark ? '#334155' : '#E2E8F0',
            },
          ]}
        >
          <Text style={[styles.title, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>
            Labels
          </Text>

          {/* New Label Input */}
          <View style={styles.inputRow}>
            <TextInput
              value={newLabelName}
              onChangeText={setNewLabelName}
              placeholder="Enter label name"
              placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
              style={[
                styles.textInput,
                {
                  color: isDark ? '#F8FAFC' : '#0F172A',
                  borderColor: isDark ? '#475569' : '#CBD5E1',
                },
              ]}
              onSubmitEditing={handleCreateLabel}
            />
            <TouchableOpacity style={styles.addBtn} onPress={handleCreateLabel}>
              <Ionicons name="add" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Labels List */}
          <ScrollView style={styles.scrollList} showsVerticalScrollIndicator={false}>
            {labels.length === 0 ? (
              <Text style={[styles.emptyText, { color: isDark ? '#64748B' : '#94A3B8' }]}>
                No labels created yet
              </Text>
            ) : (
              labels.map((label) => {
                const isSelected = selectedLabelIds.includes(label.id);
                return (
                  <TouchableOpacity
                    key={label.id}
                    style={styles.labelRow}
                    onPress={() => handleToggleLabel(label.id)}
                  >
                    <Ionicons
                      name="pricetag-outline"
                      size={18}
                      color={isDark ? '#94A3B8' : '#64748B'}
                    />
                    <Text
                      numberOfLines={1}
                      style={[styles.labelText, { color: isDark ? '#F8FAFC' : '#1E293B' }]}
                    >
                      {label.name}
                    </Text>
                    <Ionicons
                      name={isSelected ? 'checkbox' : 'square-outline'}
                      size={22}
                      color={isSelected ? '#6366F1' : isDark ? '#64748B' : '#94A3B8'}
                    />
                  </TouchableOpacity>
                );
              })
            )}
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
    maxHeight: '60%',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  textInput: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollList: {
    maxHeight: 220,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 20,
    fontSize: 14,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    gap: 12,
  },
  labelText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
});
