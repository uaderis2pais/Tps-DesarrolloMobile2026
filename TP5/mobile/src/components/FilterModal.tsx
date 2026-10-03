import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
} from 'react-native';
import { ConnectionType, FilterCriteria, QoSRating } from '../types';
import { colors, spacing, borderRadius } from '../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Props {
  visible: boolean;
  currentFilters: FilterCriteria;
  onApply: (filters: FilterCriteria) => void;
  onClose: () => void;
}

export const FilterModal: React.FC<Props> = ({
  visible,
  currentFilters,
  onApply,
  onClose,
}) => {
  const [selectedTypes, setSelectedTypes] = useState<ConnectionType[]>(
    currentFilters.networkTypes || []
  );
  const [dateRange, setDateRange] = useState<'all' | 'today' | '7days' | '30days'>(
    currentFilters.dateRange || 'all'
  );
  const [minQoS, setMinQoS] = useState<QoSRating | undefined>(currentFilters.minQoS);
  const [searchQuery, setSearchQuery] = useState<string>(currentFilters.searchQuery || '');

  const availableTypes: ConnectionType[] = ['5G', '4G', '3G', 'WIFI'];

  const toggleType = (type: ConnectionType) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter((t) => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const handleApply = () => {
    onApply({
      networkTypes: selectedTypes,
      dateRange,
      minQoS,
      searchQuery: searchQuery.trim(),
    });
    onClose();
  };

  const handleReset = () => {
    setSelectedTypes([]);
    setDateRange('all');
    setMinQoS(undefined);
    setSearchQuery('');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {/* Encabezado */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <MaterialCommunityIcons name="filter-variant" size={20} color={colors.primary} />
              <Text style={styles.title}>Filtros Avanzados</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={styles.content}>
            {/* 1. Búsqueda por texto (Operador, Dirección, ID) */}
            <Text style={styles.sectionLabel}>Búsqueda por texto / Operador</Text>
            <View style={styles.searchBar}>
              <MaterialCommunityIcons name="magnify" size={18} color={colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar por Personal, Claro, zona..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')}>
                  <MaterialCommunityIcons name="close-circle" size={16} color={colors.textMuted} />
                </Pressable>
              )}
            </View>

            {/* 2. Tipo de Conexión Activa (RF-09) */}
            <Text style={styles.sectionLabel}>Tipo de Red</Text>
            <View style={styles.chipsRow}>
              {availableTypes.map((type) => {
                const isSelected = selectedTypes.includes(type);
                return (
                  <Pressable
                    key={type}
                    style={[styles.chip, isSelected && styles.chipActive]}
                    onPress={() => toggleType(type)}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                      {type}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* 3. Rango de Fechas (RF-09) */}
            <Text style={styles.sectionLabel}>Rango de Fechas</Text>
            <View style={styles.chipsRow}>
              {(['all', 'today', '7days', '30days'] as const).map((r) => {
                const label =
                  r === 'all'
                    ? 'Todo'
                    : r === 'today'
                    ? 'Hoy'
                    : r === '7days'
                    ? 'Últimos 7 días'
                    : 'Últimos 30 días';
                const isSelected = dateRange === r;
                return (
                  <Pressable
                    key={r}
                    style={[styles.chip, isSelected && styles.chipActive]}
                    onPress={() => setDateRange(r)}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* 4. Calidad Mínima QoS */}
            <Text style={styles.sectionLabel}>Calidad de Servicio Mínima</Text>
            <View style={styles.chipsRow}>
              {(['EXCELLENT', 'GOOD', 'FAIR', 'POOR'] as const).map((q) => {
                const isSelected = minQoS === q;
                return (
                  <Pressable
                    key={q}
                    style={[styles.chip, isSelected && styles.chipActive]}
                    onPress={() => setMinQoS(isSelected ? undefined : q)}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                      {q}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          {/* Acciones de pie */}
          <View style={styles.footer}>
            <Pressable style={styles.resetBtn} onPress={handleReset}>
              <Text style={styles.resetBtnText}>Limpiar</Text>
            </Pressable>

            <Pressable style={styles.applyBtn} onPress={handleApply}>
              <Text style={styles.applyBtnText}>Aplicar Filtros</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '85%',
    paddingBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
  content: {
    padding: spacing.lg,
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
    textTransform: 'uppercase',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    height: 44,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.white,
    fontWeight: '800',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  resetBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resetBtnText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  applyBtn: {
    flex: 2,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
  },
  applyBtnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
});
