import React from 'react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import OfflineScreen from './OfflineScreen';

interface WithNetworkCheckProps {
  children: React.ReactNode;
  showOfflineScreen?: boolean;
  onRetry?: () => void;
}

const WithNetworkCheck: React.FC<WithNetworkCheckProps> = ({ 
  children, 
  showOfflineScreen = false,
  onRetry = () => {} 
}) => {
  const { isOffline } = useNetworkStatus();

  if (isOffline && showOfflineScreen) {
    return <OfflineScreen onRetry={onRetry} />;
  }

  return <>{children}</>;
};

export default WithNetworkCheck;