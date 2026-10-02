import { useState, useEffect } from 'react';
import {
  AppConfig,
  FilterCriteria,
  GeoLocation,
  MeasurementSession,
  PingResult,
  SignalInfo,
  ThroughputResult,
} from '../types';
import { DEFAULT_CONFIG } from '../constants/defaults';
import { Database } from '../storage/Database';
import { TelephonyBridge } from '../native/TelephonyBridge';
import { GeoLocationService } from '../geo/GeoLocationService';
import { PingEngine } from '../engine/PingEngine';
import { ThroughputEngine } from '../engine/ThroughputEngine';
import { QoSScorer } from '../engine/QoSScorer';
import { BackgroundSampler } from '../engine/BackgroundSampler';

interface StoreState {
  isInitialized: boolean;
  currentSignal: SignalInfo;
  currentLocation: GeoLocation;
  isTesting: boolean;
  testPhase: 'idle' | 'pings' | 'download' | 'upload' | 'completed';
  activeHostPings: PingResult[];
  liveDownloadMbps: number;
  liveUploadMbps: number;
  liveProgressPct: number;
  lastSession: MeasurementSession | null;
  sessions: MeasurementSession[];
  filteredSessions: MeasurementSession[];
  filters: FilterCriteria;
  config: AppConfig;
  backgroundStatus: { isRunning: boolean; lastRun: number | null };
}

