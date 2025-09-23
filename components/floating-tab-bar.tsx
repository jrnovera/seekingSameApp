import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import * as React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const colorScheme = useColorScheme();
  const C = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  
  // Animation values for the background indicator
  const tabCount = state.routes.length;
  const containerWidth = width - 40; // Account for container margins
  const tabWidth = containerWidth / tabCount;
  const indicatorWidth = tabWidth - 16; // Smaller indicator to prevent overflow
  const translateX = useSharedValue(0);
  
  // Animated styles for the sliding indicator - simplified
  const indicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value }
      ],
      width: indicatorWidth, // Use calculated width to prevent overflow
    };
  });
  
  // Handle tab press with animation and haptic feedback - simplified and faster
  const handleTabPress = (index: number, isFocused: boolean) => {
    if (!isFocused) {
      // Trigger haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Calculate the center position for each tab
      const centerPosition = index * tabWidth + 8; // Centered position within each tab
      
      // Animate the indicator - faster animation
      translateX.value = withSpring(centerPosition, {
        damping: 20,  // Higher damping = less oscillation
        stiffness: 180, // Higher stiffness = faster animation
        mass: 0.6,     // Lower mass = faster animation
        overshootClamping: true // Prevent overshooting for faster settling
      });
    }
  };
  
  // Set initial position based on the active tab
  React.useEffect(() => {
    // Calculate the center position for the active tab
    translateX.value = state.index * tabWidth + 8; // Centered position
  }, []);
  
  return (
    <View style={[
      styles.container, 
      { 
        paddingBottom: Math.max(insets.bottom, 8),
        backgroundColor: 'transparent' 
      }
    ]}>
      <View style={[
        styles.tabBarContainer,
        { backgroundColor: C.surface, borderColor: C.surfaceBorder }
      ]}>
        {/* Background indicator */}
        <Animated.View 
          style={[
            styles.indicator, 
            { 
              backgroundColor: C.tint,
            },
            indicatorStyle
          ]} 
        />
        
        {/* Tab buttons */}
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.title || route.name;
          const isFocused = state.index === index;
          
          // Get the icon component from options
          const TabBarIcon = options.tabBarIcon;
          
          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });

                handleTabPress(index, isFocused);

                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              }}
              style={styles.tabButton}
            >
              <View style={[styles.tabContent, isFocused && styles.activeTabContent]}>
                {TabBarIcon && (
                  <TabBarIcon
                    focused={isFocused}
                    color={isFocused ? '#ffffff' : C.textMuted}
                    size={isFocused ? 26 : 24}
                  />
                )}
                <Text style={[
                  styles.tabLabel, 
                  { 
                    color: isFocused ? '#ffffff' : C.textMuted,
                    opacity: isFocused ? 1 : 0.7,
                    fontWeight: isFocused ? '700' : '500'
                  }
                ]}>
                  {label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 10,
    alignItems: 'center',
  },
  tabBarContainer: {
    flexDirection: 'row',
    height: 64,
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    position: 'relative',
    paddingHorizontal: 4,
  },
  indicator: {
    height: 50,
    position: 'absolute',
    top: 6, // Centered vertically in the 64px container
    borderRadius: 16,
    zIndex: 0,
    left: 3, // Fixed position from left with proper padding
  
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
   
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    width: '100%',
  },
  activeTabContent: {
    // No transform to keep it centered
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
});
