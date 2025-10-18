# iOS Testing Setup Guide

## Quick Start for iOS Testing

### 1. Start Local Backend Server
First, make sure your local server is running:
```bash
cd F:\vercal\loan\backend\api-loan
npm start
```
Server should be accessible at: http://0.0.0.0:5000

### 2. Start Expo with Tunnel (for iOS QR testing)
```bash
cd F:\vercal\loan\LoanApp
npm run start:tunnel
```

**OR for LAN-only testing:**
```bash
npm run start:lan
```

### 3. iOS Testing Options

#### Option A: Expo Go App (Recommended)
1. Install **Expo Go** from the App Store on your iOS device
2. Make sure your phone and computer are on the same WiFi network
3. Run `npm run start:tunnel` 
4. Scan the QR code with your iPhone camera or Expo Go app
5. The app will load in Expo Go

#### Option B: Physical Device via USB
1. Connect iPhone via USB
2. Run `npm run ios` (requires Xcode installed)

### 4. Troubleshooting iOS QR Issues

#### If QR code scanning doesn't work:
1. **Try tunnel mode:** `npm run start:tunnel`
2. **Check network:** Make sure both devices are on same WiFi
3. **Manual entry:** In Expo Go, manually enter the tunnel URL shown in terminal
4. **Clear Expo cache:** `expo r -c` to clear cache and restart

#### Common iOS Issues:
- **Network timeouts:** The app is now configured for local server at http://0.0.0.0:5000
- **QR code not scanning:** Use tunnel mode or manually type the exp:// URL
- **App crashes:** Check Metro bundler logs for JavaScript errors

### 5. API Configuration
The app is now configured to use your local server:
- **API Base URL:** `http://0.0.0.0:5000`
- **Auth Service:** `http://0.0.0.0:5000`
- **Timeout:** 10-12 seconds

### 6. Switch Back to Production
When ready for production, change the API URLs back in:
- `services/apiService.ts`
- `services/authService.ts`

Change from: `http://0.0.0.0:5000`
Back to: `https://api-loan-muv1.onrender.com`