import { z } from 'zod'

// ── Auth ──────────────────────────────────────────────────────────────────────

export const SignUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
  userType: z.enum(['ADMIN', 'SEEKER']).default('SEEKER'),
})

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

// ── Property ──────────────────────────────────────────────────────────────────

export const CreatePropertySchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  price: z.number().positive('Price must be a positive number'),
  priceType: z.enum(['month', 'year', 'day']).default('month'),
  bedrooms: z.number().int().min(0).max(20),
  bathrooms: z.number().int().min(0).max(20),
  propertyType: z.enum([
    'bedsitter',
    'studio',
    '1br',
    '2br',
    '3br',
    '4br',
    'maisonette',
    'bungalow',
    'mansion',
  ]),
  address: z.string().min(5, 'Address is required'),
  estate: z.string().optional(),
  city: z.string().default('Nairobi'),
  // Coordinates must be valid lat/lng ranges
  latitude: z.number().min(-90).max(90).default(-1.286389),
  longitude: z.number().min(-180).max(180).default(36.817223),
  images: z.array(z.string()).default([]),
  videoUrl:     z.string().url().optional().or(z.literal('')).or(z.undefined()),
  tourImageUrl: z.string().url().optional().or(z.literal('')).or(z.undefined()),
  features: z.array(z.string()).default([]),
  amenities: z.array(z.string()).default([]),
  waterSchedule: z.string().optional(),
  matatuRoutes: z.array(z.string()).default([]),
  safetyScore: z.number().min(0).max(10).optional(),
  powerBackup: z.boolean().default(false),
  borehole: z.boolean().default(false),
  status: z.enum(['available', 'taken', 'maintenance']).default('available'),
})

export const UpdatePropertySchema = CreatePropertySchema.partial()

// ── Search ────────────────────────────────────────────────────────────────────

export const SearchFiltersSchema = z.object({
  q: z.string().optional(),
  city: z.string().optional(),
  estate: z.string().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  propertyType: z.string().optional(),
  bedrooms: z.coerce.number().int().min(0).optional(),
  maxDistance: z.coerce.number().positive().optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
})

export type SignUpInput = z.infer<typeof SignUpSchema>
export type LoginInput = z.infer<typeof LoginSchema>
export type CreatePropertyInput = z.infer<typeof CreatePropertySchema>
export type UpdatePropertyInput = z.infer<typeof UpdatePropertySchema>
export type SearchFiltersInput = z.infer<typeof SearchFiltersSchema>
