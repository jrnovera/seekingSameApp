import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../contexts/AuthContext';
import { setupFirebaseAuthPersistence } from '../utils/setupFirebaseAuth';

export const unstable_settings = {
  anchor: '(tabs)',
};

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // Set up Firebase Auth persistence when the app starts
  useEffect(() => {
    const unsubscribe = setupFirebaseAuthPersistence();
    
    // Hide splash screen after a short delay to ensure smooth transition
    const hideSplash = async () => {
      // Wait for a moment to ensure resources are loaded
      await new Promise(resolve => setTimeout(resolve, 1000));
      await SplashScreen.hideAsync();
    };
    
    hideSplash();
    
    return () => unsubscribe(); // Clean up listener when component unmounts
  }, []);

  return (
    <AuthProvider>
      <SafeAreaProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="property/details" options={{ headerShown: false }} />
            <Stack.Screen name="conversation/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="host/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="contact-support" options={{ headerShown: false }} />
            <Stack.Screen name="property/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="property/reviews" options={{ headerShown: false }} />
            <Stack.Screen name="profile" options={{ headerShown: false }} />
            <Stack.Screen name="payment-processing" options={{ headerShown: false }} />
            <Stack.Screen name="payment-success" options={{ headerShown: false }} />
            <Stack.Screen name="payment-failed" options={{ headerShown: false }} />
            <Stack.Screen name="viewlisting" options={{ headerShown: false }} />
            <Stack.Screen name="notifications" options={{headerShown: false}} />
            <Stack.Screen name="my-bookings" options={{headerShown: false}} />
            <Stack.Screen name="personal-information" options={{headerShown:false}} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </SafeAreaProvider>
    </AuthProvider>
  );
}
