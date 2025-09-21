import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Simple utility to handle auth persistence manually
 * We'll use AsyncStorage directly instead of trying to configure Firebase Auth
 */

/**
 * Manually saves auth data to AsyncStorage
 * This is a backup mechanism in case the Firebase persistence doesn't work
 */
export async function saveAuthData(user: any) {
  if (!user) return;
  
  try {
    // Store minimal user data
    const userData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
    };
    
    await AsyncStorage.setItem('firebase_user', JSON.stringify(userData));
    console.log('Auth data saved to AsyncStorage');
  } catch (error) {
    console.error('Error saving auth data to AsyncStorage:', error);
  }
}

/**
 * Manually clears auth data from AsyncStorage
 */
export async function clearAuthData() {
  try {
    await AsyncStorage.removeItem('firebase_user');
    console.log('Auth data cleared from AsyncStorage');
  } catch (error) {
    console.error('Error clearing auth data from AsyncStorage:', error);
  }
}

/**
 * Manually gets auth data from AsyncStorage
 */
export async function getAuthData() {
  try {
    const userData = await AsyncStorage.getItem('firebase_user');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error getting auth data from AsyncStorage:', error);
    return null;
  }
}
