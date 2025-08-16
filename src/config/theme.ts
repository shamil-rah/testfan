export interface ThemeConfig {
  appName: string;
  logoSrc: string;
  colors: {
    // Primary brand colors
    primary: string;
    primaryHover: string;
    primaryLight: string;
    primaryDark: string;
    
    // Background colors
    background: string;
    backgroundSecondary: string;
    backgroundTertiary: string;
    
    // Text colors
    text: string;
    textSecondary: string;
    textMuted: string;
    textInverse: string;
    
    // Border colors
    border: string;
    borderLight: string;
    borderHover: string;
    
    // Status colors
    success: string;
    warning: string;
    error: string;
    info: string;
    
    // Alpha variants for overlays and subtle effects
    whiteAlpha5: string;
    whiteAlpha10: string;
    whiteAlpha20: string;
    whiteAlpha30: string;
    whiteAlpha40: string;
    blackAlpha50: string;
    blackAlpha80: string;
    blackAlpha90: string;
    blackAlpha95: string;
    
    // Primary alpha variants
    primaryAlpha10: string;
    primaryAlpha20: string;
    primaryAlpha30: string;
    primaryAlpha50: string;
    primaryAlpha5: string;
    primaryAlpha80: string;
    
    // Error alpha variants
    errorAlpha10: string;
    errorAlpha30: string;
    
    // Success alpha variants
    successAlpha30: string;
  };
}

export const defaultTheme: ThemeConfig = {
  appName: 'CASHLESS SOCIETY',
  logoSrc: '/CASHLESS_SOCIETY.png',
  colors: {
    // Primary brand colors (Red theme)
    primary: '#dc2626',
    primaryHover: '#b91c1c',
    primaryLight: '#ef4444',
    primaryDark: '#991b1b',
    
    // Background colors (Black theme)
    background: '#000000',
    backgroundSecondary: '#111111',
    backgroundTertiary: '#1f1f1f',
    
    // Text colors (White/Gray theme)
    text: '#ffffff',
    textSecondary: '#d1d5db',
    textMuted: '#9ca3af',
    textInverse: '#000000',
    
    // Border colors
    border: 'rgba(255, 255, 255, 0.1)',
    borderLight: 'rgba(255, 255, 255, 0.05)',
    borderHover: 'rgba(255, 255, 255, 0.3)',
    
    // Status colors
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    
    // Alpha variants
    whiteAlpha5: 'rgba(255, 255, 255, 0.05)',
    whiteAlpha10: 'rgba(255, 255, 255, 0.1)',
    whiteAlpha20: 'rgba(255, 255, 255, 0.2)',
    whiteAlpha30: 'rgba(255, 255, 255, 0.3)',
    whiteAlpha40: 'rgba(255, 255, 255, 0.4)',
    blackAlpha50: 'rgba(0, 0, 0, 0.5)',
    blackAlpha80: 'rgba(0, 0, 0, 0.8)',
    blackAlpha90: 'rgba(0, 0, 0, 0.9)',
    blackAlpha95: 'rgba(0, 0, 0, 0.95)',
    
    // Primary alpha variants
    primaryAlpha10: 'rgba(220, 38, 38, 0.1)',
    primaryAlpha20: 'rgba(220, 38, 38, 0.2)',
    primaryAlpha30: 'rgba(220, 38, 38, 0.3)',
    primaryAlpha50: 'rgba(220, 38, 38, 0.5)',
    primaryAlpha5: 'rgba(220, 38, 38, 0.05)',
    primaryAlpha80: 'rgba(220, 38, 38, 0.8)',
    
    // Error alpha variants
    errorAlpha10: 'rgba(239, 68, 68, 0.1)',
    errorAlpha30: 'rgba(239, 68, 68, 0.3)',
    
    // Success alpha variants
    successAlpha30: 'rgba(16, 185, 129, 0.3)',
  },
};

// Example custom theme - modify these values to white-label your app
export const customTheme: ThemeConfig = {
  ...(await import('../../config.json')).default,
};
