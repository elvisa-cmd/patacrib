import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.userId) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    const formData = await req.formData()
    const name  = (formData.get('name')  as string | null)?.trim()
    const phone = (formData.get('phone') as string | null)?.trim()

    const cleanPhone = phone
      ? phone.replace(/\s+/g, '').replace(/^0/, '254').replace(/^\+/, '')
      : undefined

    await prisma.user.update({
      where: { id: session.user.userId },
      data: {
        ...(name  ? { name }            : {}),
        ...(cleanPhone ? { phone: cleanPhone } : { phone: null }),
      },
    })

    return NextResponse.redirect(new URL('/dashboard/profile?saved=1', req.url))
  } catch (err: any) {
    console.error('[profile] POST error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
