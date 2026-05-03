import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import Nav from '@/components/home/Nav'
import MessagesContainer from '@/components/messages/MessagesContainer'
import type { SerializedConversation } from '@/components/messages/MessagesContainer'

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ property?: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const userId             = session.user.userId
  const { property: pid }  = await searchParams

  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ seekerId: userId }, { landlordId: userId }],
    },
    include: {
      property: { select: { id: true, title: true, price: true, priceType: true, images: true } },
      seeker:   { select: { id: true, name: true } },
      landlord: { select: { id: true, name: true } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: { updatedAt: 'desc' },
  })

  // If ?property= param present, find or prepare the initial conversation
  let initialConversationId: string | null = null
  let initialProperty: {
    id: string; title: string; price: number; priceType: string; images: string[]; adminId: string
  } | null = null

  if (pid) {
    const existing = conversations.find(c => c.propertyId === pid)
    if (existing) {
      initialConversationId = existing.id
    } else {
      initialProperty = await prisma.property.findUnique({
        where:  { id: pid },
        select: { id: true, title: true, price: true, priceType: true, images: true, adminId: true },
      })
    }
  }

  // Serialize all Date objects for client components
  const serialized: SerializedConversation[] = conversations.map(c => ({
    id:         c.id,
    propertyId: c.propertyId,
    seekerId:   c.seekerId,
    landlordId: c.landlordId,
    updatedAt:  c.updatedAt.toISOString(),
    property: {
      id:        c.property.id,
      title:     c.property.title,
      price:     c.property.price,
      priceType: c.property.priceType,
      images:    c.property.images,
    },
    seeker:   { id: c.seeker.id,   name: c.seeker.name   },
    landlord: { id: c.landlord.id, name: c.landlord.name },
    messages: c.messages.map(m => ({
      id:        m.id,
      content:   m.content,
      createdAt: m.createdAt.toISOString(),
      read:      m.read,
      senderId:  m.senderId,
    })),
  }))

  return (
    <div className="min-h-screen bg-bg">
      <Nav />
      <div className="pt-[60px]">
        <MessagesContainer
          conversations={serialized}
          userId={userId}
          initialConversationId={initialConversationId}
          initialPropertyId={pid ?? null}
          initialProperty={initialProperty}
        />
      </div>
    </div>
  )
}
