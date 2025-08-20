// app/_layout.tsx
import "react-native-reanimated";

import { AuthProvider } from "@/contexts/AuthContext";
import { DarkModeProvider } from "@/contexts/DarkModeContext";
import { LocationProvider } from "@/contexts/LocationContext";
import { Slot } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import i18n, { getSavedLanguage } from "../contexts/i18n";

export default function RootLayout() {
  const [langReady, setLangReady] = useState(false);

  useEffect(() => {
    (async () => {
      const saved = await getSavedLanguage();
      const lang = saved ?? "zh"; // ✅ default to Chinese
      if (lang !== i18n.language) {
        await i18n.changeLanguage(lang);
      }
      setLangReady(true);
    })();
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
          <Slot />
        </LocationProvider>
      </DarkModeProvider>
    </AuthProvider>
  );
}
