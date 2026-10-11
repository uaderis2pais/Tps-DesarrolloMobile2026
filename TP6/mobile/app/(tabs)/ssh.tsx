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
import { SSH_PRESETS } from '../../src/engine/ssh/SshClient';
import { DeviceVendor, SshCommandPreset } from '../../src/types';

export default function SshScreen() {
  const store = useDiagnosticsStore();
  const [selectedVendor, setSelectedVendor] = useState<DeviceVendor>(
    store.selectedDevice?.vendor || 'MikroTik'
  );
  const [customCommand, setCustomCommand] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<
    Array<{ command: string; output: string; timestamp: string; durationMs: number }>
  >([]);

  const presets = SSH_PRESETS.filter((p) => p.vendor === selectedVendor);
  const currentIp = store.selectedDevice?.ip || '192.168.1.1';

  const runCommand = async (cmdToRun: string) => {
    if (!cmdToRun.trim()) return;
    setIsExecuting(true);
    try {
      const res = await store.executeSsh(cmdToRun);
      setTerminalLogs((prev) => [
        {
          command: cmdToRun,
          output: res.output,
          timestamp: new Date().toLocaleTimeString(),
          durationMs: res.durationMs,
        },
        ...prev,
      ]);
    } finally {
      setIsExecuting(false);
    }
  };

  const clearTerminal = () => {
    setTerminalLogs([]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Consola SSH Remota</Text>
            <Text style={styles.subtitle}>TCP/22 • Presets & Vault Seguro • RF-03</Text>
          </View>
          <View style={styles.vaultBadge}>
            <Ionicons name="lock-closed" size={12} color={colors.accentGreen} />
            <Text style={styles.vaultBadgeText}>Vault Cifrado (OWASP)</Text>
          </View>
        </View>

        {/* Info del Equipo Objetivo */}
        <View style={styles.deviceBanner}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="server-outline" size={18} color={colors.primary} />
            <Text style={styles.deviceIpText}>{currentIp}</Text>
          </View>
          <Text style={styles.deviceVendorText}>
            {store.selectedDevice?.model || `${selectedVendor} Device`}
          </Text>
        </View>

        {/* Selector de Fabricante */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.vendorScroll}
          contentContainerStyle={styles.vendorContent}
        >
          {(['MikroTik', 'Cisco', 'Huawei', 'Linux'] as DeviceVendor[]).map((vendor) => (
            <TouchableOpacity
              key={vendor}
              style={[
                styles.vendorPill,
                selectedVendor === vendor && styles.vendorPillActive,
              ]}
              onPress={() => setSelectedVendor(vendor)}
            >
              <Text
                style={[
                  styles.vendorPillText,
                  selectedVendor === vendor && styles.vendorPillTextActive,
                ]}
              >
                {vendor}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.mainScroll} contentContainerStyle={styles.mainContent}>
        {/* Presets de Comandos del Fabricante */}
        <View style={styles.presetsSection}>
          <Text style={styles.sectionTitle}>Comandos de Diagnóstico Predefinidos</Text>
          <View style={styles.presetsGrid}>
            {presets.map((preset: SshCommandPreset) => (
              <TouchableOpacity
                key={preset.id}
                style={styles.presetCard}
                onPress={() => runCommand(preset.command)}
                disabled={isExecuting}
              >
                <View style={styles.presetHeader}>
                  <Text style={styles.presetName}>{preset.name}</Text>
                  <Ionicons name="play-circle" size={16} color={colors.primary} />
                </View>
                <Text style={styles.presetCommand}>{preset.command}</Text>
                <Text style={styles.presetDesc}>{preset.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Input para Comando Personalizado */}
        <View style={styles.customCommandSection}>
          <Text style={styles.sectionTitle}>Comando Personalizado</Text>
          <View style={styles.commandInputRow}>
            <TextInput
              style={styles.commandInput}
              value={customCommand}
              onChangeText={setCustomCommand}
              placeholder="Escribe un comando (ej: ping -c 4 8.8.8.8)"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={[styles.executeButton, isExecuting && styles.executeButtonDisabled]}
              onPress={() => {
                runCommand(customCommand);
                setCustomCommand('');
              }}
              disabled={isExecuting || !customCommand.trim()}
            >
              {isExecuting ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Ionicons name="arrow-forward" size={18} color={colors.white} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Ventana de Terminal */}
        <View style={styles.terminalContainer}>
          <View style={styles.terminalHeader}>
            <View style={styles.terminalDots}>
              <View style={[styles.terminalDot, { backgroundColor: '#EF4444' }]} />
              <View style={[styles.terminalDot, { backgroundColor: '#F59E0B' }]} />
              <View style={[styles.terminalDot, { backgroundColor: '#10B981' }]} />
            </View>
            <Text style={styles.terminalTitle}>admin@{currentIp}:~</Text>
            {terminalLogs.length > 0 && (
              <TouchableOpacity onPress={clearTerminal}>
                <Text style={styles.clearText}>Limpiar</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.terminalBody}>
            {isExecuting && (
              <View style={styles.executingRow}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.executingText}>
                  Estableciendo canal SSH seguro y ejecutando...
                </Text>
              </View>
            )}

            {terminalLogs.length === 0 && !isExecuting ? (
              <View style={styles.terminalPlaceholder}>
                <Text style={styles.terminalPromptText}>
                  # Sesión lista sobre TCP/22 con cifrado AES-256-GCM.
                </Text>
                <Text style={styles.terminalPromptText}>
                  # Selecciona un comando predefinido arriba para ver la respuesta en vivo.
                </Text>
              </View>
            ) : (
              terminalLogs.map((log, index) => (
                <View key={index} style={styles.logBlock}>
                  <View style={styles.logMeta}>
                    <Text style={styles.logCommandPrompt}>$ {log.command}</Text>
                    <Text style={styles.logDuration}>
                      {log.durationMs}ms • {log.timestamp}
                    </Text>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <Text style={styles.logOutput}>{log.output}</Text>
                  </ScrollView>
                </View>
              ))
            )}
          </View>
        </View>
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  vaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.xs,
    gap: 4,
  },
  vaultBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.accentGreen,
  },
  deviceBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  deviceIpText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  deviceVendorText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  vendorScroll: {
    marginTop: 2,
  },
  vendorContent: {
    gap: 8,
  },
  vendorPill: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  vendorPillActive: {
    backgroundColor: colors.primaryGlow,
    borderColor: colors.primary,
  },
  vendorPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  vendorPillTextActive: {
    color: colors.primary,
  },
  mainScroll: {
    flex: 1,
  },
  mainContent: {
    padding: spacing.lg,
    paddingBottom: 40,
    gap: 16,
  },
  presetsSection: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  presetsGrid: {
    gap: 8,
  },
  presetCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  presetName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  presetCommand: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: colors.primary,
    marginTop: 4,
  },
  presetDesc: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  customCommandSection: {
    gap: 8,
  },
  commandInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  commandInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  executeButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  executeButtonDisabled: {
    opacity: 0.5,
  },
  terminalContainer: {
    backgroundColor: '#090D16',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  terminalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#121826',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  terminalDots: {
    flexDirection: 'row',
    gap: 6,
  },
  terminalDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  terminalTitle: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  clearText: {
    fontSize: 11,
    color: colors.accentAmber,
    fontWeight: '600',
  },
  terminalBody: {
    padding: spacing.md,
    minHeight: 180,
  },
  executingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.md,
  },
  executingText: {
    fontSize: 12,
    color: colors.primary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  terminalPlaceholder: {
    gap: 4,
  },
  terminalPromptText: {
    fontSize: 11,
    color: colors.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  logBlock: {
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#1A2338',
    paddingBottom: spacing.sm,
  },
  logMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  logCommandPrompt: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accentGreen,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  logDuration: {
    fontSize: 10,
    color: colors.textMuted,
  },
  logOutput: {
    fontSize: 11,
    color: '#D1D5DB',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 16,
  },
});
