import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet, Alert, AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LoginScreen from './components/LoginScreen';
import AgentDashboard from './components/AgentDashboard';
import AdminDashboard from './components/AdminDashboard';
import { authService } from './services/authService';
import { ToastProvider } from './components/shared/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import NetworkStatus from './components/shared/NetworkStatus';
import { UpdateBanner } from './components/shared/UpdateBanner';

type AppComponentState = 'loading' | 'login' | 'agent' | 'admin';

export default function App() {
  const [appState, setAppState] = useState<AppComponentState>('loading');

  useEffect(() => {
    // Add app state change listener
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        // App has come to the foreground
        console.log('App has come to the foreground!');
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Initial auth check with timeout + watchdog to avoid indefinite blank screen
    const start = Date.now();
    const authCheckTimeout = setTimeout(() => {
      checkAuthStatus();
    }, 50);

    const watchdog = setTimeout(() => {
      if (appState === 'loading') {
        console.warn('Startup watchdog triggered, falling back to login.');
        setAppState('login');
      }
    }, 6000);

    return () => {
      subscription?.remove();
      clearTimeout(authCheckTimeout);
      clearTimeout(watchdog);
    };
  }, [appState]);

  const checkAuthStatus = async () => {
    try {
      const isAuthenticated = await authService.loadStoredAuth();
      
      if (isAuthenticated) {
        const userRole = authService.getUserRole();
        if (userRole === 'admin') {
          setAppState('admin');
        } else if (userRole === 'agent') {
          setAppState('agent');
        } else {
          setAppState('login');
        }
      } else {
        setAppState('login');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      // Don't show alert on startup, just go to login
      setAppState('login');
    }
  };

  const handleLoginSuccess = (userRole: 'admin' | 'agent') => {
    try {
      setAppState(userRole);
    } catch (error) {
      console.error('Login success error:', error);
      setAppState('login');
    }
  };

  const handleLogout = () => {
    try {
      setAppState('login');
    } catch (error) {
      console.error('Logout error:', error);
      setAppState('login');
    }
  };

  const renderContent = () => {
    switch (appState) {
      case 'loading':
        return (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        );
      case 'login':
        return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
      case 'agent':
        return <AgentDashboard onLogout={handleLogout} />;
      case 'admin':
        return <AdminDashboard onLogout={handleLogout} />;
      default:
        return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
    }
  };

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ToastProvider>
          <View style={styles.container}>
            <NetworkStatus showOnlineMessage={true} />
            <UpdateBanner />
            {renderContent()}
            <StatusBar style="auto" />
          </View>
        </ToastProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
});
