import { AuthProvider } from "@/contexts/AuthContext";
import { DarkModeProvider } from "@/contexts/DarkModeContext";
import { LocationProvider } from "@/contexts/LocationContext";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import "react-native-reanimated";
import i18n, { getSavedLanguage } from "../contexts/i18n";

// Import notification functions
import { setupNotificationListeners } from "@/services/notifications";

export default function RootLayout() {
  const [langReady, setLangReady] = useState(false);

  useEffect(() => {
    (async () => {
      const saved = await getSavedLanguage();
      const lang = saved ?? "zh";
      if (lang !== i18n.language) await i18n.changeLanguage(lang);
      setLangReady(true);
    })();
  }, []);

  // Setup notification listeners when app loads (registration handled after login)
  useEffect(() => {
    const subscription = setupNotificationListeners();
    return () => {
      subscription.remove();
    };
  }, []);

  if (!langReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#FDBA74" />
      </View>
    );
  }

  return (
    <AuthProvider>
      <DarkModeProvider>
        <LocationProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </LocationProvider>
      </DarkModeProvider>
    </AuthProvider>
  );
}
