import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UpdatePropertySchema } from '@/lib/validations'
import { revalidatePath, revalidateTag } from 'next/cache'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params

  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      admin: { select: { name: true, phone: true, email: true } },
      _count: { select: { savedBy: true, views: true } },
    },
  })

  if (!property) {
    return NextResponse.json({ error: 'Property not found' }, { status: 404 })
  }

  // Track view without blocking the response
  const session = await getServerSession(authOptions)
  if (session?.user.userId) {
    prisma.propertyView
      .create({ data: { propertyId: property.id, userId: session.user.userId } })
      .catch(() => {})
  }

  return NextResponse.json({ property })
}

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
  if (property.adminId !== session.user.userId) {
    return NextResponse.json({ error: 'Forbidden: not your property' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = UpdatePropertySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const updated = await prisma.property.update({
    where: { id },
    data: parsed.data,
  })

  revalidateTag('listings', { expire: 0 })
  revalidatePath('/')
  revalidatePath('/browse')
  revalidatePath('/browse/map')
  revalidatePath(`/property/${id}`)

  return NextResponse.json({ property: updated })
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.userType !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const property = await prisma.property.findUnique({ where: { id } })
  if (!property) {
    return NextResponse.json({ error: 'Property not found' }, { status: 404 })
  }
  if (property.adminId !== session.user.userId) {
    return NextResponse.json({ error: 'Forbidden: not your property' }, { status: 403 })
  }

  await prisma.property.delete({ where: { id } })

  revalidateTag('listings', { expire: 0 })
  revalidatePath('/')
  revalidatePath('/browse')
  revalidatePath('/browse/map')

  return NextResponse.json({ deleted: true })
}
