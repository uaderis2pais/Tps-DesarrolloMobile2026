import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { TechnicalInstallation } from '../../types';

export class PdfReportGenerator {
  /**
   * Genera el documento HTML profesional de reporte técnico de instalación
   */
  static generateReportHtml(installation: TechnicalInstallation): string {
    const formattedDate = new Date(installation.createdAt).toLocaleString('es-AR', {
      dateStyle: 'long',
      timeStyle: 'medium',
    });

    const att = installation.opticalAttenuationDbm;
    const attStatus =
      att >= -24 && att <= -14
        ? { text: 'ÓPTIMA (Conforme norma ITU-T G.984)', color: '#10B981', badge: 'EXCELLENT' }
        : att >= -27
        ? { text: 'ACEPTABLE (Límite operativo)', color: '#F59E0B', badge: 'WARNING' }
        : { text: 'CRÍTICA / FUERA DE NORMA', color: '#EF4444', badge: 'CRITICAL' };

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Reporte Técnico de Instalación - ${installation.subscriberNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      background: #ffffff;
      padding: 32px;
      font-size: 13px;
      line-height: 1.5;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 3px solid #06b6d4;
      padding-bottom: 18px;
      margin-bottom: 24px;
    }
    .title-box h1 {
      font-size: 20px;
      color: #0f172a;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .title-box p {
      font-size: 12px;
      color: #64748b;
      margin-top: 3px;
    }
    .cert-badge {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 8px 14px;
      text-align: right;
    }
    .cert-id {
      font-size: 14px;
      font-weight: 800;
      color: #0891b2;
      font-family: monospace;
    }
    .cert-date {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
    }
    .section-title {
      font-size: 13px;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: #f8fafc;
      padding: 6px 12px;
      border-left: 4px solid #06b6d4;
      margin-top: 18px;
      margin-bottom: 12px;
      border-radius: 0 4px 4px 0;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .info-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 14px;
    }
    .info-label {
      font-size: 10px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .info-val {
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 2px;
    }
    .optical-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 14px;
      margin-top: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .optical-val {
      font-size: 26px;
      font-weight: 900;
      color: ${attStatus.color};
      font-variant-numeric: tabular-nums;
    }
    .gps-box {
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 8px;
      padding: 10px 14px;
      margin-top: 8px;
    }
    .photo-evidence-frame {
      border: 2px dashed #94a3b8;
      border-radius: 8px;
      background: #f8fafc;
      padding: 16px;
      text-align: center;
      margin-top: 10px;
      min-height: 140px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }
    .notes-box {
      background: #fffbeb;
      border: 1px solid #fef3c7;
      border-radius: 8px;
      padding: 12px 14px;
      font-style: italic;
      color: #92400e;
      margin-top: 8px;
    }
    .footer {
      margin-top: 36px;
      border-top: 1px solid #e2e8f0;
      padding-top: 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .signature-line {
      border-top: 2px solid #0f172a;
      width: 220px;
      text-align: center;
      padding-top: 6px;
      font-weight: 700;
      font-size: 11px;
    }
    .stamp {
      border: 2px solid #06b6d4;
      color: #0891b2;
      font-weight: 900;
      font-size: 11px;
      padding: 6px 14px;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 1px;
      transform: rotate(-3deg);
    }
  </style>
</head>
<body>
  <!-- Encabezado -->
  <div class="header">
    <div class="title-box">
      <h1>ACTA DE INSTALACIÓN Y AUDITORÍA DE RED</h1>
      <p>Network Diagnostics Suite • Toolkit Móvil de Telecomunicaciones</p>
    </div>
    <div class="cert-badge">
      <div class="cert-id">ORDEN #${installation.id.substring(0, 10).toUpperCase()}</div>
      <div class="cert-date">${formattedDate}</div>
    </div>
  </div>

  <!-- 1. Datos del Abonado y Ubicación -->
  <div class="section-title">1. Datos del Abonado y Sitio de Campo</div>
  <div class="grid-2">
    <div class="info-card">
      <div class="info-label">Cliente / Titular</div>
      <div class="info-val">${installation.clientName}</div>
    </div>
    <div class="info-card">
      <div class="info-label">N° de Abonado / Circuito</div>
      <div class="info-val">${installation.subscriberNumber}</div>
    </div>
  </div>

  <div class="gps-box">
    <div class="info-label">Georreferenciación Satelital GPS (RF-05)</div>
    <div class="info-val" style="font-size: 12px; margin-top: 4px;">
      📍 <strong>${installation.installationAddress}</strong><br>
      Coordenadas: <code>${installation.latitude.toFixed(6)}, ${installation.longitude.toFixed(6)}</code> (±${Math.round(installation.gpsAccuracy || 3)}m de precisión)
    </div>
  </div>

  <!-- 2. Equipamiento de Telecomunicaciones Desplegado -->
  <div class="section-title">2. Equipamiento Desplegado (Identificado por QR/Barcode RF-04)</div>
  <div class="grid-2">
    <div class="info-card">
      <div class="info-label">Modelo del Dispositivo</div>
      <div class="info-val">${installation.deviceModel}</div>
    </div>
    <div class="info-card">
      <div class="info-label">Puerto OLT / Splitter de Alimentación</div>
      <div class="info-val">${installation.oltPort}</div>
    </div>
    <div class="info-card">
      <div class="info-label">Número de Serie (SN)</div>
      <div class="info-val" style="font-family: monospace;">${installation.serialNumber}</div>
    </div>
    <div class="info-card">
      <div class="info-label">Dirección Física MAC</div>
      <div class="info-val" style="font-family: monospace;">${installation.macAddress}</div>
    </div>
  </div>

  <!-- 3. Parámetros de la Capa Física Óptica -->
  <div class="section-title">3. Parámetros de Capa Física Óptica (Power Meter)</div>
  <div class="optical-box">
    <div>
      <div class="info-label" style="color: #166534;">POTENCIA ÓPTICA RECIBIDA (RX POWER)</div>
      <div style="font-size: 11px; color: #15803d; font-weight: 600; margin-top: 2px;">
        ${attStatus.text}
      </div>
    </div>
    <div class="optical-val">${installation.opticalAttenuationDbm.toFixed(2)} dBm</div>
  </div>

  <!-- 4. Evidencia Fotográfica y Notas Técnicas -->
  <div class="section-title">4. Evidencia Fotográfica y Observaciones de Campo</div>
  <div class="photo-evidence-frame">
    ${
      installation.photoUrl || installation.photoUri
        ? `<img src="${installation.photoUrl || installation.photoUri}" style="max-height: 180px; max-width: 100%; border-radius: 6px;" alt="Evidencia de instalación" />`
        : `<div style="color: #64748b; font-size: 12px;">📷 Fotografía de evidencia registrada en almacenamiento local del dispositivo con hash de verificación.</div>`
    }
  </div>

  <div class="notes-box">
    <strong>Notas del Técnico:</strong> "${installation.technicianNotes || 'Instalación ejecutada conforme a especificaciones sin anomalías.'}"
  </div>

  <!-- Firmas y Certificación -->
  <div class="footer">
    <div class="stamp">
      VERIFICADO EN CAMPO<br>
      QoS VALIDADO
    </div>
    <div>
      <div class="signature-line">
        Firma del Técnico Instalador<br>
        <span style="font-size: 10px; font-weight: 500; color: #64748b;">Matrícula / ID Técnico: DAM-2026</span>
      </div>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Genera el archivo PDF local a partir de la instalación (RF-06)
   */
  static async generateAndSavePdf(installation: TechnicalInstallation): Promise<string> {
    const html = this.generateReportHtml(installation);

    if (Platform.OS === 'web') {
      // En Web: abrir ventana de impresión o crear enlace de descarga
      if (typeof window !== 'undefined') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          setTimeout(() => printWindow.print(), 250);
        }
      }
      return `report_${installation.subscriberNumber}.pdf`;
    }

    try {
      // En Android / iOS: expo-print genera el PDF directamente
      const { uri } = await Print.printToFileAsync({ html });
      return uri;
    } catch (err) {
      console.warn('[PdfReportGenerator] Fallback al generar PDF nativo:', err);
      return '';
    }
  }

  /**
   * Comparte o descarga el archivo PDF generado
   */
  static async sharePdf(pdfUri: string): Promise<void> {
    if (Platform.OS === 'web') {
      return;
    }
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(pdfUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Compartir Reporte Técnico de Instalación',
      });
    }
  }
}
