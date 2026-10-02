import { PingResult, QoSRating, QoSThresholds, SignalInfo, ThroughputResult } from '../types';
import { colors } from '../constants/theme';

export interface DegradationCheckResult {
  isDegraded: boolean;
  severity: 'none' | 'warning' | 'critical';
  reasons: string[];
}

export class QoSScorer {
  /**
   * Determina la calificación global de QoS (Excelente, Buena, Regular, Pobre)
   */
  static evaluateQoS(
    pings: PingResult[],
    throughput: ThroughputResult,
    signal: SignalInfo
  ): QoSRating {
    const validPings = pings.filter((p) => p.status === 'success' || p.status === 'warning');
    const avgLatency = validPings.length > 0
      ? validPings.reduce((sum, p) => sum + p.avgRttMs, 0) / validPings.length
      : 999;
    const avgJitter = validPings.length > 0
      ? validPings.reduce((sum, p) => sum + p.jitterMs, 0) / validPings.length
      : 999;
    const maxPacketLoss = pings.length > 0
      ? Math.max(...pings.map((p) => p.packetLossPct))
      : 100;

    const downloadMbps = throughput.downloadMbps || 0;
    const rssiDbm = signal.dbm;

    // Regla de Calificación
    if (avgLatency <= 45 && avgJitter <= 12 && maxPacketLoss === 0 && downloadMbps >= 25 && rssiDbm >= -85) {
      return 'EXCELLENT';
    }
    if (avgLatency <= 85 && avgJitter <= 25 && maxPacketLoss <= 2 && downloadMbps >= 10 && rssiDbm >= -98) {
      return 'GOOD';
    }
    if (avgLatency <= 150 && avgJitter <= 40 && maxPacketLoss <= 5 && downloadMbps >= 3 && rssiDbm >= -108) {
      return 'FAIR';
    }
    return 'POOR';
  }

  /**
   * Evalúa si una medición infringe los umbrales de degradación severa (RF-07)
   */
  static checkDegradation(
    pings: PingResult[],
    throughput: ThroughputResult,
    signal: SignalInfo,
    thresholds: QoSThresholds
  ): DegradationCheckResult {
    const reasons: string[] = [];
    let severity: 'none' | 'warning' | 'critical' = 'none';

    // 1. Latencia promedio
    const validPings = pings.filter((p) => p.status === 'success' || p.status === 'warning');
    const avgLatency = validPings.length > 0
      ? validPings.reduce((sum, p) => sum + p.avgRttMs, 0) / validPings.length
      : 999;

    if (avgLatency >= thresholds.maxLatencyCriticalMs) {
      severity = 'critical';
      reasons.push(`Latencia crítica: ${Math.round(avgLatency)} ms (umbral: >${thresholds.maxLatencyCriticalMs} ms)`);
    } else if (avgLatency >= thresholds.maxLatencyWarningMs) {
      if (severity === 'none') severity = 'warning';
      reasons.push(`Latencia elevada: ${Math.round(avgLatency)} ms (umbral: >${thresholds.maxLatencyWarningMs} ms)`);
    }

    // 2. Jitter
    const maxJitter = validPings.length > 0 ? Math.max(...validPings.map((p) => p.jitterMs)) : 0;
    if (maxJitter >= thresholds.maxJitterWarningMs) {
      if (severity === 'none') severity = 'warning';
      reasons.push(`Jitter inestable: ${maxJitter} ms (umbral: >${thresholds.maxJitterWarningMs} ms)`);
    }

    // 3. Pérdida de paquetes
    const maxPacketLoss = pings.length > 0 ? Math.max(...pings.map((p) => p.packetLossPct)) : 0;
    if (maxPacketLoss >= thresholds.maxPacketLossWarningPct) {
      severity = 'critical';
      reasons.push(`Pérdida de paquetes severa: ${maxPacketLoss}% (umbral: >${thresholds.maxPacketLossWarningPct}%)`);
    }

    // 4. Velocidad de descarga
    if (throughput.status === 'completed' && throughput.downloadMbps < thresholds.minThroughputWarningMbps) {
      if (severity === 'none') severity = 'warning';
      reasons.push(`Throughput bajo: ${throughput.downloadMbps} Mbps (umbral: <${thresholds.minThroughputWarningMbps} Mbps)`);
    }

    // 5. Nivel de señal celular (RSSI)
    if (signal.dbm <= thresholds.minRssiCriticalDbm && signal.networkType !== 'WIFI') {
      severity = 'critical';
      reasons.push(`Señal celular crítica: ${signal.dbm} dBm (umbral: <${thresholds.minRssiCriticalDbm} dBm)`);
    }

    return {
      isDegraded: severity !== 'none',
      severity,
      reasons,
    };
  }

  /**
   * Color temático asociado a la calificación QoS
   */
  static getQoSColor(rating: QoSRating): string {
    switch (rating) {
      case 'EXCELLENT':
        return colors.qosExcellent;
      case 'GOOD':
        return colors.qosGood;
      case 'FAIR':
        return colors.qosFair;
      case 'POOR':
        return colors.qosPoor;
      default:
        return colors.textSecondary;
    }
  }

  /**
   * Etiqueta amigable en español
   */
  static getQoSTitle(rating: QoSRating): string {
    switch (rating) {
      case 'EXCELLENT':
        return 'Excelente (QoS Alta)';
      case 'GOOD':
        return 'Buena (QoS Óptima)';
      case 'FAIR':
        return 'Aceptable (QoS Media)';
      case 'POOR':
        return 'Degradada / Pobre (QoS Baja)';
      default:
        return 'Sin evaluar';
    }
  }
}
