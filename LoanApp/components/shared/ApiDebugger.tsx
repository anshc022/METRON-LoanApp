import React, { useState, useEffect } from 'react';
import { View, Text, Button, ScrollView, StyleSheet } from 'react-native';
import { apiService } from '../../services/apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ApiDebugger: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<string>('');

  const testApiCalls = async () => {
    try {
      setDebugInfo('Testing API calls...\n');
      
      // Get user info
      const userData = await AsyncStorage.getItem('userData');
      const userRole = await AsyncStorage.getItem('userRole');
      const token = await AsyncStorage.getItem('authToken');
      
      let info = `=== STORED DATA ===\n`;
      info += `User Data: ${userData}\n`;
      info += `User Role (AsyncStorage): ${userRole}\n`;
      info += `Token: ${token ? token.substring(0, 20) + '...' : 'Missing'}\n\n`;
      
      if (userData) {
        const user = JSON.parse(userData);
        info += `=== PARSED USER DATA ===\n`;
        info += `User ID: ${user.id}\n`;
        info += `User Name: ${user.name}\n`;
        info += `User Email: ${user.email}\n`;
        info += `User Role (from userData): ${user.role}\n\n`;
        
        // Decode JWT token to see what's in it
        if (token) {
          try {
            const base64Payload = token.split('.')[1];
            const payload = JSON.parse(atob(base64Payload));
            info += `=== JWT TOKEN PAYLOAD ===\n`;
            info += `Token User ID: ${payload.id}\n`;
            info += `Token Role: ${payload.role}\n`;
            info += `Token Issued At: ${new Date(payload.iat * 1000).toLocaleString()}\n`;
            info += `Token Expires At: ${new Date(payload.exp * 1000).toLocaleString()}\n\n`;
          } catch (e) {
            info += `JWT Decode Error: ${e}\n\n`;
          }
        }
      }
      
      // Test getting shops
      try {
        info += `Calling apiService.getAgentShops()...\n`;
        const shops = await apiService.getAgentShops();
        info += `Agent Shops Count: ${shops.length}\n`;
        info += `Agent Shops: ${JSON.stringify(shops, null, 2)}\n\n`;
        
        if (shops.length > 0) {
          const firstShopId = shops[0].id;
          info += `Testing shop detail for ID: ${firstShopId}\n`;
          
          try {
            const shopDetail = await apiService.getShopById(firstShopId);
            info += `Shop Detail SUCCESS: ${JSON.stringify(shopDetail, null, 2)}\n`;
          } catch (error: any) {
            info += `Shop Detail ERROR: ${error.message}\n`;
            info += `Status: ${error.response?.status}\n`;
            info += `Response: ${JSON.stringify(error.response?.data, null, 2)}\n`;
          }
        } else {
          info += `No shops found - trying with shop ID 1 as test...\n`;
          try {
            const shopDetail = await apiService.getShopById(1);
            info += `Test Shop Detail (ID 1): ${JSON.stringify(shopDetail, null, 2)}\n`;
          } catch (error: any) {
            info += `Test Shop Detail Error (ID 1): ${error.message}\n`;
            info += `Status: ${error.response?.status}\n`;
            info += `Response: ${JSON.stringify(error.response?.data, null, 2)}\n`;
          }
        }
      } catch (error: any) {
        info += `Agent Shops Error: ${error.message}\n`;
        info += `Status: ${error.response?.status}\n`;
        info += `Response: ${JSON.stringify(error.response?.data, null, 2)}\n`;
      }
      
      setDebugInfo(info);
    } catch (error: any) {
      setDebugInfo(`Debug Error: ${error.message}`);
    }
  };

  useEffect(() => {
    testApiCalls();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>API Debug Information</Text>
      <Button title="Refresh" onPress={testApiCalls} />
      <Text style={styles.debugText}>{debugInfo}</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  debugText: {
    fontFamily: 'monospace',
    fontSize: 12,
    backgroundColor: '#000',
    color: '#0f0',
    padding: 10,
    marginTop: 10,
  },
});

export default ApiDebugger;