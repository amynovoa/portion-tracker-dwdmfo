
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
  Alert,
} from 'react-native';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';

interface PaywallScreenProps {
  visible: boolean;
  onDismiss?: () => void;
  canDismiss?: boolean;
}

const PaywallScreen: React.FC<PaywallScreenProps> = ({ visible, onDismiss, canDismiss = false }) => {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('monthly');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    setIsLoading(true);
    // TODO: Backend Integration - Implement actual subscription logic with Superwall
    // This should trigger the Superwall paywall and handle the purchase flow
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert('Subscription', `${selectedPlan} subscription initiated`);
    }, 1000);
  };

  const handleRestorePurchases = async () => {
    setIsLoading(true);
    // TODO: Backend Integration - Implement restore purchases logic
    // This should check with Apple/Google for existing purchases
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert('Restore', 'No purchases to restore');
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
            <IconSymbol ios_icon_name="xmark" android_material_icon_name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        )}

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.logoContainer}>
            <AppLogo size={60} />
          </View>

          <Text style={styles.title}>Unlock Full Access</Text>

          <View style={styles.featuresContainer}>
            <FeatureItem text="Track meals using simple portions" />
            <FeatureItem text="Personalized goals based on activity level" />
            <FeatureItem text="Progress insights and reminders" />
            <FeatureItem text="Access to all current and future features" />
          </View>

          <Text style={styles.sectionTitle}>Subscription Options</Text>

          <TouchableOpacity
            style={[styles.planCard, selectedPlan === 'monthly' && styles.planCardSelected]}
            onPress={() => setSelectedPlan('monthly')}
          >
            <View style={styles.planHeader}>
              <Text style={styles.planTitle}>Monthly Access</Text>
              <View style={[styles.radio, selectedPlan === 'monthly' && styles.radioSelected]}>
                {selectedPlan === 'monthly' && <View style={styles.radioDot} />}
              </View>
            </View>
            <Text style={styles.planSubtitle}>7-day free trial, then $2.99 per month</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.planCard, selectedPlan === 'annual' && styles.planCardSelected]}
            onPress={() => setSelectedPlan('annual')}
          >
            <View style={styles.planHeader}>
              <Text style={styles.planTitle}>Annual Access</Text>
              <View style={[styles.radio, selectedPlan === 'annual' && styles.radioSelected]}>
                {selectedPlan === 'annual' && <View style={styles.radioDot} />}
              </View>
            </View>
            <Text style={styles.planSubtitle}>7-day free trial, then $24.99 per year</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[buttonStyles.primary, styles.subscribeButton]}
            onPress={handleSubscribe}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View>
                <Text style={buttonStyles.primaryText}>{getButtonText()}</Text>
                <Text style={styles.buttonSubtext}>{getButtonSubtext()}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.restoreButton} onPress={handleRestorePurchases}>
            <Text style={styles.restoreText}>Restore Purchases</Text>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            Subscriptions renew automatically unless canceled at least 24 hours before the end of the current period. Payment will be charged to your Apple ID account after the free trial ends. You can manage or cancel your subscription anytime in your Apple ID Account Settings.
          </Text>

          <View style={styles.linksContainer}>
            <TouchableOpacity onPress={() => Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/')}>
              <Text style={styles.linkText}>Terms of Use</Text>
            </TouchableOpacity>
            <Text style={styles.linkSeparator}>•</Text>
            <TouchableOpacity onPress={() => Linking.openURL('https://www.portiontrack.com/privacy-policy')}>
              <Text style={styles.linkText}>Privacy Policy</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const FeatureItem: React.FC<{ text: string }> = ({ text }) => (
  <View style={styles.featureItem}>
    <IconSymbol ios_icon_name="checkmark.circle.fill" android_material_icon_name="check-circle" size={20} color={colors.primary} />
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
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 8,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
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
    marginBottom: 32,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  planCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  planCardSelected: {
    borderColor: colors.primary,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  planSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  subscribeButton: {
    marginTop: 24,
    marginBottom: 16,
  },
  buttonSubtext: {
    fontSize: 12,
    color: '#fff',
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.9,
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
  disclaimer: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 16,
    lineHeight: 16,
  },
  linksContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  linkText: {
    fontSize: 12,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  linkSeparator: {
    fontSize: 12,
    color: colors.textSecondary,
    marginHorizontal: 8,
  },
});

export default PaywallScreen;
