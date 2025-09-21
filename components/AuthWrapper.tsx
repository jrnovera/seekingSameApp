import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { subscribeToAuthState } from '../services/authHelpers';
import { User } from 'firebase/auth';

interface AuthWrapperProps {
  children: React.ReactNode;
}

const AuthWrapper = ({ children }: AuthWrapperProps) => {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = subscribeToAuthState((user: User | null) => {
      setIsAuthenticated(!!user);
      setIsLoading(false);
      setIsHydrated(true);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isHydrated) return; // Wait for hydration to complete

    if (!isAuthenticated) {
      // User is not authenticated, redirect to login
      // Use requestAnimationFrame to ensure navigation happens after layout is ready
      requestAnimationFrame(() => {
        try {
          router.replace('/sign-in');
        } catch (error) {
          console.error('Auth wrapper navigation error:', error);
        }
      });
    }
  }, [isAuthenticated, isHydrated, router]);

  // Show loading spinner while checking authentication
  if (!isHydrated || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4B50E6" />
      </View>
    );
  }

  // If not authenticated, don't render children (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  // User is authenticated, render children
  return <>{children}</>;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});

export default AuthWrapper;
