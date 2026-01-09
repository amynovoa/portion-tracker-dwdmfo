
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
} from 'react-native';
import { IconSymbol } from '@/components/IconSymbol';
import AppLogo from '@/components/AppLogo';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';

interface PaywallScreenProps {
  visible: boolean;
  onDismiss?: () => void;
  canDismiss?: boolean;
}

const PaywallScreen: React.FC<PaywallScreenProps> = ({
  visible,
  onDismiss,
  canDismiss = false,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('monthly');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    setIsLoading(true);
    // TODO: Backend Integration - Call Apple In-App Purchase API to initiate subscription
    // For monthly: product ID 'portion_track_monthly' with 7-day trial
    // For annual: product ID 'portion_track_annual'
    console.log('Subscribing to:', selectedPlan);
    setTimeout(() => {
      setIsLoading(false);
      onDismiss?.();
    }, 1000);
  };

  const handleRestorePurchases = async () => {
    setIsLoading(true);
    // TODO: Backend Integration - Call Apple In-App Purchase API to restore purchases
    console.log('Restoring purchases...');
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const getButtonText = () => {
    if (selectedPlan === 'monthly') {
      return 'Start 7-Day Free Trial';
    }
    return 'Continue';
  };

  const getButtonSubtext = () => {
    if (selectedPlan === 'monthly') {
      return 'Then $2.99 per month';
    }
    return 'Billed $24.99 annually';
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {canDismiss && onDismiss && (
          <TouchableOpacity style={styles.closeButton} onPress={onDismiss}>
            <IconSymbol 
              ios_icon_name="xmark.circle.fill" 
              android_material_icon_name="close" 
              size={32} 
              color={colors.text} 
            />
          </TouchableOpacity>
        )}

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <AppLogo size={80} />
            <Text style={styles.title}>Unlock Full Access</Text>
          </View>

          <View style={styles.featuresContainer}>
            <View style={styles.featureRow}>
              <IconSymbol 
                ios_icon_name="checkmark.circle.fill" 
                android_material_icon_name="check-circle" 
                size={24} 
                color={colors.primary} 
              />
              <Text style={styles.featureText}>Track meals using simple portions</Text>
            </View>
            <View style={styles.featureRow}>
              <IconSymbol 
                ios_icon_name="checkmark.circle.fill" 
                android_material_icon_name="check-circle" 
                size={24} 
                color={colors.primary} 
              />
              <Text style={styles.featureText}>Personalized goals based on activity level</Text>
            </View>
            <View style={styles.featureRow}>
              <IconSymbol 
                ios_icon_name="checkmark.circle.fill" 
                android_material_icon_name="check-circle" 
                size={24} 
                color={colors.primary} 
              />
              <Text style={styles.featureText}>Progress insights and reminders</Text>
            </View>
            <View style={styles.featureRow}>
              <IconSymbol 
                ios_icon_name="checkmark.circle.fill" 
                android_material_icon_name="check-circle" 
                size={24} 
                color={colors.primary} 
              />
              <Text style={styles.featureText}>Access to all current and future features</Text>
            </View>
          </View>

          <View style={styles.subscriptionOptionsContainer}>
            <Text style={styles.sectionTitle}>Subscription Options</Text>

            <TouchableOpacity
              style={[styles.planCard, selectedPlan === 'monthly' && styles.planCardSelected]}
              onPress={() => setSelectedPlan('monthly')}
            >
              <View style={styles.planContent}>
                <View style={styles.radioButton}>
                  {selectedPlan === 'monthly' && <View style={styles.radioButtonInner} />}
                </View>
                <View style={styles.planDetails}>
                  <Text style={styles.planName}>Monthly Access</Text>
                  <Text style={styles.planDescription}>7-day free trial, then $2.99 per month</Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.planCard, selectedPlan === 'annual' && styles.planCardSelected]}
              onPress={() => setSelectedPlan('annual')}
            >
              <View style={styles.planContent}>
                <View style={styles.radioButton}>
                  {selectedPlan === 'annual' && <View style={styles.radioButtonInner} />}
                </View>
                <View style={styles.planDetails}>
                  <Text style={styles.planName}>Annual Access</Text>
                  <Text style={styles.planDescription}>$24.99 per year</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[buttonStyles.primary, styles.subscribeButton]}
            onPress={handleSubscribe}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={styles.buttonContent}>
                <Text style={buttonStyles.primaryText}>{getButtonText()}</Text>
                <Text style={styles.buttonSubtext}>{getButtonSubtext()}</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.appleDisclosure}>
            <Text style={styles.appleDisclaimerText}>
              Subscriptions renew automatically unless canceled at least 24 hours before the end of the current period. Payment will be charged to your Apple ID account after the free trial ends. You can manage or cancel your subscription anytime in your Apple ID Account Settings.
            </Text>
          </View>

          <View style={styles.secondaryActions}>
            <TouchableOpacity onPress={handleRestorePurchases} disabled={isLoading}>
              <Text style={styles.linkText}>Restore Purchases</Text>
            </TouchableOpacity>
            <Text style={styles.separator}>•</Text>
            <TouchableOpacity onPress={() => Linking.openURL('https://portiontrack.com/terms-of-use')}>
              <Text style={styles.linkText}>Terms of Use</Text>
            </TouchableOpacity>
            <Text style={styles.separator}>•</Text>
            <TouchableOpacity onPress={() => Linking.openURL('https://portiontrack.com/privacy-policy')}>
              <Text style={styles.linkText}>Privacy Policy</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 8,
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
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
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  featuresContainer: {
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  featureText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
    lineHeight: 22,
  },
  subscriptionOptionsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  planCard: {
    backgroundColor: colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: colors.border,
  },
  planCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  planContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  planDetails: {
    flex: 1,
  },
  planName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  subscribeButton: {
    marginBottom: 24,
    paddingVertical: 16,
  },
  buttonContent: {
    alignItems: 'center',
  },
  buttonSubtext: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
    opacity: 0.9,
  },
  appleDisclosure: {
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  appleDisclaimerText: {
    color: colors.textSecondary,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  linkText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  separator: {
    color: colors.textSecondary,
    fontSize: 14,
  },
});

export default PaywallScreen;
