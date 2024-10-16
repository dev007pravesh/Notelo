import { Stack } from "expo-router";
import { setStatusBarStyle } from "expo-status-bar";
import { useEffect } from "react";
import CustomHeader from "../components/header";
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

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
    console.log('loaded--------', error)
    if (loaded || error) {
      
      SplashScreen.hideAsync();
    }
    setTimeout(() => {
      setStatusBarStyle("light");
    }, 0);
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }
  return (
    <Stack
    screenOptions={{
      headerStyle: {
        backgroundColor: "#25292e",
      },
      headerShadowVisible: false,
      headerTintColor: "#fff",
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
    </Stack>
  );
}
