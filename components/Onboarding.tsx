import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  Platform,
  Easing,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/Colors';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import { IconSymbol } from './ui/IconSymbol';

const { width } = Dimensions.get('window');

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export type OnboardingPreferences = {
  productiveTimes: TimeOfDay[];
  restDays: string[];
  scheduleType: 'structured' | 'flexible';
  notificationStyle: 'motivational' | 'minimal';
};

type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [currentScreen, setCurrentScreen] = useState(0);
  const [preferences, setPreferences] = useState<OnboardingPreferences>({
    productiveTimes: [],
    restDays: [],
    scheduleType: 'structured',
    notificationStyle: 'minimal',
  });

  const slideAnim = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;

  const animateToNextScreen = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -width,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(progressWidth, {
        toValue: (currentScreen + 1) / 4,
        duration: 400,
        useNativeDriver: false,
      }),
    ]).start(() => {
      if (currentScreen < 3) {
        setCurrentScreen(prev => prev + 1);
        // Reset position for next screen
        slideAnim.setValue(width);
        // Animate new screen in
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start();
      } else {
        savePreferencesAndComplete();
      }
    });
  };

  const animateToPreviousScreen = () => {
    if (currentScreen === 0) return;

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: width,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(progressWidth, {
        toValue: (currentScreen - 1) / 4,
        duration: 400,
        useNativeDriver: false,
      }),
    ]).start(() => {
      setCurrentScreen(prev => prev - 1);
      // Reset position for previous screen
      slideAnim.setValue(-width);
      // Animate previous screen in
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start();
    });
  };

  const savePreferencesAndComplete = async () => {
    try {
      await AsyncStorage.setItem('onboardingPreferences', JSON.stringify(preferences));
      setCurrentScreen(4); // Move to success screen
      // Wait longer before completing to ensure users can read the message
      setTimeout(onComplete, 2000);
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  const renderDayPicker = () => (
    <View style={styles.daysContainer}>
      {DAYS.map((day) => (
        <TouchableOpacity
          key={day}
          style={[
            styles.dayButton,
            preferences.restDays.includes(day) && styles.dayButtonSelected
          ]}
          onPress={() => {
            setPreferences(prev => ({
              ...prev,
              restDays: prev.restDays.includes(day)
                ? prev.restDays.filter(d => d !== day)
                : [...prev.restDays, day],
            }));
          }}
        >
          <ThemedText style={[
            styles.dayText,
            preferences.restDays.includes(day) && styles.dayTextSelected
          ]}>
            {day}
          </ThemedText>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderScreen = () => {
    switch (currentScreen) {
      case 0:
        return (
          <View style={styles.screen}>
            <View style={styles.header}>
              <TouchableOpacity onPress={onComplete}>
                <IconSymbol name="xmark" size={24} color={Colors.light.text} />
              </TouchableOpacity>
              <View style={styles.progressBarContainer}>
                <Animated.View 
                  style={[
                    styles.progressBar,
                    { width: progressWidth.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }) },
                  ]} 
                />
              </View>
              <View style={styles.headerRight} />
            </View>
            
            <ThemedText style={styles.question}>
              When are you most productive?
            </ThemedText>
            
            <View style={styles.grid}>
              {[
                { icon: '🌅', label: 'Morning', value: 'morning' },
                { icon: '☀️', label: 'Afternoon', value: 'afternoon' },
                { icon: '🌙', label: 'Evening', value: 'evening' },
                { icon: '✨', label: 'Night', value: 'night' },
              ].map(({ icon, label, value }) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.gridItem,
                    preferences.productiveTimes.includes(value as TimeOfDay) && styles.gridItemSelected
                  ]}
                  onPress={() => {
                    setPreferences(prev => ({
                      ...prev,
                      productiveTimes: prev.productiveTimes.includes(value as TimeOfDay)
                        ? prev.productiveTimes.filter(t => t !== value)
                        : [...prev.productiveTimes, value as TimeOfDay],
                    }));
                  }}
                >
                  <View style={styles.gridContent}>
                    <Text style={styles.emoji}>{icon}</Text>
                    <ThemedText style={[
                      styles.gridLabel,
                      preferences.productiveTimes.includes(value as TimeOfDay) && styles.gridLabelSelected
                    ]}>
                      {label}
                    </ThemedText>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.buttonContainer}>
              {currentScreen > 0 && (
                <TouchableOpacity
                  style={[styles.navigationButton, styles.backButton]}
                  onPress={animateToPreviousScreen}
                >
                  <ThemedText style={styles.navigationButtonText}>
                    Back
                  </ThemedText>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[
                  styles.navigationButton,
                  styles.checkButton,
                  preferences.productiveTimes.length > 0 && styles.checkButtonEnabled
                ]}
                onPress={preferences.productiveTimes.length > 0 ? animateToNextScreen : undefined}
              >
                <ThemedText style={styles.navigationButtonText}>
                  Next
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 1:
        return (
          <View style={styles.screen}>
            <View style={styles.header}>
              <TouchableOpacity onPress={onComplete}>
                <IconSymbol name="xmark" size={24} color={Colors.light.text} />
              </TouchableOpacity>
              <View style={styles.progressBarContainer}>
                <Animated.View 
                  style={[
                    styles.progressBar,
                    { width: progressWidth.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }) },
                  ]} 
                />
              </View>
              <View style={styles.headerRight} />
            </View>

            <ThemedText style={styles.question}>
              Which days do you prefer to rest?
            </ThemedText>

            {renderDayPicker()}

            <View style={styles.buttonContainer}>
              {currentScreen > 0 && (
                <TouchableOpacity
                  style={[styles.navigationButton, styles.backButton]}
                  onPress={animateToPreviousScreen}
                >
                  <ThemedText style={styles.navigationButtonText}>
                    Back
                  </ThemedText>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.navigationButton, styles.checkButton, styles.checkButtonEnabled]}
                onPress={animateToNextScreen}
              >
                <ThemedText style={styles.navigationButtonText}>
                  Next
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.screen}>
            <View style={styles.header}>
              <TouchableOpacity onPress={onComplete}>
                <IconSymbol name="xmark" size={24} color={Colors.light.text} />
              </TouchableOpacity>
              <View style={styles.progressBarContainer}>
                <Animated.View 
                  style={[
                    styles.progressBar,
                    { width: progressWidth.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }) },
                  ]} 
                />
              </View>
              <View style={styles.headerRight} />
            </View>

            <ThemedText style={styles.question}>
              How do you prefer to schedule your day?
            </ThemedText>

            <View style={styles.optionsContainer}>
              {[
                { label: 'Structured Schedule', value: 'structured' },
                { label: 'Flexible Schedule', value: 'flexible' },
              ].map(({ label, value }) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.optionButton,
                    preferences.scheduleType === value && styles.optionButtonSelected
                  ]}
                  onPress={() => {
                    setPreferences(prev => ({ ...prev, scheduleType: value as 'structured' | 'flexible' }));
                    animateToNextScreen();
                  }}
                >
                  <ThemedText style={[
                    styles.optionText,
                    preferences.scheduleType === value && styles.optionTextSelected
                  ]}>
                    {label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.buttonContainer}>
              {currentScreen > 0 && (
                <TouchableOpacity
                  style={[styles.navigationButton, styles.backButton]}
                  onPress={animateToPreviousScreen}
                >
                  <ThemedText style={styles.navigationButtonText}>
                    Back
                  </ThemedText>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.navigationButton, styles.checkButton, styles.checkButtonEnabled]}
                onPress={animateToNextScreen}
              >
                <ThemedText style={styles.navigationButtonText}>
                  Next
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.screen}>
            <View style={styles.header}>
              <TouchableOpacity onPress={onComplete}>
                <IconSymbol name="xmark" size={24} color={Colors.light.text} />
              </TouchableOpacity>
              <View style={styles.progressBarContainer}>
                <Animated.View 
                  style={[
                    styles.progressBar,
                    { width: progressWidth.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }) },
                  ]} 
                />
              </View>
              <View style={styles.headerRight} />
            </View>

            <ThemedText style={styles.question}>
              Choose your notification style
            </ThemedText>

            <View style={styles.optionsContainer}>
              {[
                { label: 'Motivational Messages', value: 'motivational' },
                { label: 'Minimal Notifications', value: 'minimal' },
              ].map(({ label, value }) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.optionButton,
                    preferences.notificationStyle === value && styles.optionButtonSelected
                  ]}
                  onPress={() => {
                    setPreferences(prev => ({ ...prev, notificationStyle: value as 'motivational' | 'minimal' }));
                    animateToNextScreen();
                  }}
                >
                  <ThemedText style={[
                    styles.optionText,
                    preferences.notificationStyle === value && styles.optionTextSelected
                  ]}>
                    {label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.buttonContainer}>
              {currentScreen > 0 && (
                <TouchableOpacity
                  style={[styles.navigationButton, styles.backButton]}
                  onPress={animateToPreviousScreen}
                >
                  <ThemedText style={styles.navigationButtonText}>
                    Back
                  </ThemedText>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.navigationButton, styles.checkButton, styles.checkButtonEnabled]}
                onPress={animateToNextScreen}
              >
                <ThemedText style={styles.navigationButtonText}>
                  Next
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 4:
        return (
          <View style={styles.screen}>
            <View style={styles.header}>
              <View style={styles.progressBarContainer}>
                <Animated.View 
                  style={[
                    styles.progressBar,
                    { width: '100%' },
                  ]} 
                />
              </View>
            </View>
            <View style={[styles.successContainer]}>
              <View style={styles.checkmark}>
                <IconSymbol name="checkmark" size={48} color="#FFFFFF" />
              </View>
              <ThemedText style={styles.successText}>
                Let's sky-rocket your productivity!
              </ThemedText>
              <TouchableOpacity
                style={[styles.forwardButton]}
                onPress={onComplete}
              >
                <IconSymbol name="arrow.right" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Animated.View
        style={[
          styles.slideContainer,
          {
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        {renderScreen()}
      </Animated.View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  slideContainer: {
    flex: 1,
    width: '100%',
  },
  screen: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
  },
  headerRight: {
    width: 24,
  },
  progressBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#E1E1E1',
    borderRadius: 4,
    marginHorizontal: 20,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.light.tint,
    borderRadius: 4,
  },
  question: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'left',
    marginBottom: 40,
    color: Colors.light.text,
    marginTop: 40,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: -5,
  },
  gridItem: {
    width: '48%',
    aspectRatio: 1,
    marginVertical: 5,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    padding: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridItemSelected: {
    backgroundColor: Colors.light.tint,
  },
  gridContent: {
    alignItems: 'center',
  },
  emoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  gridLabel: {
    fontSize: 16,
    color: Colors.light.text,
    fontWeight: '500',
  },
  gridLabelSelected: {
    color: '#FFFFFF',
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  dayButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    minWidth: 60,
    alignItems: 'center',
  },
  dayButtonSelected: {
    backgroundColor: Colors.light.tint,
  },
  dayText: {
    fontSize: 16,
    color: Colors.light.text,
    fontWeight: '500',
  },
  dayTextSelected: {
    color: '#FFFFFF',
  },
  optionsContainer: {
    width: '100%',
    gap: 12,
  },
  optionButton: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  optionButtonSelected: {
    backgroundColor: Colors.light.tint,
  },
  optionText: {
    fontSize: 16,
    color: Colors.light.text,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 'auto',
    marginBottom: Platform.OS === 'ios' ? 30 : 20,
  },
  navigationButton: {
    paddingVertical: 16,
    borderRadius: 12,
    flex: 1,
  },
  navigationButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#A0430A', // Darker shade of brown
    opacity: 1,
  },
  checkButton: {
    backgroundColor: '#E1E1E1',
    opacity: 0.5,
  },
  checkButtonEnabled: {
    backgroundColor: Colors.light.tint,
    opacity: 1,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
  },
  checkmark: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.tint,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    textAlign: 'center',
  },
  forwardButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.light.tint,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
}); 