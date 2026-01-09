
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/IconSymbol";
import { GlassView } from "expo-glass-effect";
import { useTheme } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors } from "@/styles/commonStyles";

export default function SettingsScreen() {
  const theme = useTheme();
  const [celebrationEnabled, setCelebrationEnabled] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const celebration = await AsyncStorage.getItem('celebration_enabled');
      if (celebration !== null) {
        setCelebrationEnabled(celebration === 'true');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleCelebrationToggle = async (value: boolean) => {
    setCelebrationEnabled(value);
    await AsyncStorage.setItem('celebration_enabled', value.toString());
  };

  const handleResetAppData = () => {
    Alert.alert(
      "Reset App Data",
      "This will delete all your data including portions, weight entries, and settings. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert("Success", "All app data has been reset.");
            } catch (error) {
              Alert.alert("Error", "Failed to reset app data.");
            }
          },
        },
      ]
    );
  };

  const handlePrivacyPolicy = () => {
    Linking.openURL("https://yourapp.com/privacy");
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={[styles.header, { color: theme.colors.text }]}>Settings</Text>

        {/* Subscriptions */}
        <GlassView style={styles.section} glassEffectStyle="regular">
          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <IconSymbol ios_icon_name="crown.fill" android_material_icon_name="workspace-premium" size={24} color={colors.primary} />
              <Text style={[styles.settingText, { color: theme.colors.text }]}>Subscriptions</Text>
            </View>
            <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={20} color={theme.dark ? '#98989D' : '#666'} />
          </TouchableOpacity>
        </GlassView>

        {/* Celebration */}
        <GlassView style={styles.section} glassEffectStyle="regular">
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <IconSymbol ios_icon_name="party.popper.fill" android_material_icon_name="celebration" size={24} color={colors.primary} />
              <Text style={[styles.settingText, { color: theme.colors.text }]}>Celebration</Text>
            </View>
            <Switch
              value={celebrationEnabled}
              onValueChange={handleCelebrationToggle}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
        </GlassView>

        {/* Daily Reset */}
        <GlassView style={styles.section} glassEffectStyle="regular">
          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <IconSymbol ios_icon_name="clock.fill" android_material_icon_name="schedule" size={24} color={colors.primary} />
              <Text style={[styles.settingText, { color: theme.colors.text }]}>Daily Reset</Text>
            </View>
            <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={20} color={theme.dark ? '#98989D' : '#666'} />
          </TouchableOpacity>
        </GlassView>

        {/* Privacy Policy */}
        <GlassView style={styles.section} glassEffectStyle="regular">
          <TouchableOpacity style={styles.settingRow} onPress={handlePrivacyPolicy}>
            <View style={styles.settingLeft}>
              <IconSymbol ios_icon_name="lock.shield.fill" android_material_icon_name="privacy-tip" size={24} color={colors.primary} />
              <Text style={[styles.settingText, { color: theme.colors.text }]}>Privacy Policy</Text>
            </View>
            <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={20} color={theme.dark ? '#98989D' : '#666'} />
          </TouchableOpacity>
        </GlassView>

        {/* Reset App Data */}
        <GlassView style={styles.section} glassEffectStyle="regular">
          <TouchableOpacity style={styles.settingRow} onPress={handleResetAppData}>
            <View style={styles.settingLeft}>
              <IconSymbol ios_icon_name="trash.fill" android_material_icon_name="delete" size={24} color="#FF3B30" />
              <Text style={[styles.settingText, { color: '#FF3B30' }]}>Reset App Data</Text>
            </View>
            <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={20} color={theme.dark ? '#98989D' : '#666'} />
          </TouchableOpacity>
        </GlassView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    fontSize: 16,
  },
});
