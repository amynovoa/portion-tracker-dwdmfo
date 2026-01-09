
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
      // TODO: Backend Integration - Implement actual subscription logic with RevenueCat or similar
      Alert.alert('Subscription', `Subscribing to ${selectedPlan} plan...`);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      Alert.alert('Error', 'Failed to process subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleRestorePurchases = async () => {
    setLoading(true);
    try {
      // TODO: Backend Integration - Implement restore purchases logic
      Alert.alert('Restore', 'Checking for previous purchases...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      Alert.alert('Error', 'Failed to restore purchases');
    } finally {
      setLoading(false);
    }
  };

  const openPrivacyPolicy = () => {
    Linking.openURL('https://yourapp.com/privacy');
  };

  const openTermsOfService = () => {
    Linking.openURL('https://yourapp.com/terms');
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {canDismiss && onDismiss && (
          <TouchableOpacity style={styles.closeButton} onPress={onDismiss}>
            <MaterialIcons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
        )}

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Unlock Premium Features</Text>
          <Text style={styles.subtitle}>
            Get full access to all features and track your health journey
          </Text>

          <View style={styles.featuresContainer}>
            <FeatureItem text="Unlimited portion tracking" />
            <FeatureItem text="Detailed adherence analytics" />
            <FeatureItem text="Weight tracking & charts" />
            <FeatureItem text="Custom portion targets" />
            <FeatureItem text="Daily reminders" />
            <FeatureItem text="Export your data" />
          </View>

          <View style={styles.plansContainer}>
            <TouchableOpacity
              style={[
                styles.planCard,
                selectedPlan === 'annual' && styles.planCardSelected,
              ]}
              onPress={() => setSelectedPlan('annual')}
            >
              <View style={styles.planHeader}>
                <Text style={styles.planTitle}>Annual</Text>
                {selectedPlan === 'annual' && (
                  <MaterialIcons name="check-circle" size={24} color={colors.primary} />
                )}
              </View>
              <Text style={styles.planPrice}>$24.99/year</Text>
              <Text style={styles.planDetail}>7-day free trial</Text>
              <Text style={styles.planSavings}>Best Value - Save 65%</Text>
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
              <Text style={styles.planPrice}>$2.99/month</Text>
              <Text style={styles.planDetail}>7-day free trial</Text>
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
            Cancel anytime during trial. No charge until trial ends.
          </Text>

          <TouchableOpacity onPress={handleRestorePurchases} style={styles.restoreButton}>
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
  },
  planCardSelected: {
    borderColor: colors.primary,
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
  planSavings: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  subscribeButton: {
    marginBottom: 12,
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
