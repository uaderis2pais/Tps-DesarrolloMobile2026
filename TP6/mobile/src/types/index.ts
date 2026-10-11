export type DeviceType = 'ONT' | 'ROUTER' | 'SWITCH' | 'ACCESS_POINT' | 'SERVER' | 'UNKNOWN';

export type DeviceVendor = 'Huawei' | 'MikroTik' | 'Cisco' | 'ZTE' | 'Ubiquiti' | 'TP-Link' | 'Intel' | 'Apple' | 'Linux' | 'Generic';

export interface NetworkDevice {
  id: string;
  ip: string;
  mac: string;
  vendor: DeviceVendor;
  hostname?: string;
  type: DeviceType;
  lastSeen: string;
  isOnline: boolean;
  snmpEnabled: boolean;
  sshEnabled: boolean;
  model?: string;
  serialNumber?: string;
}

export interface SnmpInterfaceStats {
  index: number;
  name: string;
  type: string;
  speedBps: number;
  adminStatus: 'UP' | 'DOWN';
  operStatus: 'UP' | 'DOWN' | 'TESTING';
  inOctets: number;
  outOctets: number;
  inErrors: number;
  outErrors: number;
  inMbps: number;
  outMbps: number;
}

export interface SnmpDiagnosticResult {
  deviceIp: string;
  community: string;
  timestamp: string;
  sysDescr: string;
  sysObjectID: string;
  sysUpTime: number; // en centésimas de segundo (timeticks)
  sysUpTimeFormatted: string;
  sysContact: string;
  sysName: string;
  sysLocation: string;
  interfaces: SnmpInterfaceStats[];
  status: 'SUCCESS' | 'TIMEOUT' | 'ERROR';
  rawBerHex?: string;
  latencyMs: number;
}

export interface SshCommandPreset {
  id: string;
  vendor: DeviceVendor;
  name: string;
  command: string;
  description: string;
}

export interface SshDiagnosticResult {
  id: string;
  deviceIp: string;
  vendor: DeviceVendor;
  command: string;
  timestamp: string;
  output: string;
  durationMs: number;
  status: 'SUCCESS' | 'AUTH_FAILED' | 'CONNECTION_FAILED' | 'ERROR';
  parsedMetrics?: Record<string, any>;
}

export interface TechnicalInstallation {
  id: string;
  createdAt: string;
  clientName: string;
  subscriberNumber: string;
  installationAddress: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  gpsAccuracy?: number;
  deviceId?: string;
  deviceModel: string;
  serialNumber: string;
  macAddress: string;
  opticalAttenuationDbm: number; // ej: -18.4 dBm
  oltPort: string; // ej: OLT-URUGUAY-01 PON 1/2/4
  technicianNotes: string;
  photoUri?: string;
  photoUrl?: string;
  pdfUri?: string;
  syncStatus: 'PENDING' | 'SYNCED' | 'FAILED';
  syncedAt?: string;
}

export type OutboxActionType = 'INSTALLATION_REPORT' | 'DIAGNOSTIC_RESULT' | 'DEVICE_UPDATE';

export interface OutboxItem {
  id: string;
  type: OutboxActionType;
  payload: any;
  createdAt: string;
  retryCount: number;
  maxRetries: number;
  lastAttemptAt?: string;
  status: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';
  errorMessage?: string;
}

export interface AppConfig {
  backendSyncUrl: string;
  autoSyncOnReconnect: boolean;
  defaultSnmpCommunity: string;
  snmpTimeoutMs: number;
  lanScanSubnet: string; // ej: '192.168.1.0/24'
}
