
# StoreKit Integration Guide for Production

## Current Status

Your app is **READY FOR TESTFLIGHT TESTING** with simulated subscriptions, but **REQUIRES NATIVE STOREKIT INTEGRATION** for production App Store release with real payments.

## What Works Now

✅ **TestFlight & Development:**
- Simulated subscriptions for testing the UI and flow
- All subscription screens and logic work correctly
- Can test the complete user experience
- Safe to submit to TestFlight for beta testing

❌ **Production (Real Payments):**
- No real StoreKit integration yet
- Cannot process actual App Store payments
- Cannot validate receipts
- Cannot restore real purchases

## Required Steps for Production

### 1. App Store Connect Setup (REQUIRED)

1. **Create In-App Purchase Products:**
   - Go to App Store Connect → Your App → Features → In-App Purchases
   - Create two **Auto-Renewable Subscriptions**:
     - Product ID: `com.portiontracker.app.monthly`
     - Product ID: `com.portiontracker.app.annual`
   - Set pricing: $2.99/month and $24.99/year
   - Add 7-day free trial to both
   - Submit for review

2. **Create Subscription Group:**
   - Name: "Portion Tracker Premium"
   - Add both products to this group

3. **Set Up Sandbox Testers:**
   - Users & Access → Sandbox Testers
   - Create test Apple IDs for testing purchases

### 2. Native iOS StoreKit Integration (REQUIRED)

You need to add native iOS code to handle StoreKit. Two options:

#### Option A: Use RevenueCat (Recommended - Easier)

RevenueCat handles all StoreKit complexity for you:

```bash
npm install react-native-purchases
npx pod-install
```

Then update `utils/subscriptionManager.ts` to use RevenueCat SDK.

**Benefits:**
- Handles receipt validation automatically
- Server-side subscription status
- Cross-platform support
- Built-in analytics
- Easier to implement

#### Option B: Native StoreKit (More Control)

Create native iOS module to handle StoreKit:

1. **Add StoreKit Framework:**
   - Open iOS project in Xcode
   - Add StoreKit.framework to your target

2. **Create Native Module:**
   - Create `RNStoreKitModule.swift`
   - Implement SKProductsRequestDelegate
   - Implement SKPaymentTransactionObserver
   - Handle purchase flow and receipt validation

3. **Bridge to React Native:**
   - Expose native methods to JavaScript
   - Update `utils/subscriptionManager.ts` to call native methods

### 3. Receipt Validation (REQUIRED)

For security, validate receipts server-side:

1. **Set up backend endpoint:**
   - POST /api/validate-receipt
   - Accepts: receipt data from device
   - Validates with Apple's servers
   - Returns: subscription status

2. **Update app to use validation:**
   - Send receipt to your backend after purchase
   - Backend validates with Apple
   - Backend returns subscription status
   - App unlocks features

### 4. Testing Workflow

1. **TestFlight (Current):**
   - Uses simulated subscriptions
   - Tests UI and flow
   - No real payments

2. **Sandbox Testing (After StoreKit Integration):**
   - Use Sandbox tester accounts
   - Test real purchase flow
   - Test receipt validation
   - Test restore purchases
   - No real charges

3. **Production:**
   - Real App Store payments
   - Real subscriptions
   - Real charges to users

## Implementation Priority

### Phase 1: TestFlight (CURRENT - WORKING)
✅ Simulated subscriptions
✅ Complete UI and flow
✅ Ready for beta testing

### Phase 2: StoreKit Integration (REQUIRED FOR PRODUCTION)
⚠️ Choose RevenueCat OR native StoreKit
⚠️ Implement purchase flow
⚠️ Implement receipt validation
⚠️ Test in Sandbox

### Phase 3: Production Release
⚠️ Submit In-App Purchases for review
⚠️ Test with real Sandbox accounts
⚠️ Submit app for App Store review
⚠️ Release to production

## Recommended: Use RevenueCat

For fastest production-ready implementation, I recommend RevenueCat:

1. **Sign up:** https://www.revenuecat.com/
2. **Install SDK:** `npm install react-native-purchases`
3. **Configure:** Add API keys to app
4. **Update code:** Replace simulated purchases with RevenueCat calls
5. **Test:** Use Sandbox testers
6. **Deploy:** Submit to App Store

RevenueCat handles:
- StoreKit integration
- Receipt validation
- Subscription status
- Cross-platform support
- Analytics and webhooks

## Next Steps

**For TestFlight NOW:**
- ✅ Your app is ready - submit to TestFlight
- ✅ Beta testers can test the full flow
- ✅ Subscriptions are simulated (no real charges)

**For Production Release:**
1. Set up In-App Purchases in App Store Connect
2. Choose RevenueCat or native StoreKit
3. Implement real purchase flow
4. Test in Sandbox
5. Submit for App Store review

## Questions?

- **Can I submit to TestFlight now?** YES - it's ready for beta testing
- **Will TestFlight users be charged?** NO - subscriptions are simulated
- **When do I need real StoreKit?** Before production App Store release
- **How long does StoreKit integration take?** 1-2 days with RevenueCat, 1-2 weeks native
- **Do I need a backend?** Recommended for receipt validation, but RevenueCat can handle it

## Summary

✅ **TestFlight Ready:** Submit now for beta testing
⚠️ **Production:** Requires StoreKit integration (RevenueCat recommended)
📋 **Timeline:** 1-2 days to add RevenueCat for production-ready payments
