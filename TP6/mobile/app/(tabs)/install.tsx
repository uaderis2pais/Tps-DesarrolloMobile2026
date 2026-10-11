import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDiagnosticsStore } from '../../src/store/useDiagnosticsStore';
import { colors, spacing, borderRadius } from '../../src/constants/theme';
import { QrScannerService } from '../../src/engine/evidence/QrScannerService';
import { GpsService, GpsLocationResult } from '../../src/engine/evidence/GpsService';
import { PdfReportGenerator } from '../../src/engine/reporting/PdfReportGenerator';
import { TechnicalInstallation } from '../../src/types';

export default function InstallScreen() {
  const store = useDiagnosticsStore();

  // Estados del formulario de instalación
  const [clientName, setClientName] = useState('Cooperativa Río Uruguay');
  const [subscriberNumber, setSubscriberNumber] = useState('ABO-2026-984');
  const [address, setAddress] = useState('Calle Artigas 233, Concepción del Uruguay, Entre Ríos');
  const [opticalDbm, setOpticalDbm] = useState('-18.4');
  const [oltPort, setOltPort] = useState('OLT-CDU-01 PON 1/2/4');
  const [notes, setNotes] = useState('Instalación en rack técnico. Señal óptica verificada.');

  // Estados de escáner QR / Ficha técnica
  const [scannedSheet, setScannedSheet] = useState<any>(null);
  const [serialNumber, setSerialNumber] = useState('HWTC-48D8153A-HG8245W5');
  const [macAddress, setMacAddress] = useState('48:D8:15:3A:82:11');
  const [deviceModel, setDeviceModel] = useState('Huawei EchoLife HG8245W5 GPON ONT');

  // Estados de GPS
  const [gpsData, setGpsData] = useState<GpsLocationResult | null>(GpsService.getCachedPosition());
  const [isGettingGps, setIsGettingGps] = useState(false);

  // Estados de generación
  const [isSaving, setIsSaving] = useState(false);
  const [lastGeneratedPdf, setLastGeneratedPdf] = useState<string | null>(null);

  // Evaluar calidad de señal óptica en vivo
  const numDbm = parseFloat(opticalDbm) || -18.4;
  const isOpticalGood = numDbm >= -24 && numDbm <= -14;
  const isOpticalWarning = numDbm < -24 && numDbm >= -27;

  // Manejar escaneo de código QR
  const handleScanPreset = (code: string) => {
    const parsed = QrScannerService.parseBarcodeData(code);
    setScannedSheet(parsed.sheet);
    setSerialNumber(parsed.serialNumber);
    setMacAddress(parsed.macAddress);
    setDeviceModel(parsed.sheet.model);
  };

  // Manejar obtención satelital GPS
  const handleGetGps = async () => {
    setIsGettingGps(true);
    try {
      const pos = await GpsService.getCurrentPosition();
      setGpsData(pos);
      setAddress(pos.addressSummary);
    } finally {
      setIsGettingGps(false);
    }
  };

  // Guardar instalación, encolar en outbox y generar PDF
  const handleSaveAndGenerate = async () => {
    if (!clientName.trim() || !subscriberNumber.trim()) {
      if (Platform.OS === 'web') {
        alert('Por favor completa el nombre del cliente y número de abonado');
      } else {
        Alert.alert('Faltan Datos', 'Completa el nombre del cliente y número de abonado.');
      }
      return;
    }

    setIsSaving(true);
    try {
      const newInst = await store.registerInstallation({
        clientName,
        subscriberNumber,
        installationAddress: address,
        latitude: gpsData?.latitude || -32.48761,
        longitude: gpsData?.longitude || -58.22996,
        altitude: gpsData?.altitude || 18.5,
        gpsAccuracy: gpsData?.accuracy || 3.2,
        deviceModel,
        serialNumber,
        macAddress,
        opticalAttenuationDbm: numDbm,
        oltPort,
        technicianNotes: notes,
      });

      const pdfUri = await store.generatePdf(newInst.id);
      setLastGeneratedPdf(pdfUri);

      if (Platform.OS === 'web') {
        alert('¡Instalación registrada! El reporte PDF se generó y se encoló en Outbox para sincronización.');
      } else {
        Alert.alert(
          'Instalación Registrada',
          'El reporte PDF fue generado y la acción se encoló en Outbox para sincronización.'
        );
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSharePdf = async (uri: string) => {
    await PdfReportGenerator.sharePdf(uri);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Acta de Instalación</Text>
            <Text style={styles.subtitle}>Evidencia, GPS & Reporte PDF • RF-04, 05, 06</Text>
          </View>
          <View style={styles.pdfBadge}>
            <Ionicons name="document" size={12} color={colors.primary} />
            <Text style={styles.pdfBadgeText}>PDF Export</Text>
          </View>
        </View>
      </View>

      {/* 1. Identificación por Código de Barras / QR (RF-04) */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>1. Identificación por QR / Código de Barras</Text>
            <Text style={styles.sectionSubtitle}>
              Asociación automática a ficha técnica de fabricante (RF-04)
            </Text>
          </View>
          <Ionicons name="qr-code-outline" size={20} color={colors.primary} />
        </View>

        <Text style={styles.fieldLabel}>Escanear código de barras de equipo de campo:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.presetsList}
        >
          {QrScannerService.getPresetBarcodes().map((preset) => (
            <TouchableOpacity
              key={preset.code}
              style={styles.qrPresetButton}
              onPress={() => handleScanPreset(preset.code)}
            >
              <Ionicons name="barcode-outline" size={14} color={colors.primary} />
              <Text style={styles.qrPresetText}>{preset.vendor}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.detectedEquipmentBox}>
          <Text style={styles.detectedModel}>{deviceModel}</Text>
          <Text style={styles.detectedSerial}>SN: {serialNumber} • MAC: {macAddress}</Text>

          {scannedSheet && (
            <View style={styles.sheetDetails}>
              <Text style={styles.sheetType}>Tipo: {scannedSheet.type}</Text>
              <Text style={styles.sheetRange}>Rango Óptico: {scannedSheet.opticalRange}</Text>
              <Text style={styles.sheetFirmware}>Firmware: {scannedSheet.firmwareVersion}</Text>
              <Text style={styles.sheetPorts}>Puertos: {scannedSheet.ports}</Text>
            </View>
          )}
        </View>
      </View>

      {/* 2. Georreferenciación GPS Satelital (RF-05) */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>2. Georreferenciación Satelital GPS</Text>
            <Text style={styles.sectionSubtitle}>
              Coordenadas de alta precisión y reverse geocoding (RF-05)
            </Text>
          </View>
          <Ionicons name="location" size={20} color={colors.accentGreen} />
        </View>

        <View style={styles.gpsRow}>
          <View style={styles.gpsInfo}>
            <Text style={styles.gpsCoords}>
              {gpsData
                ? `${gpsData.latitude.toFixed(6)}, ${gpsData.longitude.toFixed(6)}`
                : '-32.487610, -58.229960'}
            </Text>
            <Text style={styles.gpsAccuracy}>
              Precisión satelital: ±{Math.round(gpsData?.accuracy || 3.2)}m (Altitud: {gpsData?.altitude || 18.5}m)
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.gpsButton, isGettingGps && styles.gpsButtonDisabled]}
            onPress={handleGetGps}
            disabled={isGettingGps}
          >
            {isGettingGps ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <Ionicons name="locate" size={14} color={colors.white} />
                <Text style={styles.gpsButtonText}>Fijar GPS</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <Text style={[styles.fieldLabel, { marginTop: spacing.md }]}>Dirección de Instalación:</Text>
        <TextInput
          style={styles.textInput}
          value={address}
          onChangeText={setAddress}
          placeholder="Dirección física del abonado"
          placeholderTextColor={colors.textMuted}
        />
      </View>

      {/* 3. Datos del Abonado y Capa Física Óptica (RF-05) */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>3. Abonado y Parámetros Ópticos (Power Meter)</Text>

        <View style={styles.formGrid}>
          <View style={styles.formCol}>
            <Text style={styles.fieldLabel}>Nombre / Razón Social:</Text>
            <TextInput
              style={styles.textInput}
              value={clientName}
              onChangeText={setClientName}
              placeholder="Nombre del abonado"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.formCol}>
            <Text style={styles.fieldLabel}>N° de Abonado / Circuito:</Text>
            <TextInput
              style={styles.textInput}
              value={subscriberNumber}
              onChangeText={setSubscriberNumber}
              placeholder="ABO-XXXX"
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </View>

        <View style={styles.formGrid}>
          <View style={styles.formCol}>
            <Text style={styles.fieldLabel}>Puerto OLT / Splitter:</Text>
            <TextInput
              style={styles.textInput}
              value={oltPort}
              onChangeText={setOltPort}
              placeholder="OLT-01 PON 1/2/4"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.formCol}>
            <Text style={styles.fieldLabel}>Atenuación Óptica (dBm):</Text>
            <TextInput
              style={styles.textInput}
              value={opticalDbm}
              onChangeText={setOpticalDbm}
              placeholder="-18.4"
              placeholderTextColor={colors.textMuted}
              keyboardType="numbers-and-punctuation"
            />
          </View>
        </View>

        {/* Medidor visual de potencia óptica */}
        <View
          style={[
            styles.opticalRatingBox,
            isOpticalGood
              ? styles.opticalGood
              : isOpticalWarning
              ? styles.opticalWarning
              : styles.opticalBad,
          ]}
        >
          <View>
            <Text style={styles.opticalRatingTitle}>
              {isOpticalGood
                ? 'Nivel Óptico Óptimo (ITU-T G.984)'
                : isOpticalWarning
                ? 'Nivel Óptico Marginal (Aceptable)'
                : 'Nivel Óptico Crítico (Atenuación Excesiva)'}
            </Text>
            <Text style={styles.opticalRatingDesc}>
              Rango recomendado Clase B+: -8.0 dBm a -25.0 dBm
            </Text>
          </View>
          <Text style={styles.opticalRatingValue}>{numDbm.toFixed(1)} dBm</Text>
        </View>

        <Text style={[styles.fieldLabel, { marginTop: spacing.md }]}>Notas Técnicas de Campo:</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Observaciones de instalación, conectores fusionados, etc."
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={3}
        />
      </View>

      {/* 4. Botón de Generación y Guardado (RF-06 & RF-07) */}
      <TouchableOpacity
        style={[styles.submitButton, isSaving && styles.submitButtonDisabled]}
        onPress={handleSaveAndGenerate}
        disabled={isSaving}
      >
        {isSaving ? (
          <ActivityIndicator size="small" color={colors.white} />
        ) : (
          <>
            <Ionicons name="document-text" size={18} color={colors.white} />
            <Text style={styles.submitButtonText}>
              Guardar Instalación & Generar Reporte PDF
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Botón de Compartir PDF si se acaba de generar */}
      {lastGeneratedPdf && (
        <TouchableOpacity
          style={styles.sharePdfButton}
          onPress={() => handleSharePdf(lastGeneratedPdf)}
        >
          <Ionicons name="share-social-outline" size={16} color={colors.primary} />
          <Text style={styles.sharePdfText}>Abrir / Compartir Documento PDF Generado</Text>
        </TouchableOpacity>
      )}

      {/* Historial de Instalaciones de Campo */}
      <View style={styles.historySection}>
        <Text style={styles.sectionTitle}>Historial de Instalaciones Registradas</Text>
        <View style={styles.historyList}>
          {store.installations.map((inst: TechnicalInstallation) => (
            <View key={inst.id} style={styles.historyCard}>
              <View style={styles.historyHeader}>
                <View>
                  <Text style={styles.historyClient}>{inst.clientName}</Text>
                  <Text style={styles.historySub}>
                    {inst.subscriberNumber} • {new Date(inst.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <View
                  style={[
                    styles.syncStatusBadge,
                    inst.syncStatus === 'SYNCED' ? styles.syncSynced : styles.syncPending,
                  ]}
                >
                  <Text
                    style={[
                      styles.syncStatusText,
                      inst.syncStatus === 'SYNCED'
                        ? { color: colors.accentGreen }
                        : { color: colors.outboxColor },
                    ]}
                  >
                    {inst.syncStatus === 'SYNCED' ? 'SINCRONIZADO' : 'EN OUTBOX'}
                  </Text>
                </View>
              </View>

              <Text style={styles.historyModel}>
                {inst.deviceModel} ({inst.opticalAttenuationDbm} dBm)
              </Text>
              <Text style={styles.historyAddress}>{inst.installationAddress}</Text>

              <TouchableOpacity
                style={styles.historyPdfButton}
                onPress={() => store.generatePdf(inst.id)}
              >
                <Ionicons name="print-outline" size={14} color={colors.primary} />
                <Text style={styles.historyPdfText}>Re-generar / Imprimir Acta PDF</Text>
              </TouchableOpacity>
            </View>
          ))}
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
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 40,
    gap: 16,
  },
  header: {
    marginBottom: spacing.xs,
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
    color: colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  pdfBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.xs,
    gap: 4,
  },
  pdfBadgeText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  fieldLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
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
  },
  textArea: {
    minHeight: 64,
    textAlignVertical: 'top',
  },
  presetsList: {
    gap: 8,
    marginVertical: 4,
  },
  qrPresetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.xs,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  qrPresetText: {
    fontSize: 11,
    color: colors.text,
    fontWeight: '600',
  },
  detectedEquipmentBox: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.xs,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 4,
  },
  detectedModel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  detectedSerial: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 2,
  },
  sheetDetails: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    gap: 2,
  },
  sheetType: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  sheetRange: {
    fontSize: 11,
    color: colors.accentGreen,
    fontWeight: '600',
  },
  sheetFirmware: {
    fontSize: 10,
    color: colors.textMuted,
  },
  sheetPorts: {
    fontSize: 10,
    color: colors.textMuted,
  },
  gpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceLight,
    padding: spacing.sm,
    borderRadius: borderRadius.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gpsInfo: {
    flex: 1,
  },
  gpsCoords: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  gpsAccuracy: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  gpsButton: {
    backgroundColor: colors.accentGreen,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.xs,
    gap: 4,
  },
  gpsButtonDisabled: {
    opacity: 0.6,
  },
  gpsButtonText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  formGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  formCol: {
    flex: 1,
    gap: 4,
  },
  opticalRatingBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    marginTop: 4,
  },
  opticalGood: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: colors.accentGreen,
  },
  opticalWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: colors.accentAmber,
  },
  opticalBad: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: colors.accentRed,
  },
  opticalRatingTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  opticalRatingDesc: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 1,
  },
  opticalRatingValue: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
  },
  submitButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    gap: 8,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 14px rgba(6, 182, 212, 0.25)',
      },
    }),
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
  sharePdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 10,
    borderRadius: borderRadius.sm,
    gap: 6,
  },
  sharePdfText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  historySection: {
    gap: 10,
    marginTop: spacing.md,
  },
  historyList: {
    gap: 10,
  },
  historyCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  historyClient: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  historySub: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  syncStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  syncSynced: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  syncPending: {
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
  },
  syncStatusText: {
    fontSize: 9,
    fontWeight: '800',
  },
  historyModel: {
    fontSize: 12,
    color: colors.primary,
    marginTop: 2,
  },
  historyAddress: {
    fontSize: 11,
    color: colors.textMuted,
  },
  historyPdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  historyPdfText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
  },
});
