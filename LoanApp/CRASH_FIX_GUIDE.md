# App Crash Fix Guide

## ✅ Changes Made to Fix Crashes:

### 1. Disabled New Architecture
- Changed `newArchEnabled: false` in app.json
- Changed `edgeToEdgeEnabled: false` for better compatibility

### 2. Added Error Boundary
- Created `ErrorBoundary.tsx` to catch crashes
- Wrapped entire app in error boundary
- Shows friendly error messages instead of crashing

### 3. Enhanced Network Security
- Added network security config for Android
- Added proper timeout handling (30 seconds)
- Better error messages for network issues

### 4. Improved Permissions
- Added necessary Android permissions:
  - INTERNET
  - CAMERA  
  - READ_EXTERNAL_STORAGE
  - WRITE_EXTERNAL_STORAGE

### 5. Better Error Handling
- Enhanced login error handling
- Removed startup alerts that could cause crashes
- Added proper timeout and network error handling

## 🔧 To Build Fixed Version:

```bash
# Increment version to force new build
npx eas build --platform android --profile preview --clear-cache
```

## 🐛 If App Still Crashes:

### Check Logs:
```bash
# View device logs
adb logcat | grep -i "metron\|crash\|error"
```

### Common Crash Causes:
1. **Network Issues**: Can't connect to API server
2. **Storage Issues**: AsyncStorage permissions
3. **Safe Area**: Multiple providers conflict
4. **Memory**: Large images or data

### Quick Test:
1. Install new APK
2. Turn on airplane mode
3. Open app - should show error instead of crash
4. Turn off airplane mode - should work normally

## 🚀 Alternative: Expo Go Testing
If crashes persist, test with Expo Go for debugging:
```bash
npx expo start
```

The fixed version should be much more stable!