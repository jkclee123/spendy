import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Get all categories for a user, ordered by active status then order
 */
export const listByUser = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const categories = await ctx.db
      .query("userCategories")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    // Sort: active categories first (by order ASC), then inactive (by order ASC)
    return categories.sort((a, b) => {
      if (a.isActive !== b.isActive) {
        return a.isActive ? -1 : 1;
      }
      return a.order - b.order;
    });
  },
});

/**
 * Get only active categories for a user
 */
export const listActiveByUser = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userCategories")
      .withIndex("by_userId_isActive", (q) => 
        q.eq("userId", args.userId).eq("isActive", true)
      )
      .order("asc")
      .collect();
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
