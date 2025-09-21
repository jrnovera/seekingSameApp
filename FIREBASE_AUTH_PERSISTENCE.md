# Firebase Auth Persistence in React Native

## Overview

This document explains how we handle Firebase Authentication persistence in our React Native app. 

## The Issue

Firebase Auth normally handles persistence automatically, but in React Native environments, it requires explicit configuration. Without proper persistence, users would need to log in each time they restart the app.

The standard Firebase v12.2.1 error message is:

```
You are initializing Firebase Auth for React Native without providing AsyncStorage. Auth state will default to memory persistence and will not persist between sessions. In order to persist auth state, install the package "@react-native-async-storage/async-storage" and provide it to initializeAuth.
```

## Our Solution

We've implemented a hybrid approach to ensure authentication persistence:

1. **Standard Auth Initialization**: We use `getAuth()` to initialize Firebase Auth in `config/firebase.ts`
2. **Manual Persistence with AsyncStorage**: We implement manual persistence using `setupFirebaseAuthPersistence()` in the app's root layout
3. **Auth State Listener**: We listen to auth state changes and store user data in AsyncStorage

### Key Files

- `config/firebase.ts`: Standard Firebase initialization
- `utils/setupFirebaseAuth.ts`: Manual persistence implementation
- `app/_layout.tsx`: Sets up the persistence when the app starts
- `utils/secureStorage.ts`: Secure storage utilities for auth tokens and user data

### How It Works

1. When a user logs in, the `onAuthStateChanged` listener in `setupFirebaseAuthPersistence` detects the change
2. User data is saved to AsyncStorage
3. When the app restarts, the auth context checks AsyncStorage for existing user data
4. If found, the user remains logged in

## Alternative Approaches

For future reference, here are alternative approaches that might work with newer Firebase versions:

```typescript
// Using getReactNativePersistence (Firebase v9+)
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
```

## Troubleshooting

If authentication persistence issues occur:

1. Check AsyncStorage for the `firebase_auth_user` key
2. Verify the `setupFirebaseAuthPersistence` function is called in the app's entry point
3. Ensure the auth listener is properly set up and not being unsubscribed prematurely
