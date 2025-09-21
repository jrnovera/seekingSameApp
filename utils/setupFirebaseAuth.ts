import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';

/**
 * This function manually handles Firebase Auth persistence
 * by storing the auth state in AsyncStorage when it changes
 * 
 * For Firebase v12.2.1 with React Native, we need to manually handle
 * persistence since the built-in persistence mechanisms may not work correctly
 */
export function setupFirebaseAuthPersistence() {
  // Listen for auth state changes
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (user) {
      // User is signed in, save minimal user data to AsyncStorage
      try {
        const userData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        };
        await AsyncStorage.setItem('firebase_auth_user', JSON.stringify(userData));
        console.log('Firebase auth state saved to AsyncStorage');
      } catch (error) {
        console.error('Error saving auth state to AsyncStorage:', error);
      }
    } else {
      // User is signed out, remove data from AsyncStorage
      try {
        await AsyncStorage.removeItem('firebase_auth_user');
        console.log('Firebase auth state removed from AsyncStorage');
      } catch (error) {
        console.error('Error removing auth state from AsyncStorage:', error);
      }
    }
  });

  // Return unsubscribe function to stop listening when needed
  return unsubscribe;
}

/**
 * Retrieves the stored auth user data from AsyncStorage
 */
export async function getStoredAuthUser() {
  try {
    const userData = await AsyncStorage.getItem('firebase_auth_user');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error getting auth user from AsyncStorage:', error);
    return null;
  }
}

/**
 * Clears the stored auth user data from AsyncStorage
 */
export async function clearStoredAuthUser() {
  try {
    await AsyncStorage.removeItem('firebase_auth_user');
    console.log('Stored auth user cleared from AsyncStorage');
  } catch (error) {
    console.error('Error clearing auth user from AsyncStorage:', error);
  }
}
