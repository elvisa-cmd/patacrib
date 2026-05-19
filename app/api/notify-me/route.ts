import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const email = (formData.get('email') as string | null)?.trim()
    const query = (formData.get('query') as string | null)?.trim()

    if (!email) {
      return NextResponse.redirect(new URL('/browse', req.url))
    }

    console.log('[notify-me]', { email, query })

    return NextResponse.redirect(
      new URL(`/browse?notified=1${query ? `&q=${encodeURIComponent(query)}` : ''}`, req.url),
    )
  } catch {
    return NextResponse.redirect(new URL('/browse', req.url))
  }
}
