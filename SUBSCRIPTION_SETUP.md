
# Apple Subscription Implementation Guide

This document explains how the Apple subscription system is implemented in Portion Track using Superwall and StoreKit.

## Overview

The app now uses **expo-superwall** to handle Apple in-app purchases and subscriptions. This implementation:

- ✅ Triggers Apple's StoreKit purchase sheet when users tap Subscribe
- ✅ Handles success, cancel, and error states
- ✅ Implements Restore Purchases (required by Apple)
- ✅ Unlocks full access immediately after purchase
- ✅ Persists entitlement across app relaunches
- ✅ Works on both iPhone and iPad

## Product IDs

The following product IDs are configured in `utils/superwallConfig.ts`:

- **Monthly**: `portiontrack.monthly`
- **Annual**: `portiontrack.annual`

These must match the product IDs you've set up in App Store Connect.

## Key Files

### 1. `app/_layout.tsx`
- Wraps the app with `SuperwallProvider`
- Initializes Superwall with your API key
- Wraps the app with `SubscriptionProvider` for subscription state management

### 2. `contexts/SubscriptionContext.tsx`
- Manages subscription state throughout the app
- Uses Superwall's `useUser` hook to check subscription status
- Persists entitlement locally for offline access
- Provides `isSubscribed`, `showPaywall`, `hidePaywall` functions

### 3. `components/PaywallScreen.tsx`
- Displays subscription plans (Monthly and Annual)
- Loads real prices from the App Store
- Handles Subscribe button tap → triggers StoreKit purchase sheet
- Handles Restore Purchases button
- Shows success/error alerts

### 4. `utils/subscriptionManager.ts`
- `purchaseProduct(productId)` - Initiates purchase flow
- `restorePurchases()` - Restores previous purchases
- `getProductDetails(productId)` - Fetches prices from App Store
- `getSubscriptionStatus()` - Checks if user is subscribed

### 5. `utils/superwallConfig.ts`
- Contains product IDs and configuration
- Superwall API key
- Product display information

## Setup Instructions

### 1. Get Your Superwall API Key

1. Go to [Superwall Dashboard](https://superwall.com/dashboard)
2. Create a new project or select your existing project
3. Copy your iOS API key
4. Replace the placeholder in `app/_layout.tsx`:

```typescript
const SUPERWALL_API_KEY = 'YOUR_ACTUAL_SUPERWALL_API_KEY_HERE';
```

Also update it in `utils/superwallConfig.ts`.

### 2. Configure Products in Superwall Dashboard

1. Log in to Superwall dashboard
2. Go to Products section
3. Add your two products:
   - `portiontrack.monthly`
   - `portiontrack.annual`
4. These should match your App Store Connect product IDs

### 3. Configure Products in App Store Connect

Make sure your products are set up in App Store Connect:

1. Go to App Store Connect
2. Select your app
3. Go to Features → In-App Purchases
4. Verify these products exist:
   - `portiontrack.monthly` - Auto-renewable subscription (Monthly)
   - `portiontrack.annual` - Auto-renewable subscription (Annual)
5. Both should have 7-day free trial configured

### 4. Test in Sandbox

1. Create a sandbox test user in App Store Connect
2. Sign out of your Apple ID on your test device
3. Build and run the app
4. When you tap Subscribe, sign in with your sandbox test user
5. The Apple purchase sheet should appear
6. Complete the purchase (it's free in sandbox)
7. Verify the app unlocks full access

### 5. Test Restore Purchases

1. After purchasing in sandbox, delete the app
2. Reinstall the app
3. Tap "Restore Purchases"
4. Verify your subscription is restored and full access is unlocked

## How It Works

### Purchase Flow

1. User taps Subscribe button in `PaywallScreen`
2. `handleSubscribe()` calls `purchaseProduct(productId)`
3. Superwall triggers Apple's StoreKit purchase sheet
4. User completes purchase (or cancels)
5. On success:
   - Superwall updates subscription status
   - `SubscriptionContext` detects the change via `useUser` hook
   - Entitlement is persisted to AsyncStorage
   - `isSubscribed` becomes `true`
   - Success alert is shown
   - Paywall is dismissed
6. On cancel:
   - No alert is shown (user intentionally cancelled)
7. On error:
   - Error alert is shown with details

### Restore Purchases Flow

1. User taps "Restore Purchases" button
2. `handleRestorePurchases()` calls `restorePurchases()`
3. Superwall queries Apple's servers for previous purchases
4. If purchases found:
   - Subscription status is updated
   - Entitlement is persisted
   - Success alert is shown
5. If no purchases found:
   - "No purchases found" alert is shown

### Subscription Status Check

The app checks subscription status in multiple ways:

1. **On App Launch**: `SubscriptionContext` checks Superwall status
2. **After Purchase**: Status is updated automatically
3. **After Restore**: Status is refreshed from Apple's servers
4. **Offline**: Uses cached entitlement from AsyncStorage

## Testing Checklist

Before submitting to Apple, test these scenarios:

- [ ] Tap Subscribe → Apple purchase sheet appears
- [ ] Complete purchase → Success alert → Full access unlocked
- [ ] Cancel purchase → No error, paywall stays open
- [ ] Tap Restore Purchases → Restores previous purchase
- [ ] Close app and reopen → Subscription persists
- [ ] Delete and reinstall → Restore Purchases works
- [ ] Test on iPhone → Works correctly
- [ ] Test on iPad → Works correctly (this was the rejection reason)
- [ ] Airplane mode → Uses cached entitlement

## Important Notes

### iPad Compatibility

The previous rejection was because the Subscribe button did nothing on iPad. This implementation:

- Uses the same code for iPhone and iPad
- Superwall handles device-specific UI automatically
- StoreKit purchase sheet works on all iOS devices

### Entitlement Persistence

The app persists entitlement in two ways:

1. **Superwall**: Manages subscription status with Apple
2. **AsyncStorage**: Caches entitlement locally for offline access

This ensures users don't lose access if they're offline.

### Development vs Production

- In development (`__DEV__`), all users get free access for testing
- In TestFlight, users get free access (configurable)
- In production, only subscribed users get access

### Error Handling

The implementation handles:

- Network errors (uses cached entitlement)
- User cancellation (no error shown)
- Purchase failures (error alert with details)
- Restore failures (error alert with details)

## Troubleshooting

### "Subscription does nothing when tapped"

**Cause**: Superwall not initialized or product IDs don't match

**Fix**:
1. Verify Superwall API key is correct in `app/_layout.tsx`
2. Verify product IDs match in App Store Connect and `superwallConfig.ts`
3. Check console logs for Superwall initialization errors

### "No products found"

**Cause**: Products not configured in App Store Connect or Superwall

**Fix**:
1. Verify products exist in App Store Connect
2. Verify products are added to Superwall dashboard
3. Wait a few hours for App Store Connect changes to propagate

### "Restore Purchases finds nothing"

**Cause**: No previous purchases or wrong Apple ID

**Fix**:
1. Make sure you're signed in with the same Apple ID that made the purchase
2. In sandbox, make sure you're using the sandbox test account
3. Check App Store Connect for purchase history

## Support

If you encounter issues:

1. Check console logs for error messages
2. Verify all setup steps are completed
3. Test in sandbox before production
4. Contact Superwall support if needed

## Next Steps

After implementing this:

1. Test thoroughly in sandbox
2. Submit a new build to App Store Connect
3. Request a new review
4. The reviewer should now see the working purchase flow on iPad

Good luck with your resubmission! 🎉
