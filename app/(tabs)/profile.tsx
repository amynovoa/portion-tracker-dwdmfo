
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, commonStyles } from '@/styles/commonStyles';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadCelebrationEnabled, saveCelebrationEnabled } from '@/utils/celebrationStorage';
import { loadResetTime, saveResetTime } from '@/utils/storage';
import PaywallScreen from '@/components/PaywallScreen';

export default function SettingsScreen() {
  const [celebrationEnabled, setCelebrationEnabled] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const celebration = await loadCelebrationEnabled();
    setCelebrationEnabled(celebration);
  };

  const handleCelebrationToggle = async (value: boolean) => {
    setCelebrationEnabled(value);
    await saveCelebrationEnabled(value);
  };

  const handleSubscription = () => {
    console.log('Subscription button pressed - opening paywall');
    setShowPaywall(true);
  };

  const handleDailyReset = () => {
    Alert.alert('Daily Reset', 'Reset time: Midnight (12:00 AM)');
  };

  const handlePrivacyPolicy = () => {
    Linking.openURL('https://yourapp.com/privacy');
  };

  const handleResetAppData = () => {
    Alert.alert(
      'Reset App Data',
      'Are you sure you want to reset all app data? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            Alert.alert('Success', 'App data has been reset. Please restart the app.');
          },
        },
      ]
    );
  };

  const handleDismissPaywall = () => {
    console.log('Paywall dismissed');
    setShowPaywall(false);
  };

  console.log('Settings screen render - showPaywall:', showPaywall);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.contentContainer,
          Platform.OS !== 'ios' && styles.contentContainerWithTabBar
        ]}
      >
        <Text style={styles.header}>Settings</Text>

        <View style={styles.section}>
          <TouchableOpacity style={styles.row} onPress={handleSubscription}>
            <View style={styles.rowLeft}>
              <MaterialIcons name="star" size={24} color={colors.primary} />
              <Text style={styles.rowText}>Subscription</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#999" />
          </TouchableOpacity>

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <MaterialIcons name="celebration" size={24} color={colors.primary} />
              <Text style={styles.rowText}>Celebration</Text>
            </View>
            <Switch
              value={celebrationEnabled}
              onValueChange={handleCelebrationToggle}
              trackColor={{ false: '#767577', true: colors.primary }}
            />
          </View>

          <TouchableOpacity style={styles.row} onPress={handleDailyReset}>
            <View style={styles.rowLeft}>
              <MaterialIcons name="schedule" size={24} color={colors.primary} />
              <Text style={styles.rowText}>Daily Reset</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.row} onPress={handlePrivacyPolicy}>
            <View style={styles.rowLeft}>
              <MaterialIcons name="privacy-tip" size={24} color={colors.primary} />
              <Text style={styles.rowText}>Privacy Policy</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.row} onPress={handleResetAppData}>
            <View style={styles.rowLeft}>
              <MaterialIcons name="delete-forever" size={24} color="#FF3B30" />
              <Text style={[styles.rowText, { color: '#FF3B30' }]}>Reset App Data</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#999" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <PaywallScreen
        visible={showPaywall}
        onDismiss={handleDismissPaywall}
        canDismiss={true}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  contentContainerWithTabBar: {
    paddingBottom: 100,
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 24,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowText: {
    fontSize: 16,
    color: colors.text,
  },
});
