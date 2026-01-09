
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { loadProfile, saveProfile, loadResetTime, saveResetTime } from '@/utils/storage';
import { useFocusEffect } from 'expo-router';
import { UserProfile } from '@/types';
import PaywallScreen from '@/components/PaywallScreen';
import { IconSymbol } from '@/components/IconSymbol';

export default function SettingsScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const userProfile = await loadProfile();
    setProfile(userProfile);
  };

  const handleEditProfile = () => {
    router.push('/setup-profile');
  };

  const handleEditTargets = () => {
    router.push('/setup-targets');
  };

  const handleToggleReminder = (value: boolean) => {
    setReminderEnabled(value);
    Alert.alert('Reminder', value ? 'Reminder enabled' : 'Reminder disabled');
  };

  const handleUpgradeToPremium = () => {
    setPaywallVisible(true);
  };

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

        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <TouchableOpacity style={styles.settingRow} onPress={handleEditProfile}>
            <Text style={styles.settingLabel}>Edit Profile</Text>
            <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="keyboard-arrow-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingRow} onPress={handleEditTargets}>
            <Text style={styles.settingLabel}>Edit Portion Targets</Text>
            <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="keyboard-arrow-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Daily Reminder</Text>
            <Switch
              value={reminderEnabled}
              onValueChange={handleToggleReminder}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Premium Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Premium</Text>
          <TouchableOpacity style={styles.premiumButton} onPress={handleUpgradeToPremium}>
            <IconSymbol ios_icon_name="star.fill" android_material_icon_name="star" size={24} color="#FFD700" />
            <Text style={styles.premiumButtonText}>Upgrade to Premium</Text>
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Version</Text>
            <Text style={styles.settingValue}>1.0.0</Text>
          </View>
        </View>
      </ScrollView>

      <PaywallScreen
        visible={paywallVisible}
        onDismiss={() => setPaywallVisible(false)}
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
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: colors.text,
  },
  settingValue: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  premiumButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  premiumButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
