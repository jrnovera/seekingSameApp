# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React Native Expo mobile application for rental property management, built with TypeScript and file-based routing. The app integrates with Firebase for backend services and Stripe for payment processing.

## Development Commands

```bash
# Start development server
npm start              # Start Expo development server
expo start             # Alias for npm start

# Platform-specific builds
npm run android        # Run on Android emulator
npm run ios            # Run on iOS simulator
npm run web            # Run in web browser

# Code quality
npm run lint           # Run ESLint with Expo config
npm run reset-project  # Reset to blank Expo project
```

## Tech Stack

- **Framework**: Expo 54.0.8 with React Native 0.81.4 and React 19.1.0
- **Navigation**: Expo Router (file-based routing with TypeScript typed routes)
- **State Management**: Dual approach - React Context + MobX + Zustand
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Payments**: Stripe React Native SDK
- **Maps**: React Native Maps with Google Maps API
- **Storage**: Expo SecureStore for tokens, AsyncStorage for user data
- **Styling**: React Native StyleSheet API

## Architecture

### File-Based Routing Structure

```
app/
├── (auth)/                # Authentication screens (sign-in, sign-up, forgot-password)
├── (tabs)/                # Main tab navigation (homepage, chat, favorites, settings)
├── property/              # Property screens ([id], details, reviews)
├── conversation/          # Chat conversation screens ([id], new)
├── host/                  # Host-specific features
├── payment-*.tsx          # Payment flow screens (processing, success, failed)
├── my-bookings.tsx        # Bookings management
├── notifications.tsx      # Notifications screen
├── profile.tsx            # User profile
├── viewlisting.tsx        # Property listings
└── _layout.tsx            # Root layout with auth setup
```

### State Management Strategy

The app uses three complementary state management approaches:

1. **React Context** (`contexts/AuthContext.tsx`): Primary authentication state
2. **MobX** (`data-stores/user-auth-store.ts`): Observable auth state
3. **Zustand** (`stores/mapStore.ts`): Map-related state

### Authentication & Persistence

**Critical Implementation Detail**: Firebase Auth persistence requires manual setup in React Native.

Key files:
- `config/firebase.ts`: Firebase initialization with React Native polyfills
- `utils/setupFirebaseAuth.ts`: Manual persistence implementation with AsyncStorage
- `utils/secureStorage.ts`: Expo SecureStore wrapper for auth tokens
- `app/_layout.tsx`: Initializes persistence via `setupFirebaseAuthPersistence()`
- `contexts/AuthContext.tsx`: Auth state management

The app implements a dual-storage strategy:
- **Expo SecureStore**: Stores auth tokens securely (hardware-backed)
- **AsyncStorage**: Stores user profile data for quick access

See `AUTH_PERSISTENCE_README.md` and `FIREBASE_AUTH_PERSISTENCE.md` for detailed documentation.

### Firebase Configuration

Environment variables use the `EXPO_PUBLIC_*` prefix for runtime access:
- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`
- `EXPO_PUBLIC_STRIPE_BACKEND_URL`

Firebase config includes React Native polyfills (`react-native-get-random-values`, `react-native-url-polyfill`) loaded in `config/firebase.ts`.

### Payment Integration

The app uses Stripe React Native SDK for mobile payments:

- Payment service: `services/paymentService.ts`
- Payment flow: `payment-processing.tsx` → `payment-success.tsx` | `payment-failed.tsx`
- Backend integration: Communicates with Stripe backend server via `EXPO_PUBLIC_STRIPE_BACKEND_URL`
- Web fallback: `utils/useWebBrowserPayment.ts` for platforms without native Stripe support

Payment workflow includes status polling to handle asynchronous payment completion.

### Key Services

- `services/authService.ts`: Authentication with token persistence
- `services/conversationService.ts`: Real-time chat functionality
- `services/favoriteService.ts`: Property favorites management
- `services/notificationService.ts`: Push notifications
- `services/paymentService.ts`: Stripe payment processing
- `services/propertyService.ts`: Property CRUD operations
- `services/reviewService.ts`: Property reviews and ratings
- `services/transactionService.ts`: Transaction management

### Components Organization

- **Auth Components**: `AuthGuard.tsx`, `AuthWrapper.tsx` for route protection
- **Map Components**: `MapPropertyView.tsx`, `PropertyMarker.tsx`, `PropertyInfoModal.tsx`
- **UI Components**: `components/ui/` for reusable themed components
- **Specialized Components**: `FilterModal.tsx`, `ReviewModal.tsx`, `floating-tab-bar.tsx`

### TypeScript Configuration

- Strict mode enabled
- Path alias: `@/*` maps to project root
- Expo Router typed routes enabled (`experiments.typedRoutes: true`)
- React Compiler experiments enabled (`experiments.reactCompiler: true`)

### Expo Configuration (app.json)

- **New Architecture**: Enabled (`newArchEnabled: true`)
- **Google Maps**: API key configured for both iOS and Android
- **Plugins**: expo-router, expo-splash-screen, expo-secure-store
- **Scheme**: `seekingsame://` for deep linking

## Common Patterns

### Authentication Flow

1. User authenticates via `(auth)/sign-in.tsx` or `(auth)/sign-up.tsx`
2. `authService.signIn()` creates Firebase session and stores tokens
3. `setupFirebaseAuthPersistence()` listener saves user data to AsyncStorage
4. `AuthContext` updates, triggering navigation to `(tabs)`
5. On app restart, `_layout.tsx` calls `setupFirebaseAuthPersistence()` which restores session

### Protected Routes

Use `AuthGuard` or `AuthWrapper` components to protect routes requiring authentication.

### Adding New Screens

1. Create file in appropriate `app/` subdirectory
2. Add screen to `app/_layout.tsx` Stack navigator
3. Use Expo Router's file-based navigation (`router.push('/screen-name')`)

### State Updates

- **Auth state**: Update via `AuthContext` methods
- **Map state**: Use Zustand store (`stores/mapStore.ts`)
- **Component state**: Use React hooks (`useState`, `useEffect`)

## Important Notes

- Always import React Native polyfills before Firebase imports
- Use `@/` path alias for absolute imports from project root
- Environment variables must use `EXPO_PUBLIC_*` prefix to be accessible at runtime
- Storage bucket domain normalization is handled in `config/firebase.ts` (console URL → SDK URL)
- Auth persistence setup in `_layout.tsx` is critical - do not remove
- The app uses Expo Router's typed routes - route strings are type-checked
