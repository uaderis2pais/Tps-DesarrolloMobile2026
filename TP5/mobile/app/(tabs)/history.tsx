import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { useQoSStore } from '../../src/store/useQoSStore';
import { colors, spacing, borderRadius } from '../../src/constants/theme';
import { LatencyChart } from '../../src/components/LatencyChart';
import { ThroughputChart } from '../../src/components/ThroughputChart';
import { FilterModal } from '../../src/components/FilterModal';
import { ExportModal } from '../../src/components/ExportModal';
import { QoSScorer } from '../../src/engine/QoSScorer';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function HistoryAnalyticsScreen() {
  const store = useQoSStore();
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'charts' | 'list'>('charts');

  const sessions = store.filteredSessions;

  const hasActiveFilters =
    store.filters.networkTypes.length > 0 ||
    store.filters.dateRange !== 'all' ||
    !!store.filters.minQoS ||
    !!store.filters.searchQuery;

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Encabezado */}
        <View style={styles.header}>
          <View>
            <Text style={styles.screenTitle}>Historial y Analíticas</Text>
            <Text style={styles.subtitle}>
              Series Temporales y Exportación (RF-06, RF-08, RF-09)
            </Text>
          </View>
        </View>

        {/* Barra de Acciones: Filtros y Exportación */}
        <View style={styles.actionsBar}>
          <Pressable
            style={[styles.actionBtn, hasActiveFilters && styles.actionBtnActive]}
            onPress={() => setFilterModalVisible(true)}
          >
            <MaterialCommunityIcons
              name="filter-variant"
              size={18}
              color={hasActiveFilters ? colors.white : colors.textSecondary}
            />
            <Text style={[styles.actionBtnText, hasActiveFilters && styles.actionBtnTextActive]}>
              {hasActiveFilters ? 'Filtros Activos' : 'Filtrar'}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.actionBtn, styles.exportBtn]}
            onPress={() => setExportModalVisible(true)}
          >
            <MaterialCommunityIcons name="cloud-download-outline" size={18} color={colors.white} />
            <Text style={styles.exportBtnText}>Exportar CSV/JSON</Text>
          </Pressable>
        </View>

        {/* Pestañas internas: Gráficos vs Lista */}
        <View style={styles.tabsRow}>
          <Pressable
            style={[styles.tab, selectedTab === 'charts' && styles.tabActive]}
            onPress={() => setSelectedTab('charts')}
          >
            <MaterialCommunityIcons
              name="chart-line"
              size={18}
              color={selectedTab === 'charts' ? colors.primary : colors.textSecondary}
            />
            <Text style={[styles.tabText, selectedTab === 'charts' && styles.tabTextActive]}>
              Series Temporales (RF-06)
            </Text>
          </Pressable>

          <Pressable
            style={[styles.tab, selectedTab === 'list' && styles.tabActive]}
            onPress={() => setSelectedTab('list')}
          >
            <MaterialCommunityIcons
              name="format-list-bulleted"
              size={18}
              color={selectedTab === 'list' ? colors.primary : colors.textSecondary}
            />
            <Text style={[styles.tabText, selectedTab === 'list' && styles.tabTextActive]}>
              Lista de Sesiones ({sessions.length})
            </Text>
          </Pressable>
        </View>

        {selectedTab === 'charts' ? (
          <View style={styles.chartsSection}>
            {/* 1. Serie Temporal de Latencia y Jitter */}
            <Text style={styles.chartTitle}>Evolución Temporal de Latencia (RTT ms)</Text>
            <LatencyChart sessions={sessions} height={190} />

            {/* 2. Serie Temporal de Throughput */}
            <Text style={styles.chartTitle}>Evolución Temporal de Throughput (Mbps)</Text>
            <ThroughputChart sessions={sessions} height={190} />
          </View>
        ) : (
          <View style={styles.listSection}>
            {sessions.length === 0 ? (
              <View style={styles.emptyCard}>
                <MaterialCommunityIcons name="file-search-outline" size={48} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>No hay mediciones que coincidan</Text>
                <Text style={styles.emptySubtitle}>Intenta ajustar o reiniciar los filtros de búsqueda</Text>
              </View>
            ) : (
              sessions.map((item) => {
                const qosColor = QoSScorer.getQoSColor(item.overallQoSRating);
                const validPings = item.pings.filter((p) => p.status === 'success' || p.status === 'warning');
                const avgRtt = validPings.length > 0
                  ? Math.round(validPings.reduce((sum, p) => sum + p.avgRttMs, 0) / validPings.length)
                  : 0;

                return (
                  <View key={item.id} style={styles.sessionCard}>
                    <View style={styles.sessionCardTop}>
                      <View style={styles.sessionNetCol}>
                        <View style={styles.sessionNetRow}>
                          <Text style={[styles.netTag, { backgroundColor: qosColor + '20', color: qosColor }]}>
                            {item.signal.networkType}
                          </Text>
                          <Text style={styles.sessionOperator}>
                            {item.signal.operator}
                          </Text>
                        </View>
                        <Text style={styles.sessionDate}>
                          {new Date(item.timestamp).toLocaleString()}
                        </Text>
                      </View>

                      <View style={styles.cardRightCol}>
                        <View style={[styles.qosMiniBadge, { backgroundColor: qosColor + '25' }]}>
                          <Text style={[styles.qosMiniText, { color: qosColor }]}>
                            {item.overallQoSRating}
                          </Text>
                        </View>
                        <Pressable
                          onPress={() => store.deleteSession(item.id)}
                          style={styles.deleteBtn}
                        >
                          <MaterialCommunityIcons name="trash-can-outline" size={16} color={colors.textMuted} />
                        </Pressable>
                      </View>
                    </View>

                    {/* Resumen de Métricas */}
                    <View style={styles.sessionMetricsRow}>
                      <View style={styles.miniMetric}>
                        <Text style={styles.miniMetricLabel}>LATENCIA</Text>
                        <Text style={styles.miniMetricVal}>{avgRtt} ms</Text>
                      </View>
                      <View style={styles.miniMetric}>
                        <Text style={styles.miniMetricLabel}>DESCARGA</Text>
                        <Text style={[styles.miniMetricVal, { color: colors.secondary }]}>
                          {item.throughput.downloadMbps} Mbps
                        </Text>
                      </View>
                      <View style={styles.miniMetric}>
                        <Text style={styles.miniMetricLabel}>SUBIDA</Text>
                        <Text style={[styles.miniMetricVal, { color: colors.accentPurple }]}>
                          {item.throughput.uploadMbps} Mbps
                        </Text>
                      </View>
                      <View style={styles.miniMetric}>
                        <Text style={styles.miniMetricLabel}>SEÑAL</Text>
                        <Text style={styles.miniMetricVal}>{item.signal.dbm} dBm</Text>
                      </View>
                    </View>

                    {item.location.addressSummary && (
                      <Text style={styles.sessionAddress} numberOfLines={1}>
                        📍 {item.location.addressSummary}
                      </Text>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* Modal de Filtros (RF-09) */}
      <FilterModal
        visible={filterModalVisible}
        currentFilters={store.filters}
        onApply={(f) => store.setFilters(f)}
        onClose={() => setFilterModalVisible(false)}
      />

      {/* Modal de Exportación (RF-08) */}
      <ExportModal
        visible={exportModalVisible}
        sessions={sessions}
        onClose={() => setExportModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: 40,
  },
  header: {
    marginBottom: spacing.md,
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
  actionsBar: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  actionBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  actionBtnText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  actionBtnTextActive: {
    color: colors.white,
  },
  exportBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    justifyContent: 'center',
  },
  exportBtnText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: 4,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: borderRadius.sm,
    gap: 6,
  },
  tabActive: {
    backgroundColor: colors.surfaceHighlight,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  tabTextActive: {
    color: colors.text,
  },
  chartsSection: {
    marginBottom: spacing.lg,
  },
  chartTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  listSection: {
    gap: spacing.md,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    padding: spacing.xxl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginTop: spacing.md,
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  sessionCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sessionCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  sessionNetCol: {
    flex: 1,
  },
  sessionNetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  netTag: {
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  sessionOperator: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  sessionDate: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  cardRightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  qosMiniBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  qosMiniText: {
    fontSize: 10,
    fontWeight: '800',
  },
  deleteBtn: {
    padding: 4,
  },
  sessionMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceLight,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  miniMetric: {
    alignItems: 'center',
    flex: 1,
  },
  miniMetricLabel: {
    color: colors.textMuted,
    fontSize: 8,
    fontWeight: '800',
    marginBottom: 2,
  },
  miniMetricVal: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
  sessionAddress: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: spacing.sm,
  },
});
