import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiService, Loan } from '../../services/apiService';

interface LoanDetailProps {
  loanId: number;
  onBack: () => void;
}

const LoanDetail: React.FC<LoanDetailProps> = ({ loanId, onBack }) => {
  const [loan, setLoan] = useState<Loan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLoanDetails();
  }, [loanId]);

  const fetchLoanDetails = async () => {
    try {
      setLoading(true);
      const response = await apiService.getLoanById(loanId);
      setLoan(response);
    } catch (error: any) {
      console.error('Error fetching loan details:', error);
      
      let errorMessage = 'Failed to load loan details';
      if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to view this loan.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Loan not found.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
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

  const handleCall = (phoneNumber: string) => {
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading loan details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!loan) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onBack} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color="#1f2937" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Loan Details</Text>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={64} color="#ef4444" />
            <Text style={styles.errorText}>Loan not found</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Loan Details</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Loan Header Info */}
          <View style={styles.section}>
            <View style={styles.loanHeader}>
              <View style={styles.loanTitleContainer}>
                <Text style={styles.loanTitle}>
                  {loan.customer_number || `Loan #${loan.id}`}
                </Text>
                <View style={styles.statusContainer}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(loan.status) }]}>
                    <Text style={styles.statusText}>{loan.status.toUpperCase()}</Text>
                  </View>
                  {loan.approval_status && (
                    <View style={[styles.statusBadge, { backgroundColor: getApprovalStatusColor(loan.approval_status) }]}>
                      <Text style={styles.statusText}>{loan.approval_status.toUpperCase()}</Text>
                    </View>
                  )}
                </View>
              </View>
              
              <View style={styles.loanAmountContainer}>
                <Text style={styles.loanAmountLabel}>Total Payable</Text>
                <Text style={styles.loanAmount}>{formatCurrency(loan.total_payable)}</Text>
              </View>
            </View>
          </View>

          {/* Shop Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shop Information</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="storefront" size={20} color="#3b82f6" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Shop Name</Text>
                  <Text style={styles.infoValue}>{loan.shop_name || loan.Shop?.name || 'N/A'}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="person" size={20} color="#059669" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Owner Name</Text>
                  <Text style={styles.infoValue}>{loan.owner_name || loan.Shop?.owner_name || 'N/A'}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Loan Amount Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amount Breakdown</Text>
            <View style={styles.amountGrid}>
              <View style={styles.amountCard}>
                <Text style={styles.amountLabel}>Principal Amount</Text>
                <Text style={styles.amountValue}>{formatCurrency(loan.amount)}</Text>
              </View>
              <View style={styles.amountCard}>
                <Text style={styles.amountLabel}>Net Amount</Text>
                <Text style={styles.amountValue}>{formatCurrency(loan.net_amount)}</Text>
              </View>
              <View style={styles.amountCard}>
                <Text style={styles.amountLabel}>Interest Amount</Text>
                <Text style={styles.amountValue}>{formatCurrency(loan.interest_amount)}</Text>
              </View>
              <View style={styles.amountCard}>
                <Text style={styles.amountLabel}>Package Charge</Text>
                <Text style={styles.amountValue}>{formatCurrency(loan.package_charge)}</Text>
              </View>
            </View>
          </View>

          {/* Payment Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Details</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="calendar" size={20} color="#7c3aed" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Per Day Amount</Text>
                  <Text style={styles.infoValue}>{formatCurrency(loan.rounded_per_day_amount || loan.per_day_amount)}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="time" size={20} color="#f59e0b" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Total Installments</Text>
                  <Text style={styles.infoValue}>{loan.total_installments} installments</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={20} color="#06b6d4" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Total Months</Text>
                  <Text style={styles.infoValue}>{loan.total_months} months</Text>
                </View>
              </View>
              {loan.monthly_interest && (
                <View style={styles.infoRow}>
                  <Ionicons name="trending-up" size={20} color="#dc2626" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Monthly Interest</Text>
                    <Text style={styles.infoValue}>
                      {formatCurrency(loan.monthly_interest)}
                      {loan.monthly_interest_percentage && ` (${loan.monthly_interest_percentage}%)`}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Important Dates */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Important Dates</Text>
            <View style={styles.dateGrid}>
              <View style={styles.dateCard}>
                <Text style={styles.dateLabel}>Loan Date</Text>
                <Text style={styles.dateValue}>{formatDate(loan.loan_date)}</Text>
              </View>
              <View style={styles.dateCard}>
                <Text style={styles.dateLabel}>Due Date</Text>
                <Text style={styles.dateValue}>{formatDate(loan.due_date)}</Text>
              </View>
              {loan.policy_start_date && (
                <View style={styles.dateCard}>
                  <Text style={styles.dateLabel}>Policy Start</Text>
                  <Text style={styles.dateValue}>{formatDate(loan.policy_start_date)}</Text>
                </View>
              )}
              {loan.policy_end_date && (
                <View style={styles.dateCard}>
                  <Text style={styles.dateLabel}>Policy End</Text>
                  <Text style={styles.dateValue}>{formatDate(loan.policy_end_date)}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Bank & Disbursement */}
          {(loan.bank_amount > 0 || loan.disbursement_amount > 0) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Bank & Disbursement</Text>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Ionicons name="card" size={20} color="#059669" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Bank Amount</Text>
                    <Text style={styles.infoValue}>{formatCurrency(loan.bank_amount)}</Text>
                  </View>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="cash" size={20} color="#3b82f6" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Disbursement Amount</Text>
                    <Text style={styles.infoValue}>{formatCurrency(loan.disbursement_amount)}</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Approval Information */}
          {loan.approval_status && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Approval Information</Text>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Ionicons 
                    name={loan.approval_status === 'approved' ? 'checkmark-circle' : 
                          loan.approval_status === 'rejected' ? 'close-circle' : 'time'} 
                    size={20} 
                    color={getApprovalStatusColor(loan.approval_status)} 
                  />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Status</Text>
                    <Text style={[styles.infoValue, { color: getApprovalStatusColor(loan.approval_status) }]}>
                      {loan.approval_status.toUpperCase()}
                    </Text>
                  </View>
                </View>
                {loan.approved_at && (
                  <View style={styles.infoRow}>
                    <Ionicons name="time" size={20} color="#6b7280" />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Approved At</Text>
                      <Text style={styles.infoValue}>{formatDate(loan.approved_at)}</Text>
                    </View>
                  </View>
                )}
                {loan.rejection_reason && (
                  <View style={styles.infoRow}>
                    <Ionicons name="alert-circle" size={20} color="#ef4444" />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Rejection Reason</Text>
                      <Text style={[styles.infoValue, { color: '#ef4444' }]}>{loan.rejection_reason}</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Additional Information */}
          {(loan.extra_per_day_amount && loan.extra_per_day_amount > 0) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Additional Charges</Text>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Ionicons name="add-circle" size={20} color="#f59e0b" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Extra Per Day Amount</Text>
                    <Text style={styles.infoValue}>{formatCurrency(loan.extra_per_day_amount)}</Text>
                  </View>
                </View>
                {loan.total_extra_amount && loan.total_extra_amount > 0 && (
                  <View style={styles.infoRow}>
                    <Ionicons name="calculator" size={20} color="#ef4444" />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Total Extra Amount</Text>
                      <Text style={styles.infoValue}>{formatCurrency(loan.total_extra_amount)}</Text>
                    </View>
                  </View>
                )}
                {loan.days_saved && loan.days_saved > 0 && (
                  <View style={styles.infoRow}>
                    <Ionicons name="checkmark-done" size={20} color="#10b981" />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Days Saved</Text>
                      <Text style={styles.infoValue}>{loan.days_saved} days</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* System Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>System Information</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="time" size={20} color="#6b7280" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Created At</Text>
                  <Text style={styles.infoValue}>{formatDate(loan.created_at)}</Text>
                </View>
              </View>
              {loan.updated_at && (
                <View style={styles.infoRow}>
                  <Ionicons name="refresh" size={20} color="#6b7280" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Last Updated</Text>
                    <Text style={styles.infoValue}>{formatDate(loan.updated_at)}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </View>
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
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    color: '#ef4444',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  loanHeader: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  loanTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  loanTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  loanAmountContainer: {
    alignItems: 'center',
  },
  loanAmountLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  loanAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#059669',
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  amountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  amountCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  amountLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  amountValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
  },
  dateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  dateCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dateLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
  },
});

export default LoanDetail;