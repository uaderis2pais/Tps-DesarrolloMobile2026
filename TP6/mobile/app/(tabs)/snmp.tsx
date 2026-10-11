import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDiagnosticsStore } from '../../src/store/useDiagnosticsStore';
import { colors, spacing, borderRadius } from '../../src/constants/theme';
import { SnmpInterfaceStats } from '../../src/types';

export default function SnmpScreen() {
  const store = useDiagnosticsStore();
  const [targetIp, setTargetIp] = useState(store.selectedDevice?.ip || '192.168.1.1');
  const [community, setCommunity] = useState(store.config.defaultSnmpCommunity || 'public');
  const [isLoading, setIsLoading] = useState(false);
  const [showRawHex, setShowRawHex] = useState(false);

  const result = store.lastSnmpResult;

  const handleQuery = async () => {
    setIsLoading(true);
    try {
      await store.querySnmp(targetIp, community);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Sondeo MIB-II SNMP</Text>
            <Text style={styles.subtitle}>UDP/161 • ASN.1/BER Parser • RF-02</Text>
          </View>
          <View style={styles.protoBadge}>
            <Text style={styles.protoBadgeText}>SNMPv2c</Text>
          </View>
        </View>

        {/* Formulario de Consulta UDP */}
        <View style={styles.formCard}>
          <View style={styles.formRow}>
            <View style={{ flex: 2 }}>
              <Text style={styles.fieldLabel}>IP del Equipo:</Text>
              <TextInput
                style={styles.textInput}
                value={targetIp}
                onChangeText={setTargetIp}
                placeholder="192.168.1.1"
                placeholderTextColor={colors.textMuted}
                keyboardType="numbers-and-punctuation"
                autoCapitalize="none"
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Comunidad:</Text>
              <TextInput
                style={styles.textInput}
                value={community}
                onChangeText={setCommunity}
                placeholder="public"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.queryButton, isLoading && styles.queryButtonDisabled]}
            onPress={handleQuery}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <Ionicons name="send" size={16} color={colors.white} />
                <Text style={styles.queryButtonText}>Enviar GetRequest (UDP/161)</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Resultados SNMP */}
      {result ? (
        <View style={styles.resultsContainer}>
          {/* Tarjeta de Estado del Dispositivo */}
          <View style={styles.deviceCard}>
            <View style={styles.deviceHeader}>
              <View style={styles.statusPill}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>GetResponse OK</Text>
              </View>
              <Text style={styles.latencyText}>{result.latencyMs} ms RTT</Text>
            </View>

            <Text style={styles.sysName}>{result.sysName || 'Sin Nombre'}</Text>
            <Text style={styles.sysDescr}>{result.sysDescr}</Text>

            <View style={styles.oidGrid}>
              <View style={styles.oidItem}>
                <Text style={styles.oidLabel}>Uptime del Sistema (sysUpTime):</Text>
                <Text style={styles.oidValueHighlighted}>{result.sysUpTimeFormatted}</Text>
                <Text style={styles.oidSubtext}>
                  {result.sysUpTime.toLocaleString()} centésimas de seg.
                </Text>
              </View>

              <View style={styles.oidItem}>
                <Text style={styles.oidLabel}>Identificador OID (sysObjectID):</Text>
                <Text style={styles.oidValueMono}>{result.sysObjectID}</Text>
              </View>

              <View style={styles.oidItem}>
                <Text style={styles.oidLabel}>Ubicación (sysLocation):</Text>
                <Text style={styles.oidValue}>{result.sysLocation || 'N/A'}</Text>
              </View>

              <View style={styles.oidItem}>
                <Text style={styles.oidLabel}>Contacto Técnico (sysContact):</Text>
                <Text style={styles.oidValue}>{result.sysContact || 'N/A'}</Text>
              </View>
            </View>
          </View>

          {/* Tabla de Tráfico de Interfaces (RFC 1213 ifTable) */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Tráfico de Interfaces (ifTable)</Text>
                <Text style={styles.sectionSubtitle}>
                  Monitoreo de puertos Ethernet y PON en tiempo real
                </Text>
              </View>
              <Ionicons name="swap-vertical" size={20} color={colors.accentGreen} />
            </View>

            <View style={styles.interfacesList}>
              {result.interfaces.map((iface: SnmpInterfaceStats) => (
                <View key={iface.index} style={styles.ifaceCard}>
                  <View style={styles.ifaceHeader}>
                    <View style={styles.ifaceNameBadge}>
                      <Text style={styles.ifaceName}>{iface.name}</Text>
                    </View>
                    <View
                      style={[
                        styles.ifaceStatusBadge,
                        iface.operStatus === 'UP' ? styles.ifaceUp : styles.ifaceDown,
                      ]}
                    >
                      <Text
                        style={[
                          styles.ifaceStatusText,
                          iface.operStatus === 'UP'
                            ? { color: colors.accentGreen }
                            : { color: colors.accentRed },
                        ]}
                      >
                        {iface.operStatus}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.trafficRow}>
                    <View style={styles.trafficItem}>
                      <View style={styles.trafficLabelRow}>
                        <Ionicons name="arrow-down-outline" size={14} color={colors.primary} />
                        <Text style={styles.trafficLabel}>Bajada (In):</Text>
                      </View>
                      <Text style={styles.trafficValue}>{iface.inMbps.toFixed(2)} Mbps</Text>
                      <Text style={styles.octetsSubtext}>
                        {iface.inOctets.toLocaleString()} octetos
                      </Text>
                    </View>

                    <View style={styles.trafficItem}>
                      <View style={styles.trafficLabelRow}>
                        <Ionicons name="arrow-up-outline" size={14} color={colors.accentGreen} />
                        <Text style={styles.trafficLabel}>Subida (Out):</Text>
                      </View>
                      <Text style={styles.trafficValue}>{iface.outMbps.toFixed(2)} Mbps</Text>
                      <Text style={styles.octetsSubtext}>
                        {iface.outOctets.toLocaleString()} octetos
                      </Text>
                    </View>
                  </View>

                  {/* Barras de Medición de Ancho de Banda */}
                  <View style={styles.trafficBarContainer}>
                    <View
                      style={[
                        styles.trafficBarIn,
                        { width: `${Math.min(100, (iface.inMbps / 100) * 100)}%` },
                      ]}
                    />
                    <View
                      style={[
                        styles.trafficBarOut,
                        { width: `${Math.min(100, (iface.outMbps / 100) * 100)}%` },
                      ]}
                    />
                  </View>

                  {iface.inErrors > 0 && (
                    <Text style={styles.errorsWarning}>
                      ⚠ Errores en interfaz: In={iface.inErrors} | Out={iface.outErrors}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* Inspector de Tramas Crudas BER / ASN.1 */}
          <View style={styles.sectionCard}>
            <TouchableOpacity
              style={styles.hexToggleRow}
              onPress={() => setShowRawHex(!showRawHex)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="code-slash" size={18} color={colors.primary} />
                <Text style={styles.hexToggleTitle}>Inspector de Tramas Crudas (ASN.1/BER)</Text>
              </View>
              <Ionicons
                name={showRawHex ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            {showRawHex && (
              <View style={styles.hexContainer}>
                <Text style={styles.hexExplanation}>
                  Secuencia ASN.1 decodificada por el parser propio:
                  Tag 0x30 (SEQUENCE) → Tag 0x02 (INTEGER v2c) → Tag 0x04 (OCTET STRING
                  community) → Tag 0xA2 (GetResponse PDU).
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <Text style={styles.hexText}>{result.rawBerHex || '30 82 01 2a 02 01 01 04 06 70 75 62 6c 69 63 a2 ...'}</Text>
                </ScrollView>
              </View>
            )}
          </View>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="hardware-chip-outline" size={56} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>Esperando consulta SNMP</Text>
          <Text style={styles.emptySubtitle}>
            Introduce la IP del equipo y presiona "Enviar GetRequest" para interrogar los OIDs
            estándar del MIB-II sobre UDP/161.
          </Text>
        </View>
      )}
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
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: colors.accentGreen,
    fontWeight: '600',
    marginTop: 2,
  },
  protoBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: colors.accentGreen,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.xs,
  },
  protoBadgeText: {
    color: colors.accentGreen,
    fontSize: 11,
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
  },
  fieldLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  queryButton: {
    backgroundColor: colors.accentGreen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: borderRadius.sm,
    gap: 8,
  },
  queryButtonDisabled: {
    opacity: 0.6,
  },
  queryButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  resultsContainer: {
    gap: 14,
  },
  deviceCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  deviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.xs,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accentGreen,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    color: colors.accentGreen,
    fontWeight: '700',
  },
  latencyText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  sysName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginTop: 6,
  },
  sysDescr: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  oidGrid: {
    marginTop: spacing.md,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingTop: spacing.md,
  },
  oidItem: {
    backgroundColor: colors.surfaceLight,
    padding: spacing.sm,
    borderRadius: borderRadius.xs,
  },
  oidLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  oidValueHighlighted: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.accentGreen,
    marginTop: 2,
  },
  oidSubtext: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 1,
  },
  oidValueMono: {
    fontSize: 12,
    color: colors.primary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 2,
  },
  oidValue: {
    fontSize: 12,
    color: colors.text,
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  interfacesList: {
    gap: 10,
  },
  ifaceCard: {
    backgroundColor: colors.surfaceLight,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ifaceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  ifaceNameBadge: {
    backgroundColor: colors.surfaceHighlight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.xs,
  },
  ifaceName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  ifaceStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  ifaceUp: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  ifaceDown: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  ifaceStatusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  trafficRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  trafficItem: {
    flex: 1,
  },
  trafficLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trafficLabel: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  trafficValue: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    marginTop: 2,
  },
  octetsSubtext: {
    fontSize: 9,
    color: colors.textMuted,
  },
  trafficBarContainer: {
    flexDirection: 'row',
    height: 4,
    backgroundColor: colors.surface,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 8,
    gap: 2,
  },
  trafficBarIn: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  trafficBarOut: {
    height: '100%',
    backgroundColor: colors.accentGreen,
  },
  errorsWarning: {
    fontSize: 10,
    color: colors.accentAmber,
    marginTop: 6,
  },
  hexToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hexToggleTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  hexContainer: {
    marginTop: spacing.md,
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hexExplanation: {
    fontSize: 10,
    color: colors.textMuted,
    lineHeight: 14,
    marginBottom: 8,
  },
  hexText: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: colors.primary,
    letterSpacing: 1,
  },
  emptyState: {
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
});
