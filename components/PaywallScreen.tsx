
import React, { useState, useEffect } from 'react';
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
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import AppLogo from '@/components/AppLogo';
import { IconSymbol } from '@/components/IconSymbol';

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
  trialDaysRemaining = 7,
  canDismiss = false,
}: PaywallScreenProps) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    setIsLoading(true);
    
    try {
      // TODO: Integrate with Superwall
      // For now, this is a placeholder
      console.log('Subscribe to plan:', selectedPlan);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // After successful subscription, dismiss the paywall
      if (onDismiss) {
        onDismiss();
      }
    } catch (error) {
      console.error('Error subscribing:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestorePurchases = async () => {
    setIsLoading(true);
    
    try {
      // TODO: Integrate with Superwall restore purchases
      console.log('Restoring purchases...');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // After successful restore, dismiss the paywall
      if (onDismiss) {
        onDismiss();
      }
    } catch (error) {
      console.error('Error restoring purchases:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageSubscription = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('https://apps.apple.com/account/subscriptions');
    } else if (Platform.OS === 'android') {
      Linking.openURL('https://play.google.com/store/account/subscriptions');
    }
  };

  const handlePrivacyPolicy = () => {
    // TODO: Add your privacy policy URL
    Linking.openURL('https://yourapp.com/privacy');
  };

  const handleTermsOfUse = () => {
    // TODO: Add your terms of use URL
    Linking.openURL('https://yourapp.com/terms');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={canDismiss ? onDismiss : undefined}
    >
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {canDismiss && onDismiss && (
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onDismiss}
              activeOpacity={0.7}
            >
              <IconSymbol
                ios_icon_name="xmark"
                android_material_icon_name="close"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          )}

          <View style={styles.logoContainer}>
            <AppLogo size={80} />
          </View>

          <Text style={styles.title}>Unlock Portion Track</Text>
          <Text style={styles.subtitle}>
            Simple portions. Real-life flexibility.
          </Text>

          {isTrialAvailable && (
            <View style={styles.trialBadge}>
              <Text style={styles.trialBadgeText}>
                ✨ {trialDaysRemaining}-Day Free Trial
              </Text>
            </View>
          )}

          <View style={styles.featuresContainer}>
            <View style={styles.featureRow}>
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check_circle"
                size={24}
                color={colors.primary}
              />
              <Text style={styles.featureText}>
                Track portions from 8 key food groups
              </Text>
            </View>
            <View style={styles.featureRow}>
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check_circle"
                size={24}
                color={colors.primary}
              />
              <Text style={styles.featureText}>
                Personalized targets based on your goals
              </Text>
            </View>
            <View style={styles.featureRow}>
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check_circle"
                size={24}
                color={colors.primary}
              />
              <Text style={styles.featureText}>
                Track adherence and progress over time
              </Text>
            </View>
            <View style={styles.featureRow}>
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check_circle"
                size={24}
                color={colors.primary}
              />
              <Text style={styles.featureText}>
                No calorie counting or rigid rules
              </Text>
            </View>
          </View>

          <View style={styles.plansContainer}>
            <TouchableOpacity
              style={[
                styles.planCard,
                selectedPlan === 'annual' && styles.planCardSelected,
              ]}
              onPress={() => setSelectedPlan('annual')}
              activeOpacity={0.7}
            >
              <View style={styles.planHeader}>
                <View style={styles.planRadio}>
                  {selectedPlan === 'annual' && (
                    <View style={styles.planRadioSelected} />
                  )}
                </View>
                <View style={styles.planInfo}>
                  <Text style={styles.planName}>Annual</Text>
                  <Text style={styles.planPrice}>$24.99/year</Text>
                </View>
                <View style={styles.bestValueBadge}>
                  <Text style={styles.bestValueText}>Best Value</Text>
                </View>
              </View>
              <Text style={styles.planDescription}>
                Just $2.08/month • Save 30%
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.planCard,
                selectedPlan === 'monthly' && styles.planCardSelected,
              ]}
              onPress={() => setSelectedPlan('monthly')}
              activeOpacity={0.7}
            >
              <View style={styles.planHeader}>
                <View style={styles.planRadio}>
                  {selectedPlan === 'monthly' && (
                    <View style={styles.planRadioSelected} />
                  )}
                </View>
                <View style={styles.planInfo}>
                  <Text style={styles.planName}>Monthly</Text>
                  <Text style={styles.planPrice}>$2.99/month</Text>
                </View>
              </View>
              <Text style={styles.planDescription}>
                Billed monthly
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[buttonStyles.primary, styles.subscribeButton]}
            onPress={handleSubscribe}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={commonStyles.buttonText}>
                {isTrialAvailable
                  ? `Start ${trialDaysRemaining}-Day Free Trial`
                  : 'Subscribe Now'}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.linksContainer}>
            <TouchableOpacity
              style={styles.linkButton}
              onPress={handleRestorePurchases}
              disabled={isLoading}
            >
              <Text style={styles.linkText}>Restore Purchases</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={handleManageSubscription}
            >
              <Text style={styles.linkText}>Manage Subscription</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.legalLinksContainer}>
            <TouchableOpacity onPress={handlePrivacyPolicy}>
              <Text style={styles.legalLinkText}>Privacy Policy</Text>
            </TouchableOpacity>
            <Text style={styles.legalSeparator}>•</Text>
            <TouchableOpacity onPress={handleTermsOfUse}>
              <Text style={styles.legalLinkText}>Terms of Use</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.disclosureContainer}>
            <Text style={styles.disclosureText}>
              Payment will be charged to your Apple ID at confirmation of purchase.
              Subscription automatically renews unless cancelled at least 24 hours
              before the end of the current period. Your account will be charged for
              renewal within 24 hours prior to the end of the current period. You can
              manage and cancel your subscriptions by going to your App Store account
              settings after purchase.
            </Text>
          </View>

          <View style={styles.bottomPadding} />
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
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  trialBadge: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 32,
  },
  trialBadgeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  featuresContainer: {
    marginBottom: 32,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureText: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
    flex: 1,
  },
  plansContainer: {
    marginBottom: 24,
  },
  planCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: colors.border,
  },
  planCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.highlight,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  planRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  planRadioSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  planPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  bestValueBadge: {
    backgroundColor: colors.primary,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  bestValueText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  planDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 36,
  },
  subscribeButton: {
    marginBottom: 24,
  },
  linksContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 24,
  },
  linkButton: {
    paddingVertical: 8,
  },
  linkText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  legalLinksContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  legalLinkText: {
    fontSize: 14,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
  legalSeparator: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  disclosureContainer: {
    paddingHorizontal: 8,
  },
  disclosureText: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  bottomPadding: {
    height: 20,
  },
});
