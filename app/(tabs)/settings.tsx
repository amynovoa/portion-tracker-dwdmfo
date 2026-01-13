
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Linking, Platform } from 'react-native';
import PaywallScreen from '@/components/PaywallScreen';
import { useRouter } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { loadCelebrationEnabled, saveCelebrationEnabled } from '@/utils/celebrationStorage';
import { toggleNoonReminder, isNoonReminderEnabled } from '@/utils/notificationManager';
import AppLogo from '@/components/AppLogo';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 48,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 180,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  settingIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  settingDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  chevron: {
    fontSize: 20,
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
      <ScrollView 
        style={styles.scrollContent}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={true}
        bounces={true}
      >
        <View style={styles.logoContainer}>
          <AppLogo size={50} />
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
