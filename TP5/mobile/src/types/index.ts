export type ConnectionType = 'WIFI' | '5G' | '4G' | '3G' | '2G' | 'NONE' | 'UNKNOWN';

export type QoSRating = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';

export interface SignalInfo {
  operator: string;
  networkType: ConnectionType;
  rawTypeDescription: string;
  dbm: number;
  level: number; // 0 to 4 bars
  asu: number;
  isRoaming: boolean;
  simState: string;
  timestamp: number;
}

export interface HostProbeTarget {
  id: string;
  name: string;
  host: string;
  port?: number;
  probeType: 'tcp' | 'http';
}

export interface PingResult {
  hostId: string;
  hostName: string;
  hostAddress: string;
  minRttMs: number;
  avgRttMs: number;
  maxRttMs: number;
  jitterMs: number; // RFC 3550 standard jitter calculation
  packetLossPct: number;
  samples: number[];
  status: 'idle' | 'running' | 'success' | 'warning' | 'error';
  errorMessage?: string;
}

export interface ThroughputResult {
  downloadMbps: number;
  uploadMbps: number;
  downloadBytes: number;
  uploadBytes: number;
  downloadDurationMs: number;
  uploadDurationMs: number;
  serverMeasuredUploadMbps?: number;
  status: 'idle' | 'testing_download' | 'testing_upload' | 'completed' | 'error';
  errorMessage?: string;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  altitude?: number | null;
  accuracy?: number | null;
  addressSummary?: string;
}

export interface MeasurementSession {
  id: string;
  timestamp: string; // ISO 8601
  location: GeoLocation;
  signal: SignalInfo;
  pings: PingResult[];
  throughput: ThroughputResult;
  overallQoSRating: QoSRating;
  isBackground: boolean;
  degradationAlertDispatched?: boolean;
}

export interface QoSThresholds {
  maxLatencyWarningMs: number;
  maxLatencyCriticalMs: number;
  maxJitterWarningMs: number;
  maxPacketLossWarningPct: number;
  minThroughputWarningMbps: number;
  minRssiCriticalDbm: number;
}

export interface FilterCriteria {
  networkTypes: ConnectionType[];
  dateRange: 'all' | 'today' | '7days' | '30days';
  minQoS?: QoSRating;
  searchQuery?: string;
}

export interface AppConfig {
  backendUrl: string;
  hosts: HostProbeTarget[];
  thresholds: QoSThresholds;
  backgroundIntervalMinutes: number;
  backgroundSamplingEnabled: boolean;
  notificationsEnabled: boolean;
  payloadSizeMb: number;
}
