import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface AudioPlayerWidgetProps {
  uri: string;
  isDark: boolean;
  onDelete?: () => void;
}

export const AudioPlayerWidget: React.FC<AudioPlayerWidgetProps> = ({ uri, isDark, onDelete }) => {
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);

  const isPlaying = status.playing;
  const currentTime = status.currentTime ?? 0;
  const duration = status.duration ?? 0;

  const togglePlayPause = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      if (isPlaying) {
        player.pause();
      } else {
        // If playback finished, seek to beginning
        if (currentTime >= duration && duration > 0) {
          player.seekTo(0);
        }
        player.play();
      }
    } catch (e) {
      console.error('Error toggling play/pause:', e);
    }
  };

  const formatTime = (sec: number) => {
    const totalSeconds = Math.floor(sec);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)',
          borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
        },
      ]}
    >
      <TouchableOpacity
        style={[styles.playBtn, { backgroundColor: '#6366F1' }]}
        onPress={togglePlayPause}
        activeOpacity={0.7}
      >
        <Ionicons name={isPlaying ? 'pause' : 'play'} size={18} color="#FFFFFF" />
      </TouchableOpacity>

      <View style={styles.timeInfo}>
        <Ionicons name="mic" size={16} color="#6366F1" />
        <Text style={[styles.timeText, { color: isDark ? '#E2E8F0' : '#1E293B' }]}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </Text>
      </View>

      {onDelete && (
        <TouchableOpacity
          onPress={onDelete}
          style={styles.deleteBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 6,
    gap: 12,
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  deleteBtn: {
    padding: 4,
  },
});
