import { NextResponse } from 'next/server'
import { z } from 'zod'
import { calculateDistance } from '@/lib/geo'

const CoordsSchema = z.object({
  startLat: z.coerce.number().min(-90).max(90),
  startLon: z.coerce.number().min(-180).max(180),
  endLat: z.coerce.number().min(-90).max(90),
  endLon: z.coerce.number().min(-180).max(180),
})

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)

  // Crash early: validate coordinates before computing
  const parsed = CoordsSchema.safeParse(Object.fromEntries(searchParams))
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { startLat, startLon, endLat, endLon } = parsed.data

  const distanceKm = calculateDistance(startLat, startLon, endLat, endLon)
  // Estimated time at 30 km/h (city average)
  const estimatedMinutes = Math.round((distanceKm / 30) * 60)

  return NextResponse.json({
    distanceKm: Math.round(distanceKm * 100) / 100,
    estimatedMinutes,
    startCoords: [startLon, startLat],
    endCoords: [endLon, endLat],
  })
}
