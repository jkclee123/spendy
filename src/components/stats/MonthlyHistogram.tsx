"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery } from "convex/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { api } from "../../../convex/_generated/api";
import type { MonthlyAggregation } from "@/types";
import type { Id } from "../../../convex/_generated/dataModel";
import { useLanguage } from "@/hooks/useLanguage";
import { useTranslations } from "next-intl";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface MonthlyHistogramProps {
  userId: Id<"users">;
  monthsBack?: number; // Number of months to look back (default: 6)
  className?: string;
}

/**
 * Bar chart component for displaying monthly spending trends with category filtering
 * Uses recharts for responsive, accessible visualization
 * Features category dropdown filter to show spending trends for specific categories
 */
export function MonthlyHistogram({ userId, monthsBack = 6, className = "" }: MonthlyHistogramProps) {
  const { lang } = useLanguage();
  const [selectedCategoryId, setSelectedCategoryId] = useState<Id<"userCategories"> | null>(null);

  // Fetch active categories for dropdown
  const categories = useQuery(api.userCategories.listActiveByUser, { userId });

  // Fetch monthly aggregation data with optional category filter
  const monthlyData = useQuery(
    api.transactions.aggregateByMonth,
    userId
      ? {
          userId,
          monthsBack,
          categoryId: selectedCategoryId !== null ? selectedCategoryId : undefined,
        }
      : "skip"
  );

  // Get localized category name
  const getCategoryLabel = useCallback(
    (categoryId: Id<"userCategories">): string => {
      const category = categories?.find((cat) => cat._id === categoryId);
      if (!category) return "";
      const name = lang === "zh-HK" ? category.zh_name || category.en_name : category.en_name || category.zh_name;
      return `${category.emoji} ${name || "Unnamed"}`;
    },
    [categories, lang]
  );

  // Handle category change
  const handleCategoryChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "") {
      setSelectedCategoryId(null);
    } else {
      setSelectedCategoryId(value as Id<"userCategories">);
    }
  }, []);

  // Use empty array if data is undefined (loading) or null
  const data = monthlyData || [];
  // Format currency for display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format month for display (e.g., "2026-01" -> "Jan")
  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split("-");
    const date = new Date(parseInt(year), parseInt(monthNum) - 1);
    return date.toLocaleDateString("en-US", { month: "short" });
  };

  // Format month for tooltip with year (e.g., "2026-01" -> "January 2026")
  const formatMonthFull = (month: string) => {
    const [year, monthNum] = month.split("-");
    const date = new Date(parseInt(year), parseInt(monthNum) - 1);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  // Prepare data with formatted labels
  const chartData = data.map((item) => ({
    ...item,
    label: formatMonth(item.month),
    fullLabel: formatMonthFull(item.month),
  }));

  // Custom tooltip content
  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{ payload: MonthlyAggregation & { fullLabel: string } }>;
  }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="rounded-lg bg-white dark:bg-gray-800 p-3 shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-medium text-gray-900 dark:text-gray-100">{item.fullLabel}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{formatCurrency(item.total)}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {item.count} transaction{item.count !== 1 ? "s" : ""}
          </p>
        </div>
      );
    }
    return null;
  };

  // Calculate stats
  const maxMonth = data.reduce(
    (max, item) => (item.total > max.total ? item : max),
    data[0] || { month: "", total: 0, count: 0 }
  );

  // Highlight color for highest month
  const getBarColor = (entry: MonthlyAggregation) => {
    if (entry.month === maxMonth?.month) {
      return "#3B82F6"; // Blue for highest
    }
    return "#93C5FD"; // Light blue for others
  };

  // Loading state
  const isLoading = monthlyData === undefined || categories === undefined;

  // Get selected category for display
  const selectedCategory = selectedCategoryId
    ? categories?.find((cat) => cat._id === selectedCategoryId)
    : null;

  return (
    <div className={`w-full ${className}`}>
      {/* Category Filter Dropdown */}
      <div className="mb-4 flex items-center gap-2">
        <select
          id="category-filter"
          value={selectedCategoryId || ""}
          onChange={handleCategoryChange}
          disabled={isLoading}
          className="min-h-[44px] flex-1 appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
          aria-label="Filter by category"
        >
          <option value="">All Categories</option>
          {categories?.map((category) => {
            const name = lang === "zh-HK" ? category.zh_name || category.en_name : category.en_name || category.zh_name;
            return (
              <option key={category._id} value={category._id}>
                {category.emoji} {name || "Unnamed"}
              </option>
            );
          })}
        </select>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Chart */}
      {!isLoading && (
        <div className="h-64 sm:h-80">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} aspect={undefined}>
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: "#6B7280" }}
                tickLine={false}
                axisLine={{ stroke: "#E5E7EB" }}
              />
              <YAxis
                tickFormatter={(value) => `$${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
                tick={{ fontSize: 12, fill: "#6B7280" }}
                tickLine={false}
                axisLine={false}
                width={50}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "#F3F4F6" }} />
              <Bar
                dataKey="total"
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
