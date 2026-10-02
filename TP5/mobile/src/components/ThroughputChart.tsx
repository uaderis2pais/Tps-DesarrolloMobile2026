import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import { MeasurementSession } from '../types';
import { colors, spacing, borderRadius } from '../constants/theme';

interface Props {
  sessions: MeasurementSession[];
  height?: number;
}

export const ThroughputChart: React.FC<Props> = ({ sessions, height = 180 }) => {
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = Math.max(300, screenWidth - 48);
  const paddingLeft = 36;
  const paddingBottom = 28;
  const paddingTop = 16;
  const paddingRight = 16;

  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = height - paddingTop - paddingBottom;

  const chronoSessions = [...sessions]
    .slice(0, 8)
    .reverse();

  if (chronoSessions.length === 0) {
    return (
      <View style={[styles.emptyContainer, { height }]}>
        <Text style={styles.emptyText}>Sin datos históricos de throughput</Text>
      </View>
    );
  }

  const points = chronoSessions.map((s, index) => ({
    index,
    dl: s.throughput.downloadMbps || 0,
    ul: s.throughput.uploadMbps || 0,
    dateStr: new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }));

  const maxDl = Math.max(...points.map((p) => p.dl));
  const maxUl = Math.max(...points.map((p) => p.ul));
  const maxVal = Math.max(20, Math.ceil(Math.max(maxDl, maxUl) * 1.2));

  const getX = (i: number) => {
    if (points.length === 1) return paddingLeft + innerWidth / 2;
    return paddingLeft + (i / (points.length - 1)) * innerWidth;
  };

  const getY = (val: number) => {
    const ratio = Math.min(1, Math.max(0, val / maxVal));
    return paddingTop + innerHeight - ratio * innerHeight;
  };

  let dlPath = '';
  let ulPath = '';

  points.forEach((p, i) => {
    const x = getX(i);
    const yDl = getY(p.dl);
    const yUl = getY(p.ul);

    if (i === 0) {
      dlPath += `M ${x} ${yDl}`;
      ulPath += `M ${x} ${yUl}`;
    } else {
      dlPath += ` L ${x} ${yDl}`;
      ulPath += ` L ${x} ${yUl}`;
    }
  });

  return (
    <View style={styles.card}>
      <View style={styles.legendRow}>
        <View style={styles.legendGroup}>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: colors.secondary }]} />
            <Text style={styles.legendText}>Descarga (Mbps)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: colors.accentPurple }]} />
            <Text style={styles.legendText}>Subida (Mbps)</Text>
          </View>
        </View>
        <Text style={styles.scaleText}>Máx: {maxVal} Mbps</Text>
      </View>

      <Svg width={chartWidth} height={height}>
        <Defs>
          <LinearGradient id="dlGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={colors.secondary} stopOpacity="0.3" />
            <Stop offset="100%" stopColor={colors.secondary} stopOpacity="0.0" />
          </LinearGradient>
        </Defs>

        {/* Cuadrícula */}
        {[0, 0.5, 1].map((ratio) => {
          const y = paddingTop + innerHeight * (1 - ratio);
          return (
            <Line
              key={ratio}
              x1={paddingLeft}
              y1={y}
              x2={chartWidth - paddingRight}
              y2={y}
              stroke={colors.surfaceHighlight}
              strokeDasharray="4 4"
              strokeWidth="1"
            />
          );
        })}

        {/* Línea de Subida (Upload) */}
        <Path
          d={ulPath}
          fill="none"
          stroke={colors.accentPurple}
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Línea de Descarga (Download) */}
        <Path
          d={dlPath}
          fill="none"
          stroke={colors.secondary}
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Marcadores circulares */}
        {points.map((p, i) => {
          const x = getX(i);
          return (
            <React.Fragment key={i}>
              <Circle
                cx={x}
                cy={getY(p.dl)}
                r={4.5}
                fill={colors.surface}
                stroke={colors.secondary}
                strokeWidth={2}
              />
              <Circle
                cx={x}
                cy={getY(p.ul)}
                r={4}
                fill={colors.surface}
                stroke={colors.accentPurple}
                strokeWidth={2}
              />
            </React.Fragment>
          );
        })}
      </Svg>

      <View style={[styles.xAxisRow, { paddingLeft, paddingRight }]}>
        {points.map((p, i) => (
          <Text key={i} style={styles.xLabel}>
            {p.dateStr}
          </Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  legendGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  scaleText: {
    color: colors.textMuted,
    fontSize: 11,
  },
  xAxisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -8,
  },
  xLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
  },
});
