
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Text, TouchableOpacity, Linking, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors, commonStyles } from '@/styles/commonStyles';
import { clearAllData } from '@/utils/storage';
import AppLogo from '@/components/AppLogo';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    gap: 12,
  },
  headerTitle: {
    fontSize: 40,
    fontWeight: 'bold',
    color: colors.text,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingLabel: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
  },
  chevronContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default function SettingsScreen() {
  const router = useRouter();

  const handleSubscription = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('https://apps.apple.com/account/subscriptions');
    } else {
      Linking.openURL('https://play.google.com/store/account/subscriptions');
    }
  };

  const handleActivityLevel = () => {
    router.push('/activity-level');
  };

  const handleCelebration = () => {
    router.push('/celebration-settings');
  };

  const handleDailyReset = () => {
    router.push('/daily-reset');
  };

  const handlePrivacyPolicy = () => {
    Linking.openURL('https://www.portiontrack.com/privacy-policy');
  };

  const handleResetApp = () => {
    Alert.alert(
      'Reset All App Data',
      'This will permanently delete all your data including profile, portions, weight entries, and settings. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            Alert.alert('Success', 'All app data has been reset.');
            router.replace('/(tabs)/(home)');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppLogo size={48} />
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView>
        <TouchableOpacity style={styles.settingItem} onPress={handleSubscription}>
          <View style={styles.iconContainer}>
            <IconSymbol ios_icon_name="creditcard.fill" android_material_icon_name="credit-card" size={24} color="#FF6B6B" />
          </View>
          <Text style={styles.settingLabel}>Subscription</Text>
          <View style={styles.chevronContainer}>
            <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={20} color={colors.textSecondary} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={handleActivityLevel}>
          <View style={styles.iconContainer}>
            <IconSymbol ios_icon_name="figure.run" android_material_icon_name="directions-run" size={24} color="#FF6B6B" />
          </View>
          <Text style={styles.settingLabel}>Activity Level</Text>
          <View style={styles.chevronContainer}>
            <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={20} color={colors.textSecondary} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={handleCelebration}>
          <View style={styles.iconContainer}>
            <IconSymbol ios_icon_name="party.popper.fill" android_material_icon_name="celebration" size={24} color="#FF6B6B" />
          </View>
          <Text style={styles.settingLabel}>Celebration</Text>
          <View style={styles.chevronContainer}>
            <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={20} color={colors.textSecondary} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={handleDailyReset}>
          <View style={styles.iconContainer}>
            <IconSymbol ios_icon_name="clock.fill" android_material_icon_name="schedule" size={24} color="#FF6B6B" />
          </View>
          <Text style={styles.settingLabel}>Daily Reset</Text>
          <View style={styles.chevronContainer}>
            <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={20} color={colors.textSecondary} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={handlePrivacyPolicy}>
          <View style={styles.iconContainer}>
            <IconSymbol ios_icon_name="lock.shield.fill" android_material_icon_name="security" size={24} color="#FF6B6B" />
          </View>
          <Text style={styles.settingLabel}>Privacy Policy</Text>
          <View style={styles.chevronContainer}>
            <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={20} color={colors.textSecondary} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={handleResetApp}>
          <View style={styles.iconContainer}>
            <IconSymbol ios_icon_name="exclamationmark.triangle.fill" android_material_icon_name="warning" size={24} color="#FF6B6B" />
          </View>
          <Text style={styles.settingLabel}>Reset App Data</Text>
          <View style={styles.chevronContainer}>
            <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={20} color={colors.textSecondary} />
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
