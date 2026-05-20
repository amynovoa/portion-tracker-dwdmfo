
import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { useTranslation } from 'react-i18next';

interface FoodGroupInfoModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  icon: string;
  benefit: string;
  avoid: string;
  examples: string;
  portionSize?: string;
}

export default function FoodGroupInfoModal({
  visible,
  onClose,
  title,
  icon,
  benefit,
  avoid,
  examples,
  portionSize,
}: FoodGroupInfoModalProps) {
  const { t } = useTranslation();
  console.log('FoodGroupInfoModal rendering, visible:', visible);
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent={false}
    >
      <View style={styles.container}>
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
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.scrollContent}
            bounces={true}
          >
            {portionSize && (
              <View style={styles.portionSizeHighlight}>
                <Text style={styles.portionSizeTitle}>{t('foodGroupModal.whatIs1Portion')}</Text>
                <Text style={styles.portionSizeText}>{portionSize}</Text>
                <Text style={styles.helperText}>
                  {t('foodGroupModal.portionsGuide')}
                </Text>
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('foodGroupModal.benefits')}</Text>
              <Text style={styles.benefitText}>{benefit}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('foodGroupModal.goodChoices')}</Text>
              <Text style={styles.examplesText}>{examples}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('foodGroupModal.whatToAvoid')}</Text>
              <Text style={styles.avoidText}>{avoid}</Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity 
              onPress={onClose} 
              style={styles.doneButton}
            >
              <Text style={styles.doneButtonText}>{t('foodGroupModal.gotIt')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalContent: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
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
    flexShrink: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    flexShrink: 0,
  },
  closeButtonText: {
    fontSize: 20,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 30,
  },
  portionSizeHighlight: {
    backgroundColor: colors.primary + '15',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  portionSizeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 12,
  },
  portionSizeText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    marginBottom: 12,
  },
  helperText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 18,
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
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  doneButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
