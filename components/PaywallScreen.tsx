
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { 
  purchaseProduct, 
  restorePurchases, 
  PRODUCT_IDS, 
  isTestFlightBuild,
  getTestFlightBypassEnabled,
  setTestFlightBypassEnabled,
  getProductDetails,
  queryProducts,
  isProductReady,
  ProductDetails
} from '@/utils/subscriptionManager';

interface PaywallScreenProps {
  visible: boolean;
  onDismiss?: () => void;
  canDismiss?: boolean;
}

type SubscriptionPlan = 'monthly' | 'annual';

export default function PaywallScreen({ visible, onDismiss, canDismiss = true }: PaywallScreenProps) {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('annual');
  const [loading, setLoading] = useState(false);
  const [isTestFlight, setIsTestFlight] = useState(false);
  const [bypassEnabled, setBypassEnabled] = useState(false);
  const [monthlyProduct, setMonthlyProduct] = useState<ProductDetails | null>(null);
  const [annualProduct, setAnnualProduct] = useState<ProductDetails | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsFailed, setProductsFailed] = useState(false);
  const [productsReady, setProductsReady] = useState<string[]>([]);

  useEffect(() => {
    if (visible) {
      console.log('═══════════════════════════════════════════════════════');
      console.log('🔵 PAYWALL MOUNT: Paywall screen opened');
      console.log('═══════════════════════════════════════════════════════');
      loadInitialState();
      loadProducts();
    }
  }, [visible]);

  const loadInitialState = async () => {
    console.log('🔄 PAYWALL INIT: Loading initial state...');
    const testFlight = isTestFlightBuild();
    setIsTestFlight(testFlight);
    console.log('📱 PAYWALL INIT: Is TestFlight/Dev build:', testFlight);

    if (testFlight) {
      const bypass = await getTestFlightBypassEnabled();
      setBypassEnabled(bypass);
      console.log('🔧 PAYWALL INIT: TestFlight bypass enabled:', bypass);
    }
  };

  const loadProducts = async () => {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔵 PRODUCT FETCH START: Initializing StoreKit and fetching products');
    console.log('📊 PRODUCT FETCH: Platform:', Platform.OS);
    console.log('═══════════════════════════════════════════════════════');
    
    setLoadingProducts(true);
    setProductsFailed(false);
    setProductsReady([]);

    // CRITICAL FIX: On non-iOS platforms (web, Android), use fallback products
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
      setProductsReady([PRODUCT_IDS.MONTHLY, PRODUCT_IDS.ANNUAL]);
      setLoadingProducts(false);
      
      console.log('✅ PRODUCT FETCH: Fallback products loaded');
      console.log('═══════════════════════════════════════════════════════');
      return;
    }

    try {
      // STEP 1: Query BOTH products from StoreKit and store Product objects
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

      if (queriedIds.length === 0) {
        console.error('❌ PRODUCT FETCH FAIL: No products returned from StoreKit');
        console.error('❌ PRODUCT FETCH FAIL: This means StoreKit query failed or returned empty');
        console.error('❌ PRODUCT FETCH FAIL: Using fallback products instead');
        
        // Use fallback products instead of failing completely
        const [monthly, annual] = await Promise.all([
          getProductDetails(PRODUCT_IDS.MONTHLY),
          getProductDetails(PRODUCT_IDS.ANNUAL),
        ]);
        
        setMonthlyProduct(monthly);
        setAnnualProduct(annual);
        setProductsReady([PRODUCT_IDS.MONTHLY, PRODUCT_IDS.ANNUAL]);
        setLoadingProducts(false);
        
        console.log('✅ PRODUCT FETCH: Using fallback products');
        console.log('═══════════════════════════════════════════════════════');
        return;
      }

      setProductsReady(queriedIds);

      // STEP 2: Get display details for each product
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
      console.log('    - Has valid price:', !!(monthly?.price && monthly?.priceString));
      console.log('  Annual Product:');
      console.log('    - Product ID:', annual?.productId);
      console.log('    - Price:', annual?.price);
      console.log('    - Price String:', annual?.priceString);
      console.log('    - Currency:', annual?.currencyCode);
      console.log('    - Has valid price:', !!(annual?.price && annual?.priceString));
      console.log('═══════════════════════════════════════════════════════');

      setMonthlyProduct(monthly);
      setAnnualProduct(annual);
      
      // Verify products have valid prices
      const monthlyValid = monthly && monthly.price && monthly.priceString;
      const annualValid = annual && annual.price && annual.priceString;
      
      if (!monthlyValid || !annualValid) {
        console.warn('⚠️ PRODUCT VALIDATION: Some products missing valid price data');
        console.warn('⚠️ PRODUCT VALIDATION: Monthly valid:', monthlyValid);
        console.warn('⚠️ PRODUCT VALIDATION: Annual valid:', annualValid);
      }
      
      console.log('✅ PRODUCT FETCH COMPLETE: Products loaded and ready for purchase');
      console.log('═══════════════════════════════════════════════════════');
    } catch (error) {
      console.error('═══════════════════════════════════════════════════════');
      console.error('❌ PRODUCT FETCH ERROR: Failed to load products');
      console.error('❌ Error details:', error);
      console.error('❌ PRODUCT FETCH ERROR: Using fallback products');
      console.error('═══════════════════════════════════════════════════════');
      
      // Use fallback products on error instead of showing error screen
      const [monthly, annual] = await Promise.all([
        getProductDetails(PRODUCT_IDS.MONTHLY),
        getProductDetails(PRODUCT_IDS.ANNUAL),
      ]);
      
      setMonthlyProduct(monthly);
      setAnnualProduct(annual);
      setProductsReady([PRODUCT_IDS.MONTHLY, PRODUCT_IDS.ANNUAL]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleBypassToggle = async (value: boolean) => {
    console.log('🔧 BYPASS TOGGLE: Changed to:', value);
    setBypassEnabled(value);
    await setTestFlightBypassEnabled(value);
  };

  const handleSubscribe = async () => {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔵 PURCHASE TAP: User tapped Subscribe button');
    console.log('═══════════════════════════════════════════════════════');
    
    const productId = selectedPlan === 'monthly' ? PRODUCT_IDS.MONTHLY : PRODUCT_IDS.ANNUAL;
    
    console.log('📊 PURCHASE TAP INFO:');
    console.log('  - Selected plan:', selectedPlan);
    console.log('  - Product ID:', productId);
    console.log('  - Bypass enabled:', bypassEnabled);
    console.log('  - Products ready list:', productsReady);
    console.log('  - Is product ready:', isProductReady(productId));
    
    // Check if product object exists in memory
    const productExists = isProductReady(productId);
    console.log('  - Product object exists in memory:', productExists);
    
    if (!productExists) {
      console.log('═══════════════════════════════════════════════════════');
      console.error('❌ PURCHASE BLOCKED: Product object not in memory');
      console.error('❌ This would cause: "Must query item from store before calling purchase"');
      console.error('❌ Product ID:', productId);
      console.error('❌ Available products:', productsReady);
      console.log('═══════════════════════════════════════════════════════');
    }

    // CRITICAL: Check if product is ready before attempting purchase
    // If bypass is enabled, we don't need the product to be ready
    if (!bypassEnabled && !productExists) {
      console.warn('⚠️ PURCHASE BLOCKED: Product not ready for purchase:', productId);
      console.log('═══════════════════════════════════════════════════════');
      
      Alert.alert(
        'Please Wait',
        'Products are still loading. Please try again in a moment.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Additional validation: Check if product has valid price
    const selectedProduct = selectedPlan === 'monthly' ? monthlyProduct : annualProduct;
    if (!bypassEnabled && (!selectedProduct || !selectedProduct.price || !selectedProduct.priceString)) {
      console.error('❌ PURCHASE BLOCKED: Selected product missing valid price data');
      console.error('❌ Product:', selectedProduct);
      console.log('═══════════════════════════════════════════════════════');
      
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
        Alert.alert(
          'Success!',
          'Your subscription is now active. Enjoy unlimited access!',
          [
            {
              text: 'OK',
              onPress: () => {
                console.log('✅ PURCHASE SUCCESS: User acknowledged subscription success');
                if (onDismiss) {
                  onDismiss();
                }
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
                if (onDismiss) {
                  onDismiss();
                }
              },
            },
          ]
        );
      } else {
        Alert.alert(
          'No Purchases Found',
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
    if (loadingProducts) {
      return '...';
    }
    return monthlyProduct?.priceString || '$2.99';
  };

  const getAnnualPrice = () => {
    if (loadingProducts) {
      return '...';
    }
    return annualProduct?.priceString || '$24.99';
  };

  const getAnnualMonthlyPrice = () => {
    if (loadingProducts) {
      return '...';
    }
    if (annualProduct) {
      const annualPrice = parseFloat(annualProduct.price);
      const monthlyEquivalent = (annualPrice / 12).toFixed(2);
      return `${annualProduct.currencyCode === 'USD' ? '$' : ''}${monthlyEquivalent}`;
    }
    return '$2.08';
  };

  // Check if selected product is ready for purchase
  const isSelectedProductReady = () => {
    if (bypassEnabled) {
      console.log('🔧 PRODUCT READY CHECK: Bypass enabled, returning true');
      return true;
    }
    
    const productId = selectedPlan === 'monthly' ? PRODUCT_IDS.MONTHLY : PRODUCT_IDS.ANNUAL;
    const inReadyList = productsReady.includes(productId);
    const hasProductObject = isProductReady(productId);
    const selectedProduct = selectedPlan === 'monthly' ? monthlyProduct : annualProduct;
    const hasValidPrice = !!(selectedProduct?.price && selectedProduct?.priceString);
    
    const ready = inReadyList && hasProductObject && hasValidPrice;
    
    console.log('🔍 PRODUCT READY CHECK:', {
      productId,
      inReadyList,
      hasProductObject,
      hasValidPrice,
      ready
    });
    
    return ready;
  };

  // Show retry UI if products failed to load
  if (productsFailed && !bypassEnabled) {
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
              We couldn't load subscription plans from the App Store. Please check your internet connection and try again.
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

          {isTestFlight && (
            <View style={styles.testFlightContainer}>
              <View style={styles.testFlightHeader}>
                <MaterialIcons name="bug-report" size={20} color={colors.warning} />
                <Text style={styles.testFlightTitle}>TestFlight Mode</Text>
              </View>
              <View style={styles.testFlightToggle}>
                <Text style={styles.testFlightLabel}>
                  Bypass StoreKit (Testing Only)
                </Text>
                <Switch
                  value={bypassEnabled}
                  onValueChange={handleBypassToggle}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.surface}
                />
              </View>
              <Text style={styles.testFlightDescription}>
                {bypassEnabled
                  ? '✅ Simulating purchases (no real charges)'
                  : '⚠️ Using real StoreKit sandbox purchases'}
              </Text>
              {!bypassEnabled && (
                <Text style={styles.testFlightDescription}>
                  Products ready: {productsReady.length > 0 ? productsReady.join(', ') : 'Loading...'}
                </Text>
              )}
            </View>
          )}

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
              (!isSelectedProductReady() && !bypassEnabled) && styles.subscribeButtonDisabled
            ]}
            onPress={handleSubscribe}
            disabled={loading || (loadingProducts && !bypassEnabled) || (!isSelectedProductReady() && !bypassEnabled)}
          >
            {loading ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={buttonStyles.primaryText}>
                {loadingProducts && !bypassEnabled
                  ? 'Loading products...'
                  : !isSelectedProductReady() && !bypassEnabled
                  ? 'Product not available'
                  : `7 day free trial then ${selectedPlan === 'monthly' ? getMonthlyPrice() : getAnnualPrice()}${selectedPlan === 'monthly' ? '/month' : '/year'}`}
              </Text>
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
    fontSize: 18,
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
  testFlightContainer: {
    backgroundColor: colors.warningLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  testFlightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  testFlightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.warning,
    marginLeft: 8,
  },
  testFlightToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  testFlightLabel: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  testFlightDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  subscribeButton: {
    marginBottom: 16,
  },
  subscribeButtonDisabled: {
    opacity: 0.5,
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
