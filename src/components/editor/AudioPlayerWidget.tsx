import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface AudioPlayerWidgetProps {
  uri: string;
  isDark: boolean;
  onDelete?: () => void;
}

export const AudioPlayerWidget: React.FC<AudioPlayerWidgetProps> = ({ uri, isDark, onDelete }) => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMillis, setPositionMillis] = useState(0);
  const [durationMillis, setDurationMillis] = useState(0);

  useEffect(() => {
    let soundObj: Audio.Sound | null = null;

    async function loadAudio() {
      try {
        const { sound: s, status } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: false },
          onPlaybackStatusUpdate
        );
        soundObj = s;
        setSound(s);
        if (status.isLoaded && status.durationMillis) {
          setDurationMillis(status.durationMillis);
        }
      } catch (e) {
        console.error('Error loading audio:', e);
      }
    }

    loadAudio();

    return () => {
      if (soundObj) {
        soundObj.unloadAsync();
      }
    };
  }, [uri]);

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setPositionMillis(status.positionMillis || 0);
      setDurationMillis(status.durationMillis || 0);
      setIsPlaying(status.isPlaying || false);
      if (status.didJustFinish) {
        setIsPlaying(false);
        setPositionMillis(0);
      }
    }
  };

  const togglePlayPause = async () => {
    if (!sound) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        if (positionMillis >= durationMillis && durationMillis > 0) {
          await sound.replayAsync();
        } else {
          await sound.playAsync();
        }
      }
    } catch (e) {
      console.error('Error toggling play/pause:', e);
    }
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
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
          {formatTime(positionMillis)} / {formatTime(durationMillis || 0)}
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
