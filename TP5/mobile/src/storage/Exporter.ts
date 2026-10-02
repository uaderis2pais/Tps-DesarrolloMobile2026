import { Platform, Share, Alert } from 'react-native';
import { MeasurementSession } from '../types';

export class Exporter {
  /**
   * Genera una representación estructurada JSON del historial (RF-08)
   */
  static exportToJson(sessions: MeasurementSession[]): string {
    const payload = {
      exportMetadata: {
        application: 'Network QoS Monitor',
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        totalSessions: sessions.length,
      },
      sessions,
    };
    return JSON.stringify(payload, null, 2);
  }

  /**
   * Genera un archivo CSV con todas las columnas normalizadas de telemetría (RF-08)
   */
  static exportToCsv(sessions: MeasurementSession[]): string {
    const headers = [
      'ID',
      'Timestamp_ISO',
      'Latitude',
      'Longitude',
      'Accuracy_m',
      'Address_Summary',
      'Network_Type',
      'Operator',
      'RSSI_dBm',
      'Signal_Level_Bars',
      'ASU',
      'Ping_Avg_ms',
      'Ping_Min_ms',
      'Ping_Max_ms',
      'Jitter_RFC3550_ms',
      'Packet_Loss_Pct',
      'Download_Throughput_Mbps',
      'Upload_Throughput_Mbps',
      'QoS_Rating',
      'Is_Background_Sample',
      'Degradation_Alert_Sent',
    ];

    const rows = sessions.map((s) => {
      const validPings = s.pings.filter((p) => p.status === 'success' || p.status === 'warning');
      const avgPing = validPings.length > 0
        ? Math.round(validPings.reduce((sum, p) => sum + p.avgRttMs, 0) / validPings.length)
        : 0;
      const minPing = validPings.length > 0 ? Math.min(...validPings.map((p) => p.minRttMs)) : 0;
      const maxPing = validPings.length > 0 ? Math.max(...validPings.map((p) => p.maxRttMs)) : 0;
      const jitter = validPings.length > 0 ? validPings[0].jitterMs : 0;
      const loss = s.pings.length > 0 ? Math.max(...s.pings.map((p) => p.packetLossPct)) : 0;

      return [
        `"${s.id}"`,
        `"${s.timestamp}"`,
        s.location.latitude,
        s.location.longitude,
        s.location.accuracy ?? '',
        `"${(s.location.addressSummary || '').replace(/"/g, '""')}"`,
        `"${s.signal.networkType}"`,
        `"${s.signal.operator}"`,
        s.signal.dbm,
        s.signal.level,
        s.signal.asu,
        avgPing,
        minPing,
        maxPing,
        jitter,
        loss,
        s.throughput.downloadMbps,
        s.throughput.uploadMbps,
        `"${s.overallQoSRating}"`,
        s.isBackground ? 1 : 0,
        s.degradationAlertDispatched ? 1 : 0,
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Descarga o comparte el archivo generado según el entorno de ejecución
   */
  static async downloadOrShare(
    content: string,
    filename: string,
    mimeType: string
  ): Promise<boolean> {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof document !== 'undefined') {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return true;
      }

      // En dispositivos móviles (Android / iOS)
      await Share.share({
        title: filename,
        message: content,
      });
      return true;
    } catch (err: any) {
      console.error('[Exporter] Error exportando archivo:', err);
      Alert.alert('Error de exportación', `No se pudo exportar el archivo: ${err?.message}`);
      return false;
    }
  }
}
