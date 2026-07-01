
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Linking, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import AppLogo from '@/components/AppLogo';
import { useTranslation } from 'react-i18next';
import { setStoredLanguage } from '@/utils/i18n';
import { loadWeightUnit, saveWeightUnit, convertAllStoredWeights } from '@/utils/weightUnit';
import { supabase } from '@/utils/supabase';

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
  const { t, i18n: i18nInstance } = useTranslation();
  const [currentLang, setCurrentLang] = useState<string>(i18nInstance.language || 'en');

  useEffect(() => {
    setCurrentLang(i18nInstance.language || 'en');
  }, [i18nInstance.language]);

  const handleLogout = async () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace('/auth');
        },
      },
    ]);
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

  const handleToggleLanguage = async () => {
    const nextLang = currentLang === 'en' ? 'es' : 'en';
    console.log('[Settings] Language toggle pressed — switching to:', nextLang);
    const currentUnit = await loadWeightUnit();
    console.log('[Settings] Current weight unit:', currentUnit);
    const suggestedUnit = nextLang === 'es' ? 'kg' : 'lbs';
    await setStoredLanguage(nextLang);
    setCurrentLang(nextLang);
    console.log('[Settings] Language changed to:', nextLang);
    if (suggestedUnit !== currentUnit) {
      const unitLabel = t(suggestedUnit === 'kg' ? 'common.kg' : 'common.lbs');
      console.log('[Settings] Prompting unit switch to:', suggestedUnit);
      Alert.alert(
        t('settings.switchUnitTitle'),
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

  const languageDisplayText = currentLang === 'en' ? 'English' : 'Español';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 180, flexGrow: 1 }}
        showsVerticalScrollIndicator={true}
        bounces={true}
      >
        <View style={styles.logoContainer}>
          <AppLogo size={50} />
        </View>
        <Text style={styles.headerTitle}>{t('settings.title')}</Text>

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
            <Text style={styles.settingLabel}>{t('settings.subscription')}</Text>
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
            <Text style={styles.settingLabel}>{t('settings.celebration')}</Text>
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
            <Text style={styles.settingLabel}>{t('settings.dailyReset')}</Text>
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
            <Text style={styles.settingLabel}>{t('settings.dailyReminder')}</Text>
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
            <Text style={styles.settingLabel}>{t('settings.language') || 'Language'}</Text>
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
            <Text style={styles.settingLabel}>{t('settings.privacyPolicy')}</Text>
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
            <Text style={styles.settingLabel}>{t('settings.resetAppData')}</Text>
          </View>
          <Text style={styles.chevron} pointerEvents="none">›</Text>
        </TouchableOpacity>

        {/* Log Out */}
        <TouchableOpacity
          style={[styles.settingItem, { marginTop: 16, borderColor: '#C94A3D' }]}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Text style={styles.settingIcon}>🚪</Text>
          <View style={styles.settingContent} pointerEvents="none">
            <Text style={[styles.settingLabel, { color: '#C94A3D' }]}>Log Out</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
