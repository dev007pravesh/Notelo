import React, { useState, useRef, useEffect } from 'react';
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

export interface DrawingPath {
  d: string;
  color: string;
  strokeWidth: number;
}

interface DrawingCanvasModalProps {
  visible: boolean;
  isDark: boolean;
  initialPaths?: DrawingPath[];
  onClose: () => void;
  onSaveDrawing: (svgString: string) => void;
}

const { width, height } = Dimensions.get('window');

export const DrawingCanvasModal: React.FC<DrawingCanvasModalProps> = ({
  visible,
  isDark,
  initialPaths,
  onClose,
  onSaveDrawing,
}) => {
  const [paths, setPaths] = useState<DrawingPath[]>(initialPaths || []);
  const [currentPath, setCurrentPath] = useState('');
  const [currentColor, setCurrentColor] = useState('#F59E0B');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [isEraser, setIsEraser] = useState(false);

  useEffect(() => {
    if (visible) {
      setPaths(initialPaths || []);
      setCurrentPath('');
      currentPathRef.current = '';
    }
  }, [visible, initialPaths]);

  // Synchronized refs to avoid PanResponder stale closure
  const currentPathRef = useRef<string>('');
  const isEraserRef = useRef<boolean>(isEraser);
  const currentColorRef = useRef<string>(currentColor);
  const strokeWidthRef = useRef<number>(strokeWidth);
  const isDarkRef = useRef<boolean>(isDark);

  isEraserRef.current = isEraser;
  currentColorRef.current = currentColor;
  strokeWidthRef.current = strokeWidth;
  isDarkRef.current = isDark;

  const colors = [
    isDark ? '#FFFFFF' : '#202124',
    '#F59E0B', // Keep Amber
    '#EF4444', // Red
    '#10B981', // Emerald
    '#3B82F6', // Blue
    '#8B5CF6', // Purple
    '#EC4899', // Pink
  ];

  const commitCurrentStroke = () => {
    const finalD = currentPathRef.current;
    if (finalD && finalD.length > 0) {
      const eraserColor = isDarkRef.current ? '#1F1F1F' : '#FFFFFF';
      const newPath = {
        d: finalD,
        color: isEraserRef.current ? eraserColor : currentColorRef.current,
        strokeWidth: isEraserRef.current ? 24 : strokeWidthRef.current,
      };
      setPaths((prev) => [...prev, newPath]);
      currentPathRef.current = '';
      setCurrentPath('');
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const x = Math.round(locationX);
        const y = Math.round(locationY);
        const startD = `M${x},${y} L${x},${y}`;
        currentPathRef.current = startD;
        setCurrentPath(startD);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const x = Math.round(locationX);
        const y = Math.round(locationY);
        const nextD = `${currentPathRef.current} L${x},${y}`;
        currentPathRef.current = nextD;
        setCurrentPath(nextD);
      },
      onPanResponderRelease: () => {
        commitCurrentStroke();
      },
      onPanResponderTerminate: () => {
        commitCurrentStroke();
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
    currentPathRef.current = '';
    setCurrentPath('');
  };

  const handleSave = () => {
    if (paths.length === 0 && !currentPathRef.current) {
      onClose();
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const allPaths = [...paths];
    if (currentPathRef.current) {
      const eraserColor = isDark ? '#1F1F1F' : '#FFFFFF';
      allPaths.push({
        d: currentPathRef.current,
        color: isEraser ? eraserColor : currentColor,
        strokeWidth: isEraser ? 24 : strokeWidth,
      });
    }

    const canvasWidth = Math.round(width);
    const canvasHeight = Math.round(height * 0.75);
    const bgColor = isDark ? '#1F1F1F' : '#FFFFFF';

    const svgXml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvasWidth} ${canvasHeight}" width="${canvasWidth}" height="${canvasHeight}">
  <!-- NOTELO_DRAWING_DATA: ${JSON.stringify(allPaths)} -->
  <rect width="100%" height="100%" fill="${bgColor}"/>
  ${allPaths
    .map(
      (p) =>
        `<path d="${p.d}" stroke="${p.color}" stroke-width="${p.strokeWidth}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
    )
    .join('\n  ')}
</svg>`;

    onSaveDrawing(svgXml);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: isDark ? '#202124' : '#FFFFFF' }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <SafeAreaView style={styles.safeArea}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.iconBtn} onPress={onClose}>
              <Ionicons name="close" size={24} color={isDark ? '#E8EAED' : '#202124'} />
            </TouchableOpacity>

            <Text style={[styles.headerTitle, { color: isDark ? '#E8EAED' : '#202124' }]}>
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
                  color={paths.length > 0 ? (isDark ? '#E8EAED' : '#202124') : '#5F6368'}
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
          <View
            style={[
              styles.canvasContainer,
              { backgroundColor: isDark ? '#1F1F1F' : '#FFFFFF' },
            ]}
            {...panResponder.panHandlers}
          >
            <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
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
                  stroke={isEraser ? (isDark ? '#1F1F1F' : '#FFFFFF') : currentColor}
                  strokeWidth={isEraser ? 24 : strokeWidth}
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
                backgroundColor: isDark ? '#28292C' : '#F1F3F4',
                borderTopColor: isDark ? '#3C4043' : '#E0E0E0',
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.toolBtn,
                !isEraser && [styles.toolBtnActive, { backgroundColor: isDark ? '#3C4043' : '#E8EAED' }],
              ]}
              onPress={() => setIsEraser(false)}
            >
              <MaterialCommunityIcons
                name="brush"
                size={22}
                color={!isEraser ? '#F59E0B' : isDark ? '#9AA0A6' : '#5F6368'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toolBtn,
                isEraser && [styles.toolBtnActive, { backgroundColor: isDark ? '#3C4043' : '#E8EAED' }],
              ]}
              onPress={() => setIsEraser(true)}
            >
              <MaterialCommunityIcons
                name="eraser"
                size={22}
                color={isEraser ? '#F59E0B' : isDark ? '#9AA0A6' : '#5F6368'}
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
    backgroundColor: '#F59E0B',
    marginLeft: 6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
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
    borderColor: '#F59E0B',
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
