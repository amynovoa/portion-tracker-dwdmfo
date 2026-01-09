
import React, { useState } from 'react';
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
} from 'react-native';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

interface PaywallScreenProps {
  visible: boolean;
  onDismiss?: () => void;
  canDismiss?: boolean;
}

export default function PaywallScreen({ visible, onDismiss, canDismiss = true }: PaywallScreenProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    setIsLoading(true);
    // Simulate subscription process
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert('Success', 'Thank you for subscribing to Premium!');
      onDismiss?.();
    }, 2000);
  };

  const handleRestorePurchases = async () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert('Restore', 'No previous purchases found.');
    }, 1500);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {canDismiss && (
          <TouchableOpacity style={styles.closeButton} onPress={onDismiss}>
            <IconSymbol ios_icon_name="xmark" android_material_icon_name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        )}

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <IconSymbol ios_icon_name="star.fill" android_material_icon_name="star" size={60} color="#FFD700" />
            <Text style={styles.title}>Upgrade to Premium</Text>
            <Text style={styles.subtitle}>Unlock all features and support development</Text>
          </View>

          <View style={styles.featuresContainer}>
            <FeatureItem text="Advanced analytics and insights" />
            <FeatureItem text="Custom portion targets" />
            <FeatureItem text="Export your data" />
            <FeatureItem text="Priority support" />
            <FeatureItem text="Ad-free experience" />
          </View>

          <View style={styles.pricingContainer}>
            <Text style={styles.price}>$4.99/month</Text>
            <Text style={styles.priceSubtext}>Cancel anytime</Text>
          </View>

          <TouchableOpacity
            style={[buttonStyles.primary, styles.subscribeButton]}
            onPress={handleSubscribe}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={buttonStyles.primaryText}>Subscribe Now</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.restoreButton} onPress={handleRestorePurchases}>
            <Text style={styles.restoreText}>Restore Purchases</Text>
          </TouchableOpacity>

          <View style={styles.legalContainer}>
            <Text style={styles.legalText}>
              By subscribing, you agree to our{' '}
              <Text style={styles.link} onPress={() => Linking.openURL('https://example.com/terms')}>
                Terms of Service
              </Text>{' '}
              and{' '}
              <Text style={styles.link} onPress={() => Linking.openURL('https://example.com/privacy')}>
                Privacy Policy
              </Text>
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <View style={styles.featureItem}>
      <IconSymbol ios_icon_name="checkmark.circle.fill" android_material_icon_name="check-circle" size={24} color={colors.primary} />
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
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  content: {
    padding: 24,
    paddingTop: 80,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 8,
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
  },
  pricingContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
  },
  priceSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  subscribeButton: {
    marginBottom: 16,
  },
  restoreButton: {
    padding: 16,
    alignItems: 'center',
  },
  restoreText: {
    fontSize: 16,
    color: colors.primary,
  },
  legalContainer: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  legalText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  link: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
});
