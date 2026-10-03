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
import { CoverageHeatmap } from '../../src/components/CoverageHeatmap';
import { ConnectionType } from '../../src/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function CoverageMapScreen() {
  const store = useQoSStore();
  const [selectedType, setSelectedType] = useState<ConnectionType | 'ALL'>('ALL');

  const filtered = selectedType === 'ALL'
    ? store.sessions
    : store.sessions.filter((s) => s.signal.networkType === selectedType);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Encabezado */}
      <View style={styles.header}>
        <View>
          <Text style={styles.screenTitle}>Mapa de Cobertura</Text>
          <Text style={styles.subtitle}>
            Heatmap y Georreferenciación Personal (RF-04, RF-05)
          </Text>
        </View>
      </View>

      {/* Selector Rápido de Tecnología de Red */}
      <View style={styles.typeFilterRow}>
        {(['ALL', '5G', '4G', '3G', 'WIFI'] as const).map((t) => {
          const isSelected = selectedType === t;
          return (
            <Pressable
              key={t}
              style={[styles.typeChip, isSelected && styles.typeChipActive]}
              onPress={() => setSelectedType(t)}
            >
              <Text style={[styles.typeChipText, isSelected && styles.typeChipTextActive]}>
                {t === 'ALL' ? 'Todas' : t}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Indicador de Ciudad y Coordenadas */}
      <View style={styles.cityBanner}>
        <MaterialCommunityIcons name="map-marker-radius" size={15} color={colors.secondary} />
        <Text style={styles.cityBannerText}>
          Concepción del Uruguay, Entre Ríos • Coordenadas GPS Reales
        </Text>
      </View>

      {/* Componente de Mapa de Cobertura y Heatmap */}
      <CoverageHeatmap
        sessions={filtered}
        currentLatitude={store.currentLocation.latitude}
        currentLongitude={store.currentLocation.longitude}
        height={440}
      />

      {/* Tarjeta de Resumen Geográfico */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="crosshairs-gps" size={20} color={colors.secondary} />
          <View style={styles.infoTextCol}>
            <Text style={styles.infoTitle}>Posición Actual</Text>
            <Text style={styles.infoAddress}>
              {store.currentLocation.addressSummary || 'Concepción del Uruguay'}
            </Text>
            <Text style={styles.infoCoords}>
              {store.currentLocation.latitude.toFixed(5)}, {store.currentLocation.longitude.toFixed(5)} (±{Math.round(store.currentLocation.accuracy ?? 5)}m)
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.statsRow}>
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>MEDICIONES</Text>
            <Text style={styles.statVal}>{store.sessions.length}</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>EN MAPA</Text>
            <Text style={[styles.statVal, { color: colors.secondary }]}>
              {filtered.length}
            </Text>
          </View>
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>OPERADOR</Text>
            <Text style={styles.statVal} numberOfLines={1}>
              {store.currentSignal.operator}
            </Text>
          </View>
        </View>
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
  typeFilterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  typeChip: {
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeChipText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  typeChipTextActive: {
    color: colors.white,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  infoTextCol: {
    flex: 1,
  },
  infoTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  infoAddress: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  infoCoords: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statCol: {
    alignItems: 'center',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '800',
    marginBottom: 2,
  },
  statVal: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  cityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  cityBannerText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
});
