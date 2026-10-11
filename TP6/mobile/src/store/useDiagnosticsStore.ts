import { useState, useEffect } from 'react';
import {
  AppConfig,
  NetworkDevice,
  OutboxItem,
  SnmpDiagnosticResult,
  SshDiagnosticResult,
  TechnicalInstallation,
} from '../types';
import { LanDiscoveryService, ScanProgress } from '../engine/discovery/LanDiscoveryService';
import { SnmpClient } from '../engine/snmp/SnmpClient';
import { SshClient } from '../engine/ssh/SshClient';
import { OutboxQueue } from '../engine/sync/OutboxQueue';
import { OfflineDatabase } from '../storage/OfflineDatabase';
import { PdfReportGenerator } from '../engine/reporting/PdfReportGenerator';
import { resolveNetworkUrl } from '../utils/networkUtils';

interface StoreState {
  isInitialized: boolean;
  isOnline: boolean;
  simulatedOffline: boolean;
  config: AppConfig;
  scanProgress: ScanProgress;
  devices: NetworkDevice[];
  selectedDevice: NetworkDevice | null;
  lastSnmpResult: SnmpDiagnosticResult | null;
  lastSshResult: SshDiagnosticResult | null;
  installations: TechnicalInstallation[];
  snmpHistory: SnmpDiagnosticResult[];
  sshHistory: SshDiagnosticResult[];
  outboxItems: OutboxItem[];
  outboxStats: { pending: number; syncing: number; synced: number; failed: number };
  isSyncingOutbox: boolean;
}

