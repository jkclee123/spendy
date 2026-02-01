"use client";

import { useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

/**
 * Language context interface
 */
export interface LanguageContext {
  lang: "en" | "zh-HK";
  userPreference: "system" | "en" | "zh-HK";
  setUserPreference: (lang: "system" | "en" | "zh-HK") => Promise<void>;
  isLoading: boolean;
}

/**
 * Detect browser language and resolve to supported locale
 */
function detectBrowserLanguage(): "en" | "zh-HK" {
  if (typeof window === "undefined") {
    return "en";
  }

  const browserLang = navigator.language || "en";

  // If browser language starts with "zh", use Traditional Chinese
  if (browserLang.startsWith("zh")) {
    return "zh-HK";
  }

  // Default to English
  return "en";
}

/**
 * Hook to manage user language preference with automatic browser detection
 * 
 * Behavior:
 * - If user.lang is "system" or undefined: detect from browser (navigator.language)
 * - If user.lang is "en" or "zh-HK": use that preference
 * - Persists changes to Convex user record
 * 
 * @returns LanguageContext with current language, user preference, and setter
 */
export function useLanguage(): LanguageContext {
  const { data: session } = useSession();
  const updateLanguageMutation = useMutation(api.users.updateLanguage);

  // Get the user from Convex by email
  const user = useQuery(
    api.users.getByEmail,
    session?.user?.email ? { email: session.user.email } : "skip"
  );

  // Determine user preference (defaults to "system" if not set)
  const userPreference = useMemo(() => {
    if (!user) return "system";
    return (user.lang as "system" | "en" | "zh-HK" | undefined) || "system";
  }, [user]);

  // Resolve the actual language to use
  const lang = useMemo(() => {
    if (userPreference === "system") {
      return detectBrowserLanguage();
    }
    return userPreference as "en" | "zh-HK";
  }, [userPreference]);

  // Update user preference in Convex
  const setUserPreference = useCallback(
    async (newLang: "system" | "en" | "zh-HK") => {
      if (!user?._id) {
        throw new Error("User not found");
      }

      await updateLanguageMutation({
        userId: user._id as Id<"users">,
        lang: newLang,
      });
    },
    [user?._id, updateLanguageMutation]
  );

  return {
    lang,
    userPreference,
    setUserPreference,
    isLoading: user === undefined,
  };
}
