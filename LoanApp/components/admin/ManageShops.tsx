import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiService, Shop } from '../../services/apiService';
import ShopDetail from '../shared/ShopDetail';

interface ManageShopsProps {
  onBack: () => void;
}

const ManageShops: React.FC<ManageShopsProps> = ({ onBack }) => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedShopId, setSelectedShopId] = useState<number | null>(null);

  const fetchShops = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const response = await apiService.getAllShops();
      setShops(response);
    } catch (error) {
      console.error('Error fetching shops:', error);
      Alert.alert('Error', 'Failed to load shops');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchShops();
  }, []);

  const onRefresh = () => {
    fetchShops(true);
  };

  // Handle navigation to shop detail
  if (selectedShopId) {
    return (
      <ShopDetail 
        shopId={selectedShopId} 
        onBack={() => setSelectedShopId(null)}
      />
    );
  }

  const handleShopAction = (shop: Shop, action: string) => {
    Alert.alert(
      `${action} Shop`,
      `${action} ${shop.shopName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: action, onPress: () => console.log(`${action} shop:`, shop.id) },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text>Loading shops...</Text>
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
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color="#1f2937" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Manage Shops</Text>
            <Text style={styles.headerSubtitle}>{shops.length} Total Shops</Text>
          </View>
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="add" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsGrid}>
            <TouchableOpacity style={styles.statCard} activeOpacity={0.7}>
              <View style={styles.statHeader}>
                <View style={[styles.statIcon, { backgroundColor: '#ecfdf515' }]}>
                  <Ionicons name="storefront" size={18} color="#059669" />
                </View>
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{shops.length}</Text>
                <Text style={styles.statTitle}>Total Shops</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.statCard} activeOpacity={0.7}>
              <View style={styles.statHeader}>
                <View style={[styles.statIcon, { backgroundColor: '#10b98115' }]}>
                  <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                </View>
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{shops.filter(s => s.status === 'active' || !s.status).length}</Text>
                <Text style={styles.statTitle}>Active Shops</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.statCard} activeOpacity={0.7}>
              <View style={styles.statHeader}>
                <View style={[styles.statIcon, { backgroundColor: '#3b82f615' }]}>
                  <Ionicons name="person-add" size={18} color="#3b82f6" />
                </View>
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{shops.filter(s => s.agent_id || s.agentId).length}</Text>
                <Text style={styles.statTitle}>Assigned</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.statCard} activeOpacity={0.7}>
              <View style={styles.statHeader}>
                <View style={[styles.statIcon, { backgroundColor: '#f59e0b15' }]}>
                  <Ionicons name="alert-circle" size={18} color="#f59e0b" />
                </View>
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{shops.filter(s => !s.agent_id && !s.agentId).length}</Text>
                <Text style={styles.statTitle}>Unassigned</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Shops List */}
        <View style={styles.listContainer}>
          <Text style={styles.sectionTitle}>All Shops</Text>
          {shops.map((shop) => (
            <TouchableOpacity 
              key={shop.id} 
              style={styles.shopCard}
              onPress={() => setSelectedShopId(shop.id)}
              activeOpacity={0.7}
            >
              <View style={styles.shopInfo}>
                <View style={styles.shopHeader}>
                  <Text style={styles.shopName}>{shop.name || shop.shopName}</Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: shop.status === 'active' ? '#10b981' : '#ef4444' }
                  ]}>
                    <Text style={styles.statusText}>{shop.status || 'active'}</Text>
                  </View>
                </View>
                <Text style={styles.ownerName}>Owner: {shop.owner_name || shop.ownerName}</Text>
                <Text style={styles.shopAddress}>📍 {shop.location || shop.address}</Text>
                <Text style={styles.shopPhone}>📞 {shop.mobileNumber || shop.phoneNumber}</Text>
                <Text style={styles.shopDate}>Registered: {shop.created_at ? new Date(shop.created_at).toLocaleDateString() : 'N/A'}</Text>
                {(shop.agent_id || shop.agentId) && (
                  <Text style={styles.agentInfo}>👤 Agent ID: {shop.agent_id || shop.agentId}</Text>
                )}
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleShopAction(shop, 'Edit');
                  }}
                >
                  <Ionicons name="pencil" size={16} color="#3b82f6" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.assignButton]}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleShopAction(shop, 'Assign');
                  }}
                >
                  <Ionicons name="person-add" size={16} color="#059669" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleShopAction(shop, 'Delete');
                  }}
                >
                  <Ionicons name="trash" size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
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
    alignItems: 'center',
    paddingVertical: 20,
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerContent: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  addButton: {
    backgroundColor: '#059669',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  statsContainer: {
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
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
  statLabel: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  listContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  shopCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  shopInfo: {
    flex: 1,
  },
  shopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  ownerName: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  shopAddress: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  shopPhone: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  shopDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  agentInfo: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'column',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
  },
  editButton: {
    backgroundColor: '#eff6ff',
  },
  assignButton: {
    backgroundColor: '#ecfdf5',
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
  },
});

export default ManageShops;