import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { propertyId, type } = await req.json()
    if (!propertyId || !type) return NextResponse.json({ ok: false })

    await prisma.propertyEnquiry.create({ data: { propertyId, type } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}
