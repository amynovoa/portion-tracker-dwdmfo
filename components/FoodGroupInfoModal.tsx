
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
      statusBarTranslucent={true}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <TouchableOpacity 
          activeOpacity={1} 
          onPress={(e) => e.stopPropagation()}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <View style={styles.titleRow}>
                <Text style={styles.icon}>{icon}</Text>
                <Text style={styles.title}>{title}</Text>
              </View>
              <TouchableOpacity 
                onPress={onClose} 
                style={styles.closeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Benefits</Text>
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>What to Avoid</Text>
                <Text style={styles.avoidText}>{avoid}</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Examples</Text>
                <Text style={styles.examplesText}>{examples}</Text>
              </View>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  modalContent: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 10,
      },
      default: {
        boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.3)',
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
  scrollView: {
    maxHeight: 500,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 30,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  avoidText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  examplesText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
});
