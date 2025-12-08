
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, Text, TouchableOpacity, Alert, Modal } from 'react-native';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { useRouter } from 'expo-router';
import AppLogo from '@/components/AppLogo';
import { clearAllData } from '@/utils/storage';

export default function SettingsScreen() {
  const router = useRouter();
  const [showResetModal, setShowResetModal] = useState(false);

  const handleResetApp = () => {
    setShowResetModal(true);
  };

  const confirmReset = async () => {
    try {
      console.log('Resetting app data...');
      await clearAllData();
      console.log('All data cleared successfully');
      
      setShowResetModal(false);
      
      // Show success message and redirect
      Alert.alert(
        'Reset Complete',
        'All your data has been cleared. You will now be redirected to set up your profile.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to profile screen (setup phase)
              router.replace('/(tabs)/profile');
            },
          },
        ],
        { cancelable: false }
      );
    } catch (error) {
      console.error('Error resetting app:', error);
      Alert.alert('Error', 'Failed to reset app data. Please try again.');
      setShowResetModal(false);
    }
  };

  const cancelReset = () => {
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

        <View style={styles.dangerSection}>
          <Text style={styles.dangerTitle}>Danger Zone</Text>
          <TouchableOpacity
            style={[buttonStyles.outline, styles.dangerButton]}
            onPress={handleResetApp}
          >
            <Text style={styles.dangerButtonText}>Reset App & Clear All Data</Text>
          </TouchableOpacity>
          <Text style={styles.dangerWarning}>
            ⚠️ This will permanently delete all your data including profile, portion history, and weight entries. This action cannot be undone.
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
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reset App?</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to reset the app and clear all data?
            </Text>
            <Text style={styles.modalWarning}>
              This will permanently delete:
            </Text>
            <View style={styles.modalList}>
              <Text style={styles.modalListItem}>• Your profile and portion targets</Text>
              <Text style={styles.modalListItem}>• All portion tracking history</Text>
              <Text style={styles.modalListItem}>• All weight entries</Text>
              <Text style={styles.modalListItem}>• Reminder settings</Text>
            </View>
            <Text style={styles.modalWarning}>
              This action cannot be undone.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[buttonStyles.outline, styles.modalButton]}
                onPress={cancelReset}
              >
                <Text style={commonStyles.buttonTextOutline}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[buttonStyles.primary, styles.modalButton, styles.dangerButtonPrimary]}
                onPress={confirmReset}
              >
                <Text style={commonStyles.buttonText}>Reset App</Text>
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
  dangerSection: {
    paddingHorizontal: 16,
    marginTop: 48,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  dangerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF3B30',
    marginBottom: 12,
  },
  dangerButton: {
    borderColor: '#FF3B30',
    marginVertical: 8,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
  dangerWarning: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 8,
  },
  bottomPadding: {
    height: 20,
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
  modalWarning: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF3B30',
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
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
  },
  dangerButtonPrimary: {
    backgroundColor: '#FF3B30',
  },
});
