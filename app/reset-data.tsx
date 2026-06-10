
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '@/styles/commonStyles';
import { useTranslation } from 'react-i18next';

export default function ResetDataScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [isResetting, setIsResetting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const performReset = async () => {
    console.log('=== performReset CALLED ===');
    setIsResetting(true);
    setShowConfirmModal(false);
    
    try {
      console.log('Step 1: Clearing AsyncStorage...');
      await AsyncStorage.clear();
      console.log('Step 2: AsyncStorage cleared successfully');
      
      console.log('Step 3: Navigating to welcome screen...');
      
      // Use setTimeout to ensure state updates before navigation
      setTimeout(() => {
        router.replace('/welcome');
        console.log('Step 4: Navigation initiated');
      }, 100);
      
    } catch (error) {
      console.error('=== ERROR DURING RESET ===');
      console.error('Error:', error);
      setIsResetting(false);
      
      if (Platform.OS === 'web') {
        setShowConfirmModal(false);
        alert(t('resetData.errorMessage'));
      } else {
        Alert.alert(
          t('resetData.errorTitle'),
          t('resetData.errorMessage'),
          [{ text: t('common.ok') }]
        );
      }
    }
  };

  const handleReset = () => {
    console.log('=== RESET BUTTON PRESSED ===');
    console.log('Platform:', Platform.OS);
    console.log('isResetting:', isResetting);
    
    if (isResetting) {
      console.log('Already resetting, ignoring press');
      return;
    }
    
    // Show in-app confirmation modal for all platforms
    setShowConfirmModal(true);
  };

  const handleConfirmReset = () => {
    console.log('=== RESET CONFIRMED - STARTING RESET ===');
    performReset();
  };

  const handleCancelReset = () => {
    console.log('=== RESET CANCELLED FROM MODAL ===');
    setShowConfirmModal(false);
  };

  const handleCancel = () => {
    console.log('=== CANCEL BUTTON PRESSED ===');
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Stack.Screen
        options={{
          title: t('resetData.title'),
          headerShown: true,
          headerBackTitle: t('resetData.back'),
        }}
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{t('resetData.headerTitle')}</Text>
        </View>

        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>{t('resetData.warningTitle')}</Text>
          <Text style={styles.warningText}>
            {t('resetData.warningText')}
          </Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>{t('resetData.whatDeletedTitle')}</Text>
          <Text style={styles.bulletPoint}>{t('resetData.bullet1')}</Text>
          <Text style={styles.bulletPoint}>{t('resetData.bullet2')}</Text>
          <Text style={styles.bulletPoint}>{t('resetData.bullet3')}</Text>
          <Text style={styles.bulletPoint}>{t('resetData.bullet4')}</Text>
          <Text style={styles.bulletPoint}>{t('resetData.bullet5')}</Text>
          <Text style={styles.bulletPoint}>{t('resetData.bullet6')}</Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>{t('resetData.whatNextTitle')}</Text>
          <Text style={styles.infoText}>
            {t('resetData.whatNextText')}
          </Text>
        </View>

        {/* Add some bottom padding to ensure content is scrollable above buttons */}
        <View style={{ height: 200 }} />
      </ScrollView>

      <View style={styles.buttonContainer} pointerEvents="box-none">
        <TouchableOpacity
          style={[styles.resetButton, isResetting && styles.disabledButton]}
          onPress={handleReset}
          disabled={isResetting}
          activeOpacity={0.7}
        >
          <Text style={styles.resetButtonText}>
            {isResetting ? t('resetData.resettingButton') : t('resetData.resetButton')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.cancelButton, isResetting && styles.disabledButton]}
          onPress={handleCancel}
          disabled={isResetting}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelButtonText}>{t('resetData.cancelButton')}</Text>
        </TouchableOpacity>
      </View>

      {/* In-App Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelReset}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('resetData.modalTitle')}</Text>
            <Text style={styles.modalMessage}>
              {t('resetData.modalMessage')}
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={handleCancelReset}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelButtonText}>{t('resetData.cancelButton')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleConfirmReset}
                activeOpacity={0.7}
              >
                <Text style={styles.modalConfirmButtonText}>{t('resetData.modalConfirm')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 20,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
  },
  warningBox: {
    backgroundColor: '#FFF3CD',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
  },
  warningTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 10,
  },
  warningText: {
    fontSize: 16,
    color: '#856404',
    lineHeight: 24,
    marginBottom: 8,
  },
  infoSection: {
    marginBottom: 30,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
  },
  infoText: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: 8,
  },
  bulletPoint: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
    marginLeft: 10,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 30,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
    zIndex: 1000,
    elevation: 10,
  },
  resetButton: {
    backgroundColor: '#DC3545',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: colors.surface,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  cancelButtonText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'column',
    gap: 12,
  },
  modalCancelButton: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  modalConfirmButton: {
    backgroundColor: '#DC3545',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalConfirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
