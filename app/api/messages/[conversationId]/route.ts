import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

type Ctx = { params: Promise<{ conversationId: string }> }

async function getConversationOrFail(conversationId: string, userId: string) {
  const conv = await prisma.conversation.findUnique({ where: { id: conversationId } })
  if (!conv) return { conv: null, error: NextResponse.json({ error: 'Conversation not found' }, { status: 404 }) }
  if (conv.seekerId !== userId && conv.landlordId !== userId) {
    return { conv: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { conv, error: null }
}

export async function GET(_req: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { conversationId } = await params
  const { conv, error }    = await getConversationOrFail(conversationId, session.user.userId)
  if (error) return error

  const messages = await prisma.message.findMany({
    where:   { conversationId: conv!.id },
    orderBy: { createdAt: 'asc' },
    include: { sender: { select: { id: true, name: true } } },
  })

  // Mark messages from the other person as read
  await prisma.message.updateMany({
    where: {
      conversationId: conv!.id,
      senderId:       { not: session.user.userId },
      read:           false,
    },
    data: { read: true },
  })

  return NextResponse.json({ messages })
}

export async function POST(req: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { conversationId } = await params
  const { conv, error }    = await getConversationOrFail(conversationId, session.user.userId)
  if (error) return error

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = z.object({ content: z.string().min(1).max(2000) }).safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const message = await prisma.message.create({
    data: {
      conversationId: conv!.id,
      senderId:       session.user.userId,
      content:        parsed.data.content,
    },
    include: { sender: { select: { id: true, name: true } } },
  })

  await prisma.conversation.update({
    where: { id: conv!.id },
    data:  { updatedAt: new Date() },
  })

  return NextResponse.json({ message }, { status: 201 })
}
