// import { Tabs } from 'expo-router';
// import React from 'react';
// import { Platform, View } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { useDarkMode } from '@/contexts/DarkModeContext';

// function CustomTabBarIcon({ focused, color, size }: { focused: boolean; color: string; size?: number }) {
//   return (
//     <View
//       style={{
//         top: -18,
//         backgroundColor: '#FDBA74',
//         borderRadius: 36,
//         width: 56,
//         height: 56,
//         justifyContent: 'center',
//         alignItems: 'center',
//         shadowColor: '#000',
//         shadowOpacity: 0.15,
//         shadowRadius: 8,
//         elevation: 8,
//         borderWidth: focused ? 2 : 0,
//         borderColor: focused ? '#fff' : 'transparent',
//       }}
//     >
//       <Ionicons name="add" size={32} color="#111827" />
//     </View>
//   );
// }

// function TabsContent() {
//   const { isDarkMode } = useDarkMode();

//   return (
//     <Tabs
//       screenOptions={{
//         tabBarActiveTintColor: '#FDBA74',
//         headerShown: false,
//         tabBarShowLabel: true,
//         tabBarStyle: Platform.select({
//           ios: {
//             position: 'absolute',
//             backgroundColor: isDarkMode ? '#1F2937' : '#fff',
//             borderTopWidth: 0.5,
//             borderTopColor: isDarkMode ? '#374151' : '#e5e7eb',
//             height: 70,
//             paddingBottom: 16,
//             paddingTop: 8,
//             shadowColor: '#000',
//             shadowOpacity: isDarkMode ? 0.15 : 0.06,
//             shadowRadius: 8,
//           },
//           android: {
//             backgroundColor: isDarkMode ? '#1F2937' : '#fff',
//             borderTopWidth: 0.5,
//             borderTopColor: isDarkMode ? '#374151' : '#e5e7eb',
//             height: 60,
//             paddingBottom: 8,
//             paddingTop: 8,
//             elevation: 8,
//           },
//           default: {},
//         }),
//         tabBarInactiveTintColor: isDarkMode ? '#9CA3AF' : '#6B7280',
//       }}
//     >
// <Tabs.Screen
//   name="index"
//   options={{
//     title: '',
//     tabBarIcon: ({ color }) => (
//       <Ionicons name="home" size={30} color={color} />
//     ),
//   }}
// />
// <Tabs.Screen
//   name="create"
//   options={{
//     tabBarLabel: '',
//     tabBarIcon: (props) => <CustomTabBarIcon {...props} />,
//   }}
// />
// <Tabs.Screen
//   name="profile"
//   options={{
//     title: '',
//     tabBarIcon: ({ color }) => (
//       <Ionicons name="person" size={30} color={color} />
//     ),
//   }}
// />

//     </Tabs>
//   );
// }

// export default function TabLayout() {
//   return (
//       <TabsContent />
//   );
// }
// app/(tabs)/_layout.tsx
import { useDarkMode } from "@/contexts/DarkModeContext";
import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Tabs } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  LayoutChangeEvent,
  Platform,
  Pressable,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ACTIVE_COLOR = "#FDBA74";
const BAR_SIDE_PAD = 24;
const { width: SCREEN_WIDTH } = Dimensions.get("window");

