import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme, Theme } from '../constants/colors';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

const THEME_STORAGE_KEY = 'notelo_theme_preference';

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark'); // Default to dark
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Memoize the theme object to prevent unnecessary re-renders
  const theme = React.useMemo(() => {
    return themeMode === 'light' ? lightTheme : darkTheme;
  }, [themeMode]);

  useEffect(() => {
    loadThemePreference();
  }, []);

  // Set loading to false after initial load
  useEffect(() => {
    if (!isLoading) return;
    setIsLoading(false);
  }, [theme, isLoading]);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      console.log('Loaded theme preference:', savedTheme);
      
      // If saved theme is 'system', convert it to 'light' and save
      if (savedTheme === 'system') {
        await AsyncStorage.setItem(THEME_STORAGE_KEY, 'light');
        setThemeMode('light');
        return;
      }
      
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setThemeMode(savedTheme);
      } else {
        // If no saved theme, use light theme as default
        setThemeMode('light');
        await AsyncStorage.setItem(THEME_STORAGE_KEY, 'light');
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
      // Fallback to light theme
      setThemeMode('light');
    }
  };

  const saveThemePreference = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      console.log('Saved theme preference:', mode);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const setTheme = (mode: ThemeMode) => {
    setThemeMode(mode);
    saveThemePreference(mode);
  };

  const toggleTheme = () => {
    const newMode = themeMode === 'light' ? 'dark' : 'light';
    setTheme(newMode);
  };

  const contextValue: ThemeContextType = {
    theme,
    themeMode,
    toggleTheme,
    setTheme,
  };

  // Show loading state while theme is being loaded
  if (isLoading) {
    return null; // or a loading component
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
