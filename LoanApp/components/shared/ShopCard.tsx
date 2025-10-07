import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Shop } from '../../services/apiService';

interface ShopCardProps {
  shop: Shop;
  onPress: () => void;
  onActionPress?: (action: string) => void;
  showActions?: boolean;
  isAdmin?: boolean;
}

const ShopCard: React.FC<ShopCardProps> = ({ 
  shop, 
  onPress, 
  onActionPress, 
  showActions = true,
  isAdmin = false 
}) => {
  // Normalize shop data for backwards compatibility
  const shopName = shop.name || shop.shopName || 'Unnamed Shop';
  const ownerName = shop.owner_name || shop.ownerName || 'Unknown Owner';
  const location = shop.location || shop.address || 'No address';
  const phoneNumber = shop.mobileNumber || shop.phoneNumber || 'No phone';
  const status = shop.status || 'active';
  const agentId = shop.agent_id || shop.agentId;

  const renderActionButtons = () => {
    if (!showActions || !onActionPress) return null;

    if (isAdmin) {
      return (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={(e) => {
              e.stopPropagation();
              onActionPress('Edit');
            }}
          >
            <Ionicons name="pencil" size={16} color="#3b82f6" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.assignButton]}
            onPress={(e) => {
              e.stopPropagation();
              onActionPress('Assign');
            }}
          >
            <Ionicons name="person-add" size={16} color="#059669" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={(e) => {
              e.stopPropagation();
              onActionPress('Delete');
            }}
          >
            <Ionicons name="trash" size={16} color="#ef4444" />
          </TouchableOpacity>
        </View>
      );
    } else {
      return (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.visitButton]}
            onPress={(e) => {
              e.stopPropagation();
              onActionPress('Visit');
            }}
          >
            <Ionicons name="location" size={16} color="#3b82f6" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.callButton]}
            onPress={(e) => {
              e.stopPropagation();
              onActionPress('Call');
            }}
          >
            <Ionicons name="call" size={16} color="#059669" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.loanButton]}
            onPress={(e) => {
              e.stopPropagation();
              onActionPress('Create Loan');
            }}
          >
            <Ionicons name="cash" size={16} color="#dc2626" />
          </TouchableOpacity>
        </View>
      );
    }
  };

  return (
    <TouchableOpacity 
      style={styles.shopCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.shopInfo}>
        <View style={styles.shopHeader}>
          <Text style={styles.shopName}>{shopName}</Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: status === 'active' ? '#10b981' : '#ef4444' }
          ]}>
            <Text style={styles.statusText}>{status}</Text>
          </View>
        </View>
        <Text style={styles.ownerName}>Owner: {ownerName}</Text>
        <Text style={styles.shopAddress}>📍 {location}</Text>
        <Text style={styles.shopPhone}>📞 {phoneNumber}</Text>
        <Text style={styles.shopDate}>
          {isAdmin ? 'Registered' : 'Assigned'}: {shop.created_at ? new Date(shop.created_at).toLocaleDateString() : 'N/A'}
        </Text>
        {isAdmin && agentId && (
          <Text style={styles.agentInfo}>👤 Agent ID: {agentId}</Text>
        )}
        {shop.customer_serial_number && (
          <Text style={styles.customerNumber}>Customer #: {shop.customer_serial_number}</Text>
        )}
      </View>
      {renderActionButtons()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  shopCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  shopInfo: {
    flex: 1,
    marginRight: 12,
  },
  shopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  shopName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  ownerName: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 4,
  },
  shopAddress: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  shopPhone: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  shopDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 2,
  },
  agentInfo: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
  },
  customerNumber: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  visitButton: {
    backgroundColor: '#eff6ff',
  },
  callButton: {
    backgroundColor: '#ecfdf5',
  },
  loanButton: {
    backgroundColor: '#fef2f2',
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

export default ShopCard;