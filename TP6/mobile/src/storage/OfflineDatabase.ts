import AsyncStorage from '@react-native-async-storage/async-storage';
import { NetworkDevice, SshDiagnosticResult, SnmpDiagnosticResult, TechnicalInstallation } from '../types';

const DB_KEYS = {
  DEVICES: '@telecom_db_devices_v1',
  INSTALLATIONS: '@telecom_db_installations_v1',
  SNMP_DIAGNOSTICS: '@telecom_db_snmp_diags_v1',
  SSH_DIAGNOSTICS: '@telecom_db_ssh_diags_v1',
};

export class OfflineDatabase {
  private static isInitialized = false;

  static async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Verificar si hay instalaciones previas, sino sembrar datos verosímiles de campo
      const rawInst = await AsyncStorage.getItem(DB_KEYS.INSTALLATIONS);
      if (!rawInst) {
        await AsyncStorage.setItem(DB_KEYS.INSTALLATIONS, JSON.stringify(this.getSeedInstallations()));
      }

      // Verificar diagnósticos SNMP
      const rawSnmp = await AsyncStorage.getItem(DB_KEYS.SNMP_DIAGNOSTICS);
      if (!rawSnmp) {
        await AsyncStorage.setItem(DB_KEYS.SNMP_DIAGNOSTICS, JSON.stringify(this.getSeedSnmpDiagnostics()));
      }

      // Verificar diagnósticos SSH
      const rawSsh = await AsyncStorage.getItem(DB_KEYS.SSH_DIAGNOSTICS);
      if (!rawSsh) {
        await AsyncStorage.setItem(DB_KEYS.SSH_DIAGNOSTICS, JSON.stringify(this.getSeedSshDiagnostics()));
      }

