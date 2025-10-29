// mobile/services/api.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { router } from 'expo-router';

const API = axios.create({
  baseURL: 'http://192.168.1.4:5000/api', // ĐÃ SỬA ĐÚNG IP
});

// Helpful debugging: log failed requests (URL, method, status, response data)
API.interceptors.response.use(
  (res) => res,
  async (error) => {
    try {
      const cfg = error.config || {};
      const url = cfg.url || '<unknown url>';
      const method = cfg.method || '<unknown method>';
      const status = error.response?.status;
      const data = error.response?.data;
      console.error('[API ERROR]', method.toUpperCase(), url, 'status:', status, 'data:', data);

      // If unauthorized, clear stored session and redirect to login
      if (status === 401) {
        try {
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('user');
        } catch (e) {
          // ignore storage errors
        }
        // notify user and navigate to login
        Alert.alert('Phiên đã hết hạn', 'Vui lòng đăng nhập lại.');
        try {
          router.replace('/login');
        } catch (e) {
          // router may not be available in some contexts; ignore
        }
      }
    } catch (e) {
      console.error('[API ERROR] (reading error)', e);
    }
    return Promise.reject(error);
  }
);

// Attach token from AsyncStorage to every request if available
API.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      if (!config.headers) (config.headers as any) = {};
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // ignore
  }
  return config;
});

export const fetchUsers = () => API.get('/users');
export const fetchUserById = (id: string) => API.get(`/users/${id}`);
export const createUser = (data: any) => API.post('/users', data);
export const updateUser = (id: string, data: any) => API.put(`/users/${id}`, data);
export const deleteUser = (id: string) => API.delete(`/users/${id}`);

// Authentication helper
export const login = (payload: { email: string; password: string }) =>
  API.post('/users/login', payload);

export const socialLogin = (payload: { provider: string; email: string; username?: string; image?: string }) =>
  API.post('/users/social-login', payload);