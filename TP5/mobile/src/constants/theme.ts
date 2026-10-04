import { Platform } from 'react-native';

export const colors = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceLight: '#F1F5F9',
  surfaceHighlight: '#E2E8F0',
  border: '#E2E8F0',
  borderSubtle: '#F1F5F9',
  
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primaryGlow: 'rgba(37, 99, 235, 0.15)',
  
  secondary: '#0284C7',
  secondaryGlow: 'rgba(2, 132, 199, 0.15)',
  
  accentPurple: '#7C3AED',
  accentPink: '#DB2777',

  // QoS Status Colors
  qosExcellent: '#10B981',
  qosGood: '#2563EB',
  qosFair: '#D97706',
  qosPoor: '#DC2626',

  // Signal / Net Colors
  wifi: '#0284C7',
  fiveG: '#7C3AED',
  fourG: '#2563EB',
  threeG: '#D97706',
  twoG: '#64748B',

  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#64748B',
  
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const shadows = {
  card: Platform.select({
    web: {
      boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.06)',
    },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 2,
    },
  }) as any,
  glow: (color: string) =>
    Platform.select({
      web: {
        boxShadow: `0px 2px 10px ${color}30`,
      },
      default: {
        shadowColor: color,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 3,
      },
    }) as any,
};
