import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Image,
  Dimensions,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { apiService, AgentStats, TodayCollection } from '../services/apiService';
import { authService } from '../services/authService';
import MyShops from './agent/MyShops';
import MyLoans from './agent/MyLoans';
import Settings from './shared/Settings';
import ApiDebugger from './shared/ApiDebugger';
import { HomePage } from './HomePage';

interface AgentDashboardProps {
  onLogout: () => void;
}

type AgentPage = 'home' | 'dashboard' | 'shops' | 'loans' | 'settings' | 'debug';

const AgentDashboard: React.FC<AgentDashboardProps> = ({ onLogout }) => {
  const [currentPage, setCurrentPage] = useState<AgentPage>('home');
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [todayCollections, setTodayCollections] = useState<TodayCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Collection modal states
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<TodayCollection | null>(null);
  const [collectionAmount, setCollectionAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi'>('cash');
  const [screenshot, setScreenshot] = useState<any>(null);
  const [recordingCollection, setRecordingCollection] = useState(false);
  
  const user = authService.getUser();
  
  // Helper function to check current page
  const isCurrentPage = (page: AgentPage): boolean => currentPage === page;
  
  // Get screen dimensions for responsive design
  const screenWidth = Dimensions.get('window').width;
  const cardWidth = Math.max(130, Math.min(160, (screenWidth - 60) / 4)); // Responsive card width

  const fetchStats = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const [statsResponse, collectionsResponse] = await Promise.all([
        apiService.getAgentStats(),
        apiService.getTodaysCollections()
      ]);
      
      setStats(statsResponse);
      setTodayCollections(collectionsResponse);
    } catch (error: any) {
      console.error('Error fetching agent data:', error);
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

  const openCollectionModal = (loan: TodayCollection) => {
    setSelectedLoan(loan);
    setCollectionAmount(loan.rounded_per_day_amount?.toString() || '');
    setPaymentMethod('cash');
    setScreenshot(null);
    setShowCollectionModal(true);
  };

  const closeCollectionModal = () => {
    setShowCollectionModal(false);
    setSelectedLoan(null);
    setCollectionAmount('');
    setPaymentMethod('cash');
    setScreenshot(null);
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setScreenshot(result.assets[0]);
    }
  };

  const recordCollection = async () => {
    if (!selectedLoan || !collectionAmount || isNaN(Number(collectionAmount))) {
      Alert.alert('Error', 'Please enter a valid collection amount');
      return;
    }

    if (paymentMethod === 'upi' && !screenshot) {
      Alert.alert('Error', 'Please upload a screenshot for UPI payment');
      return;
    }

    try {
      setRecordingCollection(true);
      
      const result = await apiService.recordCollection(
        selectedLoan.id,
        Number(collectionAmount),
        paymentMethod,
        screenshot
      );

      // Optimistically remove from today's list if:
      // - backend marks loan as completed, OR
      // - full due amount (or more) was paid for today
      const paid = Number(collectionAmount);
      const due = Number(selectedLoan.rounded_per_day_amount || 0);
      const status = (result as any)?.status;
      if (status === 'completed' || (!isNaN(paid) && paid >= due && due > 0)) {
        setTodayCollections((prev) => prev.filter((l) => l.id !== selectedLoan.id));
      }

      Alert.alert('Success', 'Collection recorded successfully');
      closeCollectionModal();
      // Also refresh in background to sync stats and ensure consistency
      fetchStats(true);
    } catch (error: any) {
      console.error('Error recording collection:', error);
      Alert.alert('Error', 'Failed to record collection. Please try again.');
    } finally {
      setRecordingCollection(false);
    }
  };

  const openLocationInMaps = async (loan: TodayCollection) => {
    // Prioritize GPS coordinates if available, then shop address, then residence address, then location
    const gpsShop = loan.Shop?.gpsLocationShop;
    const gpsHome = loan.Shop?.gpsLocationHome;
    const shopAddress = loan.Shop?.shopAddress;
    const residenceAddress = loan.Shop?.residenceAddress;
    const location = loan.Shop?.location;
    const shopName = loan.shop_name || loan.Shop?.name;
    
    let navigateAddress = '';
    let addressType = '';
    
    if (gpsShop) {
      navigateAddress = gpsShop;
      addressType = 'GPS Shop Location';
    } else if (shopAddress) {
      const fullShopAddress = loan.Shop?.shopPinCode 
        ? `${shopAddress}, ${loan.Shop.shopPinCode}`
        : shopAddress;
      navigateAddress = fullShopAddress;
      addressType = 'Shop Address';
    } else if (gpsHome) {
      navigateAddress = gpsHome;
      addressType = 'GPS Home Location';
    } else if (residenceAddress) {
      const fullResidenceAddress = loan.Shop?.residencePinCode 
        ? `${residenceAddress}, ${loan.Shop.residencePinCode}`
        : residenceAddress;
      navigateAddress = fullResidenceAddress;
      addressType = 'Residence Address';
    } else if (location) {
      navigateAddress = location;
      addressType = 'General Location';
    }
    
    if (!navigateAddress) {
      Alert.alert('Location Not Available', 'No address information found for this shop');
      return;
    }

    try {
      let mapUrl = '';
      const mapApp = Platform.OS === 'ios' ? 'Apple Maps' : 'Google Maps';
      
      if (Platform.OS === 'ios') {
        // Apple Maps for iOS
        if (gpsShop || gpsHome) {
          mapUrl = `http://maps.apple.com/?q=${encodeURIComponent(navigateAddress)}`;
        } else {
          mapUrl = `http://maps.apple.com/?q=${encodeURIComponent(navigateAddress)}`;
        }
      } else {
        // Google Maps for Android
        if (gpsShop || gpsHome) {
          mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(navigateAddress)}`;
        } else {
          mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(navigateAddress)}`;
        }
      }

      const supported = await Linking.canOpenURL(mapUrl);
      if (supported) {
        await Linking.openURL(mapUrl);
      } else {
        Alert.alert(
          'Map App Not Available', 
          `${mapApp} is not available on this device. Please install the app or check your device settings.`
        );
      }
    } catch (error) {
      console.error('Error opening maps:', error);
      Alert.alert('Error', 'Could not open maps application');
    }
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
      title: 'Active Loans',
      value: stats?.activeLoans || 0,
      icon: 'trending-up' as const,
      color: '#dc2626',
      bgColor: '#fef2f2',
    },
  ];

  // Handle different page navigation
  const handleBackToDashboard = () => {
    setCurrentPage('home');
  };

  // Render different pages based on current page
  if (currentPage === 'dashboard') {
    return <HomePage onBack={handleBackToDashboard} />;
  }
  
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

        {/* Stats Cards - 2x2 Grid Layout */}
        <View style={styles.statsContainer}>
          <View style={styles.statsGrid}>
            {statCards.map((card, index) => (
              <TouchableOpacity 
                key={index} 
                style={[
                  styles.statCard, 
                  { 
                    borderLeftWidth: 3, 
                    borderLeftColor: card.color,
                  }
                ]}
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

        {/* Today's Collections */}
        <View style={styles.collectionsContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Collections ({todayCollections.length})</Text>
            <TouchableOpacity onPress={() => fetchStats(true)} style={styles.refreshButton}>
              <Ionicons name="refresh-outline" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          {/* Today's Collection Summary */}
          {todayCollections.length > 0 && (
            <View style={styles.collectionSummary}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Target Today</Text>
                <Text style={styles.summaryValue}>
                  ₹{todayCollections.filter(loan => loan.todayStatus !== 'collected').reduce((sum, loan) => sum + (loan.rounded_per_day_amount || 0), 0).toLocaleString()}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Collected Today</Text>
                <Text style={[styles.summaryValue, { color: '#059669' }]}>
                  ₹{(stats?.todayCollected || 0).toLocaleString()}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Remaining Today</Text>
                <Text style={[styles.summaryValue, { color: '#dc2626' }]}>
                  ₹{Math.max(0, todayCollections.filter(loan => loan.todayStatus !== 'collected').reduce((sum, loan) => sum + (loan.rounded_per_day_amount || 0), 0) - (stats?.todayCollected || 0)).toLocaleString()}
                </Text>
              </View>
            </View>
          )}

          {/* Today's Progress Bar */}
          {todayCollections.length > 0 && (
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Today's Progress</Text>
                <Text style={styles.progressPercentage}>
                  {Math.round(((stats?.todayCollected || 0) / Math.max(1, todayCollections.filter(loan => loan.todayStatus !== 'collected').reduce((sum, loan) => sum + (loan.rounded_per_day_amount || 0), 0) + (stats?.todayCollected || 0))) * 100)}%
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${Math.min(100, ((stats?.todayCollected || 0) / Math.max(1, todayCollections.filter(loan => loan.todayStatus !== 'collected').reduce((sum, loan) => sum + (loan.rounded_per_day_amount || 0), 0) + (stats?.todayCollected || 0))) * 100)}%` 
                    }
                  ]} 
                />
              </View>
            </View>
          )}
          
          {todayCollections.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyStateText}>No collections due today</Text>
              <Text style={styles.emptyStateSubtext}>All caught up! 🎉</Text>
            </View>
          ) : (
            <ScrollView style={styles.collectionsList} nestedScrollEnabled={true}>
              {todayCollections.map((loan) => {
                const isCollected = loan.todayStatus === 'collected';
                return (
                  <View 
                    key={loan.id} 
                    style={[
                      styles.collectionCard,
                      isCollected && styles.collectedCard
                    ]}
                  >
                    <View style={styles.collectionHeader}>
                      <View style={styles.collectionInfo}>
                        <View style={styles.shopNameContainer}>
                          <Text style={[
                            styles.shopName,
                            isCollected && styles.collectedText
                          ]}>
                            {loan.shop_name || loan.Shop?.name || 'Unknown Shop'}
                          </Text>
                          {isCollected && (
                            <View style={styles.collectedBadge}>
                              <Ionicons name="checkmark-circle" size={16} color="#059669" />
                              <Text style={styles.collectedBadgeText}>Collected</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[
                          styles.ownerName,
                          isCollected && styles.collectedSecondaryText
                        ]}>
                          {loan.owner_name || loan.Shop?.owner_name || 'Unknown Owner'}
                        </Text>
                        <Text style={[
                          styles.customerNumber,
                          isCollected && styles.collectedSecondaryText
                        ]}>
                          #{loan.customer_number || `L${loan.id}`}
                        </Text>
                        {(loan.Shop?.shopAddress || loan.Shop?.residenceAddress || loan.Shop?.location) && (
                          <View style={styles.locationContainer}>
                            <Ionicons name="location-outline" size={12} color="#6b7280" />
                            <Text style={[
                              styles.locationText,
                              isCollected && styles.collectedSecondaryText
                            ]} numberOfLines={1}>
                              {loan.Shop?.shopAddress || loan.Shop?.residenceAddress || loan.Shop?.location}
                              {loan.Shop?.shopPinCode && loan.Shop?.shopAddress ? `, ${loan.Shop.shopPinCode}` : ''}
                              {loan.Shop?.residencePinCode && loan.Shop?.residenceAddress && !loan.Shop?.shopAddress ? `, ${loan.Shop.residencePinCode}` : ''}
                            </Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.collectionAmount}>
                        <Text style={[
                          styles.amountLabel,
                          isCollected && styles.collectedSecondaryText
                        ]}>
                          {isCollected ? 'Collected' : 'Due Amount'}
                        </Text>
                        <Text style={[
                          styles.amountValue,
                          isCollected && styles.collectedAmountValue
                        ]}>
                          ₹{loan.rounded_per_day_amount?.toLocaleString() || 0}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.collectionActions}>
                      {(loan.Shop?.gpsLocationShop || loan.Shop?.shopAddress || loan.Shop?.gpsLocationHome || loan.Shop?.residenceAddress || loan.Shop?.location) && (
                        <TouchableOpacity 
                          style={styles.mapButton}
                          onPress={() => openLocationInMaps(loan)}
                        >
                          <Ionicons name="navigate-outline" size={14} color="#3b82f6" />
                          <Text style={styles.mapButtonText}>
                            {Platform.OS === 'ios' ? 'Apple Maps' : 'Google Maps'}
                          </Text>
                        </TouchableOpacity>
                      )}
                      {!isCollected && (
                        <TouchableOpacity 
                          style={styles.collectButton}
                          onPress={() => openCollectionModal(loan)}
                        >
                          <Ionicons name="wallet-outline" size={16} color="#fff" />
                          <Text style={styles.collectButtonText}>Collect</Text>
                        </TouchableOpacity>
                      )}
                      {isCollected && (
                        <View style={styles.completedButton}>
                          <Ionicons name="checkmark" size={16} color="#059669" />
                          <Text style={styles.completedButtonText}>Completed</Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* Recent Activity */}
        <View style={styles.activityContainer}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityList}>
            <Text style={styles.noActivity}>No recent activity to display</Text>
          </View>
        </View>
      </ScrollView>

      {/* Collection Recording Modal */}
      <Modal
        visible={showCollectionModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeCollectionModal}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeCollectionModal}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Record Collection</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedLoan && (
              <>
                <View style={styles.loanInfo}>
                  <Text style={styles.loanInfoTitle}>Loan Details</Text>
                  <Text style={styles.loanInfoText}>Shop: {selectedLoan.shop_name || selectedLoan.Shop?.name}</Text>
                  <Text style={styles.loanInfoText}>Owner: {selectedLoan.owner_name || selectedLoan.Shop?.owner_name}</Text>
                  <Text style={styles.loanInfoText}>Customer: #{selectedLoan.customer_number || `L${selectedLoan.id}`}</Text>
                  {(selectedLoan.Shop?.gpsLocationShop || selectedLoan.Shop?.shopAddress || selectedLoan.Shop?.gpsLocationHome || selectedLoan.Shop?.residenceAddress || selectedLoan.Shop?.location) && (
                    <View style={styles.modalLocationContainer}>
                      <Text style={styles.loanInfoText}>
                        Location: {selectedLoan.Shop?.shopAddress || selectedLoan.Shop?.residenceAddress || selectedLoan.Shop?.location}
                        {selectedLoan.Shop?.shopPinCode && selectedLoan.Shop?.shopAddress ? `, ${selectedLoan.Shop.shopPinCode}` : ''}
                        {selectedLoan.Shop?.residencePinCode && selectedLoan.Shop?.residenceAddress && !selectedLoan.Shop?.shopAddress ? `, ${selectedLoan.Shop.residencePinCode}` : ''}
                      </Text>
                      <TouchableOpacity 
                        style={styles.modalMapButton}
                        onPress={() => openLocationInMaps(selectedLoan)}
                      >
                        <Ionicons name="navigate-outline" size={16} color="#3b82f6" />
                        <Text style={styles.modalMapButtonText}>
                          Open in {Platform.OS === 'ios' ? 'Apple Maps' : 'Google Maps'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Collection Amount</Text>
                  <TextInput
                    style={styles.amountInput}
                    value={collectionAmount}
                    onChangeText={setCollectionAmount}
                    placeholder="Enter amount"
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Payment Method</Text>
                  <View style={styles.paymentMethods}>
                    <TouchableOpacity
                      style={[styles.paymentOption, paymentMethod === 'cash' && styles.paymentOptionActive]}
                      onPress={() => setPaymentMethod('cash')}
                    >
                      <Ionicons name="cash-outline" size={20} color={paymentMethod === 'cash' ? '#fff' : '#6b7280'} />
                      <Text style={[styles.paymentOptionText, paymentMethod === 'cash' && styles.paymentOptionTextActive]}>
                        Cash
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.paymentOption, paymentMethod === 'upi' && styles.paymentOptionActive]}
                      onPress={() => setPaymentMethod('upi')}
                    >
                      <Ionicons name="phone-portrait-outline" size={20} color={paymentMethod === 'upi' ? '#fff' : '#6b7280'} />
                      <Text style={[styles.paymentOptionText, paymentMethod === 'upi' && styles.paymentOptionTextActive]}>
                        UPI
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {paymentMethod === 'upi' && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Payment Screenshot</Text>
                    <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
                      {screenshot ? (
                        <View style={styles.imagePreview}>
                          <Image source={{ uri: screenshot.uri }} style={styles.previewImage} />
                          <Text style={styles.imagePickerText}>Tap to change screenshot</Text>
                        </View>
                      ) : (
                        <View style={styles.imagePickerContent}>
                          <Ionicons name="camera-outline" size={32} color="#6b7280" />
                          <Text style={styles.imagePickerText}>Upload Payment Screenshot</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.recordButton, recordingCollection && styles.recordButtonDisabled]}
                  onPress={recordCollection}
                  disabled={recordingCollection}
                >
                  <Text style={styles.recordButtonText}>
                    {recordingCollection ? 'Recording...' : 'Record Collection'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity 
          style={[styles.navItem, isCurrentPage('home') && styles.navItemActive]}
          onPress={() => setCurrentPage('home')}
        >
          <Ionicons 
            name={isCurrentPage('home') ? 'home' : 'home-outline'} 
            size={24} 
            color={isCurrentPage('home') ? '#059669' : '#6b7280'} 
          />
          <Text style={[styles.navText, isCurrentPage('home') && styles.navTextActive]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navItem, isCurrentPage('dashboard') && styles.navItemActive]}
          onPress={() => setCurrentPage('dashboard')}
        >
          <Ionicons 
            name={isCurrentPage('dashboard') ? 'calendar' : 'calendar-outline'} 
            size={24} 
            color={isCurrentPage('dashboard') ? '#059669' : '#6b7280'} 
          />
          <Text style={[styles.navText, isCurrentPage('dashboard') && styles.navTextActive]}>History</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navItem, isCurrentPage('shops') && styles.navItemActive]}
          onPress={() => setCurrentPage('shops')}
        >
          <Ionicons 
            name={isCurrentPage('shops') ? 'storefront' : 'storefront-outline'} 
            size={24} 
            color={isCurrentPage('shops') ? '#059669' : '#6b7280'} 
          />
          <Text style={[styles.navText, isCurrentPage('shops') && styles.navTextActive]}>Shops</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navItem, isCurrentPage('loans') && styles.navItemActive]}
          onPress={() => setCurrentPage('loans')}
        >
          <Ionicons 
            name={isCurrentPage('loans') ? 'cash' : 'cash-outline'} 
            size={24} 
            color={isCurrentPage('loans') ? '#059669' : '#6b7280'} 
          />
          <Text style={[styles.navText, isCurrentPage('loans') && styles.navTextActive]}>Loans</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navItem, isCurrentPage('settings') && styles.navItemActive]}
          onPress={() => setCurrentPage('settings')}
        >
          <Ionicons 
            name={isCurrentPage('settings') ? 'settings' : 'settings-outline'} 
            size={24} 
            color={isCurrentPage('settings') ? '#059669' : '#6b7280'} 
          />
          <Text style={[styles.navText, isCurrentPage('settings') && styles.navTextActive]}>Settings</Text>
        </TouchableOpacity>
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
  statsScroll: {
    flexGrow: 0,
  },
  statsScrollContainer: {
    paddingHorizontal: 0,
    gap: 12,
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    minHeight: 120,
    flex: 1,
    maxWidth: '48%',
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIcon: {
    width: 28,
    height: 28,
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
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 2,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  statTitle: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 2,
    textAlign: 'center',
  },
  statSubtitle: {
    fontSize: 10,
    color: '#9ca3af',
    fontWeight: '400',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  actionCards: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
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
  collectionsContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
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
  collectionsList: {
    maxHeight: 300,
  },
  collectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  collectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  collectionInfo: {
    flex: 1,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  ownerName: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  customerNumber: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    maxWidth: '100%',
  },
  locationText: {
    fontSize: 11,
    color: '#6b7280',
    marginLeft: 4,
    flex: 1,
  },
  collectionAmount: {
    alignItems: 'flex-end',
  },
  amountLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  amountValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
  },
  collectionActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
  },
  mapButton: {
    backgroundColor: '#eff6ff',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mapButtonText: {
    color: '#3b82f6',
    fontSize: 11,
    fontWeight: '600',
  },
  collectButton: {
    backgroundColor: '#059669',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  collectButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
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
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  loanInfo: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  loanInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  loanInfoText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 6,
  },
  modalLocationContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  modalMapButton: {
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  modalMapButtonText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 8,
  },
  amountInput: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  paymentMethods: {
    flexDirection: 'row',
    gap: 12,
  },
  paymentOption: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  paymentOptionActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  paymentOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
  paymentOptionTextActive: {
    color: '#ffffff',
  },
  imagePickerButton: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 20,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  imagePickerContent: {
    alignItems: 'center',
  },
  imagePickerText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  imagePreview: {
    alignItems: 'center',
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginBottom: 8,
  },
  recordButton: {
    backgroundColor: '#059669',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  recordButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  recordButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  collectionSummary: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 12,
  },
  progressContainer: {
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
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: 4,
  },
  collectedCard: {
    backgroundColor: '#f0fdf4',
    borderLeftWidth: 4,
    borderLeftColor: '#059669',
  },
  shopNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  collectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    gap: 4,
  },
  collectedBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#059669',
  },
  collectedText: {
    color: '#059669',
  },
  collectedSecondaryText: {
    color: '#16a34a',
  },
  collectedAmountValue: {
    color: '#059669',
  },
  completedButton: {
    backgroundColor: '#dcfce7',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  completedButtonText: {
    color: '#059669',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomNavigation: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  navItemActive: {
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
  },
  navText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6b7280',
    marginTop: 4,
  },
  navTextActive: {
    color: '#059669',
    fontWeight: '600',
  },
});

export default AgentDashboard;