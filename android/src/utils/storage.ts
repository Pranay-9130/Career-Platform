import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

class StorageAdapter {
  private isSecureAvailable = false;

  constructor() {
    this.checkAvailability();
  }

  private async checkAvailability() {
    try {
      if (Platform.OS !== 'web') {
        this.isSecureAvailable = await SecureStore.isAvailableAsync();
      }
    } catch {
      this.isSecureAvailable = false;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (this.isSecureAvailable) {
        await SecureStore.setItemAsync(key, value);
      } else {
        await AsyncStorage.setItem(key, value);
      }
    } catch {
      await AsyncStorage.setItem(key, value);
    }
  }

  async getItem(key: string): Promise<string | null> {
    try {
      if (this.isSecureAvailable) {
        const item = await SecureStore.getItemAsync(key);
        if (item !== null) return item;
      }
      return await AsyncStorage.getItem(key);
    } catch {
      return await AsyncStorage.getItem(key);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      if (this.isSecureAvailable) {
        await SecureStore.deleteItemAsync(key);
      }
      await AsyncStorage.removeItem(key);
    } catch {
      await AsyncStorage.removeItem(key);
    }
  }
}

export const appStorage = new StorageAdapter();

