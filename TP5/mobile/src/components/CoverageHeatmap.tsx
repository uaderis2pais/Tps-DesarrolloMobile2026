import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Modal,
} from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop, Rect, Text as SvgText, G } from 'react-native-svg';
import { MeasurementSession } from '../types';
import { colors, spacing, borderRadius } from '../constants/theme';
import { QoSScorer } from '../engine/QoSScorer';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Props {
  sessions: MeasurementSession[];
  currentLatitude?: number;
  currentLongitude?: number;
  height?: number;
}

export const CoverageHeatmap: React.FC<Props> = ({
  sessions,
  currentLatitude = -32.4845,
  currentLongitude = -58.2328,
  height = 360,
}) => {
  const screenWidth = Dimensions.get('window').width;
  const mapWidth = Math.max(320, screenWidth - 32);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [selectedSession, setSelectedSession] = useState<MeasurementSession | null>(null);

  // Calcular límites geográficos (Bounding Box)
  const lats = sessions.map((s) => s.location.latitude).concat(currentLatitude);
  const lngs = sessions.map((s) => s.location.longitude).concat(currentLongitude);

  const minLat = Math.min(...lats) - 0.008;
  const maxLat = Math.max(...lats) + 0.008;
  const minLng = Math.min(...lngs) - 0.008;
  const maxLng = Math.max(...lngs) + 0.008;

  // Proyección de coordenadas geográficas a pantalla
  const projectCoords = (lat: number, lng: number) => {
    const latSpan = maxLat - minLat || 0.01;
    const lngSpan = maxLng - minLng || 0.01;

    const normX = (lng - minLng) / lngSpan;
    const normY = 1 - (lat - minLat) / latSpan;

    const padding = 24;
    const x = padding + normX * (mapWidth - padding * 2);
    const y = padding + normY * (height - padding * 2);

    return { x, y };
  };

  const userPos = projectCoords(currentLatitude, currentLongitude);

  return (
    <View style={styles.container}>
      {/* Barra de herramientas superior */}
      <View style={styles.toolbar}>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons name="radar" size={18} color={colors.secondary} />
          <Text style={styles.mapTitle}>Mapa de Calor QoS</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{sessions.length} puntos</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            style={[styles.toolBtn, showHeatmap && styles.toolBtnActive]}
            onPress={() => setShowHeatmap(!showHeatmap)}
          >
            <MaterialCommunityIcons
              name={showHeatmap ? 'layers' : 'layers-off'}
              size={16}
              color={showHeatmap ? colors.white : colors.textSecondary}
            />
            <Text style={[styles.toolBtnText, showHeatmap && styles.toolBtnTextActive]}>
              Heatmap
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Lienzo del Mapa con Heatmap */}
      <View style={[styles.canvasWrapper, { width: mapWidth, height }]}>
        <Svg width={mapWidth} height={height}>
          <Defs>
            {/* Gradientes radiales para simulación de Heatmap KDE */}
            <RadialGradient id="heatExcellent" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor={colors.qosExcellent} stopOpacity="0.8" />
              <Stop offset="40%" stopColor={colors.qosExcellent} stopOpacity="0.4" />
              <Stop offset="80%" stopColor={colors.secondary} stopOpacity="0.15" />
              <Stop offset="100%" stopColor={colors.transparent} stopOpacity="0" />
            </RadialGradient>

            <RadialGradient id="heatGood" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor={colors.qosGood} stopOpacity="0.75" />
              <Stop offset="50%" stopColor={colors.qosGood} stopOpacity="0.35" />
              <Stop offset="100%" stopColor={colors.transparent} stopOpacity="0" />
            </RadialGradient>

            <RadialGradient id="heatFair" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor={colors.qosFair} stopOpacity="0.75" />
              <Stop offset="50%" stopColor={colors.qosFair} stopOpacity="0.35" />
              <Stop offset="100%" stopColor={colors.transparent} stopOpacity="0" />
            </RadialGradient>

            <RadialGradient id="heatPoor" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor={colors.qosPoor} stopOpacity="0.85" />
              <Stop offset="50%" stopColor={colors.qosPoor} stopOpacity="0.4" />
              <Stop offset="100%" stopColor={colors.transparent} stopOpacity="0" />
            </RadialGradient>
          </Defs>

          {/* Fondo estilo mapa oscuro satelital */}
          <Rect width={mapWidth} height={height} fill="#0d1424" rx={16} />

          {/* Retícula de cuadrícula geográfica */}
          {[0.25, 0.5, 0.75].map((factor) => (
            <React.Fragment key={factor}>
              <Rect
                x={0}
                y={height * factor}
                width={mapWidth}
                height={1}
                fill={colors.surfaceHighlight}
                opacity={0.3}
              />
              <Rect
                x={mapWidth * factor}
                y={0}
                width={1}
                height={height}
                fill={colors.surfaceHighlight}
                opacity={0.3}
              />
            </React.Fragment>
          ))}

          {/* 1. Capa de Calor (Heatmap Overlay RF-05) */}
          {showHeatmap &&
            sessions.map((s) => {
              const { x, y } = projectCoords(s.location.latitude, s.location.longitude);
              const gradId =
                s.overallQoSRating === 'EXCELLENT'
                  ? 'url(#heatExcellent)'
                  : s.overallQoSRating === 'GOOD'
                  ? 'url(#heatGood)'
                  : s.overallQoSRating === 'FAIR'
                  ? 'url(#heatFair)'
                  : 'url(#heatPoor)';

              return (
                <Circle
                  key={`heat-${s.id}`}
                  cx={x}
                  cy={y}
                  r={38}
                  fill={gradId}
                />
              );
            })}

          {/* 2. Marcadores visuales de estación (sin props de responder para compatibilidad con React 19) */}
          {sessions.map((s) => {
            const { x, y } = projectCoords(s.location.latitude, s.location.longitude);
            const markerColor = QoSScorer.getQoSColor(s.overallQoSRating);

            return (
              <G key={`marker-graphics-${s.id}`}>
                <Circle
                  cx={x}
                  cy={y}
                  r={10}
                  fill={colors.surface}
                  stroke={markerColor}
                  strokeWidth={2.5}
                />
                <Circle
                  cx={x}
                  cy={y}
                  r={5}
                  fill={markerColor}
                />
                <SvgText
                  x={x}
                  y={y - 14}
                  fill={colors.textSecondary}
                  fontSize="9"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {s.signal.networkType}
                </SvgText>
              </G>
            );
          })}

          {/* 3. Posición actual del usuario */}
          <Circle
            cx={userPos.x}
            cy={userPos.y}
            r={14}
            fill="none"
            stroke={colors.secondary}
            strokeWidth={1.5}
            strokeDasharray="3 3"
          />
          <Circle
            cx={userPos.x}
            cy={userPos.y}
            r={6}
            fill={colors.secondary}
          />
        </Svg>

        {/* Hotspots interactivos independientes (evita responder props en elementos SVG <G>) */}
        {sessions.map((s) => {
          const { x, y } = projectCoords(s.location.latitude, s.location.longitude);
          return (
            <Pressable
              key={`hotspot-${s.id}`}
              style={[
                styles.pinHotspot,
                {
                  left: x - 18,
                  top: y - 18,
                },
              ]}
              onPress={() => setSelectedSession(s)}
            />
          );
        })}

        {/* Leyenda de Semáforo de Cobertura */}
        <View style={styles.legendOverlay}>
          <View style={styles.legendItem}>
            <View style={[styles.colorBox, { backgroundColor: colors.qosExcellent }]} />
            <Text style={styles.legendLabel}>Excelente</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.colorBox, { backgroundColor: colors.qosGood }]} />
            <Text style={styles.legendLabel}>Buena</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.colorBox, { backgroundColor: colors.qosFair }]} />
            <Text style={styles.legendLabel}>Regular</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.colorBox, { backgroundColor: colors.qosPoor }]} />
            <Text style={styles.legendLabel}>Pobre</Text>
          </View>
        </View>
      </View>

      {/* Modal interactivo de Detalle de Medición Georreferenciada */}
      {selectedSession && (
        <Modal
          visible={!!selectedSession}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedSession(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Detalle de Medición</Text>
                  <Text style={styles.modalSubtitle}>
                    {new Date(selectedSession.timestamp).toLocaleString()}
                  </Text>
                </View>
                <Pressable onPress={() => setSelectedSession(null)} style={styles.closeBtn}>
                  <MaterialCommunityIcons name="close" size={20} color={colors.textSecondary} />
                </Pressable>
              </View>

              <View style={styles.modalBody}>
                {/* Zona / Ubicación */}
                <View style={styles.detailRow}>
                  <MaterialCommunityIcons name="map-marker" size={18} color={colors.secondary} />
                  <Text style={styles.detailText} numberOfLines={2}>
                    {selectedSession.location.addressSummary ||
                      `${selectedSession.location.latitude.toFixed(4)}, ${selectedSession.location.longitude.toFixed(4)}`}
                  </Text>
                </View>

                {/* Red y Operador */}
                <View style={styles.detailRow}>
                  <MaterialCommunityIcons name="antenna" size={18} color={colors.primary} />
                  <Text style={styles.detailText}>
                    {selectedSession.signal.operator} ({selectedSession.signal.networkType}) •{' '}
                    {selectedSession.signal.dbm} dBm
                  </Text>
                </View>

                {/* Métricas de Latencia y Velocidad */}
                <View style={styles.metricsBox}>
                  <View style={styles.metricCol}>
                    <Text style={styles.metricHeader}>LATENCIA</Text>
                    <Text style={styles.metricValue}>
                      {selectedSession.pings[0]?.avgRttMs ?? 0} ms
                    </Text>
                  </View>
                  <View style={styles.metricCol}>
                    <Text style={styles.metricHeader}>JITTER</Text>
                    <Text style={styles.metricValue}>
                      {selectedSession.pings[0]?.jitterMs ?? 0} ms
                    </Text>
                  </View>
                  <View style={styles.metricCol}>
                    <Text style={styles.metricHeader}>DESCARGA</Text>
                    <Text style={[styles.metricValue, { color: colors.secondary }]}>
                      {selectedSession.throughput.downloadMbps} Mbps
                    </Text>
                  </View>
                  <View style={styles.metricCol}>
                    <Text style={styles.metricHeader}>SUBIDA</Text>
                    <Text style={[styles.metricValue, { color: colors.accentPurple }]}>
                      {selectedSession.throughput.uploadMbps} Mbps
                    </Text>
                  </View>
                </View>

                {/* Estado QoS */}
                <View
                  style={[
                    styles.qosBadge,
                    { backgroundColor: QoSScorer.getQoSColor(selectedSession.overallQoSRating) + '25' },
                  ]}
                >
                  <Text
                    style={[
                      styles.qosBadgeText,
                      { color: QoSScorer.getQoSColor(selectedSession.overallQoSRating) },
                    ]}
                  >
                    Calidad: {QoSScorer.getQoSTitle(selectedSession.overallQoSRating)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  mapTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  countBadge: {
    backgroundColor: colors.surfaceHighlight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  countText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  toolBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  toolBtnText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  toolBtnTextActive: {
    color: colors.white,
  },
  canvasWrapper: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
    alignSelf: 'center',
  },
  pinHotspot: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    zIndex: 10,
  },
  legendOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  colorBox: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  legendLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  modalSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  modalBody: {
    gap: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detailText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  metricsBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  metricCol: {
    alignItems: 'center',
  },
  metricHeader: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '800',
    marginBottom: 4,
  },
  metricValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  qosBadge: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  qosBadgeText: {
    fontSize: 13,
    fontWeight: '800',
  },
});
