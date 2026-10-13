import { StyleSheet, ViewStyle, TextStyle } from 'react-native';

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  containerBg: string;
  cardBg: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  buttonPrimaryBg: string;
  buttonPrimaryText: string;
  buttonResetBg: string;
  buttonResetText: string;
  buttonToggleBg: string;
  buttonToggleText: string;
  disabledBg: string;
  disabledText: string;
  warningBg: string;
  warningText: string;
  warningBorder: string;
  badgeBg: string;
}

export const LIGHT_THEME: ThemeColors = {
  containerBg: '#f1f5f9',
  cardBg: '#ffffff',
  cardBorder: '#e2e8f0',
  textPrimary: '#0f172a',
  textSecondary: '#64748b',
  buttonPrimaryBg: '#2563eb',
  buttonPrimaryText: '#ffffff',
  buttonResetBg: '#dc2626',
  buttonResetText: '#ffffff',
  buttonToggleBg: '#7c3aed',
  buttonToggleText: '#ffffff',
  disabledBg: '#cbd5e1',
  disabledText: '#94a3b8',
  warningBg: '#fffbe6',
  warningText: '#b45309',
  warningBorder: '#fde68a',
  badgeBg: '#e2e8f0',
};

export const DARK_THEME: ThemeColors = {
  containerBg: '#0f172a',
  cardBg: '#1e293b',
  cardBorder: '#334155',
  textPrimary: '#f8fafc',
  textSecondary: '#94a3b8',
  buttonPrimaryBg: '#3b82f6',
  buttonPrimaryText: '#ffffff',
  buttonResetBg: '#ef4444',
  buttonResetText: '#ffffff',
  buttonToggleBg: '#8b5cf6',
  buttonToggleText: '#ffffff',
  disabledBg: '#334155',
  disabledText: '#64748b',
  warningBg: '#451a03',
  warningText: '#fcd34d',
  warningBorder: '#78350f',
  badgeBg: '#334155',
};

export function getThemeColors(mode: ThemeMode): ThemeColors {
  return mode === 'dark' ? DARK_THEME : LIGHT_THEME;
}

export function useThemeStyles(mode: ThemeMode) {
  const colors = getThemeColors(mode);

  const styles = StyleSheet.create({
    screenContainer: {
      flex: 1,
      backgroundColor: colors.containerBg,
    } as ViewStyle,
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 24,
      paddingBottom: 90,
    } as ViewStyle,
    headerTitle: {
      fontSize: 26,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 8,
      textAlign: 'center',
    } as TextStyle,
    headerSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 24,
      textAlign: 'center',
    } as TextStyle,
    card: {
      width: '100%',
      maxWidth: 420,
      backgroundColor: colors.cardBg,
      borderRadius: 24,
      padding: 28,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.cardBorder,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: mode === 'dark' ? 0.4 : 0.08,
      shadowRadius: 12,
      elevation: 6,
    } as ViewStyle,
    badge: {
      backgroundColor: colors.badgeBg,
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 16,
      marginBottom: 20,
    } as ViewStyle,
    badgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    } as TextStyle,
    counterValueContainer: {
      marginVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
      height: 120,
      width: '100%',
    } as ViewStyle,
    counterValueText: {
      fontSize: 84,
      fontWeight: '800',
      color: colors.textPrimary,
      textAlign: 'center',
      fontVariant: ['tabular-nums'],
    } as TextStyle,
    warningBanner: {
      backgroundColor: colors.warningBg,
      borderColor: colors.warningBorder,
      borderWidth: 1,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 12,
      marginBottom: 20,
      width: '100%',
      alignItems: 'center',
    } as ViewStyle,
    warningText: {
      color: colors.warningText,
      fontSize: 14,
      fontWeight: '600',
      textAlign: 'center',
    } as TextStyle,
    buttonGroup: {
      width: '100%',
      gap: 12,
      marginTop: 8,
    } as ViewStyle,
    actionButton: {
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 20,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      overflow: 'hidden',
    } as ViewStyle,
    buttonPrimary: {
      backgroundColor: colors.buttonPrimaryBg,
    } as ViewStyle,
    buttonReset: {
      backgroundColor: colors.buttonResetBg,
    } as ViewStyle,
    buttonToggle: {
      backgroundColor: colors.buttonToggleBg,
    } as ViewStyle,
    buttonDisabled: {
      backgroundColor: colors.disabledBg,
    } as ViewStyle,
    buttonTextPrimary: {
      color: colors.buttonPrimaryText,
      fontSize: 16,
      fontWeight: '700',
    } as TextStyle,
    buttonTextReset: {
      color: colors.buttonResetText,
      fontSize: 16,
      fontWeight: '700',
    } as TextStyle,
    buttonTextToggle: {
      color: colors.buttonToggleText,
      fontSize: 16,
      fontWeight: '700',
    } as TextStyle,
    buttonTextDisabled: {
      color: colors.disabledText,
      fontSize: 16,
      fontWeight: '700',
    } as TextStyle,
  });

  return { styles, colors };
}
