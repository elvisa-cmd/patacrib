import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ error: 'No URL' }, { status: 400 })

  try {
    const res = await fetch(url, {
      method:   'HEAD',
      redirect: 'follow',
    })
    return NextResponse.json({ resolvedUrl: res.url })
  } catch {
    return NextResponse.json({ error: 'Could not resolve' }, { status: 500 })
  }
}
