// Design Constants for Wattlink Dashboard
export const COLORS = {
  // Primary Colors
  primary: {
    orange: '#f97316', // orange-500
    blue: '#3b82f6',   // blue-500
    green: '#10b981',  // emerald-500
  },
  
  // Background Colors
  background: {
    main: '#f9fafb',    // gray-50
    sidebar: '#f9fafb', // gray-50
    card: '#ffffff',    // white
    content: '#f8fafc', // slate-50
  },
  
  // Text Colors
  text: {
    primary: '#111827',   // gray-900
    secondary: '#6b7280', // gray-500
    muted: '#9ca3af',     // gray-400
    white: '#ffffff',     // white
  },
  
  // Border Colors
  border: {
    light: '#e5e7eb', // gray-200
    medium: '#d1d5db', // gray-300
  },
  
  // Status Colors
  status: {
    success: '#10b981', // emerald-500
    warning: '#f59e0b', // amber-500
    error: '#ef4444',   // red-500
    info: '#3b82f6',    // blue-500
  },
  
  // Chart Colors
  chart: {
    primary: '#3b82f6',
    secondary: '#10b981',
    tertiary: '#f59e0b',
    quaternary: '#6b7280',
  }
};

export const SPACING = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem',   // 64px
};

export const BORDER_RADIUS = {
  sm: '0.375rem',  // 6px
  md: '0.5rem',    // 8px
  lg: '0.75rem',   // 12px
  xl: '1rem',      // 16px
  '2xl': '1.5rem', // 24px
  full: '9999px',
};

export const SHADOWS = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
};

export const TRANSITIONS = {
  fast: '150ms ease-in-out',
  normal: '200ms ease-in-out',
  slow: '300ms ease-in-out',
};

// Layout Constants
export const LAYOUT = {
  sidebarWidth: '16rem', // 256px
  headerHeight: '4rem',  // 64px
  maxWidth: '80rem',     // 1280px
};

// Typography
export const TYPOGRAPHY = {
  fontSizes: {
    xs: '0.75rem',   // 12px
    sm: '0.875rem',  // 14px
    base: '1rem',    // 16px
    lg: '1.125rem',  // 18px
    xl: '1.25rem',   // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
  },
  fontWeights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
}; 