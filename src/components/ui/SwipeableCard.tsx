"use client";

import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { Trash2, CheckCircle } from "lucide-react";

interface SwipeableCardProps {
  children: React.ReactNode;
  // Legacy single action props (for backward compatibility)
  onSwipeAction?: () => void;
  actionLabel?: string;
  actionColor?: "red" | "yellow" | "blue";
  // New bidirectional swipe props
  onSwipeLeftAction?: () => void;
  onSwipeRightAction?: () => void;
  leftActionLabel?: string;
  rightActionLabel?: string;
  leftActionColor?: "red" | "yellow" | "blue";
  rightActionColor?: "red" | "yellow" | "blue";
  onClick?: () => void;
  disabled?: boolean;
}

/**
 * Reusable card component with swipe-to-action gesture
 * - Swipe left reveals left action button
 * - Swipe right reveals right action button
 * - Swipe past threshold triggers onSwipeAction
 * - Extracted from TransactionCard logic
 */
export function SwipeableCard({
  children,
  onSwipeAction,
  actionLabel = "Delete",
  actionColor = "red",
  onSwipeLeftAction,
  onSwipeRightAction,
  leftActionLabel = "Delete",
  rightActionLabel = "Activate",
  leftActionColor = "red",
  rightActionColor = "blue",
  onClick,
  disabled = false,
}: SwipeableCardProps) {
  // Support both legacy single action and new bidirectional actions
  const finalOnSwipeLeft = onSwipeLeftAction || onSwipeAction;
  const finalLeftActionLabel = onSwipeLeftAction ? leftActionLabel : actionLabel;
  const finalLeftActionColor = onSwipeLeftAction ? leftActionColor : actionColor;

  const { offset, isSwiping, hasSwiped, resetHasSwiped, handlers } = useSwipeGesture({
    onSwipeLeft: finalOnSwipeLeft,
    onSwipeRight: onSwipeRightAction,
    threshold: 80,
    disabled,
  });

  const colorClasses = {
    red: "bg-red-500 dark:bg-red-600",
    yellow: "bg-yellow-500 dark:bg-yellow-600",
    blue: "bg-blue-500 dark:bg-blue-600",
  };

  const isLeftActionVisible = offset <= -40;
  const isRightActionVisible = offset >= 40;
  const leftActionOpacity = Math.min(1, Math.abs(offset) / 40);
  const rightActionOpacity = Math.min(1, Math.abs(offset) / 40);

  const handleClick = () => {
    // Prevent click if we just performed a swipe
    if (hasSwiped) {
      resetHasSwiped();
      return;
    }

    if (!isSwiping && offset === 0 && onClick) {
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === " ") && onClick) {
      e.preventDefault();
      onClick();
    }
  };

  // Build accessible description for swipe actions
  const swipeDescription = [
    finalOnSwipeLeft ? `Swipe left to ${finalLeftActionLabel.toLowerCase()}` : "",
    onSwipeRightAction ? `Swipe right to ${rightActionLabel.toLowerCase()}` : "",
  ]
    .filter(Boolean)
    .join(". ");

  return (
    <div 
      className="relative overflow-hidden"
      aria-label={swipeDescription || undefined}
    >
      {/* Left action background layer (swipe left reveals right side) */}
      {finalOnSwipeLeft && (
        <div
          className={`
            absolute inset-0 flex items-center justify-end rounded-xl
            ${colorClasses[finalLeftActionColor]} px-4 transition-opacity duration-200
            ${isLeftActionVisible ? "opacity-100" : "opacity-0"}
          `}
          aria-hidden="true"
        >
          <div
            className="flex items-center gap-2 text-white"
            style={{ opacity: leftActionOpacity }}
          >
            {finalLeftActionColor === "blue" ? (
              <CheckCircle className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Trash2 className="h-6 w-6" aria-hidden="true" />
            )}
            <span className="font-medium">{finalLeftActionLabel}</span>
          </div>
        </div>
      )}

      {/* Right action background layer (swipe right reveals left side) */}
      {onSwipeRightAction && (
        <div
          className={`
            absolute inset-0 flex items-center justify-start rounded-xl
            ${colorClasses[rightActionColor]} px-4 transition-opacity duration-200
            ${isRightActionVisible ? "opacity-100" : "opacity-0"}
          `}
          aria-hidden="true"
        >
          <div
            className="flex items-center gap-2 text-white"
            style={{ opacity: rightActionOpacity }}
          >
            <CheckCircle className="h-6 w-6" aria-hidden="true" />
            <span className="font-medium">{rightActionLabel}</span>
          </div>
        </div>
      )}

      {/* Card content layer */}
      <div
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        onClick={onClick ? handleClick : undefined}
        onKeyDown={onClick ? handleKeyDown : undefined}
        {...handlers}
        style={{
          transform: `translateX(${offset}px)`,
          transition: isSwiping ? "none" : "transform 0.3s ease-out",
        }}
        className={`
          relative flex min-h-[72px] select-none items-center justify-between rounded-xl 
          border border-gray-200 bg-gray-50 p-4
          dark:border-gray-700 dark:bg-gray-800
          ${
            onClick && offset === 0
              ? "cursor-pointer hover:border-gray-400 dark:hover:border-gray-600 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              : ""
          }
          ${isSwiping ? "cursor-grabbing" : ""}
        `}
      >
        {children}
      </div>
    </div>
  );
}
