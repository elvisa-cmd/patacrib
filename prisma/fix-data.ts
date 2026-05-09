import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const r1 = await prisma.property.updateMany({
    where: { title: { contains: '3 bedroom', mode: 'insensitive' } },
    data:  { bedrooms: 3, bathrooms: 2 },
  })
  console.log(`Updated ${r1.count} "3 bedroom" properties`)

  const r2 = await prisma.property.updateMany({
    where: { title: { contains: 'office', mode: 'insensitive' } },
    data:  { propertyType: 'commercial', bedrooms: 0, bathrooms: 1 },
  })
  console.log(`Updated ${r2.count} "office" properties`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
