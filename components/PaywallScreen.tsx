
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
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
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

export default function PaywallScreen({ visible, onDismiss, canDismiss = true }: PaywallScreenProps) {
  const [loading, setLoading] = useState(false);
  const [productDetails, setProductDetails] = useState<ProductDetails | null>(null);

  useEffect(() => {
    if (visible) {
      loadProductDetails();
    }
  }, [visible]);

  const loadProductDetails = async () => {
    try {
      setLoading(true);
      const details = await getProductDetails(PRODUCT_IDS.MONTHLY);
      setProductDetails(details);
    } catch (error) {
      console.error('Error loading product details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    console.log('User tapped Subscribe button');
    
    // Show message that subscriptions are temporarily disabled
    Alert.alert(
      'Subscriptions Temporarily Disabled',
      'Subscription features have been temporarily disabled to fix app launch issues. The app is fully functional without a subscription during this time.',
      [{ text: 'OK' }]
    );
  };

  const handleRestorePurchases = async () => {
    console.log('User tapped Restore Purchases button');
    
    Alert.alert(
      'Restore Purchases',
      'Subscription features are temporarily disabled. All features are available without a subscription.',
      [{ text: 'OK' }]
    );
  };

  const openPrivacyPolicy = () => {
    console.log('User tapped Privacy Policy');
    Linking.openURL('https://yourapp.com/privacy');
  };

  const openTermsOfService = () => {
    console.log('User tapped Terms of Service');
    Linking.openURL('https://yourapp.com/terms');
  };

  const getButtonText = () => {
    if (loading) return 'Loading...';
    if (productDetails) {
      return `Subscribe for ${productDetails.priceString}/month`;
    }
    return 'Subscribe Now';
  };

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
          <View style={styles.header}>
            <Text style={styles.title}>Unlock Premium Features</Text>
            <Text style={styles.subtitle}>
              Get unlimited access to all features
            </Text>
          </View>

          <View style={styles.featuresContainer}>
            <FeatureItem text="Track unlimited daily portions" />
            <FeatureItem text="View detailed adherence history" />
            <FeatureItem text="Set custom portion targets" />
            <FeatureItem text="Track weight progress over time" />
            <FeatureItem text="Automatic data backup" />
            <FeatureItem text="Daily reminders" />
            <FeatureItem text="No ads, ever" />
          </View>

          <View style={styles.priceContainer}>
            {loading ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : (
              <>
                <Text style={styles.priceText}>
                  {productDetails?.priceString || '$2.99'}/month
                </Text>
                <Text style={styles.priceSubtext}>
                  Cancel anytime. {PRODUCT_CONFIG.TRIAL_DAYS}-day free trial.
                </Text>
              </>
            )}
          </View>

          <TouchableOpacity
            style={[buttonStyles.primary, styles.subscribeButton]}
            onPress={handleSubscribe}
            disabled={loading}
          >
            <Text style={buttonStyles.primaryText}>{getButtonText()}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestorePurchases}
          >
            <Text style={styles.restoreButtonText}>Restore Purchases</Text>
          </TouchableOpacity>

          <View style={styles.legalContainer}>
            <TouchableOpacity onPress={openPrivacyPolicy}>
              <Text style={styles.legalText}>Privacy Policy</Text>
            </TouchableOpacity>
            <Text style={styles.legalSeparator}>•</Text>
            <TouchableOpacity onPress={openTermsOfService}>
              <Text style={styles.legalText}>Terms of Service</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.disclaimerText}>
            Subscription automatically renews unless auto-renew is turned off at least 24 hours before the end of the current period.
          </Text>
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
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
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
  priceContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  priceText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  priceSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
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
  legalContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  legalText: {
    fontSize: 14,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  legalSeparator: {
    fontSize: 14,
    color: colors.textSecondary,
    marginHorizontal: 12,
  },
  disclaimerText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
