
# Superwall Native Build Setup Guide

This guide explains how to set up Superwall for in-app purchases when you build your app natively.

## Current Status

The app is currently configured to work **without** Superwall in development mode (Expo Go). The Superwall plugin has been removed from `app.json` to prevent build errors.

When you build the app natively (with EAS Build or `expo prebuild`), you'll need to follow these steps to enable Superwall.

## Why Superwall Plugin Was Removed

The `expo-superwall` plugin was causing build errors because:
- The plugin requires native code that isn't available in Expo Go
- The plugin needs to be configured during the native build process
- It requires proper App Store Connect setup first

## Steps to Enable Superwall (When Ready for Native Build)

### 1. Set Up App Store Connect

Before enabling Superwall, you need to:

1. Create your app in App Store Connect
2. Create in-app purchase products:
   - Monthly subscription: `portiontrack.monthly`
   - Annual subscription: `portiontrack.annual`
3. Set up subscription groups and pricing
4. Submit products for review

### 2. Set Up Superwall Dashboard

1. Go to [Superwall Dashboard](https://superwall.com/dashboard)
2. Create a new app
3. Get your iOS API key
4. Create paywalls in the dashboard
5. Configure placements:
   - `onboarding_paywall`
   - `settings_paywall`
   - `feature_gate`

### 3. Update Configuration Files

#### Update `app.json`

Add the Superwall plugin back to `app.json`:

```json
{
  "expo": {
    "plugins": [
      "expo-font",
      "expo-router",
      "expo-web-browser",
      [
        "expo-superwall",
        {
          "iosApiKey": "pk_YOUR_ACTUAL_IOS_API_KEY_HERE"
        }
      ],
      [
        "expo-image-picker",
        {
          "photosPermission": "This app needs access to your photo library to select meal photos.",
          "cameraPermission": "This app uses the camera to take photos of your meals for tracking purposes."
        }
      ]
    ]
  }
}
```

#### Update `utils/superwallConfig.ts`

Replace the placeholder API key with your actual key:

```typescript
export const SUPERWALL_API_KEY = 'pk_YOUR_ACTUAL_API_KEY_FROM_SUPERWALL_DASHBOARD';
```

### 4. Update App Code to Use Superwall

#### Update `app/_layout.tsx`

Replace the current SubscriptionProvider with SuperwallProvider:

```typescript
import { SuperwallProvider, SuperwallLoading, SuperwallLoaded, SuperwallError } from 'expo-superwall';
import { SUPERWALL_API_KEY } from '@/utils/superwallConfig';

export default function RootLayout() {
  // ... existing code ...

  return (
    <SuperwallProvider 
      apiKeys={{ ios: SUPERWALL_API_KEY }}
      onConfigurationError={(error) => {
        console.error('❌ Superwall configuration error:', error);
      }}
    >
      <SuperwallLoading>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 16, color: colors.textSecondary }}>Loading...</Text>
        </View>
      </SuperwallLoading>

      <SuperwallError>
        {(error) => (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: colors.background }}>
            <Text style={{ fontSize: 18, marginBottom: 10, color: colors.text, textAlign: 'center' }}>
              Failed to initialize subscriptions
            </Text>
            <Text style={{ color: colors.textSecondary, marginBottom: 20, textAlign: 'center' }}>
              {error}
            </Text>
          </View>
        )}
      </SuperwallError>

      <SuperwallLoaded>
        <AppContent />
      </SuperwallLoaded>
    </SuperwallProvider>
  );
}
```

#### Update `contexts/SubscriptionContext.tsx`

Replace the mock implementation with actual Superwall hooks:

```typescript
import { useUser } from 'expo-superwall';

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { subscriptionStatus, user } = useUser();
  
  const isSubscribed = subscriptionStatus?.status === 'ACTIVE';
  const isLoading = !user && !subscriptionStatus;

  return (
    <SubscriptionContext.Provider value={{ 
      isSubscribed, 
      subscriptionStatus,
      isLoading
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}
```

#### Update `components/PaywallScreen.tsx`

Replace the mock implementation with actual Superwall hooks:

```typescript
import { usePlacement, useUser } from 'expo-superwall';
import { PLACEMENTS } from '@/utils/superwallConfig';

export default function PaywallScreen({ visible, onDismiss, canDismiss = true }: PaywallScreenProps) {
  const { subscriptionStatus } = useUser();
  const { registerPlacement } = usePlacement({
    onError: (err) => {
      console.error('❌ Paywall Error:', err);
      Alert.alert('Error', 'Failed to load subscription options.');
    },
    onDismiss: (info, result) => {
      if (result.state === 'purchased') {
        Alert.alert('Success!', 'Thank you for subscribing!', [{ text: 'OK', onPress: onDismiss }]);
      }
    },
  });

  const handleSubscribe = async () => {
    await registerPlacement({
      placement: PLACEMENTS.settings,
      feature: () => {
        console.log('✅ User has premium access');
        if (onDismiss) onDismiss();
      },
    });
  };

  // ... rest of component
}
```

### 5. Build the App

#### Option A: EAS Build (Recommended)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure EAS
eas build:configure

# Build for iOS
eas build --platform ios --profile development

# Or build for production
eas build --platform ios --profile production
```

#### Option B: Local Prebuild

```bash
# Generate native projects
npx expo prebuild

# Open in Xcode
open ios/YourApp.xcworkspace

# Build and run from Xcode
```

### 6. Test Subscriptions

#### Sandbox Testing (iOS)

1. Create a sandbox test account in App Store Connect
2. Sign out of your Apple ID on your device
3. Build and install the app
4. When prompted, sign in with your sandbox account
5. Test purchasing subscriptions

#### TestFlight Testing

1. Build with EAS: `eas build --platform ios --profile production`
2. Submit to TestFlight
3. Add internal testers
4. Test the full subscription flow

### 7. Verify Everything Works

Test these scenarios:

- [ ] App launches without errors
- [ ] Paywall displays correctly
- [ ] Can view subscription options
- [ ] Can purchase monthly subscription
- [ ] Can purchase annual subscription
- [ ] Can restore purchases
- [ ] Subscription status updates correctly
- [ ] Premium features unlock after purchase

## Troubleshooting

### "Failed to resolve plugin for module expo-superwall"

This error occurs when:
- The plugin is in `app.json` but you're running in Expo Go
- Solution: Remove the plugin from `app.json` for development, add it back for native builds

### "Superwall configuration error"

This means:
- Invalid API key in `superwallConfig.ts`
- Solution: Double-check your API key from Superwall dashboard

### "No products available"

This means:
- Products not created in App Store Connect
- Products not approved yet
- Wrong product IDs in `superwallConfig.ts`
- Solution: Verify product IDs match exactly

### Purchases not working in sandbox

- Make sure you're signed in with a sandbox test account
- Sandbox accounts must be created in App Store Connect
- Sign out of your real Apple ID first

## Current Development Setup

For now, the app works without Superwall:
- ✅ App builds and runs in Expo Go
- ✅ Paywall UI displays (but shows "native build required" message)
- ✅ All other features work normally
- ❌ Actual subscription purchases require native build

When you're ready to launch, follow this guide to enable full Superwall functionality.
