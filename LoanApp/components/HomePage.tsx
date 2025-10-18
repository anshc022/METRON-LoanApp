import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiService } from '../services/apiService';
import { CollectionCalendar } from './CollectionCalendar';

interface CollectionHistory {
  date: string;
  collections: Array<{
    id: number;
    loan_id: number;
    amount: number;
    payment_method: 'cash' | 'upi';
    shop_name?: string;
    owner_name?: string;
    collection_date: string;
  }>;
  total_amount: number;
}

interface HomePageProps {
  onBack: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onBack }) => {
  const [collectionHistory, setCollectionHistory] = useState<CollectionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | undefined>();
  
  // Filter and search states
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<'all' | 'cash' | 'upi'>('all');
  const [amountFilter, setAmountFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'shop'>('date');

  const fetchCollectionHistory = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      // For now, we'll use the existing collection history endpoint
      // In a real implementation, you'd want a date-grouped endpoint
      const collections = await apiService.getCollectionHistory();
      
      // Debug logging
      console.log('Raw collections data:', collections);
      console.log('Collections length:', collections?.length);
      console.log('Collections is array:', Array.isArray(collections));
      console.log('First collection sample:', collections?.[0]);
      
      // Check if collections is an array and has data
      if (!collections || !Array.isArray(collections)) {
        console.warn('Collections data is not an array or is null:', collections);
        setCollectionHistory([]);
        return;
      }
      
      if (collections.length === 0) {
        console.info('No collections found');
        setCollectionHistory([]);
        return;
      }
      
      // Filter for loans that have collection activity (collected amount > 0 or have collection dates)
      const completedCollections = collections.filter((collection: any) => {
        // Include loans that have any collection activity
        const hasCollectionActivity = 
          collection.collected_amount > 0 || 
          collection.last_collection_date ||
          collection.collection_status === 'completed' ||
          collection.collection_status === 'in_progress';
          
        console.log(`Loan ${collection.id}: status=${collection.collection_status}, collected=${collection.collected_amount}, last_date=${collection.last_collection_date}, include=${hasCollectionActivity}`);
        return hasCollectionActivity;
      });
      
      console.log('Completed collections found:', completedCollections.length);
      
      if (completedCollections.length === 0) {
        console.info('No completed collections found');
        setCollectionHistory([]);
        return;
      }
      
      // Group collections by date
      const groupedByDate = completedCollections.reduce((acc: Record<string, CollectionHistory>, collection: any) => {
        // Handle the date properly - check if it's a loan or collection record
        let collectionDate = collection.last_collection_date || collection.collection_date;
        if (!collectionDate) {
          return acc; // Skip records without collection date
        }
        
        const date = collectionDate.split('T')[0]; // Get date part only
        if (!acc[date]) {
          acc[date] = {
            date,
            collections: [],
            total_amount: 0
          };
        }
        
        // Convert loan record to collection record format
        // For individual collection history, we should show the daily amount, not total collected
        const dailyAmount = collection.per_day_amount || collection.rounded_per_day_amount || 0;
        
        const collectionRecord = {
          id: collection.id,
          loan_id: collection.id,
          amount: dailyAmount, // Use daily amount instead of total collected amount
          payment_method: 'cash' as const, // Default since we don't have this data
          shop_name: collection.Shop?.name || 'Unknown Shop',
          owner_name: collection.Shop?.owner_name || 'Unknown Owner',
          collection_date: collectionDate
        };
        
        acc[date].collections.push(collectionRecord);
        acc[date].total_amount += collectionRecord.amount;
        return acc;
      }, {} as Record<string, CollectionHistory>);

      // Convert to array and sort by date (newest first)
      const historyArray = Object.values(groupedByDate).sort(
        (a: CollectionHistory, b: CollectionHistory) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      console.log('Final history array:', historyArray.length, 'date groups');
      setCollectionHistory(historyArray);
    } catch (error: any) {
      console.error('Error fetching collection history:', error);
      Alert.alert('Error', 'Failed to fetch collection history. Please try again.');
      setCollectionHistory([]); // Set empty array on error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCollectionHistory();
  }, []);

  const onRefresh = () => {
    fetchCollectionHistory(true);
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  const clearDateSelection = () => {
    setSelectedDate(undefined);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setPaymentMethodFilter('all');
    setAmountFilter('all');
    setSortBy('date');
  };

  // Apply filters and search
  const applyFiltersAndSearch = (collections: CollectionHistory[]) => {
    let filteredCollections = [...collections];

    // Apply search query
    if (searchQuery.trim()) {
      filteredCollections = filteredCollections.map(day => ({
        ...day,
        collections: day.collections.filter(collection =>
          collection.shop_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          collection.owner_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          collection.loan_id.toString().includes(searchQuery)
        )
      })).filter(day => day.collections.length > 0);
    }

    // Apply payment method filter
    if (paymentMethodFilter !== 'all') {
      filteredCollections = filteredCollections.map(day => ({
        ...day,
        collections: day.collections.filter(collection =>
          collection.payment_method === paymentMethodFilter
        )
      })).filter(day => day.collections.length > 0);
    }

    // Apply amount filter
    if (amountFilter !== 'all') {
      filteredCollections = filteredCollections.map(day => ({
        ...day,
        collections: day.collections.filter(collection => {
          if (amountFilter === 'low') return collection.amount < 500;
          if (amountFilter === 'medium') return collection.amount >= 500 && collection.amount < 1000;
          if (amountFilter === 'high') return collection.amount >= 1000;
          return true;
        })
      })).filter(day => day.collections.length > 0);
    }

    // Recalculate total amounts for filtered days
    filteredCollections = filteredCollections.map(day => ({
      ...day,
      total_amount: day.collections.reduce((sum, collection) => sum + collection.amount, 0)
    }));

    // Apply sorting
    if (sortBy === 'amount') {
      filteredCollections.sort((a, b) => b.total_amount - a.total_amount);
    } else if (sortBy === 'shop') {
      filteredCollections.sort((a, b) => {
        const aShop = a.collections[0]?.shop_name || '';
        const bShop = b.collections[0]?.shop_name || '';
        return aShop.localeCompare(bShop);
      });
    } else {
      // Default: sort by date (newest first)
      filteredCollections.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    return filteredCollections;
  };

  // Filter collections based on selected date
  const dateFilteredCollections = selectedDate 
    ? collectionHistory.filter(day => day.date === selectedDate)
    : collectionHistory;

  // Apply additional filters and search
  const displayedCollections = applyFiltersAndSearch(dateFilteredCollections);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#6b7280" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Collection History</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text>Loading collection history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#6b7280" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Collection History</Text>
        <TouchableOpacity onPress={() => fetchCollectionHistory(true)} style={styles.refreshButton}>
          <Ionicons name="refresh-outline" size={24} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {collectionHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyStateText}>No collection history found</Text>
            <Text style={styles.emptyStateSubtext}>Collections will appear here once you start recording them</Text>
          </View>
        ) : displayedCollections.length === 0 ? (
          <View style={styles.container}>
            {/* Calendar Component */}
            <CollectionCalendar 
              collectionHistory={collectionHistory}
              onDateSelect={handleDateSelect}
              selectedDate={selectedDate}
            />
            
            {/* Selected Date Header */}
            {selectedDate && (
              <View style={styles.selectedDateHeader}>
                <View style={styles.selectedDateInfo}>
                  <Ionicons name="calendar" size={20} color="#6366f1" />
                  <Text style={styles.selectedDateText}>
                    Collections for {formatDate(selectedDate)}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.clearSelectionButton}
                  onPress={clearDateSelection}
                >
                  <Ionicons name="close-circle" size={20} color="#6b7280" />
                  <Text style={styles.clearSelectionText}>Show All</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.emptyState}>
              <Ionicons name="calendar-clear-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyStateText}>No collections for this date</Text>
              <Text style={styles.emptyStateSubtext}>
                {selectedDate ? `No collections found for ${formatDate(selectedDate)}` : 'Select a date with collections'}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.historyContainer}>
            {/* Calendar Component */}
            <CollectionCalendar 
              collectionHistory={collectionHistory}
              onDateSelect={handleDateSelect}
              selectedDate={selectedDate}
            />

            {/* Search and Filter Bar */}
            <View style={styles.searchFilterContainer}>
              {/* Search Bar */}
              <View style={styles.searchBar}>
                <Ionicons name="search" size={20} color="#6b7280" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search shops, owners, or loan IDs..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholderTextColor="#9ca3af"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={20} color="#6b7280" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Filter Button */}
              <TouchableOpacity 
                style={[
                  styles.filterButton,
                  (paymentMethodFilter !== 'all' || amountFilter !== 'all' || sortBy !== 'date') && styles.filterButtonActive
                ]}
                onPress={() => setShowFilters(true)}
              >
                <Ionicons name="filter" size={20} color="#6366f1" />
                <Text style={styles.filterButtonText}>Filter</Text>
                {(paymentMethodFilter !== 'all' || amountFilter !== 'all' || sortBy !== 'date') && (
                  <View style={styles.filterActiveIndicator} />
                )}
              </TouchableOpacity>
            </View>

            {/* Active Filters Display */}
            {(paymentMethodFilter !== 'all' || amountFilter !== 'all' || sortBy !== 'date' || searchQuery.trim()) && (
              <View style={styles.activeFiltersContainer}>
                <View style={styles.activeFiltersRow}>
                  {searchQuery.trim() && (
                    <View style={styles.activeFilterChip}>
                      <Text style={styles.activeFilterText}>Search: {searchQuery}</Text>
                      <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close" size={14} color="#6366f1" />
                      </TouchableOpacity>
                    </View>
                  )}
                  
                  {paymentMethodFilter !== 'all' && (
                    <View style={styles.activeFilterChip}>
                      <Text style={styles.activeFilterText}>Payment: {paymentMethodFilter.toUpperCase()}</Text>
                      <TouchableOpacity onPress={() => setPaymentMethodFilter('all')}>
                        <Ionicons name="close" size={14} color="#6366f1" />
                      </TouchableOpacity>
                    </View>
                  )}
                  
                  {amountFilter !== 'all' && (
                    <View style={styles.activeFilterChip}>
                      <Text style={styles.activeFilterText}>Amount: {amountFilter}</Text>
                      <TouchableOpacity onPress={() => setAmountFilter('all')}>
                        <Ionicons name="close" size={14} color="#6366f1" />
                      </TouchableOpacity>
                    </View>
                  )}
                  
                  {sortBy !== 'date' && (
                    <View style={styles.activeFilterChip}>
                      <Text style={styles.activeFilterText}>Sort: {sortBy}</Text>
                      <TouchableOpacity onPress={() => setSortBy('date')}>
                        <Ionicons name="close" size={14} color="#6366f1" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
                
                <TouchableOpacity style={styles.clearAllFiltersButton} onPress={clearFilters}>
                  <Text style={styles.clearAllFiltersText}>Clear All</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Selected Date Header */}
            {selectedDate && (
              <View style={styles.selectedDateHeader}>
                <View style={styles.selectedDateInfo}>
                  <Ionicons name="calendar" size={20} color="#6366f1" />
                  <Text style={styles.selectedDateText}>
                    Collections for {formatDate(selectedDate)}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.clearSelectionButton}
                  onPress={clearDateSelection}
                >
                  <Ionicons name="close-circle" size={20} color="#6b7280" />
                  <Text style={styles.clearSelectionText}>Show All</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Summary Card */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Ionicons name="calendar" size={20} color="#6366f1" />
                  <Text style={styles.summaryValue}>{displayedCollections.length}</Text>
                  <Text style={styles.summaryLabel}>Days</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Ionicons name="list" size={20} color="#059669" />
                  <Text style={styles.summaryValue}>
                    {displayedCollections.reduce((total, day) => total + day.collections.length, 0)}
                  </Text>
                  <Text style={styles.summaryLabel}>Collections</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Ionicons name="cash" size={20} color="#dc2626" />
                  <Text style={styles.summaryValue}>
                    ₹{displayedCollections.reduce((total, day) => total + day.total_amount, 0).toLocaleString()}
                  </Text>
                  <Text style={styles.summaryLabel}>Total</Text>
                </View>
              </View>
            </View>

            {/* Collection History */}
            {displayedCollections.map((dayHistory, dayIndex) => (
              <View key={dayHistory.date} style={[
                styles.dayCard,
                dayIndex === 0 && styles.todayCard
              ]}>
                <View style={styles.dayHeader}>
                  <View style={styles.dayHeaderLeft}>
                    <View style={styles.dateIconContainer}>
                      <Ionicons 
                        name={dayIndex === 0 ? "today" : "calendar"} 
                        size={20} 
                        color={dayIndex === 0 ? "#10b981" : "#6366f1"} 
                      />
                    </View>
                    <View>
                      <Text style={[
                        styles.dayTitle,
                        dayIndex === 0 && styles.todayTitle
                      ]}>
                        {formatDate(dayHistory.date)}
                      </Text>
                      <Text style={styles.daySubtitle}>
                        {dayHistory.collections.length} collection{dayHistory.collections.length !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>
                  <View style={[
                    styles.dayTotal,
                    dayIndex === 0 && styles.todayTotal
                  ]}>
                    <Text style={styles.dayTotalLabel}>Total</Text>
                    <Text style={[
                      styles.dayTotalAmount,
                      dayIndex === 0 && styles.todayTotalAmount
                    ]}>
                      ₹{dayHistory.total_amount.toLocaleString()}
                    </Text>
                  </View>
                </View>

                <View style={styles.collectionsContainer}>
                  {dayHistory.collections.map((collection, index) => (
                    <View key={collection.id} style={[
                      styles.collectionItem,
                      index === dayHistory.collections.length - 1 && styles.lastCollectionItem
                    ]}>
                      <View style={styles.collectionLeft}>
                        <View style={styles.collectionIconContainer}>
                          <Ionicons 
                            name="storefront" 
                            size={16} 
                            color="#6b7280" 
                          />
                        </View>
                        <View style={styles.collectionInfo}>
                          <Text style={styles.shopName}>
                            {collection.shop_name || `Loan #${collection.loan_id}`}
                          </Text>
                          <Text style={styles.ownerName}>
                            {collection.owner_name || 'Unknown Owner'}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.collectionRight}>
                        <Text style={[
                          styles.collectionAmount,
                          collection.amount >= 1000 ? styles.highAmount : 
                          collection.amount >= 500 ? styles.mediumAmount : styles.lowAmount
                        ]}>
                          ₹{collection.amount.toLocaleString()}
                        </Text>
                        <View style={[
                          styles.paymentMethodBadge,
                          collection.payment_method === 'upi' ? styles.upiMethodBadge : styles.cashMethodBadge
                        ]}>
                          <Ionicons 
                            name={collection.payment_method === 'upi' ? 'phone-portrait' : 'cash'} 
                            size={10} 
                            color={collection.payment_method === 'upi' ? '#7c3aed' : '#059669'} 
                          />
                          <Text style={[
                            styles.paymentMethodText,
                            collection.payment_method === 'upi' ? styles.upiMethodText : styles.cashMethodText
                          ]}>
                            {collection.payment_method.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.filterModalContainer}>
          {/* Filter Header */}
          <View style={styles.filterHeader}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowFilters(false)}
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
            <Text style={styles.filterHeaderTitle}>Filter & Sort</Text>
            <TouchableOpacity 
              style={styles.resetButton}
              onPress={clearFilters}
            >
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.filterContent}>
            {/* Payment Method Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Payment Method</Text>
              <View style={styles.filterOptions}>
                {['all', 'cash', 'upi'].map((method) => (
                  <TouchableOpacity
                    key={method}
                    style={[
                      styles.filterOption,
                      paymentMethodFilter === method && styles.filterOptionActive
                    ]}
                    onPress={() => setPaymentMethodFilter(method as any)}
                  >
                    <Ionicons 
                      name={
                        method === 'all' ? 'apps' :
                        method === 'cash' ? 'cash' : 'phone-portrait'
                      } 
                      size={20} 
                      color={paymentMethodFilter === method ? '#ffffff' : '#6366f1'} 
                    />
                    <Text style={[
                      styles.filterOptionText,
                      paymentMethodFilter === method && styles.filterOptionTextActive
                    ]}>
                      {method === 'all' ? 'All Methods' : method.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Amount Range Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Amount Range</Text>
              <View style={styles.filterOptions}>
                {[
                  { key: 'all', label: 'All Amounts', icon: 'apps' },
                  { key: 'low', label: 'Low (<₹500)', icon: 'trending-down' },
                  { key: 'medium', label: 'Medium (₹500-₹999)', icon: 'remove' },
                  { key: 'high', label: 'High (≥₹1000)', icon: 'trending-up' }
                ].map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.filterOption,
                      amountFilter === option.key && styles.filterOptionActive
                    ]}
                    onPress={() => setAmountFilter(option.key as any)}
                  >
                    <Ionicons 
                      name={option.icon as any} 
                      size={20} 
                      color={amountFilter === option.key ? '#ffffff' : '#6366f1'} 
                    />
                    <Text style={[
                      styles.filterOptionText,
                      amountFilter === option.key && styles.filterOptionTextActive
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Sort Options */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Sort By</Text>
              <View style={styles.filterOptions}>
                {[
                  { key: 'date', label: 'Date (Newest First)', icon: 'calendar' },
                  { key: 'amount', label: 'Amount (Highest First)', icon: 'cash' },
                  { key: 'shop', label: 'Shop Name (A-Z)', icon: 'storefront' }
                ].map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.filterOption,
                      sortBy === option.key && styles.filterOptionActive
                    ]}
                    onPress={() => setSortBy(option.key as any)}
                  >
                    <Ionicons 
                      name={option.icon as any} 
                      size={20} 
                      color={sortBy === option.key ? '#ffffff' : '#6366f1'} 
                    />
                    <Text style={[
                      styles.filterOptionText,
                      sortBy === option.key && styles.filterOptionTextActive
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Apply Button */}
          <View style={styles.filterFooter}>
            <TouchableOpacity 
              style={styles.applyButton}
              onPress={() => setShowFilters(false)}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    marginTop: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
    marginTop: 12,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
    textAlign: 'center',
  },
  historyContainer: {
    paddingVertical: 20,
  },
  dayCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  daySubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  dayTotal: {
    alignItems: 'flex-end',
  },
  dayTotalLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  dayTotalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
  },
  collectionsContainer: {
    gap: 12,
  },
  collectionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  collectionInfo: {
    flex: 1,
  },
  shopName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  ownerName: {
    fontSize: 12,
    color: '#6b7280',
  },
  collectionDetails: {
    alignItems: 'flex-end',
    gap: 4,
  },
  collectionAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  paymentMethodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  cashMethodBadge: {
    backgroundColor: '#dcfce7',
  },
  upiMethodBadge: {
    backgroundColor: '#f3e8ff',
  },
  paymentMethodText: {
    fontSize: 10,
    fontWeight: '600',
  },
  cashMethodText: {
    color: '#059669',
  },
  upiMethodText: {
    color: '#7c3aed',
  },
  // Enhanced styles for better UI/UX
  todayCard: {
    borderWidth: 2,
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  dayHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dateIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  todayTitle: {
    color: '#059669',
    fontWeight: '700',
  },
  todayTotal: {
    alignItems: 'flex-end',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  todayTotalAmount: {
    color: '#047857',
    fontSize: 20,
  },
  lastCollectionItem: {
    borderBottomWidth: 0,
  },
  collectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  collectionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  collectionRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  // Summary card styles
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 8,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 16,
  },
  // Amount color coding
  highAmount: {
    color: '#dc2626', // Red for high amounts (>=1000)
  },
  mediumAmount: {
    color: '#059669', // Green for medium amounts (>=500)
  },
  lowAmount: {
    color: '#6b7280', // Gray for low amounts (<500)
  },
  // Selected date styles
  selectedDateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#6366f1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedDateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedDateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
  },
  clearSelectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  clearSelectionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  // Search and filter styles
  searchFilterContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 8,
    position: 'relative',
  },
  filterButtonActive: {
    borderColor: '#6366f1',
    backgroundColor: '#eef2ff',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
  },
  filterActiveIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#dc2626',
  },
  // Active filters
  activeFiltersContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  activeFiltersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  activeFilterText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6366f1',
  },
  clearAllFiltersButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  clearAllFiltersText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  // Filter modal styles
  filterModalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  filterHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  resetButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2626',
  },
  filterContent: {
    flex: 1,
    padding: 20,
  },
  filterSection: {
    marginBottom: 32,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  filterOptions: {
    gap: 12,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  filterOptionActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6366f1',
  },
  filterOptionTextActive: {
    color: '#ffffff',
  },
  filterFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  applyButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});