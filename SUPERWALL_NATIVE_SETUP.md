
# Superwall Native Build Setup Guide

This guide explains how Superwall is now integrated into your Portion Tracker app and what you need to do to complete the setup.

## ✅ What's Already Done

The app now has **full Superwall integration** for native iOS builds:

1. **SuperwallProvider** wraps the entire app in `app/_layout.tsx`
2. **PaywallScreen** uses Superwall's `usePlacement` hook to show native paywalls
3. **SubscriptionContext** uses Superwall's `useUser` hook to track subscription status
4. **Automatic fallback** to simulated subscriptions in TestFlight/dev mode

## 🔧 What You Need To Do

### Step 1: Get Your Superwall API Key

1. Go to [https://superwall.com](https://superwall.com) and create an account
2. Create a new project for "Portion Tracker"
3. Copy your **iOS API Key** from the Superwall dashboard
4. Add it to your environment or directly in `utils/superwallConfig.ts`:

```typescript
export const SUPERWALL_API_KEY = 'pk_YOUR_ACTUAL_KEY_HERE';
```

### Step 2: Configure Products in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Navigate to your app → Features → In-App Purchases
3. Create two **Auto-Renewable Subscriptions**:
   - **Product ID**: `portiontrack.monthly`
     - Price: $2.99/month
     - Free trial: 7 days
   - **Product ID**: `portiontrack.annual`
     - Price: $24.99/year
     - Free trial: 7 days

### Step 3: Configure Placements in Superwall Dashboard

1. In your Superwall dashboard, create a placement called `onboarding_paywall`
2. Design your paywall (or use Superwall's templates)
3. Link the placement to your App Store products:
   - `portiontrack.monthly`
   - `portiontrack.annual`

### Step 4: Build and Test

1. **Build a new native iOS build**:
   ```bash
   eas build --platform ios --profile production
   ```

2. **Test in TestFlight**:
   - The app will automatically use simulated subscriptions in TestFlight
   - This lets you test the flow without real purchases

3. **Test with Sandbox**:
   - Create a sandbox test user in App Store Connect
   - Install the build on a physical device
   - Test real subscription flows with sandbox purchases

## 🎯 How It Works Now

### In Development/TestFlight
- Superwall is initialized but subscriptions are simulated
- Tapping "Subscribe" or "Restore" immediately grants access
- No real App Store purchases are made

### In Production (Native Build)
- Superwall handles all subscription logic
- Real App Store purchases are processed
- Subscription status is automatically synced
- Restore purchases works with real App Store receipts

## 📱 User Flow

1. **First Launch** → Welcome screen with "Start 7-Day Free Trial"
2. **Tap Button** → Superwall paywall appears (native iOS paywall)
3. **Select Plan** → Annual ($24.99) or Monthly ($2.99)
4. **Subscribe** → Apple's native purchase flow
5. **Success** → Access granted, navigate to app

## 🔍 Debugging

Check the console logs for Superwall status:
- `✅ Initializing Superwall for native builds...`
- `📱 Superwall configured: true/false`
- `📱 Using Superwall to show paywall...`
- `✅ Superwall paywall presented`
- `✅ User subscribed via Superwall!`

## ⚠️ Important Notes

1. **Superwall only works in native builds** - not in Expo Go
2. **TestFlight uses simulated subscriptions** - this is intentional for testing
3. **Production builds use real subscriptions** - make sure your API key is set
4. **The app works without Superwall** - it falls back to local storage in dev mode

## 🚀 Next Steps

1. Get your Superwall API key
2. Configure products in App Store Connect
3. Set up placements in Superwall dashboard
4. Build a new native iOS build
5. Test in TestFlight
6. Submit to App Store

## 📚 Resources

- [Superwall Documentation](https://docs.superwall.com)
- [Expo Superwall SDK](https://github.com/superwall/expo-superwall)
- [App Store Connect](https://appstoreconnect.apple.com)
- [Creating In-App Purchases](https://developer.apple.com/in-app-purchase/)
