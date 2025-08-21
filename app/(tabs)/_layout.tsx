// app/(tabs)/_layout.tsx
import { useDarkMode } from "@/contexts/DarkModeContext";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform, View } from "react-native";

function PlusIcon({ focused }: { focused: boolean }) {
  return (
    <View
      style={{
        top: -18,
        backgroundColor: "#FDBA74",
        borderRadius: 36,
        width: 56,
        height: 56,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
        borderWidth: focused ? 2 : 0,
        borderColor: focused ? "#fff" : "transparent",
      }}
    >
      <Ionicons name="add" size={32} color="#111827" />
    </View>
  );
}

export default function TabsLayout() {
  const { isDarkMode } = useDarkMode();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#FDBA74",
        tabBarInactiveTintColor: isDarkMode ? "#9CA3AF" : "#6B7280",
        tabBarShowLabel: true,
        tabBarStyle: Platform.select({
          ios: {
            position: "absolute",
            backgroundColor: isDarkMode ? "#1F2937" : "#fff",
            borderTopWidth: 0.5,
            borderTopColor: isDarkMode ? "#374151" : "#e5e7eb",
            height: 70,
            paddingBottom: 16,
            paddingTop: 8,
            shadowColor: "#000",
            shadowOpacity: isDarkMode ? 0.15 : 0.06,
            shadowRadius: 8,
          },
          android: {
            backgroundColor: isDarkMode ? "#1F2937" : "#fff",
            borderTopWidth: 0.5,
            borderTopColor: isDarkMode ? "#374151" : "#e5e7eb",
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
            elevation: 8,
          },
          default: {},
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "",
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={30} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          tabBarLabel: "",
          tabBarIcon: ({ focused }) => <PlusIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "",
          tabBarIcon: ({ color }) => (
            <Ionicons name="person" size={30} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
