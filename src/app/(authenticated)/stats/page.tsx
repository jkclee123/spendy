"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { useSession } from "next-auth/react";
import { ChevronDown } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ExpensesRatio } from "@/components/stats/CategoryPieChart";
import { MonthlyHistogram } from "@/components/stats/MonthlyHistogram";
import { useAutoLogoutOnInvalidUser } from "@/hooks/useConvexWithAuth";

type ViewType = "ratio" | "recent" | "tbc";

const viewOptions: { value: ViewType; labelKey: string }[] = [
  { value: "ratio", labelKey: "spendingByCategory" },
  { value: "recent", labelKey: "recentSpending" },
  { value: "tbc", labelKey: "tbc" },
];

/**
 * Stats page with spending visualizations
 * Features real-time updates via Convex subscriptions
 */
export default function StatsPage() {
  const { data: session } = useSession();
  const t = useTranslations("stats");
  const [activeView, setActiveView] = useState<ViewType>("ratio");

  // Get user from Convex by email
  const user = useQuery(
    api.users.getByEmail,
    session?.user?.email ? { email: session.user.email } : "skip"
  );

  // Auto logout if user not found (invalid session)
  useAutoLogoutOnInvalidUser(user);

  // Loading state
  const isLoading = user === undefined;

  const handleViewChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setActiveView(e.target.value as ViewType);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t("title")}</h2>
        <div className="relative">
          <select
            value={activeView}
            onChange={handleViewChange}
            className="min-h-[36px] appearance-none rounded-lg border border-gray-300 bg-white px-3 py-1.5 pr-8 text-sm font-medium text-gray-900 transition-colors duration-200 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:border-gray-500"
          >
            {viewOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent>
            <div className="flex min-h-[50vh] items-center justify-center">
              <LoadingSpinner size="lg" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Pie Chart */}
      {!isLoading && user?._id && activeView === "ratio" && (
        <Card>
          <CardHeader>
            <CardTitle>{t("spendingByCategory")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ExpensesRatio userId={user._id} />
          </CardContent>
        </Card>
      )}

      {/* Monthly Histogram */}
      {!isLoading && user?._id && activeView === "recent" && (
        <Card>
          <CardHeader>
            <CardTitle>{t("recentSpending")}</CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyHistogram userId={user._id} monthsBack={6} />
          </CardContent>
        </Card>
      )}

      {/* TBC View */}
      {!isLoading && user?._id && activeView === "tbc" && (
        <Card>
          <CardHeader>
            <CardTitle>{t("tbc")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex min-h-[50vh] items-center justify-center text-gray-500 dark:text-gray-400">
              {t("tbcDescription")}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
