
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

  useEffect(() => {
    if (visible) {
      loadInitialState();
      loadProducts();
    }
  }, [visible]);

  const loadInitialState = async () => {
    console.log('PaywallScreen: Loading initial state...');
    const testFlight = isTestFlightBuild();
    setIsTestFlight(testFlight);
    console.log('PaywallScreen: Is TestFlight/Dev:', testFlight);

    if (testFlight) {
      const bypass = await getTestFlightBypassEnabled();
      setBypassEnabled(bypass);
      console.log('PaywallScreen: Bypass enabled:', bypass);
    }
  };

  const loadProducts = async () => {
    console.log('PaywallScreen: Loading product details from App Store...');
    setLoadingProducts(true);

    try {
      const [monthly, annual] = await Promise.all([
        getProductDetails(PRODUCT_IDS.MONTHLY),
        getProductDetails(PRODUCT_IDS.ANNUAL),
      ]);

      console.log('PaywallScreen: Monthly product:', monthly);
      console.log('PaywallScreen: Annual product:', annual);

      setMonthlyProduct(monthly);
      setAnnualProduct(annual);
    } catch (error) {
      console.error('PaywallScreen: Error loading products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleBypassToggle = async (value: boolean) => {
    console.log('PaywallScreen: Bypass toggle changed to:', value);
    setBypassEnabled(value);
    await setTestFlightBypassEnabled(value);
  };

  const handleSubscribe = async () => {
    console.log('User tapped Subscribe button');
    console.log('Selected plan:', selectedPlan);

    setLoading(true);

    try {
      const productId = selectedPlan === 'monthly' ? PRODUCT_IDS.MONTHLY : PRODUCT_IDS.ANNUAL;
      console.log('Purchasing product:', productId);

      const result = await purchaseProduct(productId);
      console.log('Purchase result:', result);

      if (result.success) {
        Alert.alert(
          'Success!',
          'Your subscription is now active. Enjoy unlimited access!',
          [
            {
              text: 'OK',
              onPress: () => {
                console.log('User acknowledged subscription success');
                if (onDismiss) {
                  onDismiss();
                }
              },
            },
          ]
        );
      } else if (result.userCancelled) {
        console.log('User cancelled purchase');
      } else {
        Alert.alert(
          'Purchase Failed',
          result.error || 'Unable to complete purchase. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('Purchase error:', error);
      Alert.alert(
        'Error',
        error.message || 'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRestorePurchases = async () => {
    console.log('User tapped Restore Purchases button');

    setLoading(true);

    try {
      const result = await restorePurchases();
      console.log('Restore result:', result);

      if (result.success) {
        Alert.alert(
          'Success!',
          'Your subscription has been restored.',
          [
            {
              text: 'OK',
              onPress: () => {
                console.log('User acknowledged restore success');
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
      console.error('Restore error:', error);
      Alert.alert(
        'Error',
        error.message || 'Unable to restore purchases. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const openPrivacyPolicy = () => {
    console.log('Opening privacy policy...');
    Linking.openURL('https://www.portiontrack.com/privacy-policy');
  };

  const openTermsOfService = () => {
    console.log('Opening terms of service...');
    Linking.openURL('https://www.portiontrack.com/terms-of-service');
  };

  const getMonthlyPrice = () => {
    if (loadingProducts) {
      return '...';
    }
    return monthlyProduct?.priceString || '$9.99';
  };

  const getAnnualPrice = () => {
    if (loadingProducts) {
      return '...';
    }
    return annualProduct?.priceString || '$59.99';
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
    return '$4.99';
  };

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
            <Text style={styles.title}>Unlock Premium</Text>
            <Text style={styles.subtitle}>
              Get unlimited access to all features
            </Text>
          </View>

          <View style={styles.featuresContainer}>
            <FeatureItem text="Track unlimited portions" />
            <FeatureItem text="View detailed adherence history" />
            <FeatureItem text="Customize portion targets" />
            <FeatureItem text="Weight tracking & progress charts" />
            <FeatureItem text="Daily reminders & celebrations" />
            <FeatureItem text="Backup & restore your data" />
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
                  <Text style={styles.popularText}>BEST VALUE</Text>
                </View>
              )}
              <View style={styles.planHeader}>
                <Text style={styles.planName}>Annual</Text>
                <Text style={styles.planPrice}>{getAnnualPrice()}/year</Text>
              </View>
              <Text style={styles.planDescription}>
                Just {getAnnualMonthlyPrice()}/month
              </Text>
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
                <Text style={styles.planPrice}>{getMonthlyPrice()}/month</Text>
              </View>
              <Text style={styles.planDescription}>Billed monthly</Text>
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
            </View>
          )}

          <TouchableOpacity
            style={[buttonStyles.primary, styles.subscribeButton]}
            onPress={handleSubscribe}
            disabled={loading || loadingProducts}
          >
            {loading ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={buttonStyles.primaryText}>
                {loadingProducts ? 'Loading...' : 'Start Free Trial'}
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

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              7-day free trial, then {selectedPlan === 'monthly' ? getMonthlyPrice() : getAnnualPrice()}{' '}
              {selectedPlan === 'monthly' ? 'per month' : 'per year'}. Cancel anytime.
            </Text>
            <View style={styles.footerLinks}>
              <TouchableOpacity onPress={openPrivacyPolicy}>
                <Text style={styles.footerLink}>Privacy Policy</Text>
              </TouchableOpacity>
              <Text style={styles.footerSeparator}>•</Text>
              <TouchableOpacity onPress={openTermsOfService}>
                <Text style={styles.footerLink}>Terms of Service</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
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
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  planCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  planDescription: {
    fontSize: 14,
    color: colors.textSecondary,
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
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 18,
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerLink: {
    fontSize: 12,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  footerSeparator: {
    fontSize: 12,
    color: colors.textSecondary,
    marginHorizontal: 8,
  },
});
