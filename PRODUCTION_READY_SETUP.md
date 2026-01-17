
# Production-Ready StoreKit Setup - Complete Guide

## ✅ Implementation Complete

Your app now has **full StoreKit integration** using `expo-in-app-purchases`. This guide explains how to configure it for different environments.

## Quick Start

### Current Status (TestFlight UI Testing)

Your app is **ready for TestFlight** with simulated subscriptions:

```bash
# .env file (current setting)
EXPO_PUBLIC_STOREKIT_TESTFLIGHT_BYPASS=true
```

- ✅ Testers can test the full subscription flow
- ✅ No real purchases required
- ✅ Perfect for UI/UX testing
- ✅ Submit to TestFlight now!

## Three Testing Modes

### Mode 1: Simulated Subscriptions (Current)

**When to use:** UI testing, beta testing, development

**Setup:**
```bash
# .env
EXPO_PUBLIC_STOREKIT_TESTFLIGHT_BYPASS=true
```

**Behavior:**
- Tapping "Subscribe" instantly unlocks the app
- No Apple payment sheet appears
- No real purchases
- Perfect for testing UI and flow

**How to test:**
1. Build and upload to TestFlight
2. Install on device
3. Tap "Start 7-Day Free Trial"
4. Tap "Subscribe" → Instant success ✅
5. App unlocks immediately

---

### Mode 2: Sandbox Purchases (Real Testing)

**When to use:** Testing real purchase flow before production

**Setup:**

1. **Create products in App Store Connect:**
   - Go to your app → Features → In-App Purchases
   - Create two Auto-Renewable Subscriptions:
     - Product ID: `portiontrack.monthly` ($2.99/month, 7-day trial)
     - Product ID: `portiontrack.annual` ($24.99/year, 7-day trial)
   - Create subscription group: "Portion Tracker Premium"
   - Add both products to the group

