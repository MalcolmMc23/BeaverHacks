import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { useColorScheme, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

import { Colors } from '@/constants/Colors';
import { Onboarding } from '@/components/Onboarding';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const [fadeAnim] = useState(new Animated.Value(1));
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    initializeApp();
  }, []);

  // Add a function to reset fade animation
  const resetFadeAnimation = () => {
    fadeAnim.setValue(1);
  };

  const initializeApp = async () => {
    try {
      resetFadeAnimation(); // Reset fade animation when initializing
      const hasCompletedOnboarding = await AsyncStorage.getItem('hasCompletedOnboarding');
      setShowOnboarding(hasCompletedOnboarding !== 'true');
      
      if (loaded) {
        await SplashScreen.hideAsync();
      }
    } catch (error) {
      console.error('Error initializing app:', error);
      setShowOnboarding(true);
    }
  };

  const handleOnboardingComplete = async () => {
    try {
      // Start fade out animation
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(async () => {
        // After fade out completes, update the state
        await AsyncStorage.multiSet([
          ['hasCompletedOnboarding', 'true'],
          ['onboardingTimestamp', new Date().toISOString()],
        ]);
        setShowOnboarding(false);
      });
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  };

  if (!loaded || showOnboarding === null) {
    return null; // Keep showing splash screen
  }

  if (showOnboarding) {
    return (
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <Onboarding onComplete={handleOnboardingComplete} />
      </Animated.View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors[colorScheme ?? 'light'].background,
        },
        headerTintColor: Colors[colorScheme ?? 'light'].text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
