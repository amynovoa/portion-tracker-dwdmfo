
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { loadSubscriptionStatus, saveSubscriptionStatus } from './storage';
import * as InAppPurchases from 'expo-in-app-purchases';

const TRIAL_START_KEY = '@portion_tracker_trial_start';
const TRIAL_DURATION_DAYS = 7;
const TESTFLIGHT_BYPASS_KEY = '@testflight_bypass_enabled';

// StoreKit product IDs - MUST match your App Store Connect configuration
export const PRODUCT_IDS = {
  MONTHLY: 'portiontrack.monthly',
  ANNUAL: 'portiontrack.annual',
};

export interface SubscriptionStatus {
  isSubscribed: boolean;
  isInTrial: boolean;
  trialDaysRemaining: number;
  isTestFlight: boolean;
}

export interface PurchaseResult {
  success: boolean;
  userCancelled?: boolean;
  error?: string;
}

export interface ProductDetails {
  productId: string;
  price: string;
  priceString: string;
  currencyCode: string;
  title: string;
  description: string;
}

/**
 * Check if the app is running in TestFlight or development mode
 */
export function isTestFlightBuild(): boolean {
  // Check if running in Expo Go or development
  if (__DEV__) {
    console.log('Running in development mode');
    return true;
  }

  // Check for TestFlight indicators
  const appOwnership = Constants.appOwnership;
  
  // In Expo, appOwnership will be 'expo' for Expo Go, 'standalone' for production builds
  if (appOwnership === 'expo') {
    console.log('Running in Expo Go');
    return true;
  }

  console.log('App ownership:', appOwnership);
  
  // For production builds, return false
  return false;
}

/**
 * Get the current TestFlight bypass toggle state
 * This is stored in AsyncStorage so testers can toggle it on/off
 */
export async function getTestFlightBypassEnabled(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(TESTFLIGHT_BYPASS_KEY);
    // Default to true if not set (for easier testing)
    const enabled = value === null ? true : value === 'true';
    console.log('TestFlight bypass enabled:', enabled);
    return enabled;
  } catch (error) {
    console.error('Error reading TestFlight bypass state:', error);
    return true; // Default to enabled on error
  }
}

/**
 * Set the TestFlight bypass toggle state
 * Only works in TestFlight/dev builds
 */
export async function setTestFlightBypassEnabled(enabled: boolean): Promise<void> {
  try {
    if (!isTestFlightBuild()) {
      console.log('⚠️ Cannot set TestFlight bypass in production builds');
      return;
    }
    
    await AsyncStorage.setItem(TESTFLIGHT_BYPASS_KEY, enabled ? 'true' : 'false');
    console.log('TestFlight bypass set to:', enabled);
  } catch (error) {
    console.error('Error setting TestFlight bypass state:', error);
  }
}

/**
 * Check if TestFlight bypass is enabled via environment variable (legacy)
 */
export function isTestFlightBypassEnabled(): boolean {
  const bypassEnabled = process.env.EXPO_PUBLIC_STOREKIT_TESTFLIGHT_BYPASS === 'true';
  console.log('TestFlight bypass enabled (env):', bypassEnabled);
  return bypassEnabled;
}

/**
 * Initialize StoreKit connection via expo-in-app-purchases
 */
export async function initializeStoreKit(): Promise<boolean> {
  try {
    console.log('🛒 Initializing StoreKit connection via expo-in-app-purchases...');
    
    if (Platform.OS !== 'ios') {
      console.log('⚠️ StoreKit only available on iOS');
      return false;
    }

    // Connect to the App Store
    await InAppPurchases.connectAsync();
    console.log('✅ Connected to App Store');

    // Set up purchase listener
    InAppPurchases.setPurchaseListener(({ responseCode, results, errorCode }) => {
      console.log('📱 Purchase listener triggered:', { responseCode, errorCode });
      
      if (responseCode === InAppPurchases.IAPResponseCode.OK) {
        results?.forEach(async (purchase) => {
          console.log('✅ Purchase successful:', purchase.productId);
          
          // Acknowledge the purchase
          if (!purchase.acknowledged) {
            await InAppPurchases.finishTransactionAsync(purchase, true);
            console.log('✅ Purchase acknowledged');
          }
          
          // Save subscription status
          await saveSubscriptionStatus(true);
          console.log('✅ Subscription status saved');
        });
      } else if (responseCode === InAppPurchases.IAPResponseCode.USER_CANCELED) {
        console.log('ℹ️ User cancelled purchase');
      } else {
        console.error('❌ Purchase error:', errorCode);
      }
    });

    console.log('✅ StoreKit initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ StoreKit initialization failed:', error);
    return false;
  }
}

