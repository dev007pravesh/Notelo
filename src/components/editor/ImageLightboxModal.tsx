import React from 'react';
import {
  View,
  Text,
  Modal,
  Image,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SvgUri } from 'react-native-svg';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';

interface ImageLightboxModalProps {
  visible: boolean;
  imageUri: string | null;
  onClose: () => void;
  onDelete?: () => void;
  onEditDrawing?: () => void;
}

const { width, height } = Dimensions.get('window');

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  visible,
  imageUri,
  onClose,
  onDelete,
  onEditDrawing,
}) => {
  if (!imageUri) return null;

  const isDrawing = imageUri.endsWith('.svg');

  const handleShare = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(imageUri);
      }
    } catch (e) {
      console.error('Error sharing image:', e);
    }
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      isDrawing ? 'Delete Drawing' : 'Delete Photo',
      'Are you sure you want to remove this attachment from your note?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onDelete?.();
            onClose();
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#121212" />
        <SafeAreaView style={styles.safeArea}>
          {/* Top Bar with Close, Title Badge, and Actions */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.titleBadge}>
              <MaterialCommunityIcons
                name={isDrawing ? 'draw' : 'image'}
                size={16}
                color="#F59E0B"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.titleText}>{isDrawing ? 'Drawing' : 'Photo'}</Text>
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={handleShare}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="share-outline" size={22} color="#FFFFFF" />
              </TouchableOpacity>

              {isDrawing && onEditDrawing && (
                <TouchableOpacity
                  style={[styles.iconBtn, styles.editIconBtn]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onEditDrawing();
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="pencil" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              )}

              {onDelete && (
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={handleDelete}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Full Screen Image or Drawing */}
          <View style={styles.imageWrapper}>
            {isDrawing ? (
              <View style={styles.drawingFrame}>
                <SvgUri uri={imageUri} width="100%" height="100%" />
              </View>
            ) : (
              <Image
                source={{ uri: imageUri }}
                style={styles.image}
                resizeMode="contain"
              />
            )}
          </View>

          {/* Floating Bottom Edit Button for Drawings */}
          {isDrawing && onEditDrawing && (
            <View style={styles.bottomBar}>
              <TouchableOpacity
                style={styles.floatingEditBtn}
                activeOpacity={0.85}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  onEditDrawing();
                }}
              >
                <Ionicons name="brush-outline" size={20} color="#FFFFFF" />
                <Text style={styles.floatingEditText}>Edit Drawing</Text>
              </TouchableOpacity>
            </View>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editIconBtn: {
    backgroundColor: '#F59E0B',
  },
  titleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  titleText: {
    color: '#E8EAED',
    fontSize: 14,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  imageWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  drawingFrame: {
    width: width - 32,
    height: height * 0.65,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1F1F1F',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  image: {
    width: width,
    height: height * 0.75,
  },
  bottomBar: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    gap: 8,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  floatingEditText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
