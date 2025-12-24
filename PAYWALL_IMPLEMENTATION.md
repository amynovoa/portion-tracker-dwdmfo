
# Portion Track Paywall Implementation

## Overview

I've implemented a native paywall system for Portion Track that follows Apple's subscription guidelines and provides a smooth user experience. The implementation includes:

- 7-day free trial for new users
- Monthly ($2.99/month) and Annual ($24.99/year) subscription options
- Automatic TestFlight detection for free tester access
- Subscription status tracking and management
- Paywall presentation at appropriate times

## What Has Been Implemented

### 1. Subscription Management (`utils/subscriptionManager.ts`)

This utility handles all subscription-related logic:

- **TestFlight Detection**: Automatically detects if the app is running in TestFlight or development mode and grants free access
- **Trial Management**: Tracks the 7-day free trial period
- **Subscription Status**: Provides comprehensive subscription status information
- **Paywall Logic**: Determines when to show the paywall

### 2. Paywall Screen (`components/PaywallScreen.tsx`)

A beautiful, Apple-compliant paywall screen that includes:

- Two subscription plan options (Monthly and Annual)
- "Best Value" badge on the annual plan
- Feature list highlighting app benefits
- "Start Free Trial" or "Subscribe" button
- "Restore Purchases" button
- "Manage Subscription" link
- Privacy Policy and Terms of Use links
- Required Apple subscription disclosure text

### 3. Subscription Context (`contexts/SubscriptionContext.tsx`)

A React Context that provides subscription state throughout the app:

- Global subscription status
- Loading states
- Refresh functionality
- Trial start functionality

### 4. Integration Points

**App Layout (`app/_layout.tsx`)**
- Wrapped the app with `SubscriptionProvider`

**Home Screen (`app/(tabs)/(home)/index.tsx`)**
- Shows paywall after profile setup (gentle introduction)
- Displays trial status banner when in trial
- Displays TestFlight banner for testers
- Blocks access after trial expires (hard gate)

**Settings Screen (`app/(tabs)/settings.tsx`)**
- New "Subscription" section showing current status
- Ability to view plans or manage subscription
- TestFlight indicator for testers

## User Experience Flow

### For New Users:
1. User installs app
2. User sets up profile
3. Paywall appears with "Start 7-Day Free Trial" button
4. User can dismiss paywall and use app during trial
5. Trial status shown in banner on home screen
6. After 7 days, paywall appears as hard gate until subscribed

### For TestFlight Testers:
1. App automatically detects TestFlight build
2. Full access granted without paywall
3. TestFlight banner shown on home screen
4. Settings show "TestFlight - Full Access" status

### For Subscribed Users:
1. Full access to all features
2. Can manage subscription in Settings
3. Can restore purchases if needed

## What You Need to Do

### 1. App Store Connect Setup

Create your subscription products in App Store Connect:

**Subscription Group**: "Portion Track Access"

**Monthly Subscription**:
- Product ID: `com.portiontrack.monthly` (or your choice)
- Price: $2.99/month
- Free Trial: 7 days
- Name: "Portion Track Monthly"
- Description: "Full access to Portion Track"

**Annual Subscription**:
- Product ID: `com.portiontrack.annual` (or your choice)
- Price: $24.99/year
- Free Trial: 7 days
- Name: "Portion Track Annual"
- Description: "Full access to Portion Track"

### 2. Superwall Integration (Optional but Recommended)

The current implementation is a placeholder. For production, you should integrate Superwall:

1. **Install Superwall**:
   ```bash
   npx expo install expo-superwall
   ```

2. **Get Superwall API Key**:
   - Sign up at https://superwall.com
   - Create a new app
   - Get your iOS API key

3. **Update `app/_layout.tsx`**:
   ```tsx
   import { SuperwallProvider } from 'expo-superwall';
   
   // Wrap your app with SuperwallProvider
   <SuperwallProvider apiKeys={{ ios: "YOUR_SUPERWALL_API_KEY" }}>
     <SubscriptionProvider>
       {/* rest of app */}
     </SubscriptionProvider>
   </SuperwallProvider>
   ```

4. **Update `components/PaywallScreen.tsx`**:
   - Replace placeholder subscription logic with Superwall hooks
   - Use `usePlacement` for paywall presentation
   - Use `useUser` for subscription status

5. **Update `utils/subscriptionManager.ts`**:
   - Integrate with Superwall's subscription status
   - Use Superwall's entitlement system

### 3. Add Your URLs

Update these URLs in `components/PaywallScreen.tsx`:

```tsx
const handlePrivacyPolicy = () => {
  Linking.openURL('https://yourapp.com/privacy'); // Your privacy policy URL
};

const handleTermsOfUse = () => {
  Linking.openURL('https://yourapp.com/terms'); // Your terms of use URL
};
```

### 4. App Review Notes

When submitting to App Review, include these notes:

```
No sign-in required.

Subscription provides full access after a 7-day free trial.

TestFlight builds unlock access for testers automatically.

For testing the subscription flow, please use the following test account:
[Provide a test account if needed]

The app uses a 7-day free trial. After the trial, users must subscribe to continue using the app.
```

### 5. Testing

**TestFlight Testing**:
- Build and upload to TestFlight
- Testers will automatically get full access
- No paywall will be shown to TestFlight users

**Sandbox Testing** (for subscription flow):
- Create sandbox test accounts in App Store Connect
- Test the subscription purchase flow
- Test trial expiration
- Test restore purchases

## Current Limitations

1. **No Real Subscription Processing**: The current implementation is a UI-only placeholder. You need to integrate with Superwall or another IAP solution for actual subscription processing.

2. **Trial Tracking**: Trial is tracked locally. In production, you should use Superwall's server-side tracking for security.

3. **Receipt Validation**: No receipt validation is implemented. Superwall handles this automatically.

## Benefits of This Approach

✅ **Apple Compliant**: Follows all Apple subscription guidelines
✅ **Tester Friendly**: Automatic free access for TestFlight users
✅ **User Friendly**: Gentle paywall introduction with free trial
✅ **Clean UI**: Beautiful, native-feeling paywall design
✅ **Flexible**: Easy to integrate with Superwall or other IAP solutions
✅ **Transparent**: Clear subscription status and management options

## Next Steps

1. Set up subscription products in App Store Connect
2. (Optional) Integrate Superwall for production-ready IAP
3. Add your Privacy Policy and Terms of Use URLs
4. Test thoroughly in TestFlight
5. Submit for App Review with proper notes

## Questions?

If you need help with:
- Superwall integration
- App Store Connect setup
- Testing subscription flows
- App Review submission

Just let me know and I can provide more detailed guidance!
