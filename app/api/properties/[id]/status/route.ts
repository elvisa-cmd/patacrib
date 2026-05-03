import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const StatusSchema = z.object({
  status: z.enum(['available', 'taken', 'maintenance']),
})

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.userType !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const property = await prisma.property.findUnique({ where: { id } })
  if (!property) {
    return NextResponse.json({ error: 'Property not found' }, { status: 404 })
  }
  // Crash early: non-owner gets 403 before any mutation
  if (property.adminId !== session.user.userId) {
    return NextResponse.json({ error: 'Forbidden: not your property' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = StatusSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const updated = await prisma.property.update({
    where: { id },
    data: { status: parsed.data.status },
  })

  return NextResponse.json({ property: updated })
}
