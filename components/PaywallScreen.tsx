
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
    
    // Load bypass toggle state (only in TestFlight)
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
