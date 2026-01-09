
# Superwall Setup Guide for Portion Tracker

Your Portion Tracker app now has **Superwall** integrated for Apple In-App Purchases! Here's how to complete the setup:

## 🎯 What's Been Implemented

✅ Superwall SDK installed (`expo-superwall`)
✅ SuperwallProvider wrapping the entire app
✅ Subscription context using Superwall hooks
✅ Paywall trigger in Settings screen
✅ Subscription status display

## 📋 Next Steps to Complete Setup

### 1. Get Your Superwall API Key

1. Go to [Superwall Dashboard](https://superwall.com/dashboard)
2. Sign up or log in
3. Create a new project for "Portion Tracker"
4. Copy your **iOS API Key**

### 2. Add Your API Key to the App

Open `app/_layout.tsx` and replace the placeholder API key:

```typescript
// Replace this line:
const SUPERWALL_API_KEY = "pk_d4f8c8e7e8f8e8f8e8f8e8f8e8f8e8f8";

// With your actual API key:
const SUPERWALL_API_KEY = "pk_YOUR_ACTUAL_API_KEY_HERE";
```

### 3. Configure Your Paywall in Superwall Dashboard

1. **Create Products in App Store Connect:**
   - Monthly subscription: `com.portiontrack.monthly` ($2.99/month)
   - Annual subscription: `com.portiontrack.annual` ($24.99/year)
   - Add a 7-day free trial to both

2. **Create a Paywall in Superwall:**
   - Go to Paywalls → Create New Paywall
   - Design your paywall (or use a template)
   - Add your subscription products
   - Configure the free trial messaging

3. **Create a Placement:**
   - Go to Placements → Create New
   - Name it: `settings_paywall`
   - Attach your paywall to this placement
   - Set targeting rules (show to all non-subscribers)

### 4. Configure App Store Connect

1. **Create In-App Purchase Products:**
   - Go to App Store Connect
   - Select your app
   - Go to "In-App Purchases"
   - Create two auto-renewable subscriptions:
     - Monthly: `com.portiontrack.monthly`
     - Annual: `com.portiontrack.annual`
   - Add 7-day free trial to both
   - Set pricing

2. **Create Subscription Group:**
   - Create a subscription group
   - Add both subscriptions to the group
   - Set upgrade/downgrade behavior

### 5. Test Your Paywall

1. **Sandbox Testing:**
   - Create a sandbox test account in App Store Connect
   - Sign out of your Apple ID on your test device
   - Run the app and go to Settings → Subscription
   - The Superwall paywall should appear
   - Test purchasing with your sandbox account

2. **TestFlight Testing:**
   - Build and upload to TestFlight
   - Invite testers
   - Test the full purchase flow

## 🎨 How It Works

### Subscription Flow

1. User opens the app → Superwall initializes
2. User goes to Settings → Taps "Subscription"
3. Superwall shows the paywall you designed
4. User selects a plan and subscribes
5. Superwall handles the purchase through Apple
6. App receives subscription status update
7. "Active" badge appears in Settings

### Subscription Status

The app automatically checks subscription status using Superwall's `useUser` hook:

```typescript
const { subscriptionStatus, isSubscribed } = useSubscription();
```

Status values:
- `UNKNOWN` - Not yet loaded
- `INACTIVE` - No active subscription
- `ACTIVE` - Has active subscription

### Showing the Paywall

The paywall is triggered from Settings:

```typescript
await showPaywall('settings_paywall');
```

You can create multiple placements for different contexts:
- `onboarding_paywall` - Show during onboarding
- `feature_paywall` - Show when accessing premium features
- `settings_paywall` - Show from settings (current implementation)

## 🔧 Customization Options

### Change Placement Name

In `app/(tabs)/settings.tsx`, update the placement name:

```typescript
await showPaywall('your_placement_name');
```

### Add More Placements

You can trigger paywalls from anywhere in the app:

```typescript
import { useSubscription } from '@/contexts/SubscriptionContext';

function MyComponent() {
  const { showPaywall } = useSubscription();
  
  const handlePremiumFeature = async () => {
    await showPaywall('feature_paywall');
  };
  
  return <Button onPress={handlePremiumFeature}>Unlock Premium</Button>;
}
```

### Check Subscription Status

```typescript
const { isSubscribed, subscriptionStatus } = useSubscription();

if (isSubscribed) {
  // Show premium content
} else {
  // Show paywall or limited content
}
```

## 📱 iOS-Only Implementation

This implementation is **iOS-only** as requested. The Settings screen checks the platform:

```typescript
if (Platform.OS === 'ios') {
  await showPaywall('settings_paywall');
} else {
  // Fallback for Android (currently opens Play Store)
  Linking.openURL('https://play.google.com/store/account/subscriptions');
}
```

To add Android support later, you'll need to:
1. Get an Android API key from Superwall
2. Add it to the SuperwallProvider: `apiKeys={{ ios: IOS_KEY, android: ANDROID_KEY }}`
3. Configure Google Play products in Superwall dashboard

## 🐛 Troubleshooting

### Paywall Not Showing

1. Check that your API key is correct
2. Verify the placement name matches your Superwall dashboard
3. Check console logs for Superwall errors
4. Ensure you're testing on a real device (not simulator for purchases)

### Subscription Status Not Updating

1. Check that products are configured in App Store Connect
2. Verify product IDs match between App Store Connect and Superwall
3. Try signing out and back in with your test account
4. Check Superwall dashboard for webhook logs

### Purchase Errors

1. Ensure you're using a sandbox test account
2. Verify products are approved in App Store Connect
3. Check that your app bundle ID matches
4. Review Superwall logs in the dashboard

## 📚 Resources

- [Superwall Documentation](https://superwall.com/docs)
- [Superwall Expo SDK Guide](https://docs.superwall.com/docs/expo)
- [Apple In-App Purchase Guide](https://developer.apple.com/in-app-purchase/)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)

## 🎉 You're All Set!

Once you complete these steps, your Portion Tracker app will have a fully functional Apple In-App Purchase paywall powered by Superwall!

The paywall will:
- ✅ Show beautiful, customizable subscription options
- ✅ Handle free trials automatically
- ✅ Process purchases through Apple
- ✅ Update subscription status in real-time
- ✅ Show "Active" badge when subscribed
- ✅ Work seamlessly with iOS

No Google Play or Android code included - this is 100% Apple-focused as requested!
