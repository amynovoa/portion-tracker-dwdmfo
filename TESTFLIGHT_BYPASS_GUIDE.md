
# TestFlight Bypass Toggle - Complete Guide

## Overview

The TestFlight bypass toggle allows testers to switch between:
- **Bypass ON**: Simulated purchases (no real charges, instant access)
- **Bypass OFF**: Real sandbox purchases (test actual StoreKit flow)

## Key Features

✅ **Only visible in TestFlight/Development** - Completely hidden in production App Store builds
✅ **Persistent toggle** - Testers can switch ON/OFF anytime in the paywall screen
✅ **Stored in AsyncStorage** - Toggle state persists across app restarts
✅ **Clear visual feedback** - Shows current mode with Switch component

## How It Works

### For Testers in TestFlight

1. **Open the app** and navigate to the paywall screen
2. **See the TestFlight banner** at the top with a toggle switch
3. **Toggle ON (default)**:
   - Purchases are simulated
   - No real charges
   - Instant subscription access
   - Perfect for testing app features without sandbox accounts
4. **Toggle OFF**:
   - Real sandbox purchases enabled
   - Use a sandbox tester account
   - Tests actual StoreKit purchase flow
   - Perfect for testing payment integration

### For Production Users

- **No toggle visible** - The TestFlight banner and bypass toggle are completely hidden
- **Real purchases only** - All purchases go through the App Store
- **No bypass possible** - Production builds cannot enable bypass mode

## Implementation Details

### Files Modified

1. **utils/subscriptionManager.ts**
   - Added `getTestFlightBypassEnabled()` - Reads toggle state from AsyncStorage
   - Added `setTestFlightBypassEnabled(enabled)` - Saves toggle state to AsyncStorage
   - Updated `purchaseProduct()` to check bypass state
   - Updated `restorePurchases()` to check bypass state

2. **components/PaywallScreen.tsx**
   - Added TestFlight banner with toggle switch
   - Shows current bypass mode (ON/OFF)
   - Provides clear instructions for testers
   - Only visible when `isTestFlightBuild()` returns true

### How Production Detection Works

```typescript
export function isTestFlightBuild(): boolean {
  // Development mode
  if (__DEV__) {
    return true;
  }

  // Expo Go
  if (Constants.appOwnership === 'expo') {
    return true;
  }

  // Production builds
  return false;
}
```

In production builds:
- `__DEV__` is false
- `Constants.appOwnership` is 'standalone'
- `isTestFlightBuild()` returns false
- TestFlight banner is hidden
- Bypass toggle is not shown

## Testing Instructions

### Test Scenario 1: Bypass Mode (Default)

1. Install app via TestFlight
2. Open paywall screen
3. Verify toggle is ON (default)
4. Tap "Subscribe" button
5. ✅ Should show success immediately (no App Store sheet)
6. ✅ Should grant access to app

### Test Scenario 2: Real Sandbox Purchases

1. Toggle bypass to OFF
2. Tap "Subscribe" button
3. ✅ Should show Apple's purchase sheet
4. ✅ Use sandbox tester account to complete purchase
5. ✅ Should grant access after successful purchase

### Test Scenario 3: Toggle Persistence

1. Set toggle to OFF
2. Close app completely
3. Reopen app
4. Open paywall screen
5. ✅ Toggle should still be OFF (state persisted)

### Test Scenario 4: Production Build

1. Build for App Store (not TestFlight)
2. Install production build
3. Open paywall screen
4. ✅ No TestFlight banner visible
5. ✅ No bypass toggle visible
6. ✅ Only real purchases work

## Environment Variable

The `.env` file contains:
```
EXPO_PUBLIC_STOREKIT_TESTFLIGHT_BYPASS=true
```

This is the **default value** when the app first launches. Testers can then toggle it ON/OFF in the UI, and their preference is saved in AsyncStorage.

## For Developers

### To Change Default Bypass State

Edit `.env`:
```
# Default to bypass ON (easier for testers)
EXPO_PUBLIC_STOREKIT_TESTFLIGHT_BYPASS=true

# OR default to bypass OFF (test real purchases by default)
EXPO_PUBLIC_STOREKIT_TESTFLIGHT_BYPASS=false
```

### To Test Production Behavior in Development

Temporarily modify `isTestFlightBuild()` to return false:
```typescript
export function isTestFlightBuild(): boolean {
  return false; // Force production mode for testing
}
```

Remember to revert this before committing!

## Troubleshooting

### Toggle Not Visible
- ✅ Check you're running in TestFlight or development mode
- ✅ Production builds never show the toggle (this is correct)

### Purchases Not Working with Bypass OFF
- ✅ Make sure you're using a sandbox tester account
- ✅ Check App Store Connect for sandbox tester setup
- ✅ Verify product IDs match in App Store Connect

### Toggle State Not Persisting
- ✅ Check AsyncStorage permissions
- ✅ Verify `@react-native-async-storage/async-storage` is installed
- ✅ Check console logs for AsyncStorage errors

## Summary

✅ **TestFlight testers** can toggle between simulated and real purchases
✅ **Production users** only see real purchases (no toggle)
✅ **Toggle state persists** across app restarts
✅ **Clear visual feedback** shows current mode
✅ **No code changes needed** for production vs TestFlight - it's automatic

This implementation provides the best of both worlds:
- Easy testing for testers (bypass ON)
- Real purchase testing when needed (bypass OFF)
- Production safety (no bypass possible)
