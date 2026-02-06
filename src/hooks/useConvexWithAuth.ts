"use client";

import { useQuery as useConvexQuery, useMutation as useConvexMutation } from "convex/react";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

/**
 * Checks if an error is an authentication-related error
 */
function isAuthError(error: unknown): boolean {
  if (!error) return false;

  const errorString = String(error).toLowerCase();

  return (
    errorString.includes("unauthenticated") ||
    errorString.includes("unauthorized") ||
    errorString.includes("could not verify token") ||
    errorString.includes("jwt") ||
    errorString.includes("token expired") ||
    errorString.includes("invalid token") ||
    errorString.includes("authentication failed") ||
    errorString.includes("session expired") ||
    errorString.includes("not authenticated")
  );
}

/**
 * Hook that wraps Convex useQuery with automatic logout on auth errors
 * @param query - The Convex query function reference
 * @param args - The query arguments (or "skip" to skip the query)
 * @returns The query result
 */
export function useQueryWithAuth(
  query: Parameters<typeof useConvexQuery>[0],
  args: Parameters<typeof useConvexQuery>[1]
) {
  const { status } = useSession();
  const router = useRouter();
  const result = useConvexQuery(query, args);

  useEffect(() => {
    // Check if session has become invalid
    if (status === "unauthenticated" && args !== "skip") {
      // Redirect to login if session is no longer valid
      router.push("/login");
    }
  }, [status, args, router]);

  return result;
}

/**
 * Hook that wraps Convex useMutation with automatic logout on auth errors
 * @param mutation - The Convex mutation function reference
 * @returns A wrapped mutation function that handles auth errors
 */
export function useMutationWithAuth(mutation: Parameters<typeof useConvexMutation>[0]) {
  const { status } = useSession();
  const router = useRouter();
  const originalMutation = useConvexMutation(mutation);

  const wrappedMutation = useCallback(
    async (args: unknown) => {
      // Check if session is still valid before executing
      if (status === "unauthenticated") {
        // Redirect to login
        router.push("/login");
        throw new Error("Session expired. Please log in again.");
      }

      try {
        return await originalMutation(args);
      } catch (error) {
        // Check if the error is an authentication error
        if (isAuthError(error)) {
          // Automatically sign out and redirect to login
          await signOut({ callbackUrl: "/login", redirect: false });
          router.push("/login");
          throw new Error("Your session has expired. Please log in again.");
        }
        // Re-throw other errors
        throw error;
      }
    },
    [originalMutation, status, router]
  );

  return wrappedMutation;
}

/**
 * Hook to check if the current session is valid
 * Automatically signs out the user if the session becomes invalid
 */
export function useAuthCheck() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  useEffect(() => {
    // If session status is unauthenticated, redirect to login
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    // Check if session data exists but is potentially invalid
    if (status === "authenticated" && !session?.user?.email) {
      // Session exists but user data is missing - likely invalid
      signOut({ callbackUrl: "/login", redirect: false }).then(() => {
        router.push("/login");
      });
    }
  }, [session, status, router]);

  return {
    isAuthenticated: status === "authenticated" && !!session?.user,
    isLoading: status === "loading",
    session,
    refreshSession: update,
  };
}

/**
 * Helper hook to automatically logout when user query returns null
 * This happens when the session is invalid but next-auth still thinks user is authenticated
 * @param user - The user object from Convex query (can be undefined, null, or the user)
 */
export function useAutoLogoutOnInvalidUser(user: unknown) {
  const router = useRouter();

  useEffect(() => {
    // If user is explicitly null (not undefined which means loading),
    // it means the query completed but user was not found in database
    if (user === null) {
      // Session exists in next-auth but user not found in Convex
      // This indicates an invalid/expired session
      signOut({ callbackUrl: "/login", redirect: false }).then(() => {
        router.push("/login");
      });
    }
  }, [user, router]);
}
