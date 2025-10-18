import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  Picker,
} from 'react-native';
import { apiService } from '../services/apiService';

interface CollectionSchedule {
  id: number;
  schedule_date: string;
  due_amount: number;
  collected_amount: number;
  balance_amount: number;
  schedule_status: 'pending' | 'collected' | 'partial' | 'overdue';
  installment_number: number;
  notes?: string;
  payment_method?: string;
  Loan: {
    id: number;
    amount: number;
    total_payable: number;
    remaining_amount: number;
    Shop: {
      id: number;
      name: string;
      owner_name: string;
      phone?: string;
      location?: string;
      shopAddress?: string;
    };
  };
}

interface CollectionData {
  collections: CollectionSchedule[];
  summary: {
    total_collections: number;
    total_due_amount: number;
    total_collected: number;
    pending_collections: number;
    partial_collections: number;
    total_balance: number;
  };
  date: string;
  agent_id: number;
}

const TodayCollections = () => {
  const [collections, setCollections] = useState<CollectionSchedule[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<CollectionSchedule | null>(null);
  const [collectionAmount, setCollectionAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadTodayCollections();
  }, []);

  const loadTodayCollections = async () => {
    try {
      setLoading(true);
      const data: CollectionData = await apiService.getTodayCollections();
      setCollections(data.collections || []);
      setSummary(data.summary || {});
    } catch (error) {
      console.error('Error loading today collections:', error);
      Alert.alert('Error', 'Failed to load today\'s collections');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTodayCollections();
    setRefreshing(false);
  };

  const handleRecordCollection = (schedule: CollectionSchedule) => {
    setSelectedSchedule(schedule);
    setCollectionAmount(schedule.due_amount.toString());
    setPaymentMethod('cash');
    setNotes('');
    setShowRecordModal(true);
  };

  const submitCollection = async () => {
    if (!selectedSchedule || !collectionAmount) {
      Alert.alert('Error', 'Please enter collection amount');
      return;
    }

    const amount = parseFloat(collectionAmount);
    if (amount <= 0 || amount > selectedSchedule.due_amount) {
      Alert.alert('Error', 'Invalid collection amount');
      return;
    }

    try {
      await apiService.recordCollectionSchedule(selectedSchedule.id, {
        amount,
        payment_method: paymentMethod,
        notes,
      });

      Alert.alert('Success', 'Collection recorded successfully');
      setShowRecordModal(false);
      await loadTodayCollections(); // Refresh the list
    } catch (error) {
      console.error('Error recording collection:', error);
      Alert.alert('Error', 'Failed to record collection');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#ff9500';
      case 'collected': return '#34c759';
      case 'partial': return '#007aff';
      case 'overdue': return '#ff3b30';
      default: return '#8e8e93';
    }
  };

  const renderCollectionItem = ({ item }: { item: CollectionSchedule }) => (
    <View style={styles.collectionItem}>
      <View style={styles.itemHeader}>
        <Text style={styles.shopName}>{item.Loan.Shop.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.schedule_status) }]}>
          <Text style={styles.statusText}>{item.schedule_status.toUpperCase()}</Text>
        </View>
      </View>
      
      <Text style={styles.ownerName}>{item.Loan.Shop.owner_name}</Text>
      {item.Loan.Shop.phone && <Text style={styles.phone}>📞 {item.Loan.Shop.phone}</Text>}
      {item.Loan.Shop.location && <Text style={styles.location}>📍 {item.Loan.Shop.location}</Text>}
      
      <View style={styles.amountRow}>
        <Text style={styles.amountLabel}>Due Amount:</Text>
        <Text style={styles.amountValue}>₹{item.due_amount.toFixed(2)}</Text>
      </View>
      
      {item.collected_amount > 0 && (
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Collected:</Text>
          <Text style={[styles.amountValue, { color: '#34c759' }]}>₹{item.collected_amount.toFixed(2)}</Text>
        </View>
      )}
      
      <View style={styles.amountRow}>
        <Text style={styles.amountLabel}>Installment #{item.installment_number}</Text>
        <Text style={styles.loanAmount}>Loan: ₹{item.Loan.amount.toFixed(2)}</Text>
      </View>

      {item.schedule_status === 'pending' || item.schedule_status === 'partial' ? (
        <TouchableOpacity 
          style={styles.recordButton}
          onPress={() => handleRecordCollection(item)}
        >
          <Text style={styles.recordButtonText}>Record Collection</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.completedBadge}>
          <Text style={styles.completedText}>✓ Completed</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Today's Collections Summary</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{summary.total_collections || 0}</Text>
            <Text style={styles.summaryLabel}>Total Collections</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>₹{(summary.total_due_amount || 0).toFixed(0)}</Text>
            <Text style={styles.summaryLabel}>Due Amount</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#34c759' }]}>₹{(summary.total_collected || 0).toFixed(0)}</Text>
            <Text style={styles.summaryLabel}>Collected</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#ff9500' }]}>{summary.pending_collections || 0}</Text>
            <Text style={styles.summaryLabel}>Pending</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={collections}
        renderItem={renderCollectionItem}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No collections for today</Text>
          </View>
        }
      />

      {/* Record Collection Modal */}
      <Modal visible={showRecordModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Record Collection</Text>
            
            {selectedSchedule && (
              <View style={styles.modalShopInfo}>
                <Text style={styles.modalShopName}>{selectedSchedule.Loan.Shop.name}</Text>
                <Text style={styles.modalOwnerName}>{selectedSchedule.Loan.Shop.owner_name}</Text>
                <Text style={styles.modalDueAmount}>Due: ₹{selectedSchedule.due_amount.toFixed(2)}</Text>
              </View>
            )}

            <Text style={styles.inputLabel}>Collection Amount:</Text>
            <TextInput
              style={styles.textInput}
              value={collectionAmount}
              onChangeText={setCollectionAmount}
              keyboardType="numeric"
              placeholder="Enter amount"
            />

            <Text style={styles.inputLabel}>Payment Method:</Text>
            <Picker
              selectedValue={paymentMethod}
              onValueChange={setPaymentMethod}
              style={styles.picker}
            >
              <Picker.Item label="Cash" value="cash" />
              <Picker.Item label="Online" value="online" />
              <Picker.Item label="Cheque" value="cheque" />
              <Picker.Item label="Bank Transfer" value="bank_transfer" />
            </Picker>

            <Text style={styles.inputLabel}>Notes (Optional):</Text>
            <TextInput
              style={[styles.textInput, { height: 80 }]}
              value={notes}
              onChangeText={setNotes}
              multiline
              placeholder="Add notes..."
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowRecordModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.submitButton}
                onPress={submitCollection}
              >
                <Text style={styles.submitButtonText}>Record</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  summaryCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1a1a1a',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007aff',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  listContainer: {
    padding: 16,
  },
  collectionItem: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  shopName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  ownerName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  phone: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  location: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  amountLabel: {
    fontSize: 14,
    color: '#666',
  },
  amountValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  loanAmount: {
    fontSize: 12,
    color: '#666',
  },
  recordButton: {
    backgroundColor: '#007aff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  recordButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  completedBadge: {
    backgroundColor: '#e8f5e8',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  completedText: {
    color: '#34c759',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalShopInfo: {
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  modalShopName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  modalOwnerName: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  modalDueAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007aff',
    marginTop: 4,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1a1a1a',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  picker: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
  },
  cancelButtonText: {
    textAlign: 'center',
    color: '#666',
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#007aff',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
  },
  submitButtonText: {
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
  },
});

export default TodayCollections;