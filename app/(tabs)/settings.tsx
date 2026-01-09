
import { IconSymbol } from '@/components/IconSymbol';
import { useRouter } from 'expo-router';
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import React from 'react';
import { colors, commonStyles } from '@/styles/commonStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    fontSize: 42,
    fontWeight: 'bold',
    color: colors.text,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    gap: 16,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  iconContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default function SettingsScreen() {
  const router = useRouter();

  const handleSubscription = () => {
    // Navigate to subscription/paywall
    Alert.alert('Subscription', 'Subscription management coming soon');
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
    Linking.openURL('https://www.portiontracker.app/privacy');
  };

  const handleResetAppData = () => {
    Alert.alert(
      'Reset App Data',
      'This will delete all your data including profile, daily tracking, and weight entries. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert('Success', 'All app data has been reset. Please restart the app.');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset app data');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={{ fontSize: 32 }}>🍎</Text>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.menuItem} onPress={handleSubscription}>
          <View style={styles.iconContainer}>
            <IconSymbol ios_icon_name="creditcard.fill" android_material_icon_name="credit-card" size={24} color="#FF6B6B" />
          </View>
          <View style={styles.menuItemContent}>
            <Text style={styles.menuItemTitle}>Subscription</Text>
          </View>
          <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleActivityLevel}>
          <View style={styles.iconContainer}>
            <IconSymbol ios_icon_name="figure.run" android_material_icon_name="directions-run" size={24} color="#FF6B6B" />
          </View>
          <View style={styles.menuItemContent}>
            <Text style={styles.menuItemTitle}>Activity Level</Text>
          </View>
          <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleCelebration}>
          <View style={styles.iconContainer}>
            <IconSymbol ios_icon_name="party.popper.fill" android_material_icon_name="celebration" size={24} color="#FF6B6B" />
          </View>
          <View style={styles.menuItemContent}>
            <Text style={styles.menuItemTitle}>Celebration</Text>
          </View>
          <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleDailyReset}>
          <View style={styles.iconContainer}>
            <IconSymbol ios_icon_name="clock.fill" android_material_icon_name="schedule" size={24} color="#FF6B6B" />
          </View>
          <View style={styles.menuItemContent}>
            <Text style={styles.menuItemTitle}>Daily Reset</Text>
          </View>
          <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handlePrivacyPolicy}>
          <View style={styles.iconContainer}>
            <IconSymbol ios_icon_name="shield.fill" android_material_icon_name="shield" size={24} color="#FF6B6B" />
          </View>
          <View style={styles.menuItemContent}>
            <Text style={styles.menuItemTitle}>Privacy Policy</Text>
          </View>
          <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleResetAppData}>
          <View style={styles.iconContainer}>
            <IconSymbol ios_icon_name="exclamationmark.triangle.fill" android_material_icon_name="warning" size={24} color="#FF6B6B" />
          </View>
          <View style={styles.menuItemContent}>
            <Text style={styles.menuItemTitle}>Reset App Data</Text>
          </View>
          <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}
