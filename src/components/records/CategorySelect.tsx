"use client";

import { forwardRef, SelectHTMLAttributes } from "react";
import { DEFAULT_CATEGORIES } from "@/types";

interface CategorySelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  error?: string;
  label?: string;
}

export const CategorySelect = forwardRef<
  HTMLSelectElement,
  CategorySelectProps
>(({ className = "", error, label, id, ...props }, ref) => {
  const selectId = id || "category-select";

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="mb-1.5 block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={`
          w-full rounded-xl border px-4 py-3 text-base
          transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500
          ${
            error
              ? "border-red-500 focus:ring-red-500"
              : "border-gray-300 hover:border-gray-400"
          }
          ${className}
        `}
        {...props}
      >
        <option value="">Select a category</option>
        {DEFAULT_CATEGORIES.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>
      {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
    </div>
  );
});

CategorySelect.displayName = "CategorySelect";
