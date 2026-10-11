import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDiagnosticsStore } from '../../src/store/useDiagnosticsStore';
import { colors, spacing, borderRadius } from '../../src/constants/theme';
import { OutboxItem, SnmpDiagnosticResult, SshDiagnosticResult } from '../../src/types';

export default function OutboxScreen() {
  const store = useDiagnosticsStore();
  const [activeTab, setActiveTab] = useState<'OUTBOX' | 'SNMP_HIST' | 'SSH_HIST'>('OUTBOX');
  const [backendUrl, setBackendUrl] = useState(store.config.backendSyncUrl || 'http://localhost:3002');
  const [showConfig, setShowConfig] = useState(false);

  const isOffline = store.simulatedOffline || !store.isOnline;
  const { pending, syncing, synced, failed } = store.outboxStats;

  const handleFlush = async () => {
    store.updateConfig({ backendSyncUrl: backendUrl });
    await store.flushOutbox();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Cola Offline & Sincronización</Text>
            <Text style={styles.subtitle}>Outbox Pattern & Historial • RF-07, RF-08</Text>
          </View>
          <TouchableOpacity
            style={styles.configToggle}
            onPress={() => setShowConfig(!showConfig)}
          >
            <Ionicons name="settings-outline" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Panel de Configuración de Endpoint si está abierto */}
        {showConfig && (
          <View style={styles.configBox}>
            <Text style={styles.configLabel}>URL del Backend de Sincronización:</Text>
            <View style={styles.configRow}>
              <TextInput
                style={styles.configInput}
                value={backendUrl}
                onChangeText={setBackendUrl}
                placeholder="http://localhost:3002"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.configSaveBtn}
                onPress={() => store.updateConfig({ backendSyncUrl: backendUrl })}
              >
                <Text style={styles.configSaveText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Switch de Simulación Offline */}
        <View style={styles.offlineBox}>
          <View style={styles.offlineBoxInfo}>
            <View
              style={[
                styles.modeDot,
                isOffline ? { backgroundColor: colors.accentAmber } : { backgroundColor: colors.accentGreen },
              ]}
            />
            <View>
              <Text style={styles.modeTitle}>
                {isOffline ? 'Modo Sin Conexión (Simulado)' : 'Conectado al NOC (Online)'}
              </Text>
              <Text style={styles.modeSubtitle}>
                {isOffline
                  ? 'Las acciones se encolan para diferirse'
                  : 'Sincronización automática de cola habilitada'}
              </Text>
            </View>
          </View>
          <Switch
            value={store.simulatedOffline}
            onValueChange={() => store.toggleSimulatedOffline()}
            trackColor={{ false: colors.border, true: colors.accentAmber }}
            thumbColor={store.simulatedOffline ? colors.white : colors.textSecondary}
          />
        </View>

        {/* Estadísticas de la Cola */}
        <View style={styles.statsRow}>
          <View style={styles.statPill}>
            <Text style={[styles.statNum, { color: colors.outboxColor }]}>{pending}</Text>
            <Text style={styles.statLabel}>Pendientes</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={[styles.statNum, { color: colors.primary }]}>{syncing}</Text>
            <Text style={styles.statLabel}>En Tránsito</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={[styles.statNum, { color: colors.accentGreen }]}>{synced}</Text>
            <Text style={styles.statLabel}>Sincronizados</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={[styles.statNum, { color: colors.accentRed }]}>{failed}</Text>
            <Text style={styles.statLabel}>Fallidos</Text>
          </View>
        </View>

        {/* Botón de Sincronización Inmediata */}
        <TouchableOpacity
          style={[styles.syncButton, store.isSyncingOutbox && styles.syncButtonDisabled]}
          onPress={handleFlush}
          disabled={store.isSyncingOutbox}
        >
          {store.isSyncingOutbox ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <>
              <Ionicons name="sync" size={16} color={colors.white} />
              <Text style={styles.syncButtonText}>
                {pending > 0 ? `Sincronizar Cola Ahora (${pending} pendientes)` : 'Verificar Sincronización'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Navegación por pestañas de Historial */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'OUTBOX' && styles.tabBtnActive]}
            onPress={() => setActiveTab('OUTBOX')}
          >
            <Text style={[styles.tabText, activeTab === 'OUTBOX' && styles.tabTextActive]}>
              Cola Outbox ({store.outboxItems.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'SNMP_HIST' && styles.tabBtnActive]}
            onPress={() => setActiveTab('SNMP_HIST')}
          >
            <Text style={[styles.tabText, activeTab === 'SNMP_HIST' && styles.tabTextActive]}>
              Historial SNMP ({store.snmpHistory.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'SSH_HIST' && styles.tabBtnActive]}
            onPress={() => setActiveTab('SSH_HIST')}
          >
            <Text style={[styles.tabText, activeTab === 'SSH_HIST' && styles.tabTextActive]}>
              Historial SSH ({store.sshHistory.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Contenido Principal */}
      <ScrollView style={styles.mainScroll} contentContainerStyle={styles.mainContent}>
        {/* Pestaña: Cola Outbox (RF-07) */}
        {activeTab === 'OUTBOX' && (
          <View style={styles.itemsList}>
            {store.outboxItems.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-done-circle-outline" size={48} color={colors.accentGreen} />
                <Text style={styles.emptyTitle}>Cola Vacía y Sincronizada</Text>
                <Text style={styles.emptySubtitle}>
                  Todas las acciones técnicas han sido enviadas al backend o aún no se han registrado eventos.
                </Text>
              </View>
            ) : (
              store.outboxItems.map((item: OutboxItem) => (
                <View key={item.id} style={styles.outboxCard}>
                  <View style={styles.outboxCardHeader}>
                    <View style={styles.actionTypeBadge}>
                      <Text style={styles.actionTypeText}>{item.type}</Text>
                    </View>
                    <View
                      style={[
                        styles.itemStatusBadge,
                        item.status === 'SYNCED'
                          ? styles.statusSynced
                          : item.status === 'SYNCING'
                          ? styles.statusSyncing
                          : item.status === 'FAILED'
                          ? styles.statusFailed
                          : styles.statusPending,
                      ]}
                    >
                      <Text
                        style={[
                          styles.itemStatusText,
                          item.status === 'SYNCED'
                            ? { color: colors.accentGreen }
                            : item.status === 'FAILED'
                            ? { color: colors.accentRed }
                            : { color: colors.outboxColor },
                        ]}
                      >
                        {item.status}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.itemSummary}>
                    {item.payload?.clientName
                      ? `Instalación: ${item.payload.clientName} (${item.payload.subscriberNumber})`
                      : item.payload?.summary || `Diagnóstico: ${item.payload?.deviceIp || 'LAN'}`}
                  </Text>

                  <View style={styles.itemFooter}>
                    <Text style={styles.itemDate}>
                      {new Date(item.createdAt).toLocaleTimeString()} • Reintentos: {item.retryCount}/{item.maxRetries}
                    </Text>
                    <Text style={styles.itemId}>{item.id.substring(0, 12)}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Pestaña: Historial SNMP (RF-08) */}
        {activeTab === 'SNMP_HIST' && (
          <View style={styles.itemsList}>
            {store.snmpHistory.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="hardware-chip-outline" size={48} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>Sin Consultas SNMP Previas</Text>
                <Text style={styles.emptySubtitle}>
                  Dirígete a la pestaña SNMP MIB para ejecutar una consulta sobre UDP/161.
                </Text>
              </View>
            ) : (
              store.snmpHistory.map((snmp: SnmpDiagnosticResult, idx: number) => (
                <View key={idx} style={styles.outboxCard}>
                  <View style={styles.outboxCardHeader}>
                    <Text style={styles.histTitle}>{snmp.sysName || snmp.deviceIp}</Text>
                    <Text style={styles.histDuration}>{snmp.latencyMs}ms</Text>
                  </View>
                  <Text style={styles.histSub}>Uptime: {snmp.sysUpTimeFormatted}</Text>
                  <Text style={styles.histDesc}>{snmp.sysDescr}</Text>
                  <Text style={styles.itemDate}>
                    {new Date(snmp.timestamp).toLocaleString()} • {snmp.interfaces.length} Interfaces analizadas
                  </Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* Pestaña: Historial SSH (RF-08) */}
        {activeTab === 'SSH_HIST' && (
          <View style={styles.itemsList}>
            {store.sshHistory.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="terminal-outline" size={48} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>Sin Comandos SSH Previos</Text>
                <Text style={styles.emptySubtitle}>
                  Ejecuta diagnósticos desde la pestaña SSH Shell para registrar auditorías.
                </Text>
              </View>
            ) : (
              store.sshHistory.map((ssh: SshDiagnosticResult, idx: number) => (
                <View key={idx} style={styles.outboxCard}>
                  <View style={styles.outboxCardHeader}>
                    <Text style={styles.histTitle}>{ssh.command}</Text>
                    <View style={styles.vendorPillSmall}>
                      <Text style={styles.vendorPillSmallText}>{ssh.vendor}</Text>
                    </View>
                  </View>
                  <Text style={styles.histSub}>Destino: {ssh.deviceIp} ({ssh.durationMs}ms)</Text>
                  <Text style={styles.sshSnippet} numberOfLines={2}>
                    {ssh.output.trim()}
                  </Text>
                  <Text style={styles.itemDate}>{new Date(ssh.timestamp).toLocaleString()}</Text>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: colors.outboxColor,
    fontWeight: '600',
    marginTop: 2,
  },
  configToggle: {
    padding: 6,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceLight,
  },
  configBox: {
    backgroundColor: colors.surfaceLight,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  configLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  configRow: {
    flexDirection: 'row',
    gap: 8,
  },
  configInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xs,
    paddingHorizontal: 8,
    paddingVertical: 4,
    color: colors.text,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  configSaveBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderRadius: borderRadius.xs,
  },
  configSaveText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  offlineBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  offlineBoxInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  modeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  modeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  modeSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statPill: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    paddingVertical: 6,
    borderRadius: borderRadius.xs,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statNum: {
    fontSize: 14,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 9,
    color: colors.textMuted,
    fontWeight: '600',
    marginTop: 1,
  },
  syncButton: {
    backgroundColor: colors.outboxColor,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: borderRadius.sm,
    gap: 6,
  },
  syncButtonDisabled: {
    opacity: 0.6,
  },
  syncButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginTop: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: colors.outboxColor,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.text,
    fontWeight: '700',
  },
  mainScroll: {
    flex: 1,
  },
  mainContent: {
    padding: spacing.lg,
    paddingBottom: 40,
  },
  itemsList: {
    gap: 10,
  },
  emptyState: {
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  outboxCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  outboxCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionTypeBadge: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  actionTypeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  itemStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  statusPending: {
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
  },
  statusSyncing: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
  },
  statusSynced: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  statusFailed: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  itemStatusText: {
    fontSize: 9,
    fontWeight: '800',
  },
  itemSummary: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  itemDate: {
    fontSize: 10,
    color: colors.textMuted,
  },
  itemId: {
    fontSize: 10,
    color: colors.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  histTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  histDuration: {
    fontSize: 10,
    color: colors.accentGreen,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  histSub: {
    fontSize: 11,
    color: colors.primary,
  },
  histDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  vendorPillSmall: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  vendorPillSmallText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.primary,
  },
  sshSnippet: {
    fontSize: 10,
    color: colors.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 2,
  },
});
