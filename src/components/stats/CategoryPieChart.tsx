"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery } from "convex/react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { CategoryAggregation } from "@/types";
import type { Id } from "../../../convex/_generated/dataModel";
import { useLanguage } from "@/hooks/useLanguage";
import { useTranslations } from "next-intl";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface CategoryPieChartProps {
  userId: Id<"users">;
  className?: string;
}

// Color palette for categories - visually distinct, accessible colors
const COLORS = [
  "#DB5375", // Blush Rose
  "#FBB13C", // Honey Bronze
  "#EAC435", // Saffron
  "#BEEE62", // Green Yellow
  "#70AE6E", // Tea Green
  "#C2EABD", // Light Green
  "#06B6D4", // Cyan
  "#7C90DB", // Wisteria Blue
  "#735290", // Vintage Lavender
];

/**
 * Pie chart component for displaying Expenses ratio with month navigation
 * Uses recharts for responsive, accessible visualization
 * Features month navigation with arrows and dropdown
 */
export function ExpensesRatio({ userId, className = "" }: CategoryPieChartProps) {
  const { lang } = useLanguage();
  const t = useTranslations("stats");
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  // Month state: { year, month } where month is 0-indexed (0 = January)
  const [selectedMonth, setSelectedMonth] = useState<{ year: number; month: number }>({
    year: currentYear,
    month: currentMonth,
  });

  // Calculate date range for selected month
  const dateRange = useMemo(() => {
    const startDate = new Date(selectedMonth.year, selectedMonth.month, 1).getTime();
    const endDate = new Date(
      selectedMonth.year,
      selectedMonth.month + 1,
      0,
      23,
      59,
      59,
      999
    ).getTime();
    return { startDate, endDate };
  }, [selectedMonth]);

  // Fetch category aggregation data for selected month
  const categoryData = useQuery(
    api.transactions.aggregateByCategoryForMonth,
    userId
      ? {
          userId,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        }
      : "skip"
  );

  // Fetch earliest transaction date to determine available months
  const earliestTransactionDate = useQuery(
    api.transactions.getEarliestTransactionDate,
    userId ? { userId } : "skip"
  );

  // Generate available months (from earliest transaction to current month)
  const availableMonths = useMemo(() => {
    if (!earliestTransactionDate) {
      return [];
    }

    const earliest = new Date(earliestTransactionDate);
    const earliestYear = earliest.getFullYear();
    const earliestMonth = earliest.getMonth();

    const months: Array<{ year: number; month: number; label: string }> = [];
    const current = new Date(currentYear, currentMonth, 1);
    const start = new Date(earliestYear, earliestMonth, 1);

    for (let date = new Date(start); date <= current; date.setMonth(date.getMonth() + 1)) {
      months.push({
        year: date.getFullYear(),
        month: date.getMonth(),
        label: `${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`,
      });
    }

    return months.reverse(); // Most recent first
  }, [earliestTransactionDate, currentYear, currentMonth]);

  // Check if selected month is current month
  const isCurrentMonth = selectedMonth.year === currentYear && selectedMonth.month === currentMonth;

  // Navigate to previous month
  const goToPreviousMonth = useCallback(() => {
    setSelectedMonth((prev) => {
      if (prev.month === 0) {
        return { year: prev.year - 1, month: 11 };
      }
      return { year: prev.year, month: prev.month - 1 };
    });
  }, []);

  // Navigate to next month (disabled if current month)
  const goToNextMonth = useCallback(() => {
    if (isCurrentMonth) {
      return;
    }
    setSelectedMonth((prev) => {
      if (prev.month === 11) {
        return { year: prev.year + 1, month: 0 };
      }
      return { year: prev.year, month: prev.month + 1 };
    });
  }, [isCurrentMonth]);

  // Handle month dropdown change
  const handleMonthChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value) {
      const [year, month] = value.split("-").map(Number);
      setSelectedMonth({ year, month });
    }
  }, []);

  // Get localized category name (without emoji)
  const getCategoryLabel = useCallback(
    (item: CategoryAggregation): string => {
      if (item.en_name || item.zh_name) {
        const name = lang === "zh-HK" ? item.zh_name || item.en_name : item.en_name || item.zh_name;
        return name || t("uncategorized");
      }
      return item.category === "Uncategorized" ? t("uncategorized") : item.category;
    },
    [lang, t]
  );

  // Format data for chart with localized labels
  const chartData = useMemo(() => {
    if (!categoryData) {
      return [];
    }

    return categoryData.map((item) => ({
      ...item,
      category: getCategoryLabel(item),
    }));
  }, [categoryData, getCategoryLabel]);

  // Sort by total descending for consistent color assignment
  const sortedData = [...chartData].sort((a, b) => b.total - a.total);

  // Format currency for display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Custom tooltip content
  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{ payload: CategoryAggregation & { category: string } }>;
  }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="rounded-lg bg-white dark:bg-gray-800 p-3 shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-medium text-gray-900 dark:text-gray-100">{item.category}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {formatCurrency(item.total)} ({t("transactions", { count: item.count })})
          </p>
        </div>
      );
    }
    return null;
  };

  // Calculate total for percentage display
  const totalAmount = sortedData.reduce((sum, item) => sum + item.total, 0);

  // Loading state
  const isLoading = categoryData === undefined || earliestTransactionDate === undefined;

  // Empty state (no transactions for selected month)
  const isEmpty = !isLoading && sortedData.length === 0;

  // Format selected month label
  const selectedMonthLabel = `${String(selectedMonth.month + 1).padStart(2, "0")}/${selectedMonth.year}`;

  return (
    <div className={`w-full ${className}`}>
      {/* Month Navigation Controls */}
      <div className="mb-4 flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={goToPreviousMonth}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          aria-label={t("monthNavigation.previousMonth")}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <select
          value={`${selectedMonth.year}-${selectedMonth.month}`}
          onChange={handleMonthChange}
          className="min-h-[44px] appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2 text-center text-sm font-medium text-gray-900 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
          aria-label={t("monthNavigation.selectMonth")}
        >
          {availableMonths.map((month) => (
            <option key={`${month.year}-${month.month}`} value={`${month.year}-${month.month}`}>
              {month.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={goToNextMonth}
          disabled={isCurrentMonth}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:disabled:hover:bg-gray-800"
          aria-label={t("monthNavigation.nextMonth")}
          aria-disabled={isCurrentMonth}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Empty State */}
      {isEmpty && (
        <div className="flex h-64 flex-col items-center justify-center">
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {t("noDataForMonth", { month: selectedMonthLabel })}
          </p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {t("totalExpenses")}: {formatCurrency(0)}
          </p>
        </div>
      )}

      {/* Chart */}
      {!isLoading && !isEmpty && (
        <>
          <div className="h-64 sm:h-80 relative">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              minHeight={0}
              aspect={undefined}
            >
              <PieChart>
                <Pie
                  data={sortedData}
                  dataKey="total"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius="70%"
                  innerRadius="50%"
                  paddingAngle={2}
                  label={({ percent = 0, x, y, textAnchor, payload }) => {
                    const percentage = (percent * 100).toFixed(0);
                    if (parseInt(percentage) < 3) return null;
                    return (
                      <text
                        x={x}
                        y={y}
                        textAnchor={textAnchor}
                        fill="white"
                        fontSize={13}
                        fontWeight={600}
                      >
                        {payload.emoji} {percentage}%
                      </text>
                    );
                  }}
                  labelLine={false}
                >
                  {sortedData.map((entry, index) => (
                    <Cell
                      key={`cell-${entry.category}`}
                      fill={COLORS[index % COLORS.length]}
                      className="outline-none focus:outline-none"
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={<CustomTooltip />}
                  wrapperStyle={{ zIndex: 9999, pointerEvents: "none" }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Total Expenses Label in Center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-sm text-gray-500 dark:text-gray-400">{t("totalExpenses")}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(totalAmount)}
              </p>
            </div>
          </div>

          {/* Detailed Category List */}
          <div className="mt-6 space-y-2">
            {sortedData.map((item) => {
              const percentage = totalAmount > 0 ? (item.total / totalAmount) * 100 : 0;
              return (
                <div
                  key={item.category}
                  className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{item.emoji}</span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {item.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500 dark:text-gray-500">
                      {t("transactions", { count: item.count })}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {percentage.toFixed(0)}%
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[4rem] text-right">
                      {formatCurrency(item.total)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
