
import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { colors } from '@/styles/commonStyles';

interface FoodGroupInfoModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  icon: string;
  benefit: string;
  avoid: string;
  examples: string;
}

export default function FoodGroupInfoModal({
  visible,
  onClose,
  title,
  icon,
  benefit,
  avoid,
  examples,
}: FoodGroupInfoModalProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.overlayTouchable} 
          activeOpacity={1} 
          onPress={onClose}
        >
          <View style={styles.modalWrapper}>
            <TouchableOpacity 
              activeOpacity={1} 
              onPress={(e) => {
                e.stopPropagation();
              }}
            >
              <View style={styles.modalContainer}>
                <View style={styles.header}>
                  <View style={styles.titleRow}>
                    <Text style={styles.icon}>{icon}</Text>
                    <Text style={styles.title}>{title}</Text>
                  </View>
                  <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView 
                  style={styles.content}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.scrollContent}
                >
                  <Text style={styles.benefitText}>{benefit}</Text>

                  <View style={styles.section}>
                    <Text style={styles.avoidText}>{avoid}</Text>
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.examplesText}>{examples}</Text>
                  </View>
                </ScrollView>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayTouchable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalWrapper: {
    width: '100%',
    maxWidth: 500,
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    width: '100%',
    maxHeight: 600,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 28,
    marginRight: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  closeButtonText: {
    fontSize: 20,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  benefitText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  avoidText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    marginBottom: 12,
  },
  examplesText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
});