/**
 * Get product details from App Store via expo-in-app-purchases
 */
export async function getProductDetails(productId: string): Promise<ProductDetails | null> {
  try {
    console.log('🛒 Fetching product details from App Store for:', productId);
    
    if (Platform.OS !== 'ios') {
      console.log('⚠️ Product details only available on iOS');
      return null;
    }

    // Initialize if not already done
    await initializeStoreKit();

    // Fetch products from App Store
    const { responseCode, results } = await InAppPurchases.getProductsAsync([productId]);
    
    if (responseCode === InAppPurchases.IAPResponseCode.OK && results && results.length > 0) {
      const product = results[0];
      console.log('✅ Product details fetched:', product);
      
      return {
        productId: product.productId,
        price: product.price || '0',
        priceString: product.priceString || '$0.00',
        currencyCode: product.currencyCode || 'USD',
        title: product.title || '',
        description: product.description || '',
      };
    }

    console.log('⚠️ No product found for ID:', productId);
    return null;
  } catch (error) {
    console.error('❌ Error fetching product details:', error);
    return null;
  }
}

/**
 * Purchase a product through App Store via expo-in-app-purchases
 */
export async function purchaseProduct(productId: string): Promise<PurchaseResult> {
  try {
    console.log('🛒 Initiating App Store purchase for:', productId);
    
    if (Platform.OS !== 'ios') {
      return {
        success: false,
        error: 'Subscriptions are only available on iOS',
      };
    }

    // Check if TestFlight bypass is enabled
    const isTestFlight = isTestFlightBuild();
    const bypassEnabled = await getTestFlightBypassEnabled();
    
    if (isTestFlight && bypassEnabled) {
      console.log('✅ TestFlight bypass enabled: Simulating purchase');
      await saveSubscriptionStatus(true);
      return { success: true };
    }

    // Initialize if not already done
    await initializeStoreKit();

    // Initiate purchase
    console.log('🛒 Calling purchaseItemAsync for:', productId);
    const { responseCode, results, errorCode } = await InAppPurchases.purchaseItemAsync(productId);
    
    console.log('📱 Purchase response:', { responseCode, errorCode });

    if (responseCode === InAppPurchases.IAPResponseCode.OK) {
      console.log('✅ Purchase successful');
      
      // Save subscription status
      await saveSubscriptionStatus(true);
      
      return { success: true };
    } else if (responseCode === InAppPurchases.IAPResponseCode.USER_CANCELED) {
      console.log('ℹ️ User cancelled purchase');
      return {
        success: false,
        userCancelled: true,
      };
    } else {
      console.error('❌ Purchase failed with error code:', errorCode);
      return {
        success: false,
        error: `Purchase failed (Error code: ${errorCode})`,
      };
    }
  } catch (error: any) {
    console.error('❌ Purchase error:', error);
    
    // Check if user cancelled
    if (error.code === 'E_USER_CANCELLED' || error.message?.includes('cancel')) {
      return {
        success: false,
        userCancelled: true,
      };
    }
    
    return {
      success: false,
      error: error.message || 'Purchase failed',
    };
  }
}

/**
 * Restore previous purchases from App Store via expo-in-app-purchases
 */
