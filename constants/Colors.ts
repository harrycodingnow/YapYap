/**
 * App-wide color constants organized by theme (light/dark)
 * This centralizes all color definitions for better maintainability
 */

export const Colors = {
  light: {
    // Core colors
    primary: '#FDBA74', // Orange/amber accent
    secondary: '#2563EB', // Blue for links/buttons
    accent: '#E9D5FF', // Purple accent
    
    // Background colors
    background: '#FAFAFA',
    surface: '#FFFFFF',
    surfaceSecondary: '#F9FAFB',
    surfaceTertiary: '#F3F4F6',
    
    // Text colors
    text: '#111827',
    textSecondary: '#374151',
    textTertiary: '#6B7280',
    textMuted: '#9CA3AF',
    
    // Border colors
    border: '#E5E7EB',
    borderSecondary: '#F3F4F6',
    
    // Shadow
    shadow: '#000000',
    
    // Status colors
    success: '#059669',
    error: '#EF4444',
    warning: '#F59E0B',
  },
  dark: {
    // Core colors
    primary: '#FDBA74', // Orange/amber accent
    secondary: '#E9D5FF', // Purple for links/buttons
    accent: '#C084FC', // Darker purple
    
    // Background colors
    background: '#111827',
    surface: '#1F2937',
    surfaceSecondary: '#374151',
    surfaceTertiary: '#4B5563',
    
    // Text colors
    text: '#F9FAFB',
    textSecondary: '#E5E7EB',
    textTertiary: '#D1D5DB',
    textMuted: '#9CA3AF',
    
    // Border colors
    border: '#374151',
    borderSecondary: '#4B5563',
    
    // Shadow
    shadow: '#000000',
    
    // Status colors
    success: '#10B981',
    error: '#F87171',
    warning: '#FBBF24',
  },
} as const;

// Type for theme-aware color access
export type ColorTheme = keyof typeof Colors;
export type ColorKey = keyof typeof Colors.light;
