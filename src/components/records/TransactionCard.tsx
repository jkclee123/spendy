"use client";

import { formatDistanceToNow } from "date-fns";
import type { Transaction } from "@/types";

interface TransactionCardProps {
  transaction: Transaction;
  onClick?: (transaction: Transaction) => void;
}

/**
 * Displays a single transaction in a card format
 * Shows amount, category, payment method, date, and source
 */
export function TransactionCard({
  transaction,
  onClick,
}: TransactionCardProps) {
  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(transaction.amount);

  const formattedDate = formatDistanceToNow(new Date(transaction.createdAt), {
    addSuffix: true,
  });

  const absoluteDate = new Date(transaction.createdAt).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );

  const handleClick = () => {
    onClick?.(transaction);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.(transaction);
    }
  };

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick ? handleClick : undefined}
      onKeyDown={onClick ? handleKeyDown : undefined}
      className={`
        flex min-h-[72px] items-center justify-between rounded-xl border border-gray-100 bg-white p-4
        transition-all duration-200
        ${
          onClick
            ? "cursor-pointer hover:border-gray-200 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            : ""
        }
      `}
    >
      {/* Left side: Category icon and details */}
      <div className="flex items-center gap-3">
        {/* Category indicator */}
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
          <CategoryIcon category={transaction.category} />
        </div>

        {/* Transaction details */}
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">
            {transaction.category || "Uncategorized"}
          </span>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <time dateTime={new Date(transaction.createdAt).toISOString()} title={absoluteDate}>
              {formattedDate}
            </time>
            {transaction.paymentMethod && (
              <>
                <span>•</span>
                <span>{transaction.paymentMethod}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right side: Amount and source badge */}
      <div className="flex flex-col items-end">
        <span className="text-lg font-semibold text-gray-900">
          {formattedAmount}
        </span>
        <SourceBadge source={transaction.source} />
      </div>
    </div>
  );
}

/**
 * Icon based on transaction category
 */
function CategoryIcon({ category }: { category?: string }) {
  const iconMap: Record<string, string> = {
    "Food & Dining": "🍔",
    Transport: "🚗",
    Shopping: "🛍️",
    Entertainment: "🎬",
    "Bills & Utilities": "💡",
    Health: "💊",
    Other: "📦",
  };

  const icon = category ? iconMap[category] || "💰" : "💰";

  return <span className="text-lg">{icon}</span>;
}

/**
 * Badge showing transaction source (API or Web)
 */
function SourceBadge({ source }: { source: "api" | "web" }) {
  const isApi = source === "api";

  return (
    <span
      className={`
        mt-1 rounded-full px-2 py-0.5 text-xs font-medium
        ${
          isApi
            ? "bg-purple-100 text-purple-700"
            : "bg-blue-100 text-blue-700"
        }
      `}
    >
      {isApi ? "API" : "Web"}
    </span>
  );
}
