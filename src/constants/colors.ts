// Light Theme Colors - Google Keep Material You Edition
const lightTheme = {
  // Primary colors - Keep Amber & Crisp Slate
  primary: '#F59E0B', // Keep Amber / Gold
  primaryDark: '#D97706',
  primaryLight: '#FDE68A',
  
  // Background colors - Pure, clean canvas
  background: '#FFFFFF',
  backgroundSecondary: '#F8F9FA',
  backgroundTertiary: '#F1F3F4',
  
  // Surface colors - Elevated surfaces & search capsules
  surface: '#FFFFFF',
  surfaceLight: '#F8F9FA',
  surfaceElevated: '#F1F3F4',
  
  // Text colors - Clear readability hierarchy
  text: '#202124',
  textSecondary: '#5F6368',
  textMuted: '#80868B',
  
  // Accent colors
  accent: '#F59E0B',
  accentLight: '#FDE68A',
  
  // Status colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  
  // Border colors - Delicate Google borders
  border: '#E0E0E0',
  borderLight: '#E8EAED',
  
  // Shadow color
  shadow: '#000000',
  
  // Gradients
  gradientPrimary: ['#F59E0B', '#D97706'],
  gradientSecondary: ['#3B82F6', '#60A5FA'],
  gradientAccent: ['#EC4899', '#F43F5E'],
  gradientBackground: ['#FFFFFF', '#F8F9FA'],
  gradientSurface: ['#FFFFFF', '#F1F3F4'],
  
  // Legacy colors
  white: '#FFFFFF',
  black: '#000000',
  lightSlate: '#CBD5E1',
  lightSlateO: 'rgba(203, 213, 225, 0.5)',
};

// Dark Theme Colors - Google Keep Neutral Charcoal Edition
const darkTheme = {
  // Primary colors - Warm Amber & Soft Indigo
  primary: '#FBBF24',
  primaryDark: '#F59E0B',
  primaryLight: '#FDE68A',
  
  // Background colors - Authentic Google Keep Neutral Dark
  background: '#1F1F1F',
  backgroundSecondary: '#202124',
  backgroundTertiary: '#2D2E30',
  
  // Surface colors - Elevated dark surfaces
  surface: '#202124',
  surfaceLight: '#28292C',
  surfaceElevated: '#2D2E30',
  
  // Text colors - High-contrast Material text
  text: '#E8EAED',
  textSecondary: '#9AA0A6',
  textMuted: '#70757A',
  
  // Accent colors
  accent: '#FBBF24',
  accentLight: '#FCD34D',
  
  // Status colors
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  
  // Border colors - Subtle dark borders
  border: '#3C4043',
  borderLight: '#4A4D51',
  
  // Shadow color
  shadow: '#000000',
  
  // Gradients
  gradientPrimary: ['#FBBF24', '#F59E0B'],
  gradientSecondary: ['#60A5FA', '#3B82F6'],
  gradientAccent: ['#FB7185', '#EC4899'],
  gradientBackground: ['#1F1F1F', '#202124'],
  gradientSurface: ['#202124', '#2D2E30'],
  
  // Legacy colors
  white: '#FFFFFF',
  black: '#000000',
  lightSlate: '#CBD5E1',
  lightSlateO: 'rgba(203, 213, 225, 0.5)',
};

// Theme type
export type Theme = typeof lightTheme;

// Export themes
export { lightTheme, darkTheme };

// Default export (dark theme as default)
const Colors = darkTheme;
export default Colors;