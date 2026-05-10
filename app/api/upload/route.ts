import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'
import sharp from 'sharp'

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const VIDEO_TYPES = new Set(['video/mp4', 'video/quicktime', 'video/webm'])
const MAX_IMAGE_SIZE = 10  * 1024 * 1024   // 10 MB
const MAX_VIDEO_SIZE = 150 * 1024 * 1024   // 150 MB

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const contentType = req.headers.get('content-type') ?? ''
  if (!contentType.includes('multipart/form-data')) {
    return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 })
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const isImage = IMAGE_TYPES.has(file.type)
  const isVideo = VIDEO_TYPES.has(file.type)

  if (!isImage && !isVideo) {
    return NextResponse.json(
      { error: 'Invalid file type. Use JPEG, PNG, WebP, MP4, MOV, or WebM.' },
      { status: 400 },
    )
  }

  const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: `File too large. Maximum ${isVideo ? '150MB' : '10MB'}.` },
      { status: 400 },
    )
  }

  const raw = Buffer.from(await file.arrayBuffer())
  const dir = join(process.cwd(), 'public', 'uploads')
  await mkdir(dir, { recursive: true })

  let filename: string
  let output:   Buffer

  if (isVideo) {
    const ext = file.type === 'video/quicktime' ? 'mov'
      : file.type === 'video/webm' ? 'webm' : 'mp4'
    filename = `${randomUUID()}.${ext}`
    output   = raw
  } else {
    // Compress image: resize to max 1200×900, JPEG 80q progressive
    filename = `${randomUUID()}.jpg`
    output   = await sharp(raw)
      .resize(1200, 900, { fit: 'cover', position: 'center', withoutEnlargement: true })
      .jpeg({ quality: 80, progressive: true })
      .toBuffer()
  }

  await writeFile(join(dir, filename), output)

  return NextResponse.json({ url: `/uploads/${filename}` })
}
