import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const saved = await prisma.savedProperty.findMany({
    where:  { userId: session.user.userId },
    select: { propertyId: true },
  })
  return NextResponse.json({ savedIds: saved.map(s => s.propertyId) })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const propertyId = body?.propertyId as string | undefined
  if (!propertyId) {
    return NextResponse.json({ error: 'propertyId required' }, { status: 400 })
  }

  const userId = session.user.userId

  const existing = await prisma.savedProperty.findUnique({
    where: { userId_propertyId: { userId, propertyId } },
  })

  if (existing) {
    await prisma.savedProperty.delete({
      where: { userId_propertyId: { userId, propertyId } },
    })
    return NextResponse.json({ saved: false })
  }

  await prisma.savedProperty.create({ data: { userId, propertyId } })
  return NextResponse.json({ saved: true })
}
