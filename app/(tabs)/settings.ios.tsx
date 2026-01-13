
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Linking, Platform } from 'react-native';
import PaywallScreen from '@/components/PaywallScreen';
import { useRouter } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { loadCelebrationEnabled, saveCelebrationEnabled } from '@/utils/celebrationStorage';
import AppLogo from '@/components/AppLogo';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 140,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 30,
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

  const handleResetAppData = () => {
    console.log('=== RESET APP DATA BUTTON PRESSED ===');
    console.log('Platform:', Platform.OS);
    console.log('Navigating to reset-data screen...');
    router.push('/reset-data');
  };

  const openPrivacyPolicy = () => {
    console.log('Opening privacy policy...');
    Linking.openURL('https://www.portiontrack.com/privacy-policy');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <AppLogo size={60} />
        </View>
        <Text style={styles.headerTitle}>Settings</Text>

        {/* Subscription */}
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => {
            console.log('Subscription button pressed');
            setPaywallVisible(true);
          }}
        >
          <Text style={styles.settingIcon}>💳</Text>
          <View style={styles.settingContent} pointerEvents="none">
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
          <View style={styles.settingContent} pointerEvents="none">
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
          <View style={styles.settingContent} pointerEvents="none">
            <Text style={styles.settingLabel}>Daily Reset</Text>
          </View>
          <Text style={styles.chevron} pointerEvents="none">›</Text>
        </TouchableOpacity>

        {/* Daily Reminder - Now with chevron */}
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => {
            console.log('Daily Reminder button pressed');
            router.push('/daily-reminder');
          }}
        >
          <Text style={styles.settingIcon}>🔔</Text>
          <View style={styles.settingContent} pointerEvents="none">
            <Text style={styles.settingLabel}>Daily Reminder</Text>
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
          <View style={styles.settingContent} pointerEvents="none">
            <Text style={styles.settingLabel}>Privacy Policy</Text>
          </View>
          <Text style={styles.chevron} pointerEvents="none">›</Text>
        </TouchableOpacity>

        {/* Reset App Data */}
        <TouchableOpacity
          style={styles.settingItem}
          onPress={handleResetAppData}
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
