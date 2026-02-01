import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Get a user by their email address
 */
export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
  },
});

/**
 * Create a new user (called on first login via OAuth)
 */
export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (existingUser) {
      return existingUser._id;
    }

    return await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      image: args.image,
      createdAt: Date.now(),
    });
  },
});

/**
 * Update a user's language preference
 */
export const updateLanguage = mutation({
  args: {
    userId: v.id("users"),
    lang: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate language value
    if (!["system", "en", "zh-HK"].includes(args.lang)) {
      throw new Error("Invalid language value. Must be 'system', 'en', or 'zh-HK'");
    }

    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(args.userId, { lang: args.lang });
  },
});

/**
 * Get a user by their ID
 */
export const getById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});
