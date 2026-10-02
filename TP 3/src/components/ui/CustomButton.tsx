import React from 'react'
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacityProps,
} from 'react-native'
import { theme } from '../../theme/theme'

interface CustomButtonProps extends TouchableOpacityProps {
  title: string
  loading?: boolean
  cooldownSeconds?: number
  variant?: 'primary' | 'secondary' | 'outline'
  disabled?: boolean
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  loading = false,
  cooldownSeconds = 0,
  variant = 'primary',
  disabled = false,
  style,
  ...props
}) => {
  const isCooldown = cooldownSeconds > 0
  const isDisabled = disabled || loading || isCooldown

  const getButtonText = () => {
    if (loading) return title
    if (isCooldown) return `${title} (${cooldownSeconds}s)`
    return title
  }

  const variantStyles = {
    primary: styles.primary,
    secondary: styles.secondary,
    outline: styles.outline,
  }

  const variantTextStyles = {
    primary: styles.primaryText,
    secondary: styles.secondaryText,
    outline: styles.outlineText,
  }

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={isDisabled}
      style={[
        styles.baseButton,
        variantStyles[variant],
        isDisabled && styles.disabledButton,
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' ? theme.colors.primary : '#FFFFFF'}
        />
      ) : (
        <Text
          style={[
            styles.baseText,
            variantTextStyles[variant],
            isDisabled && styles.disabledText,
          ]}
        >
          {getButtonText()}
        </Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  baseButton: {
    height: 52,
    borderRadius: theme.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    flexDirection: 'row',
    width: '100%',
  },
  primary: {
    backgroundColor: theme.colors.primary,
    ...theme.shadows.button,
  },
  secondary: {
    backgroundColor: theme.colors.primaryLight,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
  },
  disabledButton: {
    backgroundColor: theme.colors.buttonDisabledBg,
    shadowColor: 'transparent',
    elevation: 0,
  },
  baseText: {
    fontSize: 16,
    fontFamily: theme.fonts.semiBold,
  },
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: theme.colors.primary,
  },
  outlineText: {
    color: theme.colors.primary,
  },
  disabledText: {
    color: theme.colors.buttonDisabledText,
  },
})
