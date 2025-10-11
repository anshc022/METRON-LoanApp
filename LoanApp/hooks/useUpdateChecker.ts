import { useState, useEffect } from 'react';
import axios from 'axios';

interface AppVersion {
  latestVersion: string;
  downloadUrl: string;
  forceUpdate: boolean;
}

// GitHub Releases configuration
// Change these to the repo where you publish APK releases
const GITHUB_OWNER = 'anshc022';
const GITHUB_REPO = 'METRON-LoanApp';
// If you hit rate limits in production, consider hosting a lightweight proxy endpoint
// that calls GitHub with a token and returns just the needed fields.

// Types for a subset of the GitHub Releases API
type GithubReleaseAsset = {
  name: string;
  content_type: string;
  browser_download_url: string;
};

type GithubRelease = {
  tag_name: string; // e.g., "v1.0.2"
  name?: string;    // optional human name
  draft: boolean;
  prerelease: boolean;
  assets: GithubReleaseAsset[];
};

const stripPrefixV = (v: string) => v.replace(/^v/i, '');

const compareVersions = (version1: string, version2: string): number => {
  const v1parts = stripPrefixV(version1).split('.').map((n) => Number(n));
  const v2parts = stripPrefixV(version2).split('.').map((n) => Number(n));

  for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
    const v1part = v1parts[i] || 0;
    const v2part = v2parts[i] || 0;
    if (v1part > v2part) return 1;
    if (v1part < v2part) return -1;
  }
  return 0;
};

const findApkAsset = (assets: GithubReleaseAsset[]): GithubReleaseAsset | undefined => {
  // Prefer explicit Android content type, but also accept .apk filename
  return (
    assets.find((a) => a.content_type === 'application/vnd.android.package-archive') ||
    assets.find((a) => a.name.toLowerCase().endsWith('.apk'))
  );
};

export const useUpdateChecker = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<AppVersion | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchLatestFromGitHub = async (): Promise<AppVersion | null> => {
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;
    const resp = await axios.get<GithubRelease>(url, { timeout: 10000 });
    const release = resp.data;

    if (release.draft) return null; // ignore drafts

    const version = stripPrefixV(release.tag_name || release.name || '');
    if (!version) return null;

    const apk = findApkAsset(release.assets || []);
    if (!apk) return null; // no android asset uploaded

    return {
      latestVersion: version,
      downloadUrl: apk.browser_download_url,
      forceUpdate: false, // Optional: encode force flag in release notes and parse here
    };
  };

  const checkForUpdates = async () => {
    try {
      setLoading(true);
      const gh = await fetchLatestFromGitHub();
      if (!gh) return;

      const currentVersion: string = require('../../package.json').version;
      const isNewerVersion = compareVersions(gh.latestVersion, currentVersion) > 0;
      if (isNewerVersion) {
        setUpdateAvailable(true);
        setUpdateInfo(gh);
      }
    } catch (error) {
      console.log('Update check failed:', error);
      // Silently fail - don't interrupt user experience
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check for updates on app start
    checkForUpdates();
  }, []);

  return {
    updateAvailable,
    updateInfo,
    loading,
    checkForUpdates,
  };
};