import AsyncStorage from '@react-native-async-storage/async-storage';
import { FilterCriteria, MeasurementSession } from '../types';
import { SAMPLE_SESSIONS } from './sampleData';

const STORAGE_KEY = '@network_qos_sessions_v5_concepcion_verified';

export class Database {
  private static cachedSessions: MeasurementSession[] | null = null;

  /**
   * Inicializa la base de datos y carga datos predeterminados si está vacía
   */
  static async init(): Promise<void> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_SESSIONS));
        this.cachedSessions = [...SAMPLE_SESSIONS];
      } else {
        this.cachedSessions = JSON.parse(raw);
      }
    } catch (err) {
      console.warn('[Database] Error inicializando almacenamiento local:', err);
      this.cachedSessions = [...SAMPLE_SESSIONS];
    }
  }

  /**
   * Restablece la base de datos a las sesiones georreferenciadas originales
   */
  static async resetToDefaults(): Promise<MeasurementSession[]> {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_SESSIONS));
    this.cachedSessions = [...SAMPLE_SESSIONS];
    return [...SAMPLE_SESSIONS];
  }

  /**
   * Retorna todas las sesiones almacenadas ordenadas descendentemente por fecha
   */
  static async getAllSessions(): Promise<MeasurementSession[]> {
    if (!this.cachedSessions) {
      await this.init();
    }
    return (this.cachedSessions || []).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /**
   * Guarda una nueva sesión de medición (RF-04)
   */
  static async saveSession(session: MeasurementSession): Promise<void> {
    const list = await this.getAllSessions();
    const updated = [session, ...list];
    this.cachedSessions = updated;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  /**
   * Filtra las sesiones según criterios de red, fecha y búsqueda (RF-09)
   */
  static async getFilteredSessions(filters: FilterCriteria): Promise<MeasurementSession[]> {
    const all = await this.getAllSessions();

    return all.filter((session) => {
      // 1. Filtro por tipo de red
      if (filters.networkTypes.length > 0) {
        if (!filters.networkTypes.includes(session.signal.networkType)) {
          return false;
        }
      }

      // 2. Filtro por rango de fecha
      if (filters.dateRange !== 'all') {
        const sessionTime = new Date(session.timestamp).getTime();
        const now = Date.now();
        let maxAgeMs = Infinity;

        if (filters.dateRange === 'today') {
          maxAgeMs = 24 * 3600 * 1000;
        } else if (filters.dateRange === '7days') {
          maxAgeMs = 7 * 24 * 3600 * 1000;
        } else if (filters.dateRange === '30days') {
          maxAgeMs = 30 * 24 * 3600 * 1000;
        }

        if (now - sessionTime > maxAgeMs) {
          return false;
        }
      }

      // 3. Filtro por calificación mínima QoS
      if (filters.minQoS) {
        const ranks = { EXCELLENT: 4, GOOD: 3, FAIR: 2, POOR: 1 };
        if (ranks[session.overallQoSRating] < ranks[filters.minQoS]) {
          return false;
        }
      }

      // 4. Búsqueda por texto (operador, zona, id)
      if (filters.searchQuery && filters.searchQuery.trim().length > 0) {
        const q = filters.searchQuery.toLowerCase();
        const matchOperator = session.signal.operator.toLowerCase().includes(q);
        const matchAddress = session.location.addressSummary?.toLowerCase().includes(q) || false;
        const matchRating = session.overallQoSRating.toLowerCase().includes(q);
        if (!matchOperator && !matchAddress && !matchRating) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Elimina una sesión por ID
   */
  static async deleteSession(id: string): Promise<void> {
    const list = await this.getAllSessions();
    const updated = list.filter((s) => s.id !== id);
    this.cachedSessions = updated;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  /**
   * Reinicia la base de datos a los valores de muestra
   */
  static async resetToSamples(): Promise<void> {
    this.cachedSessions = [...SAMPLE_SESSIONS];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_SESSIONS));
  }
}
