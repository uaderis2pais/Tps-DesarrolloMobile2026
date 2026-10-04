import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors } from '../constants/theme';

interface Props {
  value: number; // Mbps
  maxValue?: number;
  label?: string;
  sublabel?: string;
  size?: number;
  isTesting?: boolean;
}

export const SpeedometerGauge: React.FC<Props> = ({
  value,
  maxValue = 150,
  label = 'Mbps',
  sublabel = 'DESCARGA',
  size = 240,
  isTesting = false,
}) => {
  const strokeWidth = 14;
  const radius = (size - strokeWidth * 2) / 2;
  const center = size / 2;

  // Ángulo de arco de 240 grados (de 150° a 390°)
  const startAngle = 140;
  const endAngle = 400;
  const totalAngle = endAngle - startAngle;

  const clampedVal = Math.min(maxValue, Math.max(0, value));
  const progressRatio = clampedVal / maxValue;
  const currentAngle = startAngle + totalAngle * progressRatio;

  // Función matemática de coordenadas polares a cartesianas
  const polarToCartesian = (centerX: number, centerY: number, r: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + r * Math.cos(angleInRadians),
      y: centerY + r * Math.sin(angleInRadians),
    };
  };

  const createArc = (startA: number, endA: number) => {
    const start = polarToCartesian(center, center, radius, endA);
    const end = polarToCartesian(center, center, radius, startA);
    const largeArcFlag = endA - startA <= 180 ? '0' : '1';
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  };

  const backgroundArc = createArc(startAngle, endAngle);
  const activeArc = progressRatio > 0.01 ? createArc(startAngle, currentAngle) : '';

  // Posición del puntero/aguja
  const needleCoord = polarToCartesian(center, center, radius - 4, currentAngle);

  return (
    <View style={[styles.container, { width: size, height: size * 0.85 }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <LinearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={colors.secondary} />
            <Stop offset="50%" stopColor={colors.primary} />
            <Stop offset="100%" stopColor={colors.accentPurple} />
          </LinearGradient>
        </Defs>

        {/* Arco de fondo */}
        <Path
          d={backgroundArc}
          stroke={colors.surfaceLight}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
        />

        {/* Arco activo con gradiente */}
        {activeArc !== '' && (
          <Path
            d={activeArc}
            stroke="url(#gaugeGradient)"
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
          />
        )}

        {/* Puntero luminoso */}
        {progressRatio > 0 && (
          <Circle
            cx={needleCoord.x}
            cy={needleCoord.y}
            r={6}
            fill={colors.primary}
            stroke={colors.white}
            strokeWidth={2}
          />
        )}
      </Svg>

      {/* Valores numéricos en el centro */}
      <View style={styles.centerTextContainer}>
        <Text style={[styles.sublabel, isTesting && styles.testingSublabel]}>
          {sublabel}
        </Text>
        <Text style={styles.valueText}>
          {value.toFixed(1)}
        </Text>
        <Text style={styles.labelText}>{label}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  centerTextContainer: {
    position: 'absolute',
    top: '32%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sublabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  testingSublabel: {
    color: colors.secondary,
  },
  valueText: {
    color: colors.text,
    fontSize: 46,
    fontWeight: '900',
    lineHeight: 52,
    fontVariant: ['tabular-nums'],
  },
  labelText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
});
