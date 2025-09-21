import { userAuthStore } from '../data-stores/user-auth-store';
import { useRouter } from 'expo-router';
import { observer } from 'mobx-react-lite';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

interface AuthWrapperProps {
  children: React.ReactNode;
}

const AuthWrapper = observer(({ children }: AuthWrapperProps) => {
  const router = useRouter();
  const { isAuthenticated, isLoading, isHydrated } = userAuthStore;

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
});

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});

export default AuthWrapper;