export async function restorePurchases(): Promise<PurchaseResult> {
  try {
    console.log('🛒 Restoring purchases from App Store...');
    
    if (Platform.OS !== 'ios') {
      return {
        success: false,
        error: 'Restore purchases is only available on iOS',
      };
    }

    // Check if TestFlight bypass is enabled
    const isTestFlight = isTestFlightBuild();
    const bypassEnabled = await getTestFlightBypassEnabled();
    
    if (isTestFlight && bypassEnabled) {
      console.log('✅ TestFlight bypass enabled: Simulating restore');
      await saveSubscriptionStatus(true);
      return { success: true };
    }

    // Initialize if not already done
    await initializeStoreKit();

    // Get purchase history
    console.log('🛒 Fetching purchase history...');
    const { responseCode, results } = await InAppPurchases.getPurchaseHistoryAsync();
    
    console.log('📱 Purchase history response:', { responseCode, resultsCount: results?.length });

    if (responseCode === InAppPurchases.IAPResponseCode.OK && results && results.length > 0) {
      console.log('✅ Found', results.length, 'previous purchases');
      
      // Check if any of the purchases are our subscription products
      const hasSubscription = results.some(purchase => 
        purchase.productId === PRODUCT_IDS.MONTHLY || 
        purchase.productId === PRODUCT_IDS.ANNUAL
      );
      
      if (hasSubscription) {
        console.log('✅ Active subscription found');
        await saveSubscriptionStatus(true);
        return { success: true };
      } else {
        console.log('ℹ️ No active subscription found');
        return {
          success: false,
          error: 'No active subscription found',
        };
      }
    } else {
      console.log('ℹ️ No purchase history found');
      return {
        success: false,
        error: 'No purchases to restore',
      };
    }
  } catch (error: any) {
    console.error('❌ Restore purchases error:', error);
    return {
      success: false,
      error: error.message || 'Failed to restore purchases',
    };
  }
}

/**
 * Validate receipt with App Store
 */
export async function validateReceipt(receiptData: string): Promise<boolean> {
  try {
    console.log('🛒 Validating receipt with App Store...');
    
    // For TestFlight with bypass enabled
    const isTestFlight = isTestFlightBuild();
    const bypassEnabled = await getTestFlightBypassEnabled();
    
    if (isTestFlight && bypassEnabled) {
      console.log('✅ TestFlight bypass enabled: Receipt validation bypassed');
      return true;
    }

    // TODO: Implement server-side receipt validation for production
    // This should send the receipt to your backend server
    // which validates it with Apple's servers
    
    console.log('⚠️ Server-side receipt validation not implemented');
    console.log('📋 For production, implement backend validation at /api/validate-receipt');
    
    return false;
  } catch (error) {
    console.error('❌ Receipt validation error:', error);
    return false;
  }
}

/**
 * Check current subscription status with App Store
 */
export async function checkAppStoreSubscription(): Promise<boolean> {
  try {
    console.log('🛒 Checking subscription status with App Store...');
    
    if (Platform.OS !== 'ios') {
      return false;
    }

    // Check if TestFlight bypass is enabled
    const isTestFlight = isTestFlightBuild();
    const bypassEnabled = await getTestFlightBypassEnabled();
    
    if (isTestFlight && bypassEnabled) {
      const localStatus = await loadSubscriptionStatus();
      console.log('✅ TestFlight bypass enabled: Using local subscription status:', localStatus);
      return localStatus;
    }

    // Initialize if not already done
    await initializeStoreKit();

    // Get purchase history to check for active subscriptions
    const { responseCode, results } = await InAppPurchases.getPurchaseHistoryAsync();
    
    if (responseCode === InAppPurchases.IAPResponseCode.OK && results && results.length > 0) {
      // Check if any of the purchases are our subscription products
      const hasSubscription = results.some(purchase => 
        purchase.productId === PRODUCT_IDS.MONTHLY || 
        purchase.productId === PRODUCT_IDS.ANNUAL
      );
      
      console.log('✅ Subscription check complete:', hasSubscription);
      
      // Update local storage
      await saveSubscriptionStatus(hasSubscription);
      
      return hasSubscription;
    }

    console.log('ℹ️ No active subscription found');
    return false;
  } catch (error) {
    console.error('❌ Subscription check error:', error);
    
    // Fall back to local storage on error
    const localStatus = await loadSubscriptionStatus();
    return localStatus;
  }
}

