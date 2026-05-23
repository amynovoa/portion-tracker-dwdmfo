import { useEffect, useState } from "react";
import { useRouter, usePathname } from "expo-router";
import { useSubscription } from "@/contexts/SubscriptionContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SUBSCRIPTION_ACTIVE_KEY = '@subscription_active';

export function useSubscriptionGuard() {
  const { isSubscribed, loading } = useSubscription();
  const router = useRouter();
  const pathname = usePathname();
  const [localSubscribed, setLocalSubscribed] = useState<boolean | null>(null);

  // Check local AsyncStorage flag as fast fallback for cross-device scenarios
  useEffect(() => {
    AsyncStorage.getItem(SUBSCRIPTION_ACTIVE_KEY)
      .then((raw) => {
        console.log('[useSubscriptionGuard] local @subscription_active flag:', raw);
        setLocalSubscribed(raw !== null ? JSON.parse(raw) === true : false);
      })
      .catch(() => setLocalSubscribed(false));
  }, [pathname]);

  useEffect(() => {
    // Wait until all checks are complete
    if (loading || localSubscribed === null) return;

    // Only redirect if BOTH RevenueCat AND local flag say not subscribed
    const definitelyNotSubscribed = !isSubscribed && !localSubscribed;

    console.log('[useSubscriptionGuard] check — isSubscribed:', isSubscribed, '| localSubscribed:', localSubscribed, '| definitelyNotSubscribed:', definitelyNotSubscribed);

    if (definitelyNotSubscribed) {
      console.log('[useSubscriptionGuard] redirecting to /paywall');
      router.replace("/paywall");
    }
  }, [isSubscribed, loading, localSubscribed, router]);
}
