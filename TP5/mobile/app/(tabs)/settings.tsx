import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import { useQoSStore } from '../../src/store/useQoSStore';
import { colors, spacing, borderRadius } from '../../src/constants/theme';
import { resolveNetworkUrl, getDevHostIp } from '../../src/utils/networkUtils';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const store = useQoSStore();
  const [backendUrl, setBackendUrl] = useState(store.config.backendUrl);
  const [latencyWarning, setLatencyWarning] = useState(
    store.config.thresholds.maxLatencyWarningMs.toString()
  );
  const [latencyCritical, setLatencyCritical] = useState(
    store.config.thresholds.maxLatencyCriticalMs.toString()
  );
  const [jitterWarning, setJitterWarning] = useState(
    store.config.thresholds.maxJitterWarningMs.toString()
  );
  const [lossWarning, setLossWarning] = useState(
    store.config.thresholds.maxPacketLossWarningPct.toString()
  );
  const [throughputWarning, setThroughputWarning] = useState(
    store.config.thresholds.minThroughputWarningMbps.toString()
  );

  const handleSaveThresholds = () => {
    store.updateConfig({
      backendUrl: backendUrl.trim(),
      thresholds: {
        maxLatencyWarningMs: parseInt(latencyWarning) || 100,
        maxLatencyCriticalMs: parseInt(latencyCritical) || 200,
        maxJitterWarningMs: parseInt(jitterWarning) || 30,
        maxPacketLossWarningPct: parseInt(lossWarning) || 5,
        minThroughputWarningMbps: parseInt(throughputWarning) || 5,
        minRssiCriticalDbm: store.config.thresholds.minRssiCriticalDbm,
      },
    });
    Alert.alert('Configuración guardada', 'Los nuevos umbrales y URLs se aplicaron con éxito.');
  };

  const handleToggleBackground = (enabled: boolean) => {
    store.updateConfig({ backgroundSamplingEnabled: enabled });
  };

  const handleTestConnection = async () => {
    const targetUrl = resolveNetworkUrl(backendUrl.trim());
    try {
      const res = await fetch(`${targetUrl}/health`);
      if (res.ok) {
        const json = await res.json();
        Alert.alert(
          'Servidor en línea',
          `Conexión exitosa con ${json.service || 'backend QoS'} (${targetUrl}). Uptime: ${json.uptimeSeconds || 0}s`
        );
      } else {
        Alert.alert('Error HTTP', `El servidor respondió con código ${res.status}`);
      }
    } catch (e: any) {
      Alert.alert(
        'Fallo de conexión',
        `No se pudo conectar a ${targetUrl}: ${e.message}\nVerifica que la PC y el móvil estén en la misma red Wi-Fi o selecciona Cloudflare.`
      );
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Encabezado */}
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Configuración del Sistema</Text>
        <Text style={styles.subtitle}>
          Umbrales QoS, Segundo Plano y Backend (RF-02, RF-07)
        </Text>
      </View>

      {/* 1. Muestreo Periódico en Segundo Plano (RF-07) */}
      <View style={styles.sectionCard}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="clock-outline" size={20} color={colors.secondary} />
          <Text style={styles.cardTitle}>Muestreo en Segundo Plano (RF-07)</Text>
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingTextCol}>
            <Text style={styles.settingLabel}>Activar Monitoreo Periódico</Text>
            <Text style={styles.settingDesc}>
              Ejecuta sondeos en background incluso con pantalla bloqueada
            </Text>
          </View>
          <Switch
            value={store.config.backgroundSamplingEnabled}
            onValueChange={handleToggleBackground}
            trackColor={{ false: colors.surfaceHighlight, true: colors.primary }}
            thumbColor={colors.white}
          />
        </View>

        {/* Intervalo */}
        <Text style={styles.subLabel}>Intervalo de muestreo:</Text>
        <View style={styles.intervalRow}>
          {[5, 15, 30, 60].map((mins) => {
            const isSelected = store.config.backgroundIntervalMinutes === mins;
            return (
              <Pressable
                key={mins}
                style={[styles.intervalChip, isSelected && styles.intervalChipActive]}
                onPress={() => store.updateConfig({ backgroundIntervalMinutes: mins })}
              >
                <Text
                  style={[styles.intervalChipText, isSelected && styles.intervalChipTextActive]}
                >
                  {mins} min
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Estado actual */}
        <View style={styles.bgStatusBox}>
          <Text style={styles.bgStatusText}>
            Estado: {store.backgroundStatus.isRunning ? '🟢 En ejecución' : '⚪ Inactivo'}
          </Text>
          {store.backgroundStatus.lastRun && (
            <Text style={styles.bgStatusSub}>
              Último muestreo:{' '}
              {new Date(store.backgroundStatus.lastRun).toLocaleTimeString()}
            </Text>
          )}
        </View>
      </View>

      {/* 2. Backend de Referencia para Throughput (RF-03) */}
      <View style={styles.sectionCard}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="server-network" size={20} color={colors.primary} />
          <Text style={styles.cardTitle}>Backend de Referencia (RF-03)</Text>
        </View>
        <Text style={styles.settingDesc}>
          URL base del microservicio Node.js para las pruebas de descarga fija y subida echo
        </Text>

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            value={backendUrl}
            onChangeText={setBackendUrl}
            placeholder={`http://${getDevHostIp()}:3001`}
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
          />
          <Pressable style={styles.testBtn} onPress={handleTestConnection}>
            <Text style={styles.testBtnText}>Probar</Text>
          </Pressable>
        </View>
      </View>

      {/* 3. Umbrales de Alerta de Degradación Severa (RF-07) */}
      <View style={styles.sectionCard}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="alert-decagram-outline" size={20} color={colors.qosFair} />
          <Text style={styles.cardTitle}>Umbrales de Degradación (RF-07)</Text>
        </View>

        <View style={styles.thresholdItem}>
          <Text style={styles.thresholdLabel}>Latencia Advertencia (ms):</Text>
          <TextInput
            style={styles.numberInput}
            value={latencyWarning}
            onChangeText={setLatencyWarning}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.thresholdItem}>
          <Text style={styles.thresholdLabel}>Latencia Crítica (ms):</Text>
          <TextInput
            style={styles.numberInput}
            value={latencyCritical}
            onChangeText={setLatencyCritical}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.thresholdItem}>
          <Text style={styles.thresholdLabel}>Jitter Máximo Tolerable (ms):</Text>
          <TextInput
            style={styles.numberInput}
            value={jitterWarning}
            onChangeText={setJitterWarning}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.thresholdItem}>
          <Text style={styles.thresholdLabel}>Pérdida de Paquetes Máxima (%):</Text>
          <TextInput
            style={styles.numberInput}
            value={lossWarning}
            onChangeText={setLossWarning}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.thresholdItem}>
          <Text style={styles.thresholdLabel}>Throughput Mínimo (Mbps):</Text>
          <TextInput
            style={styles.numberInput}
            value={throughputWarning}
            onChangeText={setThroughputWarning}
            keyboardType="numeric"
          />
        </View>

        <Pressable style={styles.saveBtn} onPress={handleSaveThresholds}>
          <Text style={styles.saveBtnText}>Guardar Parámetros</Text>
        </Pressable>
      </View>

      {/* 4. Hosts de Sondeo Configurados (RF-02) */}
      <View style={styles.sectionCard}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="web" size={20} color={colors.accentPurple} />
          <Text style={styles.cardTitle}>Hosts de Ping Configurados (RF-02)</Text>
        </View>
        {store.config.hosts.map((host) => (
          <View key={host.id} style={styles.hostRow}>
            <View>
              <Text style={styles.hostRowTitle}>{host.name}</Text>
              <Text style={styles.hostRowSub}>
                {host.host} ({host.probeType.toUpperCase()})
              </Text>
            </View>
            <View style={styles.activePill}>
              <Text style={styles.activePillText}>Activo</Text>
            </View>
          </View>
        ))}
      </View>

      {/* 5. Zona de Mantenimiento / Datos */}
      <View style={[styles.sectionCard, styles.dangerCard]}>
        <Text style={styles.dangerTitle}>Mantenimiento de Datos</Text>
        <Text style={styles.settingDesc}>
          Restaurar la base de datos a los registros de muestra originales
        </Text>
        <Pressable
          style={styles.resetBtn}
          onPress={() => {
            Alert.alert(
              'Restaurar Base de Datos',
              '¿Deseas restaurar las sesiones de muestra?',
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Restaurar',
                  style: 'destructive',
                  onPress: () => store.resetToDefaultSamples(),
                },
              ]
            );
          }}
        >
          <Text style={styles.resetBtnText}>Restaurar Datos de Muestra</Text>
        </Pressable>
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
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  settingTextCol: {
    flex: 1,
    paddingRight: spacing.md,
  },
  settingLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  settingDesc: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  subLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  intervalRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  intervalChip: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  intervalChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  intervalChipText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  intervalChipTextActive: {
    color: colors.white,
  },
  bgStatusBox: {
    backgroundColor: colors.surfaceLight,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  bgStatusText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  bgStatusSub: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: 13,
    borderWidth: 1,
    borderColor: colors.border,
    height: 42,
  },
  testBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  testBtnText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  thresholdItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
  },
  thresholdLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  numberInput: {
    backgroundColor: colors.surfaceLight,
    width: 72,
    height: 36,
    borderRadius: borderRadius.sm,
    color: colors.text,
    textAlign: 'center',
    fontWeight: '800',
    borderWidth: 1,
    borderColor: colors.border,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  saveBtnText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  hostRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  hostRowTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  hostRowSub: {
    color: colors.textMuted,
    fontSize: 11,
  },
  activePill: {
    backgroundColor: colors.qosExcellent + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  activePillText: {
    color: colors.qosExcellent,
    fontSize: 10,
    fontWeight: '800',
  },
  dangerCard: {
    borderColor: '#7F1D1D',
  },
  dangerTitle: {
    color: colors.qosPoor,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  resetBtn: {
    backgroundColor: '#7F1D1D30',
    borderWidth: 1,
    borderColor: colors.qosPoor,
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  resetBtnText: {
    color: colors.qosPoor,
    fontSize: 13,
    fontWeight: '800',
  },
});
