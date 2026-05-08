import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'
import sharp from 'sharp'

const MAX_SIZE   = 10 * 1024 * 1024
const VALID_MIME = new Set(['image/jpeg', 'image/png', 'image/webp'])

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
  if (!VALID_MIME.has(file.type)) {
    return NextResponse.json(
      { error: 'Invalid file type. Use JPEG, PNG, or WebP.' },
      { status: 400 },
    )
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large. Maximum 10MB.' }, { status: 400 })
  }

  const raw = Buffer.from(await file.arrayBuffer())

  // Compress: resize to max 1200×900, convert to JPEG 80q progressive
  const compressed = await sharp(raw)
    .resize(1200, 900, {
      fit:                'cover',
      position:           'center',
      withoutEnlargement: true,
    })
    .jpeg({ quality: 80, progressive: true })
    .toBuffer()

  const filename = `${randomUUID()}.jpg`
  const dir      = join(process.cwd(), 'public', 'uploads')

  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, filename), compressed)

  return NextResponse.json({ url: `/uploads/${filename}` })
}
