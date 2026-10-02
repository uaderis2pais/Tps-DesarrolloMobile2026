import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import { ConnectionType, SignalInfo } from '../types';

const { TelephonyModule } = NativeModules;

export class TelephonyBridge {
  private static emitter: NativeEventEmitter | null = null;
  private static mockInterval: any = null;
  private static cachedSignal: SignalInfo = {
    operator: 'Personal 4G',
    networkType: '4G',
    rawTypeDescription: 'LTE (Band 4/28)',
    dbm: -82,
    level: 4,
    asu: 58,
    isRoaming: false,
    simState: 'Lista / Activa',
    timestamp: Date.now(),
  };

  /**
   * Obtiene la información actual de telefonía celular y señal
   */
  static async getSignalInfo(): Promise<SignalInfo> {
    if (Platform.OS === 'android' && TelephonyModule && typeof TelephonyModule.getNetworkInfo === 'function') {
      try {
        const raw = await TelephonyModule.getNetworkInfo();
        const netType = this.normalizeNetworkType(raw.networkType);
        
        const signal: SignalInfo = {
          operator: raw.operator || 'Operador Móvil',
          networkType: netType,
          rawTypeDescription: raw.networkType || 'Celular',
          dbm: raw.dbm ?? -95,
          level: Math.min(4, Math.max(0, raw.level ?? 2)),
          asu: raw.asu ?? 15,
          isRoaming: !!raw.isRoaming,
          simState: raw.simState || 'Activa',
          timestamp: Date.now(),
        };
        this.cachedSignal = signal;
        return signal;
      } catch (err) {
        console.warn('[TelephonyBridge] Fallback a telemetría simulada por excepción nativa:', err);
      }
    }

    // Fallback multiplataforma (Web / iOS / Expo Go / Emulador)
    return this.getSimulatedOrWebSignal();
  }

  /**
   * Suscribe a cambios en tiempo real del nivel de señal celular
   */
  static subscribe(callback: (info: SignalInfo) => void): () => void {
    if (Platform.OS === 'android' && TelephonyModule) {
      try {
        if (!this.emitter) {
          this.emitter = new NativeEventEmitter(TelephonyModule);
        }
        TelephonyModule.startSignalListening?.();
        const sub = this.emitter.addListener('onSignalStrengthChanged', async () => {
          const fresh = await this.getSignalInfo();
          callback(fresh);
        });

        return () => {
          sub.remove();
          TelephonyModule.stopSignalListening?.();
        };
      } catch (e) {
        console.warn('[TelephonyBridge] No se pudo inicializar listener nativo:', e);
      }
    }

    // Multiplataforma / Simulación periódica para test en web/dev
    const interval = setInterval(async () => {
      const fresh = await this.getSignalInfo();
      callback(fresh);
    }, 4000);

    return () => clearInterval(interval);
  }

  private static getSimulatedOrWebSignal(): SignalInfo {
    // Si estamos en navegador Web con API de Network Information
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && 'connection' in navigator) {
      const conn = (navigator as any).connection;
      const effectiveType = conn?.effectiveType || '4g';
      const netType: ConnectionType = effectiveType === '4g' ? '4G' : effectiveType === '5g' ? '5G' : 'WIFI';
      
      const jitter = (Math.random() * 6 - 3); // pequeña variación
      const dbm = Math.round(-80 + jitter);
      const level = dbm > -80 ? 4 : dbm > -90 ? 3 : dbm > -105 ? 2 : 1;

      return {
        operator: conn?.type === 'wifi' ? 'Red Local WiFi' : 'Personal 4G/LTE',
        networkType: conn?.type === 'wifi' ? 'WIFI' : netType,
        rawTypeDescription: conn?.type === 'wifi' ? 'WiFi 802.11ax' : '4G LTE Carrier Aggregation',
        dbm,
        level,
        asu: Math.round(50 + jitter),
        isRoaming: false,
        simState: 'Lista / Conectada',
        timestamp: Date.now(),
      };
    }

    // Variación realista para pruebas de laboratorio
    const delta = (Math.random() * 8 - 4);
    const dbm = Math.max(-120, Math.min(-55, Math.round(this.cachedSignal.dbm + delta)));
    const level = dbm > -80 ? 4 : dbm > -95 ? 3 : dbm > -110 ? 2 : 1;

    this.cachedSignal = {
      ...this.cachedSignal,
      dbm,
      level,
      timestamp: Date.now(),
    };
    return this.cachedSignal;
  }

  private static normalizeNetworkType(rawType: string = ''): ConnectionType {
    const upper = rawType.toUpperCase();
    if (upper.includes('5G') || upper.includes('NR')) return '5G';
    if (upper.includes('4G') || upper.includes('LTE')) return '4G';
    if (upper.includes('3G') || upper.includes('HSPA') || upper.includes('UMTS')) return '3G';
    if (upper.includes('2G') || upper.includes('GSM') || upper.includes('EDGE')) return '2G';
    if (upper.includes('WIFI')) return 'WIFI';
    return '4G';
  }
}
