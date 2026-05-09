import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Nav from '@/components/home/Nav'
import EditPropertyForm from '@/components/dashboard/EditPropertyForm'

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const session = await getServerSession(authOptions)
  if (!session)                             redirect('/login')
  if (session.user.userType !== 'ADMIN')    redirect('/dashboard')

  const property = await prisma.property.findUnique({ where: { id } })
  if (!property)                                    notFound()
  if (property.adminId !== session.user.userId)     notFound()

  // Serialize Date fields before passing to client component
  const serialized = {
    id:            property.id,
    title:         property.title,
    description:   property.description,
    price:         property.price,
    priceType:     property.priceType,
    bedrooms:      property.bedrooms,
    bathrooms:     property.bathrooms,
    propertyType:  property.propertyType,
    address:       property.address,
    estate:        property.estate,
    city:          property.city,
    latitude:      property.latitude,
    longitude:     property.longitude,
    images:        property.images,
    videoUrl:      property.videoUrl,
    features:      property.features,
    amenities:     property.amenities,
    waterSchedule: property.waterSchedule,
    matatuRoutes:  property.matatuRoutes,
    safetyScore:   property.safetyScore,
    powerBackup:   property.powerBackup,
    borehole:      property.borehole,
    status:        property.status,
  }

  return (
    <div className="min-h-screen bg-bg">
      <Nav />
      <main className="pt-[60px]">
        <EditPropertyForm property={serialized} />
      </main>
    </div>
  )
}
