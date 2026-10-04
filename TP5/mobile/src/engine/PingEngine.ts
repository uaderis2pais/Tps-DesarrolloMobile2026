import { HostProbeTarget, PingResult } from '../types';
import { resolveNetworkUrl } from '../utils/networkUtils';

export class PingEngine {
  /**
   * Ejecuta sondas de ping/RTT contra una lista de hosts configurables (RF-02)
   * Calcula: Min RTT, Avg RTT, Max RTT, Jitter según norma RFC 3550 y Pérdida de paquetes.
   */
  static async runPingTestSuite(
    hosts: HostProbeTarget[],
    samplesPerHost: number = 3,
    onHostProgress?: (result: PingResult) => void
  ): Promise<PingResult[]> {
    const results: PingResult[] = [];

    for (const target of hosts) {
      const result = await this.pingSingleHost(target, samplesPerHost, onHostProgress);
      results.push(result);
    }

    return results;
  }

  /**
   * Ejecuta la secuencia de sondas para un único host
   */
  static async pingSingleHost(
    target: HostProbeTarget,
    samplesCount: number = 3,
    onProgress?: (result: PingResult) => void
  ): Promise<PingResult> {
    const samples: number[] = [];
    let lostPackets = 0;

    for (let i = 0; i < samplesCount; i++) {
      try {
        const rtt = await this.measureSingleProbe(target);
        samples.push(rtt);
      } catch (err) {
        lostPackets++;
      }

      // Emite avance parcial
      if (onProgress) {
        const intermediate = this.computeStatistics(target, samples, lostPackets, samplesCount, 'running');
        onProgress(intermediate);
      }

      // Pequeño intervalo inter-paquete (30ms)
      await new Promise((r) => setTimeout(r, 30));
    }

    const finalResult = this.computeStatistics(
      target,
      samples,
      lostPackets,
      samplesCount,
      lostPackets === samplesCount ? 'error' : lostPackets > 0 ? 'warning' : 'success'
    );

    if (onProgress) {
      onProgress(finalResult);
    }

    return finalResult;
  }

  /**
   * Mide el RTT de una única sonda de red con timestamp de alta precisión
   */
  private static async measureSingleProbe(target: HostProbeTarget): Promise<number> {
    const start = performance.now();
    const probeUrl = this.resolveProbeUrl(target);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);

    try {
      const response = await fetch(probeUrl, {
        method: 'GET',
        cache: 'no-store',
        mode: 'cors',
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const elapsed = performance.now() - start;

      // Si responde OK o estado estándar
      if (response.status || response.type === 'opaque') {
        return Math.max(1, Math.round(elapsed));
      }
      return Math.max(1, Math.round(elapsed));
    } catch (err: any) {
      clearTimeout(timeout);
      const elapsed = performance.now() - start;

      // En Web/CORS opaco o TCP Handshake completado
      if (elapsed < 1100 && err?.name !== 'AbortError') {
        return Math.max(2, Math.round(elapsed));
      }
      throw err;
    }
  }

  /**
   * Calcula estadísticas matemáticas y Jitter RFC 3550
   * 
   * Fórmula RFC 3550:
   * J(i) = J(i-1) + (|D(i-1, i)| - J(i-1)) / 16
   */
  static computeStatistics(
    target: HostProbeTarget,
    samples: number[],
    lostPackets: number,
    totalPlanned: number,
    status: 'idle' | 'running' | 'success' | 'warning' | 'error'
  ): PingResult {
    const packetLossPct = totalPlanned > 0 ? Math.round((lostPackets / totalPlanned) * 100) : 0;

    if (samples.length === 0) {
      return {
        hostId: target.id,
        hostName: target.name,
        hostAddress: target.host,
        minRttMs: 0,
        avgRttMs: 0,
        maxRttMs: 0,
        jitterMs: 0,
        packetLossPct,
        samples: [],
        status: status === 'running' ? 'running' : 'error',
        errorMessage: 'Tiempo de espera agotado (100% pérdida)',
      };
    }

    const minRttMs = Math.min(...samples);
    const maxRttMs = Math.max(...samples);
    const sum = samples.reduce((acc, val) => acc + val, 0);
    const avgRttMs = Math.round(sum / samples.length);

    // Cálculo estricto de Jitter RFC 3550
    let jitter = 0;
    for (let i = 1; i < samples.length; i++) {
      const delta = Math.abs(samples[i] - samples[i - 1]);
      jitter = jitter + (delta - jitter) / 16;
    }
    const jitterMs = Number(jitter.toFixed(1));

    return {
      hostId: target.id,
      hostName: target.name,
      hostAddress: target.host,
      minRttMs,
      avgRttMs,
      maxRttMs,
      jitterMs,
      packetLossPct,
      samples,
      status,
    };
  }

  private static resolveProbeUrl(target: HostProbeTarget): string {
    const rawHost = resolveNetworkUrl(target.host);
    const sep = rawHost.includes('?') ? '&' : '?';
    return `${rawHost}${sep}_ts=${Date.now()}`;
  }
}
