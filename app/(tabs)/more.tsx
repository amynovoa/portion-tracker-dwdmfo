
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import AppLogo from '@/components/AppLogo';
import { IconSymbol } from '@/components/IconSymbol';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();

  const handleTestSubscription = async () => {
    console.log('[More] Refresh Subscription Status tapped');
    await refreshSubscription();
    console.log('[More] Subscription status after refresh:', isSubscribed);
  };

  const subscriptionStatusText = isSubscribed ? t('more.active') : t('more.notActive');
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
        <Text style={styles.headerTitle}>{t('more.title')}</Text>

        {/* Subscription Status */}
        <View style={styles.statusSection}>
          <Text style={styles.statusTitle}>{t('more.subscriptionStatus')}</Text>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>{t('more.status')}</Text>
            <Text style={[styles.statusValue, { color: subscriptionStatusColor }]}>
              {subscriptionStatusText}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>{t('more.platform')}</Text>
            <Text style={styles.statusValue}>{Platform.OS}</Text>
          </View>
        </View>

        {/* Refresh Subscription Button */}
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
            <Text style={styles.menuLabel}>{t('more.refreshSubscription')}</Text>
            <Text style={styles.menuDescription}>{t('more.refreshDescription')}</Text>
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
            <Text style={styles.menuLabel}>{t('more.profile')}</Text>
            <Text style={styles.menuDescription}>{t('more.profileDescription')}</Text>
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
            <Text style={styles.menuLabel}>{t('more.settings')}</Text>
            <Text style={styles.menuDescription}>{t('more.settingsDescription')}</Text>
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
            <Text style={styles.menuLabel}>{t('more.faqs')}</Text>
            <Text style={styles.menuDescription}>{t('more.faqsDescription')}</Text>
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
            <Text style={styles.menuLabel}>{t('more.backupRestore')}</Text>
            <Text style={styles.menuDescription}>{t('more.backupDescription')}</Text>
          </View>
          <Text style={styles.chevron} pointerEvents="none">›</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
