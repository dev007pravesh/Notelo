import { Stack, router } from "expo-router";
import { setStatusBarStyle } from "expo-status-bar";
import { useEffect } from "react";
import { Platform } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import * as QuickActions from 'expo-quick-actions';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from '../contexts/ThemeContext';
import { DatabaseProvider } from '../db/DatabaseProvider';
import { SecurityWrapper } from '../components/security/SecurityWrapper';

// Prevent splash screen from auto-hiding until fonts are loaded
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    'Danymeka': require('./../../assets/fonts/Danymeka-2D.otf'),
    'cafenty': require('./../../assets/fonts/Cafenty.ttf'),
    'chamos': require('./../../assets/fonts/CHAMOS.otf'),
    'requiner': require('./../../assets/fonts/Requiner.otf'),
    'premint': require('./../../assets/fonts/PremintRegular.otf'),
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
    setTimeout(() => {
      setStatusBarStyle("light");
    }, 0);
  }, [loaded, error]);

  // Handle notification response (tap on reminder)
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const noteId = response.notification.request.content.data?.noteId;
      if (noteId && typeof noteId === 'string') {
        router.push({ pathname: '/addNote', params: { id: noteId } });
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Configure Android & iOS Home Screen Quick Actions (App Shortcuts)
  useEffect(() => {
    QuickActions.setItems([
      {
        id: 'new_text_note',
        title: 'New Note',
        subtitle: 'Quick text note',
        icon: Platform.OS === 'ios' ? 'compose' : undefined,
        params: { newType: 'text' },
      },
      {
        id: 'new_checklist_note',
        title: 'New Checklist',
        subtitle: 'Create to-do list',
        icon: Platform.OS === 'ios' ? 'task' : undefined,
        params: { newType: 'checklist' },
      },
    ]).catch((err) => console.log('QuickActions setItems warning:', err));

    if (QuickActions.initial) {
      const action = QuickActions.initial;
      if (action.id === 'new_text_note') {
        router.push({ pathname: '/addNote', params: { newType: 'text' } });
      } else if (action.id === 'new_checklist_note') {
        router.push({ pathname: '/addNote', params: { newType: 'checklist' } });
      }
    }

    const sub = QuickActions.addListener((action) => {
      if (action.id === 'new_text_note') {
        router.push({ pathname: '/addNote', params: { newType: 'text' } });
      } else if (action.id === 'new_checklist_note') {
        router.push({ pathname: '/addNote', params: { newType: 'checklist' } });
      }
    });

    return () => {
      sub.remove();
    };
  }, []);

  if (!loaded && !error) {
    return null;
  }
  
  return (
    <DatabaseProvider>
      <SecurityWrapper>
        <ThemeProvider>
          <StatusBar style="light" /> 
          <Stack
            screenOptions={{
              contentStyle: { backgroundColor: '#000000' }
            }}
          >
            <Stack.Screen
              name="(tabs)"
              options={{
                headerShown: false
              }}
            />
            <Stack.Screen
              name="addNote"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="archive"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="trash"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="settings"
              options={{
                headerShown: false,
              }}
            />
          </Stack>
        </ThemeProvider>
      </SecurityWrapper>
    </DatabaseProvider>
  );
}
