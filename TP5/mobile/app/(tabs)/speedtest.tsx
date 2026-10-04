import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useQoSStore } from '../../src/store/useQoSStore';
import { colors, spacing, borderRadius } from '../../src/constants/theme';
import { SpeedometerGauge } from '../../src/components/SpeedometerGauge';
import { HostPingCard } from '../../src/components/HostPingCard';
import { QoSScorer } from '../../src/engine/QoSScorer';
import { resolveNetworkUrl } from '../../src/utils/networkUtils';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function SpeedTestScreen() {
  const store = useQoSStore();

  const handleRun = async () => {
    await store.runFullTest();
  };

  const getPhaseTitle = () => {
    switch (store.testPhase) {
      case 'pings':
        return 'SONDEANDO HOSTS (RTT & JITTER)';
      case 'download':
        return 'TEST DE DESCARGA (THROUGHPUT)';
      case 'upload':
        return 'TEST DE SUBIDA (THROUGHPUT)';
      case 'completed':
        return 'MEDICIÓN COMPLETADA';
      default:
        return 'LISTO PARA MEDIR';
    }
  };

  const liveSpeed =
    store.testPhase === 'download'
      ? store.liveDownloadMbps
      : store.testPhase === 'upload'
      ? store.liveUploadMbps
      : store.lastSession?.throughput.downloadMbps || 0;

  const currentHostsToRender =
    store.activeHostPings.length > 0
      ? store.activeHostPings
      : store.lastSession?.pings || [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Encabezado */}
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Test de Velocidad y QoS</Text>
        <Text style={styles.subtitle}>
          Latencia RTT, Jitter RFC 3550 y Throughput (RF-02, RF-03)
        </Text>
      </View>

      {/* Selector de Servidor de Medición (RF-03) */}
      <View style={styles.serverCard}>
        <Text style={styles.serverCardLabel}>SERVIDOR DE THROUGHPUT (RF-03):</Text>
        <View style={styles.serverRow}>
          <Pressable
            style={[
              styles.serverTab,
              store.config.backendUrl.includes('cloudflare.com') && styles.serverTabActive,
            ]}
            onPress={() => store.updateConfig({ backendUrl: 'https://speed.cloudflare.com' })}
            disabled={store.isTesting}
          >
            <MaterialCommunityIcons
              name="cloud-check"
              size={15}
              color={store.config.backendUrl.includes('cloudflare.com') ? colors.white : colors.textSecondary}
            />
            <Text
              style={[
                styles.serverTabText,
                store.config.backendUrl.includes('cloudflare.com') && styles.serverTabTextActive,
              ]}
            >
              Internet Real (Cloudflare)
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.serverTab,
              !store.config.backendUrl.includes('cloudflare.com') && styles.serverTabActive,
            ]}
            onPress={() => store.updateConfig({ backendUrl: 'http://localhost:3001' })}
            disabled={store.isTesting}
          >
            <MaterialCommunityIcons
              name="server-network"
              size={15}
              color={!store.config.backendUrl.includes('cloudflare.com') ? colors.white : colors.textSecondary}
            />
            <Text
              style={[
                styles.serverTabText,
                !store.config.backendUrl.includes('cloudflare.com') && styles.serverTabTextActive,
              ]}
            >
              Servidor Local (Node.js)
            </Text>
          </Pressable>
        </View>
        <Text style={styles.serverHelpText}>
          {store.config.backendUrl.includes('cloudflare.com')
            ? '🌐 Midiendo velocidad real de tu enlace a Internet (WiFi / Datos Móviles).'
            : `💻 Midiendo contra backend Node.js en ${resolveNetworkUrl(store.config.backendUrl)} (calibrado a canal celular).`}
        </Text>
      </View>

      {/* Velocímetro Dinámico */}
      <View style={styles.gaugeCard}>
        <SpeedometerGauge
          value={liveSpeed}
          sublabel={getPhaseTitle()}
          isTesting={store.isTesting}
        />

        {/* Barra de Progreso */}
        {store.isTesting && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${store.liveProgressPct}%` }]} />
          </View>
        )}

        {/* Métricas en vivo de Descarga y Subida */}
        <View style={styles.liveMetricsRow}>
          <View style={styles.metricBlock}>
            <MaterialCommunityIcons name="arrow-down" size={18} color={colors.secondary} />
            <Text style={styles.metricLabel}>DESCARGA</Text>
            <Text style={[styles.metricVal, { color: colors.secondary }]}>
              {(store.testPhase === 'download'
                ? store.liveDownloadMbps
                : store.lastSession?.throughput.downloadMbps || 0
              ).toFixed(1)}{' '}
              <Text style={styles.unit}>Mbps</Text>
            </Text>
          </View>

          <View style={styles.separator} />

          <View style={styles.metricBlock}>
            <MaterialCommunityIcons name="arrow-up" size={18} color={colors.accentPurple} />
            <Text style={styles.metricLabel}>SUBIDA</Text>
            <Text style={[styles.metricVal, { color: colors.accentPurple }]}>
              {(store.testPhase === 'upload'
                ? store.liveUploadMbps
                : store.lastSession?.throughput.uploadMbps || 0
              ).toFixed(1)}{' '}
              <Text style={styles.unit}>Mbps</Text>
            </Text>
          </View>
        </View>
      </View>

      {/* Botón de Ejecución */}
      <Pressable
        style={[styles.actionBtn, store.isTesting && styles.actionBtnTesting]}
        onPress={handleRun}
        disabled={store.isTesting}
      >
        {store.isTesting ? (
          <View style={styles.btnTestingRow}>
            <ActivityIndicator color={colors.white} />
            <Text style={styles.actionBtnText}>EJECUTANDO PRUEBA DE RED...</Text>
          </View>
        ) : (
          <Text style={styles.actionBtnText}>
            {store.lastSession ? 'REPETIR PRUEBA COMPLETA' : 'INICIAR PRUEBA QoS'}
          </Text>
        )}
      </Pressable>

      {/* Evaluación QoS del resultado */}
      {store.lastSession && !store.isTesting && (
        <View
          style={[
            styles.summaryCard,
            {
              borderColor: QoSScorer.getQoSColor(store.lastSession.overallQoSRating),
            },
          ]}
        >
          <View style={styles.summaryTop}>
            <MaterialCommunityIcons
              name="check-decagram"
              size={22}
              color={QoSScorer.getQoSColor(store.lastSession.overallQoSRating)}
            />
            <Text style={styles.summaryTitle}>
              Calidad Global:{' '}
              {QoSScorer.getQoSTitle(store.lastSession.overallQoSRating)}
            </Text>
          </View>
          <Text style={styles.summaryDesc}>
            Conexión en {store.lastSession.signal.operator} (
            {store.lastSession.signal.networkType}) a {store.lastSession.signal.dbm} dBm.
            Medición georreferenciada guardada en historial local.
          </Text>
        </View>
      )}

      {/* Matriz de Sondas Ping a Hosts (RF-02) */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>SONDAS MULTI-HOST (RF-02)</Text>
        <Text style={styles.sectionSub}>3+ Hosts configurables</Text>
      </View>

      {currentHostsToRender.map((ping) => (
        <HostPingCard key={ping.hostId} result={ping} />
      ))}
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
    marginBottom: spacing.lg,
  },
  screenTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  gaugeCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  progressContainer: {
    width: '80%',
    height: 6,
    backgroundColor: colors.surfaceLight,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: spacing.md,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.secondary,
  },
  liveMetricsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  metricBlock: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 4,
    marginBottom: 2,
  },
  metricVal: {
    fontSize: 18,
    fontWeight: '900',
  },
  unit: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  separator: {
    width: 1,
    height: '70%',
    backgroundColor: colors.border,
    alignSelf: 'center',
  },
  actionBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  actionBtnTesting: {
    backgroundColor: colors.surfaceHighlight,
  },
  btnTestingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionBtnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    marginBottom: spacing.lg,
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 6,
  },
  summaryTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  summaryDesc: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  sectionSub: {
    color: colors.textMuted,
    fontSize: 11,
  },
  serverCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  serverCardLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  serverRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: 6,
  },
  serverTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.surfaceLight,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  serverTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  serverTabText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  serverTabTextActive: {
    color: colors.white,
    fontWeight: '900',
  },
  serverHelpText: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 15,
  },
});
