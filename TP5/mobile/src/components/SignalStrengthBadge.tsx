import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SignalInfo } from '../types';
import { colors, spacing, borderRadius } from '../constants/theme';

interface Props {
  signal: SignalInfo;
  compact?: boolean;
}

export const SignalStrengthBadge: React.FC<Props> = ({ signal, compact = false }) => {
  const bars = [1, 2, 3, 4];

  const getNetColor = () => {
    switch (signal.networkType) {
      case '5G':
        return colors.fiveG;
      case '4G':
        return colors.fourG;
      case 'WIFI':
        return colors.wifi;
      case '3G':
        return colors.threeG;
      default:
        return colors.twoG;
    }
  };

  const netColor = getNetColor();

  return (
    <View style={[styles.container, compact && styles.compactContainer]}>
      {/* Indicador de Barras de Señal */}
      <View style={styles.barsRow}>
        {bars.map((bar) => {
          const isActive = bar <= signal.level;
          const barHeight = bar * (compact ? 3.5 : 5.5);
          return (
            <View
              key={bar}
              style={[
                styles.bar,
                {
                  height: barHeight,
                  backgroundColor: isActive ? netColor : colors.border,
                },
              ]}
            />
          );
        })}
      </View>

      {/* Información de Operador y Tecnología */}
      <View style={styles.infoCol}>
        <View style={styles.topLine}>
          <Text style={[styles.netTypeBadge, { backgroundColor: netColor + '25', color: netColor }]}>
            {signal.networkType}
          </Text>
          <Text style={styles.operatorText} numberOfLines={1}>
            {signal.operator}
          </Text>
        </View>

        {!compact && (
          <View style={styles.metaRow}>
            <Text style={styles.dbmText}>{signal.dbm} dBm</Text>
            <Text style={styles.divider}>•</Text>
            <Text style={styles.metaDetail}>{signal.rawTypeDescription}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  compactContainer: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 24,
    marginRight: spacing.md,
    gap: 3,
  },
  bar: {
    width: 4,
    borderRadius: 2,
  },
  infoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  topLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  netTypeBadge: {
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  operatorText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  dbmText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    color: colors.textMuted,
    marginHorizontal: 4,
    fontSize: 10,
  },
  metaDetail: {
    color: colors.textMuted,
    fontSize: 11,
  },
});
