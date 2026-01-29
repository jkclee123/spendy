"use client";

import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { DEFAULT_CATEGORIES } from "@/types";

export interface TransactionFiltersState {
  category?: string;
  startDate?: number;
  endDate?: number;
}

interface TransactionFiltersProps {
  filters: TransactionFiltersState;
  onFiltersChange: (filters: TransactionFiltersState) => void;
  onClearFilters: () => void;
}

/**
 * Filter controls for transaction list
 * Supports date range, category, and amount range filtering
 */
export function TransactionFilters({
  filters,
  onFiltersChange,
  onClearFilters,
}: TransactionFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.category) count++;
    if (filters.startDate) count++;
    if (filters.endDate) count++;
    return count;
  }, [filters]);

  const handleCategoryChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      onFiltersChange({
        ...filters,
        category: value || undefined,
      });
    },
    [filters, onFiltersChange]
  );

  const handleStartDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      onFiltersChange({
        ...filters,
        startDate: value ? new Date(value).getTime() : undefined,
      });
    },
    [filters, onFiltersChange]
  );

  const handleEndDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      // Set to end of day for inclusive range
      const date = value ? new Date(value) : undefined;
      if (date) {
        date.setHours(23, 59, 59, 999);
      }
      onFiltersChange({
        ...filters,
        endDate: date ? date.getTime() : undefined,
      });
    },
    [filters, onFiltersChange]
  );



  // Convert timestamps back to date strings for input values
  const startDateValue = filters.startDate
    ? new Date(filters.startDate).toISOString().split("T")[0]
    : "";
  const endDateValue = filters.endDate
    ? new Date(filters.endDate).toISOString().split("T")[0]
    : "";

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      {/* Filter toggle button */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex min-h-[44px] w-full items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <svg
            className="h-5 w-5 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          <span className="font-medium text-gray-700">Filters</span>
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-blue-500 px-2 py-0.5 text-xs font-medium text-white">
              {activeFilterCount}
            </span>
          )}
        </div>
        <svg
          className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${
            isExpanded ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Filter fields */}
      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* Category filter */}
          <div>
            <label
              htmlFor="filter-category"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Category
            </label>
            <select
              id="filter-category"
              value={filters.category || ""}
              onChange={handleCategoryChange}
              className="min-h-[44px] w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" className="text-gray-600">All categories</option>
              {DEFAULT_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Date range filter */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="filter-start-date"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                From
              </label>
              <input
                type="date"
                id="filter-start-date"
                value={startDateValue}
                onChange={handleStartDateChange}
                placeholder="Select start date"
                className="min-h-[44px] w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label
                htmlFor="filter-end-date"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                To
              </label>
              <input
                type="date"
                id="filter-end-date"
                value={endDateValue}
                onChange={handleEndDateChange}
                placeholder="Select end date"
                className="min-h-[44px] w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Clear filters button */}
          {activeFilterCount > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="w-full"
            >
              Clear all filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
