import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiService, Loan } from '../../services/apiService';
import LoanDetail from '../shared/LoanDetail';

interface ManageLoansProps {
  onBack: () => void;
}

const ManageLoans: React.FC<ManageLoansProps> = ({ onBack }) => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState<number | null>(null);

  const fetchLoans = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const response = await apiService.getAllLoans();
      setLoans(response);
    } catch (error: any) {
      console.error('Error fetching loans:', error);
      
      let errorMessage = 'Failed to load loans';
      if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to view loans.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const onRefresh = () => {
    fetchLoans(true);
  };

  const handleViewLoan = (loan: Loan) => {
    setSelectedLoanId(loan.id);
  };

  const handleLoanAction = (loan: Loan, action: string) => {
    if (action === 'View') {
      handleViewLoan(loan);
      return;
    }

    Alert.alert(
      `${action} Loan`,
      `${action} loan for ${loan.customer_number || `Loan #${loan.id}`}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: action, onPress: () => console.log(`${action} loan:`, loan.id) },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'completed': return '#059669';
      case 'defaulted': return '#ef4444';
      case 'rescheduled': return '#f59e0b';
      case 'cancelled': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getApprovalStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'rejected': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  };

  if (selectedLoanId) {
    return (
      <LoanDetail
        loanId={selectedLoanId}
        onBack={() => setSelectedLoanId(null)}
      />
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading loans...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Calculate stats
  const activeLoans = loans.filter(l => l.status === 'active').length;
  const completedLoans = loans.filter(l => l.status === 'completed').length;
  const pendingApproval = loans.filter(l => l.approval_status === 'pending').length;
  const totalAmount = loans.reduce((sum, l) => sum + l.total_payable, 0);

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
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color="#1f2937" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Manage Loans</Text>
            <Text style={styles.headerSubtitle}>{loans.length} Total Loans</Text>
          </View>
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="add" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Stats Cards - AdminDashboard Style */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <TouchableOpacity style={[styles.statCard, styles.statCard1]}>
              <View style={styles.statIconContainer}>
                <Ionicons name="checkmark-circle" size={24} color="#10b981" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{activeLoans}</Text>
                <Text style={styles.statLabel}>Active Loans</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.statCard, styles.statCard2]}>
              <View style={styles.statIconContainer}>
                <Ionicons name="time" size={24} color="#f59e0b" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{pendingApproval}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.statsRow}>
            <TouchableOpacity style={[styles.statCard, styles.statCard3]}>
              <View style={styles.statIconContainer}>
                <Ionicons name="checkmark-done" size={24} color="#059669" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{completedLoans}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.statCard, styles.statCard4]}>
              <View style={styles.statIconContainer}>
                <Ionicons name="cash" size={24} color="#3b82f6" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValueAmount}>{formatCurrency(totalAmount)}</Text>
                <Text style={styles.statLabel}>Total Value</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Loans List */}
        <View style={styles.listContainer}>
          <Text style={styles.sectionTitle}>All Loans</Text>
          {loans.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-outline" size={64} color="#d1d5db" />
              <Text style={styles.emptyText}>No loans available</Text>
            </View>
          ) : (
            loans.map((loan) => (
              <TouchableOpacity 
                key={loan.id} 
                style={styles.loanCard}
                onPress={() => handleViewLoan(loan)}
              >
                <View style={styles.loanInfo}>
                  <View style={styles.loanHeader}>
                    <View style={styles.loanTitleContainer}>
                      <Text style={styles.loanTitle}>
                        {loan.customer_number || `Loan #${loan.id}`}
                      </Text>
                      <Text style={styles.loanAmount}>{formatCurrency(loan.total_payable)}</Text>
                    </View>
                    <View style={styles.statusContainer}>
                      <View style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(loan.status) }
                      ]}>
                        <Text style={styles.statusText}>{loan.status.toUpperCase()}</Text>
                      </View>
                      {loan.approval_status && (
                        <View style={[
                          styles.approvalBadge,
                          { backgroundColor: getApprovalStatusColor(loan.approval_status) }
                        ]}>
                          <Text style={styles.statusText}>{loan.approval_status.toUpperCase()}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  
                  <View style={styles.loanDetails}>
                    <View style={styles.detailRow}>
                      <Ionicons name="storefront" size={16} color="#6b7280" />
                      <Text style={styles.detailText}>
                        {loan.shop_name || loan.Shop?.name || 'N/A'}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="person" size={16} color="#6b7280" />
                      <Text style={styles.detailText}>
                        {loan.owner_name || loan.Shop?.owner_name || 'N/A'}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="calendar" size={16} color="#6b7280" />
                      <Text style={styles.detailText}>
                        {formatCurrency(loan.rounded_per_day_amount || loan.per_day_amount)}/day
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="time" size={16} color="#6b7280" />
                      <Text style={styles.detailText}>
                        {loan.total_installments} installments
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.loanDate}>
                    Applied: {new Date(loan.loan_date).toLocaleDateString('en-IN')}
                  </Text>
                </View>
                
                <View style={styles.actionButtons}>
                  {loan.approval_status === 'pending' && (
                    <>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.approveButton]}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleLoanAction(loan, 'Approve');
                        }}
                      >
                        <Ionicons name="checkmark" size={16} color="#10b981" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.rejectButton]}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleLoanAction(loan, 'Reject');
                        }}
                      >
                        <Ionicons name="close" size={16} color="#ef4444" />
                      </TouchableOpacity>
                    </>
                  )}
                  <TouchableOpacity
                    style={[styles.actionButton, styles.viewButton]}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleViewLoan(loan);
                    }}
                  >
                    <Ionicons name="eye" size={16} color="#3b82f6" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleLoanAction(loan, 'Edit');
                    }}
                  >
                    <Ionicons name="pencil" size={16} color="#f59e0b" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          )}
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
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
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
    backgroundColor: '#dc2626',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#dc2626',
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
    gap: 8,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    lineHeight: 32,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
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
  loanCard: {
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
  loanInfo: {
    flex: 1,
  },
  loanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  loanAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
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
  shopName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  ownerName: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  loanDetails: {
    marginBottom: 8,
  },
  detailText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  loanDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  actionButtons: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 12,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    marginBottom: 4,
    minWidth: 32,
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: '#ecfdf5',
  },
  rejectButton: {
    backgroundColor: '#fef2f2',
  },
  viewButton: {
    backgroundColor: '#eff6ff',
  },
  editButton: {
    backgroundColor: '#fffbeb',
  },
  // Additional styles for AdminDashboard-style layout
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard1: {
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  statCard2: {
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  statCard3: {
    borderLeftWidth: 4,
    borderLeftColor: '#059669',
  },
  statCard4: {
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  statIconContainer: {
    marginRight: 16,
  },
  statContent: {
    flex: 1,
  },
  statValueAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 12,
  },
  loanTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  loanTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  approvalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
});

export default ManageLoans;