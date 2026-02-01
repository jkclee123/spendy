"use client";

import { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { NextIntlClientProvider } from "next-intl";
import { ConvexClientProvider } from "@/lib/convex";
import { ToastProvider } from "@/components/ui/Toast";

interface ProvidersProps {
  children: ReactNode;
  locale?: string;
  messages?: Record<string, unknown>;
}

/**
 * Combined providers component for the application
 * Wraps children with SessionProvider, NextIntlClientProvider, ConvexClientProvider, and ToastProvider
 */
export function Providers({ children, locale = "en", messages = {} }: ProvidersProps) {
  return (
    <SessionProvider>
      <NextIntlClientProvider locale={locale} messages={messages}>
        <ConvexClientProvider>
          <ToastProvider>{children}</ToastProvider>
        </ConvexClientProvider>
      </NextIntlClientProvider>
    </SessionProvider>
  );
}
