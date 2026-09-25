import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useSettingsStore } from '../../store/useSettingsStore';

export const AppLockScreen: React.FC = () => {
  const { biometricAuthEnabled, verifyPasscode, setIsAppLocked, theme: settingTheme } = useSettingsStore();
  const systemColorScheme = useColorScheme();
  const isDark = settingTheme === 'dark' || (settingTheme === 'system' && systemColorScheme === 'dark');

  const [pin, setPin] = useState('');
  const [errorText, setErrorText] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Dynamic Theme Palette matching Google Keep aesthetic
  const colors = {
    bg: isDark ? '#1F1F1F' : '#FFFFFF',
    surface: isDark ? '#28292C' : '#F8F9FA',
    text: isDark ? '#E8EAED' : '#202124',
    textSecondary: isDark ? '#9AA0A6' : '#5F6368',
    primary: isDark ? '#FBBF24' : '#F59E0B',
    badgeBg: isDark ? 'rgba(251, 191, 36, 0.12)' : 'rgba(245, 158, 11, 0.10)',
    badgeBorder: isDark ? 'rgba(251, 191, 36, 0.28)' : 'rgba(245, 158, 11, 0.25)',
    dotBorder: isDark ? '#3C4043' : '#D1D5DB',
    keyBg: isDark ? '#28292C' : '#F1F3F4',
    keyBorder: isDark ? '#3C4043' : '#E2E8F0',
    keyText: isDark ? '#E8EAED' : '#202124',
    actionColor: isDark ? '#9AA0A6' : '#5F6368',
    error: '#EF4444',
  };

  const shakeTranslateX = useSharedValue(0);

  const triggerShake = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    shakeTranslateX.value = withSequence(
      withTiming(-14, { duration: 50 }),
      withTiming(14, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  };

  const shakeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeTranslateX.value }],
  }));

  const handleBiometricAuth = async () => {
    if (!biometricAuthEnabled || isAuthenticating) return;

    try {
      setIsAuthenticating(true);
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (hasHardware && isEnrolled) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Unlock Notelo',
          fallbackLabel: 'Use PIN',
          cancelLabel: 'Cancel',
          disableDeviceFallback: true,
        });

        if (result.success) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setIsAppLocked(false);
          return;
        }
      }
    } catch (e) {
      console.warn('Biometric auth failed or cancelled:', e);
    } finally {
      setIsAuthenticating(false);
    }
  };

  useEffect(() => {
    // Attempt biometric unlock immediately on mount
    handleBiometricAuth();
  }, []);

  const handleKeyPress = async (digit: string) => {
    if (pin.length >= 4) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const nextPin = pin + digit;
    setPin(nextPin);
    setErrorText('');

    if (nextPin.length === 4) {
      const isValid = await verifyPasscode(nextPin);
      if (isValid) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setIsAppLocked(false);
      } else {
        triggerShake();
        setErrorText('Incorrect PIN. Please try again.');
        setTimeout(() => {
          setPin('');
        }, 300);
      }
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setPin(pin.slice(0, -1));
      setErrorText('');
    }
  };

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(250)}
      style={[styles.container, { backgroundColor: colors.bg }]}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.bg}
      />
      <SafeAreaView style={styles.safeArea}>
        {/* Header Icon & Title */}
        <View style={styles.header}>
          <View
            style={[
              styles.lockIconBadge,
              { backgroundColor: colors.badgeBg, borderColor: colors.badgeBorder },
            ]}
          >
            <Ionicons name="lock-closed" size={36} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Notelo is Locked</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Enter your 4-digit PIN to access your notes
          </Text>
        </View>

        {/* PIN Indicators */}
        <Animated.View style={[styles.pinDotsContainer, shakeAnimatedStyle]}>
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pin.length > index;
            const hasError = errorText.length > 0;
            return (
              <View
                key={index}
                style={[
                  styles.dot,
                  { borderColor: colors.dotBorder },
                  isFilled && {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                  },
                  hasError && {
                    borderColor: colors.error,
                    backgroundColor: colors.error,
                  },
                ]}
              />
            );
          })}
        </Animated.View>

        {/* Error message */}
        <View style={styles.errorContainer}>
          {errorText.length > 0 && (
            <Text style={[styles.errorText, { color: colors.error }]}>{errorText}</Text>
          )}
        </View>

        {/* Numeric Keypad */}
        <View style={styles.keypad}>
          {[
            ['1', '2', '3'],
            ['4', '5', '6'],
            ['7', '8', '9'],
          ].map((row, rowIndex) => (
            <View key={rowIndex} style={styles.keypadRow}>
              {row.map((digit) => (
                <TouchableOpacity
                  key={digit}
                  style={[
                    styles.keyButton,
                    {
                      backgroundColor: colors.keyBg,
                      borderColor: colors.keyBorder,
                    },
                  ]}
                  activeOpacity={0.6}
                  onPress={() => handleKeyPress(digit)}
                >
                  <Text style={[styles.keyText, { color: colors.keyText }]}>{digit}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}

          {/* Bottom Row: Biometrics, 0, Backspace */}
          <View style={styles.keypadRow}>
            {biometricAuthEnabled ? (
              <TouchableOpacity
                style={styles.actionButton}
                activeOpacity={0.6}
                onPress={handleBiometricAuth}
              >
                <MaterialCommunityIcons
                  name="fingerprint"
                  size={32}
                  color={colors.primary}
                />
              </TouchableOpacity>
            ) : (
              <View style={styles.actionButton} />
            )}

            <TouchableOpacity
              style={[
                styles.keyButton,
                {
                  backgroundColor: colors.keyBg,
                  borderColor: colors.keyBorder,
                },
              ]}
              activeOpacity={0.6}
              onPress={() => handleKeyPress('0')}
            >
              <Text style={[styles.keyText, { color: colors.keyText }]}>0</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              activeOpacity={0.6}
              onPress={handleDelete}
            >
              <Ionicons
                name="backspace-outline"
                size={26}
                color={colors.actionColor}
              />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    zIndex: 9999,
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Platform.OS === 'android' ? 30 : 20,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
  },
  lockIconBadge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  pinDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginVertical: 20,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  errorContainer: {
    height: 24,
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
  },
  keypad: {
    width: '100%',
    maxWidth: 320,
    marginBottom: 30,
    gap: 16,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  keyButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  keyText: {
    fontSize: 28,
    fontWeight: '600',
  },
  actionButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
