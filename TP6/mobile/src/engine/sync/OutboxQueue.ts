import AsyncStorage from '@react-native-async-storage/async-storage';
import { OutboxActionType, OutboxItem } from '../../types';

const OUTBOX_STORAGE_KEY = '@telecom_outbox_queue_v1';

type OutboxListener = (items: OutboxItem[]) => void;

export class OutboxQueue {
  private static cachedItems: OutboxItem[] | null = null;
  private static listeners: Set<OutboxListener> = new Set();
  private static isSyncing: boolean = false;

  /**
   * Inicializa la cola desde almacenamiento local
   */
  static async init(): Promise<void> {
    if (this.cachedItems !== null) return;
    try {
      const raw = await AsyncStorage.getItem(OUTBOX_STORAGE_KEY);
      if (raw) {
        this.cachedItems = JSON.parse(raw);
      } else {
        this.cachedItems = [];
      }
    } catch {
      this.cachedItems = [];
    }
  }

  /**
   * Encola una acción para sincronización diferida (Patrón Outbox RF-07)
   */
  static async enqueue(type: OutboxActionType, payload: any): Promise<OutboxItem> {
    await this.init();

    const item: OutboxItem = {
      id: `outbox-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type,
      payload,
      createdAt: new Date().toISOString(),
      retryCount: 0,
      maxRetries: 5,
      status: 'PENDING',
    };

    this.cachedItems = [item, ...(this.cachedItems || [])];
    await this.persist();
    this.notify();
    return item;
  }

  /**
   * Procesa la cola enviando las acciones pendientes al backend de sincronización
   */
  static async processQueue(backendUrl: string): Promise<{ syncedCount: number; errorCount: number }> {
    await this.init();
    if (this.isSyncing) return { syncedCount: 0, errorCount: 0 };

    const pending = (this.cachedItems || []).filter(
      (item) => item.status === 'PENDING' || (item.status === 'FAILED' && item.retryCount < item.maxRetries)
    );

    if (pending.length === 0) return { syncedCount: 0, errorCount: 0 };

    this.isSyncing = true;
    let syncedCount = 0;
    let errorCount = 0;

    // Marcar como SYNCING
    pending.forEach((p) => {
      p.status = 'SYNCING';
      p.lastAttemptAt = new Date().toISOString();
    });
    this.notify();

    try {
      const cleanUrl = backendUrl.replace(/\/$/, '');
      const response = await fetch(`${cleanUrl}/api/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actions: pending.map((item) => ({
            id: item.id,
            type: item.type,
            timestamp: item.createdAt,
            data: item.payload,
            retryCount: item.retryCount,
          })),
        }),
      });

      if (response.ok) {
        const json = await response.json();
        const results = json.results || [];

        // Actualizar cada elemento según la respuesta del backend
        pending.forEach((item) => {
          const res = results.find((r: any) => r.id === item.id);
          if (res && res.status === 'SUCCESS') {
            item.status = 'SYNCED';
            syncedCount++;
          } else {
            item.retryCount++;
            item.status = item.retryCount >= item.maxRetries ? 'FAILED' : 'PENDING';
            item.errorMessage = res?.message || 'Error reportado por servidor';
            errorCount++;
          }
        });
      } else {
        // Fallo HTTP del servidor
        pending.forEach((item) => {
          item.retryCount++;
          item.status = item.retryCount >= item.maxRetries ? 'FAILED' : 'PENDING';
          item.errorMessage = `HTTP ${response.status}: Servidor no disponible`;
          errorCount++;
        });
      }
    } catch (err: any) {
      // Sin conexión a internet o backend apagado
      pending.forEach((item) => {
        item.retryCount++;
        item.status = item.retryCount >= item.maxRetries ? 'FAILED' : 'PENDING';
        item.errorMessage = err?.message || 'Sin conexión a internet (en espera)';
        errorCount++;
      });
    } finally {
      this.isSyncing = false;
      await this.persist();
      this.notify();
    }

    return { syncedCount, errorCount };
  }

  /**
   * Reintenta manualmente un elemento específico
   */
  static async retryItem(itemId: string, backendUrl: string): Promise<boolean> {
    await this.init();
    const item = (this.cachedItems || []).find((i) => i.id === itemId);
    if (!item) return false;

    item.status = 'PENDING';
    item.retryCount = 0;
    item.errorMessage = undefined;
    await this.persist();
    this.notify();

    await this.processQueue(backendUrl);
    return true;
  }

  /**
   * Elimina un elemento de la cola
   */
  static async removeItem(itemId: string): Promise<void> {
    await this.init();
    this.cachedItems = (this.cachedItems || []).filter((i) => i.id !== itemId);
    await this.persist();
    this.notify();
  }

  /**
   * Limpia todos los elementos que ya fueron sincronizados con éxito
   */
  static async clearSynced(): Promise<void> {
    await this.init();
    this.cachedItems = (this.cachedItems || []).filter((i) => i.status !== 'SYNCED');
    await this.persist();
    this.notify();
  }

  static getItems(): OutboxItem[] {
    return this.cachedItems || [];
  }

  static getStats(): { pending: number; syncing: number; synced: number; failed: number } {
    const items = this.cachedItems || [];
    return {
      pending: items.filter((i) => i.status === 'PENDING').length,
      syncing: items.filter((i) => i.status === 'SYNCING').length,
      synced: items.filter((i) => i.status === 'SYNCED').length,
      failed: items.filter((i) => i.status === 'FAILED').length,
    };
  }

  static subscribe(listener: OutboxListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private static notify(): void {
    const list = [...(this.cachedItems || [])];
    this.listeners.forEach((l) => l(list));
  }

  private static async persist(): Promise<void> {
    try {
      await AsyncStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(this.cachedItems || []));
    } catch (e) {
      console.warn('[OutboxQueue] Error al persistir cola:', e);
    }
  }
}
