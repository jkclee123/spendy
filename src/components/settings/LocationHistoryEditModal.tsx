"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { CategoryDropdown } from "@/components/ui/CategoryDropdown";
import type { LocationHistory, UserCategory } from "@/types";
import type { Id } from "../../../convex/_generated/dataModel";

interface LocationHistoryEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationHistory: LocationHistory;
  categories: UserCategory[];
  currentLang: "en" | "zh-HK";
  onSave: (data: {
    name?: string;
    amount?: number;
    category?: Id<"userCategories">;
  }) => Promise<void>;
}

/**
 * Modal for editing location histories
 * - Name text input
 * - Amount number input
 * - Category dropdown
 */
export function LocationHistoryEditModal({
  isOpen,
  onClose,
  locationHistory,
  categories,
  currentLang,
  onSave,
}: LocationHistoryEditModalProps) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<Id<"userCategories"> | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form with location history data
  useEffect(() => {
    if (locationHistory) {
      setName(locationHistory.name || "");
      setAmount(locationHistory.amount?.toString() || "");
      setCategory(locationHistory.category);
    }
    setError(null);
  }, [locationHistory, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    const parsedAmount = parseFloat(amount);
    if (amount && (isNaN(parsedAmount) || parsedAmount <= 0)) {
      setError(currentLang === "en" ? "Amount must be a positive number" : "金額必須是正數");
      return;
    }

    setIsLoading(true);

    try {
      await onSave({
        name: name.trim() || undefined,
        amount: amount ? parsedAmount : undefined,
        category,
      });
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : currentLang === "en"
            ? "Failed to save location"
            : "儲存位置失敗"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={currentLang === "en" ? "Edit Location" : "編輯位置"}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name input */}
        <div>
          <label
            htmlFor="location-name"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            {currentLang === "en" ? "Name" : "名稱"}
          </label>
          <input
            id="location-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={currentLang === "en" ? "Location name" : "位置名稱"}
            className="w-full min-h-[44px] rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={100}
            disabled={isLoading}
          />
        </div>

        {/* Amount input */}
        <div>
          <label
            htmlFor="location-amount"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            {currentLang === "en" ? "Default Amount" : "預設金額"}
          </label>
          <input
            id="location-amount"
            type="number"
            inputMode="decimal"
            step="any"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full min-h-[44px] rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
        </div>

        {/* Category dropdown */}
        <CategoryDropdown
          categories={categories}
          value={category}
          onChange={setCategory}
          placeholder={currentLang === "en" ? "Select a category" : "選擇類別"}
          label={currentLang === "en" ? "Category" : "類別"}
          currentLang={currentLang}
          disabled={isLoading}
        />

        {/* Error message */}
        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 min-h-[44px] rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
          >
            {currentLang === "en" ? "Cancel" : "取消"}
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 min-h-[44px] rounded-xl bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading
              ? currentLang === "en"
                ? "Saving..."
                : "儲存中..."
              : currentLang === "en"
                ? "Save"
                : "儲存"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
