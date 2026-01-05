
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import AppLogo from '@/components/AppLogo';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { IconSymbol } from '@/components/IconSymbol';
import React, { useState, useEffect } from 'react';

interface PaywallScreenProps {
  visible: boolean;
  onDismiss?: () => void;
  isTrialAvailable: boolean;
  trialDaysRemaining?: number;
  canDismiss?: boolean;
}

export default function PaywallScreen({
  visible,
  onDismiss,
  isTrialAvailable,
  trialDaysRemaining,
  canDismiss = true,
}: PaywallScreenProps) {
  const [selectedPlan, setSelectedPlan] = useState<'annual' | 'monthly'>('annual');

  const handleSubscribe = () => {
    console.log('Subscribe button pressed');
    // Subscription logic handled by native module
  };

  const handleRestorePurchases = () => {
    console.log('Restore purchases pressed');
    // Restore logic handled by native module
  };

  const handleManageSubscription = () => {
    const url = Platform.select({
      ios: 'https://apps.apple.com/account/subscriptions',
      android: 'https://play.google.com/store/account/subscriptions',
      default: 'https://apps.apple.com/account/subscriptions',
    });
    Linking.openURL(url);
  };

  const getButtonText = () => {
    if (!isTrialAvailable) {
      return selectedPlan === 'annual' ? 'Subscribe for $24.99/year' : 'Subscribe for $2.99/month';
    }
    return selectedPlan === 'annual'
      ? 'Start 7-Day Free Trial — Then $24.99/year'
      : 'Start 7-Day Free Trial — Then $2.99/month';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={canDismiss ? onDismiss : undefined}
    >
      <View style={styles.container}>
        {canDismiss && onDismiss && (
          <TouchableOpacity style={styles.closeButton} onPress={onDismiss}>
            <IconSymbol ios_icon_name="xmark" android_material_icon_name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        )}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <AppLogo size={60} />
            <Text style={styles.title}>Unlock Premium</Text>
            <Text style={styles.subtitle}>
              Get unlimited access to all features
            </Text>
          </View>

          <View style={styles.featuresContainer}>
            <View style={styles.featureRow}>
              <IconSymbol ios_icon_name="checkmark.circle.fill" android_material_icon_name="check-circle" size={24} color={colors.success} />
              <Text style={styles.featureText}>Unlimited portion tracking</Text>
            </View>
            <View style={styles.featureRow}>
              <IconSymbol ios_icon_name="checkmark.circle.fill" android_material_icon_name="check-circle" size={24} color={colors.success} />
              <Text style={styles.featureText}>Weight tracking & charts</Text>
            </View>
            <View style={styles.featureRow}>
              <IconSymbol ios_icon_name="checkmark.circle.fill" android_material_icon_name="check-circle" size={24} color={colors.success} />
              <Text style={styles.featureText}>Adherence insights</Text>
            </View>
            <View style={styles.featureRow}>
              <IconSymbol ios_icon_name="checkmark.circle.fill" android_material_icon_name="check-circle" size={24} color={colors.success} />
              <Text style={styles.featureText}>Custom daily targets</Text>
            </View>
            <View style={styles.featureRow}>
              <IconSymbol ios_icon_name="checkmark.circle.fill" android_material_icon_name="check-circle" size={24} color={colors.success} />
              <Text style={styles.featureText}>Activity level adjustments</Text>
            </View>
          </View>

          {isTrialAvailable && (
            <View style={styles.trialBadge}>
              <Text style={styles.trialText}>7-day free trial</Text>
            </View>
          )}

          <View style={styles.plansContainer}>
            <TouchableOpacity
              style={[
                styles.planCard,
                selectedPlan === 'annual' && styles.planCardSelected,
              ]}
              onPress={() => setSelectedPlan('annual')}
            >
              <View style={styles.planHeader}>
                <Text style={styles.planName}>Annual</Text>
                {selectedPlan === 'annual' && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>Best Value</Text>
                  </View>
                )}
              </View>
              <Text style={styles.planPrice}>$24.99/year</Text>
              <Text style={styles.planDetail}>$2.08/month</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.planCard,
                selectedPlan === 'monthly' && styles.planCardSelected,
              ]}
              onPress={() => setSelectedPlan('monthly')}
            >
              <View style={styles.planHeader}>
                <Text style={styles.planName}>Monthly</Text>
              </View>
              <Text style={styles.planPrice}>$2.99/month</Text>
              <Text style={styles.planDetail}>Billed monthly</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[buttonStyles.primary, styles.subscribeButton]}
            onPress={handleSubscribe}
          >
            <Text style={buttonStyles.primaryText}>{getButtonText()}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestorePurchases}
          >
            <Text style={styles.restoreText}>Restore Purchases</Text>
          </TouchableOpacity>

          <View style={styles.legalContainer}>
            <Text style={styles.legalText}>
              By continuing, you agree to our{' '}
              <Text
                style={styles.legalLink}
                onPress={() =>
                  Linking.openURL(
                    'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/'
                  )
                }
              >
                Terms of Use
              </Text>{' '}
              and{' '}
              <Text
                style={styles.legalLink}
                onPress={() =>
                  Linking.openURL('https://portiontrack.com/privacy-policy')
                }
              >
                Privacy Policy
              </Text>
              .
            </Text>
          </View>

          {isTrialAvailable && (
            <Text style={styles.disclaimer}>
              Your subscription will automatically renew unless cancelled at least 24
              hours before the end of the current period. You can manage your
              subscription in your App Store account settings.
            </Text>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    ...commonStyles.shadow,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 17,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  featuresContainer: {
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  featureText: {
    fontSize: 17,
    color: colors.text,
    flex: 1,
  },
  trialBadge: {
    backgroundColor: colors.primaryLight,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  trialText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.primary,
  },
  plansContainer: {
    marginBottom: 24,
    gap: 12,
  },
  planCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.border,
  },
  planCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  planName: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  popularBadge: {
    backgroundColor: colors.primary,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  popularText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  planPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  planDetail: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  subscribeButton: {
    marginBottom: 16,
  },
  restoreButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  restoreText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  legalContainer: {
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  legalText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  legalLink: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  disclaimer: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 8,
  },
});
