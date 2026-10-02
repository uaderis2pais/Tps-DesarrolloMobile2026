import * as Location from 'expo-location';
import { GeoLocation } from '../types';

export class GeoLocationService {
  private static cachedLocation: GeoLocation = {
    latitude: -32.4845,
    longitude: -58.2328, // Concepción del Uruguay, Entre Ríos
    altitude: 24,
    accuracy: 5,
    addressSummary: 'Concepción del Uruguay, Entre Ríos',
  };

  /**
   * Obtiene la posición GPS con alta precisión (RF-04)
   */
  static async getCurrentLocation(): Promise<GeoLocation> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('[GeoLocationService] Permiso de ubicación denegado, utilizando coordenadas de referencia');
        return this.cachedLocation;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      let addressSummary = 'Ubicación GPS';
      try {
        const reverse = await Location.reverseGeocodeAsync({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        if (reverse && reverse.length > 0) {
          const item = reverse[0];
          addressSummary = [item.street, item.city || item.subregion, item.region]
            .filter(Boolean)
            .join(', ');
        }
      } catch (_) {}

      const location: GeoLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        altitude: position.coords.altitude,
        accuracy: position.coords.accuracy,
        addressSummary,
      };

      this.cachedLocation = location;
      return location;
    } catch (err) {
      console.warn('[GeoLocationService] Error obteniendo GPS, usando fallback:', err);
      // Agregar leve jitter para permitir dispersión de puntos en demostración
      const deltaLat = (Math.random() - 0.5) * 0.005;
      const deltaLng = (Math.random() - 0.5) * 0.005;

      return {
        ...this.cachedLocation,
        latitude: this.cachedLocation.latitude + deltaLat,
        longitude: this.cachedLocation.longitude + deltaLng,
      };
    }
  }

  static getCachedLocation(): GeoLocation {
    return this.cachedLocation;
  }
}
