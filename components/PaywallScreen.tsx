
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

const PaywallScreen: React.FC<PaywallScreenProps> = ({
  visible,
  onDismiss,
  isTrialAvailable,
  trialDaysRemaining,
  canDismiss = false,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    setIsLoading(true);
    // TODO: Implement subscription logic
    setTimeout(() => {
      setIsLoading(false);
      onDismiss?.();
    }, 1000);
  };

  const handleRestorePurchases = async () => {
    setIsLoading(true);
    // TODO: Implement restore purchases logic
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
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
    if (isTrialAvailable) {
      return selectedPlan === 'annual'
        ? 'Start 7-Day Free Trial — Then $24.99/year'
        : 'Start 7-Day Free Trial — Then $2.99/month';
    }
    return selectedPlan === 'annual' ? 'Subscribe for $24.99/year' : 'Subscribe for $2.99/month';
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {canDismiss && onDismiss && (
          <TouchableOpacity style={styles.closeButton} onPress={onDismiss}>
            <IconSymbol 
              ios_icon_name="xmark.circle.fill" 
              android_material_icon_name="close" 
              size={32} 
              color={colors.text} 
            />
          </TouchableOpacity>
        )}

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <AppLogo size={80} />
            <Text style={styles.title}>Unlock Full Access</Text>
            <Text style={styles.subtitle}>
              Get full access to the app and start tracking your portions today
            </Text>
          </View>

          {isTrialAvailable && trialDaysRemaining !== undefined && trialDaysRemaining > 0 && (
            <View style={styles.trialBanner}>
              <Text style={styles.trialText}>
                {trialDaysRemaining} {trialDaysRemaining === 1 ? 'day' : 'days'} left in your trial
              </Text>
            </View>
          )}

          <View style={styles.plansContainer}>
            <TouchableOpacity
              style={[styles.planCard, selectedPlan === 'annual' && styles.planCardSelected]}
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
              {isTrialAvailable && <Text style={styles.trialLabel}>7-day free trial</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.planCard, selectedPlan === 'monthly' && styles.planCardSelected]}
              onPress={() => setSelectedPlan('monthly')}
            >
              <View style={styles.planHeader}>
                <Text style={styles.planName}>Monthly</Text>
              </View>
              <Text style={styles.planPrice}>$2.99/month</Text>
              <Text style={styles.planDetail}>Billed monthly</Text>
              {isTrialAvailable && <Text style={styles.trialLabel}>7-day free trial</Text>}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[buttonStyles.primary, styles.subscribeButton]}
            onPress={handleSubscribe}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={buttonStyles.primaryText}>{getButtonText()}</Text>
            )}
          </TouchableOpacity>

          <View style={styles.actions}>
            <TouchableOpacity onPress={handleRestorePurchases} disabled={isLoading}>
              <Text style={styles.linkText}>Restore Purchases</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleManageSubscription}>
              <Text style={styles.linkText}>Manage Subscription</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.legalContainer}>
            <Text style={styles.legalDisclaimerText}>
              By continuing, you agree to our{' '}
              <Text
                style={styles.legalLinkText}
                onPress={() => Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/')}
              >
                Terms of Use
              </Text>
              {' '}and{' '}
              <Text
                style={styles.legalLinkText}
                onPress={() => Linking.openURL('https://portiontrack.com/privacy-policy')}
              >
                Privacy Policy
              </Text>
              .
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 8,
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
  },
  content: {
    padding: 24,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  trialBanner: {
    backgroundColor: colors.primary + '20',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    alignItems: 'center',
  },
  trialText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  plansContainer: {
    marginBottom: 24,
  },
  planCard: {
    backgroundColor: colors.cardBackground,
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  planCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  popularBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  popularText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  planPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  planDetail: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  trialLabel: {
    fontSize: 12,
    color: colors.primary,
    marginTop: 8,
    fontWeight: '600',
  },
  subscribeButton: {
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  linkText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  legalContainer: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  legalDisclaimerText: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  legalLinkText: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
});

export default PaywallScreen;
