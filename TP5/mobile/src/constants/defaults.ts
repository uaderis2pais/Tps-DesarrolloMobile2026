import { AppConfig, HostProbeTarget, QoSThresholds } from '../types';

export const DEFAULT_HOSTS: HostProbeTarget[] = [
  {
    id: 'cloudflare',
    name: 'Cloudflare 1.1.1.1',
    host: '1.1.1.1',
    port: 80,
    probeType: 'tcp',
  },
  {
    id: 'google',
    name: 'Google DNS 8.8.8.8',
    host: '8.8.8.8',
    port: 53,
    probeType: 'tcp',
  },
  {
    id: 'opendns',
    name: 'Cisco OpenDNS',
    host: '208.67.222.222',
    port: 53,
    probeType: 'tcp',
  },
  {
    id: 'reference-backend',
    name: 'Backend Local QoS',
    host: 'http://localhost:3001/api/ping',
    probeType: 'http',
  },
];

export const DEFAULT_THRESHOLDS: QoSThresholds = {
  maxLatencyWarningMs: 100,
  maxLatencyCriticalMs: 200,
  maxJitterWarningMs: 30,
  maxPacketLossWarningPct: 5,
  minThroughputWarningMbps: 5,
  minRssiCriticalDbm: -110,
};

export const DEFAULT_CONFIG: AppConfig = {
  backendUrl: 'http://localhost:3001',
  hosts: DEFAULT_HOSTS,
  thresholds: DEFAULT_THRESHOLDS,
  backgroundIntervalMinutes: 15,
  backgroundSamplingEnabled: false,
  notificationsEnabled: true,
  payloadSizeMb: 2,
};
