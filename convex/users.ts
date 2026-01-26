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
 * Get a user by their API token (for external API authentication)
 */
export const getByApiToken = query({
  args: { apiToken: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_apiToken", (q) => q.eq("apiToken", args.apiToken))
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

    // Generate a unique API token (UUID v4 format)
    const apiToken = crypto.randomUUID();

    return await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      image: args.image,
      apiToken,
      createdAt: Date.now(),
    });
  },
});

/**
 * Regenerate a user's API token
 */
export const regenerateApiToken = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const newToken = crypto.randomUUID();
    await ctx.db.patch(args.userId, { apiToken: newToken });
    return newToken;
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
