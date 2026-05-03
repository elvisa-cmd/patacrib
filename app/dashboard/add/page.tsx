import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Nav from '@/components/home/Nav'
import AddPropertyForm from '@/components/dashboard/AddPropertyForm'

export default async function AddPropertyPage() {
  const session = await getServerSession(authOptions)

  if (!session) redirect('/login')
  if (session.user.userType !== 'ADMIN') redirect('/dashboard')

  return (
    <div className="min-h-screen bg-bg">
      <Nav />
      <main className="pt-[60px]">
        <AddPropertyForm />
      </main>
    </div>
  )
}
