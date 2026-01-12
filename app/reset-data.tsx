
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '@/styles/commonStyles';

export default function ResetDataScreen() {
  const router = useRouter();
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = () => {
    console.log('=== RESET BUTTON PRESSED ===');
    console.log('Platform:', Platform.OS);
    console.log('isResetting:', isResetting);
    
    // Show confirmation alert
    Alert.alert(
      'Final Confirmation',
      'Are you absolutely sure you want to reset all data? This cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            console.log('=== RESET CANCELLED ===');
          },
        },
        {
          text: 'Yes, Reset Everything',
          style: 'destructive',
          onPress: () => {
            console.log('=== RESET CONFIRMED - STARTING RESET ===');
            performReset();
          },
        },
      ],
      { cancelable: true }
    );
  };

  const performReset = async () => {
    console.log('=== performReset CALLED ===');
    setIsResetting(true);
    
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
      
      Alert.alert(
        'Error',
        'Failed to reset app data. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleCancel = () => {
    console.log('=== CANCEL BUTTON PRESSED ===');
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Stack.Screen
        options={{
          title: 'Reset App Data',
          headerShown: true,
          headerBackTitle: 'Back',
        }}
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Reset All App Data</Text>
        </View>

        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>⚠️ Warning</Text>
          <Text style={styles.warningText}>
            This action will permanently delete ALL your data and cannot be undone.
          </Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>What will be deleted:</Text>
          <Text style={styles.bulletPoint}>• Your profile information (sex, weight, goals)</Text>
          <Text style={styles.bulletPoint}>• All daily portion tracking data</Text>
          <Text style={styles.bulletPoint}>• Your tracking history</Text>
          <Text style={styles.bulletPoint}>• Custom portion targets</Text>
          <Text style={styles.bulletPoint}>• All settings and preferences</Text>
          <Text style={styles.bulletPoint}>• Weight tracking history</Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>What happens next:</Text>
          <Text style={styles.infoText}>
            After resetting, you&apos;ll be taken back to the welcome screen where you can set up your profile again from scratch.
          </Text>
        </View>

        {/* Add some bottom padding to ensure content is scrollable above buttons */}
        <View style={{ height: 200 }} />
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.resetButton, isResetting && styles.disabledButton]}
          onPress={handleReset}
          disabled={isResetting}
          activeOpacity={0.7}
        >
          <Text style={styles.resetButtonText}>
            {isResetting ? 'Resetting...' : 'Reset All Data'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.cancelButton, isResetting && styles.disabledButton]}
          onPress={handleCancel}
          disabled={isResetting}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
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
});
