"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import type { UserCategory } from "@/types";

interface CategoryEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: UserCategory;
  currentLang: "en" | "zh-HK";
  onSave: (data: { emoji: string; name: string }) => Promise<void>;
}

const COMMON_EMOJIS = [
  "🍗", "🚃", "🛒", "🏠", "💊", "🎬", "👕", "✈️",
  "☕", "🍕", "🚗", "🏋️", "📚", "💻", "🎮", "🎵",
  "🍜", "🍺", "🚌", "🏥", "🎓", "💼", "🎨", "🌮",
];

/**
 * Modal for creating/editing categories
 * - Emoji picker or text input for emoji
 * - Single name input with smart-save logic
 * - Create or Update button
 */
export function CategoryEditModal({
  isOpen,
  onClose,
  category,
  currentLang,
  onSave,
}: CategoryEditModalProps) {
  const [emoji, setEmoji] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!category;

  // Initialize form with category data
  useEffect(() => {
    if (category) {
      setEmoji(category.emoji);
      const localizedName =
        currentLang === "en"
          ? category.en_name || category.zh_name || ""
          : category.zh_name || category.en_name || "";
      setName(localizedName);
    } else {
      setEmoji("");
      setName("");
    }
    setError(null);
  }, [category, currentLang, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!emoji.trim()) {
      setError("Please select an emoji");
      return;
    }

    if (!name.trim()) {
      setError("Please enter a category name");
      return;
    }

    setIsLoading(true);

    try {
      await onSave({
        emoji: emoji.trim(),
        name: name.trim(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save category");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmojiClick = (selectedEmoji: string) => {
    setEmoji(selectedEmoji);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? "Edit Category" : "Create Category"}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Emoji picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Emoji <span className="text-red-500">*</span>
          </label>
          
          {/* Selected emoji display */}
          <div className="mb-3 flex items-center gap-3">
            <div className="text-4xl">{emoji || "❓"}</div>
            <input
              type="text"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              placeholder="Or type an emoji"
              className="flex-1 min-h-[44px] rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={2}
            />
          </div>

          {/* Emoji grid */}
          <div className="grid grid-cols-8 gap-2">
            {COMMON_EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => handleEmojiClick(e)}
                className={`
                  min-h-[44px] text-2xl rounded-lg transition-colors
                  hover:bg-gray-100 dark:hover:bg-gray-700
                  ${emoji === e ? "bg-blue-100 dark:bg-blue-900 ring-2 ring-blue-500" : ""}
                `}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Name input */}
        <div>
          <label
            htmlFor="category-name"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Name <span className="text-red-500">*</span>
          </label>
          <input
            id="category-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={currentLang === "en" ? "Category name" : "類別名稱"}
            className="w-full min-h-[44px] rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={50}
            disabled={isLoading}
          />
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {isEditMode && category
              ? currentLang === "en"
                ? "Editing English name"
                : "修改中文名稱"
              : currentLang === "en"
                ? "Name will be saved in both languages"
                : "名稱將儲存為兩種語言"}
          </p>
        </div>

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
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 min-h-[44px] rounded-xl bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? "Saving..." : isEditMode ? "Update" : "Create"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
