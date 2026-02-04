import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Generate a cryptographically secure API token
 * Used by both initial creation (user.create mutation) and regeneration (user.regenerateApiToken mutation)
 * Returns a base64url-encoded 32-byte random value (~43 characters)
 * Uses Web Crypto API (available in Bun and Node.js)
 */
function generateApiToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  // Convert to base64url string
  const binaryString = Array.from(array, (byte) => String.fromCharCode(byte)).join("");
  return btoa(binaryString)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

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

    const apiToken = generateApiToken();
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

/**
 * Get a user by their API token
 * Used for authenticating external API requests
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
 * Regenerate a user's API token
 * Generates a new cryptographically secure token and updates the user record
 */
export const regenerateApiToken = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const newToken = generateApiToken();
    await ctx.db.patch(args.userId, { apiToken: newToken });
    return newToken;
  },
});