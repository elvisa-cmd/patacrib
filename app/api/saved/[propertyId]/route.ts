import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ propertyId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { propertyId } = await params
    const userId         = session.user.userId

    await prisma.savedProperty.deleteMany({
      where: { userId, propertyId },
    })

    return NextResponse.json({ saved: false })
  } catch (err: any) {
    console.error('[saved/propertyId] DELETE error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
