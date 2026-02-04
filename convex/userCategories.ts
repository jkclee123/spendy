import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Get all categories for a user, ordered by active status then createdAt
 */
export const listByUser = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const categories = await ctx.db
      .query("userCategories")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("asc")
      .collect();

    // Sort: active categories first (by createdAt ASC), then inactive (by createdAt ASC)
    return categories.sort((a, b) => {
      if (a.isActive !== b.isActive) {
        return a.isActive ? -1 : 1;
      }
      return a.createdAt - b.createdAt;
    });
  },
});

/**
 * Get only active categories for a user, ordered by createdAt ascending
 */
export const listActiveByUser = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const categories = await ctx.db
      .query("userCategories")
      .withIndex("by_userId_isActive", (q) => 
        q.eq("userId", args.userId).eq("isActive", true)
      )
      .collect();

    // Sort by createdAt ascending (oldest first)
    return categories.sort((a, b) => a.createdAt - b.createdAt);
  },
});

/**
 * Get a single category by ID
 */
export const getById = query({
  args: {
    categoryId: v.id("userCategories"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.categoryId);
  },
});

/**
 * Create a new category
 */
export const create = mutation({
  args: {
    userId: v.id("users"),
    emoji: v.string(),
    name: v.string(),
    currentLang: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate language
    if (!["en", "zh-HK"].includes(args.currentLang)) {
      throw new Error("Invalid language. Must be 'en' or 'zh-HK'");
    }

    // Get max order value for this user
    const existingCategories = await ctx.db
      .query("userCategories")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    const maxOrder = existingCategories.reduce(
      (max, cat) => Math.max(max, cat.order),
      -1
    );

    // Save name to both en_name and zh_name for new category
    const categoryId = await ctx.db.insert("userCategories", {
      userId: args.userId,
      isActive: true,
      emoji: args.emoji,
      en_name: args.name,
      zh_name: args.name,
      order: maxOrder + 1,
      createdAt: Date.now(),
    });

    return categoryId;
  },
});

/**
 * Update a category's name and emoji
 */
export const update = mutation({
  args: {
    categoryId: v.id("userCategories"),
    emoji: v.optional(v.string()),
    name: v.optional(v.string()),
    currentLang: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate language
    if (!["en", "zh-HK"].includes(args.currentLang)) {
      throw new Error("Invalid language. Must be 'en' or 'zh-HK'");
    }

    // Verify category exists
    const category = await ctx.db.get(args.categoryId);
    if (!category) {
      throw new Error("Category not found");
    }

    const patchData: Record<string, unknown> = {};

    // Update emoji if provided
    if (args.emoji !== undefined) {
      patchData.emoji = args.emoji;
    }

    // Update name with smart-save logic
    if (args.name !== undefined) {
      if (!category.en_name && !category.zh_name) {
        // Both empty - save to both
        patchData.en_name = args.name;
        patchData.zh_name = args.name;
      } else {
        // One has value - save only to current language
        if (args.currentLang === "en") {
          patchData.en_name = args.name;
        } else {
          patchData.zh_name = args.name;
        }
      }
    }

    await ctx.db.patch(args.categoryId, patchData);
  },
});

/**
 * Mark a category as inactive
 */
export const deactivate = mutation({
  args: {
    categoryId: v.id("userCategories"),
  },
  handler: async (ctx, args) => {
    // Verify category exists
    const category = await ctx.db.get(args.categoryId);
    if (!category) {
      throw new Error("Category not found");
    }

    await ctx.db.patch(args.categoryId, { isActive: false });
  },
});

/**
 * Mark a category as active
 */
export const activate = mutation({
  args: {
    categoryId: v.id("userCategories"),
  },
  handler: async (ctx, args) => {
    // Verify category exists
    const category = await ctx.db.get(args.categoryId);
    if (!category) {
      throw new Error("Category not found");
    }

    await ctx.db.patch(args.categoryId, { isActive: true });
  },
});

/**
 * Update order values for multiple categories
 */
export const reorder = mutation({
  args: {
    updates: v.array(
      v.object({
        categoryId: v.id("userCategories"),
        order: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Batch update order values
    for (const update of args.updates) {
      // Verify category exists
      const category = await ctx.db.get(update.categoryId);
      if (!category) {
        throw new Error(`Category ${update.categoryId} not found`);
      }

      await ctx.db.patch(update.categoryId, { order: update.order });
    }
  },
});

/**
 * Soft delete a category (marks as inactive)
 */
export const remove = mutation({
  args: {
    categoryId: v.id("userCategories"),
  },
  handler: async (ctx, args) => {
    // Verify category exists
    const category = await ctx.db.get(args.categoryId);
    if (!category) {
      throw new Error("Category not found");
    }

    // Soft delete: mark as inactive instead of deleting
    await ctx.db.patch(args.categoryId, { isActive: false });
  },
});

/**
 * Hard delete a category permanently
 */
export const hardDelete = mutation({
  args: {
    categoryId: v.id("userCategories"),
  },
  handler: async (ctx, args) => {
    // Verify category exists
    const category = await ctx.db.get(args.categoryId);
    if (!category) {
      throw new Error("Category not found");
    }

    await ctx.db.delete(args.categoryId);
  },
});

/**
 * Find a category by name for a user (case-sensitive exact match on en_name)
 * Used by API endpoint to match category names
 */
export const findByName = query({
  args: {
    userId: v.id("users"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    // Get all categories for the user
    const categories = await ctx.db
      .query("userCategories")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    // Case-insensitive search across both en_name and zh_name fields
    // Return the category with earliest createdAt if multiple matches
    const matchingCategories = categories.filter(
      (cat) =>
        (cat.en_name && cat.en_name.toLowerCase() === args.name.toLowerCase()) ||
        (cat.zh_name && cat.zh_name.toLowerCase() === args.name.toLowerCase())
    );

    if (matchingCategories.length === 0) {
      return null;
    }

    // Return the category with the earliest createdAt (oldest category wins)
    return matchingCategories.reduce((oldest, current) =>
      current.createdAt < oldest.createdAt ? current : oldest
    );
  },
});
