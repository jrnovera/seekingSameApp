import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { Colors } from '../constants/theme';
import { getStoredAuthUser } from '../utils/setupFirebaseAuth';

/**
 * Root entry point for the app
 * Redirects to homepage if user is authenticated, otherwise to sign-in
 */
export default function Index() {
  const { isAuthenticated, loading } = useAuth();

  // If still loading auth state, show a loading spinner
  if (loading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: Colors.light.screenBg 
      }}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  // Once loaded, redirect based on authentication status
  // This ensures we don't flash the login screen if already authenticated
  return isAuthenticated 
    ? <Redirect href="/(tabs)/homepage" /> 
    : <Redirect href="/sign-in" />;
}
