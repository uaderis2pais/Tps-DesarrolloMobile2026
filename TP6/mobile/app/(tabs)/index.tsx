import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDiagnosticsStore } from '../../src/store/useDiagnosticsStore';
import { colors, spacing, borderRadius } from '../../src/constants/theme';

export default function DashboardScreen() {
  const router = useRouter();
  const store = useDiagnosticsStore();

  const isOffline = store.simulatedOffline || !store.isOnline;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Superior */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Network Diagnostics</Text>
            <Text style={styles.subtitle}>Field Telecom Suite • LSI 2026</Text>
          </View>
          <View style={[styles.statusBadge, isOffline ? styles.badgeOffline : styles.badgeOnline]}>
            <View style={[styles.statusDot, isOffline ? styles.dotOffline : styles.dotOnline]} />
            <Text style={[styles.statusText, isOffline ? styles.textOffline : styles.textOnline]}>
              {isOffline ? 'MODO OFFLINE' : 'EN LÍNEA'}
            </Text>
          </View>
        </View>

        {/* Banner de Simulación Offline para Evaluación */}
        <View style={styles.offlineToggleRow}>
          <View style={styles.offlineToggleInfo}>
            <Ionicons
              name={isOffline ? 'cloud-offline' : 'cloud-done'}
              size={18}
              color={isOffline ? colors.accentAmber : colors.accentGreen}
            />
            <View style={{ marginLeft: 8 }}>
              <Text style={styles.offlineToggleTitle}>Simulación de Cobertura Nula</Text>
              <Text style={styles.offlineToggleDesc}>
                {isOffline
                  ? 'Acciones se encolan localmente en Outbox'
                  : 'Sincronización directa con el NOC'}
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
      </View>

      {/* Tarjetas de Resumen Rápido (Metrics) */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Ionicons name="git-network" size={20} color={colors.primary} />
          <Text style={styles.statValue}>{store.devices.length}</Text>
          <Text style={styles.statLabel}>Equipos LAN</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="hardware-chip" size={20} color={colors.accentGreen} />
          <Text style={styles.statValue}>{store.snmpHistory.length}</Text>
          <Text style={styles.statLabel}>Consultas SNMP</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="terminal" size={20} color={colors.secondary} />
          <Text style={styles.statValue}>{store.sshHistory.length}</Text>
          <Text style={styles.statLabel}>Sesiones SSH</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons
            name="cloud-upload"
            size={20}
            color={store.outboxStats.pending > 0 ? colors.outboxColor : colors.textMuted}
          />
          <Text
            style={[
              styles.statValue,
              store.outboxStats.pending > 0 && { color: colors.outboxColor },
            ]}
          >
            {store.outboxStats.pending}
          </Text>
          <Text style={styles.statLabel}>En Cola Outbox</Text>
        </View>
      </View>

      {/* Dispositivo Objetivo Actual */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Equipo Objetivo Seleccionado</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/discovery')}>
          <Text style={styles.sectionLink}>Cambiar Equipo</Text>
        </TouchableOpacity>
      </View>

      {store.selectedDevice ? (
        <View style={styles.deviceCard}>
          <View style={styles.deviceHeader}>
            <View style={styles.deviceVendorBadge}>
              <Text style={styles.deviceVendorText}>{store.selectedDevice.vendor}</Text>
            </View>
            <View style={styles.deviceStatus}>
              <View style={styles.greenDot} />
              <Text style={styles.deviceStatusText}>{store.selectedDevice.type}</Text>
            </View>
          </View>

          <Text style={styles.deviceIp}>{store.selectedDevice.ip}</Text>
          <Text style={styles.deviceMac}>MAC: {store.selectedDevice.mac}</Text>
          {store.selectedDevice.model && (
            <Text style={styles.deviceModel}>Modelo: {store.selectedDevice.model}</Text>
          )}

          <View style={styles.deviceActions}>
            <TouchableOpacity
              style={[styles.miniButton, { backgroundColor: colors.accentGreen + '20', borderColor: colors.accentGreen }]}
              onPress={() => router.push('/(tabs)/snmp')}
            >
              <Ionicons name="analytics" size={14} color={colors.accentGreen} />
              <Text style={[styles.miniButtonText, { color: colors.accentGreen }]}>Sondeo SNMP</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.miniButton, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}
              onPress={() => router.push('/(tabs)/ssh')}
            >
              <Ionicons name="terminal" size={14} color={colors.primary} />
              <Text style={[styles.miniButtonText, { color: colors.primary }]}>Diagnóstico SSH</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.emptyDeviceCard}
          onPress={() => router.push('/(tabs)/discovery')}
        >
          <Ionicons name="search" size={24} color={colors.primary} />
          <Text style={styles.emptyDeviceTitle}>Ningún equipo seleccionado</Text>
          <Text style={styles.emptyDeviceSubtitle}>
            Toca aquí para iniciar el escaneo ARP de la subred local.
          </Text>
        </TouchableOpacity>
      )}

      {/* Acciones y Módulos Principales */}
      <Text style={[styles.sectionTitle, { marginTop: spacing.xl, marginBottom: spacing.md }]}>
        Módulos Operativos de Campo
      </Text>

      <View style={styles.modulesGrid}>
        <TouchableOpacity
          style={styles.moduleCard}
          onPress={() => router.push('/(tabs)/discovery')}
        >
          <View style={[styles.moduleIconBox, { backgroundColor: colors.primary + '25' }]}>
            <Ionicons name="git-network" size={24} color={colors.primary} />
          </View>
          <View style={styles.moduleInfo}>
            <Text style={styles.moduleTitle}>Escáner de Red Local</Text>
            <Text style={styles.moduleDesc}>
              Descubrimiento ARP/mDNS de ONTs, routers y switches en la LAN.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.moduleCard}
          onPress={() => router.push('/(tabs)/snmp')}
        >
          <View style={[styles.moduleIconBox, { backgroundColor: colors.accentGreen + '25' }]}>
            <Ionicons name="hardware-chip" size={24} color={colors.accentGreen} />
          </View>
          <View style={styles.moduleInfo}>
            <Text style={styles.moduleTitle}>Sondeo MIB-II (SNMP v1/v2c)</Text>
            <Text style={styles.moduleDesc}>
              Lectura UDP/161 de Uptime, sysName y tráfico de interfaces.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.moduleCard}
          onPress={() => router.push('/(tabs)/ssh')}
        >
          <View style={[styles.moduleIconBox, { backgroundColor: colors.secondary + '25' }]}>
            <Ionicons name="terminal" size={24} color={colors.secondary} />
          </View>
          <View style={styles.moduleInfo}>
            <Text style={styles.moduleTitle}>Consola de Diagnóstico SSH</Text>
            <Text style={styles.moduleDesc}>
              Comandos predefinidos para MikroTik, Cisco, Huawei y Linux.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.moduleCard}
          onPress={() => router.push('/(tabs)/install')}
        >
          <View style={[styles.moduleIconBox, { backgroundColor: colors.accentPurple + '25' }]}>
            <Ionicons name="document-text" size={24} color={colors.accentPurple} />
          </View>
          <View style={styles.moduleInfo}>
            <Text style={styles.moduleTitle}>Acta de Instalación & PDF</Text>
            <Text style={styles.moduleDesc}>
              Relevamiento con GPS, fotos, potencia óptica dBm y reporte oficial.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.moduleCard}
          onPress={() => router.push('/(tabs)/outbox')}
        >
          <View style={[styles.moduleIconBox, { backgroundColor: colors.outboxColor + '25' }]}>
            <Ionicons name="cloud-upload" size={24} color={colors.outboxColor} />
          </View>
          <View style={styles.moduleInfo}>
            <Text style={styles.moduleTitle}>Cola Outbox & Sincronización</Text>
            <Text style={styles.moduleDesc}>
              Gestión de cola offline diferida con sincronización hacia el NOC.
            </Text>
          </View>
          {store.outboxStats.pending > 0 && (
            <View style={styles.badgePendingCount}>
              <Text style={styles.badgePendingText}>{store.outboxStats.pending}</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
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
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 40,
  },
  header: {
    marginBottom: spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  badgeOnline: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  badgeOffline: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  dotOnline: {
    backgroundColor: colors.accentGreen,
  },
  dotOffline: {
    backgroundColor: colors.accentAmber,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  textOnline: {
    color: colors.accentGreen,
  },
  textOffline: {
    color: colors.accentAmber,
  },
  offlineToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  offlineToggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  offlineToggleTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  offlineToggleDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 9,
    color: colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionLink: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  deviceCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primaryDark,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 14px rgba(6, 182, 212, 0.1)',
      },
    }),
  },
  deviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  deviceVendorBadge: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  deviceVendorText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  deviceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accentGreen,
    marginRight: 6,
  },
  deviceStatusText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  deviceIp: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 4,
  },
  deviceMac: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 2,
  },
  deviceModel: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  deviceActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: spacing.md,
  },
  miniButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    gap: 6,
  },
  miniButtonText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyDeviceCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyDeviceTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginTop: 8,
  },
  emptyDeviceSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  modulesGrid: {
    gap: 10,
  },
  moduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  moduleIconBox: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  moduleInfo: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  moduleDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  badgePendingCount: {
    backgroundColor: colors.outboxColor,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    marginRight: 6,
  },
  badgePendingText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '800',
  },
});
