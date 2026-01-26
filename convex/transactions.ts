import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Create a transaction from the external API
 * Authenticates using apiToken and creates a transaction with source="api"
 */
export const createFromApi = mutation({
  args: {
    apiToken: v.string(),
    amount: v.number(),
    category: v.optional(v.string()),
    paymentMethod: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate amount
    if (args.amount <= 0) {
      throw new Error("amount must be a positive number");
    }

    // Lookup user by apiToken
    const user = await ctx.db
      .query("users")
      .withIndex("by_apiToken", (q) => q.eq("apiToken", args.apiToken))
      .unique();

    if (!user) {
      throw new Error("Invalid or missing API token");
    }

    // Create the transaction
    const transactionId = await ctx.db.insert("transactions", {
      userId: user._id,
      amount: args.amount,
      category: args.category,
      paymentMethod: args.paymentMethod,
      createdAt: Date.now(),
      source: "api",
    });

    return transactionId;
  },
});

/**
 * Create a transaction from the web interface
 * Uses the authenticated user's ID and creates a transaction with source="web"
 */
export const createFromWeb = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    category: v.optional(v.string()),
    paymentMethod: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate amount
    if (args.amount <= 0) {
      throw new Error("amount must be a positive number");
    }

    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Create the transaction
    const transactionId = await ctx.db.insert("transactions", {
      userId: args.userId,
      amount: args.amount,
      category: args.category,
      paymentMethod: args.paymentMethod,
      createdAt: Date.now(),
      source: "web",
    });

    return transactionId;
  },
});

/**
 * Get all transactions for a user, sorted by date descending
 */
export const listByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("transactions")
      .withIndex("by_userId_createdAt", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

/**
 * Get transactions for a user within a date range
 */
export const getByUserAndDateRange = query({
  args: {
    userId: v.id("users"),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_userId_createdAt", (q) => q.eq("userId", args.userId))
      .collect();

    // Filter by date range in application code
    return transactions.filter(
      (t) => t.createdAt >= args.startDate && t.createdAt <= args.endDate
    );
  },
});

/**
 * Update a transaction
 */
export const update = mutation({
  args: {
    transactionId: v.id("transactions"),
    amount: v.optional(v.number()),
    category: v.optional(v.string()),
    paymentMethod: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { transactionId, ...updates } = args;

    // Validate amount if provided
    if (updates.amount !== undefined && updates.amount <= 0) {
      throw new Error("amount must be a positive number");
    }

    // Verify transaction exists
    const transaction = await ctx.db.get(transactionId);
    if (!transaction) {
      throw new Error("Transaction not found");
    }

    // Apply updates (only include defined values)
    const patchData: Record<string, unknown> = {};
    if (updates.amount !== undefined) patchData.amount = updates.amount;
    if (updates.category !== undefined) patchData.category = updates.category;
    if (updates.paymentMethod !== undefined)
      patchData.paymentMethod = updates.paymentMethod;

    await ctx.db.patch(transactionId, patchData);

    return transactionId;
  },
});

/**
 * Delete a transaction
 */
export const remove = mutation({
  args: { transactionId: v.id("transactions") },
  handler: async (ctx, args) => {
    // Verify transaction exists
    const transaction = await ctx.db.get(args.transactionId);
    if (!transaction) {
      throw new Error("Transaction not found");
    }

    await ctx.db.delete(args.transactionId);
    return args.transactionId;
  },
});
