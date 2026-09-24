import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import {
  useAudioRecorder,
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorderState,
} from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface AudioRecorderModalProps {
  visible: boolean;
  isDark: boolean;
  onClose: () => void;
  onRecordingComplete: (localUri: string) => void;
}

export const AudioRecorderModal: React.FC<AudioRecorderModalProps> = ({
  visible,
  isDark,
  onClose,
  onRecordingComplete,
}) => {
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const [seconds, setSeconds] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (visible) {
      startRecording();
    } else {
      if (isRecording) {
        stopRecording(false);
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [visible]);

  const startRecording = async () => {
    try {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        onClose();
        return;
      }

      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });

      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();

      setIsRecording(true);
      setSeconds(0);

      timerRef.current = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } catch (e) {
      console.error('Failed to start recording:', e);
      onClose();
    }
  };

  const stopRecording = async (save: boolean = true) => {
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      setIsRecording(false);
      await audioRecorder.stop();
      const tempUri = audioRecorder.uri;

      if (save && tempUri) {
        // Move to permanent attachments directory
        const attachmentsDir = `${FileSystem.documentDirectory}attachments/`;
        const dirInfo = await FileSystem.getInfoAsync(attachmentsDir);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(attachmentsDir, { intermediates: true });
        }

        const fileName = `voice_${Date.now()}.m4a`;
        const permanentUri = `${attachmentsDir}${fileName}`;
        await FileSystem.copyAsync({ from: tempUri, to: permanentUri });

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onRecordingComplete(permanentUri);
      }
    } catch (e) {
      console.error('Failed to stop recording:', e);
    } finally {
      onClose();
    }
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => stopRecording(false)}
    >
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={() => stopRecording(false)}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <View
          style={[
            styles.container,
            {
              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
              borderColor: isDark ? '#334155' : '#E2E8F0',
            },
          ]}
        >
          <Text style={[styles.title, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>
            Recording Voice Memo
          </Text>

          {/* Pulse Icon */}
          <View style={styles.pulseContainer}>
            <View style={styles.micCircle}>
              <Ionicons name="mic" size={40} color="#FFFFFF" />
            </View>
          </View>

          <Text style={[styles.timerText, { color: isDark ? '#CBD5E1' : '#334155' }]}>
            {formatTimer(seconds)}
          </Text>

          {/* Controls */}
          <View style={styles.controlRow}>
            <TouchableOpacity
              style={[styles.cancelBtn, { borderColor: isDark ? '#475569' : '#CBD5E1' }]}
              onPress={() => stopRecording(false)}
            >
              <Text style={{ color: isDark ? '#94A3B8' : '#64748B', fontWeight: '600' }}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => stopRecording(true)}
            >
              <Ionicons name="checkmark" size={20} color="#FFFFFF" />
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 20,
  },
  pulseContainer: {
    marginVertical: 12,
  },
  micCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  timerText: {
    fontSize: 28,
    fontWeight: '700',
    marginVertical: 12,
    letterSpacing: 1,
  },
  controlRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6366F1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
});
