/**
 * 🔐 AUTH CONFIGURATION
 * NextAuth.js Configuration for Trading AI SHER
 */

import type { NextAuthConfig } from "next-auth";
import { GoogleProvider } from "next-auth/providers/google";

export const authOptions: NextAuthConfig = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // Add role to token
      if (user) {
        token.role = user.role;
        token.tenantId = user.tenantId;
      }
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      session.user = {
        id: token.sub,
        role: token.role,
        tenantId: token.tenantId,
      } as any;
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default authOptions;
