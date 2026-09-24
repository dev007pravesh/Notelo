import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useSettingsStore } from '../../store/useSettingsStore';

export const AppLockScreen: React.FC = () => {
  const { biometricAuthEnabled, hasPasscode, verifyPasscode, setIsAppLocked } = useSettingsStore();
  const [pin, setPin] = useState('');
  const [errorText, setErrorText] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const shakeTranslateX = useSharedValue(0);

  const triggerShake = () => {
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
    const nextPin = pin + digit;
    setPin(nextPin);
    setErrorText('');

    if (nextPin.length === 4) {
      const isValid = await verifyPasscode(nextPin);
      if (isValid) {
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
      setPin(pin.slice(0, -1));
      setErrorText('');
    }
  };

  return (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(250)} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header Icon & Title */}
        <View style={styles.header}>
          <View style={styles.lockIconBadge}>
            <Ionicons name="lock-closed" size={36} color="#6366F1" />
          </View>
          <Text style={styles.title}>Notelo is Locked</Text>
          <Text style={styles.subtitle}>Enter your 4-digit PIN to access your notes</Text>
        </View>

        {/* PIN Indicators */}
        <Animated.View style={[styles.pinDotsContainer, shakeAnimatedStyle]}>
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pin.length > index;
            return (
              <View
                key={index}
                style={[
                  styles.dot,
                  isFilled && styles.dotFilled,
                  errorText.length > 0 && styles.dotError,
                ]}
              />
            );
          })}
        </Animated.View>

        {/* Error message */}
        <View style={styles.errorContainer}>
          {errorText.length > 0 && <Text style={styles.errorText}>{errorText}</Text>}
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
                  style={styles.keyButton}
                  activeOpacity={0.6}
                  onPress={() => handleKeyPress(digit)}
                >
                  <Text style={styles.keyText}>{digit}</Text>
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
                <MaterialCommunityIcons name="fingerprint" size={32} color="#818CF8" />
              </TouchableOpacity>
            ) : (
              <View style={styles.actionButton} />
            )}

            <TouchableOpacity
              style={styles.keyButton}
              activeOpacity={0.6}
              onPress={() => handleKeyPress('0')}
            >
              <Text style={styles.keyText}>0</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              activeOpacity={0.6}
              onPress={handleDelete}
            >
              <Ionicons name="backspace-outline" size={26} color="#94A3B8" />
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
    backgroundColor: '#0F172A',
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
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F8FAFC',
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
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
    borderColor: '#475569',
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  dotError: {
    borderColor: '#EF4444',
    backgroundColor: '#EF4444',
  },
  errorContainer: {
    height: 24,
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 13,
    color: '#F87171',
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
    backgroundColor: 'rgba(30, 41, 59, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  actionButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
