import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";

/**
 * Sync user to Convex database after sign in
 */
async function syncUserToConvex(user: {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const authSecret = process.env.CONVEX_AUTH_SECRET;

  if (!convexUrl || !authSecret) {
    // eslint-disable-next-line no-console
    console.error("Missing NEXT_PUBLIC_CONVEX_URL or CONVEX_AUTH_SECRET");
    return;
  }

  // Convert Convex URL to HTTP endpoint URL
  // e.g., https://xxx.convex.cloud -> https://xxx.convex.site
  const httpUrl = convexUrl.replace(".convex.cloud", ".convex.site");

  try {
    const response = await fetch(`${httpUrl}/auth/sync-user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authSecret}`,
      },
      body: JSON.stringify({
        name: user.name || "Unknown",
        email: user.email,
        image: user.image,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      // eslint-disable-next-line no-console
      console.error("Failed to sync user to Convex:", error);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error syncing user to Convex:", error);
  }
}

/**
 * NextAuth.js v5 configuration with Google OAuth provider
 */
export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  events: {
    // Sync user to Convex when they sign in
    async signIn({ user }) {
      await syncUserToConvex(user);
    },
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnAuthenticatedRoute =
        nextUrl.pathname.startsWith("/records") ||
        nextUrl.pathname.startsWith("/stats") ||
        nextUrl.pathname.startsWith("/settings");

      if (isOnAuthenticatedRoute) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      } else if (isLoggedIn && nextUrl.pathname === "/login") {
        return Response.redirect(new URL("/records", nextUrl));
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string | undefined;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  trustHost: true,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
