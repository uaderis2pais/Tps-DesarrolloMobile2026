import { AppConfig, MeasurementSession } from '../types';
import { TelephonyBridge } from '../native/TelephonyBridge';
import { GeoLocationService } from '../geo/GeoLocationService';
import { PingEngine } from './PingEngine';
import { ThroughputEngine } from './ThroughputEngine';
import { QoSScorer } from './QoSScorer';
import { Database } from '../storage/Database';
import { Alert, Platform } from 'react-native';

export class BackgroundSampler {
  private static timerId: any = null;
  private static isRunning: boolean = false;
  private static lastExecutionTimestamp: number | null = null;
  private static lastAlertMessage: string | null = null;
  private static listeners: Array<(status: { isRunning: boolean; lastRun: number | null }) => void> = [];

  /**
   * Inicia el orquestador de muestreo periódico en segundo plano (RF-07)
   */
  static start(config: AppConfig): void {
    if (this.isRunning) return;

    this.isRunning = true;
    const intervalMs = Math.max(1, config.backgroundIntervalMinutes) * 60 * 1000;

    // Ejecuta una primera toma inmediata en background
    this.executeSingleBackgroundSample(config);

    // Agenda las tomas recurrentes
    this.timerId = setInterval(() => {
      this.executeSingleBackgroundSample(config);
    }, intervalMs);

    this.notifyListeners();
    console.log(`[BackgroundSampler] Iniciado servicio con intervalo de ${config.backgroundIntervalMinutes} min.`);
  }

  /**
   * Detiene el muestreo en segundo plano
   */
  static stop(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.isRunning = false;
    this.notifyListeners();
    console.log('[BackgroundSampler] Servicio de muestreo detenido.');
  }

  static getStatus(): { isRunning: boolean; lastRun: number | null; lastAlert: string | null } {
    return {
      isRunning: this.isRunning,
      lastRun: this.lastExecutionTimestamp,
      lastAlert: this.lastAlertMessage,
    };
  }

  static subscribeStatus(callback: (status: { isRunning: boolean; lastRun: number | null }) => void): () => void {
    this.listeners.push(callback);
    callback({ isRunning: this.isRunning, lastRun: this.lastExecutionTimestamp });
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  /**
   * Ejecuta un ciclo de muestreo completo sin bloquear el hilo principal
   */
  static async executeSingleBackgroundSample(config: AppConfig): Promise<MeasurementSession | null> {
    try {
      this.lastExecutionTimestamp = Date.now();

      // 1. Obtener posición GPS actual
      const location = await GeoLocationService.getCurrentLocation();

      // 2. Obtener señal y operador celular nativo
      const signal = await TelephonyBridge.getSignalInfo();

      // 3. Ejecutar sondeos de ping
      const pings = await PingEngine.runPingTestSuite(config.hosts, 3);

      // 4. Medir Throughput liviano
      const throughput = await ThroughputEngine.runFullThroughputTest(config.backendUrl, 1);

      // 5. Evaluar QoS y degradación
      const overallQoSRating = QoSScorer.evaluateQoS(pings, throughput, signal);
      const degradation = QoSScorer.checkDegradation(pings, throughput, signal, config.thresholds);

      // 6. Construir sesión
      const session: MeasurementSession = {
        id: `bg-${Date.now()}`,
        timestamp: new Date().toISOString(),
        location,
        signal,
        pings,
        throughput,
        overallQoSRating,
        isBackground: true,
        degradationAlertDispatched: degradation.isDegraded,
      };

      // 7. Persistir en base de datos
      await Database.saveSession(session);

      // 8. Notificar degradación si corresponde
      if (degradation.isDegraded && config.notificationsEnabled) {
        const alertText = degradation.reasons.join('\n');
        this.lastAlertMessage = alertText;
        this.dispatchNotification(
          `⚠️ Alerta QoS: Degradación Severa de Red (${signal.networkType})`,
          alertText
        );
      }

      this.notifyListeners();
      return session;
    } catch (err) {
      console.error('[BackgroundSampler] Error en ciclo de muestreo:', err);
      return null;
    }
  }

  /**
   * Despacha notificación local
   */
  private static dispatchNotification(title: string, body: string): void {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body });
      } else {
        console.warn(`[Notificación QoS] ${title} - ${body}`);
      }
    } else {
      Alert.alert(title, body);
    }
  }

  private static notifyListeners(): void {
    const status = { isRunning: this.isRunning, lastRun: this.lastExecutionTimestamp };
    this.listeners.forEach((cb) => {
      try {
        cb(status);
      } catch (_) {}
    });
  }
}
