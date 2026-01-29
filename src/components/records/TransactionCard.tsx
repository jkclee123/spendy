"use client";

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

  const date = new Date(transaction.createdAt);
  const formattedDate = `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}, ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;

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
        ${onClick
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
            <time dateTime={new Date(transaction.createdAt).toISOString()}>
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
      </div>
    </div>
  );
}

/**
 * Icon based on transaction category
 */
function CategoryIcon({ category }: { category?: string }) {
  const iconMap: Record<string, string> = {
    "Restaurants & Bars": "🍽️",
    Drinks: "🥤",
    Transport: "🚌",
    Entertainment: "🎢",
    Groceries: "👨🏼‍🍳",
    Accommodation: "🏨",
    Healthcare: "💊",
    Insurance: "📜",
    "Rent & Charges": "🏡",
    Shopping: "🛍️",
    Other: "❓",
  };

  const icon = category ? iconMap[category] || "💰" : "💰";

  return <span className="text-lg">{icon}</span>;
}