      this.isInitialized = true;
    } catch (e) {
      console.warn('[OfflineDatabase] Error inicializando almacén offline:', e);
    }
  }

  // --- Instalaciones de Campo ---

  static async getInstallations(): Promise<TechnicalInstallation[]> {
    await this.init();
    try {
      const raw = await AsyncStorage.getItem(DB_KEYS.INSTALLATIONS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  static async saveInstallation(item: TechnicalInstallation): Promise<void> {
    const list = await this.getInstallations();
    const updated = [item, ...list.filter((i) => i.id !== item.id)];
    await AsyncStorage.setItem(DB_KEYS.INSTALLATIONS, JSON.stringify(updated));
  }

  // --- Historial SNMP ---

  static async getSnmpDiagnostics(): Promise<SnmpDiagnosticResult[]> {
    await this.init();
    try {
      const raw = await AsyncStorage.getItem(DB_KEYS.SNMP_DIAGNOSTICS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  static async saveSnmpDiagnostic(item: SnmpDiagnosticResult): Promise<void> {
    const list = await this.getSnmpDiagnostics();
    const updated = [item, ...list.slice(0, 49)]; // mantener últimas 50
    await AsyncStorage.setItem(DB_KEYS.SNMP_DIAGNOSTICS, JSON.stringify(updated));
  }

  // --- Historial SSH ---

  static async getSshDiagnostics(): Promise<SshDiagnosticResult[]> {
    await this.init();
    try {
      const raw = await AsyncStorage.getItem(DB_KEYS.SSH_DIAGNOSTICS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  static async saveSshDiagnostic(item: SshDiagnosticResult): Promise<void> {
    const list = await this.getSshDiagnostics();
    const updated = [item, ...list.slice(0, 49)];
    await AsyncStorage.setItem(DB_KEYS.SSH_DIAGNOSTICS, JSON.stringify(updated));
  }

  // --- Datos semilla para demostración técnica universitaria ---

  private static getSeedInstallations(): TechnicalInstallation[] {
    return [
      {
        id: 'inst-uruguay-101',
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        clientName: 'Martina Benítez',
        subscriberNumber: 'ABN-84920',
        installationAddress: 'Calle Artigas 233, Concepción del Uruguay',
        latitude: -32.48761,
        longitude: -58.22996,
        altitude: 18.5,
        gpsAccuracy: 3.2,
        deviceId: 'dev-48D8153A821F',
        deviceModel: 'Huawei EchoLife HG8245W5 GPON',
        serialNumber: 'HWTC48D8153A821F',
        macAddress: '48:D8:15:3A:82:1F',
        opticalAttenuationDbm: -18.42,
        oltPort: 'OLT-CENTRAL-01 PON 1/2/4',
        technicianNotes: 'Fibra fusionada en pigtail SC/APC verde. Niveles ópticos excelentes dentro de la norma ITU-T G.984. Wi-Fi 6 activo con SSID dual 2.4/5GHz.',
        syncStatus: 'SYNCED',
        syncedAt: new Date(Date.now() - 3600000 * 3.5).toISOString(),
      },
      {
        id: 'inst-uruguay-102',
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        clientName: 'Facundo Gómez',
        subscriberNumber: 'ABN-84918',
        installationAddress: '9 de Julio 480, Concepción del Uruguay',
        latitude: -32.48462,
        longitude: -58.23213,
        altitude: 20.1,
        gpsAccuracy: 4.1,
        deviceId: 'dev-E43883829A14',
        deviceModel: 'ZTE ZXHN F670L GPON',
        serialNumber: 'ZTEG83829A1477',
        macAddress: 'E4:38:83:82:9A:14',
        opticalAttenuationDbm: -21.15,
        oltPort: 'OLT-CENTRAL-01 PON 1/3/8',
        technicianNotes: 'Reemplazo de módem VDSL por ONT GPON. Par trenzado Cat6 verificado a 1 Gbps en puerto LAN 1.',
        syncStatus: 'PENDING',
      },
    ];
  }

  private static getSeedSnmpDiagnostics(): SnmpDiagnosticResult[] {
    return [
      {
        deviceIp: '192.168.1.1',
        community: 'public',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        sysDescr: 'Huawei EchoLife HG8245W5 GPON Terminal; V5R019C20S105',
        sysObjectID: '1.3.6.1.4.1.2011.2.245',
        sysUpTime: 10842018,
        sysUpTimeFormatted: '1d 6h 7m 2s',
        sysContact: 'soporte-tecnico@telecom.com.ar',
        sysName: 'ONT-HG8245W5-URUGUAY.local',
        sysLocation: 'Calle Artigas 233, C. del Uruguay',
        status: 'SUCCESS',
        latencyMs: 38,
        interfaces: [
          {
            index: 1,
            name: 'gpon0 (WAN Óptica)',
            type: 'opticalChannel(195)',
            speedBps: 2488320000,
            adminStatus: 'UP',
            operStatus: 'UP',
            inOctets: 4892019482,
            outOctets: 1294820194,
            inErrors: 0,
            outErrors: 0,
            inMbps: 84.5,
            outMbps: 22.1,
          },
          {
            index: 2,
            name: 'eth0 (GE Port 1)',
            type: 'ethernetCsmacd(6)',
            speedBps: 1000000000,
            adminStatus: 'UP',
            operStatus: 'UP',
            inOctets: 2849201940,
            outOctets: 849201940,
            inErrors: 0,
            outErrors: 0,
            inMbps: 62.4,
            outMbps: 18.2,
          },
        ],
      },
    ];
  }

  private static getSeedSshDiagnostics(): SshDiagnosticResult[] {
    return [
      {
        id: 'ssh-seed-1',
        deviceIp: '192.168.1.1',
        vendor: 'Huawei',
        command: 'display optical-info',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        output: `WAP(D-CLI)> display optical-info
  Transceiver Type         : GPON B+
  Optical Output Power     : 2.35 dBm      (Range: 1.50 ~ 5.00 dBm)
  Optical Input Power      : -18.42 dBm    (Range: -8.00 ~ -27.00 dBm) [OPTIMAL]
  Operating Temperature    : 42.18 °C      (Range: -10.00 ~ 85.00 °C)
  Supply Voltage           : 3.28 V
  Laser Bias Current       : 14.82 mA
  OLT Registration Status  : O5 (Operation State - Connected)`,
        durationMs: 182,
        status: 'SUCCESS',
      },
    ];
  }
}
