
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { resolveUserState } from '@/utils/userStateManager';
import { checkForceUpdate, VersionCheckResult } from '@/utils/forceUpdateManager';
import { appleRed } from '@/constants/Colors';

export default function Index() {
  const router = useRouter();
  const didRoute = useRef(false);
  const [updateInfo, setUpdateInfo] = useState<VersionCheckResult | null>(null);

  useEffect(() => {
    if (didRoute.current) return;

    async function route() {
      console.log('[Index] App opened — resolving user state and checking for updates...');

      const [state, versionResult] = await Promise.all([
        resolveUserState(),
        checkForceUpdate(),
      ]);

      console.log('[Index] User state resolved:', state);
      console.log('[Index] Version check result:', versionResult);

      if (versionResult.forceUpdate) {
        console.log('[Index] Force update required — blocking navigation');
        setUpdateInfo(versionResult);
        return;
      }

      if (didRoute.current) return;
      didRoute.current = true;

      if (state === 'not_subscribed') {
        console.log('[Index] not_subscribed → navigating to /welcome');
        router.replace('/welcome');
      } else if (state === 'subscribed_needs_onboarding') {
        console.log('[Index] subscribed_needs_onboarding → navigating to /setup-profile');
        router.replace('/setup-profile');
      } else {
        console.log('[Index] subscribed_complete → navigating to /(tabs)');
        router.replace('/(tabs)');
      }
    }

    route();
  }, [router]);

  if (updateInfo?.forceUpdate) {
    const storeUrl = updateInfo.storeUrl;

    const handleUpdatePress = () => {
      console.log('[Index] "Update Now" pressed — opening store URL:', storeUrl);
      Linking.openURL(storeUrl);
    };

    return (
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Text style={styles.iconEmoji}>🍽️</Text>
          </View>
          <Text style={styles.title}>Update Required</Text>
          <Text style={styles.body}>
            A new version of Portion Track is available. Please update to continue.
          </Text>
          <TouchableOpacity style={styles.button} onPress={handleUpdatePress} activeOpacity={0.85}>
            <Text style={styles.buttonText}>Update Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  card: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconEmoji: {
    fontSize: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  body: {
    fontSize: 16,
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  button: {
    marginTop: 8,
    backgroundColor: appleRed,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 48,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});
