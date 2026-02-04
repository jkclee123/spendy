"use client";

import { useQuery } from "convex/react";
import { useSession } from "next-auth/react";
import { api } from "../../../../convex/_generated/api";
import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { CategoryPieChart } from "@/components/stats/CategoryPieChart";
import { MonthlyHistogram } from "@/components/stats/MonthlyHistogram";

/**
 * Stats page with spending visualizations
 * Features real-time updates via Convex subscriptions
 */
export default function StatsPage() {
  const { data: session } = useSession();
  const t = useTranslations("stats");

  // Get user from Convex by email
  const user = useQuery(
    api.users.getByEmail,
    session?.user?.email ? { email: session.user.email } : "skip"
  );

  // Loading state
  const isLoading = user === undefined;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t("title")}</h2>
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
      {!isLoading && user?._id && (
        <Card>
          <CardHeader>
            <CardTitle>{t("spendingByCategory")}</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryPieChart userId={user._id} />
          </CardContent>
        </Card>
      )}

      {/* Monthly Histogram */}
      {!isLoading && user?._id && (
        <Card>
          <CardHeader>
            <CardTitle>{t("recentSpending")}</CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyHistogram userId={user._id} monthsBack={6} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
