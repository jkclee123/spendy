"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import type { CategoryAggregation } from "@/types";

interface CategoryPieChartProps {
  data: CategoryAggregation[];
  className?: string;
}

// Color palette for categories - visually distinct, accessible colors
const COLORS = [
  "#3B82F6", // Blue - Food & Dining
  "#10B981", // Emerald - Transport
  "#F59E0B", // Amber - Shopping
  "#8B5CF6", // Violet - Entertainment
  "#EF4444", // Red - Bills & Utilities
  "#EC4899", // Pink - Health
  "#6B7280", // Gray - Other
  "#06B6D4", // Cyan
  "#F97316", // Orange
  "#14B8A6", // Teal
];

/**
 * Pie chart component for displaying spending by category
 * Uses recharts for responsive, accessible visualization
 */
export function CategoryPieChart({ data, className = "" }: CategoryPieChartProps) {
  // Sort by total descending for consistent color assignment
  const sortedData = [...data].sort((a, b) => b.total - a.total);

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
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: CategoryAggregation }> }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="rounded-lg bg-white p-3 shadow-lg border border-gray-200">
          <p className="font-medium text-gray-900">{item.category}</p>
          <p className="text-sm text-gray-600">
            {formatCurrency(item.total)} ({item.count} transaction{item.count !== 1 ? "s" : ""})
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom legend formatter
  const renderLegend = (value: string, entry: { payload?: Record<string, unknown> }) => {
    const total = (entry.payload?.total as number) ?? 0;
    return (
      <span className="text-sm text-gray-700">
        {value} <span className="text-gray-500">({formatCurrency(total)})</span>
      </span>
    );
  };

  // Calculate total for percentage display
  const totalAmount = sortedData.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className={`w-full ${className}`}>
      <div className="h-64 sm:h-80">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} aspect={undefined}>
          <PieChart>
            <Pie
              data={sortedData}
              dataKey="total"
              nameKey="category"
              cx="50%"
              cy="50%"
              outerRadius="70%"
              innerRadius="40%"
              paddingAngle={2}
              label={({ percent = 0 }) => {
                return `${(percent * 100).toFixed(0)}%`;
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
            <Tooltip content={<CustomTooltip />} />
            <Legend
              layout="horizontal"
              align="center"
              verticalAlign="bottom"
              formatter={renderLegend}
              wrapperStyle={{ paddingTop: "1rem" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Summary */}
      <div className="mt-4 text-center">
        <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
        <p className="text-sm text-gray-500">Total spending</p>
      </div>
    </div>
  );
}
