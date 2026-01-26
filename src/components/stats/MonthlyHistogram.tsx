"use client";

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
import type { MonthlyAggregation } from "@/types";

interface MonthlyHistogramProps {
  data: MonthlyAggregation[];
  className?: string;
}

/**
 * Bar chart component for displaying monthly spending trends
 * Uses recharts for responsive, accessible visualization
 */
export function MonthlyHistogram({ data, className = "" }: MonthlyHistogramProps) {
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
        <div className="rounded-lg bg-white p-3 shadow-lg border border-gray-200">
          <p className="font-medium text-gray-900">{item.fullLabel}</p>
          <p className="text-sm text-gray-600">{formatCurrency(item.total)}</p>
          <p className="text-xs text-gray-500">
            {item.count} transaction{item.count !== 1 ? "s" : ""}
          </p>
        </div>
      );
    }
    return null;
  };

  // Calculate stats
  const totalAmount = data.reduce((sum, item) => sum + item.total, 0);
  const averageAmount = data.length > 0 ? totalAmount / data.length : 0;
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

  return (
    <div className={`w-full ${className}`}>
      <div className="h-64 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
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

      {/* Summary Stats */}
      <div className="mt-4 grid grid-cols-2 gap-4 text-center">
        <div>
          <p className="text-lg font-semibold text-gray-900">
            {formatCurrency(averageAmount)}
          </p>
          <p className="text-xs text-gray-500">Monthly average</p>
        </div>
        <div>
          <p className="text-lg font-semibold text-gray-900">
            {formatCurrency(totalAmount)}
          </p>
          <p className="text-xs text-gray-500">Total ({data.length} months)</p>
        </div>
      </div>
    </div>
  );
}
