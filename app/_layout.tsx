import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { useColorScheme, Text, View, Platform, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";

import { Colors } from "@/constants/Colors";
import { Onboarding } from "@/components/Onboarding";

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Key for forcing a refresh
const FORCE_REFRESH_KEY = "forceRefreshTimestamp";

// Simple error boundary component
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    if (Platform.OS === "web") {
      const handleError = (error: any) => {
        console.error("Caught error:", error);
        setHasError(true);
        setError(error.error || error);
      };

      // Only use window listeners on web
      globalThis.addEventListener?.("error", handleError);
      return () => globalThis.removeEventListener?.("error", handleError);
    }

    // For native, we could use AppState or other error handling approaches
    // But this is a basic implementation for now
    return undefined;
  }, []);

  if (hasError) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>
          Something went wrong
        </Text>
        <Text style={{ marginBottom: 20 }}>
          {error?.message || "Unknown error"}
        </Text>
      </View>
    );
  }

  return children;
}

export default function RootLayout() {
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const [refreshKey, setRefreshKey] = useState<string>("");
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  const checkOnboardingStatus = async () => {
    try {
      const [hasCompletedOnboarding, forceRefresh] =
        await AsyncStorage.multiGet([
          "hasCompletedOnboarding",
          FORCE_REFRESH_KEY,
        ]);

      // Update refresh key to force re-render when needed
      setRefreshKey(forceRefresh[1] || "");

      const shouldShowOnboarding = hasCompletedOnboarding[1] !== "true";
      setShowOnboarding(shouldShowOnboarding);
      return shouldShowOnboarding;
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      setShowOnboarding(true);
      return true;
    }
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        if (loaded) {
          await checkOnboardingStatus();
          // Always hide splash screen after a timeout to prevent getting stuck
          setTimeout(async () => {
            try {
              await SplashScreen.hideAsync();
            } catch (e) {
              console.warn("Error hiding splash screen:", e);
            }
          }, 3000);
        }
      } catch (e) {
        console.error("Initialization error:", e);
        setShowOnboarding(false);
        await SplashScreen.hideAsync();
      }
    };
    initialize();
  }, [loaded, refreshKey]); // Add refreshKey to dependencies

  const handleOnboardingComplete = async () => {
    try {
      await AsyncStorage.multiSet([
        ["hasCompletedOnboarding", "true"],
        ["onboardingTimestamp", new Date().toISOString()],
      ]);
      setShowOnboarding(false);
      await SplashScreen.hideAsync();
    } catch (error) {
      console.error("Error saving onboarding status:", error);
    }
  };

  // Safety fallback - render minimal UI instead of null
  if (!loaded || showOnboarding === null) {
    return <View style={{ flex: 1 }} />;
  }

  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <ErrorBoundary>
      <Stack>
        <Stack.Screen 
          name="(tabs)" 
          options={{ 
            headerShown: false,
            headerRight: () => (
              <TouchableOpacity
                onPress={async () => {
                  await AsyncStorage.removeItem('hasCompletedOnboarding');
                  setShowOnboarding(true);
                }}
                style={{ marginRight: 15 }}
              >
                <Text style={{ color: Colors[colorScheme ?? 'light'].text }}>
                  Reset Onboarding
                </Text>
              </TouchableOpacity>
            ),
          }} 
        />
      </Stack>
    </ErrorBoundary>
  );
}
