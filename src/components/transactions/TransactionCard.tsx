"use client";

import { useLocale, useTranslations } from "next-intl";
import { SwipeableCard } from "@/components/ui/SwipeableCard";
import type { TransactionWithCategory } from "@/types";

interface TransactionCardProps {
  transaction: TransactionWithCategory;
  onClick?: (transaction: TransactionWithCategory) => void;
  onDelete?: (transaction: TransactionWithCategory) => void;
}

/**
 * Displays a single transaction in a card format
 * Shows amount, category and date
 * Supports swipe-to-delete from right to left
 * Uses SwipeableCard for consistent swipe behavior
 */
export function TransactionCard({ transaction, onClick, onDelete }: TransactionCardProps) {
  const locale = useLocale();
  const t = useTranslations("transactions");
  const tCommon = useTranslations("common");

  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(transaction.amount);

  // Format time only (HH:mm)
  const date = new Date(transaction.createdAt);
  const formattedTime = `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;

  // Get category name based on current locale
  const getCategoryName = (): string => {
    if (transaction.name) {
      return transaction.name;
    }

    if (!transaction.categoryData) {
      return t("uncategorized");
    }

    // Use locale-specific name, fallback to the other language if not available
    if (locale === "zh-HK") {
      return (
        transaction.categoryData.zh_name || transaction.categoryData.en_name || t("uncategorized")
      );
    }

    // Default to English for 'en' and other locales
    return (
      transaction.categoryData.en_name || transaction.categoryData.zh_name || t("uncategorized")
    );
  };

  const handleSwipeAction = () => {
    const confirmMessage = `${t("deleteConfirmTitle")}\n\n${t("deleteConfirmMessage", { amount: formattedAmount })}`;
    const confirmed = window.confirm(confirmMessage);
    if (confirmed && onDelete) {
      onDelete(transaction);
    }
  };

  const handleClick = () => {
    onClick?.(transaction);
  };

  return (
    <SwipeableCard
      onSwipeAction={handleSwipeAction}
      actionLabel={tCommon("delete")}
      actionColor="red"
      onClick={onClick ? handleClick : undefined}
      disabled={!onDelete}
    >
      {/* Left side: Category icon and details */}
      <div className="flex items-center gap-3">
        {/* Category indicator */}
        <div className="flex items-center justify-center">
          <CategoryIcon categoryData={transaction.categoryData} />
        </div>

        {/* Transaction details */}
        <div className="flex flex-col">
          <span className="font-medium text-gray-900 dark:text-gray-100">{getCategoryName()}</span>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <time dateTime={new Date(transaction.createdAt).toISOString()}>{formattedTime}</time>
          </div>
        </div>
      </div>

      {/* Right side: Amount */}
      <div className="flex flex-col items-end">
        <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {transaction.type === "expense" ? "-" : "+"}
          {formattedAmount}
        </span>
      </div>
    </SwipeableCard>
  );
}

/**
 * Icon based on transaction category
 * Uses emoji from the UserCategory object
 */
function CategoryIcon({ categoryData }: { categoryData?: { emoji: string } | null }) {
  const icon = categoryData?.emoji || "💰";

  return <span className="text-2xl">{icon}</span>;
}
