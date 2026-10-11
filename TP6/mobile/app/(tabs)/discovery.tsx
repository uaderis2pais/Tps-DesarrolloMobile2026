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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDiagnosticsStore } from '../../src/store/useDiagnosticsStore';
import { colors, spacing, borderRadius } from '../../src/constants/theme';
import { NetworkDevice } from '../../src/types';

export default function DiscoveryScreen() {
  const router = useRouter();
  const store = useDiagnosticsStore();
  const [subnetInput, setSubnetInput] = useState(store.config.lanScanSubnet || '192.168.1');
  const [filterType, setFilterType] = useState<string>('ALL');

  const { isScanning, scannedCount, totalHosts, currentIp } = store.scanProgress;
  const progressPercent = totalHosts > 0 ? Math.round((scannedCount / totalHosts) * 100) : 0;

  const handleStartScan = async () => {
    store.updateConfig({ lanScanSubnet: subnetInput });
    await store.startScan(subnetInput);
  };

  const filteredDevices = store.devices.filter((dev) => {
    if (filterType === 'ALL') return true;
    return dev.type === filterType;
  });

  const handleSelectAndSnmp = (device: NetworkDevice) => {
    store.selectDevice(device);
    router.push('/(tabs)/snmp');
  };

  const handleSelectAndSsh = (device: NetworkDevice) => {
    store.selectDevice(device);
    router.push('/(tabs)/ssh');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Escáner de Red Local</Text>
            <Text style={styles.subtitle}>Descubrimiento ARP & mDNS • RF-01</Text>
          </View>
          <View style={styles.devicesFoundBadge}>
            <Text style={styles.devicesFoundCount}>{store.devices.length}</Text>
            <Text style={styles.devicesFoundLabel}>Activos</Text>
          </View>
        </View>

        {/* Input de Subred y Botón de Escaneo */}
        <View style={styles.inputCard}>
          <View style={styles.inputRow}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Subred Objetivo (CIDR /24):</Text>
              <TextInput
                style={styles.textInput}
                value={subnetInput}
                onChangeText={setSubnetInput}
                placeholder="192.168.1"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                keyboardType="numbers-and-punctuation"
              />
            </View>
            <TouchableOpacity
              style={[styles.scanButton, isScanning && styles.scanButtonDisabled]}
              onPress={handleStartScan}
              disabled={isScanning}
            >
              {isScanning ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Ionicons name="radio-outline" size={18} color={colors.white} />
                  <Text style={styles.scanButtonText}>Escanear</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Barra de Progreso en Vivo */}
          {isScanning && (
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressText}>
                  Sondeando: {currentIp} ({scannedCount}/{totalHosts})
                </Text>
                <Text style={styles.progressPercent}>{progressPercent}%</Text>
              </View>
              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
              </View>
            </View>
          )}
        </View>

        {/* Filtros rápidos */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersScroll}
          contentContainerStyle={styles.filtersContent}
        >
          {['ALL', 'ONT', 'ROUTER', 'SWITCH', 'ACCESS_POINT'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.filterPill,
                filterType === type && styles.filterPillActive,
              ]}
              onPress={() => setFilterType(type)}
            >
              <Text
                style={[
                  styles.filterPillText,
                  filterType === type && styles.filterPillTextActive,
                ]}
              >
                {type === 'ALL' ? 'Todos' : type}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Lista de Dispositivos */}
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {filteredDevices.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cellular-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>
              {isScanning ? 'Explorando la subred...' : 'No se encontraron equipos'}
            </Text>
            <Text style={styles.emptyDesc}>
              {isScanning
                ? 'Enviando paquetes de sondeo ARP a través de los sockets de red...'
                : 'Presiona "Escanear" para consultar la tabla ARP y descubrir equipos en la LAN.'}
            </Text>
          </View>
        ) : (
          filteredDevices.map((device) => {
            const isSelected = store.selectedDevice?.id === device.id;
            return (
              <View
                key={device.id}
                style={[styles.deviceCard, isSelected && styles.deviceCardSelected]}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardVendorBadge}>
                    <Text style={styles.cardVendorText}>{device.vendor}</Text>
                  </View>
                  <View style={styles.cardTypeBadge}>
                    <Text style={styles.cardTypeText}>{device.type}</Text>
                  </View>
                  <View style={styles.onlineBadge}>
                    <View style={styles.onlineDot} />
                    <Text style={styles.onlineText}>ONLINE</Text>
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <Text style={styles.cardIp}>{device.ip}</Text>
                  <Text style={styles.cardMac}>MAC: {device.mac}</Text>
                  {device.hostname && (
                    <Text style={styles.cardHostname}>Host: {device.hostname}</Text>
                  )}
                  {device.model && (
                    <Text style={styles.cardModel}>Modelo: {device.model}</Text>
                  )}
                </View>

                {/* Protocolos soportados */}
                <View style={styles.protocolsRow}>
                  <View
                    style={[
                      styles.protocolBadge,
                      device.snmpEnabled ? styles.protoActive : styles.protoInactive,
                    ]}
                  >
                    <Ionicons
                      name="hardware-chip-outline"
                      size={12}
                      color={device.snmpEnabled ? colors.accentGreen : colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.protocolText,
                        device.snmpEnabled ? styles.protoTextActive : styles.protoTextInactive,
                      ]}
                    >
                      SNMP UDP/161
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.protocolBadge,
                      device.sshEnabled ? styles.protoActive : styles.protoInactive,
                    ]}
                  >
                    <Ionicons
                      name="terminal-outline"
                      size={12}
                      color={device.sshEnabled ? colors.primary : colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.protocolText,
                        device.sshEnabled ? styles.protoTextActive : styles.protoTextInactive,
                      ]}
                    >
                      SSH TCP/22
                    </Text>
                  </View>
                </View>

                {/* Botones de Acción */}
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      isSelected ? styles.actionButtonSelected : styles.actionButtonSelect,
                    ]}
                    onPress={() => store.selectDevice(device)}
                  >
                    <Ionicons
                      name={isSelected ? 'checkmark-circle' : 'radio-button-off'}
                      size={14}
                      color={isSelected ? colors.accentGreen : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.actionButtonText,
                        isSelected && { color: colors.accentGreen },
                      ]}
                    >
                      {isSelected ? 'Seleccionado' : 'Seleccionar'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.actionButtonSnmp]}
                    onPress={() => handleSelectAndSnmp(device)}
                  >
                    <Ionicons name="analytics" size={14} color={colors.accentGreen} />
                    <Text style={[styles.actionButtonText, { color: colors.accentGreen }]}>
                      SNMP
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.actionButtonSsh]}
                    onPress={() => handleSelectAndSsh(device)}
                  >
                    <Ionicons name="terminal" size={14} color={colors.primary} />
                    <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                      SSH
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
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
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  devicesFoundBadge: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  devicesFoundCount: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  devicesFoundLabel: {
    fontSize: 9,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  inputCard: {
    backgroundColor: colors.surfaceLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  inputContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  scanButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: borderRadius.sm,
    gap: 6,
  },
  scanButtonDisabled: {
    opacity: 0.6,
  },
  scanButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  progressContainer: {
    marginTop: spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  progressPercent: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: colors.surface,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  filtersScroll: {
    marginTop: spacing.md,
  },
  filtersContent: {
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterPillActive: {
    backgroundColor: colors.primaryGlow,
    borderColor: colors.primary,
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterPillTextActive: {
    color: colors.primary,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: 40,
    gap: 12,
  },
  emptyContainer: {
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
  emptyDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  deviceCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  deviceCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceLight,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.xs,
  },
  cardVendorBadge: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardVendorText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  cardTypeBadge: {
    backgroundColor: colors.surfaceHighlight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  cardTypeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accentGreen,
    marginRight: 4,
  },
  onlineText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.accentGreen,
  },
  cardBody: {
    marginVertical: 4,
  },
  cardIp: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  cardMac: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 2,
  },
  cardHostname: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  cardModel: {
    fontSize: 11,
    color: colors.primary,
    marginTop: 1,
  },
  protocolsRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: spacing.sm,
  },
  protocolBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.xs,
    borderWidth: 1,
    gap: 4,
  },
  protoActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  protoInactive: {
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
    borderColor: 'rgba(100, 116, 139, 0.2)',
  },
  protocolText: {
    fontSize: 10,
    fontWeight: '600',
  },
  protoTextActive: {
    color: colors.textSecondary,
  },
  protoTextInactive: {
    color: colors.textMuted,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingTop: spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    gap: 4,
  },
  actionButtonSelect: {
    backgroundColor: colors.surfaceLight,
    borderColor: colors.border,
  },
  actionButtonSelected: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: colors.accentGreen,
  },
  actionButtonSnmp: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: colors.accentGreen,
  },
  actionButtonSsh: {
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderColor: colors.primary,
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
});
