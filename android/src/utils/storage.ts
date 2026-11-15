import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

class StorageAdapter {
  private secureAvailablePromise: Promise<boolean> | null = null;

  private async isSecureAvailable(): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    if (this.secureAvailablePromise === null) {
      this.secureAvailablePromise = SecureStore.isAvailableAsync().catch(() => false);
    }
    return this.secureAvailablePromise;
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      const canUseSecure = await this.isSecureAvailable();
      if (canUseSecure) {
        await SecureStore.setItemAsync(key, value);
        return;
      }
    } catch {
      // Fall through to AsyncStorage
    }
    await AsyncStorage.setItem(key, value);
  }

  async getItem(key: string): Promise<string | null> {
    try {
      const canUseSecure = await this.isSecureAvailable();
      if (canUseSecure) {
        const item = await SecureStore.getItemAsync(key);
        if (item !== null) return item;
      }
    } catch {
      // Fall through to AsyncStorage
    }
    return await AsyncStorage.getItem(key);
  }

  async removeItem(key: string): Promise<void> {
    try {
      const canUseSecure = await this.isSecureAvailable();
      if (canUseSecure) {
        await SecureStore.deleteItemAsync(key);
      }
    } catch {
      // Continue to AsyncStorage cleanup
    }
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      // Ignore cleanup error
    }
  }
}

export const appStorage = new StorageAdapter();

