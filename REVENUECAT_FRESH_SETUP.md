# RevenueCat Fresh Setup Guide

RevenueCat has been completely removed from the app. Follow these steps for a clean installation with a new project.

## What Was Removed

✅ `react-native-purchases` package uninstalled
✅ `providers/RevenueCatProvider.tsx` deleted
✅ `hooks/useSubscription.ts` deleted
✅ `components/Paywall.tsx` deleted
✅ RevenueCat removed from `providers/index.tsx`
✅ Environment variables removed from `eas.json`

## Fresh Setup Steps

### 1. Create New RevenueCat Project

1. Go to https://app.revenuecat.com
2. **Create a new project** (don't reuse the old one)
3. Give it a clear name (e.g., "Zelani Production")

### 2. Configure App in RevenueCat

1. In your new project, go to **Project Settings → Apps**
2. Click **+ New**
3. Select **Google Play Store**
4. Enter bundle ID: `com.abeldesu.zelani`
5. **Skip Service Account** for now (only needed for production with real Google Play)
6. Save

### 3. Create Products

1. Go to **Products** tab
2. Create two products:
   - **Product ID:** `monthly` (or `zelani_monthly`)
   - **Product ID:** `yearly` (or `zelani_yearly`)

### 4. Create Offering with BOTH Packages

1. Go to **Offerings** tab
2. You should see a "default" offering already created
3. Click on "default" offering
4. Add **TWO packages**:
   - Package identifier: `$rc_monthly` → attach `monthly` product
   - Package identifier: `$rc_annual` → attach `yearly` product
5. Save

### 5. Create Entitlement

1. Go to **Entitlements** tab
2. Create entitlement with ID: `zelani Pro` (exact name, case-sensitive)
3. Attach both products (`monthly` and `yearly`) to this entitlement

### 6. Get API Keys

1. Go to **Project Settings → API Keys**
2. Copy the **Public SDK Key** (starts with `test_` for sandbox or `goog_` for production)
3. You'll add this to your `.env` file

### 7. Install RevenueCat SDK

Run:
```bash
npm install react-native-purchases --legacy-peer-deps
```

### 8. Add Environment Variables

In your `.env` file, add:
```
EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=<your_public_sdk_key>
EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=<your_public_sdk_key>
```

### 9. Update EAS Secrets

Run:
```bash
npx eas secret:push --scope project --env-file .env
```

### 10. Restore Code Files

I'll help you recreate the three files:
- `providers/RevenueCatProvider.tsx`
- `hooks/useSubscription.ts`
- `components/Paywall.tsx`

And update `providers/index.tsx` to include RevenueCat again.

### 11. Rebuild Development Build

```bash
npx eas build --profile development --platform android
```

## Important Notes

- **Use the test key** (`test_...`) for development - it works with RevenueCat Billing (simulated store)
- **Use the production key** (`goog_...`) only when deploying to Google Play with real products
- Make sure **both** `$rc_monthly` and `$rc_annual` packages exist in your offering
- The entitlement ID must be exactly `zelani Pro` (case-sensitive)

## Next Steps

Once you've completed steps 1-6 above, let me know and I'll help you:
1. Recreate the provider, hook, and paywall components
2. Test the integration
3. Verify both monthly and yearly products appear