let globalState: StoreState = {
  isInitialized: false,
  isOnline: true,
  simulatedOffline: false,
  config: {
    backendSyncUrl: 'http://localhost:3002',
    autoSyncOnReconnect: true,
    defaultSnmpCommunity: 'public',
    snmpTimeoutMs: 2500,
    lanScanSubnet: '192.168.1',
  },
  scanProgress: {
    scannedCount: 0,
    totalHosts: 24,
    currentIp: '',
    isScanning: false,
    foundDevices: [],
  },
  devices: [],
  selectedDevice: null,
  lastSnmpResult: null,
  lastSshResult: null,
  installations: [],
  snmpHistory: [],
  sshHistory: [],
  outboxItems: [],
  outboxStats: { pending: 0, syncing: 0, synced: 0, failed: 0 },
  isSyncingOutbox: false,
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function useDiagnosticsStore() {
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

    async init() {
      if (globalState.isInitialized) return;

      await OfflineDatabase.init();
      await OutboxQueue.init();

      const [insts, snmpHist, sshHist] = await Promise.all([
        OfflineDatabase.getInstallations(),
        OfflineDatabase.getSnmpDiagnostics(),
        OfflineDatabase.getSshDiagnostics(),
      ]);

      globalState.installations = insts;
      globalState.snmpHistory = snmpHist;
      globalState.sshHistory = sshHist;
      globalState.outboxItems = OutboxQueue.getItems();
      globalState.outboxStats = OutboxQueue.getStats();

      // Suscribirse a cambios en la cola outbox
      OutboxQueue.subscribe((items) => {
        globalState.outboxItems = items;
        globalState.outboxStats = OutboxQueue.getStats();
        notify();
      });

      // Si no hay dispositivos escaneados, iniciar con equipos en caché o pre-descubiertos
      const initialDevices = LanDiscoveryService.getCachedDevices();
      if (initialDevices.length > 0) {
        globalState.devices = initialDevices;
        globalState.selectedDevice = initialDevices[0];
      }

      globalState.isInitialized = true;
      notify();
    },

    /**
     * Escaneo de red local (RF-01)
     */
    async startScan(subnet?: string) {
      const targetSubnet = subnet || globalState.config.lanScanSubnet;
      globalState.scanProgress.isScanning = true;
      globalState.scanProgress.scannedCount = 0;
      notify();

      const found = await LanDiscoveryService.scanSubnet(targetSubnet, (prog) => {
        globalState.scanProgress = prog;
        globalState.devices = prog.foundDevices;
        notify();
      });

      globalState.devices = found;
      if (found.length > 0 && !globalState.selectedDevice) {
        globalState.selectedDevice = found[0];
      }
      globalState.scanProgress.isScanning = false;
      notify();
    },

    selectDevice(device: NetworkDevice) {
      globalState.selectedDevice = device;
      notify();
    },

    /**
     * Consulta SNMP (RF-02)
     */
    async querySnmp(ip?: string, community?: string) {
      const targetIp = ip || globalState.selectedDevice?.ip || '192.168.1.1';
      const comm = community || globalState.config.defaultSnmpCommunity;

      const result = await SnmpClient.queryDevice(targetIp, comm);
      globalState.lastSnmpResult = result;

      if (result.status === 'SUCCESS') {
        await OfflineDatabase.saveSnmpDiagnostic(result);
        globalState.snmpHistory = await OfflineDatabase.getSnmpDiagnostics();

        // Encolar en Outbox para sincronización con el NOC (RF-07)
        await OutboxQueue.enqueue('DIAGNOSTIC_RESULT', {
          protocol: 'SNMP',
          deviceIp: targetIp,
          summary: `${result.sysName} • ${result.sysUpTimeFormatted}`,
          timestamp: result.timestamp,
          metrics: {
            sysDescr: result.sysDescr,
            interfacesCount: result.interfaces.length,
          },
        });
      }

      notify();
      return result;
    },

    /**
     * Ejecución de diagnósticos SSH (RF-03)
     */
    async executeSsh(command: string, customUser?: string, customPass?: string) {
      const dev = globalState.selectedDevice;
      const targetIp = dev?.ip || '192.168.1.1';
      const vendor = dev?.vendor || 'Huawei';

      const result = await SshClient.executeCommand(targetIp, vendor, command, customUser, customPass);
      globalState.lastSshResult = result;

      await OfflineDatabase.saveSshDiagnostic(result);
      globalState.sshHistory = await OfflineDatabase.getSshDiagnostics();

      // Encolar en Outbox para sincronización con el NOC (RF-07)
      await OutboxQueue.enqueue('DIAGNOSTIC_RESULT', {
        protocol: 'SSH',
        deviceIp: targetIp,
        summary: `Comando: ${command}`,
        timestamp: result.timestamp,
        metrics: {
          vendor,
          outputLength: result.output.length,
        },
      });

      notify();
      return result;
    },

    /**
     * Registro de instalación de campo (RF-05) y encolado outbox (RF-07)
     */
    async registerInstallation(data: Omit<TechnicalInstallation, 'id' | 'createdAt' | 'syncStatus'>) {
      const newInst: TechnicalInstallation = {
        ...data,
        id: `inst-${Date.now()}`,
        createdAt: new Date().toISOString(),
        syncStatus: 'PENDING',
      };

      // 1. Guardar localmente
      await OfflineDatabase.saveInstallation(newInst);
      globalState.installations = await OfflineDatabase.getInstallations();

      // 2. Encolar en Outbox (RF-07)
      await OutboxQueue.enqueue('INSTALLATION_REPORT', newInst);

      // 3. Si hay conexión real (no simulada offline), intentar sincronizar de inmediato
      if (globalState.isOnline && !globalState.simulatedOffline) {
        const resolvedUrl = resolveNetworkUrl(globalState.config.backendSyncUrl);
        OutboxQueue.processQueue(resolvedUrl);
      }

      notify();
      return newInst;
    },

    /**
     * Generación de Reporte PDF (RF-06)
     */
    async generatePdf(installationId: string): Promise<string> {
      const inst = globalState.installations.find((i) => i.id === installationId);
      if (!inst) throw new Error('Instalación no encontrada');

      const pdfUri = await PdfReportGenerator.generateAndSavePdf(inst);
      inst.pdfUri = pdfUri;
      await OfflineDatabase.saveInstallation(inst);
      globalState.installations = await OfflineDatabase.getInstallations();
      notify();
      return pdfUri;
    },

    /**
     * Procesar la cola Outbox manualmente o al recuperar conexión (RF-07)
     */
    async flushOutbox() {
      if (globalState.isSyncingOutbox) return;
      globalState.isSyncingOutbox = true;
      notify();

      try {
        const resolvedUrl = resolveNetworkUrl(globalState.config.backendSyncUrl);
        await OutboxQueue.processQueue(resolvedUrl);

        // Actualizar estados de sincronización de instalaciones locales
        const syncedItems = OutboxQueue.getItems().filter((i) => i.status === 'SYNCED');
        const insts = await OfflineDatabase.getInstallations();

        insts.forEach((inst) => {
          if (syncedItems.some((si) => si.payload?.id === inst.id)) {
            inst.syncStatus = 'SYNCED';
            inst.syncedAt = new Date().toISOString();
          }
        });

        globalState.installations = insts;
        globalState.outboxItems = OutboxQueue.getItems();
        globalState.outboxStats = OutboxQueue.getStats();
      } finally {
        globalState.isSyncingOutbox = false;
        notify();
      }
    },

    toggleSimulatedOffline() {
      globalState.simulatedOffline = !globalState.simulatedOffline;
      globalState.isOnline = !globalState.simulatedOffline;
      notify();

      // Si volvió a estar online, disparar sincronización automática outbox
      if (globalState.isOnline) {
        const resolvedUrl = resolveNetworkUrl(globalState.config.backendSyncUrl);
        OutboxQueue.processQueue(resolvedUrl);
      }
    },

    updateConfig(newConfig: Partial<AppConfig>) {
      globalState.config = { ...globalState.config, ...newConfig };
      notify();
    },
  };
}
