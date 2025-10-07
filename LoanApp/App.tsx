import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LoginScreen from './components/LoginScreen';
import AgentDashboard from './components/AgentDashboard';
import AdminDashboard from './components/AdminDashboard';
import { authService } from './services/authService';
import { ToastProvider } from './components/shared/Toast';

type AppState = 'loading' | 'login' | 'agent' | 'admin';

export default function App() {
  const [appState, setAppState] = useState<AppState>('loading');

  useEffect(() => {
    checkAuthStatus();
  }, []);

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
      setAppState('login');
    }
  };

  const handleLoginSuccess = (userRole: 'admin' | 'agent') => {
    setAppState(userRole);
  };

  const handleLogout = () => {
    setAppState('login');
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
    <SafeAreaProvider>
      <ToastProvider>
        <View style={styles.container}>
          {renderContent()}
          <StatusBar style="auto" />
        </View>
      </ToastProvider>
    </SafeAreaProvider>
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
