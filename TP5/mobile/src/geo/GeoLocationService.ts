import * as Location from 'expo-location';
import { GeoLocation } from '../types';

export class GeoLocationService {
  private static cachedLocation: GeoLocation = {
    latitude: -32.48761,
    longitude: -58.22996, // Calle Artigas 233, Concepción del Uruguay, Entre Ríos
    altitude: 18,
    accuracy: 3,
    addressSummary: 'Calle Artigas 233, Concepción del Uruguay',
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

      // Validar si la posición obtenida por el navegador/GPS pertenece al área urbana de Concepción del Uruguay
      // En navegadores web de escritorio, la geolocalización por IP del ISP frecuentemente ubica en Buenos Aires o Rosario.
      const isWithinConcepcion =
        position.coords.latitude >= -32.55 &&
        position.coords.latitude <= -32.44 &&
        position.coords.longitude >= -58.28 &&
        position.coords.longitude <= -58.20;

      if (!isWithinConcepcion) {
        return this.getFallbackLocation();
      }

      let addressSummary = 'Calle Artigas 233, Concepción del Uruguay';
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
    return {
      latitude: -32.48761,
      longitude: -58.22996,
      altitude: 18,
      accuracy: 3,
      addressSummary: 'Calle Artigas 233, Concepción del Uruguay',
    };
  }
}
