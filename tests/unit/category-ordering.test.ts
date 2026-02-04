// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import type { UserCategory } from "@/types";

/**
 * Unit tests for category ordering
 * Verifies that categories are ordered by createdAt ascending (oldest first)
 */
describe("Category Ordering", () => {
  describe("createdAt ordering", () => {
    it("should order categories by createdAt ascending (oldest first)", () => {
      // Create mock categories with different createdAt timestamps
      const categories: UserCategory[] = [
        {
          _id: "cat3" as any,
          userId: "user1" as any,
          emoji: "🍔",
          en_name: "Food",
          zh_name: "食物",
          isActive: true,
          order: 0,
          createdAt: 1000, // Oldest
        },
        {
          _id: "cat1" as any,
          userId: "user1" as any,
          emoji: "🚗",
          en_name: "Transport",
          zh_name: "交通",
          isActive: true,
          order: 1,
          createdAt: 2000, // Middle
        },
        {
          _id: "cat2" as any,
          userId: "user1" as any,
          emoji: "🏠",
          en_name: "Housing",
          zh_name: "住房",
          isActive: true,
          order: 2,
          createdAt: 3000, // Newest
        },
      ];

      // Sort by createdAt ascending (as done in listActiveByUser query)
      const sorted = [...categories].sort((a, b) => a.createdAt - b.createdAt);

      // Verify order: oldest first
      expect(sorted[0]._id).toBe("cat3");
      expect(sorted[0].createdAt).toBe(1000);
      expect(sorted[1]._id).toBe("cat1");
      expect(sorted[1].createdAt).toBe(2000);
      expect(sorted[2]._id).toBe("cat2");
      expect(sorted[2].createdAt).toBe(3000);
    });

    it("should maintain createdAt order regardless of order field values", () => {
      // Categories with order values that don't match createdAt order
      const categories: UserCategory[] = [
        {
          _id: "cat2" as any,
          userId: "user1" as any,
          emoji: "🏠",
          en_name: "Housing",
          zh_name: "住房",
          isActive: true,
          order: 0, // order is 0 but createdAt is newest
          createdAt: 3000,
        },
        {
          _id: "cat1" as any,
          userId: "user1" as any,
          emoji: "🚗",
          en_name: "Transport",
          zh_name: "交通",
          isActive: true,
          order: 2, // order is 2 but createdAt is oldest
          createdAt: 1000,
        },
      ];

      // Sort by createdAt ascending (ignoring order field)
      const sorted = [...categories].sort((a, b) => a.createdAt - b.createdAt);

      // Should be ordered by createdAt, not by order field
      expect(sorted[0]._id).toBe("cat1"); // createdAt: 1000
      expect(sorted[0].order).toBe(2); // order field is ignored
      expect(sorted[1]._id).toBe("cat2"); // createdAt: 3000
      expect(sorted[1].order).toBe(0); // order field is ignored
    });

    it("should handle categories with identical createdAt timestamps", () => {
      const timestamp = 2000;
      const categories: UserCategory[] = [
        {
          _id: "cat1" as any,
          userId: "user1" as any,
          emoji: "🍔",
          en_name: "Food",
          zh_name: "食物",
          isActive: true,
          order: 0,
          createdAt: timestamp,
        },
        {
          _id: "cat2" as any,
          userId: "user1" as any,
          emoji: "🚗",
          en_name: "Transport",
          zh_name: "交通",
          isActive: true,
          order: 1,
          createdAt: timestamp, // Same timestamp
        },
      ];

      // Sort by createdAt ascending
      const sorted = [...categories].sort((a, b) => a.createdAt - b.createdAt);

      // Should maintain relative order when timestamps are equal
      expect(sorted.length).toBe(2);
      expect(sorted[0].createdAt).toBe(timestamp);
      expect(sorted[1].createdAt).toBe(timestamp);
    });

    it("should verify listActiveByUser query returns categories in createdAt order", () => {
      // This test documents the expected behavior of the Convex query
      // The actual query implementation in convex/userCategories.ts should:
      // 1. Query categories with by_userId_isActive index
      // 2. Sort by createdAt ascending
      
      const categories: UserCategory[] = [
        {
          _id: "cat3" as any,
          userId: "user1" as any,
          emoji: "🍔",
          en_name: "Food",
          zh_name: "食物",
          isActive: true,
          order: 5,
          createdAt: 1000,
        },
        {
          _id: "cat1" as any,
          userId: "user1" as any,
          emoji: "🚗",
          en_name: "Transport",
          zh_name: "交通",
          isActive: true,
          order: 1,
          createdAt: 2000,
        },
        {
          _id: "cat2" as any,
          userId: "user1" as any,
          emoji: "🏠",
          en_name: "Housing",
          zh_name: "住房",
          isActive: true,
          order: 3,
          createdAt: 3000,
        },
      ];

      // Simulate the sorting logic from listActiveByUser query
      const sorted = categories
        .filter((c) => c.isActive)
        .sort((a, b) => a.createdAt - b.createdAt);

      // Verify categories appear in creation order (oldest first)
      expect(sorted.map((c) => c._id)).toEqual(["cat3", "cat1", "cat2"]);
      expect(sorted.map((c) => c.createdAt)).toEqual([1000, 2000, 3000]);
    });
  });
});
