
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';

interface PaywallScreenProps {
  visible: boolean;
  onDismiss?: () => void;
  canDismiss?: boolean;
}

const PaywallScreen: React.FC<PaywallScreenProps> = ({ visible, onDismiss, canDismiss = true }) => {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      // TODO: Backend Integration - Implement actual subscription logic with RevenueCat or App Store
      await new Promise(resolve => setTimeout(resolve, 1500));
      Alert.alert('Success', 'Subscription activated!');
      onDismiss?.();
    } catch (error) {
      console.log('Subscription error:', error);
      Alert.alert('Error', 'Failed to process subscription. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestorePurchases = async () => {
    setLoading(true);
    try {
      // TODO: Backend Integration - Implement restore purchases logic
      await new Promise(resolve => setTimeout(resolve, 1000));
      Alert.alert('Restore Complete', 'Your purchases have been restored.');
    } catch (error) {
      console.log('Restore error:', error);
      Alert.alert('Error', 'Failed to restore purchases.');
    } finally {
      setLoading(false);
    }
  };

  const openPrivacyPolicy = () => {
    // TODO: Replace with your actual privacy policy URL
    Linking.openURL('https://yourapp.com/privacy');
  };

  const openTermsOfService = () => {
    Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/');
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {canDismiss && (
          <TouchableOpacity style={styles.closeButton} onPress={onDismiss}>
            <MaterialIcons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
        )}

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Unlock Premium</Text>
          <Text style={styles.subtitle}>Get full access to all features</Text>

          <View style={styles.featuresContainer}>
            <FeatureItem text="Track unlimited portions daily" />
            <FeatureItem text="View detailed adherence history" />
            <FeatureItem text="Monitor weight progress with charts" />
            <FeatureItem text="Customize all portion targets" />
            <FeatureItem text="Daily reminders and celebrations" />
            <FeatureItem text="Ad-free experience" />
          </View>

          <View style={styles.plansContainer}>
            <TouchableOpacity
              style={[styles.planCard, selectedPlan === 'annual' && styles.planCardSelected]}
              onPress={() => setSelectedPlan('annual')}
            >
              <View style={styles.planHeader}>
                <View style={styles.radioButton}>
                  {selectedPlan === 'annual' && <View style={styles.radioButtonInner} />}
                </View>
                <View style={styles.planInfo}>
                  <Text style={styles.planTitle}>Annual Plan</Text>
                  <Text style={styles.planPrice}>$24.99/year</Text>
                  <Text style={styles.planDetail}>7-day free trial</Text>
                </View>
                <View style={styles.bestValueBadge}>
                  <Text style={styles.bestValueText}>BEST VALUE</Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.planCard, selectedPlan === 'monthly' && styles.planCardSelected]}
              onPress={() => setSelectedPlan('monthly')}
            >
              <View style={styles.planHeader}>
                <View style={styles.radioButton}>
                  {selectedPlan === 'monthly' && <View style={styles.radioButtonInner} />}
                </View>
                <View style={styles.planInfo}>
                  <Text style={styles.planTitle}>Monthly Plan</Text>
                  <Text style={styles.planPrice}>$2.99/month</Text>
                  <Text style={styles.planDetail}>7-day free trial</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[buttonStyles.primary, styles.subscribeButton]}
            onPress={handleSubscribe}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={buttonStyles.primaryText}>
                Start 7-Day Free Trial
              </Text>
            )}
          </TouchableOpacity>

          <Text style={styles.trialNote}>
            Your {selectedPlan === 'annual' ? '$24.99 annual' : '$2.99 monthly'} subscription will begin after the 7-day free trial. Cancel anytime.
          </Text>

          <TouchableOpacity onPress={handleRestorePurchases} disabled={loading}>
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
    top: 16,
    right: 16,
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
    marginBottom: 8,
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
    alignItems: 'center',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  planInfo: {
    flex: 1,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 2,
  },
  planDetail: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  bestValueBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  bestValueText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  subscribeButton: {
    marginBottom: 16,
  },
  trialNote: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 18,
  },
  restoreText: {
    fontSize: 14,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '600',
  },
  linksContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
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
