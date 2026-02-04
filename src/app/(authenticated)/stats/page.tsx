"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { useSession } from "next-auth/react";
import { api } from "../../../../convex/_generated/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { CategoryPieChart } from "@/components/stats/CategoryPieChart";
import { MonthlyHistogram } from "@/components/stats/MonthlyHistogram";
import type { TimePeriod } from "@/types";

/**
 * Stats page with time period selector and spending visualizations
 * Features real-time updates via Convex subscriptions
 */
export default function StatsPage() {
  const { data: session } = useSession();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("month");

  // Get user from Convex by email
  const user = useQuery(
    api.users.getByEmail,
    session?.user?.email ? { email: session.user.email } : "skip"
  );

  // Loading state
  const isLoading = user === undefined;

  // Time period button styles - min 44px touch target for mobile
  const periodButtonClass = (period: TimePeriod) =>
    `min-h-[44px] min-w-[44px] px-4 py-2 text-sm font-medium rounded-lg transition-colors ${timePeriod === period
      ? "bg-blue-500 text-white"
      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
    }`;

  return (
    <div className="space-y-4">
      {/* Header with time period selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Stats</h2>

        {/* Time Period Selector */}
        <div className="flex gap-2">
          <button
            onClick={() => setTimePeriod("week")}
            className={periodButtonClass("week")}
            aria-pressed={timePeriod === "week"}
          >
            Week
          </button>
          <button
            onClick={() => setTimePeriod("month")}
            className={periodButtonClass("month")}
            aria-pressed={timePeriod === "month"}
          >
            Month
          </button>
          <button
            onClick={() => setTimePeriod("year")}
            className={periodButtonClass("year")}
            aria-pressed={timePeriod === "year"}
          >
            Year
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent>
            <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
              <LoadingSpinner size="lg" />
              <p className="text-sm text-gray-500">Loading...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Pie Chart */}
      {!isLoading && user?._id && (
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
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
            <CardTitle>
              {timePeriod === "year" ? "Monthly Spending (12 months)" : "Recent Spending"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyHistogram
              userId={user._id}
              monthsBack={timePeriod === "year" ? 12 : timePeriod === "month" ? 3 : 1}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
