import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const adminPassword = process.env.ADMIN_PASSWORD!
        if (!credentials?.password) return null
        const isValid = credentials.password === adminPassword
        if (!isValid) return null
        return { id: '1', name: 'Milind', email: 'admin@milindkelkar.com' }
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt' as const,
    maxAge: 7 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
export { authOptions }