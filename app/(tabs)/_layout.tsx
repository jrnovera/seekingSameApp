import { Tabs } from 'expo-router';
import React from 'react';

import AuthGuard from '@/components/AuthGuard';
import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const extraBottom = Math.max(insets.bottom, 12); // ensure at least 12px padding at bottom

  return (
    <AuthGuard>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#ffffff',
          tabBarInactiveTintColor: 'rgba(255,255,255,0.85)',
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarHideOnKeyboard: true,
          tabBarStyle: {
            backgroundColor: Colors[colorScheme ?? 'light'].tint,
            borderTopColor: 'transparent',
            // Increase height and add bottom padding so it clears Android nav bar
            height: 56 + extraBottom,
            paddingBottom: extraBottom,
            paddingTop: 6,
          },
          tabBarLabelStyle: {
            fontWeight: '600',
          },
        }}>
      <Tabs.Screen
        name="homepage"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={size ?? 24}
              color={focused ? '#ffffff' : 'rgba(255,255,255,0.7)'}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favorites',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "heart" : "heart-outline"}
              size={size ?? 24}
              color={focused ? '#ffffff' : 'rgba(255,255,255,0.7)'}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "chatbubble" : "chatbubble-outline"}
              size={size ?? 24}
              color={focused ? '#ffffff' : 'rgba(255,255,255,0.7)'}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "settings" : "settings-outline"}
              size={size ?? 24}
              color={focused ? '#ffffff' : 'rgba(255,255,255,0.7)'}
            />
          ),
        }}
      />
      </Tabs>
    </AuthGuard>
  );
}
