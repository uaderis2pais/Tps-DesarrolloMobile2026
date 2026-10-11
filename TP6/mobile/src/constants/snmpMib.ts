export interface OidDefinition {
  oid: string;
  name: string;
  description: string;
  syntax: 'OCTET_STRING' | 'INTEGER' | 'TIMETICKS' | 'OBJECT_IDENTIFIER' | 'COUNTER32';
}

export const MIB2_SYSTEM_OIDS: Record<string, OidDefinition> = {
  '1.3.6.1.2.1.1.1.0': {
    oid: '1.3.6.1.2.1.1.1.0',
    name: 'sysDescr',
    description: 'Descripción textual de la entidad (Hardware, SO, versión)',
    syntax: 'OCTET_STRING',
  },
  '1.3.6.1.2.1.1.2.0': {
    oid: '1.3.6.1.2.1.1.2.0',
    name: 'sysObjectID',
    description: 'Identificación autoritativa del subsistema de red del fabricante',
    syntax: 'OBJECT_IDENTIFIER',
  },
  '1.3.6.1.2.1.1.3.0': {
    oid: '1.3.6.1.2.1.1.3.0',
    name: 'sysUpTime',
    description: 'Tiempo transcurrido desde la última reinicialización (centésimas de seg)',
    syntax: 'TIMETICKS',
  },
  '1.3.6.1.2.1.1.4.0': {
    oid: '1.3.6.1.2.1.1.4.0',
    name: 'sysContact',
    description: 'Persona de contacto o área técnica responsable del nodo',
    syntax: 'OCTET_STRING',
  },
  '1.3.6.1.2.1.1.5.0': {
    oid: '1.3.6.1.2.1.1.5.0',
    name: 'sysName',
    description: 'Nombre de dominio completamente calificado o FQDN del dispositivo',
    syntax: 'OCTET_STRING',
  },
  '1.3.6.1.2.1.1.6.0': {
    oid: '1.3.6.1.2.1.1.6.0',
    name: 'sysLocation',
    description: 'Ubicación física del nodo (ej: Rack 4, Sitio Central, Azotea)',
    syntax: 'OCTET_STRING',
  },
};

export const MIB2_INTERFACE_BASE_OIDS = {
  ifNumber: '1.3.6.1.2.1.2.1.0',
  ifDescr: '1.3.6.1.2.1.2.2.1.2',
  ifType: '1.3.6.1.2.1.2.2.1.3',
  ifSpeed: '1.3.6.1.2.1.2.2.1.5',
  ifAdminStatus: '1.3.6.1.2.1.2.2.1.7',
  ifOperStatus: '1.3.6.1.2.1.2.2.1.8',
  ifInOctets: '1.3.6.1.2.1.2.2.1.10',
  ifInErrors: '1.3.6.1.2.1.2.2.1.14',
  ifOutOctets: '1.3.6.1.2.1.2.2.1.16',
  ifOutErrors: '1.3.6.1.2.1.2.2.1.20',
};

/**
 * Convierte un valor TimeTicks (centésimas de segundo) a formato legible
 * Ejemplo: 1234567 -> "3d 4h 17m 35s"
 */
export function formatTimeTicks(ticks: number): string {
  const totalSeconds = Math.floor(ticks / 100);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  return `${minutes}m ${seconds}s`;
}
