/**
 * Paywall Screen
 *
 * Shows subscription options and handles purchases.
 * Matches the app's warm red/cream design language.
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { PurchasesPackage } from "react-native-purchases";

import { useSubscription } from "@/contexts/SubscriptionContext";
import { markSubscribed } from "@/utils/userStateManager";
import { loadProfile } from "@/utils/storage";
import AppLogo from "@/components/AppLogo";

// Premium features
const FEATURES = [
  { icon: "🍽️", title: "Unlimited Portion Tracking", description: "Track all your daily portions without limits" },
  { icon: "🥗", title: "Healthy Portion Guidance", description: "Science-based portion sizes for balanced eating" },
  { icon: "🎯", title: "Custom Portion Targets", description: "Set personalised targets based on your goals" },
  { icon: "⚖️", title: "Weight Tracking & Charts", description: "Log and visualise your weight over time" },
  { icon: "📊", title: "Progress History & Trends", description: "View your full adherence history and trends" },
  { icon: "🔔", title: "Daily Reminders", description: "Custom notifications to keep you on track" },
];

function getColors(scheme: "light" | "dark") {
  const isDark = scheme === "dark";
  return {
    background: isDark ? "#1A0F0E" : "#FDF6F5",
    surface: isDark ? "#2A1A18" : "#FFFFFF",
    primary: isDark ? "#E05A4D" : "#C94A3D",
    text: isDark ? "#F5EDEC" : "#1A0F0E",
    secondaryText: isDark ? "#B09490" : "#7A5C59",
    border: isDark ? "rgba(224,90,77,0.12)" : "rgba(201,74,61,0.10)",
    primaryBorder: isDark ? "#E05A4D" : "#C94A3D",
    accent: "#C8D647",
  };
}

export default function PaywallScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const C = getColors(isDark ? "dark" : "light");

  const { packages, loading, purchasePackage, restorePurchases } =
    useSubscription();

  const [selectedPackage, setSelectedPackage] =
    useState<PurchasesPackage | null>(packages[0] || null);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  // Update selected package when packages load
  React.useEffect(() => {
    if (packages.length > 0 && !selectedPackage) {
      setSelectedPackage(packages[0]);
    }
  }, [packages, selectedPackage]);

  // Navigate after a successful purchase or restore
  const navigateAfterPurchase = async () => {
    console.log("[Paywall] Purchase/restore confirmed — persisting subscription flag");
    await markSubscribed();
    const profile = await loadProfile();
    const onboardingComplete = !!(profile && profile.portionTargets);
    console.log("[Paywall] Post-purchase onboarding check — complete:", onboardingComplete);
    if (onboardingComplete) {
      console.log("[Paywall] Onboarding done → navigating to /(tabs)");
      router.replace("/(tabs)");
    } else {
      console.log("[Paywall] Onboarding not done → navigating to /setup-profile");
      router.replace("/setup-profile");
    }
  };

  // Handle purchase
  const handlePurchase = async () => {
    if (!selectedPackage) return;
    console.log("[Paywall] Subscribe button pressed — package:", selectedPackage.identifier);

    try {
      setPurchasing(true);
      const success = await purchasePackage(selectedPackage);
      if (success) {
        console.log("[Paywall] Purchase successful");
        await navigateAfterPurchase();
      } else {
        console.log("[Paywall] Purchase cancelled by user");
      }
    } catch (error: any) {
      console.log("[Paywall] Purchase failed:", error.message);
      Alert.alert("Purchase Failed", error.message || "Please try again.");
    } finally {
      setPurchasing(false);
    }
  };

  // Handle restore
  const handleRestore = async () => {
    console.log("[Paywall] Restore Purchases tapped");
    try {
      setRestoring(true);
      const restored = await restorePurchases();
      if (restored) {
        console.log("[Paywall] Restore successful");
        await navigateAfterPurchase();
      } else {
        console.log("[Paywall] Restore found no purchases");
        Alert.alert("No Purchases Found", "We couldn't find any previous purchases.");
      }
    } catch (error: any) {
      console.log("[Paywall] Restore failed:", error.message);
      Alert.alert("Restore Failed", error.message || "Please try again.");
    } finally {
      setRestoring(false);
    }
  };

  const handleClose = () => {
    console.log("[Paywall] Close button pressed");
    router.back();
  };

  const handlePackageSelect = (pkg: PurchasesPackage) => {
    console.log("[Paywall] Package selected:", pkg.identifier);
    setSelectedPackage(pkg);
  };

  const isAnnual = (pkg: PurchasesPackage) => {
    const id = pkg.identifier.toLowerCase();
    return id.includes("annual") || id.includes("$rc_annual");
  };

  const subscribeLabel = selectedPackage ? "Start Free Trial" : "Start Free Trial";

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
        {/* Close button */}
        <TouchableOpacity
          style={[styles.closeButton, { backgroundColor: C.border }]}
          onPress={handleClose}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.closeButtonText, { color: C.secondaryText }]}>✕</Text>
        </TouchableOpacity>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <AppLogo size={64} />
            <Text style={[styles.title, { color: C.text }]}>Portion Track</Text>
            <Text style={[styles.subtitle, { color: C.secondaryText }]}>
              Simple Portions. Balanced Eating.
            </Text>
          </View>

          {/* Features */}
          <View style={styles.featuresList}>
            {FEATURES.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <Text style={[styles.featureCheckmark, { color: C.primary }]}>✓</Text>
                <Text style={[styles.featureTitle, { color: C.text }]}>{feature.title}</Text>
              </View>
            ))}
          </View>

          {/* Package Selection */}
          {packages.length > 0 ? (
            <View style={styles.packagesContainer}>
              {packages.map((pkg) => {
                const isSelected = selectedPackage?.identifier === pkg.identifier;
                const showBestValue = isAnnual(pkg);
                return (
                  <TouchableOpacity
                    key={pkg.identifier}
                    style={[
                      styles.packageCard,
                      {
                        backgroundColor: C.surface,
                        borderColor: isSelected ? C.primaryBorder : C.border,
                        borderWidth: isSelected ? 2 : 1,
                      },
                    ]}
                    onPress={() => handlePackageSelect(pkg)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.freeTrialBadge, { color: C.primary }]}>
                      7-day free trial
                    </Text>
                    {showBestValue && (
                      <View style={[styles.bestValueBadge, { backgroundColor: C.accent }]}>
                        <Text style={styles.bestValueText}>Best Value</Text>
                      </View>
                    )}
                    <View style={styles.packageHeader}>
                      <Text style={[styles.packageTitle, { color: C.text }]}>
                        {pkg.product.title}
                      </Text>
                      <View
                        style={[
                          styles.radioCircle,
                          {
                            borderColor: isSelected ? C.primaryBorder : C.secondaryText,
                            backgroundColor: isSelected ? C.primaryBorder : "transparent",
                          },
                        ]}
                      >
                        {isSelected && <View style={styles.radioInner} />}
                      </View>
                    </View>
                    <Text style={[styles.packagePrice, { color: C.primary }]}>
                      {pkg.product.priceString}
                    </Text>
                    <Text style={[styles.packagePriceThen, { color: C.secondaryText }]}>
                      {"then "}
                      {pkg.product.priceString}
                      {" / "}
                      {isAnnual(pkg) ? "year" : "month"}
                    </Text>
                    {pkg.product.description ? (
                      <Text style={[styles.packageDescription, { color: C.secondaryText }]}>
                        {pkg.product.description}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.loadingPlansContainer}>
              {loading ? (
                <ActivityIndicator size="small" color={C.primary} />
              ) : null}
              <Text style={[styles.loadingPlansText, { color: C.secondaryText }]}>
                Loading plans...
              </Text>
            </View>
          )}

        </ScrollView>

        {/* Bottom Actions */}
        <View style={[styles.bottomActions, { borderTopColor: C.border }]}>
          <Text style={[styles.freeTrialCallout, { color: C.primary }]}>
            Try free for 7 days
          </Text>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              { backgroundColor: C.primary },
              (!selectedPackage || purchasing) && styles.buttonDisabled,
            ]}
            onPress={handlePurchase}
            disabled={!selectedPackage || purchasing}
            activeOpacity={0.85}
          >
            {purchasing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>{subscribeLabel}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestore}
            disabled={restoring}
          >
            {restoring ? (
              <ActivityIndicator size="small" color={C.secondaryText} />
            ) : (
              <Text style={[styles.restoreButtonText, { color: C.secondaryText }]}>
                Restore Purchases
              </Text>
            )}
          </TouchableOpacity>

          <Text style={[styles.legalText, { color: C.secondaryText }]}>
            Payment will be charged to your {Platform.OS === "ios" ? "Apple ID" : "Google Play"} account. Subscription automatically renews unless canceled at least 24 hours before the end of the current period.
          </Text>
          <Text style={[styles.termsText, { color: C.secondaryText }]}>
            By subscribing, you agree to our{" "}
            <Text style={{ color: C.primary }} onPress={() => Linking.openURL("https://www.apple.com/legal/internet-services/itunes/dev/stdeula/")}>Terms of Service</Text>
            {" "}and{" "}
            <Text style={{ color: C.primary }} onPress={() => Linking.openURL("https://www.portiontrack.com/privacy-policy")}>Privacy Policy</Text>
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  closeButton: {
    position: "absolute",
    top: 56,
    right: 20,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 28,
    gap: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
  },
  featuresList: {
    marginBottom: 20,
    paddingLeft: 8,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 10,
  },
  featureCheckmark: {
    fontSize: 16,
    fontWeight: "700",
    width: 20,
    textAlign: "center",
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: "500",
    flex: 1,
  },
  packagesContainer: {
    gap: 12,
    marginBottom: 20,
  },
  packageCard: {
    borderRadius: 14,
    padding: 16,
    overflow: "hidden",
  },
  bestValueBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    marginBottom: 10,
  },
  bestValueText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1A0F0E",
    letterSpacing: 0.3,
  },
  packageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  packageTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
  },
  freeTrialBadge: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  packagePrice: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: 6,
  },
  packagePriceThen: {
    fontSize: 13,
    marginTop: 2,
  },
  packageDescription: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  loadingPlansContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 32,
    marginBottom: 20,
  },
  loadingPlansText: {
    fontSize: 15,
  },
  legalText: {
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
    marginBottom: 8,
  },
  termsText: {
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
    marginTop: 4,
  },
  bottomActions: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
    borderTopWidth: 1,
    gap: 4,
  },
  freeTrialCallout: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  primaryButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#C94A3D",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  restoreButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  restoreButtonText: {
    fontSize: 14,
  },
});
