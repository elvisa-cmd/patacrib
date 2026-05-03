import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const CreateSchema = z.object({
  propertyId: z.string().min(1),
  content:    z.string().min(1, 'Message cannot be empty').max(2000),
})

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const { propertyId, content } = parsed.data

  const property = await prisma.property.findUnique({ where: { id: propertyId } })
  if (!property) {
    return NextResponse.json({ error: 'Property not found' }, { status: 404 })
  }
  // Crash early: landlord cannot start a conversation on their own property
  if (property.adminId === session.user.userId) {
    return NextResponse.json({ error: 'You cannot message your own property' }, { status: 400 })
  }

  const conversation = await prisma.conversation.upsert({
    where: {
      propertyId_seekerId: {
        propertyId,
        seekerId: session.user.userId,
      },
    },
    create: {
      propertyId,
      seekerId:   session.user.userId,
      landlordId: property.adminId,
    },
    update: {},
    include: {
      property: { select: { id: true, title: true, price: true, priceType: true, images: true } },
      seeker:   { select: { id: true, name: true } },
      landlord: { select: { id: true, name: true } },
    },
  })

  const message = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderId:       session.user.userId,
      content,
    },
    include: {
      sender: { select: { id: true, name: true } },
    },
  })

  // Touch updatedAt so conversation sorts to the top
  await prisma.conversation.update({
    where: { id: conversation.id },
    data:  { updatedAt: new Date() },
  })

  return NextResponse.json({ conversation, message }, { status: 201 })
}
