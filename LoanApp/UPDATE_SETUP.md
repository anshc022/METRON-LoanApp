# App Updates via GitHub Releases

The app now checks GitHub Releases for updates and shows an in-app banner when a newer version is available with an APK asset.

## How it works

1. On startup, the app calls: `https://api.github.com/repos/<owner>/<repo>/releases/latest`.
2. It reads `tag_name` (e.g., `v1.0.2`) and finds the first APK asset.
3. If `tag_name` (without the `v`) is greater than the app's current `package.json` version, it shows the banner.
4. Tapping Download opens the APK's `browser_download_url`.

## Configure repository

Edit `hooks/useUpdateChecker.ts` and set:

- `GITHUB_OWNER` to your GitHub username or org (current default: `anshc022`).
- `GITHUB_REPO` to the repository where you publish releases (current default: `frt-loan`).

> Tip: If you hit GitHub API rate limits, consider a tiny proxy endpoint that calls GitHub with a token and returns `{ latestVersion, downloadUrl }`.

## Release steps (Android APK)

1. Build a release APK
   - Windows PowerShell:
     - From the project root, run Gradle: `cd android; ./gradlew assembleRelease`
     - APK will be at: `android/app/build/outputs/apk/release/app-release.apk`
2. Create a GitHub Release
   - Tag format: `vX.Y.Z` (the leading `v` is optional, we strip it when comparing)
   - Title can be anything; description optional
   - Upload the APK as a release asset
3. Publish the release (not draft, not prerelease)
4. App will pick it up on next launch and show the update banner

## Optional: Manual check

You can trigger a manual check from a Settings screen:

```ts
import { useUpdateChecker } from '../hooks/useUpdateChecker';

const { checkForUpdates } = useUpdateChecker();
// Call checkForUpdates() on button press
```

## Force updates (optional)

Currently `forceUpdate` is always `false`. If you want mandatory updates, you can encode a flag in the release notes (e.g., include `[force]`) and parse it in `useUpdateChecker.ts`.