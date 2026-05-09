import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // ── Users ──────────────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@patacrib.co.ke' },
    update: {},
    create: {
      email: 'admin@patacrib.co.ke',
      password: adminPassword,
      name: 'Patacrib Admin',
      phone: '+254700000000',
      userType: 'ADMIN',
    },
  })

  const seekerPassword = await bcrypt.hash('seeker123', 10)
  await prisma.user.upsert({
    where: { email: 'seeker@patacrib.co.ke' },
    update: {},
    create: {
      email: 'seeker@patacrib.co.ke',
      password: seekerPassword,
      name: 'Test Seeker',
      phone: '+254711111111',
      userType: 'SEEKER',
    },
  })

  console.log('Users created.')

  // ── Properties ─────────────────────────────────────────────────────────────
  const properties = [
    {
      title: 'Modern 2BR Apartment – Westlands',
      description:
        'Bright, fully furnished 2-bedroom apartment in the heart of Westlands. High-floor unit with city views, 24/7 security, and ample parking. Walking distance to Sarit Centre and major supermarkets.',
      price: 55000,
      priceType: 'month',
      bedrooms: 2,
      bathrooms: 2,
      propertyType: '2br',
      address: 'Westlands Road, Westlands',
      estate: 'Westlands',
      city: 'Nairobi',
      latitude: -1.2641,
      longitude: 36.8031,
      images: [],
      features: ['Furnished', 'Parking', 'Balcony', 'Generator', 'Elevator'],
      amenities: ['Sarit Centre 5min', 'Westgate Mall 10min', 'Aga Khan Hospital 8min'],
      waterSchedule: 'Daily 6am–10pm, borehole backup',
      matatuRoutes: ['Route 46', 'Route 107', 'Route 23'],
      safetyScore: 8.2,
      powerBackup: true,
      borehole: true,
      status: 'available',
    },
    {
      title: 'Executive 1BR – Kilimani',
      description:
        'Stylish 1-bedroom apartment in sought-after Kilimani. Newly renovated with modern kitchen, gym access, and rooftop terrace. Ideal for young professionals.',
      price: 38000,
      priceType: 'month',
      bedrooms: 1,
      bathrooms: 1,
      propertyType: '1br',
      address: 'Argwings Kodhek Road, Kilimani',
      estate: 'Kilimani',
      city: 'Nairobi',
      latitude: -1.2904,
      longitude: 36.7865,
      images: [],
      features: ['Gym', 'Rooftop', 'DSTV Ready', 'Intercom', 'CCTV'],
      amenities: ['Junction Mall 7min', 'Yaya Centre 5min', 'Nairobi Hospital 10min'],
      waterSchedule: 'Daily, borehole',
      matatuRoutes: ['Route 46', 'Route 9', 'Route 48'],
      safetyScore: 8.7,
      powerBackup: true,
      borehole: true,
      status: 'available',
    },
    {
      title: 'Affordable Bedsitter – South B',
      description:
        'Clean, self-contained bedsitter perfect for singles or students. Close to public transport, shops, and schools. Water available twice daily.',
      price: 18000,
      priceType: 'month',
      bedrooms: 0,
      bathrooms: 1,
      propertyType: 'bedsitter',
      address: 'Mombasa Road, South B',
      estate: 'South B',
      city: 'Nairobi',
      latitude: -1.3031,
      longitude: 36.83,
      images: [],
      features: ['Self-Contained', 'Tiled', 'Security'],
      amenities: ['T-Mall 5min', 'South B Shopping Centre 3min'],
      waterSchedule: 'Morning 5am–9am, Evening 5pm–9pm',
      matatuRoutes: ['Route 33', 'Route 34', 'Route 110'],
      safetyScore: 6.5,
      powerBackup: false,
      borehole: false,
      status: 'available',
    },
    {
      title: 'Spacious 4BR Maisonette – Karen',
      description:
        'Gated maisonette in quiet Karen with large garden, servant quarters, and ample parking for 4 cars. Perfect for a family seeking space and security.',
      price: 120000,
      priceType: 'month',
      bedrooms: 4,
      bathrooms: 3,
      propertyType: 'maisonette',
      address: 'Karen Road, Karen',
      estate: 'Karen',
      city: 'Nairobi',
      latitude: -1.3193,
      longitude: 36.682,
      images: [],
      features: ['Garden', 'SQ', 'Parking x4', 'Borehole', 'Electric Fence'],
      amenities: ['Karen Shopping Centre 10min', 'Karen Country Club 5min', 'Galleria Mall 15min'],
      waterSchedule: 'Continuous, borehole + tanks',
      matatuRoutes: ['Route 111'],
      safetyScore: 9.1,
      powerBackup: true,
      borehole: true,
      status: 'available',
    },
    {
      title: 'Cozy 2BR Apartment – Lavington',
      description:
        'Well-maintained 2-bedroom apartment in leafy Lavington. Short walk to Valley Arcade and international schools. Quiet neighbourhood with excellent security.',
      price: 45000,
      priceType: 'month',
      bedrooms: 2,
      bathrooms: 2,
      propertyType: '2br',
      address: 'James Gichuru Road, Lavington',
      estate: 'Lavington',
      city: 'Nairobi',
      latitude: -1.2883,
      longitude: 36.77,
      images: [],
      features: ['Parking', 'Garden', 'DSTV Ready', 'Water Tank'],
      amenities: ['Valley Arcade 5min', 'Lavington Mall 10min'],
      waterSchedule: 'Daily, council + tank backup',
      matatuRoutes: ['Route 9', 'Route 46'],
      safetyScore: 8.5,
      powerBackup: false,
      borehole: false,
      status: 'available',
    },
    {
      title: 'Studio Apartment – Upperhill',
      description:
        'Modern studio apartment in the Upperhill business district. Perfect for professionals working in the CBD or hospitals. Walking distance to Kenyatta National Hospital.',
      price: 32000,
      priceType: 'month',
      bedrooms: 0,
      bathrooms: 1,
      propertyType: 'studio',
      address: 'Hospital Road, Upperhill',
      estate: 'Upperhill',
      city: 'Nairobi',
      latitude: -1.2986,
      longitude: 36.8175,
      images: [],
      features: ['Furnished', 'Fibre Ready', 'Generator', 'Elevator', 'CCTV'],
      amenities: ['KNH 5min', 'Nairobi Hospital 15min', 'CBD 15min'],
      waterSchedule: 'Continuous, borehole',
      matatuRoutes: ['Route 19', 'Route 23', 'Route 46'],
      safetyScore: 7.8,
      powerBackup: true,
      borehole: true,
      status: 'available',
    },
    {
      title: 'Office Space – Westlands Business Park',
      description:
        'Open-plan commercial office space in Westlands. Ideal for startups, small teams, or established businesses. High-speed fibre, meeting room access, and ample parking.',
      price: 85000,
      priceType: 'month',
      bedrooms: 0,
      bathrooms: 1,
      propertyType: 'commercial',
      address: 'Westlands Business Park, Westlands',
      estate: 'Westlands',
      city: 'Nairobi',
      latitude: -1.2635,
      longitude: 36.8065,
      images: [],
      features: ['Fibre Ready', 'Generator', 'Elevator', 'CCTV', 'Parking x6'],
      amenities: ['Sarit Centre 5min', 'The Hub Karen 45min', 'CBD 20min'],
      waterSchedule: 'Continuous',
      matatuRoutes: ['Route 46', 'Route 107'],
      safetyScore: 8.5,
      powerBackup: true,
      borehole: false,
      status: 'available',
    },
  ]

  for (const prop of properties) {
    await prisma.property.create({
      data: { ...prop, adminId: admin.id },
    })
  }

  console.log(`${properties.length} properties seeded.`)
  console.log('\nSeed complete.')
  console.log('  Admin:  admin@patacrib.co.ke  / admin123')
  console.log('  Seeker: seeker@patacrib.co.ke / seeker123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
