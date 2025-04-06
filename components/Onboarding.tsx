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
    scheduleType: undefined as unknown as 'structured' | 'flexible',
    notificationStyle: undefined as unknown as 'motivational' | 'minimal',
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
      if (currentScreen < 4) {
        setCurrentScreen(prev => prev + 1);
        // Reset position for next screen
        slideAnim.setValue(width);
        // Animate new screen in
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start();
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
      animateToNextScreen(); // Use the same animation for the final screen
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  const renderHeader = (showClose = true) => (
    <View style={styles.header}>
      {currentScreen === 0 && showClose ? (
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={onComplete}
          accessibilityLabel="Exit onboarding"
        >
          <IconSymbol name="xmark" size={24} color={Colors.light.text} />
        </TouchableOpacity>
      ) : <View style={styles.headerButton} />}
      
      <View style={styles.progressContainer}>
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
        <ThemedText style={styles.progressText}>
          Step {Math.min(currentScreen + 1, 4)} of 4
        </ThemedText>
      </View>
      
      <View style={styles.headerButton} />
    </View>
  );

  const renderDayPicker = () => (
    <View style={styles.daysContainer}>
      {DAYS.map((day) => {
        const isSelected = preferences.restDays.includes(day);
        return (
          <TouchableOpacity
            key={day}
            style={[
              styles.dayButton,
              isSelected && styles.dayButtonSelected
            ]}
            onPress={() => {
              setPreferences(prev => ({
                ...prev,
                restDays: prev.restDays.includes(day)
                  ? prev.restDays.filter(d => d !== day)
                  : [...prev.restDays, day],
              }));
            }}
            accessibilityLabel={`${day}, ${isSelected ? 'selected' : 'not selected'}`}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
          >
            <ThemedText style={[
              styles.dayText,
              isSelected && styles.dayTextSelected
            ]}>
              {day}
            </ThemedText>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderScreen = () => {
    switch (currentScreen) {
      case 0:
        return (
          <View style={styles.screen}>
            {renderHeader()}
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
            {renderHeader()}
            <ThemedText style={styles.question}>
              Which days do you prefer to rest?
            </ThemedText>
            {renderDayPicker()}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.navigationButton]}
                onPress={animateToPreviousScreen}
              >
                <ThemedText style={styles.navigationButtonText}>
                  Back
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.navigationButton,
                  preferences.restDays.length === 0 ? styles.navigationButtonDisabled : styles.checkButtonEnabled
                ]}
                onPress={preferences.restDays.length > 0 ? animateToNextScreen : undefined}
                disabled={preferences.restDays.length === 0}
                accessibilityLabel={preferences.restDays.length > 0 ? "Continue to next step" : "Please select at least one rest day to continue"}
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
            {renderHeader()}
            <ThemedText style={styles.question}>
              How do you prefer to schedule your day?
            </ThemedText>

            <View style={styles.optionsContainer}>
              {[
                { 
                  label: 'Structured Schedule',
                  description: 'Tasks are scheduled back-to-back with specific time slots',
                  value: 'structured'
                },
                { 
                  label: 'Flexible Schedule',
                  description: 'Tasks are organized in larger time blocks with more flexibility',
                  value: 'flexible'
                },
              ].map(({ label, description, value }) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.optionButton,
                    preferences.scheduleType === value && styles.optionButtonSelected
                  ]}
                  onPress={() => {
                    setPreferences(prev => ({ ...prev, scheduleType: value as 'structured' | 'flexible' }));
                  }}
                  accessibilityLabel={`${label}: ${description}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: preferences.scheduleType === value }}
                >
                  <View style={styles.optionContent}>
                    <ThemedText style={[
                      styles.optionText,
                      preferences.scheduleType === value && styles.optionTextSelected
                    ]}>
                      {label}
                    </ThemedText>
                    <ThemedText style={[
                      styles.optionDescription,
                      preferences.scheduleType === value && styles.optionDescriptionSelected
                    ]}>
                      {description}
                    </ThemedText>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.navigationButton]}
                onPress={animateToPreviousScreen}
              >
                <ThemedText style={styles.navigationButtonText}>
                  Back
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.navigationButton,
                  !preferences.scheduleType ? styles.navigationButtonDisabled : styles.checkButtonEnabled
                ]}
                onPress={preferences.scheduleType ? animateToNextScreen : undefined}
                disabled={!preferences.scheduleType}
                accessibilityLabel={preferences.scheduleType ? "Continue to next step" : "Please select a schedule type to continue"}
              >
                <ThemedText style={[
                  styles.navigationButtonText,
                  !preferences.scheduleType && styles.navigationButtonTextDisabled
                ]}>
                  Next
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.screen}>
            {renderHeader()}
            <ThemedText style={styles.question}>
              Choose your notification style
            </ThemedText>

            <View style={styles.optionsContainer}>
              {[
                { 
                  label: 'Motivational Messages',
                  description: 'Receive encouraging reminders to keep you on track',
                  value: 'motivational'
                },
                { 
                  label: 'Minimal Notifications',
                  description: 'Only essential updates about your schedule',
                  value: 'minimal'
                },
              ].map(({ label, description, value }) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.optionButton,
                    preferences.notificationStyle === value && styles.optionButtonSelected
                  ]}
                  onPress={() => {
                    setPreferences(prev => ({ ...prev, notificationStyle: value as 'motivational' | 'minimal' }));
                  }}
                  accessibilityLabel={`${label}: ${description}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: preferences.notificationStyle === value }}
                >
                  <View style={styles.optionContent}>
                    <ThemedText style={[
                      styles.optionText,
                      preferences.notificationStyle === value && styles.optionTextSelected
                    ]}>
                      {label}
                    </ThemedText>
                    <ThemedText style={[
                      styles.optionDescription,
                      preferences.notificationStyle === value && styles.optionDescriptionSelected
                    ]}>
                      {description}
                    </ThemedText>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.navigationButton]}
                onPress={animateToPreviousScreen}
              >
                <ThemedText style={styles.navigationButtonText}>
                  Back
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.navigationButton,
                  !preferences.notificationStyle ? styles.navigationButtonDisabled : styles.checkButtonEnabled
                ]}
                onPress={preferences.notificationStyle ? savePreferencesAndComplete : undefined}
                disabled={!preferences.notificationStyle}
                accessibilityLabel={preferences.notificationStyle ? "Complete onboarding" : "Please select a notification style to continue"}
              >
                <ThemedText style={[
                  styles.navigationButtonText,
                  !preferences.notificationStyle && styles.navigationButtonTextDisabled
                ]}>
                  Finish
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 4:
        return (
          <View style={styles.screen}>
            {renderHeader(false)}
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
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingHorizontal: 8,
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
  },
  progressContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#E1E1E1',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.light.tint,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: Colors.light.text,
    opacity: 0.6,
    marginTop: 4,
  },
  question: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'left',
    marginBottom: 40,
    color: Colors.light.text,
    lineHeight: 40,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: -5,
    marginTop: 20,
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
    gap: 16,
    marginTop: 20,
    paddingHorizontal: 20,
  },
  dayButton: {
    width: 90,
    height: 90,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  dayButtonSelected: {
    backgroundColor: Colors.light.tint,
  },
  dayText: {
    fontSize: 18,
    color: Colors.light.text,
    fontWeight: '600',
  },
  dayTextSelected: {
    color: '#FFFFFF',
  },
  optionsContainer: {
    width: '100%',
    gap: 16,
    marginTop: 20,
  },
  optionButton: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 100,
  },
  optionButtonSelected: {
    backgroundColor: Colors.light.tint,
  },
  optionContent: {
    flex: 1,
    paddingRight: 16,
  },
  optionText: {
    fontSize: 18,
    color: Colors.light.text,
    fontWeight: '600',
    marginBottom: 8,
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  optionDescription: {
    fontSize: 14,
    color: Colors.light.text,
    opacity: 0.7,
    lineHeight: 20,
  },
  optionDescriptionSelected: {
    color: '#FFFFFF',
    opacity: 0.9,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 'auto',
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
  },
  navigationButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: Colors.light.tint,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  navigationButtonDisabled: {
    backgroundColor: '#E1E1E1',
    opacity: 0.5,
  },
  navigationButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  navigationButtonTextDisabled: {
    color: '#E1E1E1',
  },
  backButton: {
    backgroundColor: '#C4753F', // Lighter shade of brown
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
    paddingBottom: 100,
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
    fontSize: 32,
    fontWeight: '700',
    color: Colors.light.text,
    textAlign: 'center',
    marginHorizontal: 20,
    lineHeight: 40,
  },
  forwardButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.light.tint,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
}); 