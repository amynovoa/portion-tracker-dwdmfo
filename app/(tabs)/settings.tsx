
import { IconSymbol } from "@/components/IconSymbol";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/styles/commonStyles";
import { useTheme } from "@react-navigation/native";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import React, { useState, useEffect } from "react";
import { loadCelebrationEnabled, saveCelebrationEnabled } from "@/utils/celebrationStorage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    gap: 12,
  },
  headerIcon: {
    fontSize: 32,
  },
  headerTitle: {
    fontSize: 48,
    fontWeight: '900',
    color: colors.text,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  settingLabel: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  chevron: {
    fontSize: 24,
    color: colors.textSecondary,
  },
});

export default function SettingsScreen() {
  const [celebrationEnabled, setCelebrationEnabled] = useState(true);
  const theme = useTheme();
  const router = useRouter();

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

  const handleSubscriptions = () => {
    router.push('/subscription');
  };

  const handleDailyReset = () => {
    router.push('/daily-reset');
  };

  const handleResetAppData = () => {
    Alert.alert(
      'Reset App Data',
      'Are you sure you want to reset all app data? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            router.replace('/setup-profile');
          },
        },
      ]
    );
  };

  const handlePrivacyPolicy = () => {
    router.push('/privacy-policy');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerIcon}>🍎</Text>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>
      
      <ScrollView style={styles.scrollContent}>
        <TouchableOpacity style={styles.settingItem} onPress={handleSubscriptions}>
          <Text style={styles.settingIcon}>💳</Text>
          <Text style={styles.settingLabel}>Subscription</Text>
          <IconSymbol 
            ios_icon_name="chevron.right" 
            android_material_icon_name="chevron-right" 
            size={24} 
            color={colors.textSecondary} 
          />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.settingItem} 
          onPress={() => router.push('/celebration-settings')}
        >
          <Text style={styles.settingIcon}>🎉</Text>
          <Text style={styles.settingLabel}>Celebration</Text>
          <IconSymbol 
            ios_icon_name="chevron.right" 
            android_material_icon_name="chevron-right" 
            size={24} 
            color={colors.textSecondary} 
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={handleDailyReset}>
          <Text style={styles.settingIcon}>🕐</Text>
          <Text style={styles.settingLabel}>Daily Reset</Text>
          <IconSymbol 
            ios_icon_name="chevron.right" 
            android_material_icon_name="chevron-right" 
            size={24} 
            color={colors.textSecondary} 
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={handlePrivacyPolicy}>
          <Text style={styles.settingIcon}>🛡</Text>
          <Text style={styles.settingLabel}>Privacy Policy</Text>
          <IconSymbol 
            ios_icon_name="chevron.right" 
            android_material_icon_name="chevron-right" 
            size={24} 
            color={colors.textSecondary} 
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={handleResetAppData}>
          <Text style={styles.settingIcon}>⚠️</Text>
          <Text style={styles.settingLabel}>Reset App Data</Text>
          <IconSymbol 
            ios_icon_name="chevron.right" 
            android_material_icon_name="chevron-right" 
            size={24} 
            color={colors.textSecondary} 
          />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
