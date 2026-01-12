
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
});

export default function SettingsScreen() {
  const router = useRouter();
  const [celebrationEnabled, setCelebrationEnabled] = useState(true);
  const [paywallVisible, setPaywallVisible] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const enabled = await loadCelebrationEnabled();
    setCelebrationEnabled(enabled);
  };

  const handleCelebrationToggle = async (value: boolean) => {
    setCelebrationEnabled(value);
    await saveCelebrationEnabled(value);
  };

  const handleResetAllData = () => {
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
              await AsyncStorage.clear();
              Alert.alert(
                'Success',
                'All data has been reset. The app will now restart.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Navigate to welcome screen to restart the setup flow
                      router.replace('/welcome');
                    },
                  },
                ]
              );
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
        <View style={styles.settingItem}>
          <Text style={styles.settingIcon}>🎉</Text>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Celebration</Text>
          </View>
          <Switch
            value={celebrationEnabled}
            onValueChange={handleCelebrationToggle}
            trackColor={{ false: colors.textSecondary, true: colors.primary }}
            thumbColor="#fff"
          />
        </View>

        {/* Daily Reset */}
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => router.push('/daily-reset')}
        >
          <Text style={styles.settingIcon}>🕐</Text>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Daily Reset</Text>
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
        >
          <Text style={styles.settingIcon}>⚠️</Text>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Reset App Data</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
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
