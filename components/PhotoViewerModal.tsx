import React from 'react';
import {
  Modal,
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Text,
  ImageSourcePropType,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PhotoViewerModalProps {
  visible: boolean;
  uri: string | null;
  onClose: () => void;
  onDelete: () => void;
}

function resolveImageSource(source: string | null | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  return { uri: source };
}

export default function PhotoViewerModal({ visible, uri, onClose, onDelete }: PhotoViewerModalProps) {
  const imageSource = resolveImageSource(uri);

  const handleDelete = () => {
    console.log('PhotoViewerModal: delete button pressed');
    onDelete();
    onClose();
  };

  const handleClose = () => {
    console.log('PhotoViewerModal: close button pressed');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          {/* Close button */}
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>

          {/* Full-screen photo */}
          <View style={styles.imageContainer}>
            {uri ? (
              <Image
                source={imageSource}
                style={styles.image}
                resizeMode="contain"
              />
            ) : null}
          </View>

          {/* Delete button */}
          <View style={styles.bottomBar}>
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={22} color="#fff" />
              <Text style={styles.deleteText}>Delete Photo</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  safeArea: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  bottomBar: {
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E53935',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  deleteText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
