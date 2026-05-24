import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('photo') as File
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())

    try {
      const sharp = (await import('sharp')).default
      const metadata = await sharp(buffer).metadata()

      if (metadata.exif) {
        // @ts-ignore
        const ExifReader = (await import('exif-reader')).default
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const exif = ExifReader(metadata.exif) as any

        const gps = exif?.gps
        if (gps?.GPSLatitude && gps?.GPSLongitude) {
          const toDecimal = (d: number[], ref: string) => {
            const decimal = d[0] + d[1] / 60 + d[2] / 3600
            return ref === 'S' || ref === 'W' ? -decimal : decimal
          }

          const lat = toDecimal(gps.GPSLatitude as number[], gps.GPSLatitudeRef as string)
          const lng = toDecimal(gps.GPSLongitude as number[], gps.GPSLongitudeRef as string)

          if (lat !== 0 && lng !== 0) {
            return NextResponse.json({ lat, lng, source: 'exif_server' })
          }
        }
      }
    } catch (e) {
      console.log('sharp/exif-reader failed:', e)
    }

    return NextResponse.json({ error: 'No GPS in photo' }, { status: 404 })
  } catch (err) {
    console.error('GPS extract error:', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
