import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const VIDEO_TYPES = new Set(['video/mp4', 'video/quicktime', 'video/webm'])
const MAX_IMAGE_SIZE = 10  * 1024 * 1024  // 10 MB
const MAX_VIDEO_SIZE = 200 * 1024 * 1024  // 200 MB

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
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
        { error: `File too large. Max size is ${isVideo ? '200MB' : '10MB'}.` },
        { status: 400 },
      )
    }

    const ext       = file.name.split('.').pop() || (isVideo ? 'mp4' : 'jpg')
    const userId    = (session.user.userId as string).slice(-8)
    const filename  = `${userId}-${Date.now()}.${ext}`
    const bucket    = isVideo ? 'property-videos' : 'property-images'
    const buffer    = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filename, buffer, { contentType: file.type, upsert: false })

    if (uploadError) {
      console.error('Supabase storage error:', uploadError)
      return NextResponse.json(
        { error: 'Upload failed: ' + uploadError.message },
        { status: 500 },
      )
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filename)
    const publicUrl = urlData.publicUrl

    return NextResponse.json({
      url:       publicUrl,
      videoUrl:  isVideo ? publicUrl : undefined,
      imageUrl:  isImage ? publicUrl : undefined,
      secure_url: publicUrl,
      type:      isVideo ? 'video' : 'image',
      size:      file.size,
      filename,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Upload error:', message)
    return NextResponse.json({ error: 'Upload failed: ' + message }, { status: 500 })
  }
}
