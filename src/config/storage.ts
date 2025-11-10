import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const secureStorage = {
  getItemAsync: async (key: string) => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('SecureStore getItemAsync error:', error);
      return null;
    }
  },
  setItemAsync: async (key: string, value: string) => {
    try {
      await SecureStore.setItemAsync(key, value);
      return true;
    } catch (error) {
      console.error('SecureStore setItemAsync error:', error);
      return false;
    }
  },
  deleteItemAsync: async (key: string) => {
    try {
      await SecureStore.deleteItemAsync(key);
      return true;
    } catch (error) {
      console.error('SecureStore deleteItemAsync error:', error);
      return false;
    }
  },
};

export const Storage = {
  get: async (key: string, secure = false) => {
    return secure ? secureStorage.getItemAsync(key) : AsyncStorage.getItem(key);
  },
  set: async (key: string, value: string, secure = false) => {
    return secure 
      ? secureStorage.setItemAsync(key, value)
      : AsyncStorage.setItem(key, value);
  },
  remove: async (key: string, secure = false) => {
    return secure 
      ? secureStorage.deleteItemAsync(key)
      : AsyncStorage.removeItem(key);
  },
};
