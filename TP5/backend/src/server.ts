import express, { Request, Response } from 'express';
import cors from 'cors';
import crypto from 'crypto';

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors({ origin: '*' }));
// Note: Do not parse body on /api/upload as json to allow raw streaming payload
app.use(express.json({ limit: '20mb' }));

// In-memory telemetry storage for QoS reports
interface TelemetryRecord {
  id: string;
  timestamp: string;
  connectionType: string;
  carrier: string;
  rssiDbm?: number;
  latitude: number;
  longitude: number;
  pingAvgMs: number;
  jitterMs: number;
  packetLossPct: number;
  downloadMbps: number;
  uploadMbps: number;
  qosScore: string;
}

const telemetryStore: TelemetryRecord[] = [];

// Pre-generated 1MB chunk to serve download requests fast without CPU spikes
const CHUNK_SIZE = 1024 * 1024; // 1 MB
const prebuiltChunk = crypto.randomBytes(CHUNK_SIZE);

// 1. Health check
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'Network QoS Monitor Reference Backend',
    timestamp: Date.now(),
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

// 2. High precision ping probe
app.get('/api/ping', (_req: Request, res: Response) => {
  const hrTime = process.hrtime();
  const timestampNs = hrTime[0] * 1e9 + hrTime[1];
  
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.status(200).json({
    status: 'pong',
    timestamp: Date.now(),
    timestampNs,
    server: 'QoS-Reference-Node'
  });
});

// 3. Fixed-size Download endpoint for Throughput calculation (RF-03)
app.get('/api/download', (req: Request, res: Response) => {
  const sizeMbParam = parseFloat(req.query.sizeMb as string);
  const sizeMb = (!isNaN(sizeMbParam) && sizeMbParam > 0 && sizeMbParam <= 50) ? sizeMbParam : 2;
  const totalBytes = Math.round(sizeMb * 1024 * 1024);

  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Length', totalBytes.toString());
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, X-Payload-Bytes');
  res.setHeader('X-Payload-Bytes', totalBytes.toString());

  let bytesWritten = 0;

  const writeStream = () => {
    let ok = true;
    while (bytesWritten < totalBytes && ok) {
      const remaining = totalBytes - bytesWritten;
      const chunkSize = Math.min(CHUNK_SIZE, remaining);
      const slice = chunkSize === CHUNK_SIZE ? prebuiltChunk : prebuiltChunk.subarray(0, chunkSize);
      
      bytesWritten += chunkSize;
      ok = res.write(slice);
    }

    if (bytesWritten >= totalBytes) {
      res.end();
    } else {
      res.once('drain', writeStream);
    }
  };

  writeStream();
});

// 4. Raw Upload endpoint for Throughput calculation (RF-03)
app.post('/api/upload', (req: Request, res: Response) => {
  const startTime = process.hrtime();
  let bytesReceived = 0;

  req.on('data', (chunk: Buffer) => {
    bytesReceived += chunk.length;
  });

  req.on('end', () => {
    const elapsed = process.hrtime(startTime);
    const durationSeconds = elapsed[0] + elapsed[1] / 1e9;
    const durationMs = Math.round(durationSeconds * 1000);
    
    // Throughput in Megabits per second
    const bitsReceived = bytesReceived * 8;
    const throughputMbps = durationSeconds > 0 
      ? Number(((bitsReceived / durationSeconds) / 1_000_000).toFixed(2))
      : 0;

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.status(200).json({
      status: 'ok',
      bytesReceived,
      durationMs,
      serverMeasuredMbps: throughputMbps,
      receivedAt: new Date().toISOString()
    });
  });

  req.on('error', (err) => {
    console.error('Error receiving upload stream:', err);
    res.status(500).json({ error: 'Upload stream failed' });
  });
});

// 5. Configurable Host targets and probe directory (RF-02)
app.get('/api/servers', (_req: Request, res: Response) => {
  res.status(200).json({
    recommendedHosts: [
      { id: 'cloudflare-dns', name: 'Cloudflare DNS', host: '1.1.1.1', port: 80, probeType: 'tcp' },
      { id: 'google-dns', name: 'Google Primary DNS', host: '8.8.8.8', port: 53, probeType: 'tcp' },
      { id: 'opendns', name: 'OpenDNS Cisco', host: '208.67.222.222', port: 53, probeType: 'tcp' },
      { id: 'local-backend', name: 'Servidor QoS Local', host: `http://localhost:${PORT}/api/ping`, probeType: 'http' },
    ],
    defaultPayloadSizesMb: [1, 2, 5, 10],
  });
});

// 6. Ingest Telemetry Measurements
app.post('/api/telemetry', (req: Request, res: Response) => {
  const data = req.body as Partial<TelemetryRecord>;

  if (!data || !data.latitude || !data.longitude) {
    res.status(400).json({ error: 'Latitud y longitud requeridas' });
    return;
  }

  const record: TelemetryRecord = {
    id: data.id || crypto.randomUUID(),
    timestamp: data.timestamp || new Date().toISOString(),
    connectionType: data.connectionType || 'Unknown',
    carrier: data.carrier || 'Unknown',
    rssiDbm: data.rssiDbm,
    latitude: data.latitude,
    longitude: data.longitude,
    pingAvgMs: data.pingAvgMs ?? 0,
    jitterMs: data.jitterMs ?? 0,
    packetLossPct: data.packetLossPct ?? 0,
    downloadMbps: data.downloadMbps ?? 0,
    uploadMbps: data.uploadMbps ?? 0,
    qosScore: data.qosScore || 'Fair',
  };

  telemetryStore.push(record);

  res.status(201).json({
    status: 'stored',
    id: record.id,
    totalRecords: telemetryStore.length,
  });
});

// 7. Get Telemetry measurements and aggregations
app.get('/api/telemetry', (_req: Request, res: Response) => {
  const total = telemetryStore.length;
  const avgDownload = total > 0 
    ? (telemetryStore.reduce((acc, r) => acc + r.downloadMbps, 0) / total).toFixed(2)
    : '0';
  const avgPing = total > 0
    ? (telemetryStore.reduce((acc, r) => acc + r.pingAvgMs, 0) / total).toFixed(2)
    : '0';

  res.status(200).json({
    summary: {
      totalMeasurements: total,
      averageDownloadMbps: Number(avgDownload),
      averagePingMs: Number(avgPing),
    },
    records: telemetryStore.slice(-100), // last 100 records
  });
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`[QoS Backend] Servidor escuchando en http://0.0.0.0:${PORT} (accesible en red local)`);
  console.log(`[QoS Backend] Endpoints listos:`);
  console.log(`   - GET  /health`);
  console.log(`   - GET  /api/ping`);
  console.log(`   - GET  /api/download?sizeMb=2`);
  console.log(`   - POST /api/upload`);
  console.log(`   - GET  /api/servers`);
  console.log(`   - GET/POST /api/telemetry`);
});
