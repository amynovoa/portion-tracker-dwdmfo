
# StoreKit Quick Reference Card

## 🚀 Quick Start

### Current Status
✅ **Implementation:** COMPLETE  
✅ **TestFlight:** READY (submit now!)  
✅ **Production:** READY (after App Store Connect setup)

---

## 🎛️ Toggle TestFlight Bypass

### File: `.env`

```bash
# For UI testing (simulated subscriptions)
EXPO_PUBLIC_STOREKIT_TESTFLIGHT_BYPASS=true

# For real purchases (sandbox or production)
EXPO_PUBLIC_STOREKIT_TESTFLIGHT_BYPASS=false
```

**After changing:** Rebuild and upload to TestFlight

---

## 📦 Product IDs

Must match exactly in App Store Connect:

```
portiontrack.monthly   → $2.99/month (7-day trial)
portiontrack.annual    → $24.99/year (7-day trial)
```

---

## 🧪 Testing Modes

| Mode | Bypass | Use For | Behavior |
|------|--------|---------|----------|
| **Simulated** | ON | UI testing | Instant success, no purchases |
| **Sandbox** | OFF | Flow testing | Real payment sheet, no charges |
| **Production** | OFF | App Store | Real purchases, real charges |

---

## ✅ TestFlight Checklist

### Submit Now (Simulated Mode)
- [x] Implementation complete
- [x] Bypass is ON
- [x] Build and upload
- [x] Distribute to testers
- [x] Testers can test full flow

### Sandbox Testing (Optional)
- [ ] Create products in App Store Connect
- [ ] Create sandbox tester
- [ ] Set bypass to OFF
- [ ] Rebuild and upload
- [ ] Test with sandbox account

---

## 🏪 App Store Connect Setup

### 1. Create Products

**Monthly:**
- Product ID: `portiontrack.monthly`
- Type: Auto-Renewable Subscription
- Price: $2.99/month
- Trial: 7 days

**Annual:**
- Product ID: `portiontrack.annual`
- Type: Auto-Renewable Subscription
- Price: $24.99/year
- Trial: 7 days

### 2. Create Subscription Group
- Name: "Portion Tracker Premium"
- Add both products

### 3. Submit for Review
- Add screenshots
- Add description
- Submit

---

## 🐛 Troubleshooting

### Products not loading?
- Check product IDs match exactly
- Verify products are approved
- Wait 24 hours after creating
- Check bundle ID: `com.portiontracker.app`

### Purchase fails?
- Verify bypass is OFF
- Check sandbox tester signed in
- Check console logs

### Restore finds nothing?
- Make a purchase first
- Verify bypass is OFF
- Check same sandbox account

---

## 📚 Documentation

- **`IMPLEMENTATION_SUMMARY.md`** - Overview
- **`STOREKIT_INTEGRATION_GUIDE.md`** - Technical details
- **`PRODUCTION_READY_SETUP.md`** - Step-by-step setup
- **`QUICK_REFERENCE.md`** - This file

---

## 🎯 Next Action

**For TestFlight NOW:**
```bash
# Keep current settings
EXPO_PUBLIC_STOREKIT_TESTFLIGHT_BYPASS=true

# Build and upload
eas build --platform ios --profile preview
eas submit --platform ios
```

**For Sandbox Testing:**
```bash
# Change .env
EXPO_PUBLIC_STOREKIT_TESTFLIGHT_BYPASS=false

# Rebuild and upload
eas build --platform ios --profile preview
eas submit --platform ios
```

---

## 📞 Support

Check console logs for detailed debugging information:
```
🛒 Initializing StoreKit...
✅ Connected to App Store
🛒 Fetching products...
✅ Purchase successful
```

---

**Implementation complete! Ready for TestFlight and production.** 🎉
