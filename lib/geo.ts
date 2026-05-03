import { getDistance } from 'geolib'

/** Returns distance in kilometres between two GPS coordinates. */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const metres = getDistance(
    { latitude: lat1, longitude: lon1 },
    { latitude: lat2, longitude: lon2 }
  )
  return metres / 1000
}

/** Returns properties within maxKm, sorted by ascending distance. */
export function findNearbyProperties<
  T extends { latitude: number; longitude: number }
>(
  lat: number,
  lng: number,
  maxKm: number,
  properties: T[]
): (T & { distanceKm: number })[] {
  return properties
    .map((p) => ({
      ...p,
      distanceKm:
        Math.round(calculateDistance(lat, lng, p.latitude, p.longitude) * 100) /
        100,
    }))
    .filter((p) => p.distanceKm <= maxKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
}
