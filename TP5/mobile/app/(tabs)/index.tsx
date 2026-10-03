import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQoSStore } from '../../src/store/useQoSStore';
import { colors, spacing, borderRadius } from '../../src/constants/theme';
import { SignalStrengthBadge } from '../../src/components/SignalStrengthBadge';
import { QoSScorer } from '../../src/engine/QoSScorer';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function MonitorScreen() {
  const router = useRouter();
  const store = useQoSStore();

  const handleStartTest = () => {
    router.push('/speedtest');
  };

  const lastSession = store.lastSession;
  const qosRating = lastSession?.overallQoSRating || 'GOOD';
  const qosColor = QoSScorer.getQoSColor(qosRating);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Encabezado Superior */}
      <View style={styles.header}>
        <View>
          <Text style={styles.appTitle}>Network QoS Monitor</Text>
          <Text style={styles.subtitle}>Telemetría y Calidad en Tiempo Real</Text>
        </View>
        <Pressable
          style={styles.historyBtn}
          onPress={() => router.push('/history')}
        >
          <MaterialCommunityIcons name="history" size={20} color={colors.textSecondary} />
        </Pressable>
      </View>

      {/* Banner de Estado de Segundo Plano */}
      {store.backgroundStatus.isRunning && (
        <View style={styles.bgBanner}>
          <MaterialCommunityIcons name="sync" size={16} color={colors.secondary} />
          <Text style={styles.bgBannerText}>
            Muestreo en segundo plano activo (cada {store.config.backgroundIntervalMinutes} min)
          </Text>
        </View>
      )}

      {/* 1. Tarjeta de Estado Celular / Red Activa (RF-01) */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>CONEXIÓN ACTIVA (RF-01)</Text>
      </View>
      <SignalStrengthBadge signal={store.currentSignal} />

      {/* Parámetros Adicionales de Señal Celular */}
      <View style={styles.cellGrid}>
        <View style={styles.cellItem}>
          <Text style={styles.cellLabel}>NIVEL ASU</Text>
          <Text style={styles.cellVal}>{store.currentSignal.asu}</Text>
        </View>
        <View style={styles.cellItem}>
          <Text style={styles.cellLabel}>ROAMING</Text>
          <Text style={[styles.cellVal, { color: store.currentSignal.isRoaming ? colors.qosFair : colors.qosExcellent }]}>
            {store.currentSignal.isRoaming ? 'ACTIVO' : 'NO'}
          </Text>
        </View>
        <View style={styles.cellItem}>
          <Text style={styles.cellLabel}>ESTADO SIM</Text>
          <Text style={styles.cellVal} numberOfLines={1}>
            {store.currentSignal.simState}
          </Text>
        </View>
      </View>

      {/* 2. Georreferenciación GPS (RF-04) */}
      <View style={styles.geoCard}>
        <View style={styles.geoHeader}>
          <MaterialCommunityIcons name="crosshairs-gps" size={18} color={colors.primary} />
          <Text style={styles.geoTitle}>Coordenadas GPS</Text>
          <Text style={styles.geoAccuracy}>
            ±{Math.round(store.currentLocation.accuracy ?? 5)}m
          </Text>
        </View>
        <Text style={styles.geoAddress}>
          {store.currentLocation.addressSummary || 'Obteniendo dirección...'}
        </Text>
        <Text style={styles.geoCoords}>
          Lat: {store.currentLocation.latitude.toFixed(5)} • Lng:{' '}
          {store.currentLocation.longitude.toFixed(5)}
        </Text>
      </View>

      {/* 3. Resumen del Último Diagnóstico QoS */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>ÚLTIMO DIAGNÓSTICO QoS</Text>
        {lastSession && (
          <Text style={styles.lastTimeText}>
            {new Date(lastSession.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        )}
      </View>

      {lastSession ? (
        <View style={styles.qosCard}>
          <View style={styles.qosTop}>
            <View style={[styles.qosBadge, { backgroundColor: qosColor + '20' }]}>
              <View style={[styles.statusDot, { backgroundColor: qosColor }]} />
              <Text style={[styles.qosBadgeText, { color: qosColor }]}>
                {QoSScorer.getQoSTitle(lastSession.overallQoSRating)}
              </Text>
            </View>
            <Text style={styles.qosOperator}>
              {lastSession.signal.operator}
            </Text>
          </View>

          <View style={styles.metricsSummaryRow}>
            <View style={styles.metricBlock}>
              <Text style={styles.metricBlockLabel}>LATENCIA</Text>
              <Text style={styles.metricBlockVal}>
                {lastSession.pings[0]?.avgRttMs ?? 0}
                <Text style={styles.metricUnit}> ms</Text>
              </Text>
            </View>

            <View style={styles.metricBlock}>
              <Text style={styles.metricBlockLabel}>JITTER</Text>
              <Text style={styles.metricBlockVal}>
                {lastSession.pings[0]?.jitterMs ?? 0}
                <Text style={styles.metricUnit}> ms</Text>
              </Text>
            </View>

            <View style={styles.metricBlock}>
              <Text style={styles.metricBlockLabel}>DESCARGA</Text>
              <Text style={[styles.metricBlockVal, { color: colors.secondary }]}>
                {lastSession.throughput.downloadMbps}
                <Text style={styles.metricUnit}> Mbps</Text>
              </Text>
            </View>

            <View style={styles.metricBlock}>
              <Text style={styles.metricBlockLabel}>SUBIDA</Text>
              <Text style={[styles.metricBlockVal, { color: colors.accentPurple }]}>
                {lastSession.throughput.uploadMbps}
                <Text style={styles.metricUnit}> Mbps</Text>
              </Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.noSessionCard}>
          <Text style={styles.noSessionText}>
            Aún no se realizaron pruebas de calidad de servicio.
          </Text>
        </View>
      )}

      {/* 4. Botón de Acción Principal: Iniciar Prueba */}
      <Pressable
        style={styles.startTestBtn}
        onPress={handleStartTest}
        disabled={store.isTesting}
      >
        {store.isTesting ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <>
            <MaterialCommunityIcons name="play-circle-outline" size={26} color={colors.white} />
            <Text style={styles.startTestBtnText}>INICIAR TEST DE VELOCIDAD Y RTT</Text>
          </>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  appTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  historyBtn: {
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bgBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondaryGlow,
    borderWidth: 1,
    borderColor: colors.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  bgBannerText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  lastTimeText: {
    color: colors.textMuted,
    fontSize: 11,
  },
  cellGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  cellItem: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cellLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '800',
    marginBottom: 2,
  },
  cellVal: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  geoCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  geoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  geoTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  geoAccuracy: {
    color: colors.secondary,
    fontSize: 11,
    fontWeight: '700',
  },
  geoAddress: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  geoCoords: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  qosCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  qosTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  qosBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  qosBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  qosOperator: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  metricsSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  metricBlock: {
    alignItems: 'center',
  },
  metricBlockLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '800',
    marginBottom: 2,
  },
  metricBlockVal: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  metricUnit: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  noSessionCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  noSessionText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  startTestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    marginTop: spacing.xl,
    paddingVertical: 16,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    ...Platform.select({
      web: {
        boxShadow: '0px 4px 10px rgba(59, 130, 246, 0.4)',
      },
      default: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 6,
      },
    }),
  },
  startTestBtnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
