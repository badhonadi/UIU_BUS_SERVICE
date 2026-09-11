import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  providers: [],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.studentId = (user as any).studentId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).studentId = token.studentId as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'uiu-ridewave-default-secret-key-2026',
} satisfies NextAuthConfig;
