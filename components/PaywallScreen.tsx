
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
  getProductDetails,
  queryProducts,
  isProductReady,
  ProductDetails
} from '@/utils/subscriptionManager';
import { loadProfile } from '@/utils/storage';

interface PaywallScreenProps {
  visible: boolean;
  onDismiss?: () => void;
  canDismiss?: boolean;
  onSubscribeSuccess?: () => void;
}

type SubscriptionPlan = 'monthly' | 'annual';

export default function PaywallScreen({ visible, onDismiss, canDismiss = true, onSubscribeSuccess }: PaywallScreenProps) {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('annual');
  const [loading, setLoading] = useState(false);
  const [monthlyProduct, setMonthlyProduct] = useState<ProductDetails | null>(null);
  const [annualProduct, setAnnualProduct] = useState<ProductDetails | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsFailed, setProductsFailed] = useState(false);

  useEffect(() => {
    if (visible) {
      console.log('═══════════════════════════════════════════════════════');
      console.log('🔵 PAYWALL MOUNT: Paywall screen opened');
      console.log('═══════════════════════════════════════════════════════');
      loadProducts();
    }
  }, [visible]);

  const loadProducts = async () => {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔵 PRODUCT FETCH START: Initializing StoreKit and fetching products');
    console.log('📊 PRODUCT FETCH: Platform:', Platform.OS);
    console.log('═══════════════════════════════════════════════════════');
    
    setLoadingProducts(true);
    setProductsFailed(false);

    // On non-iOS platforms (web, Android), use fallback products
    // expo-in-app-purchases only works on iOS
    if (Platform.OS !== 'ios') {
      console.log('⚠️ PRODUCT FETCH: Not iOS platform, using fallback products');
      console.log('⚠️ PRODUCT FETCH: In-app purchases only work on iOS devices');
      
      // Get fallback product details
      const [monthly, annual] = await Promise.all([
        getProductDetails(PRODUCT_IDS.MONTHLY),
        getProductDetails(PRODUCT_IDS.ANNUAL),
      ]);
      
      setMonthlyProduct(monthly);
      setAnnualProduct(annual);
      setLoadingProducts(false);
      
      console.log('✅ PRODUCT FETCH: Fallback products loaded');
      console.log('═══════════════════════════════════════════════════════');
      return;
    }

    try {
      // Query products using getProductsAsync with subscription IDs
      console.log('📦 PRODUCT FETCH: Querying products from StoreKit...');
      console.log('📦 PRODUCT FETCH: SKUs to query:', [PRODUCT_IDS.MONTHLY, PRODUCT_IDS.ANNUAL]);
      
      const queriedIds = await queryProducts([PRODUCT_IDS.MONTHLY, PRODUCT_IDS.ANNUAL]);
      
      console.log('═══════════════════════════════════════════════════════');
      console.log('📊 PRODUCT FETCH RESULT:');
      console.log('  - Total products queried:', queriedIds.length);
      console.log('  - Product IDs returned:', queriedIds);
      console.log('  - Monthly SKU ready:', queriedIds.includes(PRODUCT_IDS.MONTHLY));
      console.log('  - Annual SKU ready:', queriedIds.includes(PRODUCT_IDS.ANNUAL));
      console.log('═══════════════════════════════════════════════════════');

      // If results are empty or response not OK, show "Unable to load plans" + Retry
      if (queriedIds.length === 0) {
        console.error('❌ PRODUCT FETCH FAIL: No products returned from StoreKit');
        console.error('❌ PRODUCT FETCH FAIL: This means StoreKit query failed or returned empty');
        setProductsFailed(true);
        setLoadingProducts(false);
        return;
      }

      // Get display details for each product
      console.log('🔄 PRODUCT DETAILS: Fetching display details for products...');
      
      const [monthly, annual] = await Promise.all([
        getProductDetails(PRODUCT_IDS.MONTHLY),
        getProductDetails(PRODUCT_IDS.ANNUAL),
      ]);

      console.log('═══════════════════════════════════════════════════════');
      console.log('📊 PRODUCT DETAILS RESULT:');
      console.log('  Monthly Product:');
      console.log('    - Product ID:', monthly?.productId);
      console.log('    - Price:', monthly?.price);
      console.log('    - Price String:', monthly?.priceString);
      console.log('    - Currency:', monthly?.currencyCode);
      console.log('  Annual Product:');
      console.log('    - Product ID:', annual?.productId);
      console.log('    - Price:', annual?.price);
      console.log('    - Price String:', annual?.priceString);
      console.log('    - Currency:', annual?.currencyCode);
      console.log('═══════════════════════════════════════════════════════');

      setMonthlyProduct(monthly);
      setAnnualProduct(annual);
      
      console.log('✅ PRODUCT FETCH COMPLETE: Products loaded and ready for purchase');
      console.log('═══════════════════════════════════════════════════════');
    } catch (error) {
      console.error('═══════════════════════════════════════════════════════');
      console.error('❌ PRODUCT FETCH ERROR: Failed to load products');
      console.error('❌ Error details:', error);
      console.error('═══════════════════════════════════════════════════════');
      
      // Show "Unable to load plans" + Retry on error
      setProductsFailed(true);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handlePurchaseSuccess = async () => {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🎉 PURCHASE SUCCESS HANDLER: Starting post-purchase navigation');
    console.log('═══════════════════════════════════════════════════════');

    if (onSubscribeSuccess) {
      // Caller (welcome screen) handles navigation
      console.log('✅ PURCHASE SUCCESS: Delegating navigation to onSubscribeSuccess callback');
      console.log('═══════════════════════════════════════════════════════');
      onSubscribeSuccess();
      return;
    }

    // Fallback: check profile and navigate directly
    const profile = await loadProfile();
    const hasProfile = profile && profile.portionTargets;

    console.log('📊 PURCHASE SUCCESS: Profile check');
    console.log('  - Profile exists:', !!profile);
    console.log('  - Has portion targets:', !!hasProfile);

    if (hasProfile) {
      console.log('✅ PURCHASE SUCCESS: Profile exists -> Navigating to (tabs)');
      console.log('═══════════════════════════════════════════════════════');
      router.replace('/(tabs)');
    } else {
      console.log('✅ PURCHASE SUCCESS: No profile -> Navigating to setup-profile');
      console.log('═══════════════════════════════════════════════════════');
      router.replace('/setup-profile');
    }
  };

  const handleSubscribe = async () => {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔵 PURCHASE TAP: User tapped Subscribe button');
    console.log('═══════════════════════════════════════════════════════');
    
    const productId = selectedPlan === 'monthly' ? PRODUCT_IDS.MONTHLY : PRODUCT_IDS.ANNUAL;
    
    console.log('📊 PURCHASE TAP INFO:');
    console.log('  - Selected plan:', selectedPlan);
    console.log('  - Product ID:', productId);
    
    // Verify productId exists in the fetched results list (exact match)
    const productExists = isProductReady(productId);
    console.log('  - Product object exists in memory:', productExists);
    
    if (!productExists) {
      console.error('═══════════════════════════════════════════════════════');
      console.error('❌ PURCHASE BLOCKED: Product object not in memory');
      console.error('❌ Cannot purchase - product not queried from StoreKit');
      console.error('❌ Product ID:', productId);
      console.error('═══════════════════════════════════════════════════════');
      
      Alert.alert(
        'Product Not Available',
        'Unable to load product information. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
      return;
    }

    console.log('✅ PURCHASE VALIDATION PASSED: Proceeding with purchase');
    console.log('═══════════════════════════════════════════════════════');

    setLoading(true);

    try {
      console.log('🔄 PURCHASE REQUEST: Initiating purchase for:', productId);

      const result = await purchaseProduct(productId);
      
      console.log('═══════════════════════════════════════════════════════');
      console.log('📊 PURCHASE RESULT:');
      console.log('  - Success:', result.success);
      console.log('  - User cancelled:', result.userCancelled);
      console.log('  - Error:', result.error);
      console.log('═══════════════════════════════════════════════════════');

      if (result.success) {
        setLoading(false);
        Alert.alert(
          'Success!',
          'Your subscription is now active. Enjoy unlimited access!',
          [
            {
              text: 'OK',
              onPress: () => {
                console.log('✅ PURCHASE SUCCESS: User acknowledged subscription success');
                console.log('ℹ️ PURCHASE SUCCESS: Subscription status updated via event emitter');
                console.log('ℹ️ PURCHASE SUCCESS: Navigating to Profile/Setup');
                
                // Navigate directly to Profile or Setup based on profile existence
                handlePurchaseSuccess();
              },
            },
          ]
        );
      } else if (result.userCancelled) {
        console.log('ℹ️ PURCHASE CANCELLED: User cancelled purchase');
      } else {
        console.error('❌ PURCHASE FAILED:', result.error);
        Alert.alert(
          'Purchase Failed',
          result.error || 'Unable to complete purchase. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('═══════════════════════════════════════════════════════');
      console.error('❌ PURCHASE ERROR: Unexpected error during purchase');
      console.error('❌ Error:', error);
      console.error('❌ Error message:', error?.message);
      console.error('❌ Error code:', error?.code);
      console.error('═══════════════════════════════════════════════════════');
      
      // Safety net: ensure spinner stops even if finally is somehow skipped
      setLoading(false);
      
      const errorMessage = error?.message || 'An unexpected error occurred. Please try again.';
      
      Alert.alert(
        'Error',
        errorMessage,
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRestorePurchases = async () => {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔵 RESTORE TAP: User tapped Restore Purchases button');
    console.log('═══════════════════════════════════════════════════════');

    setLoading(true);

    try {
      const result = await restorePurchases();
      
      console.log('📊 RESTORE RESULT:');
      console.log('  - Success:', result.success);
      console.log('  - Error:', result.error);
      console.log('═══════════════════════════════════════════════════════');

      if (result.success) {
        Alert.alert(
          'Success!',
          'Your subscription has been restored.',
          [
            {
              text: 'OK',
              onPress: () => {
                console.log('✅ RESTORE SUCCESS: User acknowledged restore success');
                console.log('ℹ️ RESTORE SUCCESS: Subscription status updated via event emitter');
                console.log('ℹ️ RESTORE SUCCESS: Navigating to Profile/Setup');
                
                // Navigate directly to Profile or Setup based on profile existence
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
      console.error('❌ RESTORE ERROR:', error);
      
      const errorMessage = error?.message || 'Unable to restore purchases. Please try again.';
      
      Alert.alert(
        'Error',
        errorMessage,
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const openPrivacyPolicy = () => {
    console.log('🔗 Opening privacy policy...');
    Linking.openURL('https://www.portiontrack.com/privacy-policy');
  };

  const openTermsOfService = () => {
    console.log('🔗 Opening terms of service...');
    Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/');
  };

  const getMonthlyPrice = () => {
    if (loadingProducts) return '...';
    if (Platform.OS !== 'ios') return monthlyProduct?.priceString || '$3.99';
    // On iOS: never show hardcoded price — show '...' until live product is loaded
    return monthlyProduct?.priceString || '...';
  };

  const getAnnualPrice = () => {
    if (loadingProducts) return '...';
    if (Platform.OS !== 'ios') return annualProduct?.priceString || '$29.99';
    // On iOS: never show hardcoded price — show '...' until live product is loaded
    return annualProduct?.priceString || '...';
  };

  const getAnnualMonthlyPrice = () => {
    if (loadingProducts) return '...';
    if (annualProduct) {
      const annualPrice = parseFloat(annualProduct.price);
      const monthlyEquivalent = (annualPrice / 12).toFixed(2);
      return `${annualProduct.currencyCode === 'USD' ? '$' : ''}${monthlyEquivalent}`;
    }
    if (Platform.OS !== 'ios') return '$3.33';
    return '...';
  };

  // Purchase must be disabled unless the product object exists in memory from StoreKit
  const isSelectedProductReady = () => {
    const productId = selectedPlan === 'monthly' ? PRODUCT_IDS.MONTHLY : PRODUCT_IDS.ANNUAL;
    const ready = isProductReady(productId);
    
    console.log('🔍 PRODUCT READY CHECK:', {
      productId,
      ready
    });
    
    return ready;
  };

  const titleText = '7 day free trial.';
  const subtitleText = 'Cancel anytime.';

  const buttonText = loadingProducts
    ? 'Loading products...'
    : !isSelectedProductReady()
    ? 'Product not available'
    : `7 day free trial then ${selectedPlan === 'monthly' ? getMonthlyPrice() : getAnnualPrice()}${selectedPlan === 'monthly' ? '/month' : '/year'}`;

  const disclosureText = 'Payment will be charged to your Apple ID at confirmation of purchase or at the end of the trial. Subscription automatically renews unless canceled at least 24 hours before the end of the period.';

  // Show "Unable to load plans" + Retry if products failed
  if (productsFailed) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          if (canDismiss && onDismiss) {
            console.log('User dismissed paywall (products failed)');
            onDismiss();
          }
        }}
      >
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
          {canDismiss && (
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                console.log('User tapped close button (products failed)');
                if (onDismiss) {
                  onDismiss();
                }
              }}
            >
              <MaterialIcons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
          )}

          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={64} color={colors.error} />
            <Text style={styles.errorTitle}>Unable to Load Plans</Text>
            <Text style={styles.errorMessage}>
              We couldn&apos;t load subscription plans from the App Store. Please check your internet connection and try again.
            </Text>
            
            <TouchableOpacity
              style={[buttonStyles.primary, styles.retryButton]}
              onPress={() => {
                console.log('User tapped Retry button');
                loadProducts();
              }}
            >
              <Text style={buttonStyles.primaryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => {
        if (canDismiss && onDismiss) {
          console.log('User dismissed paywall');
          onDismiss();
        }
      }}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {canDismiss && (
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              console.log('User tapped close button');
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
                console.log('User selected annual plan');
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
                console.log('User selected monthly plan');
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
              !isSelectedProductReady() && styles.subscribeButtonDisabled
            ]}
            onPress={handleSubscribe}
            disabled={loading || loadingProducts || !isSelectedProductReady()}
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
  subscribeButtonDisabled: {
    opacity: 0.5,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  retryButton: {
    minWidth: 200,
  },
});
