
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import AppLogo from '@/components/AppLogo';
import { IconSymbol } from '@/components/IconSymbol';
import { useSubscription } from '@/contexts/SubscriptionContext';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? 48 : 0,
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
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  menuIcon: {
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  menuDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  chevron: {
    fontSize: 20,
    color: colors.textSecondary,
  },
  statusSection: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
});

export default function MoreScreen() {
  const router = useRouter();
  const { isSubscribed, refreshSubscription } = useSubscription();

  const handleTestSubscription = async () => {
    console.log('[More] Refresh Subscription Status tapped');
    await refreshSubscription();
    console.log('[More] Subscription status after refresh:', isSubscribed);
  };

  const subscriptionStatusText = isSubscribed ? 'Active' : 'Not Active';
  const subscriptionStatusColor = isSubscribed ? '#28A745' : '#DC3545';

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
        <Text style={styles.headerTitle}>More</Text>

        {/* Subscription Status */}
        <View style={styles.statusSection}>
          <Text style={styles.statusTitle}>Subscription Status</Text>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Status:</Text>
            <Text style={[styles.statusValue, { color: subscriptionStatusColor }]}>
              {subscriptionStatusText}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Platform:</Text>
            <Text style={styles.statusValue}>{Platform.OS}</Text>
          </View>
        </View>

        {/* Test Subscription Button */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleTestSubscription}
        >
          <IconSymbol
            ios_icon_name="arrow.clockwise"
            android_material_icon_name="refresh"
            size={24}
            color={colors.primary}
            style={styles.menuIcon}
          />
          <View style={styles.menuContent} pointerEvents="none">
            <Text style={styles.menuLabel}>Refresh Subscription Status</Text>
            <Text style={styles.menuDescription}>Check current subscription state</Text>
          </View>
          <Text style={styles.chevron} pointerEvents="none">›</Text>
        </TouchableOpacity>

        {/* Profile */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            console.log('Profile button pressed');
            router.push('/(tabs)/profile');
          }}
        >
          <IconSymbol
            ios_icon_name="person.circle"
            android_material_icon_name="person"
            size={24}
            color={colors.primary}
            style={styles.menuIcon}
          />
          <View style={styles.menuContent} pointerEvents="none">
            <Text style={styles.menuLabel}>Profile</Text>
            <Text style={styles.menuDescription}>View and edit your profile</Text>
          </View>
          <Text style={styles.chevron} pointerEvents="none">›</Text>
        </TouchableOpacity>

        {/* Settings */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            console.log('Settings button pressed');
            router.push('/(tabs)/settings');
          }}
        >
          <IconSymbol
            ios_icon_name="gear"
            android_material_icon_name="settings"
            size={24}
            color={colors.primary}
            style={styles.menuIcon}
          />
          <View style={styles.menuContent} pointerEvents="none">
            <Text style={styles.menuLabel}>Settings</Text>
            <Text style={styles.menuDescription}>App preferences and configuration</Text>
          </View>
          <Text style={styles.chevron} pointerEvents="none">›</Text>
        </TouchableOpacity>

        {/* FAQs */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            console.log('FAQs button pressed');
            router.push('/(tabs)/faqs');
          }}
        >
          <IconSymbol
            ios_icon_name="questionmark.circle"
            android_material_icon_name="help"
            size={24}
            color={colors.primary}
            style={styles.menuIcon}
          />
          <View style={styles.menuContent} pointerEvents="none">
            <Text style={styles.menuLabel}>FAQs</Text>
            <Text style={styles.menuDescription}>Frequently asked questions</Text>
          </View>
          <Text style={styles.chevron} pointerEvents="none">›</Text>
        </TouchableOpacity>

        {/* Backup & Restore */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            console.log('Backup & Restore button pressed');
            router.push('/backup-restore');
          }}
        >
          <IconSymbol
            ios_icon_name="arrow.clockwise.icloud"
            android_material_icon_name="backup"
            size={24}
            color={colors.primary}
            style={styles.menuIcon}
          />
          <View style={styles.menuContent} pointerEvents="none">
            <Text style={styles.menuLabel}>Backup &amp; Restore</Text>
            <Text style={styles.menuDescription}>Manage your data backups</Text>
          </View>
          <Text style={styles.chevron} pointerEvents="none">›</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
