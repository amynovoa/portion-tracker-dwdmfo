
# Superwall Subscription Setup Guide

This guide will help you set up and test Apple in-app subscriptions using Superwall for both Sandbox (testing) and Production environments.

## 🎯 Overview

Your app is now configured to use Superwall for handling in-app subscriptions. Superwall automatically manages:
- Product fetching from App Store Connect
- Purchase flows through Apple StoreKit
- Subscription status tracking
- Restore purchases functionality
- Trial period management

## 📋 Prerequisites

### 1. App Store Connect Setup

1. **Create In-App Purchase Products** in App Store Connect:
   - Go to your app → Features → In-App Purchases
   - Create two Auto-Renewable Subscriptions:
     - Product ID: `portiontrack.monthly` (Monthly subscription)
     - Product ID: `portiontrack.annual` (Annual subscription)
   - Set up pricing and trial period (7 days free trial)
   - Submit for review (required for TestFlight testing)

2. **Create Subscription Group**:
   - Group both products in a subscription group
   - Set the subscription group name (e.g., "Premium Access")

### 2. Superwall Dashboard Setup

1. **Get Your API Key**:
   - Log in to [Superwall Dashboard](https://superwall.com/dashboard)
   - Copy your iOS API key
   - Replace the placeholder in `app/_layout.tsx`:
     ```typescript
     const SUPERWALL_API_KEY = 'YOUR_ACTUAL_API_KEY_HERE';
     ```

2. **Configure Products in Superwall**:
   - Add your product IDs: `portiontrack.monthly` and `portiontrack.annual`
   - Link them to your App Store Connect products

3. **Create Placements**:
   - Create a placement named `subscription_paywall`
   - Create a placement named `restore_purchases`
   - Configure paywall designs and rules in the Superwall dashboard

### 3. Apple Sandbox Testing Setup

1. **Create Sandbox Test Account**:
   - Go to App Store Connect → Users and Access → Sandbox Testers
   - Create a new sandbox tester account
   - Use a unique email (doesn't need to be real)
   - Remember the password

2. **Configure Your Device**:
   - On your iOS device: Settings → App Store → Sandbox Account
   - Sign in with your sandbox tester account
   - **Important**: Sign out of your regular Apple ID in the App Store first

## 🔨 Building for Testing

### Option 1: Development Build (Recommended for Testing)

```bash
# Install dependencies
npm install

# Create native iOS project
npx expo prebuild --clean

# Run on iOS device or simulator
npx expo run:ios
```

### Option 2: EAS Build for TestFlight

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure EAS
eas build:configure

# Build for TestFlight
eas build --profile production --platform ios

# Submit to TestFlight
eas submit --platform ios
```

## 🧪 Testing in Sandbox Environment

### Testing Purchase Flow

1. **Launch the app** on your device (must be a real device or simulator with sandbox account)

2. **Trigger the paywall**:
   - The paywall will appear when needed
   - Or manually test by navigating to the subscription screen

3. **Select a plan** (Monthly or Annual)

4. **Tap Subscribe**:
   - Apple's purchase sheet will appear
   - Sign in with your **Sandbox Test Account** when prompted
   - Confirm the purchase (you won't be charged real money)

5. **Verify subscription**:
   - The app should recognize the active subscription
   - Check console logs for subscription status

### Testing Restore Purchases

1. **Delete and reinstall the app**

2. **Tap "Restore Purchases"** on the paywall

3. **Sign in with the same Sandbox Test Account**

4. **Verify** that your subscription is restored

### Testing Trial Period

1. **New Sandbox Account**: Use a fresh sandbox tester account

2. **Subscribe**: Complete the purchase flow

3. **Verify Trial**: Check that the 7-day trial is active

4. **Fast-Forward Time**: 
   - In Sandbox, you can test subscription renewals quickly
   - Renewals happen much faster than in production (minutes instead of days)

## 🚀 Production Release

### Before Submitting to App Store

1. **Verify API Key**: Ensure you're using the production Superwall API key

2. **Test in TestFlight**:
   - Upload build to TestFlight
   - Test with sandbox accounts
   - Verify all purchase flows work correctly

3. **App Store Review**:
   - In-app purchases must be reviewed by Apple
   - Ensure your products are "Ready to Submit"
   - Submit your app for review

### After App Store Approval

1. **Monitor Subscriptions**:
   - Check Superwall dashboard for subscription analytics
   - Monitor App Store Connect for subscription metrics

2. **Handle Edge Cases**:
   - Subscription renewals
   - Cancellations
   - Refunds
   - Billing issues

## 🔍 Troubleshooting

### "Cannot connect to iTunes Store"
- **Solution**: Ensure you're signed in with a Sandbox Test Account
- Check: Settings → App Store → Sandbox Account

### "This In-App Purchase has already been bought"
- **Solution**: This is normal in Sandbox - the purchase is already active
- Try with a different sandbox account or wait for the subscription to expire

### Products not loading
- **Solution**: 
  - Verify product IDs match exactly in App Store Connect
  - Ensure products are "Ready to Submit" status
  - Check Superwall dashboard configuration
  - Wait a few minutes after creating products (can take time to propagate)

### Subscription status not updating
- **Solution**:
  - Check console logs for Superwall events
  - Verify Superwall API key is correct
  - Ensure app is not running in Expo Go (use development build)

### "Running in Expo Go" message
- **Solution**: Superwall requires a native build
- Run: `npx expo prebuild && npx expo run:ios`

## 📱 How It Works

### Architecture

1. **App Launch**:
   - `app/_layout.tsx` wraps the app with `SuperwallProvider`
   - Superwall SDK initializes with your API key
   - Subscription status is fetched automatically

2. **Paywall Display**:
   - `components/PaywallScreen.tsx` uses `usePlacement` hook
   - When user taps Subscribe, Superwall triggers the purchase flow
   - Apple StoreKit handles the actual payment

3. **Subscription Status**:
   - `contexts/SubscriptionContext.tsx` uses `useUser` hook
   - Subscription status is available throughout the app
   - Status updates automatically when purchases complete

4. **Purchase Flow**:
   ```
   User taps Subscribe
   → Superwall registerPlacement()
   → Apple StoreKit purchase sheet
   → User confirms with Face ID/Touch ID
   → Apple processes payment
   → Superwall receives webhook
   → Subscription status updates
   → App grants access
   ```

## 🎓 Key Files

- `app/_layout.tsx` - Superwall initialization
- `components/PaywallScreen.tsx` - Paywall UI and purchase logic
- `contexts/SubscriptionContext.tsx` - Subscription state management
- `utils/subscriptionManager.ts` - Helper functions
- `utils/superwallConfig.ts` - Product IDs and configuration

## 📚 Additional Resources

- [Superwall Documentation](https://superwall.com/docs)
- [Apple In-App Purchase Guide](https://developer.apple.com/in-app-purchase/)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)
- [Sandbox Testing Guide](https://developer.apple.com/documentation/storekit/in-app_purchase/testing_in-app_purchases_with_sandbox)

## ✅ Checklist

Before submitting to App Store:

- [ ] Products created in App Store Connect
- [ ] Products configured in Superwall dashboard
- [ ] Superwall API key updated in code
- [ ] Tested purchases in Sandbox environment
- [ ] Tested restore purchases
- [ ] Tested trial period
- [ ] Verified subscription status updates correctly
- [ ] Tested on real device (not just simulator)
- [ ] Reviewed Apple's In-App Purchase guidelines
- [ ] Privacy policy and terms of service links work
- [ ] App handles subscription expiration gracefully

## 🆘 Support

If you encounter issues:

1. Check console logs for detailed error messages
2. Verify Superwall dashboard configuration
3. Ensure App Store Connect products are properly set up
4. Contact Superwall support: support@superwall.com
5. Review Apple's Sandbox testing documentation

---

**Note**: This setup works for both Sandbox testing and Production. The same code handles both environments automatically. Superwall detects the environment and uses the appropriate App Store endpoint.
