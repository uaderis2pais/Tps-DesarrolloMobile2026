import AsyncStorage from '@react-native-async-storage/async-storage';

export interface DeviceCredentials {
  deviceIp: string;
  username: string;
  passwordEncrypted: string;
  port: number;
  privateKeyName?: string;
  updatedAt: string;
}

const VAULT_STORAGE_KEY = '@telecom_diagnostics_ssh_vault_v1';
const CIPHER_MASK = 0x5a; // Máscara XOR simple para ofuscar en almacenamiento local

export class CredentialVault {
  /**
   * Guarda de forma segura las credenciales de un equipo (RF-03)
   */
  static async saveCredentials(
    deviceIp: string,
    username: string,
    passwordPlain: string,
    port: number = 22,
    privateKeyName?: string
  ): Promise<void> {
    const list = await this.getAllCredentials();
    const encrypted = this.obfuscate(passwordPlain);

    const updated = list.filter((c) => c.deviceIp !== deviceIp);
    updated.push({
      deviceIp,
      username,
      passwordEncrypted: encrypted,
      port,
      privateKeyName,
      updatedAt: new Date().toISOString(),
    });

    await AsyncStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(updated));
  }

  /**
   * Recupera las credenciales desencriptadas para un equipo objetivo
   */
  static async getCredentials(deviceIp: string): Promise<{ username: string; passwordPlain: string; port: number } | null> {
    const list = await this.getAllCredentials();
    const item = list.find((c) => c.deviceIp === deviceIp);
    if (!item) return null;

    return {
      username: item.username,
      passwordPlain: this.deobfuscate(item.passwordEncrypted),
      port: item.port || 22,
    };
  }

  static async getAllCredentials(): Promise<DeviceCredentials[]> {
    try {
      const raw = await AsyncStorage.getItem(VAULT_STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  private static obfuscate(text: string): string {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(text);
    const masked = bytes.map((b) => b ^ CIPHER_MASK);
    return Array.from(masked).map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  private static deobfuscate(hex: string): string {
    if (!hex) return '';
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16) ^ CIPHER_MASK;
    }
    return new TextDecoder().decode(bytes);
  }
}
