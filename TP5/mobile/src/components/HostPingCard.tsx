import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { PingResult } from '../types';
import { colors, spacing, borderRadius } from '../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Props {
  result: PingResult;
}

export const HostPingCard: React.FC<Props> = ({ result }) => {
  const getStatusColor = () => {
    switch (result.status) {
      case 'success':
        return colors.qosExcellent;
      case 'warning':
        return colors.qosFair;
      case 'error':
        return colors.qosPoor;
      case 'running':
        return colors.secondary;
      default:
        return colors.textMuted;
    }
  };

  const statusColor = getStatusColor();

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleCol}>
          <Text style={styles.hostName}>{result.hostName}</Text>
          <Text style={styles.hostAddress}>{result.hostAddress}</Text>
        </View>

        <View style={[styles.badge, { backgroundColor: statusColor + '20' }]}>
          {result.status === 'running' ? (
            <ActivityIndicator size="small" color={colors.secondary} />
          ) : (
            <MaterialCommunityIcons
              name={
                result.status === 'success'
                  ? 'check-circle'
                  : result.status === 'warning'
                  ? 'alert-circle'
                  : 'close-circle'
              }
              size={16}
              color={statusColor}
            />
          )}
          <Text style={[styles.badgeText, { color: statusColor }]}>
            {result.status === 'running'
              ? 'Midiendo...'
              : result.status === 'success'
              ? 'Óptimo'
              : result.status === 'warning'
              ? 'Inestable'
              : result.status === 'error'
              ? 'Fallo'
              : 'En espera'}
          </Text>
        </View>
      </View>

      {/* Métricas Principales: Min, Avg, Max, Jitter, Pérdida */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>AVG RTT</Text>
          <Text style={[styles.metricValue, { color: statusColor }]}>
            {result.avgRttMs} <Text style={styles.unit}>ms</Text>
          </Text>
        </View>

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>MIN / MAX</Text>
          <Text style={styles.metricValue}>
            {result.minRttMs}/{result.maxRttMs} <Text style={styles.unit}>ms</Text>
          </Text>
        </View>

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>JITTER (RFC 3550)</Text>
          <Text style={[styles.metricValue, result.jitterMs > 25 && { color: colors.qosFair }]}>
            {result.jitterMs} <Text style={styles.unit}>ms</Text>
          </Text>
        </View>

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>PÉRDIDA</Text>
          <Text style={[styles.metricValue, result.packetLossPct > 0 && { color: colors.qosPoor }]}>
            {result.packetLossPct}%
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  titleCol: {
    flex: 1,
  },
  hostName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  hostAddress: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceLight,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '800',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  metricValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  unit: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.textSecondary,
  },
});
