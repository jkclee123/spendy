"use client";

import { useSession, signOut } from "next-auth/react";
import { useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Tags } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { LanguageSelect } from "@/components/settings/LanguageSelect";
import { ApiTokenDisplay } from "@/components/settings/ApiTokenDisplay";
import { IosShortcutDownload } from "@/components/settings/IosShortcutDownload";
import { useLanguage } from "@/hooks/useLanguage";
import { useAutoLogoutOnInvalidUser } from "@/hooks/useConvexWithAuth";

export default function SettingsPage() {
  const { data: session } = useSession();
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const { userPreference, setUserPreference } = useLanguage();

  // Get the user from Convex by email
  const user = useQuery(
    api.users.getByEmail,
    session?.user?.email ? { email: session.user.email } : "skip"
  );

  // Auto logout if user not found (invalid session)
  useAutoLogoutOnInvalidUser(user);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  const handleLanguageChange = async (lang: "system" | "en" | "zh-HK") => {
    try {
      await setUserPreference(lang);
    } catch {}
  };

  // Loading state while fetching user
  if (user === undefined) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // User not found state
  if (user === null) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <span className="text-2xl">⚠️</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{tCommon("error")}</h3>
        <p className="mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">
          Please try logging out and logging back in.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t("title")}</h2>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t("profile")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {session?.user?.image && (
              <Image
                src={session.user.image}
                alt={session.user.name || "User"}
                width={64}
                height={64}
                className="h-16 w-16 rounded-full"
              />
            )}
            <div>
              <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {session?.user?.name || user.name}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {session?.user?.email || user.email}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Language Settings */}
      <Card>
        <CardHeader>
          <CardTitle>{t("language")}</CardTitle>
        </CardHeader>
        <CardContent>
          <LanguageSelect value={userPreference} onChange={handleLanguageChange} />
        </CardContent>
      </Card>

      {/* Management Links */}
      <Card>
        <CardContent className="p-0">
          <Link
            href="/settings/userCategory"
            className="flex min-h-[44px] items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 transition-colors hover:border-gray-400 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600 dark:hover:bg-gray-700"
          >
            <div className="flex items-center gap-3">
              <Tags className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <span className="text-gray-900 dark:text-gray-100">{t("categorySettings")}</span>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </Link>
        </CardContent>
      </Card>

      {/* API Token */}
      {user && <ApiTokenDisplay userId={user._id} />}

      {/* iOS Shortcut Download */}
      <IosShortcutDownload />

      {/* Sign Out */}
      <Card>
        <CardContent>
          <Button
            variant="outline"
            onClick={handleSignOut}
            className="w-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300"
          >
            {t("signOut")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
