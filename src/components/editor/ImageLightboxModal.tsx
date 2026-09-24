import React from 'react';
import {
  View,
  Modal,
  Image,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SvgUri } from 'react-native-svg';

interface ImageLightboxModalProps {
  visible: boolean;
  imageUri: string | null;
  onClose: () => void;
  onDelete?: () => void;
}

const { width, height } = Dimensions.get('window');

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  visible,
  imageUri,
  onClose,
  onDelete,
}) => {
  if (!imageUri) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <SafeAreaView style={styles.safeArea}>
          {/* Top Bar with Close and Delete */}
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.iconBtn} onPress={onClose}>
              <Ionicons name="close" size={26} color="#FFFFFF" />
            </TouchableOpacity>

            {onDelete && (
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => {
                  onDelete();
                  onClose();
                }}
              >
                <Ionicons name="trash-outline" size={22} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>

          {/* Full Screen Image or Drawing */}
          <View style={styles.imageWrapper}>
            {imageUri.endsWith('.svg') ? (
              <SvgUri uri={imageUri} width="100%" height="80%" />
            ) : (
              <Image
                source={{ uri: imageUri }}
                style={styles.image}
                resizeMode="contain"
              />
            )}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    zIndex: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: width,
    height: height * 0.8,
  },
});