2. **Create sandbox tester:**
   - App Store Connect → Users & Access → Sandbox Testers
   - Create new sandbox Apple ID
   - Use unique email (doesn't need to be real)

3. **Update .env:**
   ```bash
   EXPO_PUBLIC_STOREKIT_TESTFLIGHT_BYPASS=false
   ```

4. **Rebuild and upload to TestFlight**

**Behavior:**
- Tapping "Subscribe" shows Apple's payment sheet
- Real purchase flow (sandbox environment)
- No real charges
- Tests complete purchase experience

**How to test:**
1. On iOS device: Settings → App Store → Sandbox Account
2. Sign in with sandbox tester
3. Open app in TestFlight
4. Tap "Start 7-Day Free Trial"
5. Apple payment sheet appears 💳
6. Sign in with sandbox account
7. Complete purchase (no real charge)
8. App unlocks ✅
9. Delete app and reinstall
10. Tap "Restore Purchases" → Should restore subscription ✅

---

### Mode 3: Production (Real Purchases)

**When to use:** App Store release

**Setup:**

1. **Ensure products are approved:**
   - App Store Connect → Your App → In-App Purchases
   - Both products should be "Ready to Submit" or "Approved"

2. **Set environment variable in EAS:**
   ```bash
   # In EAS Build secrets or production config
   EXPO_PUBLIC_STOREKIT_TESTFLIGHT_BYPASS=false
   ```

3. **Build production version:**
   ```bash
   eas build --platform ios --profile production
   ```

4. **Submit to App Store**

**Behavior:**
- Real Apple payment sheet
- Real charges to users
- Real subscriptions
- Production App Store environment

---

## Step-by-Step: App Store Connect Setup

### 1. Create In-App Purchase Products

1. **Navigate to App Store Connect:**
   - Go to https://appstoreconnect.apple.com
   - Select your app
   - Click "Features" tab
   - Click "In-App Purchases"

2. **Create Monthly Subscription:**
   - Click "+" button
   - Select "Auto-Renewable Subscription"
   - **Reference Name:** Portion Tracker Monthly
   - **Product ID:** `portiontrack.monthly`
   - Click "Create"

3. **Configure Monthly Subscription:**
   - **Subscription Duration:** 1 Month
   - **Price:** $2.99 USD (Tier 3)
   - **Subscription Prices:** Add all territories
   - **Introductory Offer:**
     - Type: Free Trial
     - Duration: 7 Days
     - Eligible: New Subscribers
   - **Localization (English - US):**
     - Display Name: Monthly Subscription
     - Description: Access all features with a monthly subscription

4. **Create Annual Subscription:**
   - Click "+" button
   - Select "Auto-Renewable Subscription"
   - **Reference Name:** Portion Tracker Annual
   - **Product ID:** `portiontrack.annual`
   - Click "Create"

5. **Configure Annual Subscription:**
   - **Subscription Duration:** 1 Year
   - **Price:** $24.99 USD (Tier 25)
   - **Subscription Prices:** Add all territories
   - **Introductory Offer:**
     - Type: Free Trial
     - Duration: 7 Days
     - Eligible: New Subscribers
   - **Localization (English - US):**
     - Display Name: Annual Subscription
     - Description: Access all features with an annual subscription (Best Value!)

6. **Create Subscription Group:**
   - Click "Subscription Groups" in left sidebar
   - Click "+" to create new group
   - **Reference Name:** Portion Tracker Premium
   - Click "Create"
   - Add both subscriptions to this group

7. **Submit for Review:**
   - Add subscription information
   - Add app screenshots showing subscription features
   - Add subscription review notes
   - Click "Submit for Review"

### 2. Create Sandbox Tester

1. **Navigate to Sandbox Testers:**
   - App Store Connect → Users and Access
   - Click "Sandbox" tab
   - Click "Testers" in left sidebar

2. **Create New Tester:**
   - Click "+" button
   - **First Name:** Test
   - **Last Name:** User
   - **Email:** testuser1@example.com (use unique email)
   - **Password:** Create strong password
   - **Confirm Password:** Same password
   - **Country/Region:** United States
   - Click "Create"

3. **Note the credentials:**
   - Save email and password
   - You'll need these to sign in on device

### 3. Configure iOS Device for Sandbox Testing

1. **Sign out of production App Store:**
   - Settings → [Your Name] → Media & Purchases
   - Tap "Sign Out"

2. **Configure Sandbox Account:**
   - Settings → App Store
   - Scroll to "Sandbox Account"
   - Tap "Sign In"
   - Enter sandbox tester email and password

3. **Verify:**
   - You should see "Sandbox Account: testuser1@example.com"

---

## Testing Checklist

### ✅ Phase 1: UI Testing (Current)

- [ ] Build with `EXPO_PUBLIC_STOREKIT_TESTFLIGHT_BYPASS=true`
- [ ] Upload to TestFlight
- [ ] Install on device
- [ ] Open app → Should show "Start 7-Day Free Trial"
- [ ] Tap button → Should show paywall
- [ ] Tap "Subscribe" → Should succeed instantly
- [ ] App should unlock and show main content
- [ ] Tap "Restore Purchases" → Should succeed instantly
- [ ] Close and reopen app → Should stay unlocked

### ✅ Phase 2: Sandbox Testing

- [ ] Create products in App Store Connect
- [ ] Create sandbox tester
- [ ] Build with `EXPO_PUBLIC_STOREKIT_TESTFLIGHT_BYPASS=false`
- [ ] Upload to TestFlight
- [ ] Configure device with sandbox account
- [ ] Install on device
- [ ] Open app → Should show "Start 7-Day Free Trial"
- [ ] Tap button → Should show paywall
- [ ] Verify prices load from App Store
- [ ] Tap "Subscribe" → Apple payment sheet should appear
- [ ] Sign in with sandbox account
- [ ] Complete purchase → Should succeed
- [ ] App should unlock
- [ ] Delete app
- [ ] Reinstall app
- [ ] Tap "Restore Purchases" → Should restore subscription
- [ ] App should unlock

### ✅ Phase 3: Production

- [ ] Verify products are approved in App Store Connect
- [ ] Set `EXPO_PUBLIC_STOREKIT_TESTFLIGHT_BYPASS=false` in production config
- [ ] Build production version
- [ ] Submit to App Store
- [ ] Wait for approval
- [ ] Test with real Apple ID (will be charged)
- [ ] Verify subscription works
- [ ] Monitor App Store Connect analytics

---

## Configuration Files

### `.env` (Local Development)

```bash
# TestFlight Bypass Toggle
# Set to 'true' for UI testing (simulated subscriptions)
# Set to 'false' for sandbox/production testing (real purchases)
EXPO_PUBLIC_STOREKIT_TESTFLIGHT_BYPASS=true
```

### `app.json` (Already Configured)

```json
{
  "expo": {
    "plugins": [
      [
        "expo-in-app-purchases",
        {}
      ]
    ]
  }
}
```

### EAS Build Configuration (Production)

Add to your EAS secrets:

```bash
# For production builds
EXPO_PUBLIC_STOREKIT_TESTFLIGHT_BYPASS=false
```

---

## Troubleshooting

### Products Not Loading

**Symptoms:** Paywall shows "$2.99" and "$24.99" instead of real prices

**Solutions:**
1. Verify product IDs match exactly:
   - `portiontrack.monthly`
   - `portiontrack.annual`
2. Check products are "Ready to Submit" in App Store Connect
3. Wait 24 hours after creating products
4. Verify bundle ID matches: `com.portiontracker.app`
5. Check device has internet connection

### Purchase Fails

**Symptoms:** Tapping "Subscribe" shows error

**Solutions:**
1. Verify `EXPO_PUBLIC_STOREKIT_TESTFLIGHT_BYPASS=false`
2. Check sandbox tester is signed in (Settings → App Store)
3. Verify products exist in App Store Connect
4. Try signing out and back in with sandbox account
5. Check console logs for specific error

### Restore Purchases Finds Nothing

**Symptoms:** "No purchases found" message

**Solutions:**
1. Ensure you've made a purchase with this sandbox account
2. Verify `EXPO_PUBLIC_STOREKIT_TESTFLIGHT_BYPASS=false`
3. Check subscription hasn't expired
4. Try making a new purchase first
5. Verify same sandbox account is signed in

### Payment Sheet Doesn't Appear

**Symptoms:** Tapping "Subscribe" does nothing or succeeds instantly

**Solutions:**
1. Verify `EXPO_PUBLIC_STOREKIT_TESTFLIGHT_BYPASS=false` in `.env`
2. Rebuild app after changing `.env`
3. Check products exist in App Store Connect
4. Verify bundle ID matches
5. Check console logs for errors

---

## Console Logs

The app logs detailed information to help debug:

```
🛒 Initializing StoreKit connection...
✅ Connected to App Store
🛒 Fetching product details from App Store for: portiontrack.monthly
✅ Product details fetched: { productId, price, priceString }
🛒 Initiating App Store purchase for: portiontrack.monthly
📱 Purchase response: { responseCode: 0 }
✅ Purchase successful
✅ Subscription status saved
```

Check Xcode console or device logs for these messages.

---

## Summary

### Current Status
✅ **Implementation:** Complete
✅ **TestFlight:** Ready (bypass ON)
✅ **Sandbox Testing:** Ready (toggle bypass OFF)
✅ **Production:** Ready (real StoreKit integration)

### Next Steps

**For TestFlight NOW:**
1. Keep `EXPO_PUBLIC_STOREKIT_TESTFLIGHT_BYPASS=true`
2. Build and upload to TestFlight
3. Distribute to testers
4. Testers can test full flow with simulated subscriptions

**For Sandbox Testing:**
1. Create products in App Store Connect
2. Create sandbox tester
3. Set `EXPO_PUBLIC_STOREKIT_TESTFLIGHT_BYPASS=false`
4. Rebuild and upload to TestFlight
5. Test with sandbox account

**For Production:**
1. Ensure products are approved
2. Set bypass to false in production config
3. Build and submit to App Store
4. Monitor subscription analytics

---

## Support

If you encounter issues:

1. **Check console logs** - Detailed logging is implemented
2. **Verify product IDs** - Must match exactly
3. **Check App Store Connect** - Products must be approved
4. **Test sandbox account** - Must be signed in correctly
5. **Review this guide** - Step-by-step instructions above

Your app is now production-ready with full StoreKit integration! 🎉