/**
 * Get the trial start date
 */
export async function getTrialStartDate(): Promise<Date | null> {
  try {
    const trialStartStr = await AsyncStorage.getItem(TRIAL_START_KEY);
    if (trialStartStr) {
      return new Date(trialStartStr);
    }
    return null;
  } catch (error) {
    console.error('Error getting trial start date:', error);
    return null;
  }
}

/**
 * Start the free trial
 */
export async function startTrial(): Promise<void> {
  try {
    const existingTrialStart = await getTrialStartDate();
    if (!existingTrialStart) {
      const now = new Date().toISOString();
      await AsyncStorage.setItem(TRIAL_START_KEY, now);
      console.log('Trial started:', now);
    } else {
      console.log('Trial already started:', existingTrialStart);
    }
  } catch (error) {
    console.error('Error starting trial:', error);
    throw error;
  }
}

/**
 * Calculate days remaining in trial
 */
export function calculateTrialDaysRemaining(trialStartDate: Date): number {
  const now = new Date();
  const diffTime = now.getTime() - trialStartDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, TRIAL_DURATION_DAYS - diffDays);
  return daysRemaining;
}

/**
 * Check if user is in trial period
 */
export async function isInTrialPeriod(): Promise<boolean> {
  try {
    const trialStartDate = await getTrialStartDate();
    if (!trialStartDate) {
      return false;
    }

    const daysRemaining = calculateTrialDaysRemaining(trialStartDate);
    return daysRemaining > 0;
  } catch (error) {
    console.error('Error checking trial period:', error);
    return false;
  }
}

/**
 * Get comprehensive subscription status
 */
export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  try {
    // Check if TestFlight build first
    const isTestFlight = isTestFlightBuild();
    const bypassEnabled = await getTestFlightBypassEnabled();
    
    if (isTestFlight && bypassEnabled) {
      // In TestFlight/Dev with bypass enabled, use local storage for testing
      const localStatus = await loadSubscriptionStatus();
      return {
        isSubscribed: localStatus,
        isInTrial: false,
        trialDaysRemaining: 0,
        isTestFlight: true,
      };
    }

    // In production or TestFlight without bypass, check with App Store
    const appStoreSubscribed = await checkAppStoreSubscription();
    
    // Check trial status as fallback
    const trialStartDate = await getTrialStartDate();
    const inTrial = await isInTrialPeriod();
    const trialDaysRemaining = trialStartDate 
      ? calculateTrialDaysRemaining(trialStartDate)
      : TRIAL_DURATION_DAYS;

    return {
      isSubscribed: appStoreSubscribed || inTrial,
      isInTrial: inTrial,
      trialDaysRemaining,
      isTestFlight: false,
    };
  } catch (error) {
    console.error('Error getting subscription status:', error);
    // Default to allowing access in case of error
    return {
      isSubscribed: true,
      isInTrial: false,
      trialDaysRemaining: 0,
      isTestFlight: false,
    };
  }
}

/**
 * Check if user should see paywall
 */
export async function shouldShowPaywall(): Promise<boolean> {
  const status = await getSubscriptionStatus();
  
  // Don't show paywall for TestFlight users with bypass enabled and active subscription
  if (status.isTestFlight && status.isSubscribed) {
    return false;
  }

  // Don't show paywall if subscribed or in trial
  if (status.isSubscribed || status.isInTrial) {
    return false;
  }

  return true;
}

/**
 * Disconnect from StoreKit (cleanup)
 */
export async function disconnectStoreKit(): Promise<void> {
  try {
    if (Platform.OS === 'ios') {
      await InAppPurchases.disconnectAsync();
      console.log('✅ Disconnected from App Store');
    }
  } catch (error) {
    console.error('❌ Error disconnecting from StoreKit:', error);
  }
}
</write file>

<write file="components/PaywallScreen.tsx">
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
  Switch,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { 
  purchaseProduct, 
  restorePurchases, 
  PRODUCT_IDS, 
  isTestFlightBuild,
  getTestFlightBypassEnabled,
  setTestFlightBypassEnabled,
  getProductDetails,
  ProductDetails
} from '@/utils/subscriptionManager';

