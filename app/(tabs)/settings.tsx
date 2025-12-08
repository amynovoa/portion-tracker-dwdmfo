
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, Text, TouchableOpacity, Alert, Modal } from 'react-native';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { useRouter } from 'expo-router';
import AppLogo from '@/components/AppLogo';
import { clearAllData } from '@/utils/storage';

export default function SettingsScreen() {
  const router = useRouter();
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleResetApp = () => {
    console.log('Reset app button pressed');
    setShowResetModal(true);
  };

  const confirmReset = async () => {
    try {
      console.log('User confirmed reset, starting process...');
      setIsResetting(true);
      
      // Clear all data
      await clearAllData();
      console.log('All data cleared successfully');
      
      // Close modal
      setShowResetModal(false);
      setIsResetting(false);
      
      // Small delay to ensure state updates
      setTimeout(() => {
        console.log('Navigating to profile screen');
        // Navigate to profile screen (setup phase)
        router.replace('/(tabs)/profile');
      }, 100);
      
    } catch (error) {
      console.error('Error resetting app:', error);
      setIsResetting(false);
      setShowResetModal(false);
      Alert.alert('Error', 'Failed to reset app data. Please try again.');
    }
  };

  const cancelReset = () => {
    console.log('Reset cancelled');
    setShowResetModal(false);
  };

  return (
    <View style={commonStyles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.logoContainer}>
          <AppLogo size={60} />
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Manage your preferences</Text>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={[buttonStyles.outline, styles.button]}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Text style={commonStyles.buttonTextOutline}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>About Portion Tracker</Text>
          <Text style={styles.infoText}>
            Portion Tracker helps you maintain healthy eating habits by tracking daily portions from key food groups.
          </Text>
          <Text style={styles.infoText}>
            Your data is stored locally on your device and is never shared.
          </Text>
        </View>

        <View style={styles.resetSection}>
          <Text style={styles.resetTitle}>Reset App Data</Text>
          <Text style={styles.resetDescription}>
            Need a fresh start? You can reset the app and clear all your data.
          </Text>
          <TouchableOpacity
            style={[buttonStyles.outline, styles.resetButton]}
            onPress={handleResetApp}
          >
            <Text style={styles.resetButtonText}>Clear All Data</Text>
          </TouchableOpacity>
          <Text style={styles.resetWarning}>
            Note: This will permanently delete all your data including profile, portion history, and weight entries.
          </Text>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Reset Confirmation Modal */}
      <Modal
        visible={showResetModal}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelReset}
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Start Fresh?</Text>
            <Text style={styles.modalMessage}>
              This will clear all your app data and return you to the setup screen.
            </Text>
            <Text style={styles.modalSubtitle}>
              The following will be deleted:
            </Text>
            <View style={styles.modalList}>
              <Text style={styles.modalListItem}>• Your profile and portion targets</Text>
              <Text style={styles.modalListItem}>• All portion tracking history</Text>
              <Text style={styles.modalListItem}>• All weight entries</Text>
              <Text style={styles.modalListItem}>• Reminder settings</Text>
            </View>
            <Text style={styles.modalNote}>
              This action cannot be undone.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[buttonStyles.outline, styles.modalButton]}
                onPress={cancelReset}
                disabled={isResetting}
              >
                <Text style={commonStyles.buttonTextOutline}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[buttonStyles.primary, styles.modalButton]}
                onPress={confirmReset}
                disabled={isResetting}
              >
                <Text style={commonStyles.buttonText}>
                  {isResetting ? 'Clearing...' : 'Clear Data'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: 48,
    paddingBottom: 120,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  button: {
    marginVertical: 8,
  },
  infoSection: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  resetSection: {
    paddingHorizontal: 16,
    marginTop: 48,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  resetTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  resetDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  resetButton: {
    borderColor: colors.textSecondary,
    marginVertical: 8,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  resetWarning: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 8,
    fontStyle: 'italic',
  },
  bottomPadding: {
    height: 20,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 22,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  modalList: {
    marginBottom: 16,
    paddingLeft: 8,
  },
  modalListItem: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
  },
  modalNote: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
  },
});
