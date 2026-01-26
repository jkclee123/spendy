"use client";

import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { DEFAULT_CATEGORIES } from "@/types";

export interface TransactionFiltersState {
  category?: string;
  startDate?: number;
  endDate?: number;
  minAmount?: number;
  maxAmount?: number;
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
    if (filters.minAmount !== undefined) count++;
    if (filters.maxAmount !== undefined) count++;
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

  const handleMinAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      onFiltersChange({
        ...filters,
        minAmount: value ? parseFloat(value) : undefined,
      });
    },
    [filters, onFiltersChange]
  );

  const handleMaxAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      onFiltersChange({
        ...filters,
        maxAmount: value ? parseFloat(value) : undefined,
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
        className="flex w-full items-center justify-between text-left"
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
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All categories</option>
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
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Amount range filter */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="filter-min-amount"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Min Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  $
                </span>
                <input
                  type="number"
                  id="filter-min-amount"
                  min="0"
                  step="0.01"
                  value={filters.minAmount ?? ""}
                  onChange={handleMinAmountChange}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-7 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="filter-max-amount"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Max Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  $
                </span>
                <input
                  type="number"
                  id="filter-max-amount"
                  min="0"
                  step="0.01"
                  value={filters.maxAmount ?? ""}
                  onChange={handleMaxAmountChange}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-7 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
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
