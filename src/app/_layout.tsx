import { Stack } from "expo-router";
import { setStatusBarStyle } from "expo-status-bar";
import { useEffect } from "react";
import CustomHeader from "../components/header";
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

export default function RootLayout() {
  const [loaded, error] = useFonts({
    'Danymeka': require('./../../assets/fonts/Danymeka-2D.otf'),
    'cafenty': require('./../../assets/fonts/Cafenty.otf'),
    'chamos': require('./../../assets/fonts/CHAMOS.otf'),
    'requiner': require('./../../assets/fonts/Requiner.otf'),
  });

  useEffect(() => {
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
    <Stack>
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false,
          header: () => <CustomHeader title="Home" showBackButton={false} />,
        }}
      />
    </Stack>
  );
}
