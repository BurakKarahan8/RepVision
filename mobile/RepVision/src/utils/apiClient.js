import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api'; 

export const authFetch = async (endpoint, options = {}) => {
  const token = await AsyncStorage.getItem('@auth_token');

  if (!token) {
    throw new Error('Authentication token not found. Please log in again.');
  }

  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  return fetch(`${API_URL}${endpoint}`, {
    ...options, 
    headers: {
      ...defaultHeaders,
      ...options.headers, 
    },
  });
};