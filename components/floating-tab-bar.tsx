import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import * as React from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const EDGE_OFFSET_RATIO = 0.5; // Shift edge tabs slightly for improved visual alignment
const COMMUNITY_OFFSET = 4; // Nudge community indicator left so it centers visually

export function FloatingTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const colorScheme = useColorScheme();
  const C = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();

  // Animation values for the background indicator
  const tabCount = state.routes.length;
  const containerWidth = width - 40; // Account for container margins
  const [measuredWidth, setMeasuredWidth] = React.useState(containerWidth);
  const tabWidth = React.useMemo(
    () => measuredWidth / tabCount,
    [measuredWidth, tabCount]
  );
  const indicatorWidthBase = React.useMemo(
    () => Math.max(tabWidth - 16, 0),
    [tabWidth]
  );
  const translateX = useSharedValue(0);
  const indicatorWidthValue = useSharedValue(indicatorWidthBase);
  const springConfig = React.useMemo(
    () => ({
      damping: 20,
      stiffness: 180,
      mass: 0.6,
      overshootClamping: true,
    }),
    []
  );

  const getIndicatorWidth = React.useCallback(
    (tabIndex: number) => {
      const baseWidth = indicatorWidthBase;

      if (!Number.isFinite(tabWidth) || tabWidth <= 0) {
        return baseWidth;
      }

      const route = state.routes[tabIndex];
      if (!route) {
        return baseWidth;
      }

      const descriptor = descriptors[route.key];
      const label = descriptor?.options?.title ?? route.name;

      if (label?.toLowerCase().includes("community")) {
        return Math.max(tabWidth - 4, 0);
      }

      return baseWidth;
    },
    [indicatorWidthBase, tabWidth, state.routes, descriptors]
  );

  const calculateIndicatorMetrics = React.useCallback(
    (tabIndex: number) => {
      if (!Number.isFinite(tabWidth) || tabWidth <= 0) {
        return { width: indicatorWidthBase, position: 0 };
      }

      const route = state.routes[tabIndex];
      const descriptor = route ? descriptors[route.key] : undefined;
      const label = descriptor?.options?.title ?? route?.name ?? "";

      const widthForTab = getIndicatorWidth(tabIndex);
      const inset = Math.max((tabWidth - widthForTab) / 2, 0);

      let edgeOffset = 0;
      if (tabIndex === 0) {
        edgeOffset = inset * EDGE_OFFSET_RATIO;
      } else if (tabIndex === tabCount - 1) {
        edgeOffset = -inset * EDGE_OFFSET_RATIO;
      }

      let labelOffset = 0;
      if (label.toLowerCase().includes("community")) {
        labelOffset = -COMMUNITY_OFFSET;
      }

      return {
        width: widthForTab,
        position: tabIndex * tabWidth + inset + edgeOffset + labelOffset,
      };
    },
    [
      tabWidth,
      indicatorWidthBase,
      getIndicatorWidth,
      tabCount,
      state.routes,
      descriptors,
    ]
  );

  // Animated styles for the sliding indicator - simplified
  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    width: indicatorWidthValue.value, // Use calculated width to prevent overflow
  }));

  // Handle tab press with animation and haptic feedback - simplified and faster
  const handleTabPress = (index: number, isFocused: boolean) => {
    if (!isFocused) {
      // Trigger haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const { position: targetPosition, width: targetWidth } =
        calculateIndicatorMetrics(index);

      indicatorWidthValue.value = withSpring(targetWidth, springConfig);
      translateX.value = withSpring(targetPosition, springConfig);
    }
  };

  // Set initial position based on the active tab
  React.useEffect(() => {
    const { position, width: targetWidth } = calculateIndicatorMetrics(
      state.index
    );
    translateX.value = position;
    indicatorWidthValue.value = targetWidth;
  }, [state.index, calculateIndicatorMetrics, translateX, indicatorWidthValue]);

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, 8),
          backgroundColor: "transparent",
        },
      ]}
    >
      <View
        style={[
          styles.tabBarContainer,
          { backgroundColor: C.surface, borderColor: C.surfaceBorder },
        ]}
        onLayout={({ nativeEvent }) => {
          const nextWidth = nativeEvent.layout.width;
          if (Math.abs(nextWidth - measuredWidth) > 0.5) {
            setMeasuredWidth(nextWidth);
          }
        }}
      >
        {/* Background indicator */}
        <Animated.View
          style={[
            styles.indicator,
            {
              backgroundColor: C.tint,
            },
            indicatorStyle,
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
                  type: "tabPress",
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
              <View
                style={[
                  styles.tabContent,
                  isFocused && styles.activeTabContent,
                ]}
              >
                {TabBarIcon && (
                  <TabBarIcon
                    focused={isFocused}
                    color={isFocused ? "#ffffff" : C.textMuted}
                    size={isFocused ? 26 : 24}
                  />
                )}
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: isFocused ? "#ffffff" : C.textMuted,
                      opacity: isFocused ? 1 : 0.7,
                      fontWeight: isFocused ? "700" : "500",
                    },
                  ]}
                >
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
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 10,
    alignItems: "center",
  },
  tabBarContainer: {
    flexDirection: "row",
    height: 64,
    width: "100%",
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    position: "relative",
    paddingHorizontal: 4,
  },
  indicator: {
    height: 50,
    position: "absolute",
    top: 6, // Centered vertically in the 64px container
    borderRadius: 16,
    zIndex: 0,
    left: 0,

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
  },
  tabButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tabContent: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    width: "100%",
  },
  activeTabContent: {
    // No transform to keep it centered
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: "600",
    marginTop: 2,
    textAlign: "center",
  },
});
