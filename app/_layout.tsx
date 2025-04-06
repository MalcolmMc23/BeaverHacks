import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

import { Colors } from '@/constants/Colors';
import { Onboarding } from '@/components/Onboarding';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Key for forcing a refresh
const FORCE_REFRESH_KEY = 'forceRefreshTimestamp';

export default function RootLayout() {
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const [refreshKey, setRefreshKey] = useState<string>('');
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const checkOnboardingStatus = async () => {
    try {
      const [hasCompletedOnboarding, forceRefresh] = await AsyncStorage.multiGet([
        'hasCompletedOnboarding',
        FORCE_REFRESH_KEY
      ]);
      
      // Update refresh key to force re-render when needed
      setRefreshKey(forceRefresh[1] || '');
      
      const shouldShowOnboarding = hasCompletedOnboarding[1] !== 'true';
      setShowOnboarding(shouldShowOnboarding);
      return shouldShowOnboarding;
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setShowOnboarding(true);
      return true;
    }
  };

  useEffect(() => {
    const initialize = async () => {
      if (loaded) {
        await checkOnboardingStatus();
      }
    };
    initialize();
  }, [loaded, refreshKey]); // Add refreshKey to dependencies

  const handleOnboardingComplete = async () => {
    try {
      await AsyncStorage.multiSet([
        ['hasCompletedOnboarding', 'true'],
        ['onboardingTimestamp', new Date().toISOString()],
      ]);
      setShowOnboarding(false);
      await SplashScreen.hideAsync();
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  };

  if (!loaded || showOnboarding === null) {
    return null; // Keep showing splash screen
  }

  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
