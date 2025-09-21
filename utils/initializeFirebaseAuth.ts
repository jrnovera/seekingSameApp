import { getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { app } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';

/**
 * Initialize Firebase Auth with manual AsyncStorage persistence for React Native
 * This function should be called early in your app's lifecycle
 * (e.g., in App.tsx or index.js before rendering)
 */
export function initializeFirebaseAuth() {
  // Get the standard auth instance
  const auth = getAuth(app);
  
  // Set up a listener to manually persist auth state changes to AsyncStorage
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (user) {
      // User is signed in, save to AsyncStorage
      try {
        const userData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        };
        await AsyncStorage.setItem('firebase_auth_user', JSON.stringify(userData));
        console.log('User restored from AsyncStorage:', user.email);
      } catch (error) {
        console.error('Error saving auth state to AsyncStorage:', error);
      }
    } else {
      // User is signed out, clear from AsyncStorage
      try {
        await AsyncStorage.removeItem('firebase_auth_user');
        console.log('Firebase auth state removed from AsyncStorage');
      } catch (error) {
        console.error('Error removing auth state from AsyncStorage:', error);
      }
    }
  });
  
  // Return both auth and unsubscribe function
  return { auth, unsubscribe };
}
