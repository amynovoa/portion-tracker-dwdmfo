
import React, { useState } from 'react';
import { IconSymbol } from '@/components/IconSymbol';
import AppLogo from '@/components/AppLogo';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';

interface PaywallScreenProps {
  visible: boolean;
  onDismiss?: () => void;
  canDismiss?: boolean;
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: colors.background,
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    maxHeight: '85%',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingTop: 8,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  featuresContainer: {
    marginBottom: 24,
  },
  featureRow: {
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
  subscriptionOptions: {
    marginBottom: 24,
  },
  optionButton: {
    borderWidth: 2,
    borderColor: colors.lightGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    backgroundColor: colors.white,
  },
  optionButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  optionPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  optionSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  primaryButton: {
    ...buttonStyles.primary,
    marginBottom: 16,
  },
  primaryButtonText: {
    ...buttonStyles.primaryText,
  },
  footer: {
    marginTop: 8,
  },
  footerText: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 16,
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 16,
  },
  linkButton: {
    paddingVertical: 8,
  },
  linkText: {
    fontSize: 14,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
});

export default function PaywallScreen({ visible, onDismiss, canDismiss = true }: PaywallScreenProps) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('monthly');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    setIsLoading(true);
    // TODO: Backend Integration - Implement actual subscription logic with Apple In-App Purchase
    console.log('Subscribe to:', selectedPlan);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      onDismiss?.();
    }, 1500);
  };

  const handleRestorePurchases = async () => {
    setIsLoading(true);
    // TODO: Backend Integration - Implement restore purchases logic
    console.log('Restore purchases');
    
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const getButtonText = () => {
    return 'Start 7-Day Free Trial';
  };

  const getButtonSubtext = () => {
    if (selectedPlan === 'monthly') {
      return 'Then $2.99 per month';
    }
    return 'Then $24.99 per year';
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={canDismiss ? onDismiss : undefined}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.container}>
          {canDismiss && (
            <TouchableOpacity style={styles.closeButton} onPress={onDismiss}>
              <IconSymbol name="xmark" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <View style={styles.logoContainer}>
              <AppLogo size={60} />
            </View>

            <Text style={styles.title}>Unlock Full Access</Text>

            <View style={styles.featuresContainer}>
              <View style={styles.featureRow}>
                <IconSymbol name="checkmark.circle.fill" size={24} color={colors.primary} />
                <Text style={styles.featureText}>Track meals using simple portions</Text>
              </View>
              <View style={styles.featureRow}>
                <IconSymbol name="checkmark.circle.fill" size={24} color={colors.primary} />
                <Text style={styles.featureText}>Personalized goals based on activity level</Text>
              </View>
              <View style={styles.featureRow}>
                <IconSymbol name="checkmark.circle.fill" size={24} color={colors.primary} />
                <Text style={styles.featureText}>Progress insights and reminders</Text>
              </View>
              <View style={styles.featureRow}>
                <IconSymbol name="checkmark.circle.fill" size={24} color={colors.primary} />
                <Text style={styles.featureText}>Access to all current and future features</Text>
              </View>
            </View>

            <View style={styles.subscriptionOptions}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  selectedPlan === 'monthly' && styles.optionButtonSelected,
                ]}
                onPress={() => setSelectedPlan('monthly')}
              >
                <View style={styles.optionHeader}>
                  <Text style={styles.optionTitle}>Monthly Access</Text>
                  <Text style={styles.optionPrice}>$2.99</Text>
                </View>
                <Text style={styles.optionSubtext}>7-day free trial, then $2.99 per month</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionButton,
                  selectedPlan === 'annual' && styles.optionButtonSelected,
                ]}
                onPress={() => setSelectedPlan('annual')}
              >
                <View style={styles.optionHeader}>
                  <Text style={styles.optionTitle}>Annual Access</Text>
                  <Text style={styles.optionPrice}>$24.99</Text>
                </View>
                <Text style={styles.optionSubtext}>7-day free trial, then $24.99 per year</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleSubscribe}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>{getButtonText()}</Text>
                  <Text style={[styles.primaryButtonText, { fontSize: 12, opacity: 0.9 }]}>
                    {getButtonSubtext()}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Subscriptions renew automatically unless canceled at least 24 hours before the end of the current period. Payment will be charged to your Apple ID account after the free trial ends. You can manage or cancel your subscription anytime in your Apple ID Account Settings.
              </Text>

              <View style={styles.secondaryActions}>
                <TouchableOpacity style={styles.linkButton} onPress={handleRestorePurchases}>
                  <Text style={styles.linkText}>Restore Purchases</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={() => Linking.openURL('https://portiontrack.com/terms-of-use')}
                >
                  <Text style={styles.linkText}>Terms of Use</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={() => Linking.openURL('https://portiontrack.com/privacy-policy')}
                >
                  <Text style={styles.linkText}>Privacy Policy</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
