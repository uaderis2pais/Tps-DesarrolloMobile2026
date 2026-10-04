import { Platform } from 'react-native';

export const colors = {
  background: '#0B0F19',
  surface: '#161F30',
  surfaceLight: '#1E293B',
  surfaceHighlight: '#27354D',
  border: '#334155',
  borderSubtle: '#1E293B',
  
  primary: '#3B82F6',
  primaryDark: '#1D4ED8',
  primaryGlow: 'rgba(59, 130, 246, 0.25)',
  
  secondary: '#06B6D4',
  secondaryGlow: 'rgba(6, 182, 212, 0.25)',
  
  accentPurple: '#8B5CF6',
  accentPink: '#EC4899',

  // QoS Status Colors
  qosExcellent: '#10B981',
  qosGood: '#3B82F6',
  qosFair: '#F59E0B',
  qosPoor: '#EF4444',

  // Signal / Net Colors
  wifi: '#06B6D4',
  fiveG: '#8B5CF6',
  fourG: '#3B82F6',
  threeG: '#F59E0B',
  twoG: '#64748B',

  text: '#F8FAFC',
  textSecondary: '#94A3B8',
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
      boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.3)',
    },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
  }) as any,
  glow: (color: string) =>
    Platform.select({
      web: {
        boxShadow: `0px 0px 10px ${color}`,
      },
      default: {
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 10,
        elevation: 6,
      },
    }) as any,
};
