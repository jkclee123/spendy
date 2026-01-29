"use client";

import { useState, useCallback, useRef } from "react";
import type { Transaction } from "@/types";

interface TransactionCardProps {
  transaction: Transaction;
  onClick?: (transaction: Transaction) => void;
  onDelete?: (transaction: Transaction) => void;
}

const SWIPE_THRESHOLD = 80;
const SWIPE_START_THRESHOLD = 10;

/**
 * Displays a single transaction in a card format
 * Shows amount, category, payment method, date, and source
 * Supports swipe-to-delete from right to left
 */
export function TransactionCard({
  transaction,
  onClick,
  onDelete,
}: TransactionCardProps) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const currentOffset = useRef(0);
  const hasSwipedRef = useRef(false);

  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(transaction.amount);

  const date = new Date(transaction.createdAt);
  const formattedDate = `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}, ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;

  // Shared drag handler functions
  const handleDragStart = useCallback((clientX: number) => {
    touchStartX.current = clientX;
    setIsSwiping(true);
    hasSwipedRef.current = false;
  }, []);

  const handleDragMove = useCallback((clientX: number) => {
    if (touchStartX.current === null) return;

    const diff = clientX - touchStartX.current;

    // Track if user has actually swiped (moved past threshold)
    if (Math.abs(diff) > SWIPE_START_THRESHOLD) {
      hasSwipedRef.current = true;
    }

    // Only allow swiping left (negative values)
    const newOffset = Math.min(0, Math.max(-150, diff));
    currentOffset.current = newOffset;
    setSwipeOffset(newOffset);
  }, []);

  const handleDragEnd = useCallback(() => {
    setIsSwiping(false);
    touchStartX.current = null;

    // If swiped past threshold, trigger delete
    if (currentOffset.current <= -SWIPE_THRESHOLD && onDelete) {
      const confirmed = window.confirm(
        `Delete ${formattedAmount} transaction? This action cannot be undone.`
      );
      if (confirmed) {
        onDelete(transaction);
      }
    }

    // Reset position
    setSwipeOffset(0);
    currentOffset.current = 0;
  }, [onDelete, transaction, formattedAmount]);

  // Touch event handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientX);
  }, [handleDragStart]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    handleDragMove(e.touches[0].clientX);
  }, [handleDragMove]);

  const handleTouchEnd = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  // Mouse event handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    handleDragStart(e.clientX);
  }, [handleDragStart]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    handleDragMove(e.clientX);
  }, [handleDragMove]);

  const handleMouseUp = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  const handleMouseLeave = useCallback(() => {
    if (isSwiping) {
      handleDragEnd();
    }
  }, [isSwiping, handleDragEnd]);

  const handleClick = () => {
    // Prevent click if we just performed a swipe
    if (hasSwipedRef.current) {
      hasSwipedRef.current = false;
      return;
    }

    if (!isSwiping && swipeOffset === 0) {
      onClick?.(transaction);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.(transaction);
    }
  };

  const isDeleteVisible = swipeOffset <= -SWIPE_THRESHOLD / 2;
  const deleteIconOpacity = Math.min(1, Math.abs(swipeOffset) / (SWIPE_THRESHOLD / 2));

  return (
    <div className="relative overflow-hidden">
      {/* Delete background layer */}
      <div
        className={`
          absolute inset-0 flex items-center justify-end rounded-xl
          bg-red-500 px-4 transition-opacity duration-200
          ${isDeleteVisible ? "opacity-100" : "opacity-0"}
        `}
        aria-hidden="true"
      >
        <div
          className="flex items-center gap-2 text-white"
          style={{ opacity: deleteIconOpacity }}
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          <span className="font-medium">Delete</span>
        </div>
      </div>

      {/* Card content layer */}
      <div
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        onClick={onClick ? handleClick : undefined}
        onKeyDown={onClick ? handleKeyDown : undefined}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: isSwiping ? "none" : "transform 0.3s ease-out",
        }}
        className={`
          relative flex min-h-[72px] select-none items-center justify-between rounded-xl 
          border border-gray-200 bg-gray-50 p-4
          ${onClick && swipeOffset === 0
            ? "cursor-pointer hover:border-gray-400 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            : ""
          }
          ${isSwiping ? "cursor-grabbing" : ""}
        `}
      >
        {/* Left side: Category icon and details */}
        <div className="flex items-center gap-3">
          {/* Category indicator */}
          <div className="flex items-center justify-center">
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

        {/* Right side: Amount */}
        <div className="flex flex-col items-end">
          <span className="text-lg font-semibold text-gray-900">
            {formattedAmount}
          </span>
        </div>
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

  return <span className="text-2xl">{icon}</span>;
}
