import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import { MeasurementSession } from '../types';
import { colors, spacing, borderRadius } from '../constants/theme';

interface Props {
  sessions: MeasurementSession[];
  height?: number;
}

export const LatencyChart: React.FC<Props> = ({ sessions, height = 180 }) => {
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = Math.max(300, screenWidth - 48);
  const paddingLeft = 36;
  const paddingBottom = 28;
  const paddingTop = 16;
  const paddingRight = 16;

  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = height - paddingTop - paddingBottom;

  // Tomar hasta las últimas 8 sesiones en orden cronológico
  const chronoSessions = [...sessions]
    .slice(0, 8)
    .reverse();

  if (chronoSessions.length === 0) {
    return (
      <View style={[styles.emptyContainer, { height }]}>
        <Text style={styles.emptyText}>Sin datos históricos de latencia</Text>
      </View>
    );
  }

  // Extraer valores promedio de latencia de cada sesión
  const points = chronoSessions.map((s, index) => {
    const valid = s.pings.filter((p) => p.status === 'success' || p.status === 'warning');
    const avg = valid.length > 0
      ? valid.reduce((sum, p) => sum + p.avgRttMs, 0) / valid.length
      : 0;
    const jitter = valid.length > 0 ? valid[0].jitterMs : 0;
    return {
      index,
      avg: Math.round(avg),
      jitter: Math.round(jitter),
      dateStr: new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  });

  const maxVal = Math.max(50, Math.ceil(Math.max(...points.map((p) => p.avg)) * 1.25));

  // Generar coordenadas cartesianas
  const getX = (i: number) => {
    if (points.length === 1) return paddingLeft + innerWidth / 2;
    return paddingLeft + (i / (points.length - 1)) * innerWidth;
  };

  const getY = (val: number) => {
    const ratio = Math.min(1, Math.max(0, val / maxVal));
    return paddingTop + innerHeight - ratio * innerHeight;
  };

  // Construir Path SVG para la línea de latencia
  let pathD = '';
  let areaD = '';

  points.forEach((p, i) => {
    const x = getX(i);
    const y = getY(p.avg);
    if (i === 0) {
      pathD += `M ${x} ${y}`;
      areaD += `M ${x} ${paddingTop + innerHeight} L ${x} ${y}`;
    } else {
      pathD += ` L ${x} ${y}`;
      areaD += ` L ${x} ${y}`;
    }
    if (i === points.length - 1) {
      areaD += ` L ${x} ${paddingTop + innerHeight} Z`;
    }
  });

  return (
    <View style={styles.card}>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.primary }]} />
          <Text style={styles.legendText}>Latencia Promedio (ms)</Text>
        </View>
        <Text style={styles.scaleText}>Escala: 0 - {maxVal} ms</Text>
      </View>

      <Svg width={chartWidth} height={height}>
        <Defs>
          <LinearGradient id="latencyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={colors.primary} stopOpacity="0.4" />
            <Stop offset="100%" stopColor={colors.primary} stopOpacity="0.0" />
          </LinearGradient>
        </Defs>

        {/* Líneas de cuadrícula horizontales */}
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

        {/* Área sombreada */}
        {points.length > 1 && (
          <Path d={areaD} fill="url(#latencyGradient)" />
        )}

        {/* Línea principal */}
        <Path
          d={pathD}
          fill="none"
          stroke={colors.primary}
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Puntos y etiquetas */}
        {points.map((p, i) => {
          const x = getX(i);
          const y = getY(p.avg);
          return (
            <React.Fragment key={i}>
              <Circle
                cx={x}
                cy={y}
                r={5}
                fill={colors.surface}
                stroke={colors.primary}
                strokeWidth={2.5}
              />
            </React.Fragment>
          );
        })}
      </Svg>

      {/* Etiquetas temporales en el eje X */}
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
    fontSize: 13,
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
