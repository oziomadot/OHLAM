// src/config/index.ts
import axios from 'axios';
import { Platform } from 'react-native';
import { Storage } from './storage'; // ✅ import your reusable helper

/**
 * API base configuration
 */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://3110f6bee8ca.ngrok-free.app/api';

const API = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 10000,
});

/**
 * Attach token automatically to every request
 */
API.interceptors.request.use(async (config) => {
  const token = await Storage.get('authToken', true); // ✅ secure retrieval
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * API Functions
 */
export const login = async (email: string, password: string) => {
  const res = await API.post('/login', { email, password });
  const { token } = res.data;

  if (token) {
    await Storage.set('authToken', token, true); // ✅ store securely
  }

  return res.data;
};

export const logout = async () => {
  await Storage.remove('authToken', true); // ✅ unified removal
};

export const sendLocation = async (latitude: number, longitude: number) => {
  const token = await Storage.get('authToken', true);
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

/**
 * Response interceptor: detect HTML/ngrok issues
 */
API.interceptors.response.use(
  (response) => {
    const ct = response.headers?.['content-type'];
    const body = response.data;
    if (
      (typeof body === 'string' && /<\s*html/i.test(body)) ||
      (ct && ct.includes('text/html'))
    ) {
      return Promise.reject({
        message:
          'Received HTML from API. Your tunnel/back-end may be down or misconfigured.',
        response,
      });
    }
    return response;
  },
  (error) => Promise.reject(error)
);

/**
 * App Metadata
 */
export const APP_NAME = 'OHLAM';
export const APP_VERSION = '1.0.0';

export default API;
