
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadSubscriptionStatus, saveSubscriptionStatus, loadProfile } from './storage';

// The AsyncStorage key used by storage.ts for subscription status
const SUBSCRIPTION_ACTIVE_KEY = '@subscription_active';

// The onboarding completion check mirrors what index.tsx already does:
// a profile exists AND has portionTargets set.
// We do NOT invent a new key — we read the existing profile from storage.ts.

export type UserState =
  | 'loading'
  | 'not_subscribed'
  | 'subscribed_needs_onboarding'
  | 'subscribed_complete';

/**
 * Single source of truth for user routing state.
 *
 * Reads the persisted subscription flag written by markSubscribed() (called from
 * app/paywall.tsx after a successful RevenueCat purchase). RevenueCat is the live
 * source of truth; this AsyncStorage flag is used only for fast cold-start routing
 * to avoid showing the paywall on every launch for existing subscribers.
 *
 * 1. Read persisted subscription flag from AsyncStorage (@subscription_active).
 * 2. Fall back to legacy key written by storage.ts if absent.
 * 3. Check onboarding by reading the existing profile key.
 * 4. Return the correct UserState.
 */
export async function resolveUserState(): Promise<Exclude<UserState, 'loading'>> {
  console.log('[UserStateManager] resolveUserState() called');

  // Step 1: read persisted flag
  let isSubscribed = false;
  try {
    const raw = await AsyncStorage.getItem(SUBSCRIPTION_ACTIVE_KEY);
    if (raw !== null) {
      isSubscribed = JSON.parse(raw) === true;
    } else {
      // Also check the legacy key written by storage.ts
      isSubscribed = await loadSubscriptionStatus();
    }
    console.log('[UserStateManager] Persisted subscription flag:', isSubscribed);
  } catch (err) {
    console.warn('[UserStateManager] Failed to read persisted subscription flag:', err);
  }

  // Step 2: check onboarding completion
  const onboardingComplete = await checkOnboardingComplete();
  console.log('[UserStateManager] isSubscribed:', isSubscribed, '| onboardingComplete:', onboardingComplete);

  // Step 3: return state
  if (!isSubscribed) {
    console.log('[UserStateManager] → not_subscribed');
    return 'not_subscribed';
  }
  if (!onboardingComplete) {
    console.log('[UserStateManager] → subscribed_needs_onboarding');
    return 'subscribed_needs_onboarding';
  }
  console.log('[UserStateManager] → subscribed_complete');
  return 'subscribed_complete';
}

async function checkOnboardingComplete(): Promise<boolean> {
  try {
    const profile = await loadProfile();
    const complete = !!(profile && profile.portionTargets);
    console.log('[UserStateManager] Onboarding complete:', complete);
    return complete;
  } catch (err) {
    console.warn('[UserStateManager] Failed to check onboarding:', err);
    return false;
  }
}

/**
 * Persist subscription status to both the new key and the legacy key so that
 * storage.ts / SubscriptionContext stay in sync.
 */
export async function markSubscribed(value = true): Promise<void> {
  try {
    await AsyncStorage.setItem(SUBSCRIPTION_ACTIVE_KEY, JSON.stringify(value));
    await saveSubscriptionStatus(value);
    console.log('[UserStateManager] markSubscribed() persisted:', value);
  } catch (err) {
    console.warn('[UserStateManager] markSubscribed() failed:', err);
  }
}

/**
 * Mark onboarding as complete by saving a minimal profile sentinel.
 * The real onboarding completion is determined by profile.portionTargets existing,
 * so this is a no-op helper — callers should save the full profile via saveProfile().
 * Exported for completeness per the spec.
 */
export async function markOnboardingComplete(): Promise<void> {
  // Onboarding completion is tracked by the presence of profile.portionTargets in
  // @portion_tracker_profile (written by setup-targets screen via saveProfile()).
  // There is no separate boolean key to write — this function is intentionally a no-op.
  console.log('[UserStateManager] markOnboardingComplete() called (no-op — profile key is the source of truth)');
}
