export interface RouteResult {
  distanceMetres:       number
  distanceText:         string
  durationSeconds:      number   // walking seconds
  driveDurationSeconds: number   // driving seconds
  durationText:         string   // = walkDurationText
  walkDurationText:     string
  driveDurationText:    string
  matatuDurationText:   string
  geometry:             unknown  // GeoJSON LineString for drawing
}

const BASE = 'https://router.project-osrm.org/route/v1'
const PARAMS = '?overview=full&geometries=geojson'

function fmt(seconds: number): string {
  const mins = Math.round(seconds / 60)
  if (mins < 1)  return '< 1 min'
  if (mins < 60) return `${mins} min`
  const hrs = Math.floor(mins / 60)
  const rem = mins % 60
  return rem > 0 ? `${hrs}h ${rem}min` : `${hrs}h`
}

function fmtDist(metres: number): string {
  return metres < 1000
    ? `${Math.round(metres)}m`
    : `${(metres / 1000).toFixed(1)}km`
}

export async function getRealRoute(
  fromLat: number,
  fromLng: number,
  toLat:   number,
  toLng:   number,
): Promise<RouteResult | null> {
  try {
    const coords = `${fromLng},${fromLat};${toLng},${toLat}`

    const [walkRes, driveRes] = await Promise.all([
      fetch(`${BASE}/walking/${coords}${PARAMS}`),
      fetch(`${BASE}/driving/${coords}${PARAMS}`),
    ])

    const [walkData, driveData] = await Promise.all([
      walkRes.json(),
      driveRes.json(),
    ])

    if (walkData.code !== 'Ok') return null

    const walkRoute  = walkData.routes[0]
    const driveRoute = driveData.code === 'Ok' ? driveData.routes[0] : null

    const distMetres   = walkRoute.distance  as number
    const walkSec      = walkRoute.duration  as number
    const driveSec     = driveRoute ? (driveRoute.duration as number) : walkSec * 0.3
    const matatuSec    = driveSec + 300   // drive + 5 min wait at stage

    return {
      distanceMetres:       Math.round(distMetres),
      distanceText:         fmtDist(distMetres),
      durationSeconds:      walkSec,
      driveDurationSeconds: driveSec,
      durationText:         fmt(walkSec),
      walkDurationText:     fmt(walkSec),
      driveDurationText:    fmt(driveSec),
      matatuDurationText:   fmt(matatuSec),
      geometry:             walkRoute.geometry,
    }
  } catch (err) {
    console.error('OSRM routing error:', err)
    return null
  }
}
