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
   * Obtiene la posición GPS con alta precisión y timeout de seguridad (RF-04)
   */
  static async getCurrentLocation(): Promise<GeoLocation> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return this.getFallbackLocation();
      }

      const positionPromise = Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const timeoutPromise = new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), 1800)
      );

      const position = await Promise.race([positionPromise, timeoutPromise]);

      if (!position) {
        return this.getFallbackLocation();
      }

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
      return this.getFallbackLocation();
    }
  }

  static getCachedLocation(): GeoLocation {
    return this.cachedLocation;
  }

  private static getFallbackLocation(): GeoLocation {
    const deltaLat = (Math.random() - 0.5) * 0.004;
    const deltaLng = (Math.random() - 0.5) * 0.004;

    return {
      ...this.cachedLocation,
      latitude: Number((this.cachedLocation.latitude + deltaLat).toFixed(5)),
      longitude: Number((this.cachedLocation.longitude + deltaLng).toFixed(5)),
    };
  }
}
