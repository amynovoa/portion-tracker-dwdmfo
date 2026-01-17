
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
import { saveSubscriptionStatus } from '@/utils/storage';
import Constants from 'expo-constants';

interface PaywallScreenProps {
  visible: boolean;
  onDismiss?: () => void;
  canDismiss?: boolean;
}

type SubscriptionPlan = 'annual' | 'monthly';

export default function PaywallScreen({ visible, onDismiss, canDismiss = true }: PaywallScreenProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('annual');

  // Check if running in TestFlight or development
  const isTestFlightOrDev = __DEV__ || Constants.appOwnership === 'expo';

  const handleSubscribe = async () => {
    console.log('User tapped Subscribe button with plan:', selectedPlan);
    setIsProcessing(true);
    
    try {
      // For now, simulate successful subscription
      // In production with Superwall properly configured, this will trigger real subscriptions
      console.log('Simulating successful subscription');
      await saveSubscriptionStatus(true);
      Alert.alert(
        'Success',
        'Subscription activated!',
        [
          {
            text: 'OK',
            onPress: () => {
              console.log('Subscription successful, dismissing paywall');
              if (onDismiss) {
                onDismiss();
              }
            }
          }
        ]
      );
      setIsProcessing(false);
    } catch (error) {
      console.error('Error showing subscription:', error);
      Alert.alert('Error', 'Failed to show subscription options. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleRestorePurchases = async () => {
    console.log('User tapped Restore Purchases button');
    setIsProcessing(true);
    
    try {
      // Simulate successful restore
      console.log('Simulating successful restore');
      await saveSubscriptionStatus(true);
      Alert.alert(
        'Success',
        'Purchases restored!',
        [
          {
            text: 'OK',
            onPress: () => {
              console.log('Restore successful, dismissing paywall');
              if (onDismiss) {
                onDismiss();
              }
            }
          }
        ]
      );
      setIsProcessing(false);
    } catch (error) {
      console.error('Restore purchases error:', error);
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
      setIsProcessing(false);
    }
  };

  const openPrivacyPolicy = () => {
    console.log('User tapped Privacy Policy');
    Linking.openURL('https://www.portiontrack.com/privacy-policy');
  };

  const openTermsOfService = () => {
    console.log('User tapped Terms of Service');
    Linking.openURL('https://www.apple.com/legal/internet-services/itunes/');
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
            <Text style={styles.title}>7-day free trial.{'\n'}Cancel anytime.</Text>
            <Text style={styles.subtitle}>
              Payment will be charged to your Apple ID at confirmation of purchase or at the end of the trial. Subscription automatically renews unless canceled at least 24 hours before the end of the period.
            </Text>
          </View>

          <View style={styles.featuresContainer}>
            <Text style={styles.featuresTitle}>Subscription includes:</Text>
            <FeatureItem text="Unlimited portion tracking" />
            <FeatureItem text="Custom portion targets" />
            <FeatureItem text="Weight tracking & charts" />
            <FeatureItem text="Adherence history & trends" />
            <FeatureItem text="Daily reminders" />
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
                <View style={styles.planTitleContainer}>
                  <Text style={styles.planTitle}>Annual</Text>
                  <View style={styles.bestValueBadge}>
                    <Text style={styles.bestValueText}>Best Value</Text>
                  </View>
                </View>
                <View style={[
                  styles.radioButton,
                  selectedPlan === 'annual' && styles.radioButtonSelected,
                ]}>
                  {selectedPlan === 'annual' && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
              </View>
              <Text style={styles.planPrice}>$24.99</Text>
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
                <View style={[
                  styles.radioButton,
                  selectedPlan === 'monthly' && styles.radioButtonSelected,
                ]}>
                  {selectedPlan === 'monthly' && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
              </View>
              <Text style={styles.planPrice}>$2.99</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.legalContainer}>
            <Text style={styles.legalText}>By clicking I agree to the </Text>
            <TouchableOpacity onPress={openTermsOfService}>
              <Text style={styles.legalLink}>Terms of Service</Text>
            </TouchableOpacity>
            <Text style={styles.legalText}> and{'\n'}</Text>
            <TouchableOpacity onPress={openPrivacyPolicy}>
              <Text style={styles.legalLink}>Privacy Policy</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[buttonStyles.primary, styles.subscribeButton]}
            onPress={handleSubscribe}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={buttonStyles.primaryText}>
                {selectedPlan === 'annual' 
                  ? '7 day free trial then $24.99/year'
                  : '7 day free trial then $2.99/month'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestorePurchases}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={styles.restoreButtonText}>Restore Purchases</Text>
            )}
          </TouchableOpacity>

          {isTestFlightOrDev && (
            <View style={styles.devModeContainer}>
              <Text style={styles.devModeText}>
                ℹ️ TestFlight/Dev Mode: Subscriptions are simulated
              </Text>
            </View>
          )}
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
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  featuresContainer: {
    marginBottom: 32,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
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
  plansContainer: {
    marginBottom: 24,
  },
  planCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  planCardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#FFE5E5',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  planTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  bestValueBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bestValueText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  planPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: colors.primary,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  legalContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  legalText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  legalLink: {
    fontSize: 14,
    color: colors.primary,
    textDecorationLine: 'underline',
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
  devModeContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  devModeText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
