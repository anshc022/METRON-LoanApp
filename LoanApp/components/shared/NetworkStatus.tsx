import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

interface NetworkStatusProps {
  showOnlineMessage?: boolean;
}

const NetworkStatus: React.FC<NetworkStatusProps> = ({ showOnlineMessage = false }) => {
  const { isConnected, connectionType } = useNetworkStatus();
  const [slideAnim] = useState(new Animated.Value(-50));
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    if (isConnected === false) {
      // Show offline message
      setShowStatus(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else if (isConnected === true) {
      if (showOnlineMessage && showStatus) {
        // Show brief online message
        setTimeout(() => {
          Animated.timing(slideAnim, {
            toValue: -50,
            duration: 300,
            useNativeDriver: true,
          }).start(() => setShowStatus(false));
        }, 2000);
      } else {
        // Hide status immediately
        Animated.timing(slideAnim, {
          toValue: -50,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setShowStatus(false));
      }
    }
  }, [isConnected, showOnlineMessage, slideAnim, showStatus]);

  if (isConnected === null || (!showStatus && isConnected === true)) {
    return null;
  }

  const getStatusMessage = () => {
    if (isConnected === false) {
      return 'No Internet Connection';
    } else if (isConnected === true && showOnlineMessage) {
      return `Connected via ${connectionType}`;
    }
    return '';
  };

  const getStatusColor = () => {
    return isConnected ? '#10b981' : '#ef4444';
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: getStatusColor(),
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Text style={styles.text}>{getStatusMessage()}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 8,
    zIndex: 1000,
    alignItems: 'center',
  },
  text: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default NetworkStatus;