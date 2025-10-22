import { useState, useEffect } from 'react';
import axios from 'axios';

interface AppVersion {
  latestVersion: string;
  downloadUrl: string;
  forceUpdate: boolean;
}

export const useUpdateChecker = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<AppVersion | null>(null);
  const [loading, setLoading] = useState(false);

  const checkForUpdates = async () => {
    try {
      setLoading(true);
      // Using your deployed API endpoint
      const response = await axios.get<AppVersion>('https://api-loan-muv1.onrender.com/api/app/version', {
        timeout: 10000
      });
      
      const { latestVersion, downloadUrl, forceUpdate } = response.data;
      const currentVersion = '1.0.2'; // Current app version from package.json
      
      // Simple version comparison (assumes semantic versioning)
      const isNewerVersion = compareVersions(latestVersion, currentVersion) > 0;
      
      if (isNewerVersion) {
        setUpdateAvailable(true);
        setUpdateInfo({ latestVersion, downloadUrl, forceUpdate });
      }
    } catch (error) {
      console.log('Update check failed:', error);
      // Silently fail - don't interrupt user experience
    } finally {
      setLoading(false);
    }
  };

  const compareVersions = (version1: string, version2: string): number => {
    const v1parts = version1.split('.').map(Number);
    const v2parts = version2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
      const v1part = v1parts[i] || 0;
      const v2part = v2parts[i] || 0;
      
      if (v1part > v2part) return 1;
      if (v1part < v2part) return -1;
    }
    return 0;
  };

  useEffect(() => {
    // Check for updates on app start
    checkForUpdates();
  }, []);

  return {
    updateAvailable,
    updateInfo,
    loading,
    checkForUpdates
  };
};