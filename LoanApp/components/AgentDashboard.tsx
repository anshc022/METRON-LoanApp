import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiService, AgentStats } from '../services/apiService';
import { authService } from '../services/authService';
import MyShops from './agent/MyShops';
import MyLoans from './agent/MyLoans';
import Settings from './shared/Settings';
import ApiDebugger from './shared/ApiDebugger';

interface AgentDashboardProps {
  onLogout: () => void;
}

type AgentPage = 'dashboard' | 'shops' | 'loans' | 'settings' | 'debug';

const AgentDashboard: React.FC<AgentDashboardProps> = ({ onLogout }) => {
  const [currentPage, setCurrentPage] = useState<AgentPage>('dashboard');
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const user = authService.getUser();

  const fetchStats = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const response = await apiService.getAgentStats();
      setStats(response);
    } catch (error: any) {
      console.error('Error fetching agent stats:', error);
      if (error.response?.status === 401) {
        Alert.alert('Session Expired', 'Please login again', [
          { text: 'OK', onPress: onLogout }
        ]);
      } else {
        Alert.alert('Error', 'Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Small delay to ensure authentication is fully set up
    const timer = setTimeout(() => {
      fetchStats();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const onRefresh = () => {
    fetchStats(true);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await authService.logout();
            onLogout();
          },
        },
      ]
    );
  };

  const statCards = [
    {
      title: 'Total Shops',
      value: stats?.totalShops || 0,
      icon: 'storefront' as const,
      color: '#3b82f6',
      bgColor: '#eff6ff',
    },
    {
      title: 'Total Loans',
      value: stats?.totalLoans || 0,
      icon: 'cash' as const,
      color: '#059669',
      bgColor: '#ecfdf5',
    },
    {
      title: 'Active Loans',
      value: stats?.activeLoans || 0,
      icon: 'trending-up' as const,
      color: '#dc2626',
      bgColor: '#fef2f2',
    },
    {
      title: 'Total Collected',
      value: `₹${(stats?.totalCollected || 0).toLocaleString()}`,
      icon: 'checkmark-circle' as const,
      color: '#7c3aed',
      bgColor: '#f3e8ff',
    },
  ];

  // Handle different page navigation
  const handleBackToDashboard = () => {
    setCurrentPage('dashboard');
  };

  // Render different pages based on current page
  if (currentPage === 'shops') {
    return <MyShops onBack={handleBackToDashboard} />;
  }
  
  if (currentPage === 'loans') {
    return <MyLoans onBack={handleBackToDashboard} />;
  }
  
  if (currentPage === 'settings') {
    return <Settings onBack={handleBackToDashboard} onLogout={onLogout} />;
  }

  if (currentPage === 'debug') {
    return <ApiDebugger />;
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.name || 'Agent'}</Text>
            <Text style={styles.location}>{user?.location || 'Location not set'}</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={styles.settingsButton} 
              onPress={() => setCurrentPage('debug')}
            >
              <Ionicons name="bug-outline" size={24} color="#f59e0b" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.settingsButton} 
              onPress={() => setCurrentPage('settings')}
            >
              <Ionicons name="settings-outline" size={24} color="#6b7280" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={24} color="#dc2626" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Cards - Minimalistic 2x2 Grid */}
        <View style={styles.statsContainer}>
          <View style={styles.statsGrid}>
            {statCards.map((card, index) => (
              <TouchableOpacity 
                key={index} 
                style={[styles.statCard, { borderLeftWidth: 3, borderLeftColor: card.color }]}
                activeOpacity={0.7}
              >
                <View style={styles.statHeader}>
                  <View style={[styles.statIcon, { backgroundColor: `${card.color}15` }]}>
                    <Ionicons name={card.icon} size={18} color={card.color} />
                  </View>
                </View>
                <View style={styles.statContent}>
                  <Text style={styles.statValue}>{card.value}</Text>
                  <Text style={styles.statTitle}>{card.title}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionCards}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => setCurrentPage('shops')}
            >
              <Ionicons name="storefront-outline" size={32} color="#3b82f6" />
              <Text style={styles.actionTitle}>View Shops</Text>
              <Text style={styles.actionSubtitle}>Manage your assigned shops</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => setCurrentPage('loans')}
            >
              <Ionicons name="cash-outline" size={32} color="#059669" />
              <Text style={styles.actionTitle}>View Loans</Text>
              <Text style={styles.actionSubtitle}>Track loan applications</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.activityContainer}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityList}>
            <Text style={styles.noActivity}>No recent activity to display</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 20,
  },
  greeting: {
    fontSize: 16,
    color: '#6b7280',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 4,
  },
  location: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 2,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  logoutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
  },
  statsContainer: {
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    minHeight: 120,
    transform: [{ scale: 1 }],
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statIndicator: {
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statContent: {
    alignItems: 'flex-start',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 2,
    letterSpacing: -0.5,
  },
  statTitle: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: 10,
    color: '#9ca3af',
    fontWeight: '400',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  actionCards: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 12,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  activityContainer: {
    marginBottom: 24,
  },
  activityList: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  noActivity: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

export default AgentDashboard;