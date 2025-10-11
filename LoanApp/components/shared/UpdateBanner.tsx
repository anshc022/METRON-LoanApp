import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Alert } from 'react-native';
import { useUpdateChecker } from '../../hooks/useUpdateChecker';

export const UpdateBanner: React.FC = () => {
  const { updateAvailable, updateInfo } = useUpdateChecker();

  const handleUpdatePress = async () => {
    if (!updateInfo?.downloadUrl) return;

    try {
      const supported = await Linking.canOpenURL(updateInfo.downloadUrl);
      if (supported) {
        await Linking.openURL(updateInfo.downloadUrl);
      } else {
        Alert.alert(
          'Update Available', 
          `Please download the latest version (${updateInfo.latestVersion}) from your admin.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to open download link');
    }
  };

  if (!updateAvailable || !updateInfo) {
    return null;
  }

  return (
    <View style={styles.banner}>
      <View style={styles.content}>
        <Text style={styles.title}>Update Available</Text>
        <Text style={styles.subtitle}>
          Version {updateInfo.latestVersion} is now available
        </Text>
      </View>
      <TouchableOpacity style={styles.button} onPress={handleUpdatePress}>
        <Text style={styles.buttonText}>Download</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    margin: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flex: 1,
  },
  title: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    color: '#e0f2fe',
    fontSize: 14,
    marginTop: 2,
  },
  button: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  buttonText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
  },
});