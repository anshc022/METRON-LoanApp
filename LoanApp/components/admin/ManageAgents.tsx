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
  Modal,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiService, Agent, Location } from '../../services/apiService';
import { FormInput } from '../shared/FormInput';
import { LoadingButton } from '../shared/LoadingButton';
import { useToast } from '../shared/Toast';

interface ManageAgentsProps {
  onBack: () => void;
}

const ManageAgents: React.FC<ManageAgentsProps> = ({ onBack }) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', location: '' });
  const [editFormData, setEditFormData] = useState({ name: '', email: '', location: '' });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [editErrors, setEditErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rowLoading, setRowLoading] = useState<{ [id: number]: boolean }>({});
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showEditLocationDropdown, setShowEditLocationDropdown] = useState(false);
  // const { showToast } = useToast();
  const modalAnimation = new Animated.Value(0);

  // Validation functions
  const validateForm = (data: typeof formData): { [key: string]: string } => {
    const errors: { [key: string]: string } = {};
    
    if (!data.name.trim()) {
      errors.name = 'Name is required';
    } else if (data.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }
    
    if (!data.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!data.password.trim()) {
      errors.password = 'Password is required';
    } else if (data.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    if (!data.location.trim()) {
      errors.location = 'Location is required';
    }
    
    return errors;
  };

  const validateEditForm = (data: typeof editFormData): { [key: string]: string } => {
    const errors: { [key: string]: string } = {};
    
    if (!data.name.trim()) {
      errors.name = 'Name is required';
    } else if (data.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }
    
    if (!data.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!data.location.trim()) {
      errors.location = 'Location is required';
    }
    
    return errors;
  };

  // Animation for modals
  const animateModal = (toValue: number) => {
    Animated.spring(modalAnimation, {
      toValue,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const fetchAgents = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await apiService.getAllAgents();
      setAgents(response);
      
      if (isRefresh) {
        // Alert.alert('Success', 'Agents list refreshed');
      }
    } catch (error: any) {
      console.error('Error fetching agents:', error);
      const errorMessage = error?.response?.data?.message || error.message || 'Failed to load agents';
      Alert.alert('Error', 'Failed to load agents: ' + errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAgents();
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await apiService.getAllLocations();
      setLocations(response);
    } catch (error: any) {
      console.error('Error fetching locations:', error);
      Alert.alert('Error', 'Failed to load locations');
    }
  };

  const onRefresh = () => {
    fetchAgents(true);
  };

  const handleAddAgent = async () => {
    const errors = validateForm(formData);
    setFormErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      Alert.alert('Validation Error', 'Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiService.createAgent(formData);
      setFormData({ name: '', email: '', password: '', location: '' });
      setFormErrors({});
      setIsAddModalOpen(false);
      fetchAgents();
      Alert.alert('Success', 'Agent created successfully!');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to create agent: ' + (error?.response?.data?.message || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAddModal = () => {
    console.log('Opening add modal...');
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    setFormData({ name: '', email: '', password: '', location: '' });
    setFormErrors({});
    setShowLocationDropdown(false);
    setIsAddModalOpen(false);
  };

  const openEditModal = (agent: Agent) => {
    setSelectedAgent(agent);
    setEditFormData({ name: agent.name, email: agent.email, location: agent.location });
    setEditErrors({});
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditFormData({ name: '', email: '', location: '' });
    setEditErrors({});
    setSelectedAgent(null);
    setShowEditLocationDropdown(false);
    setIsEditModalOpen(false);
  };

  const handleEditAgent = async () => {
    if (!selectedAgent) return;
    const editingId = selectedAgent.id;
    
    const errors = validateEditForm(editFormData);
    setEditErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      Alert.alert('Validation Error', 'Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);
    try {
      setRowLoading(prev => ({ ...prev, [editingId]: true }));
      await apiService.updateAgent(editingId, editFormData);
      setEditFormData({ name: '', email: '', location: '' });
      setEditErrors({});
      setIsEditModalOpen(false);
      setSelectedAgent(null);
      fetchAgents();
      Alert.alert('Success', 'Agent updated successfully!');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to update agent: ' + (error?.response?.data?.message || error.message));
    } finally {
      setIsSubmitting(false);
      setRowLoading(prev => ({ ...prev, [editingId]: false }));
    }
  };

  const handleDeleteAgent = async (agentId: number) => {
    Alert.alert(
      'Delete Agent', 
      'Are you sure you want to delete this agent? This action cannot be undone.', 
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            try {
              setRowLoading(prev => ({ ...prev, [agentId]: true }));
              await apiService.deleteAgent(agentId);
              fetchAgents();
              Alert.alert('Success', 'Agent deleted successfully');
            } catch (error: any) {
              Alert.alert('Error', 'Failed to delete agent: ' + (error?.response?.data?.message || error.message));
            } finally {
              setRowLoading(prev => ({ ...prev, [agentId]: false }));
            }
          }
        }
      ]
    );
  };

  const handleToggleActive = async (agent: Agent) => {
    try {
      setRowLoading(prev => ({ ...prev, [agent.id]: true }));
      if (agent.isActive || agent.status === 'active') {
        await apiService.deactivateAgent(agent.id);
        Alert.alert('Success', 'Agent deactivated successfully');
      } else {
        await apiService.activateAgent(agent.id);
        Alert.alert('Success', 'Agent activated successfully');
      }
      fetchAgents();
    } catch (error: any) {
      Alert.alert('Error', 'Failed to update agent status: ' + (error?.response?.data?.message || error.message));
    }
    finally {
      setRowLoading(prev => ({ ...prev, [agent.id]: false }));
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading agents...</Text>
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
          <TouchableOpacity style={styles.backButton} onPress={() => {
            console.log('Back button pressed');
            onBack();
          }}>
            <Ionicons name="arrow-back" size={24} color="#1f2937" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Manage Agents</Text>
            <Text style={styles.headerSubtitle}>{agents.length} Total Agents</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={() => {
            console.log('Add button pressed');
            openAddModal();
          }}>
            <Ionicons name="add" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{agents.filter(a => (a.isActive || a.status === 'active')).length}</Text>
              <Text style={styles.statLabel}>Active Agents</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{agents.filter(a => !(a.isActive || a.status === 'active')).length}</Text>
              <Text style={styles.statLabel}>Inactive Agents</Text>
            </View>
          </View>
        </View>

        {/* Agents List */}
        <View style={styles.listContainer}>
          <Text style={styles.sectionTitle}>All Agents</Text>
          {agents.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="person-add-outline" size={40} color="#9ca3af" />
              <Text style={styles.emptyTitle}>No agents yet</Text>
              <Text style={styles.emptySubtitle}>Tap + to add your first agent</Text>
            </View>
          )}
          {agents.map((agent) => (
            <View key={agent.id} style={styles.agentCard}>
              <View style={styles.agentInfo}>
                <View style={styles.agentHeader}>
                  <Text style={styles.agentName}>{agent.name}</Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: (agent.isActive || agent.status === 'active') ? '#10b981' : '#ef4444' }
                  ]}>
                    <Text style={styles.statusText}>{(agent.isActive || agent.status === 'active') ? 'active' : 'inactive'}</Text>
                  </View>
                </View>
                <Text style={styles.agentEmail}>{agent.email}{agent.phone ? ` • ${agent.phone}` : ''}</Text>
                <Text style={styles.agentLocation}>📍 {agent.location}</Text>
                <Text style={styles.agentDate}>Joined: {new Date(agent.created_at).toLocaleDateString()}</Text>
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={[styles.actionPill, styles.editButton, rowLoading[agent.id] && { opacity: 0.5 }]}
                  onPress={() => !rowLoading[agent.id] && openEditModal(agent)}
                  disabled={!!rowLoading[agent.id]}
                >
                  <Ionicons name="pencil" size={16} color="#2563eb" />
                  <Text style={[styles.actionText, { color: '#2563eb' }]}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={[styles.actionPill, styles.deleteButton, rowLoading[agent.id] && { opacity: 0.5 }]}
                  onPress={() => !rowLoading[agent.id] && handleDeleteAgent(agent.id)}
                  disabled={!!rowLoading[agent.id]}
                >
                  <Ionicons name="trash" size={16} color="#dc2626" />
                  <Text style={[styles.actionText, { color: '#dc2626' }]}>Delete</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={[styles.actionPill, styles.toggleButton, rowLoading[agent.id] && { opacity: 0.5 }]}
                  onPress={() => !rowLoading[agent.id] && handleToggleActive(agent)}
                  disabled={!!rowLoading[agent.id]}
                >
                  {rowLoading[agent.id] ? (
                    <ActivityIndicator size={14} color="#059669" />
                  ) : (
                    <Ionicons name={(agent.isActive || agent.status === 'active') ? 'pause' : 'play'} size={16} color="#059669" />
                  )}
                  <Text style={[styles.actionText, { color: '#059669' }]}>{(agent.isActive || agent.status === 'active') ? 'Deactivate' : 'Activate'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Add Agent Modal */}
        {isAddModalOpen && (
          <Modal visible={true} animationType="slide" transparent>
            <TouchableOpacity 
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => {
                setShowLocationDropdown(false);
              }}
            >
              <TouchableOpacity 
                style={styles.modalCard}
                activeOpacity={1}
                onPress={() => {}}
              >
                <Text style={styles.modalTitle}>Add New Agent</Text>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Name</Text>
                  <TextInput
                    style={[styles.textInput, formErrors.name && styles.errorInput]}
                    value={formData.name}
                    onChangeText={(text: string) => setFormData({ ...formData, name: text })}
                    placeholder="Enter agent name"
                    placeholderTextColor="#9CA3AF"
                  />
                  {formErrors.name && <Text style={styles.errorText}>{formErrors.name}</Text>}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <TextInput
                    style={[styles.textInput, formErrors.email && styles.errorInput]}
                    value={formData.email}
                    onChangeText={(text: string) => setFormData({ ...formData, email: text })}
                    placeholder="Enter email address"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  {formErrors.email && <Text style={styles.errorText}>{formErrors.email}</Text>}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <TextInput
                    style={[styles.textInput, formErrors.password && styles.errorInput]}
                    value={formData.password}
                    onChangeText={(text: string) => setFormData({ ...formData, password: text })}
                    placeholder="Enter password"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry
                  />
                  {formErrors.password && <Text style={styles.errorText}>{formErrors.password}</Text>}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Location</Text>
                  <TouchableOpacity
                    style={[styles.textInput, styles.dropdownInput, formErrors.location && styles.errorInput]}
                    onPress={() => setShowLocationDropdown(!showLocationDropdown)}
                  >
                    <Text style={[styles.dropdownText, !formData.location && styles.placeholderText]}>
                      {formData.location || 'Select a location'}
                    </Text>
                    <Ionicons 
                      name={showLocationDropdown ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color="#6B7280" 
                    />
                  </TouchableOpacity>
                  
                  {showLocationDropdown && (
                    <View style={styles.dropdown}>
                      <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                        {locations.map((location) => (
                          <TouchableOpacity
                            key={location.id}
                            style={styles.dropdownItem}
                            onPress={() => {
                              setFormData({ ...formData, location: location.name });
                              setShowLocationDropdown(false);
                            }}
                          >
                            <Text style={styles.dropdownItemText}>
                              {location.name} ({location.city})
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                  
                  {formErrors.location && <Text style={styles.errorText}>{formErrors.location}</Text>}
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={closeAddModal}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.saveButton, isSubmitting && styles.disabledButton]}
                    onPress={handleAddAgent}
                    disabled={isSubmitting}
                  >
                    <Text style={styles.saveButtonText}>
                      {isSubmitting ? 'Adding...' : 'Add Agent'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </TouchableOpacity>
          </Modal>
        )}

        {/* Edit Agent Modal */}
        {isEditModalOpen && selectedAgent && (
          <Modal visible={true} animationType="slide" transparent>
            <TouchableOpacity 
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => {
                setShowEditLocationDropdown(false);
              }}
            >
              <TouchableOpacity 
                style={styles.modalCard}
                activeOpacity={1}
                onPress={() => {}}
              >
                <Text style={styles.modalTitle}>Edit Agent</Text>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Name</Text>
                  <TextInput
                    style={[styles.textInput, editErrors.name && styles.errorInput]}
                    value={editFormData.name}
                    onChangeText={(text: string) => setEditFormData({ ...editFormData, name: text })}
                    placeholder="Enter agent name"
                    placeholderTextColor="#9CA3AF"
                  />
                  {editErrors.name && <Text style={styles.errorText}>{editErrors.name}</Text>}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <TextInput
                    style={[styles.textInput, editErrors.email && styles.errorInput]}
                    value={editFormData.email}
                    onChangeText={(text: string) => setEditFormData({ ...editFormData, email: text })}
                    placeholder="Enter email address"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  {editErrors.email && <Text style={styles.errorText}>{editErrors.email}</Text>}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Location</Text>
                  <TouchableOpacity
                    style={[styles.textInput, styles.dropdownInput, editErrors.location && styles.errorInput]}
                    onPress={() => setShowEditLocationDropdown(!showEditLocationDropdown)}
                  >
                    <Text style={[styles.dropdownText, !editFormData.location && styles.placeholderText]}>
                      {editFormData.location || 'Select a location'}
                    </Text>
                    <Ionicons 
                      name={showEditLocationDropdown ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color="#6B7280" 
                    />
                  </TouchableOpacity>
                  
                  {showEditLocationDropdown && (
                    <View style={styles.dropdown}>
                      <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                        {locations.map((location) => (
                          <TouchableOpacity
                            key={location.id}
                            style={styles.dropdownItem}
                            onPress={() => {
                              setEditFormData({ ...editFormData, location: location.name });
                              setShowEditLocationDropdown(false);
                            }}
                          >
                            <Text style={styles.dropdownItemText}>
                              {location.name} ({location.city})
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                  
                  {editErrors.location && <Text style={styles.errorText}>{editErrors.location}</Text>}
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={closeEditModal}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.saveButton, isSubmitting && styles.disabledButton]}
                    onPress={handleEditAgent}
                    disabled={isSubmitting}
                  >
                    <Text style={styles.saveButtonText}>
                      {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </TouchableOpacity>
          </Modal>
        )}
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
  loadingText: { marginTop: 8, color: '#6b7280' },
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
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#3b82f6',
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
    gap: 12,
  },
  statCard: {
    flex: 1,
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
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  listContainer: {
    marginBottom: 24,
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  emptyTitle: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  emptySubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#6b7280',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  agentCard: {
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
  agentInfo: {
    flex: 1,
  },
  agentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  agentName: {
    fontSize: 16,
    fontWeight: '600',
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
  agentEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  agentLocation: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  agentDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  actionButtons: {
    flexDirection: 'column',
    gap: 8,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginLeft: 12,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#f9fafb',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  editButton: {
    backgroundColor: '#eff6ff',
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
  },
  toggleButton: { backgroundColor: '#ecfdf5' },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 20 
  },
  modalCard: { 
    backgroundColor: '#ffffff', 
    borderRadius: 16, 
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#111827', 
    marginBottom: 24,
    textAlign: 'center'
  },
  formRow: { 
    marginBottom: 16 
  },
  modalActions: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: 24,
    gap: 12,
  },
  modalBtn: { 
    flex: 1,
    borderRadius: 12,
  },
  // New simplified form styles
  inputContainer: {
    marginBottom: 20,
    position: 'relative',
    zIndex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#111827',
  },
  errorInput: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: '#3B82F6',
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Dropdown styles
  dropdownInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 16,
    color: '#111827',
    flex: 1,
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownList: {
    maxHeight: 180,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#111827',
  },
});

export default ManageAgents;