
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
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import {
  purchaseProduct,
  restorePurchases,
  PRODUCT_IDS,
  ProductDetails,
} from '@/utils/subscriptionManager';
import { loadProfile } from '@/utils/storage';
import { markSubscribed } from '@/utils/userStateManager';
import { useSubscription } from '@/contexts/SubscriptionContext';

interface PaywallScreenProps {
  visible: boolean;
  onDismiss?: () => void;
  canDismiss?: boolean;
  onSubscribeSuccess?: () => void;
}

type SubscriptionPlan = 'monthly' | 'annual';

export default function PaywallScreen({ visible, onDismiss, canDismiss = true, onSubscribeSuccess }: PaywallScreenProps) {
  const router = useRouter();
  const { refreshSubscription } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('annual');
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Products are always ready — prices are hardcoded fallbacks
  const loadingProducts = false;

  useEffect(() => {
    if (visible) {
      setLoading(false);
      setDismissed(false);
      console.log('[Paywall] Paywall opened');
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      setLoading(false);
    }
  }, [visible]);

  const handlePurchaseSuccess = async () => {
    setDismissed(true);
    console.log('[Paywall] handlePurchaseSuccess — persisting subscription before navigation');

    // Persist to both AsyncStorage keys synchronously before navigating
    await markSubscribed(true);
    await refreshSubscription();

    if (onSubscribeSuccess) {
      console.log('[Paywall] Delegating navigation to onSubscribeSuccess callback');
      onSubscribeSuccess();
      return;
    }

    const profile = await loadProfile();
    const hasProfile = profile && profile.portionTargets;
    console.log('[Paywall] Profile exists:', !!profile, 'hasTargets:', !!hasProfile);

    if (hasProfile) {
      console.log('[Paywall] Navigating to (tabs)');
      router.replace('/(tabs)');
    } else {
      console.log('[Paywall] Navigating to setup-profile');
      router.replace('/setup-profile');
    }
  };

  const handleSubscribe = () => {
    const productId = selectedPlan === 'monthly' ? PRODUCT_IDS.MONTHLY : PRODUCT_IDS.ANNUAL;
    console.log('[Paywall] Subscribe tapped — plan:', selectedPlan, 'productId:', productId);

    setLoading(true);

    // Start safety timer immediately — purchaseItemAsync promise never resolves,
    // results come back through setPurchaseListener only
    const safetyTimer = setTimeout(() => {
      console.warn('[Paywall] Safety timer fired — no listener response after 30s');
      setLoading(false);
      Alert.alert('Purchase Timed Out', 'The purchase did not complete. Please try again.', [{ text: 'OK' }]);
    }, 30000);

    purchaseProduct(
      productId,
      async () => {
        clearTimeout(safetyTimer);
        console.log('[Paywall] onSuccess fired');
        setLoading(false);
        await handlePurchaseSuccess();
      },
      () => {
        clearTimeout(safetyTimer);
        console.log('[Paywall] onCancelled fired');
        setLoading(false);
      },
      (message) => {
        clearTimeout(safetyTimer);
        console.error('[Paywall] onError fired:', message);
        setLoading(false);
        Alert.alert('Purchase Failed', message, [{ text: 'OK' }]);
      }
    );
  };

  const handleRestorePurchases = async () => {
    console.log('[Paywall] Restore Purchases tapped');
    setLoading(true);

    try {
      const result = await restorePurchases();
      console.log('[Paywall] Restore result — success:', result.success, 'error:', result.error);

      if (result.success) {
        Alert.alert(
          'Success!',
          'Your subscription has been restored.',
          [
            {
              text: 'OK',
              onPress: () => {
                console.log('[Paywall] Restore acknowledged — navigating');
                handlePurchaseSuccess();
              },
            },
          ]
        );
      } else {
        Alert.alert(
          'No Active Subscription Found',
          result.error || 'No previous purchases found to restore.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('[Paywall] Restore error:', error);
      Alert.alert('Error', error?.message || 'Unable to restore purchases. Please try again.', [{ text: 'OK' }]);
    } finally {
      setLoading(false);
    }
  };

  const openPrivacyPolicy = () => {
    console.log('[Paywall] Opening privacy policy');
    Linking.openURL('https://www.portiontrack.com/privacy-policy');
  };

  const openTermsOfService = () => {
    console.log('[Paywall] Opening terms of service');
    Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/');
  };

  const getMonthlyPrice = () => '$3.99';
  const getAnnualPrice = () => '$29.99';

  const titleText = '7 day free trial.';
  const subtitleText = 'Cancel anytime.';

  const buttonText = `7 day free trial then ${selectedPlan === 'monthly' ? getMonthlyPrice() : getAnnualPrice()}${selectedPlan === 'monthly' ? '/month' : '/year'}`;

  const disclosureText = 'Payment will be charged to your Apple ID at confirmation of purchase or at the end of the trial. Subscription automatically renews unless canceled at least 24 hours before the end of the period.';

  return (
    <Modal
      visible={visible && !dismissed}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => {
        if (canDismiss && onDismiss) {
          console.log('[Paywall] User dismissed paywall');
          onDismiss();
        }
      }}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {canDismiss && (
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              console.log('[Paywall] User tapped close button');
              if (onDismiss) {
                onDismiss();
              }
            }}
          >
            <MaterialIcons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
        )}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>
              {titleText}
              {'\n'}
              {subtitleText}
            </Text>
          </View>

          <View style={styles.featuresContainer}>
            <Text style={styles.featuresTitle}>A simple way to eat well and build healthy habits for life.</Text>
            <FeatureItem text="Unlimited portion tracking" />
            <FeatureItem text="Healthy portion guidance" />
            <FeatureItem text="Custom portion targets" />
            <FeatureItem text="Weight tracking & charts" />
            <FeatureItem text="Progress history & trends" />
            <FeatureItem text="Daily reminders" />
          </View>

          <View style={styles.plansContainer}>
            <TouchableOpacity
              style={[
                styles.planCard,
                selectedPlan === 'annual' && styles.planCardSelected,
              ]}
              onPress={() => {
                console.log('[Paywall] User selected annual plan');
                setSelectedPlan('annual');
              }}
            >
              {selectedPlan === 'annual' && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>Best Value</Text>
                </View>
              )}
              <View style={styles.planHeader}>
                <Text style={styles.planName}>Annual</Text>
                <View style={styles.radioButton}>
                  {selectedPlan === 'annual' && <View style={styles.radioButtonInner} />}
                </View>
              </View>
              <Text style={styles.planPrice}>{getAnnualPrice()}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.planCard,
                selectedPlan === 'monthly' && styles.planCardSelected,
              ]}
              onPress={() => {
                console.log('[Paywall] User selected monthly plan');
                setSelectedPlan('monthly');
              }}
            >
              <View style={styles.planHeader}>
                <Text style={styles.planName}>Monthly</Text>
                <View style={styles.radioButton}>
                  {selectedPlan === 'monthly' && <View style={styles.radioButtonInner} />}
                </View>
              </View>
              <Text style={styles.planPrice}>{getMonthlyPrice()}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By clicking I agree to the{' '}
              <Text style={styles.footerLink} onPress={openTermsOfService}>
                Terms of Service
              </Text>
              {' '}and{' '}
              <Text style={styles.footerLink} onPress={openPrivacyPolicy}>
                Privacy Policy
              </Text>
            </Text>
          </View>

          <TouchableOpacity
            style={[
              buttonStyles.primary,
              styles.subscribeButton,
            ]}
            onPress={handleSubscribe}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={buttonStyles.primaryText}>
                {buttonText}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.disclosureContainer}>
            <Text style={styles.disclosureText}>
              {disclosureText}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestorePurchases}
            disabled={loading}
          >
            <Text style={styles.restoreButtonText}>Restore Purchases</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <View style={styles.featureItem}>
      <MaterialIcons name="check-circle" size={20} color={colors.primary} />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 20,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  featuresContainer: {
    marginBottom: 32,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: colors.border,
  },
  planCardSelected: {
    borderColor: colors.primary,
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.surface,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  subscribeButton: {
    marginBottom: 16,
  },
  disclosureContainer: {
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  disclosureText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  restoreButton: {
    padding: 16,
    alignItems: 'center',
  },
  restoreButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  footer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLink: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
});
