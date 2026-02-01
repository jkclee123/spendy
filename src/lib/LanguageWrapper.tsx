"use client";

import { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { ConvexClientProvider } from "@/lib/convex";
import { LanguageProvider } from "@/lib/LanguageProvider";

interface LanguageWrapperProps {
  children: ReactNode;
}

/**
 * Client component that wraps the app with session and language-aware providers
 * Provides session first, then detects language and wraps with i18n provider
 */
export function LanguageWrapper({ children }: LanguageWrapperProps) {
  return (
    <SessionProvider>
      <ConvexClientProvider>
        <LanguageProvider>{children}</LanguageProvider>
      </ConvexClientProvider>
    </SessionProvider>
  );
}