const CurvedTabBar: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
  const { isDarkMode } = useDarkMode();
  const insets = useSafeAreaInsets();

  const BAR_BG = isDarkMode ? "#1F2937" : "#FFFFFF";
  const OUTER_BG = isDarkMode ? "#111827" : "#FFFFFF";
  const INACTIVE = isDarkMode ? "#9CA3AF" : "#6B7280";

  const BAR_HEIGHT = Platform.select({ ios: 70, android: 60, default: 64 })!;
  const BUBBLE = 56;
  const BUBBLE_Y_OFFSET = 30;
  const NOTCH = 62;

  const [barWidth, setBarWidth] = useState(0);
  const contentWidth = Math.max(barWidth - BAR_SIDE_PAD * 2, 0);
  const segment =
    state.routes.length > 0 ? contentWidth / state.routes.length : 0;

  const x = useRef(new Animated.Value(0)).current;
  const swipeProgress = useRef(new Animated.Value(0)).current;

  const targetX = (index: number) =>
    BAR_SIDE_PAD + segment * index + segment / 2;

  const onBarLayout = (e: LayoutChangeEvent) =>
    setBarWidth(e.nativeEvent.layout.width);

  const ANIM_DURATION = 400;
  const ANIM_EASING = Easing.bezier(0.25, 0.46, 0.45, 0.94);

  const bubbleTranslateX = Animated.subtract(x, BUBBLE / 2);
  const notchTranslateX = Animated.subtract(x, NOTCH / 2);
  const ringTranslateX = Animated.subtract(x, (NOTCH + 8) / 2);

  useEffect(() => {
    if (barWidth > 0) {
      x.setValue(targetX(state.index));
    }
  }, [barWidth, contentWidth]);

  useEffect(() => {
    if (barWidth === 0) return;

    x.stopAnimation();

    Animated.sequence([
      Animated.timing(x, {
        toValue: targetX(state.index),
        duration: ANIM_DURATION,
        easing: ANIM_EASING,
        useNativeDriver: false,
      }),
      Animated.spring(x, {
        toValue: targetX(state.index),
        friction: 5,
        tension: 50,
        useNativeDriver: false,
      }),
    ]).start();
  }, [state.index, barWidth, segment]);

  const iconFor = (name: string) => {
    switch (name) {
      case "index":
        return "home";
      case "create":
        return "add";
      case "profile":
        return "person";
      default:
        return "ellipse";
    }
  };

  return (
    <View style={{ backgroundColor: OUTER_BG }}>
      <View style={{ height: BAR_HEIGHT + insets.bottom + 12 }} />
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingHorizontal: 16,
          paddingTop: 8,
        }}
      >
        {/* Rounded bar */}
        <View
          onLayout={onBarLayout}
          style={{
            height: BAR_HEIGHT,
            backgroundColor: BAR_BG,
            borderRadius: 24,
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: BAR_SIDE_PAD,
            borderTopWidth: 0.5,
            borderTopColor: isDarkMode ? "#374151" : "#e5e7eb",
            elevation: Platform.OS === "android" ? 8 : 0,
            shadowColor: "#000",
            shadowOpacity: isDarkMode ? 0.15 : 0.06,
            shadowRadius: 8,
          }}
        >
          {state.routes.map((route, i) => {
            const focused = state.index === i;
            const color = focused ? ACTIVE_COLOR : INACTIVE;
            const name = iconFor(route.name);

            const onPress = () => {
              const evt = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !evt.defaultPrevented) {
                navigation.navigate(route.name as never);
              }
            };

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                }}
              >
                <View style={{ opacity: focused ? 0 : 1 }}>
                  <Ionicons name={name as any} size={28} color={color} />
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Notch cutout */}
        {barWidth > 0 && (
          <Animated.View
            style={{
              position: "absolute",
              top: -BUBBLE / 2 + BUBBLE_Y_OFFSET,
              left: 16,
              transform: [{ translateX: notchTranslateX }],
              width: NOTCH,
              height: NOTCH,
              borderRadius: NOTCH / 2,
              backgroundColor: OUTER_BG,
            }}
            pointerEvents="none"
          />
        )}

        {/* Crisp inner ring */}
        {barWidth > 0 && (
          <Animated.View
            style={{
              position: "absolute",
              top: 8 - (NOTCH + 8) / 2 + BUBBLE_Y_OFFSET,
              left: 16,
              transform: [{ translateX: ringTranslateX }],
              width: NOTCH + 8,
              height: NOTCH + 8,
              borderRadius: (NOTCH + 8) / 2,
              backgroundColor: "transparent",
              borderWidth: 4,
              borderColor: BAR_BG,
            }}
            pointerEvents="none"
          />
        )}

        {/* Floating bubble */}
        {barWidth > 0 && (
          <Animated.View
            style={{
              position: "absolute",
              top: -BUBBLE / 2 + BUBBLE_Y_OFFSET,
              left: 16,
              transform: [{ translateX: bubbleTranslateX }],
              width: BUBBLE,
              height: BUBBLE,
              borderRadius: BUBBLE / 2,
              backgroundColor: ACTIVE_COLOR,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 8,
              borderWidth: 2,
              borderColor: OUTER_BG,
            }}
            pointerEvents="none"
          >
            <Ionicons
              name={iconFor(state.routes[state.index].name) as any}
              size={28}
              color={isDarkMode ? "#0B0F14" : "#111827"}
            />
          </Animated.View>
        )}
      </View>
    </View>
  );
};

// Custom transition configuration
const customTransition = {
  animation: "timing",
  config: {
    duration: 300,
    easing: Easing.out(Easing.poly(4)),
  },
};

// Alternative simpler version if above still causes issues
export default function TabLayout() {
  const { isDarkMode } = useDarkMode();
  const renderTabBar = (props: BottomTabBarProps) => (
    <CurvedTabBar {...props} />
  );

  return (
    <Tabs
      tabBar={renderTabBar}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE_COLOR,
        tabBarInactiveTintColor: isDarkMode ? "#9CA3AF" : "#6B7280",
        // Remove problematic animation configurations
        // animation: 'shift',
        // sceneStyle: {},
        // transitionSpec: {},
      }}
    >
      <Tabs.Screen name="index" options={{ title: "" }} />
      <Tabs.Screen name="create" options={{ title: "" }} />
      <Tabs.Screen name="profile" options={{ title: "" }} />
    </Tabs>
  );
}
