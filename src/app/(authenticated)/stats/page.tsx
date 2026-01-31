"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { useSession } from "next-auth/react";
import { api } from "../../../../convex/_generated/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
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

  // Calculate date range based on selected time period
  const dateRange = useMemo(() => {
    const now = new Date();
    const endDate = now.getTime();
    let startDate: number;

    switch (timePeriod) {
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).getTime();
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1).getTime();
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    }

    return { startDate, endDate };
  }, [timePeriod]);

  // Fetch category aggregation data - real-time via Convex subscription
  const categoryData = useQuery(
    api.transactions.aggregateByCategory,
    user?._id
      ? {
        userId: user._id,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      }
      : "skip"
  );

  // Fetch monthly aggregation data - real-time via Convex subscription
  const monthlyData = useQuery(
    api.transactions.aggregateByMonth,
    user?._id
      ? {
        userId: user._id,
        monthsBack: timePeriod === "year" ? 12 : timePeriod === "month" ? 3 : 1,
      }
      : "skip"
  );

  // Loading state
  const isLoading = user === undefined || categoryData === undefined || monthlyData === undefined;

  // Check if there's any data to display
  const hasData = categoryData && categoryData.length > 0;
  const hasMonthlyData = monthlyData && monthlyData.length > 0;

  // Time period button styles - min 44px touch target for mobile
  const periodButtonClass = (period: TimePeriod) =>
    `min-h-[44px] min-w-[44px] px-4 py-2 text-sm font-medium rounded-lg transition-colors ${timePeriod === period
      ? "bg-blue-500 text-white"
      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
    }`;

  // Get period label for display
  const getPeriodLabel = () => {
    switch (timePeriod) {
      case "week":
        return "This Week";
      case "month":
        return "This Month";
      case "year":
        return "This Year";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with time period selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-gray-900">Stats</h2>

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

      {/* Empty State */}
      {!isLoading && !hasData && (
        <Card>
          <CardHeader>
            <CardTitle>Spending Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <svg
                  className="h-8 w-8 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                No data for {getPeriodLabel().toLowerCase()}
              </h3>
              <p className="mt-2 max-w-sm text-sm text-gray-500">
                Charts and insights will appear here once you have some transaction data.
                Try selecting a different time period or add transactions via the API.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => window.location.href = "/settings"}
              >
                View API Token
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Pie Chart */}
      {!isLoading && hasData && (
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <CategoryPieChart data={categoryData} />
          </CardContent>
        </Card>
      )}

      {/* Monthly Histogram */}
      {!isLoading && hasMonthlyData && (
        <Card>
          <CardHeader>
            <CardTitle>
              {timePeriod === "year" ? "Monthly Spending (12 months)" : "Recent Spending"}
            </CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <MonthlyHistogram data={monthlyData} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
