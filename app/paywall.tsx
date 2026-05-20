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
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
  useColorScheme,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { PurchasesPackage } from "react-native-purchases";

import { useSubscription } from "@/contexts/SubscriptionContext";
import { markSubscribed } from "@/utils/userStateManager";
import { loadProfile } from "@/utils/storage";
import AppLogo from "@/components/AppLogo";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const C = getColors(isDark ? "dark" : "light");

  const FEATURES = [
    { title: t('paywall.features.tracking') },
    { title: t('paywall.features.guidance') },
    { title: t('paywall.features.targets') },
    { title: t('paywall.features.weight') },
    { title: t('paywall.features.history') },
    { title: t('paywall.features.reminders') },
  ];

  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

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

  const subscribeLabel = selectedPackage
    ? t('paywall.tryFree', { price: selectedPackage.product.priceString, period: isAnnual(selectedPackage) ? t('paywall.perYear') : t('paywall.perMonth') })
    : t('paywall.startTrial');

  const platformName = Platform.OS === "ios" ? "Apple ID" : "Google Play";

  const logoSize = isTablet ? 60 : 40;

  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      style={[
        styles.safeArea,
        { backgroundColor: C.background },
        isTablet && { alignItems: "center" },
      ]}
    >
      {/* Close button — absolutely positioned, high zIndex, does not affect layout flow */}
      <TouchableOpacity
        style={[
          styles.closeButton,
          { backgroundColor: C.border },
          isTablet && { top: 24, right: 28, width: 40, height: 40, borderRadius: 20 },
        ]}
        onPress={handleClose}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={[styles.closeButtonText, { color: C.secondaryText }, isTablet && { fontSize: 18 }]}>✕</Text>
      </TouchableOpacity>

      {/* Content area — fills remaining space, distributes children evenly */}
      <View
        style={[
          styles.content,
          isTablet && { width: 560, paddingHorizontal: 48, paddingTop: 32 },
        ]}
      >
        {/* Header */}
        <View style={[styles.header, isTablet && { gap: 8 }]}>
          <AppLogo size={logoSize} />
          <Text style={[styles.title, { color: C.text }, isTablet && { fontSize: 28 }]}>Portion Track</Text>
          <Text style={[styles.subtitle, { color: C.secondaryText }, isTablet && { fontSize: 17 }]}>
            Simple Portions. Balanced Eating.
          </Text>
        </View>

        {/* Features list */}
        <View style={styles.featuresList}>
          {FEATURES.map((feature, index) => (
            <View key={index} style={[styles.featureRow, isTablet && { paddingVertical: 5 }]}>
              <Text style={[styles.featureCheckmark, { color: C.primary }, isTablet && { fontSize: 16 }]}>✓</Text>
              <Text style={[styles.featureTitle, { color: C.text }, isTablet && { fontSize: 16 }]}>{feature.title}</Text>
            </View>
          ))}
        </View>

        {/* Package cards — side by side */}
        {packages.length > 0 ? (
          <View style={[styles.packagesContainer, isTablet && { gap: 16 }]}>
            {packages.map((pkg) => {
              const isSelected = selectedPackage?.identifier === pkg.identifier;
              const showBestValue = isAnnual(pkg);
              const borderColor = isSelected ? C.primaryBorder : C.border;
              const borderWidth = isSelected ? 2 : 1;
              return (
                <TouchableOpacity
                  key={pkg.identifier}
                  style={[
                    styles.packageCard,
                    {
                      backgroundColor: C.surface,
                      borderColor,
                      borderWidth,
                    },
                    isTablet && { padding: 18, borderRadius: 16 },
                  ]}
                  onPress={() => handlePackageSelect(pkg)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.freeTrialBadge, { color: C.primary }, isTablet && { fontSize: 14 }]}>
                    7-day free trial
                  </Text>
                  {showBestValue && (
                    <View style={[styles.bestValueBadge, { backgroundColor: C.accent }]}>
                      <Text style={[styles.bestValueText, isTablet && { fontSize: 13 }]}>Best Value</Text>
                    </View>
                  )}
                  <View style={styles.packageHeader}>
                    <Text style={[styles.packageTitle, { color: C.text }, isTablet && { fontSize: 18 }]}>
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
                  <Text style={[styles.packagePrice, { color: C.primary }, isTablet && { fontSize: 22 }]}>
                    {pkg.product.priceString}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.loadingPlansContainer}>
            {loading && <ActivityIndicator size="small" color={C.primary} />}
            <Text style={[styles.loadingPlansText, { color: C.secondaryText }]}>
              Loading plans...
            </Text>
          </View>
        )}
      </View>

      {/* Bottom actions — always below content, never overlapping */}
      <View
        style={[
          styles.bottomActions,
          isTablet && { width: 560, paddingHorizontal: 48 },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.primaryButton,
            { backgroundColor: C.primary },
            (!selectedPackage || purchasing) && styles.buttonDisabled,
            isTablet && { paddingVertical: 16, borderRadius: 18 },
          ]}
          onPress={handlePurchase}
          disabled={!selectedPackage || purchasing}
          activeOpacity={0.85}
        >
          {purchasing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text
              style={[styles.primaryButtonText, isTablet && { fontSize: 18 }]}
              numberOfLines={2}
              adjustsFontSizeToFit={true}
              minimumFontScale={0.7}
            >{subscribeLabel}</Text>
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
            <Text style={[styles.restoreButtonText, { color: C.secondaryText }, isTablet && { fontSize: 17 }]}>
              Restore Purchases
            </Text>
          )}
        </TouchableOpacity>

        <Text style={[styles.legalText, { color: C.secondaryText }, isTablet && { fontSize: 13, lineHeight: 18 }]}>
          {"Payment will be charged to your "}
          {platformName}
          {" account. Subscription automatically renews unless canceled at least 24 hours before the end of the current period."}
        </Text>
        <Text style={[styles.termsText, { color: C.secondaryText }, isTablet && { fontSize: 13, lineHeight: 18 }]}>
          {"By subscribing, you agree to our "}
          <Text
            style={{ color: C.primary }}
            onPress={() =>
              Linking.openURL(
                "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/"
              )
            }
          >
            Terms of Service
          </Text>
          {" and "}
          <Text
            style={{ color: C.primary }}
            onPress={() =>
              Linking.openURL("https://www.portiontrack.com/privacy-policy")
            }
          >
            Privacy Policy
          </Text>
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 20,
    zIndex: 20,
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
  // Fills all space between safe area top and bottom actions
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
    justifyContent: "space-between",
  },
  header: {
    alignItems: "center",
    gap: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 17,
  },
  featuresList: {
    paddingLeft: 8,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 2,
    gap: 10,
  },
  featureCheckmark: {
    fontSize: 12,
    fontWeight: "700",
    width: 18,
    textAlign: "center",
  },
  featureTitle: {
    fontSize: 12,
    fontWeight: "500",
    flex: 1,
  },
  // Side-by-side cards
  packagesContainer: {
    flexDirection: "row",
    gap: 8,
  },
  packageCard: {
    flex: 1,
    borderRadius: 12,
    padding: 10,
    overflow: "hidden",
  },
  freeTrialBadge: {
    fontSize: 10,
    fontWeight: "600",
    marginBottom: 3,
    letterSpacing: 0.2,
  },
  bestValueBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    marginBottom: 6,
  },
  bestValueText: {
    fontSize: 10,
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
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  radioInner: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#fff",
  },
  packagePrice: {
    fontSize: 15,
    fontWeight: "700",
    marginTop: 4,
  },
  loadingPlansContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 24,
  },
  loadingPlansText: {
    fontSize: 14,
  },
  // Fixed bottom section — never overlaps content
  bottomActions: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 4,
  },
  primaryButton: {
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center",
    shadowColor: "#C94A3D",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
    flexShrink: 1,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  restoreButton: {
    paddingVertical: 10,
    alignItems: "center",
  },
  restoreButtonText: {
    fontSize: 14,
  },
  legalText: {
    fontSize: 10,
    textAlign: "center",
    lineHeight: 14,
    marginBottom: 2,
  },
  termsText: {
    fontSize: 10,
    textAlign: "center",
    lineHeight: 14,
  },
});
