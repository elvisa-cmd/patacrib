import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      userId: string
      userType: string // 'ADMIN' | 'SEEKER'
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string
    userType?: string
  }
}
