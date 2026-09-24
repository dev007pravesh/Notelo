import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  PanResponder,
  Dimensions,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';

interface DrawingCanvasModalProps {
  visible: boolean;
  isDark: boolean;
  onClose: () => void;
  onSaveDrawing: (svgString: string) => void;
}

const { width, height } = Dimensions.get('window');

export const DrawingCanvasModal: React.FC<DrawingCanvasModalProps> = ({
  visible,
  isDark,
  onClose,
  onSaveDrawing,
}) => {
  const [paths, setPaths] = useState<Array<{ d: string; color: string; strokeWidth: number }>>([]);
  const [currentPath, setCurrentPath] = useState('');
  const [currentColor, setCurrentColor] = useState('#6366F1');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [isEraser, setIsEraser] = useState(false);

  const colors = ['#6366F1', '#EF4444', '#10B981', '#F59E0B', '#3B82F6', '#0F172A'];

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        setCurrentPath(`M${locationX},${locationY}`);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        setCurrentPath((prev) => `${prev} L${locationX},${locationY}`);
      },
      onPanResponderRelease: () => {
        if (currentPath) {
          setPaths((prev) => [
            ...prev,
            {
              d: currentPath,
              color: isEraser ? (isDark ? '#0F172A' : '#FFFFFF') : currentColor,
              strokeWidth: isEraser ? 16 : strokeWidth,
            },
          ]);
          setCurrentPath('');
        }
      },
    })
  ).current;

  const handleUndo = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPaths((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPaths([]);
    setCurrentPath('');
  };

  const handleSave = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const serializedSvg = JSON.stringify(paths);
    onSaveDrawing(serializedSvg);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: isDark ? '#0F172A' : '#FFFFFF' }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <SafeAreaView style={styles.safeArea}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.iconBtn} onPress={onClose}>
              <Ionicons name="close" size={24} color={isDark ? '#F8FAFC' : '#0F172A'} />
            </TouchableOpacity>

            <Text style={[styles.headerTitle, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>
              Drawing
            </Text>

            <View style={styles.topRightActions}>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={handleUndo}
                disabled={paths.length === 0}
              >
                <Ionicons
                  name="arrow-undo"
                  size={20}
                  color={paths.length > 0 ? (isDark ? '#F8FAFC' : '#0F172A') : '#64748B'}
                />
              </TouchableOpacity>

              <TouchableOpacity style={styles.iconBtn} onPress={handleClear}>
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Canvas Area */}
          <View style={styles.canvasContainer} {...panResponder.panHandlers}>
            <Svg style={StyleSheet.absoluteFill}>
              {paths.map((p, index) => (
                <Path
                  key={index}
                  d={p.d}
                  stroke={p.color}
                  strokeWidth={p.strokeWidth}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
              {currentPath ? (
                <Path
                  d={currentPath}
                  stroke={isEraser ? (isDark ? '#0F172A' : '#FFFFFF') : currentColor}
                  strokeWidth={isEraser ? 16 : strokeWidth}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : null}
            </Svg>
          </View>

          {/* Bottom Toolbar: Color Palette & Eraser */}
          <View
            style={[
              styles.bottomToolbar,
              {
                backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                borderTopColor: isDark ? '#334155' : '#E2E8F0',
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.toolBtn,
                !isEraser && [styles.toolBtnActive, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }],
              ]}
              onPress={() => setIsEraser(false)}
            >
              <MaterialCommunityIcons
                name="brush"
                size={22}
                color={!isEraser ? '#6366F1' : isDark ? '#94A3B8' : '#64748B'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toolBtn,
                isEraser && [styles.toolBtnActive, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }],
              ]}
              onPress={() => setIsEraser(true)}
            >
              <MaterialCommunityIcons
                name="eraser"
                size={22}
                color={isEraser ? '#6366F1' : isDark ? '#94A3B8' : '#64748B'}
              />
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Colors */}
            <View style={styles.colorsRow}>
              {colors.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.colorDot,
                    { backgroundColor: c },
                    currentColor === c && !isEraser && styles.colorDotActive,
                  ]}
                  onPress={() => {
                    setIsEraser(false);
                    setCurrentColor(c);
                  }}
                />
              ))}
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#6366F1',
    marginLeft: 6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  canvasContainer: {
    flex: 1,
    position: 'relative',
  },
  bottomToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  toolBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolBtnActive: {
    borderWidth: 1.5,
    borderColor: '#6366F1',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(150, 150, 150, 0.3)',
  },
  colorsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  colorDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  colorDotActive: {
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.2 }],
  },
});
