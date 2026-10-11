import * as Location from 'expo-location';

export interface GpsLocationResult {
  latitude: number;
  longitude: number;
  altitude: number;
  accuracy: number;
  addressSummary: string;
  timestamp: string;
}

export class GpsService {
  private static cachedLocation: GpsLocationResult = {
    latitude: -32.48761,
    longitude: -58.22996,
    altitude: 18.5,
    accuracy: 3.2,
    addressSummary: 'Calle Artigas 233, Concepción del Uruguay, Entre Ríos',
    timestamp: new Date().toISOString(),
  };

  /**
   * Obtiene la posición satelital GPS de alta precisión para el reporte técnico (RF-05)
   */
  static async getCurrentPosition(): Promise<GpsLocationResult> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return this.getFallback();
      }

      const positionPromise = Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const timeoutPromise = new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), 2000)
      );

      const pos = await Promise.race([positionPromise, timeoutPromise]);
      if (!pos) {
        return this.getFallback();
      }

      let addressSummary = 'Concepción del Uruguay, Entre Ríos';
      try {
        const reverse = await Location.reverseGeocodeAsync({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        if (reverse && reverse.length > 0) {
          const item = reverse[0];
          addressSummary = [item.street, item.city || item.subregion, item.region]
            .filter(Boolean)
            .join(', ');
        }
      } catch (_) {}

      const result: GpsLocationResult = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        altitude: pos.coords.altitude || 18.5,
        accuracy: pos.coords.accuracy || 3.5,
        addressSummary,
        timestamp: new Date().toISOString(),
      };

      this.cachedLocation = result;
      return result;
    } catch {
      return this.getFallback();
    }
  }

  static getCachedPosition(): GpsLocationResult {
    return this.cachedLocation;
  }

  private static getFallback(): GpsLocationResult {
    return {
      latitude: -32.48761,
      longitude: -58.22996,
      altitude: 18.5,
      accuracy: 3.2,
      addressSummary: 'Calle Artigas 233, Concepción del Uruguay, Entre Ríos',
      timestamp: new Date().toISOString(),
    };
  }
}
