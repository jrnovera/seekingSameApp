import * as SecureStore from 'expo-secure-store';

const AUTH_TOKEN_KEY = 'auth_token';
const USER_DATA_KEY = 'user_data';

export class SecureStorage {
  // Save authentication token
  static async saveAuthToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
    } catch (error) {
      console.error('Error saving auth token:', error);
      throw new Error('Failed to save authentication token');
    }
  }

  // Get authentication token
  static async getAuthToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  // Remove authentication token
  static async removeAuthToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
    } catch (error) {
      console.error('Error removing auth token:', error);
      throw new Error('Failed to remove authentication token');
    }
  }

  // Save user data
  static async saveUserData(userData: any): Promise<void> {
    try {
      await SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving user data:', error);
      throw new Error('Failed to save user data');
    }
  }

  // Get user data
  static async getUserData(): Promise<any | null> {
    try {
      const userData = await SecureStore.getItemAsync(USER_DATA_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  // Remove user data
  static async removeUserData(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(USER_DATA_KEY);
    } catch (error) {
      console.error('Error removing user data:', error);
      throw new Error('Failed to remove user data');
    }
  }

  // Clear all stored data
  static async clearAll(): Promise<void> {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(AUTH_TOKEN_KEY),
        SecureStore.deleteItemAsync(USER_DATA_KEY)
      ]);
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw new Error('Failed to clear stored data');
    }
  }

  // Check if user is authenticated (has valid token)
  static async isAuthenticated(): Promise<boolean> {
    try {
      const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
      return token !== null && token.length > 0;
    } catch (error) {
      console.error('Error checking authentication status:', error);
      return false;
    }
  }
}
