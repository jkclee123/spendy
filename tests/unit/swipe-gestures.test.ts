// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";

describe("useSwipeGesture", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("left-swipe behavior", () => {
    it("should trigger onSwipeLeft callback when swiping left past threshold", () => {
      const onSwipeLeft = vi.fn();
      const { result } = renderHook(() =>
        useSwipeGesture({
          onSwipeLeft,
          threshold: 80,
        })
      );

      // Simulate touch start
      act(() => {
        result.current.handlers.onTouchStart({
          touches: [{ clientX: 100 }],
        } as unknown as React.TouchEvent);
      });

      // Simulate touch move (swipe left)
      act(() => {
        result.current.handlers.onTouchMove({
          touches: [{ clientX: 10 }], // 90px left
        } as unknown as React.TouchEvent);
      });

      // Simulate touch end
      act(() => {
        result.current.handlers.onTouchEnd();
      });

      expect(onSwipeLeft).toHaveBeenCalledTimes(1);
    });

    it("should not trigger onSwipeLeft callback when swipe distance is below threshold", () => {
      const onSwipeLeft = vi.fn();
      const { result } = renderHook(() =>
        useSwipeGesture({
          onSwipeLeft,
          threshold: 80,
        })
      );

      // Simulate touch start
      act(() => {
        result.current.handlers.onTouchStart({
          touches: [{ clientX: 100 }],
        } as unknown as React.TouchEvent);
      });

      // Simulate touch move (small swipe left, below threshold)
      act(() => {
        result.current.handlers.onTouchMove({
          touches: [{ clientX: 50 }], // 50px left (below 80px threshold)
        } as unknown as React.TouchEvent);
      });

      // Simulate touch end
      act(() => {
        result.current.handlers.onTouchEnd();
      });

      expect(onSwipeLeft).not.toHaveBeenCalled();
    });
  });

  describe("right-swipe behavior (should be disabled)", () => {
    it("should not accept onSwipeRight in config interface", () => {
      // TypeScript should prevent this, but we verify runtime behavior
      const onSwipeRight = vi.fn();
      const { result } = renderHook(() =>
        useSwipeGesture({
          onSwipeLeft: vi.fn(),
          // @ts-expect-error - onSwipeRight should not exist in interface
          onSwipeRight,
          threshold: 80,
        })
      );

      // Simulate touch start
      act(() => {
        result.current.handlers.onTouchStart({
          touches: [{ clientX: 100 }],
        } as unknown as React.TouchEvent);
      });

      // Simulate touch move (swipe right)
      act(() => {
        result.current.handlers.onTouchMove({
          touches: [{ clientX: 200 }], // 100px right
        } as unknown as React.TouchEvent);
      });

      // Simulate touch end
      act(() => {
        result.current.handlers.onTouchEnd();
      });

      // Even if onSwipeRight is passed (shouldn't be possible with proper types),
      // it should not be called
      expect(onSwipeRight).not.toHaveBeenCalled();
    });

    it("should not trigger any action when swiping right", () => {
      const onSwipeLeft = vi.fn();
      const { result } = renderHook(() =>
        useSwipeGesture({
          onSwipeLeft,
          threshold: 80,
        })
      );

      // Simulate touch start
      act(() => {
        result.current.handlers.onTouchStart({
          touches: [{ clientX: 100 }],
        } as unknown as React.TouchEvent);
      });

      // Simulate touch move (swipe right)
      act(() => {
        result.current.handlers.onTouchMove({
          touches: [{ clientX: 200 }], // 100px right
        } as unknown as React.TouchEvent);
      });

      // Simulate touch end
      act(() => {
        result.current.handlers.onTouchEnd();
      });

      // Left swipe callback should not be triggered
      expect(onSwipeLeft).not.toHaveBeenCalled();
    });

    it("should reset offset to 0 after right-swipe without triggering action", () => {
      const { result } = renderHook(() =>
        useSwipeGesture({
          onSwipeLeft: vi.fn(),
          threshold: 80,
        })
      );

      // Simulate touch start
      act(() => {
        result.current.handlers.onTouchStart({
          touches: [{ clientX: 100 }],
        } as unknown as React.TouchEvent);
      });

      // Simulate touch move (swipe right)
      act(() => {
        result.current.handlers.onTouchMove({
          touches: [{ clientX: 200 }], // 100px right
        } as unknown as React.TouchEvent);
      });

      // Offset should be positive during right swipe
      expect(result.current.offset).toBeGreaterThan(0);

      // Simulate touch end
      act(() => {
        result.current.handlers.onTouchEnd();
      });

      // Offset should reset to 0
      expect(result.current.offset).toBe(0);
    });
  });

  describe("disabled state", () => {
    it("should not trigger callbacks when disabled", () => {
      const onSwipeLeft = vi.fn();
      const { result } = renderHook(() =>
        useSwipeGesture({
          onSwipeLeft,
          threshold: 80,
          disabled: true,
        })
      );

      // Simulate touch start
      act(() => {
        result.current.handlers.onTouchStart({
          touches: [{ clientX: 100 }],
        } as unknown as React.TouchEvent);
      });

      // Simulate touch move (swipe left)
      act(() => {
        result.current.handlers.onTouchMove({
          touches: [{ clientX: 10 }], // 90px left
        } as unknown as React.TouchEvent);
      });

      // Simulate touch end
      act(() => {
        result.current.handlers.onTouchEnd();
      });

      expect(onSwipeLeft).not.toHaveBeenCalled();
    });
  });

  describe("mouse event handlers", () => {
    it("should handle mouse drag for left-swipe", () => {
      const onSwipeLeft = vi.fn();
      const { result } = renderHook(() =>
        useSwipeGesture({
          onSwipeLeft,
          threshold: 80,
        })
      );

      // Simulate mouse down
      act(() => {
        result.current.handlers.onMouseDown({
          clientX: 100,
        } as React.MouseEvent);
      });

      // Simulate mouse move (swipe left)
      act(() => {
        result.current.handlers.onMouseMove({
          clientX: 10, // 90px left
        } as React.MouseEvent);
      });

      // Simulate mouse up
      act(() => {
        result.current.handlers.onMouseUp();
      });

      expect(onSwipeLeft).toHaveBeenCalledTimes(1);
    });

    it("should not trigger action on right mouse drag", () => {
      const onSwipeLeft = vi.fn();
      const { result } = renderHook(() =>
        useSwipeGesture({
          onSwipeLeft,
          threshold: 80,
        })
      );

      // Simulate mouse down
      act(() => {
        result.current.handlers.onMouseDown({
          clientX: 100,
        } as React.MouseEvent);
      });

      // Simulate mouse move (swipe right)
      act(() => {
        result.current.handlers.onMouseMove({
          clientX: 200, // 100px right
        } as React.MouseEvent);
      });

      // Simulate mouse up
      act(() => {
        result.current.handlers.onMouseUp();
      });

      expect(onSwipeLeft).not.toHaveBeenCalled();
    });
  });
});
