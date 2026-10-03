import { AppConfig, HostProbeTarget, QoSThresholds } from '../types';

export const DEFAULT_HOSTS: HostProbeTarget[] = [
  {
    id: 'cloudflare',
    name: 'Cloudflare 1.1.1.1 Edge',
    host: 'https://cloudflare.com/cdn-cgi/trace',
    probeType: 'http',
  },
  {
    id: 'google',
    name: 'Google DNS 8.8.8.8',
    host: 'https://dns.google/resolve?name=google.com',
    probeType: 'http',
  },
  {
    id: 'cloudflare-secondary',
    name: 'Cloudflare 1.0.0.1 DNS',
    host: 'https://1.0.0.1/cdn-cgi/trace',
    probeType: 'http',
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
  backendUrl: 'https://speed.cloudflare.com',
  hosts: DEFAULT_HOSTS,
  thresholds: DEFAULT_THRESHOLDS,
  backgroundIntervalMinutes: 15,
  backgroundSamplingEnabled: false,
  notificationsEnabled: true,
  payloadSizeMb: 2,
};
