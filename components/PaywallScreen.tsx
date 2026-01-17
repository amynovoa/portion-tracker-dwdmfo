
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
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { getProductDetails } from '@/utils/subscriptionManager';
import { PRODUCT_IDS, PRODUCT_CONFIG } from '@/utils/superwallConfig';
import Constants from 'expo-constants';

interface PaywallScreenProps {
  visible: boolean;
  onDismiss?: () => void;
  canDismiss?: boolean;
}

interface ProductDetails {
  productId: string;
  price: number;
  priceString: string;
  currencyCode: string;
}

const isExpoGo = Constants.appOwnership === 'expo';

// Superwall hooks - will be null if not available
let usePlacement: any = null;
let useUser: any = null;
let superwallAvailable = false;

// Try to load Superwall only if not in Expo Go
if (!isExpoGo) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Superwall = require('expo-superwall');
    usePlacement = Superwall.usePlacement;
    useUser = Superwall.useUser;
    superwallAvailable = true;
    console.log('✅ Superwall module loaded successfully');
  } catch (error) {
    console.log('⚠️ Superwall module not available:', error);
    superwallAvailable = false;
  }
}

export default function PaywallScreen({ visible, onDismiss, canDismiss = true }: PaywallScreenProps) {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
  const [productDetails, setProductDetails] = useState<{
    monthly?: ProductDetails;
    annual?: ProductDetails;
  }>({});

  // Always call hooks at top level - React requirement
  // These will be null/undefined if Superwall is not available
  let registerPlacement: any = null;
  let placementState: any = null;
  let subscriptionStatus: any = null;

  // Call Superwall hooks at top level if available
  if (superwallAvailable && usePlacement) {
    // Use Superwall's usePlacement hook to handle purchases
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const placement = usePlacement({
      onPresent: (info: any) => {
        console.log('PaywallScreen: Superwall paywall presented:', info);
      },
      onDismiss: (info: any, result: any) => {
        console.log('PaywallScreen: Superwall paywall dismissed:', info, 'Result:', result);
        setLoading(false);
        
        // Check if purchase was successful
        if (result.state === 'purchased') {
          console.log('PaywallScreen: Purchase successful!');
          Alert.alert('Success', 'Thank you for subscribing!');
          onDismiss?.();
        } else if (result.state === 'restored') {
          console.log('PaywallScreen: Purchases restored!');
          Alert.alert('Success', 'Your purchases have been restored!');
          onDismiss?.();
        }
      },
      onError: (error: any) => {
        console.error('PaywallScreen: Superwall error:', error);
        setLoading(false);
        Alert.alert('Error', 'An error occurred. Please try again.');
      },
      onSkip: (reason: any) => {
        console.log('PaywallScreen: Paywall skipped:', reason);
        setLoading(false);
      },
    });
    
    registerPlacement = placement.registerPlacement;
    placementState = placement.state;
  }

  if (superwallAvailable && useUser) {
    // Use Superwall's useUser hook to get subscription status
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const user = useUser();
    subscriptionStatus = user.subscriptionStatus;
  }

  useEffect(() => {
    if (visible && !isExpoGo) {
      console.log('PaywallScreen: Loading product details');
      loadProductDetails();
    }
  }, [visible]);

  const loadProductDetails = async () => {
    try {
      console.log('PaywallScreen: Fetching product details from App Store');
      const [monthly, annual] = await Promise.all([
        getProductDetails(PRODUCT_IDS.monthly),
        getProductDetails(PRODUCT_IDS.annual),
      ]);

      console.log('PaywallScreen: Product details loaded', { monthly, annual });
      setProductDetails({ monthly, annual });
    } catch (error) {
      console.error('PaywallScreen: Error loading product details:', error);
    }
  };

  const handleSubscribe = async () => {
    if (isExpoGo || !superwallAvailable || !registerPlacement) {
      console.log('PaywallScreen: Cannot purchase - Superwall not available');
      Alert.alert(
        'Development Mode', 
        'Subscriptions are not available in Expo Go. Please create a development build to test purchases.\n\nRun: npx expo prebuild && npx expo run:ios'
      );
      return;
    }

    const productId = selectedPlan === 'monthly' ? PRODUCT_IDS.monthly : PRODUCT_IDS.annual;
    console.log('PaywallScreen: User tapped Subscribe button for', productId);
    setLoading(true);
    
    try {
      console.log('PaywallScreen: Triggering Superwall placement');
      
      // Use Superwall's registerPlacement to trigger the purchase flow
      await registerPlacement({
        placement: 'subscription_paywall',
        params: {
          selectedProduct: productId,
        },
        feature: () => {
          // This is called if the user already has access or successfully purchases
          console.log('PaywallScreen: User has access to feature');
          Alert.alert('Success', 'Thank you for subscribing!');
          onDismiss?.();
        },
      });
    } catch (error) {
      console.error('PaywallScreen: Purchase error:', error);
      setLoading(false);
      Alert.alert('Error', 'An error occurred. Please try again.');
    }
  };

  const handleRestorePurchases = async () => {
    if (isExpoGo || !superwallAvailable || !registerPlacement) {
      console.log('PaywallScreen: Cannot restore - Superwall not available');
      Alert.alert(
        'Development Mode', 
        'Restore purchases is not available in Expo Go. Please create a development build to test.\n\nRun: npx expo prebuild && npx expo run:ios'
      );
      return;
    }

    console.log('PaywallScreen: User tapped Restore Purchases');
    setLoading(true);
    
    try {
      console.log('PaywallScreen: Triggering Superwall restore');
      
      // Trigger Superwall placement with restore intent
      await registerPlacement({
        placement: 'restore_purchases',
        feature: () => {
          console.log('PaywallScreen: Purchases restored successfully');
          Alert.alert('Success', 'Your purchases have been restored!');
          onDismiss?.();
        },
      });
    } catch (error) {
      console.error('PaywallScreen: Restore error:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
    }
  };

  const openPrivacyPolicy = () => {
    console.log('PaywallScreen: Opening privacy policy');
    Linking.openURL('https://www.portiontrack.com/privacy-policy');
  };

  const openTermsOfService = () => {
    console.log('PaywallScreen: Opening terms of service');
    Linking.openURL('https://www.apple.com/legal/internet-services/itunes/');
  };

  const getButtonText = () => {
    if (selectedPlan === 'monthly') {
      const price = productDetails.monthly?.priceString || '$2.99';
      return `7 day free trial then ${price}/month`;
    } else {
      const price = productDetails.annual?.priceString || '$24.99';
      return `7 day free trial then ${price}/year`;
    }
  };

  // Show development message in Expo Go
  if (isExpoGo || !superwallAvailable) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            {canDismiss && (
              <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
                <MaterialIcons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
            <View style={styles.devMessageContainer}>
              <MaterialIcons name="info" size={64} color={colors.primary} />
              <Text style={styles.devTitle}>Development Mode</Text>
              <Text style={styles.devMessage}>
                You&apos;re running in {isExpoGo ? 'Expo Go' : 'a mode'} where the Superwall native module is not available.
              </Text>
              <Text style={styles.devMessage}>
                To test subscriptions, create a development build:
              </Text>
              <View style={styles.codeBlock}>
                <Text style={styles.codeText}>npx expo prebuild</Text>
                <Text style={styles.codeText}>npx expo run:ios</Text>
              </View>
              <Text style={styles.devMessage}>
                Or build with EAS:
              </Text>
              <View style={styles.codeBlock}>
                <Text style={styles.codeText}>eas build --profile development --platform ios</Text>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          {canDismiss && (
            <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
              <MaterialIcons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <Text style={styles.title}>7-day free trial. Cancel anytime.</Text>
          <Text style={styles.subtitle}>
            Payment will be charged to your Apple ID at confirmation of purchase or at the end of the trial. Subscription automatically renews unless canceled at least 24 hours before the end of the period.
          </Text>

          <Text style={styles.subscriptionIncludesTitle}>Subscription includes:</Text>

          <View style={styles.featuresContainer}>
            <FeatureItem text="Unlimited portion tracking" />
            <FeatureItem text="Custom portion targets" />
            <FeatureItem text="Weight tracking & charts" />
            <FeatureItem text="Adherence history & trends" />
            <FeatureItem text="Daily reminders" />
          </View>

          <View style={styles.plansContainer}>
            {/* Annual Plan - First with Best Value badge */}
            <TouchableOpacity
              style={[
                styles.planCard,
                selectedPlan === 'annual' && styles.planCardSelected,
                loading && styles.planCardDisabled
              ]}
              onPress={() => setSelectedPlan('annual')}
              disabled={loading}
            >
              <View style={styles.bestValueBadge}>
                <Text style={styles.bestValueText}>Best Value</Text>
              </View>
              <View style={styles.planHeader}>
                <View style={styles.planInfo}>
                  <Text style={styles.planName}>Annual</Text>
                  <Text style={styles.planPrice}>
                    {productDetails.annual?.priceString || PRODUCT_CONFIG[PRODUCT_IDS.annual].defaultPrice}
                  </Text>
                </View>
                <View style={[styles.radioButton, selectedPlan === 'annual' && styles.radioButtonSelected]}>
                  {selectedPlan === 'annual' && <View style={styles.radioButtonInner} />}
                </View>
              </View>
            </TouchableOpacity>

            {/* Monthly Plan - Second */}
            <TouchableOpacity
              style={[
                styles.planCard,
                selectedPlan === 'monthly' && styles.planCardSelected,
                loading && styles.planCardDisabled
              ]}
              onPress={() => setSelectedPlan('monthly')}
              disabled={loading}
            >
              <View style={styles.planHeader}>
                <View style={styles.planInfo}>
                  <Text style={styles.planName}>Monthly</Text>
                  <Text style={styles.planPrice}>
                    {productDetails.monthly?.priceString || PRODUCT_CONFIG[PRODUCT_IDS.monthly].defaultPrice}
                  </Text>
                </View>
                <View style={[styles.radioButton, selectedPlan === 'monthly' && styles.radioButtonSelected]}>
                  {selectedPlan === 'monthly' && <View style={styles.radioButtonInner} />}
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Terms Agreement */}
          <View style={styles.termsContainer}>
            <Text style={styles.termsText}>
              By clicking I agree to the{' '}
              <Text style={styles.termsLink} onPress={openTermsOfService}>
                Terms of Service
              </Text>
              {' '}and{' '}
              <Text style={styles.termsLink} onPress={openPrivacyPolicy}>
                Privacy Policy
              </Text>
            </Text>
          </View>

          {/* Purchase Button */}
          <TouchableOpacity
            style={[buttonStyles.primary, styles.purchaseButton, loading && styles.buttonDisabled]}
            onPress={handleSubscribe}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={buttonStyles.primaryText}>{getButtonText()}</Text>
            )}
          </TouchableOpacity>

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
      <MaterialIcons name="check-circle" size={24} color={colors.primary} />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  subscriptionIncludesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  featuresContainer: {
    marginBottom: 32,
  },
  featureItem: {
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
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.border,
    position: 'relative',
  },
  planCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight || colors.cardBackground,
  },
  planCardDisabled: {
    opacity: 0.6,
  },
  bestValueBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  bestValueText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: colors.primary,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  termsContainer: {
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  termsText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  termsLink: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  purchaseButton: {
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  restoreButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  restoreButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  devMessageContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  devTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 24,
    marginBottom: 16,
  },
  devMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  codeBlock: {
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
    padding: 16,
    marginVertical: 12,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 14,
    color: colors.primary,
    marginBottom: 8,
  },
});
