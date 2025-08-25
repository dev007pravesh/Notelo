// Light Theme Colors - Modern & Sophisticated
const lightTheme = {
  // Primary colors - Beautiful Blue gradient
  primary: '#3b82f6', // Blue
  primaryDark: '#2563eb',
  primaryLight: '#60a5fa',
  
  // Background colors - Clean, warm whites
  background: '#fafbfc',
  backgroundSecondary: '#f8fafc',
  backgroundTertiary: '#f1f5f9',
  
  // Surface colors - Elevated, sophisticated surfaces
  surface: '#ffffff',
  surfaceLight: '#f8fafc',
  surfaceElevated: '#ffffff',
  
  // Text colors - Rich, readable hierarchy
  text: '#1e293b',
  textSecondary: '#475569',
  textMuted: '#64748b',
  
  // Accent colors - Vibrant gradients
  accent: '#f59e0b', // Amber
  accentLight: '#fbbf24',
  
  // Status colors - Vibrant and modern
  success: '#10b981', // Emerald
  warning: '#f43f5e', // Rose
  error: '#ef4444', // Red
  
  // Border colors - Subtle and elegant
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  
  // Shadow color
  shadow: '#0f172a',
  
  // Gradients - Stunning combinations
  gradientPrimary: ['#3b82f6', '#60a5fa'], // Blue gradient
  gradientSecondary: ['#f59e0b', '#f97316'], // Amber to Orange
  gradientAccent: ['#ec4899', '#f43f5e'], // Pink to Rose
  gradientBackground: ['#fafbfc', '#f8fafc'],
  gradientSurface: ['#ffffff', '#f8fafc'],
  
  // Legacy colors
  white: '#ffffff',
  black: '#000000',
  lightSlate: '#cbd5e1',
  lightSlateO: 'rgba(203, 213, 225, 0.5)',
};

// Dark Theme Colors - Premium & Luxurious
const darkTheme = {
  // Primary colors - Rich Blue gradient
  primary: '#60a5fa', // Light Blue
  primaryDark: '#3b82f6',
  primaryLight: '#93c5fd',
  
  // Background colors - Deep, sophisticated darks
  background: '#0a0a0f',
  backgroundSecondary: '#111118',
  backgroundTertiary: '#1a1a24',
  
  // Surface colors - Elevated, premium surfaces
  surface: '#1e1e2e',
  surfaceLight: '#2a2a3e',
  surfaceElevated: '#262638',
  
  // Text colors - High contrast, elegant hierarchy
  text: '#f8fafc',
  textSecondary: '#cbd5e1',
  textMuted: '#94a3b8',
  
  // Accent colors - Vibrant and eye-catching
  accent: '#fbbf24', // Amber
  accentLight: '#fcd34d',
  
  // Status colors - Bright and modern
  success: '#34d399', // Emerald
  warning: '#fb7185', // Rose
  error: '#f87171', // Red
  
  // Border colors - Subtle and refined
  border: '#2d2d3f',
  borderLight: '#3a3a4f',
  
  // Shadow color
  shadow: '#000000',
  
  // Gradients - Luxurious combinations
  gradientPrimary: ['#60a5fa', '#3b82f6'], // Blue gradient
  gradientSecondary: ['#fbbf24', '#f59e0b'], // Amber to Orange
  gradientAccent: ['#fb7185', '#ec4899'], // Rose to Pink
  gradientBackground: ['#0a0a0f', '#111118'],
  gradientSurface: ['#1e1e2e', '#2a2a3e'],
  
  // Legacy colors
  white: '#ffffff',
  black: '#000000',
  lightSlate: '#cbd5e1',
  lightSlateO: 'rgba(203, 213, 225, 0.5)',
};

// Theme type
export type Theme = typeof lightTheme;

// Export themes
export { lightTheme, darkTheme };

// Default export (dark theme as default)
const Colors = darkTheme;
export default Colors;