import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { MeasurementSession } from '../types';
import { colors, spacing, borderRadius } from '../constants/theme';
import { Exporter } from '../storage/Exporter';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Props {
  visible: boolean;
  sessions: MeasurementSession[];
  onClose: () => void;
}

export const ExportModal: React.FC<Props> = ({ visible, sessions, onClose }) => {
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      if (format === 'csv') {
        const csvContent = Exporter.exportToCsv(sessions);
        await Exporter.downloadOrShare(
          csvContent,
          `qos_measurements_${timestamp}.csv`,
          'text/csv'
        );
      } else {
        const jsonContent = Exporter.exportToJson(sessions);
        await Exporter.downloadOrShare(
          jsonContent,
          `qos_measurements_${timestamp}.json`,
          'application/json'
        );
      }
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <MaterialCommunityIcons name="cloud-download" size={22} color={colors.secondary} />
              <Text style={styles.title}>Exportar Historial</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          <Text style={styles.summaryText}>
            Se exportarán <Text style={styles.highlight}>{sessions.length} registros</Text> de
            telemetría QoS incluyendo coordenadas GPS, RTTs, jitter RFC 3550, throughput e
            información de celda celular.
          </Text>

          {/* Selector de Formato CSV / JSON */}
          <Text style={styles.label}>Formato de archivo:</Text>
          <View style={styles.formatRow}>
            <Pressable
              style={[styles.formatBtn, format === 'csv' && styles.formatBtnActive]}
              onPress={() => setFormat('csv')}
            >
              <MaterialCommunityIcons
                name="file-delimited"
                size={24}
                color={format === 'csv' ? colors.white : colors.textSecondary}
              />
              <Text style={[styles.formatBtnText, format === 'csv' && styles.formatBtnTextActive]}>
                CSV (Excel)
              </Text>
              <Text style={styles.formatSub}>Tablas y hojas de cálculo</Text>
            </Pressable>

            <Pressable
              style={[styles.formatBtn, format === 'json' && styles.formatBtnActive]}
              onPress={() => setFormat('json')}
            >
              <MaterialCommunityIcons
                name="code-json"
                size={24}
                color={format === 'json' ? colors.white : colors.textSecondary}
              />
              <Text style={[styles.formatBtnText, format === 'json' && styles.formatBtnTextActive]}>
                JSON Completo
              </Text>
              <Text style={styles.formatSub}>Estructura nativa para APIs</Text>
            </Pressable>
          </View>

          {/* Botón de Descarga / Exportación */}
          <Pressable
            style={styles.exportBtn}
            onPress={handleExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <MaterialCommunityIcons name="download" size={18} color={colors.white} />
                <Text style={styles.exportBtnText}>
                  Descargar {format.toUpperCase()}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  summaryText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  highlight: {
    color: colors.secondary,
    fontWeight: '800',
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  formatRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  formatBtn: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  formatBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  formatBtnText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  formatBtnTextActive: {
    color: colors.white,
  },
  formatSub: {
    color: colors.textMuted,
    fontSize: 10,
    textAlign: 'center',
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  exportBtnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800',
  },
});
