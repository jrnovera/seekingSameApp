// Import polyfills first for React Native compatibility
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration using Expo public env variables
// Note: Expo exposes only variables prefixed with EXPO_PUBLIC_ to the app at runtime
// Compute and normalize storage bucket
const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "seekingsame-80ee1";
const storageBucketEnv = process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "seekingsame-80ee1.appspot.com";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyAy3lwlcebC9YJs_EjObxllyhJovtDfRA0",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "seekingsame-80ee1.firebaseapp.com",
  projectId,
  storageBucket: storageBucketEnv,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "483463161228",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:483463161228:web:08b9e64a60b129813e62a9",
};

 console.log("Check firebase config", JSON.stringify(firebaseConfig, null, 2));

// Validate required config
if (!firebaseConfig.storageBucket) {
  console.error("Firebase Storage bucket is not configured!");
  console.error("EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET:", process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET);
}

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Firebase v9 modular API (preferred approach)

// Initialize Firebase Authentication with AsyncStorage persistence for React Native
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Firebase Storage and get a reference to the service
// console.log("Initializing Firebase Storage with bucket:", firebaseConfig.storageBucket);
// Use default storage instance associated to the app's configured bucket
const storage = getStorage(app);
export { storage };

export default app;
