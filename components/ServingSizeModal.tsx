
import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { colors } from '../styles/commonStyles';
import { ServingSize } from '../types';

interface ServingSizeModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectSize: (size: ServingSize) => void;
  foodGroupLabel: string;
}

export default function ServingSizeModal({
  visible,
  onClose,
  onSelectSize,
  foodGroupLabel,
}: ServingSizeModalProps) {
  const handleSelectSize = (size: ServingSize) => {
    onSelectSize(size);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Serving Size</Text>
            <Text style={styles.subtitle}>{foodGroupLabel}</Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.sizeButton, styles.smallButton]}
              onPress={() => handleSelectSize('S')}
              activeOpacity={0.7}
            >
              <Text style={styles.sizeLabel}>S</Text>
              <Text style={styles.sizeName}>Small</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sizeButton, styles.mediumButton]}
              onPress={() => handleSelectSize('M')}
              activeOpacity={0.7}
            >
              <Text style={styles.sizeLabel}>M</Text>
              <Text style={styles.sizeName}>Medium</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sizeButton, styles.largeButton]}
              onPress={() => handleSelectSize('L')}
              activeOpacity={0.7}
            >
              <Text style={styles.sizeLabel}>L</Text>
              <Text style={styles.sizeName}>Large</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
    elevation: 5,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  sizeButton: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  smallButton: {
    backgroundColor: colors.highlight,
    borderColor: colors.primary,
  },
  mediumButton: {
    backgroundColor: colors.highlight,
    borderColor: colors.primary,
  },
  largeButton: {
    backgroundColor: colors.highlight,
    borderColor: colors.primary,
  },
  sizeLabel: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  sizeName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
