import { Platform } from 'react-native';

export const colors = {
  background: '#0B0F19',
  surface: '#141C2E',
  surfaceLight: '#1C2740',
  surfaceHighlight: '#253456',
  border: '#2D3D60',
  borderSubtle: '#1C2740',

  primary: '#06B6D4', // Cyan Fibra Óptica
  primaryDark: '#0891B2',
  primaryGlow: 'rgba(6, 182, 212, 0.25)',

  secondary: '#3B82F6', // Azul Enlace
  secondaryGlow: 'rgba(59, 130, 246, 0.25)',

  accentGreen: '#10B981', // Verde Terminal OK
  accentAmber: '#F59E0B', // Naranja Alerta
  accentRed: '#EF4444',   // Rojo Crítico
  accentPurple: '#8B5CF6',

  // Protocol Colors
  snmpColor: '#10B981',
  sshColor: '#06B6D4',
  arpColor: '#F59E0B',
  outboxColor: '#EC4899',

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
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const shadows = {
  card: Platform.select({
    web: {
      boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.4)',
    },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 4,
    },
  }) as any,
  glow: (color: string) =>
    Platform.select({
      web: {
        boxShadow: `0px 0px 12px ${color}`,
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
