
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
import { purchaseProduct, restorePurchases, getProductDetails } from '@/utils/subscriptionManager';
import { PRODUCT_IDS, PRODUCT_CONFIG } from '@/utils/superwallConfig';

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

const PaywallScreen: React.FC<PaywallScreenProps> = ({ visible, onDismiss, canDismiss = true }) => {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
  const [products, setProducts] = useState<{ monthly?: ProductDetails; annual?: ProductDetails }>({});
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Load product details from App Store on mount
  useEffect(() => {
    if (visible) {
      loadProductDetails();
    }
  }, [visible]);

  const loadProductDetails = async () => {
    console.log('Loading product details from App Store...');
    setLoadingProducts(true);
    try {
      const monthlyProduct = await getProductDetails(PRODUCT_IDS.monthly);
      const annualProduct = await getProductDetails(PRODUCT_IDS.annual);
      
      console.log('Monthly product:', monthlyProduct);
      console.log('Annual product:', annualProduct);
      
      setProducts({
        monthly: monthlyProduct || undefined,
        annual: annualProduct || undefined,
      });
    } catch (error) {
      console.error('Error loading product details:', error);
      Alert.alert(
        'Error',
        'Failed to load subscription prices. Please check your internet connection and try again.'
      );
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleSubscribe = async () => {
    const productId = PRODUCT_IDS[selectedPlan];
    console.log('User tapped Subscribe button for plan:', selectedPlan, 'Product ID:', productId);
    
    setLoading(true);
    try {
      // Attempt to purchase the product
      // This will trigger Apple's StoreKit purchase sheet
      const result = await purchaseProduct(productId);
      
      console.log('Purchase result:', result);
      
      if (result.success) {
        Alert.alert(
          'Success!',
          'Your subscription is now active. Enjoy full access to all features!',
          [
            {
              text: 'OK',
              onPress: () => {
                if (onDismiss) {
                  onDismiss();
                }
              },
            },
          ]
        );
      } else if (result.userCancelled) {
        console.log('User cancelled the purchase');
        // Don't show an alert for user cancellation
      } else {
        Alert.alert(
          'Purchase Failed',
          result.error || 'Unable to complete the purchase. Please try again.'
        );
      }
    } catch (error) {
      console.error('Subscription error:', error);
      Alert.alert(
        'Error',
        'An unexpected error occurred. Please try again or contact support if the problem persists.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRestorePurchases = async () => {
    console.log('User tapped Restore Purchases');
    setLoading(true);
    try {
      const result = await restorePurchases();
      
      console.log('Restore purchases result:', result);
      
      if (result.success) {
        Alert.alert(
          'Purchases Restored',
          'Your previous purchases have been restored successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
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
          'We could not find any previous purchases to restore. If you believe this is an error, please contact support.'
        );
      }
    } catch (error) {
      console.error('Restore purchases error:', error);
      Alert.alert(
        'Error',
        'Failed to restore purchases. Please try again or contact support if the problem persists.'
      );
    } finally {
      setLoading(false);
    }
  };

  const openPrivacyPolicy = () => {
    console.log('User tapped Privacy Policy link');
    Linking.openURL('https://www.portiontrack.com/privacy-policy');
  };

  const openTermsOfService = () => {
    console.log('User tapped Terms of Service link');
    Linking.openURL('https://www.apple.com/legal/internet-services/itunes/us/terms.html');
  };

  // Get display prices - use fetched prices or fall back to defaults
  const monthlyPrice = products.monthly?.priceString || PRODUCT_CONFIG[PRODUCT_IDS.monthly].defaultPrice;
  const annualPrice = products.annual?.priceString || PRODUCT_CONFIG[PRODUCT_IDS.annual].defaultPrice;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {canDismiss && onDismiss && (
          <TouchableOpacity style={styles.closeButton} onPress={onDismiss}>
            <MaterialIcons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
        )}

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Unlock Full Access</Text>
          <Text style={styles.subtitle}>
            Get full access to all features and track your health journey
          </Text>

          <View style={styles.featuresContainer}>
            <FeatureItem text="Unlimited portion tracking" />
            <FeatureItem text="Detailed adherence analytics" />
            <FeatureItem text="Weight tracking & charts" />
            <FeatureItem text="Custom portion targets" />
            <FeatureItem text="Daily reminders" />
          </View>

          {loadingProducts ? (
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
                <View style={styles.bestValueBadge}>
                  <Text style={styles.bestValueText}>BEST VALUE</Text>
                </View>
                <View style={styles.planHeader}>
                  <Text style={styles.planTitle}>Annual</Text>
                  {selectedPlan === 'annual' && (
                    <MaterialIcons name="check-circle" size={24} color={colors.primary} />
                  )}
                </View>
                <Text style={styles.planPrice}>{annualPrice}/year</Text>
                <Text style={styles.planDetail}>7-day free trial</Text>
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
                  {selectedPlan === 'monthly' && (
                    <MaterialIcons name="check-circle" size={24} color={colors.primary} />
                  )}
                </View>
                <Text style={styles.planPrice}>{monthlyPrice}/month</Text>
                <Text style={styles.planDetail}>7-day free trial</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.agreementContainer}>
            <Text style={styles.agreementText}>
              By subscribing, you agree to our{' '}
              <Text style={styles.agreementLink} onPress={openTermsOfService}>
                Terms of Service
              </Text>
              {' '}and{' '}
              <Text style={styles.agreementLink} onPress={openPrivacyPolicy}>
                Privacy Policy
              </Text>
              .
            </Text>
          </View>

          <TouchableOpacity
            style={[buttonStyles.primary, styles.subscribeButton]}
            onPress={handleSubscribe}
            disabled={loading || loadingProducts}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={[buttonStyles.primaryText, styles.subscribeButtonText]}>
                {selectedPlan === 'annual' 
                  ? `Start 7-Day Free Trial then ${annualPrice} annually`
                  : `Start 7-Day Free Trial then ${monthlyPrice} monthly`}
              </Text>
            )}
          </TouchableOpacity>

          <Text style={styles.trialNote}>
            Cancel anytime during trial. No charge until trial ends.
          </Text>

          <TouchableOpacity 
            onPress={handleRestorePurchases} 
            style={styles.restoreButton}
            disabled={loading}
          >
            <Text style={styles.restoreText}>Restore Purchases</Text>
          </TouchableOpacity>

          <View style={styles.linksContainer}>
            <TouchableOpacity onPress={openPrivacyPolicy}>
              <Text style={styles.linkText}>Privacy Policy</Text>
            </TouchableOpacity>
            <Text style={styles.linkSeparator}>•</Text>
            <TouchableOpacity onPress={openTermsOfService}>
              <Text style={styles.linkText}>Terms of Service</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const FeatureItem: React.FC<{ text: string }> = ({ text }) => (
  <View style={styles.featureItem}>
    <MaterialIcons name="check-circle" size={24} color={colors.primary} />
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

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
    padding: 8,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
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
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: colors.textSecondary,
  },
  plansContainer: {
    marginBottom: 24,
  },
  planCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  planCardSelected: {
    borderColor: colors.primary,
  },
  bestValueBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bestValueText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
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
    marginBottom: 4,
  },
  agreementContainer: {
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  agreementText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  agreementLink: {
    color: colors.primary,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  subscribeButton: {
    marginBottom: 12,
  },
  subscribeButtonText: {
    textAlign: 'center',
  },
  trialNote: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  restoreButton: {
    padding: 12,
    alignItems: 'center',
  },
  restoreText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  linksContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  linkText: {
    fontSize: 12,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
  linkSeparator: {
    fontSize: 12,
    color: colors.textSecondary,
    marginHorizontal: 8,
  },
});

export default PaywallScreen;
