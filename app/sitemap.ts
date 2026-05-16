import { MetadataRoute } from 'next'
import { prisma } from '@/lib/db'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://patacrib.vercel.app'

  const properties = await prisma.property.findMany({
    where:   { status: 'available' },
    select:  { id: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  }).catch(() => [])

  const propertyUrls = properties.map(p => ({
    url:             `${baseUrl}/property/${p.id}`,
    lastModified:    p.createdAt,
    changeFrequency: 'weekly' as const,
    priority:        0.8,
  }))

  return [
    {
      url:             baseUrl,
      lastModified:    new Date(),
      changeFrequency: 'daily',
      priority:        1.0,
    },
    {
      url:             `${baseUrl}/browse`,
      lastModified:    new Date(),
      changeFrequency: 'daily',
      priority:        0.9,
    },
    {
      url:             `${baseUrl}/browse/map`,
      lastModified:    new Date(),
      changeFrequency: 'daily',
      priority:        0.9,
    },
    {
      url:             `${baseUrl}/pricing`,
      lastModified:    new Date(),
      changeFrequency: 'monthly',
      priority:        0.6,
    },
    ...propertyUrls,
  ]
}
