import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Resuelve dinámicamente URLs de hosts locales en dispositivos Android/iOS y emuladores.
 * En un teléfono o emulador Android, 'localhost' o '127.0.0.1' apunta al propio teléfono y falla.
 * Esta función lo reemplaza automáticamente por la IP de la máquina de desarrollo obtenida desde Metro (hostUri) o 10.0.2.2.
 */
export function resolveNetworkUrl(url: string): string {
  if (!url) return url;

  // En navegador web, localhost es directamente la PC
  if (Platform.OS === 'web') {
    return url;
  }

  // Si no apunta a loopback local (ej: https://speed.cloudflare.com), retornar tal cual
  if (!url.includes('localhost') && !url.includes('127.0.0.1')) {
    return url;
  }

  // 1. Obtener la IP real de la PC de desarrollo asignada por Metro / Expo bundler
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest?.debuggerHost ||
    (Constants as any).manifest2?.extra?.expoClient?.hostUri;

  if (hostUri) {
    const hostIp = hostUri.split(':')[0];
    if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
      return url.replace('localhost', hostIp).replace('127.0.0.1', hostIp);
    }
  }

  // 2. Si estamos en emulador de Android estándar
  if (Platform.OS === 'android') {
    return url.replace('localhost', '10.0.2.2').replace('127.0.0.1', '10.0.2.2');
  }

  return url;
}

/**
 * Obtiene la IP local de la computadora para sugerir en inputs de configuración
 */
export function getDevHostIp(): string {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest?.debuggerHost ||
    (Constants as any).manifest2?.extra?.expoClient?.hostUri;

  if (hostUri) {
    const hostIp = hostUri.split(':')[0];
    if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
      return hostIp;
    }
  }

  return Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
}
