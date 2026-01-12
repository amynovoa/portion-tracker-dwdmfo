
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Linking, Platform } from 'react-native';
import PaywallScreen from '@/components/PaywallScreen';
import { useRouter } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { loadCelebrationEnabled, saveCelebrationEnabled } from '@/utils/celebrationStorage';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 48,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  headerIcon: {
    fontSize: 40,
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
  },
  settingIcon: {
    fontSize: 28,
    marginRight: 15,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  settingDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  chevron: {
    fontSize: 24,
    color: colors.textSecondary,
  },
});

export default function SettingsScreen() {
  const router = useRouter();
  const [paywallVisible, setPaywallVisible] = useState(false);

  const handleResetAllData = () => {
    console.log('=== RESET APP DATA BUTTON PRESSED ===');
    console.log('Platform:', Platform.OS);
    console.log('Showing confirmation alert...');
    
    Alert.alert(
      'Reset All Data',
      'This will erase everything and start you over from the beginning. All your tracking data, profile settings, and progress will be permanently deleted. This action cannot be undone.\n\nAre you sure you want to continue?',
      [
        { 
          text: 'Cancel', 
          style: 'cancel',
          onPress: () => {
            console.log('=== RESET CANCELLED BY USER ===');
          }
        },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: async () => {
            console.log('=== USER CONFIRMED RESET ===');
            try {
              console.log('Step 1: Clearing AsyncStorage...');
              await AsyncStorage.clear();
              console.log('Step 2: AsyncStorage cleared successfully');
              
              console.log('Step 3: Navigating to welcome screen...');
              router.replace('/welcome');
              console.log('Step 4: Navigation command sent');
            } catch (error) {
              console.error('=== ERROR DURING RESET ===');
              console.error('Error details:', error);
              Alert.alert('Error', 'Failed to reset app data. Please try again.');
            }
          },
        },
      ],
      { cancelable: true }
    );
    
    console.log('Alert.alert() called');
  };

  const openPrivacyPolicy = () => {
    console.log('Opening privacy policy...');
    Linking.openURL('https://www.portiontrack.com/privacy-policy');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerIcon}>🍅</Text>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        {/* Subscription */}
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => {
            console.log('Subscription button pressed');
            setPaywallVisible(true);
          }}
        >
          <Text style={styles.settingIcon}>💳</Text>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Subscription</Text>
          </View>
          <Text style={styles.chevron} pointerEvents="none">›</Text>
        </TouchableOpacity>

        {/* Celebration */}
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => {
            console.log('Celebration button pressed');
            router.push('/celebration-settings');
          }}
        >
          <Text style={styles.settingIcon}>🎉</Text>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Celebration</Text>
          </View>
          <Text style={styles.chevron} pointerEvents="none">›</Text>
        </TouchableOpacity>

        {/* Daily Reset */}
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => {
            console.log('Daily Reset button pressed');
            router.push('/daily-reset');
          }}
        >
          <Text style={styles.settingIcon}>🕐</Text>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Daily Reset</Text>
          </View>
          <Text style={styles.chevron} pointerEvents="none">›</Text>
        </TouchableOpacity>

        {/* Privacy Policy */}
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => {
            console.log('Privacy Policy button pressed');
            openPrivacyPolicy();
          }}
        >
          <Text style={styles.settingIcon}>🛡️</Text>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Privacy Policy</Text>
          </View>
          <Text style={styles.chevron} pointerEvents="none">›</Text>
        </TouchableOpacity>

        {/* Reset App Data */}
        <TouchableOpacity
          style={styles.settingItem}
          onPress={handleResetAllData}
          activeOpacity={0.7}
        >
          <Text style={styles.settingIcon}>⚠️</Text>
          <View style={styles.settingContent} pointerEvents="none">
            <Text style={styles.settingLabel}>Reset App Data</Text>
            <Text style={styles.settingDescription}>
              Erase all data and start over
            </Text>
          </View>
          <Text style={styles.chevron} pointerEvents="none">›</Text>
        </TouchableOpacity>
      </ScrollView>

      <PaywallScreen
        visible={paywallVisible}
        onDismiss={() => setPaywallVisible(false)}
        canDismiss={true}
      />
    </SafeAreaView>
  );
}
