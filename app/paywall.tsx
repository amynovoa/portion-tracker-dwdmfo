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
  ScrollView,
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

// DEV-ONLY: fake package data so the pricing card layout is visible in Expo Go,
// where the RevenueCat native module isn't available and `packages` stays empty.
// Never used for a real build (__DEV__ is false there) and never sent to purchasePackage.
const DEV_MOCK_PACKAGES = [
  {
    identifier: "dev_mock_annual",
    product: { title: "Annual", priceString: "$39.99/yr" },
  },
  {
    identifier: "dev_mock_monthly",
    product: { title: "Monthly Access", priceString: "$9.99/mo" },
  },
] as unknown as PurchasesPackage[];

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
    { title: t('paywall.features.scanPlate') },
    { title: t('paywall.features.tracking') },
    { title: t('paywall.features.guidance') },
    { title: t('paywall.features.targets') },
    { title: t('paywall.features.weight') },
    { title: t('paywall.features.history') },
    { title: t('paywall.features.reminders') },
  ];

  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { packages, loading, isSubscribed, purchasePackage, restorePurchases, mockNativePurchase, presentCodeRedemptionSheet, devBypass } =
    useSubscription();

  // Dev-only fallback: Expo Go has no RevenueCat native module, so `packages` stays empty.
  // Shows the real card UI with fake prices so the layout can be checked without a build.
  const isMockMode = __DEV__ && !loading && packages.length === 0;
  const displayPackages = packages.length > 0 ? packages : (isMockMode ? DEV_MOCK_PACKAGES : []);

  const [selectedPackage, setSelectedPackage] =
    useState<PurchasesPackage | null>(packages[0] || null);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [redeemingCode, setRedeemingCode] = useState(false);

  // Update selected package when packages (real or mock) load
  React.useEffect(() => {
    if (displayPackages.length > 0 && !selectedPackage) {
      setSelectedPackage(displayPackages[0]);
    }
  }, [displayPackages, selectedPackage]);

  const hasNavigatedRef = React.useRef(false);

  // Navigate after a successful purchase or restore
  const navigateAfterPurchase = async () => {
    if (hasNavigatedRef.current) return;
    hasNavigatedRef.current = true;
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

  // Safety net: some purchase paths (e.g. the offer-code redemption sheet) resolve
  // as soon as Apple's native UI is *presented*, not once the entitlement actually
  // lands — so a one-time check right after can miss it. This reacts to the
  // subscription context's real entitlement state changing at any point while the
  // paywall is on screen, regardless of which action caused it.
  //
  // Only fires on an actual false→true transition, never just because isSubscribed
  // is already true when this screen mounts — an already-subscribed user can reach
  // this screen intentionally (Settings → Subscription) to view/manage their plan,
  // redeem another code, etc., and that must not instantly bounce them back out.
  const wasSubscribedRef = React.useRef(isSubscribed);
  React.useEffect(() => {
    const wasSubscribed = wasSubscribedRef.current;
    wasSubscribedRef.current = isSubscribed;
    if (isSubscribed && !wasSubscribed) {
      navigateAfterPurchase();
    }
  }, [isSubscribed]);

  // Handle purchase
  const handlePurchase = async () => {
    if (!selectedPackage) return;
    if (isMockMode) {
      Alert.alert(
        "Preview Mode",
        "This is fake pricing data for layout testing in Expo Go. Use a dev-client or TestFlight build to test a real purchase."
      );
      return;
    }
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

  const handleRedeemOfferCode = async () => {
    setRedeemingCode(true);
    try {
      const subscribed = await presentCodeRedemptionSheet();
      if (subscribed) {
        await navigateAfterPurchase();
      }
    } finally {
      setRedeemingCode(false);
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
    ? t('paywall.subscribeWithPrice', { price: selectedPackage.product.priceString, period: isAnnual(selectedPackage) ? t('paywall.perYear') : t('paywall.perMonth') })
    : t('paywall.subscribeNow');

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

      {/* Scrollable content area */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && { width: 560, alignSelf: "center", paddingHorizontal: 48, paddingTop: 32 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={[styles.header, isTablet && { gap: 8 }, { marginBottom: 6 }]}>
          <AppLogo size={logoSize} />
          <Text style={[styles.title, { color: C.text }, isTablet && { fontSize: 28 }]}>Portion Track</Text>
        </View>

        {/* Features list */}
        <View style={[styles.featuresList, { marginBottom: 6 }]}>
          {FEATURES.map((feature, index) => (
            <View key={index} style={[styles.featureRow, isTablet && { paddingVertical: 5 }]}>
              <Text style={[styles.featureCheckmark, { color: C.primary }, isTablet && { fontSize: 16 }]}>✓</Text>
              <Text style={[styles.featureTitle, { color: C.text }, isTablet && { fontSize: 16 }]}>{feature.title}</Text>
            </View>
          ))}
        </View>

        {/* Package cards — side by side, compact single-block layout like the CTA button below */}
        {displayPackages.length > 0 ? (
          <>
            {isMockMode && (
              <Text style={styles.mockModeLabel}>PREVIEW — fake pricing, layout check only</Text>
            )}
            <Text style={[styles.freeTrialShared, { color: C.primary }, isTablet && { fontSize: 14 }]}>
              {t('paywall.freeTrial')}
            </Text>
            <View style={[styles.packagesContainer, { marginBottom: 8 }, isTablet && { gap: 16 }]}>
              {displayPackages.map((pkg) => {
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
                    {showBestValue && (
                      <View style={[styles.bestValueBadge, { backgroundColor: C.accent }]}>
                        <Text style={[styles.bestValueText, isTablet && { fontSize: 11 }]}>{t('paywall.bestValue')}</Text>
                      </View>
                    )}
                    <View style={styles.packageHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.packageTitle, { color: C.text }, isTablet && { fontSize: 18 }]}>
                          {pkg.product.title}
                        </Text>
                        <Text style={[styles.packagePrice, { color: C.primary }, isTablet && { fontSize: 20 }]}>
                          {pkg.product.priceString}
                        </Text>
                      </View>
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
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        ) : (
          <View style={[styles.loadingPlansContainer, { marginBottom: 8 }]}>
            {loading ? (
              <>
                <ActivityIndicator size="small" color={C.primary} />
                <Text style={[styles.loadingPlansText, { color: C.secondaryText }]}>
                  Loading plans...
                </Text>
              </>
            ) : (
              <Text style={[styles.loadingPlansText, { color: C.secondaryText }]}>
                Plans are not available right now. Please check your connection and try again.
              </Text>
            )}
          </View>
        )}

        {/* Actions — part of the same scroll flow, so nothing can ever hide behind a fixed footer */}
        <View
          style={[
            styles.bottomActions,
            Platform.OS === "ios" && !isTablet && { paddingTop: 8, gap: 4 },
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
          style={[
            styles.restoreButton,
            Platform.OS === "ios" && !isTablet && { paddingVertical: 6 },
          ]}
          onPress={handleRestore}
          disabled={restoring}
        >
          {restoring ? (
            <ActivityIndicator size="small" color={C.secondaryText} />
          ) : (
            <Text style={[styles.restoreButtonText, { color: C.secondaryText }, isTablet && { fontSize: 17 }]}>
              {t('paywall.restore')}
            </Text>
          )}
        </TouchableOpacity>

        {/* Apple offer code redemption — iOS only */}
        {Platform.OS === 'ios' && (
          <TouchableOpacity
            onPress={handleRedeemOfferCode}
            style={[styles.offerCodeButton, !isTablet && { paddingVertical: 4 }]}
            disabled={redeemingCode}
          >
            {redeemingCode
              ? <ActivityIndicator size="small" color={C.secondaryText} />
              : <Text style={[styles.offerCodeText, { color: C.secondaryText }]}>Redeem Offer Code</Text>
            }
          </TouchableOpacity>
        )}

        <Text style={[styles.legalText, { color: C.secondaryText }, isTablet && { fontSize: 13, lineHeight: 18 }]}>
          {t('paywall.legalText', { platform: platformName })}
        </Text>
        <Text style={[styles.termsText, { color: C.secondaryText }, isTablet && { fontSize: 13, lineHeight: 18 }]}>
          {t('paywall.termsPrefix')}
          <Text
            style={{ color: C.primary }}
            onPress={() => Linking.openURL("https://portiontrack.com/terms-of-service")}
          >
            {t('paywall.termsOfService')}
          </Text>
          {t('paywall.termsMiddle')}
          <Text
            style={{ color: C.primary }}
            onPress={() => Linking.openURL("https://www.portiontrack.com/privacy-policy")}
          >
            {t('paywall.privacyPolicy')}
          </Text>
        </Text>

        {/* Developer bypass — hidden on iOS (not needed for TestFlight/App Store), kept on Android */}
        {Platform.OS === "android" && (
          <TouchableOpacity
            style={styles.devBypassButton}
            onPress={async () => { await devBypass(); await navigateAfterPurchase(); }}
          >
            <Text style={styles.devBypassText}>⚙️ Developer Access</Text>
          </TouchableOpacity>
        )}
        </View>
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 8,
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
  // Dev-only banner shown above mock pricing cards in Expo Go
  mockModeLabel: {
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
    color: "#B8860B",
    backgroundColor: "#FFF3CD",
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  // One shared line above both cards, replacing the old per-card "7-day free trial" text
  freeTrialShared: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.2,
    textAlign: "center",
    marginBottom: 4,
  },
  // Small in-flow pill — kept compact so it doesn't push the price line off-screen
  bestValueBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 20,
    marginBottom: 3,
  },
  bestValueText: {
    fontSize: 9,
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
    marginTop: 2,
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
  // Sits inside the ScrollView's content — inherits horizontal padding from scrollContent
  bottomActions: {
    paddingTop: 12,
    paddingBottom: 4,
    gap: 6,
  },
  primaryButton: {
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
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
    paddingHorizontal: 8,
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
  offerCodeButton: {
    paddingVertical: 8,
    alignItems: "center",
  },
  offerCodeText: {
    fontSize: 13,
    textDecorationLine: "underline",
  },
  devBypassButton: {
    marginTop: 12,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#aaa",
    borderRadius: 8,
    borderStyle: "dashed",
  },
  devBypassText: {
    fontSize: 12,
    color: "#888",
    fontWeight: "600",
  },
});
