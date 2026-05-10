export interface RouteStep {
  instruction: string
  distance:    string
  direction:   'straight' | 'left' | 'right' | 'slight-left' | 'slight-right' | 'u-turn' | 'arrive'
  arrow:       string
}

export interface RouteResult {
  distanceMetres: number
  distanceText:   string
  walkMinutes:    number
  walkText:       string
  driveMinutes:   number
  driveText:      string
  matatuMinutes:  number
  matatuText:     string
  geometry:       unknown
  steps:          RouteStep[]
}

const BASE = 'https://router.project-osrm.org/route/v1'

function fmt(secs: number): string {
  const mins = Math.round(secs / 60)
  if (mins < 1)  return '< 1 min'
  if (mins < 60) return `${mins} min`
  const hrs = Math.floor(mins / 60)
  const rem = mins % 60
  return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`
}

function fmtDist(m: number): string {
  return m < 1000 ? `${Math.round(m)}m` : `${(m / 1000).toFixed(1)}km`
}

function parseSteps(legs: any[]): RouteStep[] {
  const steps: RouteStep[] = []

  legs?.[0]?.steps?.forEach((step: any) => {
    if (!step.maneuver) return
    const type     = step.maneuver.type     as string
    const modifier = (step.maneuver.modifier ?? '') as string

    let instruction: string
    let arrow:       string = '↑'
    let direction:   RouteStep['direction'] = 'straight'

    if (type === 'depart') {
      const bearing = (step.maneuver.bearing_after ?? 0) as number
      const dir =
        bearing <= 45 || bearing > 315 ? 'north' :
        bearing <= 135                 ? 'east'  :
        bearing <= 225                 ? 'south' : 'west'
      instruction = `Head ${dir}${step.name ? ` on ${step.name}` : ''}`
    } else if (type === 'arrive') {
      instruction = 'You have arrived'
      arrow       = '🏠'
      direction   = 'arrive'
    } else if (type === 'roundabout' || type === 'rotary') {
      instruction = `Take the roundabout${step.name ? ` onto ${step.name}` : ''}`
      arrow       = '↻'
    } else {
      if (modifier === 'uturn') {
        instruction = 'Make a U-turn'
        arrow       = '↩'
        direction   = 'u-turn'
      } else if (modifier.includes('sharp left') || modifier === 'left') {
        instruction = `Turn left${step.name ? ` onto ${step.name}` : ''}`
        arrow       = '←'
        direction   = 'left'
      } else if (modifier.includes('sharp right') || modifier === 'right') {
        instruction = `Turn right${step.name ? ` onto ${step.name}` : ''}`
        arrow       = '→'
        direction   = 'right'
      } else if (modifier.includes('slight left')) {
        instruction = `Bear left${step.name ? ` onto ${step.name}` : ''}`
        arrow       = '↖'
        direction   = 'slight-left'
      } else if (modifier.includes('slight right')) {
        instruction = `Bear right${step.name ? ` onto ${step.name}` : ''}`
        arrow       = '↗'
        direction   = 'slight-right'
      } else {
        instruction = `Continue${step.name ? ` on ${step.name}` : ''}`
      }
    }

    if (type !== 'arrive' && step.distance < 10) return

    steps.push({
      instruction,
      distance:  type === 'arrive' ? '' : fmtDist(step.distance),
      direction,
      arrow,
    })
  })

  if (steps.length > 0 && steps[steps.length - 1].direction !== 'arrive') {
    steps.push({
      instruction: 'You have arrived at your destination',
      distance:    '',
      direction:   'arrive',
      arrow:       '🏠',
    })
  }

  return steps
}

export async function getWalkingRoute(
  fromLat: number,
  fromLng: number,
  toLat:   number,
  toLng:   number,
): Promise<RouteResult | null> {
  try {
    const coords = `${fromLng},${fromLat};${toLng},${toLat}`

    const [walkRes, driveRes] = await Promise.allSettled([
      fetch(`${BASE}/walking/${coords}?overview=full&geometries=geojson&steps=true`, {
        signal: AbortSignal.timeout(8000),
      }),
      fetch(`${BASE}/driving/${coords}?overview=false`, {
        signal: AbortSignal.timeout(5000),
      }),
    ])

    if (walkRes.status !== 'fulfilled') return null
    const walkData = await walkRes.value.json()
    if (walkData.code !== 'Ok') return null

    const walkRoute = walkData.routes[0]
    const walkSec   = walkRoute.duration as number
    const distM     = walkRoute.distance  as number

    let driveSec = walkSec * 0.25
    if (driveRes.status === 'fulfilled') {
      try {
        const driveData = await driveRes.value.json()
        if (driveData.routes?.[0]) driveSec = driveData.routes[0].duration as number
      } catch { /* use estimate */ }
    }
    const matatuSec = driveSec + 300

    return {
      distanceMetres: Math.round(distM),
      distanceText:   fmtDist(distM),
      walkMinutes:    Math.max(1, Math.round(walkSec   / 60)),
      walkText:       fmt(walkSec),
      driveMinutes:   Math.max(1, Math.round(driveSec  / 60)),
      driveText:      fmt(driveSec),
      matatuMinutes:  Math.max(1, Math.round(matatuSec / 60)),
      matatuText:     fmt(matatuSec),
      geometry:       walkRoute.geometry,
      steps:          parseSteps(walkRoute.legs),
    }
  } catch (err) {
    console.error('OSRM routing error:', err)
    return null
  }
}

export function estimateRoute(
  fromLat: number,
  fromLng: number,
  toLat:   number,
  toLng:   number,
): RouteResult {
  const R      = 6_371_000
  const dLat   = (toLat - fromLat) * (Math.PI / 180)
  const dLon   = (toLng - fromLng) * (Math.PI / 180)
  const a      =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(fromLat * (Math.PI / 180)) *
    Math.cos(toLat   * (Math.PI / 180)) *
    Math.sin(dLon / 2) ** 2
  const straightM = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  // Road distance ≈ 1.4× straight-line in Nairobi
  const roadM      = straightM * 1.4
  const walkMins   = Math.max(1, Math.round((roadM / 4000)  * 60))
  const driveMins  = Math.max(1, Math.round((roadM / 25000) * 60))
  const matatuMins = driveMins + 5

  return {
    distanceMetres: Math.round(roadM),
    distanceText:   fmtDist(roadM),
    walkMinutes:    walkMins,
    walkText:       fmt(walkMins  * 60),
    driveMinutes:   driveMins,
    driveText:      fmt(driveMins * 60),
    matatuMinutes:  matatuMins,
    matatuText:     fmt(matatuMins * 60),
    geometry:       null,
    steps: [
      {
        instruction: `Head toward destination — ${fmtDist(roadM)} away`,
        distance:    fmtDist(roadM),
        direction:   'straight',
        arrow:       '↑',
      },
      {
        instruction: 'You have arrived',
        distance:    '',
        direction:   'arrive',
        arrow:       '🏠',
      },
    ],
  }
}
