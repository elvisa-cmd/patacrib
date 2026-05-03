import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { SignUpSchema } from '@/lib/validations'

export async function POST(req: Request) {
  // Crash early: validate before touching the DB
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = SignUpSchema.safeParse(body)
  if (!parsed.success) {
    const firstError =
      Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? 'Invalid input'
    return NextResponse.json({ message: firstError }, { status: 400 })
  }

  const { email, password, name, phone, userType } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ message: 'Email already registered' }, { status: 409 })
  }

  const hashed = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: { email, password: hashed, name, phone, userType },
    select: { id: true, email: true, name: true, userType: true },
  })

  return NextResponse.json({ user }, { status: 201 })
}
