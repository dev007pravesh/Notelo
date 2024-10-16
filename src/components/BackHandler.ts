import { useEffect } from "react";
import { BackHandler } from "react-native";
import { useRouter } from "expo-router";

const useBackPressHandler = () => {
  const router = useRouter();

  useEffect(() => {
    const backAction = () => {
      // Navigate back to the tab index
      router.replace("./(tabs)");

      // Return true to indicate that the back press is handled
      return true;
    };

    // Add the back press event listener
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    // Clean up the event listener on unmount
    return () => backHandler.remove();
  }, [router]);
};

export default useBackPressHandler;
