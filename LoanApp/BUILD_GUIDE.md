# METRON Loan Management - APK Build Guide

## Backend URL Updated
✅ Updated API endpoints to production server: `https://api-loan-muv1.onrender.com`

## Files Updated:
- `services/apiService.ts` - Main API service
- `services/authService.ts` - Authentication service  
- `components/shared/ShopDetail.tsx` - Document viewer
- `app.json` - App configuration
- `eas.json` - Build configuration

## APK Build Steps:

### 1. Install Dependencies (Already Done)
```bash
npm install -g @expo/cli eas-cli
```

### 2. Login to Expo (Required)
```bash
cd F:\vercal\loan\LoanApp
npx expo login
```

### 3. Configure EAS Build
```bash
npx eas build:configure
```

### 4. Build APK for Testing
```bash
npx eas build --platform android --profile preview
```

### 5. Build Production APK
```bash
npx eas build --platform android --profile production
```

## Build Profiles in eas.json:
- **preview**: Creates APK for testing/distribution
- **production**: Creates production-ready APK
- **development**: For development builds

## App Details:
- **App Name**: METRON Loan Management
- **Package ID**: com.metron.loanmanagement
- **Version**: 1.0.0
- **Build Type**: APK (not AAB)

## Next Steps:
1. Run `npx expo login` to authenticate
2. Choose build profile (preview recommended for testing)
3. Wait for build to complete (usually 10-15 minutes)
4. Download APK from Expo dashboard or CLI link

## Notes:
- First build may take longer as it sets up the environment
- APK will be available in Expo dashboard: https://expo.dev/
- You can install the APK directly on Android devices
- No Google Play Store account needed for APK distribution