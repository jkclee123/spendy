"use client";

import { useState, useCallback, useRef } from "react";

interface SwipeGestureConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  disabled?: boolean;
}

interface SwipeGestureReturn {
  offset: number;
  isSwiping: boolean;
  hasSwiped: boolean;
  resetHasSwiped: () => void;
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
    onMouseDown: (e: React.MouseEvent) => void;
    onMouseMove: (e: React.MouseEvent) => void;
    onMouseUp: () => void;
    onMouseLeave: () => void;
  };
}

const SWIPE_START_THRESHOLD = 10;

/**
 * Custom hook for handling swipe gestures on elements
 * Extracted from TransactionCard swipe logic
 * 
 * @param config Configuration for swipe behavior
 * @returns Object containing offset, isSwiping state, and event handlers
 */
export function useSwipeGesture(config: SwipeGestureConfig): SwipeGestureReturn {
  const { onSwipeLeft, onSwipeRight, threshold = 80, disabled = false } = config;

  const [offset, setOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const currentOffset = useRef(0);
  const hasSwipedRef = useRef(false);

  const handleDragStart = useCallback(
    (clientX: number) => {
      if (disabled) return;
      touchStartX.current = clientX;
      setIsSwiping(true);
      hasSwipedRef.current = false;
    },
    [disabled]
  );

  const handleDragMove = useCallback(
    (clientX: number) => {
      if (disabled || touchStartX.current === null) return;

      const diff = clientX - touchStartX.current;

      // Track if user has actually swiped (moved past threshold)
      if (Math.abs(diff) > SWIPE_START_THRESHOLD) {
        hasSwipedRef.current = true;
      }

      // Allow swiping in both directions with limits
      const newOffset = Math.max(-150, Math.min(150, diff));
      currentOffset.current = newOffset;
      setOffset(newOffset);
    },
    [disabled]
  );

  const handleDragEnd = useCallback(() => {
    if (disabled) return;

    setIsSwiping(false);
    touchStartX.current = null;

    // Check if swipe threshold was met
    if (currentOffset.current <= -threshold && onSwipeLeft) {
      onSwipeLeft();
    } else if (currentOffset.current >= threshold && onSwipeRight) {
      onSwipeRight();
    }

    // Reset position
    setOffset(0);
    currentOffset.current = 0;
  }, [disabled, threshold, onSwipeLeft, onSwipeRight]);

  // Touch event handlers
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      handleDragStart(e.touches[0].clientX);
    },
    [handleDragStart]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      handleDragMove(e.touches[0].clientX);
    },
    [handleDragMove]
  );

  const handleTouchEnd = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  // Mouse event handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      handleDragStart(e.clientX);
    },
    [handleDragStart]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      handleDragMove(e.clientX);
    },
    [handleDragMove]
  );

  const handleMouseUp = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  const handleMouseLeave = useCallback(() => {
    if (isSwiping) {
      handleDragEnd();
    }
  }, [isSwiping, handleDragEnd]);

  const resetHasSwiped = useCallback(() => {
    hasSwipedRef.current = false;
  }, []);

  return {
    offset,
    isSwiping,
    hasSwiped: hasSwipedRef.current,
    resetHasSwiped,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseLeave,
    },
  };
}
