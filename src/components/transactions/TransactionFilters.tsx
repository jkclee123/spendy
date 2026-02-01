"use client";

import { useState, useCallback, useMemo } from "react";
import { useQuery } from "convex/react";
import { useTranslations, useLocale } from "next-intl";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import type { UserCategory } from "@/types";
import { Button } from "@/components/ui/Button";

export interface TransactionFiltersState {
  category?: string;
  startDate?: number;
  endDate?: number;
}

interface TransactionFiltersProps {
  userId: Id<"users">;
  filters: TransactionFiltersState;
  onFiltersChange: (filters: TransactionFiltersState) => void;
  onClearFilters: () => void;
}

/**
 * Filter controls for transaction list
 * Supports date range, category, and amount range filtering
 */
export function TransactionFilters({
  userId,
  filters,
  onFiltersChange,
  onClearFilters,
}: TransactionFiltersProps) {
  const t = useTranslations("transactions.filters");
  const locale = useLocale();
  const [isExpanded, setIsExpanded] = useState(false);

  // Fetch user categories
  const categories = useQuery(api.userCategories.listActiveByUser, { userId });

  // Get localized category name based on current language
  const getLocalizedName = useCallback((category: UserCategory): string => {
    if (locale === "en") {
      return category.en_name || category.zh_name || "Unnamed";
    } else {
      return category.zh_name || category.en_name || "未命名";
    }
  }, [locale]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.category) count++;
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


  return (
    <div className={`rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 hover:border-gray-200 dark:hover:border-gray-700 p-3`}>
      {/* Filter toggle button */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex min-h-[44px] w-full items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <svg
            className="h-5 w-5 text-gray-500 dark:text-gray-400"
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
          <span className="font-medium text-gray-700 dark:text-gray-300">{t("title")}</span>
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-blue-500 px-2 py-0.5 text-xs font-medium text-white">
              {activeFilterCount}
            </span>
          )}
        </div>
        <svg
          className={`h-5 w-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""
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
              className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {t("category")}
            </label>
            <select
              id="filter-category"
              value={filters.category || ""}
              onChange={handleCategoryChange}
              className="min-h-[44px] w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" className="text-gray-600 dark:text-gray-400">{t("allCategories")}</option>
              {categories?.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.emoji} {getLocalizedName(category)}
                </option>
              ))}
            </select>
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
              {t("clearAll")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
