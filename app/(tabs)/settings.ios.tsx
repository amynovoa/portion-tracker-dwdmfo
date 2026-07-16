
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Linking, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colors, commonStyles } from '@/styles/commonStyles';
import { loadCelebrationEnabled, saveCelebrationEnabled } from '@/utils/celebrationStorage';
import AppLogo from '@/components/AppLogo';
import { setStoredLanguage } from '@/utils/i18n';
import { loadWeightUnit, saveWeightUnit, convertAllStoredWeights } from '@/utils/weightUnit';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  const { t, i18n: i18nInstance } = useTranslation();
  const [currentLang, setCurrentLang] = useState<string>(i18nInstance.language || 'en');

  useEffect(() => {
    setCurrentLang(i18nInstance.language || 'en');
  }, [i18nInstance.language]);

  const languageDisplayText = currentLang === 'en' ? 'English' : 'Español';

  const handleToggleLanguage = async () => {
    const nextLang = currentLang === 'en' ? 'es' : 'en';
    console.log('[Settings] Language toggle pressed — switching from', currentLang, 'to', nextLang);
    const currentUnit = await loadWeightUnit();
    console.log('[Settings] Current weight unit:', currentUnit);
    const suggestedUnit = nextLang === 'es' ? 'kg' : 'lbs';
    await setStoredLanguage(nextLang);
    setCurrentLang(nextLang);
    console.log('[Settings] Language changed to:', nextLang);
    if (suggestedUnit !== currentUnit) {
      const unitLabel = t(suggestedUnit === 'kg' ? 'common.kg' : 'common.lbs');
      const nextLangLabel = nextLang === 'es' ? 'Español' : 'English';
      console.log('[Settings] Prompting unit switch to:', suggestedUnit);
      Alert.alert(
        t('settings.switchUnitTitle', { language: nextLangLabel }),
        t('settings.switchUnitMessage', { unit: unitLabel }),
        [
          { text: t('common.no'), style: 'cancel' },
          {
            text: t('common.yes'),
            onPress: async () => {
              console.log('[Settings] User accepted unit switch — converting from', currentUnit, 'to', suggestedUnit);
              await convertAllStoredWeights(currentUnit, suggestedUnit);
              await saveWeightUnit(suggestedUnit);
              console.log('[Settings] Weight unit converted and saved:', suggestedUnit);
            },
          },
        ]
      );
    }
  };

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

  const settingsTitle = t('settings.title') || 'Settings';
  const profileLabel = t('settings.profile') || 'Profile';
  const subscriptionLabel = t('settings.subscription') || 'Subscription';
  const celebrationLabel = t('settings.celebration') || 'Celebration';
  const dailyResetLabel = t('settings.dailyReset') || 'Daily Reset';
  const dailyReminderLabel = t('settings.dailyReminder') || 'Daily Reminder';
  const languageLabel = t('settings.language') || 'Language';
  const privacyPolicyLabel = t('settings.privacyPolicy') || 'Privacy Policy';
  const resetAppDataLabel = t('settings.resetAppData') || 'Reset App Data';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        bounces={true}
      >
        <View style={styles.logoContainer}>
          <AppLogo size={50} />
        </View>
        <Text style={styles.headerTitle}>{settingsTitle}</Text>

        {/* Profile */}
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => {
            console.log('Profile button pressed — navigating to /(tabs)/profile');
            router.push('/(tabs)/profile');
          }}
        >
          <Text style={styles.settingIcon}>👤</Text>
          <View style={styles.settingContent} pointerEvents="none">
            <Text style={styles.settingLabel}>{profileLabel}</Text>
          </View>
          <Text style={styles.chevron} pointerEvents="none">›</Text>
        </TouchableOpacity>

        {/* Subscription */}
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => {
            console.log('Subscription button pressed — navigating to /paywall');
            router.push('/paywall');
          }}
        >
          <Text style={styles.settingIcon}>💳</Text>
          <View style={styles.settingContent} pointerEvents="none">
            <Text style={styles.settingLabel}>{subscriptionLabel}</Text>
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
            <Text style={styles.settingLabel}>{celebrationLabel}</Text>
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
            <Text style={styles.settingLabel}>{dailyResetLabel}</Text>
          </View>
          <Text style={styles.chevron} pointerEvents="none">›</Text>
        </TouchableOpacity>

        {/* Daily Reminder */}
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => {
            console.log('Daily Reminder button pressed');
            router.push('/daily-reminder');
          }}
        >
          <Text style={styles.settingIcon}>🔔</Text>
          <View style={styles.settingContent} pointerEvents="none">
            <Text style={styles.settingLabel}>{dailyReminderLabel}</Text>
          </View>
          <Text style={styles.chevron} pointerEvents="none">›</Text>
        </TouchableOpacity>

        {/* Language */}
        <TouchableOpacity
          style={styles.settingItem}
          onPress={handleToggleLanguage}
        >
          <Text style={styles.settingIcon}>🌐</Text>
          <View style={styles.settingContent} pointerEvents="none">
            <Text style={styles.settingLabel}>{languageLabel}</Text>
            <Text style={styles.settingDescription}>{languageDisplayText}</Text>
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
            <Text style={styles.settingLabel}>{privacyPolicyLabel}</Text>
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
            <Text style={styles.settingLabel}>{resetAppDataLabel}</Text>
          </View>
          <Text style={styles.chevron} pointerEvents="none">›</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
