import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  providers: [],
  trustHost: true,
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
        token.studentId = user.studentId;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.studentId = token.studentId as string;
        session.user.image = token.picture as string | undefined;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'uiu-ridewave-default-secret-key-2026',
} satisfies NextAuthConfig;
