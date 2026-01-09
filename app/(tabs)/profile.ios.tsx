
import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/IconSymbol";
import { GlassView } from "expo-glass-effect";
import { useTheme } from "@react-navigation/native";
import PaywallScreen from "@/components/PaywallScreen";
import { colors } from "@/styles/commonStyles";

export default function ProfileScreen() {
  const theme = useTheme();
  const [paywallVisible, setPaywallVisible] = useState(false);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        <TouchableOpacity onPress={() => setPaywallVisible(true)}>
          <GlassView style={styles.subscriptionCard} glassEffectStyle="regular">
            <View style={styles.subscriptionHeader}>
              <IconSymbol ios_icon_name="star.fill" android_material_icon_name="star" size={24} color={colors.primary} />
              <Text style={[styles.subscriptionTitle, { color: theme.colors.text }]}>Premium Subscription</Text>
            </View>
            <Text style={[styles.subscriptionSubtitle, { color: theme.dark ? '#98989D' : '#666' }]}>
              Tap to view premium features
            </Text>
          </GlassView>
        </TouchableOpacity>
      </ScrollView>

      <PaywallScreen
        visible={paywallVisible}
        onDismiss={() => setPaywallVisible(false)}
        canDismiss={true}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  subscriptionCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  subscriptionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  subscriptionSubtitle: {
    fontSize: 14,
    marginLeft: 36,
  },
});
