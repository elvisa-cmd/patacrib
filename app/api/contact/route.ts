import { NextResponse } from 'next/server'
import { z } from 'zod'

const Schema = z.object({
  name:    z.string().min(1),
  email:   z.string().email(),
  subject: z.string().optional(),
  message: z.string().min(1),
})

export async function POST(req: Request) {
  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  // Log to console for now — wire up email/DB when ready
  console.log('[contact]', parsed.data)

  return NextResponse.json({ ok: true }, { status: 201 })
}
