import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Resuelve dinámicamente URLs de hosts locales en dispositivos Android/iOS y emuladores.
 * Transforma 'localhost' o '127.0.0.1' a la IP real de la máquina de desarrollo de Metro o 10.0.2.2.
 */
export function resolveNetworkUrl(url: string): string {
  if (!url) return url;

  if (Platform.OS === 'web') {
    return url;
  }

  if (!url.includes('localhost') && !url.includes('127.0.0.1')) {
    return url;
  }

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

  if (Platform.OS === 'android') {
    return url.replace('localhost', '10.0.2.2').replace('127.0.0.1', '10.0.2.2');
  }

  return url;
}