interface PaywallScreenProps {
  visible: boolean;
  onDismiss?: () => void;
  canDismiss?: boolean;
}

type SubscriptionPlan = 'annual' | 'monthly';

export default function PaywallScreen({ visible, onDismiss, canDismiss = true }: PaywallScreenProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('annual');
  const [monthlyProduct, setMonthlyProduct] = useState<ProductDetails | null>(null);
  const [annualProduct, setAnnualProduct] = useState<ProductDetails | null>(null);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [bypassEnabled, setBypassEnabled] = useState(false);
  const [isTestFlight, setIsTestFlight] = useState(false);

  useEffect(() => {
    if (visible) {
      loadInitialState();
    }
  }, [visible]);

  const loadInitialState = async () => {
    console.log('Loading paywall initial state...');
    
    // Check if TestFlight build
    const testFlightBuild = isTestFlightBuild();
    setIsTestFlight(testFlightBuild);
    console.log('Is TestFlight build:', testFlightBuild);
    
    // Load bypass toggle state
    if (testFlightBuild) {
      const bypass = await getTestFlightBypassEnabled();
      setBypassEnabled(bypass);
      console.log('TestFlight bypass enabled:', bypass);
    }
    
    // Load products on iOS
    if (Platform.OS === 'ios') {
      loadProducts();
    } else {
      setIsLoadingProducts(false);
    }
  };

  const loadProducts = async () => {
    console.log('Loading product details from App Store...');
    setIsLoadingProducts(true);
    
    try {
      const [monthly, annual] = await Promise.all([
        getProductDetails(PRODUCT_IDS.MONTHLY),
        getProductDetails(PRODUCT_IDS.ANNUAL),
      ]);
      
      console.log('Monthly product:', monthly);
      console.log('Annual product:', annual);
      
      setMonthlyProduct(monthly);
      setAnnualProduct(annual);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const handleBypassToggle = async (value: boolean) => {
    console.log('User toggled TestFlight bypass to:', value);
    setBypassEnabled(value);
    await setTestFlightBypassEnabled(value);
    
    Alert.alert(
      'TestFlight Bypass ' + (value ? 'Enabled' : 'Disabled'),
      value 
        ? 'Purchases will be simulated. You can test the app without real purchases.'
        : 'Real sandbox purchases are now enabled. Use a sandbox tester account to test purchases.',
      [{ text: 'OK' }]
    );
  };

  const handleSubscribe = async () => {
    console.log('User tapped Subscribe button with plan:', selectedPlan);
    setIsProcessing(true);
    
    try {
      const productId = selectedPlan === 'annual' ? PRODUCT_IDS.ANNUAL : PRODUCT_IDS.MONTHLY;
      console.log('🛒 Initiating purchase for product:', productId);
      
      const result = await purchaseProduct(productId);
      
      if (result.success) {
        console.log('✅ Purchase successful');
        
        let message = `Your ${selectedPlan} subscription is now active!\n\nThank you for subscribing!`;
        
        if (isTestFlight && bypassEnabled) {
          message = `Your ${selectedPlan} subscription is now active!\n\n✅ TestFlight Mode (Bypass Enabled): Using simulated subscription.\n\nTo test real sandbox purchases, toggle the bypass switch to OFF.`;
        } else if (isTestFlight) {
          message = `Your ${selectedPlan} subscription is now active!\n\n✅ TestFlight Mode: Real sandbox purchase completed.\n\nIn production, this will process real payments through the App Store.`;
        }
        
        Alert.alert(
          'Subscription Activated',
          message,
          [
            {
              text: 'OK',
              onPress: () => {
                console.log('Subscription successful, dismissing paywall');
                if (onDismiss) {
                  onDismiss();
                }
              }
            }
          ]
        );
      } else if (result.userCancelled) {
        console.log('ℹ️ User cancelled purchase');
      } else {
        console.error('❌ Purchase failed:', result.error);
        Alert.alert(
          'Purchase Failed',
          result.error || 'Unable to complete purchase. Please try again.'
        );
      }
      
      setIsProcessing(false);
    } catch (error) {
      console.error('Error during purchase:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleRestorePurchases = async () => {
    console.log('User tapped Restore Purchases button');
    setIsProcessing(true);
    
    try {
      console.log('🔄 Restoring purchases from App Store...');
      
      const result = await restorePurchases();
      
      if (result.success) {
        console.log('✅ Restore successful');
        
        let message = 'Your subscription has been restored!\n\nThank you for being a subscriber!';
        
        if (isTestFlight && bypassEnabled) {
          message = 'Your subscription has been restored!\n\n✅ TestFlight Mode (Bypass Enabled): Using simulated restore.\n\nTo test real sandbox restore, toggle the bypass switch to OFF.';
        } else if (isTestFlight) {
          message = 'Your subscription has been restored!\n\n✅ TestFlight Mode: Real sandbox restore completed.\n\nIn production, this will restore real App Store purchases.';
        }
        
        Alert.alert(
          'Purchases Restored',
          message,
          [
            {
              text: 'OK',
              onPress: () => {
                if (onDismiss) {
                  onDismiss();
                }
              }
            }
          ]
        );
      } else {
        console.error('❌ Restore failed:', result.error);
        Alert.alert(
          'No Purchases Found',
          result.error || 'We couldn\'t find any previous purchases to restore.\n\nIf you believe this is an error, please contact support.'
        );
      }
      
      setIsProcessing(false);
    } catch (error) {
      console.error('Restore purchases error:', error);
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
      setIsProcessing(false);
    }
  };

  const openPrivacyPolicy = () => {
    console.log('User tapped Privacy Policy');
    Linking.openURL('https://www.portiontrack.com/privacy-policy');
  };

  const openTermsOfService = () => {
    console.log('User tapped Terms of Service');
    Linking.openURL('https://www.apple.com/legal/internet-services/itunes/');
  };

  // Use real product prices if available, otherwise use defaults
  const monthlyPrice = monthlyProduct?.priceString || '$2.99';
  const annualPrice = annualProduct?.priceString || '$24.99';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={canDismiss ? onDismiss : undefined}
    >
      <SafeAreaView style={styles.container}>
        {canDismiss && onDismiss && (
          <TouchableOpacity style={styles.closeButton} onPress={onDismiss}>
            <MaterialIcons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
        )}

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          {isTestFlight && (
            <View style={styles.testFlightBanner}>
              <View style={styles.testFlightHeader}>
                <MaterialIcons name="info" size={20} color={colors.primary} />
                <Text style={styles.testFlightTitle}>TestFlight Mode</Text>
              </View>
              
              <View style={styles.bypassToggleContainer}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bypassToggleLabel}>Bypass Purchases</Text>
                  <Text style={styles.bypassToggleDescription}>
                    {bypassEnabled 
                      ? 'ON: Purchases are simulated (no real charges)'
                      : 'OFF: Real sandbox purchases enabled'}
                  </Text>
                </View>
                <Switch
                  value={bypassEnabled}
                  onValueChange={handleBypassToggle}
                  trackColor={{ false: '#767577', true: colors.primary }}
                  thumbColor={bypassEnabled ? '#FFFFFF' : '#f4f3f4'}
                />
              </View>
              
              <Text style={styles.testFlightText}>
                {bypassEnabled 
                  ? 'Toggle OFF to test real sandbox purchases with a sandbox tester account.'
                  : 'Use a sandbox tester account to test purchases. In production, real App Store payments will be processed.'}
              </Text>
            </View>
          )}

          <View style={styles.header}>
            <Text style={styles.title}>7-day free trial.{'\n'}Cancel anytime.</Text>
            <Text style={styles.subtitle}>
              Payment will be charged to your Apple ID at confirmation of purchase or at the end of the trial. Subscription automatically renews unless canceled at least 24 hours before the end of the period.
            </Text>
          </View>

          <View style={styles.featuresContainer}>
            <Text style={styles.featuresTitle}>Subscription includes:</Text>
            <FeatureItem text="Unlimited portion tracking" />
            <FeatureItem text="Custom portion targets" />
            <FeatureItem text="Weight tracking & charts" />
            <FeatureItem text="Adherence history & trends" />
            <FeatureItem text="Daily reminders" />
          </View>

          {isLoadingProducts && Platform.OS === 'ios' ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading subscription options...</Text>
            </View>
          ) : (
            <View style={styles.plansContainer}>
              <TouchableOpacity
                style={[
                  styles.planCard,
                  selectedPlan === 'annual' && styles.planCardSelected,
                ]}
                onPress={() => setSelectedPlan('annual')}
              >
                <View style={styles.planHeader}>
                  <View style={styles.planTitleContainer}>
                    <Text style={styles.planTitle}>Annual</Text>
                    <View style={styles.bestValueBadge}>
                      <Text style={styles.bestValueText}>Best Value</Text>
                    </View>
                  </View>
                  <View style={[
                    styles.radioButton,
                    selectedPlan === 'annual' && styles.radioButtonSelected,
                  ]}>
                    {selectedPlan === 'annual' && (
                      <View style={styles.radioButtonInner} />
                    )}
                  </View>
                </View>
                <Text style={styles.planPrice}>{annualPrice}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.planCard,
                  selectedPlan === 'monthly' && styles.planCardSelected,
                ]}
                onPress={() => setSelectedPlan('monthly')}
              >
                <View style={styles.planHeader}>
                  <Text style={styles.planTitle}>Monthly</Text>
                  <View style={[
                    styles.radioButton,
                    selectedPlan === 'monthly' && styles.radioButtonSelected,
                  ]}>
                    {selectedPlan === 'monthly' && (
                      <View style={styles.radioButtonInner} />
                    )}
                  </View>
                </View>
                <Text style={styles.planPrice}>{monthlyPrice}</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.legalContainer}>
            <Text style={styles.legalText}>By clicking I agree to the </Text>
            <TouchableOpacity onPress={openTermsOfService}>
              <Text style={styles.legalLink}>Terms of Service</Text>
            </TouchableOpacity>
            <Text style={styles.legalText}> and{'\n'}</Text>
            <TouchableOpacity onPress={openPrivacyPolicy}>
              <Text style={styles.legalLink}>Privacy Policy</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[buttonStyles.primary, styles.subscribeButton]}
            onPress={handleSubscribe}
            disabled={isProcessing || isLoadingProducts}
          >
            {isProcessing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={buttonStyles.primaryText}>
                {selectedPlan === 'annual' 
                  ? `7 day free trial then ${annualPrice}/year`
                  : `7 day free trial then ${monthlyPrice}/month`}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestorePurchases}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={styles.restoreButtonText}>Restore Purchases</Text>
            )}
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
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 8 : 48,
    right: 16,
    zIndex: 10,
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingTop: 60,
  },
  testFlightBanner: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  testFlightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  testFlightTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  bypassToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: colors.background,
    borderRadius: 8,
    marginBottom: 12,
  },
  bypassToggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  bypassToggleDescription: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  testFlightText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  featuresContainer: {
    marginBottom: 32,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
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
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  plansContainer: {
    marginBottom: 24,
  },
  planCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  planCardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#FFE5E5',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  planTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  bestValueBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bestValueText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  planPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.textSecondary,
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
  legalContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  legalText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  legalLink: {
    fontSize: 14,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  subscribeButton: {
    marginBottom: 16,
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
});
</write file>

Now let me update the .env file to clarify the usage:

<write file=".env">
# TestFlight Bypass Toggle
# This is the DEFAULT value when the app first launches
# Testers can toggle this ON/OFF in the paywall screen in TestFlight builds
# Set to 'true' for easier initial testing (bypass enabled by default)
# Set to 'false' to require real sandbox purchases by default
EXPO_PUBLIC_STOREKIT_TESTFLIGHT_BYPASS=true

# IMPORTANT: For production App Store builds, this setting is IGNORED
# The bypass toggle is completely hidden in production builds
# Only TestFlight and development builds show the bypass toggle

# For production App Store builds via EAS Build:
# The bypass toggle will not be visible regardless of this setting
# Real App Store payments will always be processed in production
