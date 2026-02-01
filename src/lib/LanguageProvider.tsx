"use client";

import { ReactNode, useMemo } from "react";
import { NextIntlClientProvider } from "next-intl";
import { useLanguage } from "@/hooks/useLanguage";
import { ToastProvider } from "@/components/ui/Toast";
import enMessages from "../../messages/en.json";
import zhHKMessages from "../../messages/zh-HK.json";

interface LanguageProviderProps {
  children: ReactNode;
}

/**
 * Language provider that detects user language and provides i18n messages
 * Must be used inside SessionProvider and ConvexClientProvider
 */
export function LanguageProvider({ children }: LanguageProviderProps) {
  const { lang } = useLanguage();

  // Detect user's timezone from browser
  const timeZone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return "UTC";
    }
  }, []);

  // Select messages based on detected language
  const messages = lang === "zh-HK" ? zhHKMessages : enMessages;

  return (
    <NextIntlClientProvider locale={lang} messages={messages} timeZone={timeZone}>
      <ToastProvider>{children}</ToastProvider>
    </NextIntlClientProvider>
  );
}
