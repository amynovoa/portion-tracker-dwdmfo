
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
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
import { purchaseProduct, restorePurchases, getProductDetails } from '@/utils/subscriptionManager';
import { PRODUCT_IDS, PRODUCT_CONFIG } from '@/utils/superwallConfig';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
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

export default function PaywallScreen({ visible, onDismiss, canDismiss = true }: PaywallScreenProps) {
  const [loading, setLoading] = useState(false);
  const [productDetails, setProductDetails] = useState<{
    monthly?: ProductDetails;
    annual?: ProductDetails;
  }>({});

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

  const handleSubscribe = async (productId: string) => {
    console.log('PaywallScreen: User tapped Subscribe button for', productId);
    setLoading(true);
    try {
      console.log('PaywallScreen: Initiating purchase for', productId);
      const result = await purchaseProduct(productId);
      console.log('PaywallScreen: Purchase result:', result);
      
      if (result.success) {
        console.log('PaywallScreen: Purchase successful, dismissing paywall');
        Alert.alert('Success', 'Thank you for subscribing!');
        onDismiss?.();
      } else if (result.userCancelled) {
        console.log('PaywallScreen: Purchase cancelled by user');
      } else {
        console.error('PaywallScreen: Purchase failed:', result.error);
        Alert.alert('Error', result.error || 'Purchase failed. Please try again.');
      }
    } catch (error) {
      console.error('PaywallScreen: Purchase error:', error);
      Alert.alert('Error', 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestorePurchases = async () => {
    console.log('PaywallScreen: User tapped Restore Purchases');
    setLoading(true);
    try {
      console.log('PaywallScreen: Restoring purchases');
      const result = await restorePurchases();
      console.log('PaywallScreen: Restore result:', result);
      
      if (result.success) {
        console.log('PaywallScreen: Purchases restored successfully');
        Alert.alert('Success', 'Your purchases have been restored!');
        onDismiss?.();
      } else {
        console.log('PaywallScreen: No purchases to restore');
        Alert.alert('No Purchases Found', 'No previous purchases were found for this account.');
      }
    } catch (error) {
      console.error('PaywallScreen: Restore error:', error);
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openPrivacyPolicy = () => {
    console.log('PaywallScreen: Opening privacy policy');
    Linking.openURL('https://www.portiontrack.com/privacy-policy');
  };

  const openTermsOfService = () => {
    console.log('PaywallScreen: Opening terms of service');
    Linking.openURL('https://www.portiontrack.com/terms');
  };

  // Show development message in Expo Go
  if (isExpoGo) {
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
                You&apos;re running in Expo Go, which doesn&apos;t support native payment modules like Superwall.
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
          <Text style={styles.title}>Unlock Premium Features</Text>
          <Text style={styles.subtitle}>
            Get unlimited access to all features and support the app&apos;s development
          </Text>

          <View style={styles.featuresContainer}>
            <FeatureItem text="Unlimited portion tracking" />
            <FeatureItem text="Advanced adherence analytics" />
            <FeatureItem text="Custom portion targets" />
            <FeatureItem text="Weight tracking & charts" />
            <FeatureItem text="Daily reminders" />
            <FeatureItem text="Data backup & restore" />
            <FeatureItem text="Priority support" />
          </View>

          <View style={styles.plansContainer}>
            {/* Monthly Plan */}
            <TouchableOpacity
              style={[styles.planCard, loading && styles.planCardDisabled]}
              onPress={() => handleSubscribe(PRODUCT_IDS.monthly)}
              disabled={loading}
            >
              <View style={styles.planHeader}>
                <Text style={styles.planName}>Monthly</Text>
                <Text style={styles.planPrice}>
                  {productDetails.monthly?.priceString || PRODUCT_CONFIG[PRODUCT_IDS.monthly].defaultPrice}
                </Text>
              </View>
              <Text style={styles.planDescription}>Billed monthly</Text>
            </TouchableOpacity>

            {/* Annual Plan */}
            <TouchableOpacity
              style={[styles.planCard, styles.planCardPopular, loading && styles.planCardDisabled]}
              onPress={() => handleSubscribe(PRODUCT_IDS.annual)}
              disabled={loading}
            >
              <View style={styles.popularBadge}>
                <Text style={styles.popularBadgeText}>BEST VALUE</Text>
              </View>
              <View style={styles.planHeader}>
                <Text style={styles.planName}>Annual</Text>
                <Text style={styles.planPrice}>
                  {productDetails.annual?.priceString || PRODUCT_CONFIG[PRODUCT_IDS.annual].defaultPrice}
                </Text>
              </View>
              <Text style={styles.planDescription}>
                {productDetails.annual 
                  ? `${(productDetails.annual.price / 12).toFixed(2)} ${productDetails.annual.currencyCode}/month`
                  : 'Save 40% compared to monthly'
                }
              </Text>
            </TouchableOpacity>
          </View>

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Processing...</Text>
            </View>
          )}

          <TouchableOpacity
            style={[buttonStyles.secondary, styles.restoreButton]}
            onPress={handleRestorePurchases}
            disabled={loading}
          >
            <Text style={buttonStyles.secondaryText}>Restore Purchases</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Subscriptions auto-renew unless cancelled 24 hours before the end of the current period.
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
  },
  planCardPopular: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight || colors.cardBackground,
  },
  planCardDisabled: {
    opacity: 0.6,
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  planDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
  },
  restoreButton: {
    marginBottom: 24,
  },
  footer: {
    marginTop: 16,
  },
  footerText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
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
