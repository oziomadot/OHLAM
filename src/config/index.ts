// src/config/index.ts
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Cross-platform storage helper
 */
const Storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return await SecureStore.getItemAsync(key);
  },

  async setItem(key: string, value: string) {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },

  async removeItem(key: string) {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },
};

// Base URL is configurable via env. Example: EXPO_PUBLIC_API_URL=https://xxxx.ngrok-free.app/api
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ||  'https://opaam.onrender.com/api';


const API = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 
    "Content-Type": "application/json",
    "Accept": 'application/json' 
  },
  timeout: 10000,
});

// Attach token automatically if exists
API.interceptors.request.use(async (config) => {
  const token = await Storage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;

/**
 * API functions
 */
export const login = async (email: string, password: string) => {
  const res = await API.post('/login', { email, password });
  const { token } = res.data;

  if (token) {
    await Storage.setItem('authToken', token);
  }

  return res.data;
};

export const logout = async () => {
  await Storage.removeItem('authToken');
};

export const sendLocation = async (latitude: number, longitude: number) => {
  const token = await Storage.getItem('authToken');
  if (!token) throw new Error('No auth token found');

  const res = await API.post(
    '/location',
    { latitude, longitude },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  return res.data;
};

// Response interceptor: detect HTML/ngrok error pages and surface a clear error
API.interceptors.response.use(
  (response) => {
    const ct = response.headers?.['content-type'] as string | undefined;
    const body = response.data;
    if ((typeof body === 'string' && /<\s*html/i.test(body)) || (ct && ct.includes('text/html'))) {
      return Promise.reject({
        message: 'Received HTML from API. Your tunnel/back-end may be down or misconfigured.',
        response,
      });
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const APP_NAME = "OHLAM";
export const APP_VERSION = "1.0.0";