let globalState: StoreState = {
  isInitialized: false,
  currentSignal: {
    operator: 'Buscando red...',
    networkType: 'UNKNOWN',
    rawTypeDescription: 'Iniciando',
    dbm: -90,
    level: 2,
    asu: 30,
    isRoaming: false,
    simState: 'Detectando',
    timestamp: Date.now(),
  },
  currentLocation: GeoLocationService.getCachedLocation(),
  isTesting: false,
  testPhase: 'idle',
  activeHostPings: [],
  liveDownloadMbps: 0,
  liveUploadMbps: 0,
  liveProgressPct: 0,
  lastSession: null,
  sessions: [],
  filteredSessions: [],
  filters: {
    networkTypes: [],
    dateRange: 'all',
  },
  config: DEFAULT_CONFIG,
  backgroundStatus: BackgroundSampler.getStatus(),
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function useQoSStore() {
  const [state, setState] = useState<StoreState>(globalState);

  useEffect(() => {
    const listener = () => setState({ ...globalState });
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return {
    ...state,

    /**
     * Inicialización del store, persistencia y módulos nativos
     */
    async init() {
      if (globalState.isInitialized) return;

      await Database.init();
      const sessions = await Database.getAllSessions();
      globalState.sessions = sessions;
      globalState.filteredSessions = sessions;
      if (sessions.length > 0) {
        globalState.lastSession = sessions[0];
      }

      // Obtener posición inicial
      GeoLocationService.getCurrentLocation().then((loc) => {
        globalState.currentLocation = loc;
        notify();
      });

      // Suscribirse a cambios de señal
      TelephonyBridge.subscribe((signal) => {
        globalState.currentSignal = signal;
        notify();
      });

      // Escuchar estado de background sampler
      BackgroundSampler.subscribeStatus((status) => {
        globalState.backgroundStatus = status;
        notify();
      });

      globalState.isInitialized = true;
      notify();
    },

    /**
     * Ejecuta una prueba manual completa (RF-01, RF-02, RF-03, RF-04)
     */
    async runFullTest() {
      if (globalState.isTesting) return;

      globalState.isTesting = true;
      globalState.testPhase = 'pings';
      globalState.liveDownloadMbps = 0;
      globalState.liveUploadMbps = 0;
      globalState.liveProgressPct = 5;
      globalState.activeHostPings = [];
      notify();

      try {
        // 1. Obtener ubicación fresca y señal en el momento del test
        const [location, signal] = await Promise.all([
          GeoLocationService.getCurrentLocation(),
          TelephonyBridge.getSignalInfo(),
        ]);
        globalState.currentLocation = location;
        globalState.currentSignal = signal;
        notify();

        // 2. Ejecutar sondas de ping contra los hosts configurados (RF-02)
        const hostPings = await PingEngine.runPingTestSuite(
          globalState.config.hosts,
          4,
          (partial) => {
            const list = [...globalState.activeHostPings];
            const idx = list.findIndex((h) => h.hostId === partial.hostId);
            if (idx >= 0) {
              list[idx] = partial;
            } else {
              list.push(partial);
            }
            globalState.activeHostPings = list;
            notify();
          }
        );

        globalState.testPhase = 'download';
        notify();

        // 3. Ejecutar test de Throughput (Descarga + Subida) (RF-03)
        const throughput = await ThroughputEngine.runFullThroughputTest(
          globalState.config.backendUrl,
          globalState.config.payloadSizeMb,
          ({ phase, currentMbps, progressPct }) => {
            if (phase === 'download') {
              globalState.testPhase = 'download';
              globalState.liveDownloadMbps = currentMbps;
            } else {
              globalState.testPhase = 'upload';
              globalState.liveUploadMbps = currentMbps;
            }
            globalState.liveProgressPct = progressPct;
            notify();
          }
        );

        // 4. Evaluar QoS global y verificar degradación
        const overallQoSRating = QoSScorer.evaluateQoS(hostPings, throughput, signal);
        const degradation = QoSScorer.checkDegradation(
          hostPings,
          throughput,
          signal,
          globalState.config.thresholds
        );

        // 5. Guardar sesión georreferenciada (RF-04)
        const newSession: MeasurementSession = {
          id: `qos-${Date.now()}`,
          timestamp: new Date().toISOString(),
          location,
          signal,
          pings: hostPings,
          throughput,
          overallQoSRating,
          isBackground: false,
          degradationAlertDispatched: degradation.isDegraded,
        };

        await Database.saveSession(newSession);

        const updatedSessions = await Database.getAllSessions();
        globalState.sessions = updatedSessions;
        globalState.lastSession = newSession;
        globalState.filteredSessions = await Database.getFilteredSessions(globalState.filters);
        globalState.testPhase = 'completed';
        globalState.liveProgressPct = 100;
        notify();

        return newSession;
      } catch (err) {
        console.error('[useQoSStore] Error ejecutando prueba de QoS:', err);
      } finally {
        globalState.isTesting = false;
        notify();
      }
    },

    /**
     * Aplica filtros al historial (RF-09)
     */
    async setFilters(filters: FilterCriteria) {
      globalState.filters = filters;
      const filtered = await Database.getFilteredSessions(filters);
      globalState.filteredSessions = filtered;
      notify();
    },

    /**
     * Actualiza la configuración global
     */
    updateConfig(newConfig: Partial<AppConfig>) {
      globalState.config = { ...globalState.config, ...newConfig };
      if (newConfig.backgroundSamplingEnabled !== undefined) {
        if (newConfig.backgroundSamplingEnabled) {
          BackgroundSampler.start(globalState.config);
        } else {
          BackgroundSampler.stop();
        }
      }
      notify();
    },

    /**
     * Elimina una sesión del historial
     */
    async deleteSession(id: string) {
      await Database.deleteSession(id);
      const updated = await Database.getAllSessions();
      globalState.sessions = updated;
      globalState.filteredSessions = await Database.getFilteredSessions(globalState.filters);
      if (globalState.lastSession?.id === id) {
        globalState.lastSession = updated.length > 0 ? updated[0] : null;
      }
      notify();
    },

    /**
     * Recarga los datos iniciales de prueba
     */
    async resetToDefaultSamples() {
      await Database.resetToSamples();
      const updated = await Database.getAllSessions();
      globalState.sessions = updated;
      globalState.filteredSessions = updated;
      globalState.lastSession = updated[0];
      notify();
    },
  };
}
