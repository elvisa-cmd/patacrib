import { createClient } from '@supabase/supabase-js'

export type UploadBucket = 'property-images' | 'property-videos'

const VALID_BUCKETS: UploadBucket[] = ['property-images', 'property-videos']

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Supabase env vars missing: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')
  }
  return createClient(url, key)
}

/** Upload a File or Buffer to Supabase Storage. Returns the public URL. */
export async function uploadToSupabase(
  file: File | Buffer,
  bucket: UploadBucket,
  filename: string
): Promise<string> {
  if (!VALID_BUCKETS.includes(bucket)) {
    throw new Error(`Invalid bucket "${bucket}". Must be one of: ${VALID_BUCKETS.join(', ')}`)
  }

  const supabase = getServiceClient()

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filename, file, { upsert: false })

  if (error) throw new Error(`Upload failed: ${error.message}`)

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(data.path)

  return publicUrl
}

/** Upload a base64-encoded image (from webcam etc). Returns the public URL. */
export async function uploadBase64Image(
  base64: string,
  bucket: UploadBucket = 'property-images'
): Promise<string> {
  const raw = base64.includes('base64,') ? base64.split('base64,')[1] : base64
  const buffer = Buffer.from(raw, 'base64')
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
  return uploadToSupabase(buffer, bucket, filename)
}
