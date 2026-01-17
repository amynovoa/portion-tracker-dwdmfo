
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
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';

interface PaywallScreenProps {
  visible: boolean;
  onDismiss?: () => void;
  canDismiss?: boolean;
}

export default function PaywallScreen({ visible, onDismiss, canDismiss = true }: PaywallScreenProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubscribe = async () => {
    console.log('User tapped Subscribe button');
    setIsProcessing(true);
    
    try {
      // Superwall integration - will work in native builds
      Alert.alert(
        'Subscription',
        'Subscription options will be available in the native build.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error showing subscription:', error);
      Alert.alert('Error', 'Failed to show subscription options. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestorePurchases = async () => {
    console.log('User tapped Restore Purchases button');
    setIsProcessing(true);
    
    try {
      Alert.alert(
        'Restore Purchases',
        'Purchase restoration will be available in the native build.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Restore purchases error:', error);
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const openPrivacyPolicy = () => {
    console.log('User tapped Privacy Policy');
    Linking.openURL('https://yourapp.com/privacy');
  };

  const openTermsOfService = () => {
    console.log('User tapped Terms of Service');
    Linking.openURL('https://yourapp.com/terms');
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
            <Text style={styles.subtitle}>Get unlimited access to all features</Text>
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
            <Text style={styles.priceText}>Starting at $2.99/month</Text>
            <Text style={styles.priceSubtext}>Cancel anytime. 7-day free trial.</Text>
          </View>

          <TouchableOpacity
            style={[buttonStyles.primary, styles.subscribeButton]}
            onPress={handleSubscribe}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={buttonStyles.primaryText}>View Subscription Options</Text>
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
