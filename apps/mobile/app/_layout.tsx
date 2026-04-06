// ============================================
// Kaffza (قفزة) — Root App Layout
// RTL (Arabic) + Tajawal Font + Expo Router
// ============================================

import { useEffect } from 'react';
import { I18nManager } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Tajawal_400Regular,
  Tajawal_500Medium,
  Tajawal_700Bold,
} from '@expo-google-fonts/tajawal';
import * as SplashScreen from 'expo-splash-screen';
import * as Updates from 'expo-updates';
import { Colors } from '../src/constants/colors';

// Keep splash visible while fonts load
SplashScreen.preventAutoHideAsync();

// Apply RTL at module-load time so layout is correct before first render
if (!I18nManager.isRTL) {
  I18nManager.forceRTL(true);
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Tajawal_400Regular,
    Tajawal_500Medium,
    Tajawal_700Bold,
  });

  useEffect(() => {
    // If RTL state changed this session, reload the app bundle so React
    // Native can apply the direction change from the very first frame.
    if (!I18nManager.isRTL) {
      Updates.reloadAsync().catch(() => {
        // In dev / web, reloadAsync may not be available — ignore
      });
    }
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.text.inverse,
          headerTitleStyle: {
            fontFamily: 'Tajawal_700Bold',
            fontSize: 18,
          },
          headerTitleAlign: 'center',
          contentStyle: { backgroundColor: Colors.background },
          animation: 'slide_from_right',
        }}
      />
    </SafeAreaProvider>
  );
}
