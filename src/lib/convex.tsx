"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode, createContext, useContext, useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;

const convex = new ConvexReactClient(convexUrl);

/**
 * Context to track authentication errors across the app
 */
const AuthErrorContext = createContext<{
  hasAuthError: boolean;
  setHasAuthError: (value: boolean) => void;
}>({
  hasAuthError: false,
  setHasAuthError: () => {},
});

/**
 * Hook to check if there are authentication errors
 */
export function useAuthError() {
  return useContext(AuthErrorContext);
}

/**
 * Error boundary component that catches Convex authentication errors
 * and automatically logs out the user when their session becomes invalid
 */
function ConvexAuthErrorBoundary({ children }: { children: ReactNode }) {
  const [hasAuthError, setHasAuthError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (hasAuthError) {
      // Clear the error state
      setHasAuthError(false);
      // Sign out and redirect to login
      signOut({ callbackUrl: "/login", redirect: false }).then(() => {
        router.push("/login");
      });
    }
  }, [hasAuthError, router]);

  return (
    <AuthErrorContext.Provider value={{ hasAuthError, setHasAuthError }}>
      <ConvexErrorCatcher>{children}</ConvexErrorCatcher>
    </AuthErrorContext.Provider>
  );
}

/**
 * Component that catches Convex errors and checks for authentication failures
 */
function ConvexErrorCatcher({ children }: { children: ReactNode }) {
  const { setHasAuthError } = useAuthError();

  useEffect(() => {
    // Set up error handler for the Convex client
    const originalConsoleError = console.error;
    console.error = (...args: unknown[]) => {
      const errorString = args.join(" ");

      // Check for authentication-related errors
      const isAuthError =
        errorString.includes("Unauthenticated") ||
        errorString.includes("Unauthorized") ||
        errorString.includes("Could not verify token") ||
        errorString.includes("JWT") ||
        errorString.includes("token expired") ||
        errorString.includes("invalid token") ||
        errorString.includes("authentication failed");

      if (isAuthError) {
        // Trigger automatic logout
        setHasAuthError(true);
      }

      // Call original console.error
      originalConsoleError.apply(console, args);
    };

    return () => {
      console.error = originalConsoleError;
    };
  }, [setHasAuthError]);

  return <>{children}</>;
}

/**
 * Convex provider wrapper component for the application
 * Includes automatic logout on authentication errors
 */
export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProvider client={convex}>
      <ConvexAuthErrorBoundary>{children}</ConvexAuthErrorBoundary>
    </ConvexProvider>
  );
}

/**
 * Export the Convex client for direct usage if needed
 */
export { convex };
