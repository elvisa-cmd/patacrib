export type SerializedProperty = {
  id: string
  title: string
  price: number
  priceType: string
  bedrooms: number
  bathrooms: number
  address: string
  estate: string | null
  city: string
  latitude: number
  longitude: number
  images: string[]
  status: string
  createdAt: string
  propertyType: string
  safetyScore: number | null
  matatuRoutes: string[]
  waterSchedule: string | null
  powerBackup: boolean
  videoUrl?: string | null
  tourImageUrl?: string | null
}

export type BrowseProperty = SerializedProperty & {
  description: string
  borehole: boolean
  _count: { savedBy: number; views: number }
}

export type DetailedProperty = SerializedProperty & {
  description: string
  features: string[]
  amenities: string[]
  borehole: boolean
  videoUrl: string | null
  tourImageUrl: string | null
  adminId: string
  admin: {
    name: string
    email: string
    phone: string | null
  }
}
