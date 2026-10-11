export interface DeviceTechnicalSheet {
  model: string;
  vendor: string;
  type: string;
  ports: string;
  opticalRange: string;
  firmwareVersion: string;
  defaultAdminUser: string;
  defaultSnmpCommunity: string;
  powerRequirements: string;
  datasheetSummary: string;
}

export const TECHNICAL_SHEETS_DATABASE: Record<string, DeviceTechnicalSheet> = {
  'HG8245W5': {
    model: 'Huawei EchoLife HG8245W5 GPON ONT',
    vendor: 'Huawei Technologies',
    type: 'Terminal Óptica de Abonado (ONT)',
    ports: '4x Gigabit Ethernet (RJ-45), 2x POTS (RJ-11), 1x USB 2.0, Wi-Fi 6 AX3000',
    opticalRange: '-8.0 dBm a -27.0 dBm (Sensibilidad Clase B+)',
    firmwareVersion: 'V5R019C20S105',
    defaultAdminUser: 'telecomadmin',
    defaultSnmpCommunity: 'public',
    powerRequirements: '12V DC, 2A (Fuente incluida)',
    datasheetSummary: 'Terminal GPON residencial y corporativa con soporte VoIP SIP, Wi-Fi 6 concurrente en 2.4GHz y 5GHz, enrutamiento NAT y QoS estricto.',
  },
  'CRS328': {
    model: 'MikroTik CRS328-24P-4S+RM',
    vendor: 'MikroTik SIA',
    type: 'Switch Gestionable PoE+ y Router',
    ports: '24x Gigabit Ethernet 802.3af/at PoE+, 4x 10G SFP+ cages, 1x Puerto Consola RJ45',
    opticalRange: 'Dependiente del módulo SFP+ (hasta 10 km en monomodo)',
    firmwareVersion: 'RouterOS v7.14.3',
    defaultAdminUser: 'admin',
    defaultSnmpCommunity: 'public',
    powerRequirements: '100-240V AC 500W PSU dual redundante',
    datasheetSummary: 'Switch L2/L3 de alta densidad con capacidad de conmutación sin bloqueo de 128 Gbps, soporte Dual Boot (RouterOS o SwOS) y entrega PoE pasivo o activo.',
  },
  '2960X': {
    model: 'Cisco Catalyst WS-C2960X-48TD-L',
    vendor: 'Cisco Systems Inc.',
    type: 'Switch de Acceso Empresarial',
    ports: '48x 10/100/1000 Ethernet, 2x 10G SFP+ Uplinks, Puertos de apilamiento FlexStack-Plus',
    opticalRange: 'Dependiente de transceptor Cisco SFP-10G-LR/SR',
    firmwareVersion: 'Cisco IOS 15.2(7)E8 Universal',
    defaultAdminUser: 'cisco',
    defaultSnmpCommunity: 'public',
    powerRequirements: '100-240V AC, 740W',
    datasheetSummary: 'Switch empresarial apilable con soporte Cisco EnergyWise, NetFlow Lite, QoS avanzado con marcado CoS/DSCP y soporte MIB-II completo.',
  },
  'F670L': {
    model: 'ZTE ZXHN F670L GPON ONT',
    vendor: 'ZTE Corporation',
    type: 'Terminal Óptica GPON AC1200',
    ports: '4x GE, 1x FXS (Telefonía analógica), Wi-Fi Dual Band 802.11ac',
    opticalRange: '-8.0 dBm a -28.0 dBm (Sensibilidad Clase B+)',
    firmwareVersion: 'V9.0.10P1N19',
    defaultAdminUser: 'admin',
    defaultSnmpCommunity: 'public',
    powerRequirements: '12V DC, 1.5A',
    datasheetSummary: 'Gateway óptico de acceso de alta confiabilidad con soporte OMCI para aprovisionamiento remoto desde OLT ZTE/Huawei.',
  },
};

export class QrScannerService {
  /**
   * Procesa el texto de un código QR o código de barras y retorna la ficha técnica asociada
   */
  static parseBarcodeData(rawCode: string): {
    serialNumber: string;
    macAddress: string;
    modelKey: string;
    sheet: DeviceTechnicalSheet;
  } {
    const cleaned = rawCode.trim().toUpperCase();

    // Detección heurística de modelo según prefijo o contenido
    let modelKey = 'HG8245W5';
    if (cleaned.includes('CRS') || cleaned.includes('MIKROTIK') || cleaned.includes('RB5009')) {
      modelKey = 'CRS328';
    } else if (cleaned.includes('2960') || cleaned.includes('CISCO')) {
      modelKey = '2960X';
    } else if (cleaned.includes('F670') || cleaned.includes('ZTE')) {
      modelKey = 'F670L';
    }

    const sheet = TECHNICAL_SHEETS_DATABASE[modelKey] || TECHNICAL_SHEETS_DATABASE['HG8245W5'];

    // Extraer o generar serial y MAC
    const serial = cleaned.length >= 8 && !cleaned.includes(' ')
      ? cleaned
      : `SN-HW${Math.floor(10000000 + Math.random() * 90000000)}`;

    const mac = `48:D8:15:${Math.floor(10 + Math.random() * 89)}:${Math.floor(10 + Math.random() * 89)}:${Math.floor(10 + Math.random() * 89)}`;

    return {
      serialNumber: serial,
      macAddress: mac,
      modelKey,
      sheet,
    };
  }

  /**
   * Lista de códigos de prueba predefinidos para técnicos en demostraciones
   */
  static getPresetBarcodes(): Array<{ label: string; code: string; vendor: string }> {
    return [
      {
        label: 'ONT Huawei HG8245W5 (Fibra Óptica)',
        code: 'HWTC-48D8153A-HG8245W5',
        vendor: 'Huawei',
      },
      {
        label: 'Switch MikroTik CRS328 (Rack Central)',
        code: 'MTIK-B869F4A2-CRS328-24P',
        vendor: 'MikroTik',
      },
      {
        label: 'Switch Cisco Catalyst 2960X (Gabinete)',
        code: 'CSCO-001E13B8-2960X-48TD',
        vendor: 'Cisco',
      },
      {
        label: 'ONT ZTE ZXHN F670L (Residencial)',
        code: 'ZTEG-E4388382-F670L-AC1200',
        vendor: 'ZTE',
      },
    ];
  }
}
