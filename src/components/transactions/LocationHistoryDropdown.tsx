"use client";

import { forwardRef, SelectHTMLAttributes } from "react";
import { MapPin, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Id } from "../../../convex/_generated/dataModel";
import type { LocationHistoryWithDistance } from "@/hooks/useNearbyLocations";

interface LocationHistoryDropdownProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children" | "value" | "onChange"> {
  locations: LocationHistoryWithDistance[];
  value?: Id<"locationHistories">;
  onChange: (locationId: Id<"locationHistories"> | undefined) => void;
  disabled?: boolean;
  label?: string;
}

/**
 * Format distance for display
 * Shows meters if < 1000m, otherwise kilometers with 1 decimal
 */
function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

/**
 * Dropdown for selecting nearby location histories
 * - Displays location name and distance
 * - Sorted by distance (closest first)
 * - First option (closest) can be auto-selected by parent
 */
export const LocationHistoryDropdown = forwardRef<
  HTMLSelectElement,
  LocationHistoryDropdownProps
>(({ locations, value, onChange, disabled, label, className = "", id, ...props }, ref) => {
  const t = useTranslations("transactions");
  const selectId = id || "location-dropdown";
  const hasValue = value && value !== "";

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    onChange(newValue ? (newValue as Id<"locationHistories">) : undefined);
  };

  // Don't render if no nearby locations
  if (locations.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
          <MapPin className="h-4 w-4" />
        </div>
        <select
          ref={ref}
          id={selectId}
          value={value || ""}
          onChange={handleChange}
          disabled={disabled}
          className={`
            min-h-[44px] w-full appearance-none rounded-xl border pl-10 pr-10 py-3 text-base
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500
            dark:disabled:bg-gray-700 dark:disabled:text-gray-400
            border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500
            ${
              hasValue
                ? "text-gray-900 bg-white dark:text-gray-100 dark:bg-gray-800"
                : "text-gray-500 bg-white dark:text-gray-400 dark:bg-gray-800"
            }
            ${className}
          `}
          {...props}
        >
          <option value="">{t("selectLocation")}</option>
          {locations.map((location) => (
            <option key={location._id} value={location._id}>
              {location.name || t("unnamedLocation")} ({formatDistance(location.distance)})
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
          <ChevronDown className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
});

LocationHistoryDropdown.displayName = "LocationHistoryDropdown";
