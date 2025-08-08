// app/_layout.tsx
import { Slot } from 'expo-router';
import { DarkModeProvider } from '@/contexts/DarkModeContext';
import { LocationProvider } from '@/contexts/LocationContext';
import { AuthProvider } from '@/contexts/AuthContext';
import '../contexts/i18n';
import { useEffect, useState } from 'react';
import { getSavedLanguage } from '../contexts/i18n';
import i18n from '../contexts/i18n';
import { ActivityIndicator, View } from 'react-native';

export default function RootLayout() {
  const [langReady, setLangReady] = useState(false);

  useEffect(() => {
    (async () => {
      const saved = await getSavedLanguage();
      if (saved && saved !== i18n.language) {
        await i18n.changeLanguage(saved);
      }
      setLangReady(true);
    })();
  }, []);

  if (!langReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
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
