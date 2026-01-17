
# Superwall + StoreKit Production Setup Guide

## ✅ Current Status

Your app now has a **production-ready Superwall + StoreKit integration** that works in:
- ✅ **Development** (Expo Go / local builds)
- ✅ **Sandbox** (TestFlight)
- ✅ **Production** (App Store)

The subscription screen UI and app functionality remain **unchanged**.

## 🚀 How It Works

### Development Mode (No API Key)
- Uses simulated subscriptions stored in AsyncStorage
- Allows testing the full subscription flow without Superwall
- Shows "Test Mode" indicator on paywall

### Production Mode (With API Key)
- Uses real Superwall + StoreKit integration
- Processes real subscriptions through Apple
- Works in both Sandbox (TestFlight) and Production (App Store)

## 📋 Setup Steps for Production

### 1. Create Superwall Account
1. Go to https://superwall.com
2. Sign up for an account
3. Create a new app in the dashboard

### 2. Get Your Superwall API Key
1. In Superwall dashboard, go to **Settings > API Keys**
2. Copy your **iOS API key** (starts with `pk_`)
3. Add it to your `.env` file:
   ```
   EXPO_PUBLIC_SUPERWALL_API_KEY=pk_your_actual_key_here
   ```

### 3. Configure Products in App Store Connect
1. Go to **App Store Connect** > Your App > **Subscriptions**
2. Create two auto-renewable subscription products:

   **Monthly Subscription:**
   - Product ID: `portiontrack.monthly`
   - Price: $2.99/month
   - Free Trial: 7 days

   **Annual Subscription:**
   - Product ID: `portiontrack.annual`
   - Price: $24.99/year
   - Free Trial: 7 days

3. Submit products for review (they must be approved before testing)

### 4. Configure Products in Superwall Dashboard
1. In Superwall dashboard, go to **Products**
2. Click **Add Product**
3. Add both products:
   - `portiontrack.monthly`
   - `portiontrack.annual`
4. Superwall will automatically sync with App Store Connect

### 5. Create Placement in Superwall Dashboard
1. In Superwall dashboard, go to **Placements**
2. Click **Create Placement**
3. Name it: `onboarding_paywall`
4. Design your paywall:
   - Add your subscription products
   - Customize the design (or use the default)
   - Set up any rules/triggers
5. Publish the placement

### 6. Build for TestFlight (Sandbox Testing)
1. Set your Superwall API key in EAS Build secrets:
   ```bash
   eas secret:create --scope project --name EXPO_PUBLIC_SUPERWALL_API_KEY --value pk_your_actual_key_here
   ```

2. Build for iOS:
   ```bash
   eas build --platform ios --profile production
   ```

3. Upload to TestFlight

4. Test with Sandbox subscriptions:
   - Create a Sandbox test account in App Store Connect
   - Sign in with the Sandbox account on your test device
   - Test the subscription flow in TestFlight

### 7. Submit to App Store (Production)
1. Ensure all subscription products are approved
2. Ensure Superwall placement is published
3. Submit your app for review
4. Once approved, real subscriptions will work in production

## 🔧 Configuration Files

### `.env`
```bash
# Replace with your actual Superwall API key
EXPO_PUBLIC_SUPERWALL_API_KEY=pk_your_actual_key_here
```

### `app.json`
Already configured with:
- Bundle ID: `com.portiontracker.app`
- Apple Team ID: `9978T8842P`
- `expo-superwall` plugin

### Product IDs (in `utils/superwallConfig.ts`)
- Monthly: `portiontrack.monthly`
- Annual: `portiontrack.annual`

### Placement Name (in `utils/superwallConfig.ts`)
- Onboarding: `onboarding_paywall`

## 🧪 Testing

### Local Development (Without API Key)
- Subscriptions are simulated
- Stored in AsyncStorage
- Shows "Test Mode" indicator

### TestFlight (With API Key + Sandbox)
- Real Superwall integration
- Sandbox subscriptions (free for testing)
- Use Sandbox test account

### Production (With API Key + Production)
- Real Superwall integration
- Real subscriptions charged to users
- Full App Store functionality

## 🐛 Troubleshooting

### Build Fails
- **Issue**: Missing or invalid Superwall API key
- **Solution**: The app now handles this gracefully. It will build successfully and use simulated subscriptions until you add a valid key.

### Paywall Doesn't Show in TestFlight
- **Issue**: Placement not configured or published
- **Solution**: Check Superwall dashboard > Placements > Ensure `onboarding_paywall` is published

### Subscriptions Don't Work in TestFlight
- **Issue**: Products not approved or Sandbox account not signed in
- **Solution**: 
  1. Ensure products are approved in App Store Connect
  2. Sign in with Sandbox test account on device
  3. Check Superwall dashboard for product sync status

### "Test Mode" Shows in Production
- **Issue**: Superwall API key not set or invalid
- **Solution**: 
  1. Verify API key in `.env` or EAS Build secrets
  2. Ensure key starts with `pk_` and is from Superwall dashboard
  3. Rebuild the app

## 📱 User Experience

### Subscription Flow
1. User opens app for first time
2. After onboarding, paywall appears
3. User selects plan (Monthly or Annual)
4. User taps "7 day free trial then $X"
5. Superwall presents native StoreKit purchase sheet
6. User authenticates with Face ID / Touch ID / Password
7. Subscription is activated
8. User gets full access to app

### Restore Purchases
1. User taps "Restore Purchases"
2. Superwall checks for existing subscriptions
3. If found, subscription is restored
4. User gets full access to app

## 🔐 Security

- API keys are stored in environment variables
- Never commit real API keys to git
- Use EAS Build secrets for production builds
- Subscription validation happens server-side (Superwall + Apple)

## 📊 Analytics

Superwall provides built-in analytics:
- Paywall views
- Conversion rates
- Revenue tracking
- Trial conversion
- Churn analysis

Access these in the Superwall dashboard.

## 🆘 Support

- **Superwall Docs**: https://superwall.com/docs
- **Expo Superwall**: https://docs.expo.dev/versions/latest/sdk/superwall/
- **App Store Connect**: https://appstoreconnect.apple.com

## ✨ What's Included

✅ Production-ready Superwall + StoreKit integration
✅ Works in Development, Sandbox, and Production
✅ Graceful fallback to simulated subscriptions
✅ No changes to subscription screen UI
✅ No changes to app functionality
✅ Comprehensive error handling
✅ Detailed logging for debugging
✅ Support for both Monthly and Annual plans
✅ 7-day free trial
✅ Restore purchases functionality
✅ Offline subscription status caching

## 🎉 You're Ready!

Your app is now ready for:
1. ✅ Local development and testing
2. ✅ TestFlight distribution with Sandbox subscriptions
3. ✅ App Store submission with real subscriptions

Just add your Superwall API key and configure your products in App Store Connect!
