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
import { apiService, AdminStats } from '../services/apiService';
import { authService } from '../services/authService';
import ManageAgents from './admin/ManageAgents';
import ManageShops from './admin/ManageShops';
import ManageLoans from './admin/ManageLoans';
import Settings from './shared/Settings';

interface AdminDashboardProps {
  onLogout: () => void;
}

type AdminPage = 'dashboard' | 'agents' | 'shops' | 'loans' | 'settings';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [currentPage, setCurrentPage] = useState<AdminPage>('dashboard');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const user = authService.getUser();

  const fetchStats = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const response = await apiService.getAdminStats();
      setStats(response);
    } catch (error: any) {
      console.error('Error fetching admin stats:', error);
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
      title: 'Total Agents',
      value: stats?.totalAgents || 0,
      icon: 'people' as const,
      color: '#3b82f6',
      bgColor: '#eff6ff',
    },
    {
      title: 'Total Shops',
      value: stats?.totalShops || 0,
      icon: 'storefront' as const,
      color: '#059669',
      bgColor: '#ecfdf5',
    },
    {
      title: 'Total Loans',
      value: stats?.totalLoans || 0,
      icon: 'cash' as const,
      color: '#dc2626',
      bgColor: '#fef2f2',
    },
    {
      title: 'Active Loans',
      value: stats?.totalActiveLoans || 0,
      icon: 'trending-up' as const,
      color: '#7c3aed',
      bgColor: '#f3e8ff',
    },
  ];

  // Handle different page navigation
  const handleBackToDashboard = () => {
    setCurrentPage('dashboard');
  };

  // Render different pages based on current page
  if (currentPage === 'agents') {
    return <ManageAgents onBack={handleBackToDashboard} />;
  }
  
  if (currentPage === 'shops') {
    return <ManageShops onBack={handleBackToDashboard} />;
  }
  
  if (currentPage === 'loans') {
    return <ManageLoans onBack={handleBackToDashboard} />;
  }
  
  if (currentPage === 'settings') {
    return <Settings onBack={handleBackToDashboard} onLogout={onLogout} />;
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text>Loading admin dashboard...</Text>
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
            <Text style={styles.greeting}>Admin Dashboard</Text>
            <Text style={styles.userName}>{user?.name || 'Administrator'}</Text>
            <Text style={styles.subtitle}>System Overview & Management</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#dc2626" />
          </TouchableOpacity>
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

        {/* Management Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Management</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => setCurrentPage('agents')}
            >
              <Ionicons name="people-outline" size={32} color="#3b82f6" />
              <Text style={styles.actionTitle}>Manage Agents</Text>
              <Text style={styles.actionSubtitle}>View and manage all agents</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => setCurrentPage('shops')}
            >
              <Ionicons name="storefront-outline" size={32} color="#059669" />
              <Text style={styles.actionTitle}>Manage Shops</Text>
              <Text style={styles.actionSubtitle}>Oversee all registered shops</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => setCurrentPage('loans')}
            >
              <Ionicons name="cash-outline" size={32} color="#dc2626" />
              <Text style={styles.actionTitle}>Manage Loans</Text>
              <Text style={styles.actionSubtitle}>Review and approve loans</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => setCurrentPage('settings')}
            >
              <Ionicons name="settings-outline" size={32} color="#7c3aed" />
              <Text style={styles.actionTitle}>System Settings</Text>
              <Text style={styles.actionSubtitle}>Configure system parameters</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* System Status */}
        <View style={styles.statusContainer}>
          <Text style={styles.sectionTitle}>System Status</Text>
          <View style={styles.statusCard}>
            <View style={styles.statusItem}>
              <Ionicons name="checkmark-circle" size={20} color="#059669" />
              <Text style={styles.statusText}>API Server: Online</Text>
            </View>
            <View style={styles.statusItem}>
              <Ionicons name="checkmark-circle" size={20} color="#059669" />
              <Text style={styles.statusText}>Database: Connected</Text>
            </View>
            <View style={styles.statusItem}>
              <Ionicons name="checkmark-circle" size={20} color="#059669" />
              <Text style={styles.statusText}>Authentication: Active</Text>
            </View>
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
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 2,
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
    fontSize: 28,
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
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 8,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  statusContainer: {
    marginBottom: 24,
  },
  statusCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusText: {
    fontSize: 14,
    color: '#1f2937',
    marginLeft: 8,
  },
});

export default AdminDashboard;