import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' })); // Support base64 photos and PDF payloads

interface SyncActionPayload {
  id: string;
  type: 'INSTALLATION_REPORT' | 'DIAGNOSTIC_RESULT' | 'DEVICE_UPDATE' | 'SSH_AUDIT';
  timestamp: string;
  data: any;
  retryCount: number;
}

interface SyncedInstallation {
  id: string;
  clientName: string;
  subscriberNumber: string;
  deviceModel: string;
  serialNumber: string;
  macAddress: string;
  opticalAttenuationDbm: number;
  oltPort: string;
  latitude: number;
  longitude: number;
  address: string;
  technicianNotes: string;
  photoUrl?: string;
  hasPdfReport: boolean;
  syncedAt: string;
}

interface SyncedDiagnostic {
  id: string;
  deviceId: string;
  deviceIp: string;
  protocol: 'SNMP' | 'SSH';
  timestamp: string;
  summary: string;
  metrics: Record<string, any>;
  syncedAt: string;
}

// In-memory repositories for demonstration
const installationsStore: SyncedInstallation[] = [];
const diagnosticsStore: SyncedDiagnostic[] = [];
const syncedActionsLog: Array<{ actionId: string; processedAt: string; status: string }> = [];

// 1. Health check
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'Network Diagnostics Suite Synchronization Backend (TP6)',
    version: '1.0.0',
    timestamp: Date.now(),
    uptimeSeconds: Math.floor(process.uptime()),
    storedInstallations: installationsStore.length,
    storedDiagnostics: diagnosticsStore.length,
  });
});

// 2. Outbox Batch Sync Endpoint (RF-07)
app.post('/api/sync', (req: Request, res: Response) => {
  const { actions } = req.body as { actions: SyncActionPayload[] };

  if (!Array.isArray(actions)) {
    return res.status(400).json({ error: 'Payload must contain an "actions" array' });
  }

  const results: Array<{ id: string; status: 'SUCCESS' | 'CONFLICT' | 'ERROR'; message?: string }> = [];

  for (const action of actions) {
    try {
      if (action.type === 'INSTALLATION_REPORT') {
        const inst = action.data as SyncedInstallation;
        const existingIndex = installationsStore.findIndex((i) => i.id === inst.id);
        const recordWithSync = { ...inst, syncedAt: new Date().toISOString() };

        if (existingIndex >= 0) {
          installationsStore[existingIndex] = recordWithSync;
        } else {
          installationsStore.unshift(recordWithSync);
        }
        results.push({ id: action.id, status: 'SUCCESS', message: 'Instalación sincronizada correctamente' });
      } else if (action.type === 'DIAGNOSTIC_RESULT') {
        const diag = action.data as SyncedDiagnostic;
        diagnosticsStore.unshift({ ...diag, syncedAt: new Date().toISOString() });
        results.push({ id: action.id, status: 'SUCCESS', message: 'Diagnóstico registrado en servidor' });
      } else {
        results.push({ id: action.id, status: 'SUCCESS', message: 'Acción procesada' });
      }

      syncedActionsLog.push({
        actionId: action.id,
        processedAt: new Date().toISOString(),
        status: 'PROCESSED',
      });
    } catch (err: any) {
      results.push({ id: action.id, status: 'ERROR', message: err?.message || 'Error al procesar acción' });
    }
  }

  return res.status(200).json({
    success: true,
    processedCount: actions.length,
    results,
    syncedAt: new Date().toISOString(),
  });
});

// 3. List Synced Installations (RF-05, RF-08)
app.get('/api/installations', (_req: Request, res: Response) => {
  res.status(200).json({
    total: installationsStore.length,
    installations: installationsStore,
  });
});

// 4. Create Single Installation
app.post('/api/installations', (req: Request, res: Response) => {
  const item = req.body;
  const record: SyncedInstallation = {
    ...item,
    id: item.id || `inst-${Date.now()}`,
    syncedAt: new Date().toISOString(),
  };
  installationsStore.unshift(record);
  res.status(201).json({ success: true, installation: record });
});

// 5. List Synced Diagnostics
app.get('/api/diagnostics', (req: Request, res: Response) => {
  const { deviceIp } = req.query;
  const filtered = deviceIp
    ? diagnosticsStore.filter((d) => d.deviceIp === deviceIp)
    : diagnosticsStore;

  res.status(200).json({
    total: filtered.length,
    diagnostics: filtered,
  });
});

// 6. Devices catalog / Fichas técnicas de equipos
app.get('/api/devices/catalog', (_req: Request, res: Response) => {
  res.status(200).json({
    catalog: [
      {
        model: 'Huawei EchoLife HG8245W5',
        type: 'ONT GPON WiFi 6',
        vendor: 'Huawei',
        ports: '4x GE, 2x POTS, 1x USB, 2.4/5GHz Wi-Fi',
        opticalRange: '-8 dBm a -27 dBm (Clase B+)',
        defaultSnmpCommunity: 'public',
        defaultSshPort: 22,
        powerSupply: '12V DC, 2A',
      },
      {
        model: 'MikroTik Cloud Router Switch CRS328-24P-4S+RM',
        type: 'Switch PoE Gestionable',
        vendor: 'MikroTik',
        ports: '24x Gigabit PoE+, 4x SFP+ 10Gbps',
        opticalRange: 'Dependiente de transceptor SFP+',
        defaultSnmpCommunity: 'public',
        defaultSshPort: 22,
        powerSupply: '100-240V AC redundante',
      },
      {
        model: 'Cisco Catalyst 2960X-48TD-L',
        type: 'Switch de Distribución',
        vendor: 'Cisco Systems',
        ports: '48x Gigabit Ethernet, 2x 10G SFP+',
        opticalRange: 'Dependiente de transceptor SFP+',
        defaultSnmpCommunity: 'public',
        defaultSshPort: 22,
        powerSupply: '100-240V AC',
      },
      {
        model: 'ZTE ZXHN F670L',
        type: 'ONT GPON AC1200',
        vendor: 'ZTE Corporation',
        ports: '4x GE, 1x FXS, Wi-Fi Dual Band',
        opticalRange: '-8 dBm a -28 dBm (Clase B+)',
        defaultSnmpCommunity: 'public',
        defaultSshPort: 22,
        powerSupply: '12V DC, 1.5A',
      },
    ],
  });
});

// 7. Servidor listen
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`[Network Diagnostics Suite Backend] Escuchando en http://0.0.0.0:${PORT}`);
  console.log(`   - GET  /health`);
  console.log(`   - POST /api/sync (Cola Outbox)`);
  console.log(`   - GET  /api/installations`);
  console.log(`   - GET  /api/diagnostics`);
  console.log(`   - GET  /api/devices/catalog`);
});
