
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Linking } from 'react-native';
import PaywallScreen from '@/components/PaywallScreen';
import { useRouter } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { loadCelebrationEnabled, saveCelebrationEnabled } from '@/utils/celebrationStorage';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 20,
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
  chevron: {
    fontSize: 24,
    color: colors.textSecondary,
  },
  dangerLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF3B30',
  },
});

export default function SettingsScreen() {
  const router = useRouter();
  const [paywallVisible, setPaywallVisible] = useState(false);

  const handleResetAllData = () => {
    console.log('Reset App Data button pressed');
    Alert.alert(
      'Reset All Data',
      'Are you sure you want to reset all app data? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Clearing AsyncStorage...');
              await AsyncStorage.clear();
              console.log('AsyncStorage cleared successfully');
              
              // Navigate immediately to welcome screen
              console.log('Navigating to welcome screen...');
              router.replace('/welcome');
            } catch (error) {
              console.error('Error resetting app data:', error);
              Alert.alert('Error', 'Failed to reset app data. Please try again.');
            }
          },
        },
      ]
    );
  };

  const openPrivacyPolicy = () => {
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
          onPress={() => setPaywallVisible(true)}
        >
          <Text style={styles.settingIcon}>💳</Text>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Subscription</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        {/* Celebration */}
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => router.push('/celebration-settings')}
        >
          <Text style={styles.settingIcon}>🎉</Text>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Celebration</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        {/* Daily Reset */}
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => router.push('/daily-reset')}
        >
          <Text style={styles.settingIcon}>🕐</Text>
          <View style={styles.settingContent}>
            <Text style={settings.settingLabel}>Daily Reset</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        {/* Privacy Policy */}
        <TouchableOpacity
          style={styles.settingItem}
          onPress={openPrivacyPolicy}
        >
          <Text style={styles.settingIcon}>🛡️</Text>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Privacy Policy</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        {/* Reset App Data */}
        <TouchableOpacity
          style={styles.settingItem}
          onPress={handleResetAllData}
          activeOpacity={0.7}
        >
          <Text style={styles.settingIcon}>⚠️</Text>
          <View style={styles.settingContent}>
            <Text style={styles.dangerLabel}>Reset App Data</Text>
          </View>
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
