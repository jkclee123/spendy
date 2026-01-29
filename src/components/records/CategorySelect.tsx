"use client";

import { forwardRef, SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { DEFAULT_CATEGORIES } from "@/types";

interface CategorySelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  error?: string;
  label?: string;
  required?: boolean;
}

export const CategorySelect = forwardRef<
  HTMLSelectElement,
  CategorySelectProps
>(({ className = "", error, label, required, id, value, ...props }, ref) => {
  const selectId = id || "category-select";
  const hasValue = value && value !== "";

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="mb-1.5 block text-sm font-medium text-gray-700"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          value={value}
          className={`
            min-h-[44px] w-full appearance-none rounded-xl border px-4 py-3 text-base
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500
            ${
              error
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 hover:border-gray-400"
            }
            ${
              hasValue
                ? "text-gray-900 bg-white"
                : "text-gray-500 bg-white"
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
        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
          <ChevronDown className="h-5 w-5" />
        </div>
      </div>
      {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
    </div>
  );
});

CategorySelect.displayName = "CategorySelect";
