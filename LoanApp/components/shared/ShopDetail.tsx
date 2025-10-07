import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Linking,
  Dimensions,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiService, Shop } from '../../services/apiService';

const API_BASE_URL = 'http://192.168.31.36:5000';

// Helper to convert relative paths to absolute URLs
const getFullImageUrl = (path: string | null | undefined): string => {
  if (!path) return '';
  if (path.startsWith('http')) return path; // Already absolute
  return `${API_BASE_URL}${path.startsWith('/') ? path : '/' + path}`;
};

const { width } = Dimensions.get('window');

interface ShopDetailProps {
  shopId: number;
  onBack: () => void;
}

const ShopDetail: React.FC<ShopDetailProps> = ({ shopId, onBack }) => {
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [selectedDocument, setSelectedDocument] = useState<{url: string, label: string} | null>(null);

  useEffect(() => {
    fetchShopDetails();
  }, [shopId]);

  const fetchShopDetails = async () => {
    try {
      setLoading(true);
      const response = await apiService.getShopById(shopId);
      setShop(response);
    } catch (error: any) {
      console.error('Error fetching shop details:', error);
      
      let errorMessage = 'Failed to load shop details';
      if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to view this shop. It may not be assigned to you.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Shop not found.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCall = (phoneNumber: string) => {
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
    }
  };

  const handleLocation = (location: string) => {
    if (location) {
      const coords = location.split(',');
      if (coords.length === 2) {
        const lat = coords[0].trim();
        const lng = coords[1].trim();
        Linking.openURL(`https://maps.google.com/?q=${lat},${lng}`);
      }
    }
  };

  const renderPhotoGallery = () => {
    if (!shop?.shop_photos) return null;

    let photos: string[] = [];
    const raw = shop.shop_photos as any;

    if (Array.isArray(raw)) {
      photos = raw;
    } else if (typeof raw === 'string') {
      const s = raw.trim();
      if (s.startsWith('[') || s.startsWith('{')) {
        try {
          const parsed = JSON.parse(s);
          photos = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          // If parsing fails, fallback to single path
          photos = s ? [s] : [];
        }
      } else if (s.includes(',')) {
        photos = s.split(',').map((p) => p.trim()).filter(Boolean);
      } else if (s) {
        photos = [s];
      }
    }

    if (photos.length === 0) return null;

    return (
      <View style={styles.photoSection}>
        <Text style={styles.sectionTitle}>Shop Photos</Text>
        <ScrollView 
          horizontal 
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / (width - 40));
            setActivePhotoIndex(index);
          }}
        >
          {photos.map((photo: string, index: number) => (
            <Image
              key={index}
              source={{ uri: getFullImageUrl(photo) }}
              style={styles.shopPhoto}
              resizeMode="cover"
            />
          ))}
        </ScrollView>
        {photos.length > 1 && (
          <View style={styles.photoIndicators}>
            {photos.map((_: any, index: number) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  index === activePhotoIndex && styles.activeIndicator
                ]}
              />
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderDocumentSection = () => {
    const documents = [
      { label: 'Aadhaar Card', url: shop?.aadhaar_doc, number: shop?.aadhaar_number },
      { label: 'PAN Card', url: shop?.pan_doc, number: shop?.pan_number },
      { label: 'Bank Book', url: shop?.bank_book_doc },
      { label: 'Live Photo', url: shop?.live_photo_with_doc },
      { label: 'Customer Photo', url: shop?.customer_photo },
      { label: 'BOI Photo', url: shop?.boi_photo },
    ].filter(doc => doc.url);

    if (documents.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Documents</Text>
        {documents.map((doc, index) => (
          <View key={index} style={styles.documentItem}>
            <View style={styles.documentInfo}>
              <Text style={styles.documentLabel}>{doc.label}</Text>
              {doc.number && (
                <Text style={styles.documentNumber}>{doc.number}</Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.viewDocButton}
              onPress={() => {
                const fullUrl = getFullImageUrl(doc.url);
                if (fullUrl) {
                  setSelectedDocument({url: fullUrl, label: doc.label});
                }
              }}
            >
              <Ionicons name="eye-outline" size={20} color="#3b82f6" />
              <Text style={styles.viewDocText}>View</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading shop details...</Text>
      </View>
    );
  }

  if (!shop) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Shop not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
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
          <Text style={styles.headerTitle}>Shop Details</Text>
          <View style={styles.placeholder} />
        </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Shop Header Card */}
        <View style={styles.shopCard}>
          <View style={styles.shopHeader}>
            <View style={styles.shopInfo}>
              <Text style={styles.shopName}>{shop.name}</Text>
              <Text style={styles.ownerName}>{shop.owner_name}</Text>
              <Text style={styles.location}>{shop.location}</Text>
            </View>
            <View style={styles.customerNumber}>
              <Text style={styles.customerNumberLabel}>Customer #</Text>
              <Text style={styles.customerNumberValue}>
                {shop.customer_serial_number || 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.contactRow}>
            <View style={styles.contactInfo}>
              <Ionicons name="call-outline" size={20} color="#6b7280" />
              <Text style={styles.contactText}>{shop.mobileNumber || 'Not provided'}</Text>
            </View>
            {shop.mobileNumber && (
              <TouchableOpacity
                style={styles.callButton}
                onPress={() => handleCall(shop.mobileNumber!)}
              >
                <Ionicons name="call" size={16} color="#fff" />
                <Text style={styles.callButtonText}>Call</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Personal Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Details</Text>
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Father's Name</Text>
              <Text style={styles.detailValue}>{shop.father_name || 'Not provided'}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Date of Birth</Text>
              <Text style={styles.detailValue}>{shop.date_of_birth || 'Not provided'}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Company Name</Text>
              <Text style={styles.detailValue}>{shop.companyName || 'Not provided'}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Renewal Count</Text>
              <Text style={styles.detailValue}>{shop.renewal_counter || 1}</Text>
            </View>
          </View>
        </View>

        {/* Addresses */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Addresses</Text>
          
          {shop.shopAddress && (
            <View style={styles.addressCard}>
              <Text style={styles.addressType}>Shop Address</Text>
              <Text style={styles.addressText}>{shop.shopAddress}</Text>
              {shop.shopPinCode && (
                <Text style={styles.pinCode}>PIN: {shop.shopPinCode}</Text>
              )}
              {shop.gpsLocationShop && (
                <TouchableOpacity 
                  style={styles.locationButton}
                  onPress={() => handleLocation(shop.gpsLocationShop!)}
                >
                  <Ionicons name="location-outline" size={16} color="#3b82f6" />
                  <Text style={styles.locationText}>View on Map</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {shop.residenceAddress && (
            <View style={styles.addressCard}>
              <Text style={styles.addressType}>Residence Address</Text>
              <Text style={styles.addressText}>{shop.residenceAddress}</Text>
              {shop.residencePinCode && (
                <Text style={styles.pinCode}>PIN: {shop.residencePinCode}</Text>
              )}
              {shop.gpsLocationHome && (
                <TouchableOpacity 
                  style={styles.locationButton}
                  onPress={() => handleLocation(shop.gpsLocationHome!)}
                >
                  <Ionicons name="location-outline" size={16} color="#3b82f6" />
                  <Text style={styles.locationText}>View on Map</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Reference Information */}
        {(shop.newMemberName || shop.newMemberAddress || shop.intendedName) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reference Information</Text>
            <View style={styles.detailsGrid}>
              {shop.newMemberName && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Reference Name</Text>
                  <Text style={styles.detailValue}>{shop.newMemberName}</Text>
                </View>
              )}
              {shop.newMemberAddress && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Reference Contact</Text>
                  <Text style={styles.detailValue}>{shop.newMemberAddress}</Text>
                </View>
              )}
              {shop.intendedName && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Relationship</Text>
                  <Text style={styles.detailValue}>{shop.intendedName}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Photo Gallery */}
        {renderPhotoGallery()}

        {/* Documents */}
        {renderDocumentSection()}

        {/* Agent Information */}
        {shop.agent && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Assigned Agent</Text>
            <View style={styles.agentCard}>
              <View style={styles.agentInfo}>
                <Text style={styles.agentName}>{shop.agent.name}</Text>
                <Text style={styles.agentEmail}>{shop.agent.email}</Text>
                <Text style={styles.agentLocation}>{shop.agent.location}</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Document Modal */}
      <Modal
        visible={!!selectedDocument}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedDocument(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedDocument?.label}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSelectedDocument(null)}
              >
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            <View style={styles.imageContainer}>
              {selectedDocument && (
                <Image
                  source={{ uri: selectedDocument.url }}
                  style={styles.fullScreenImage}
                  resizeMode="contain"
                />
              )}
            </View>
          </View>
        </View>
      </Modal>
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
    backgroundColor: '#f8fafc',
  },
  errorText: {
    fontSize: 18,
    color: '#ef4444',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backBtn: {
    padding: 8,
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
  shopCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  shopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  shopInfo: {
    flex: 1,
  },
  shopName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  ownerName: {
    fontSize: 18,
    color: '#6b7280',
    marginBottom: 4,
  },
  location: {
    fontSize: 16,
    color: '#9ca3af',
  },
  customerNumber: {
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
  },
  customerNumberLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  customerNumberValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contactText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 8,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  callButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  detailsGrid: {
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  addressCard: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  addressType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  pinCode: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  photoSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  shopPhoto: {
    width: width - 72,
    height: 200,
    borderRadius: 8,
    marginRight: 8,
  },
  photoIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    gap: 6,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d1d5db',
  },
  activeIndicator: {
    backgroundColor: '#3b82f6',
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  documentInfo: {
    flex: 1,
  },
  documentLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  documentNumber: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  viewDocButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  viewDocText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '500',
  },
  agentCard: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
  },
  agentInfo: {
    gap: 4,
  },
  agentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  agentEmail: {
    fontSize: 14,
    color: '#6b7280',
  },
  agentLocation: {
    fontSize: 14,
    color: '#9ca3af',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  closeButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
});

export default ShopDetail;