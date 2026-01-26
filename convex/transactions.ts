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

/**
 * Aggregate transactions by category for a user within a date range
 * Returns category totals for pie chart visualization
 */
export const aggregateByCategory = query({
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

    // Filter by date range
    const filteredTransactions = transactions.filter(
      (t) => t.createdAt >= args.startDate && t.createdAt <= args.endDate
    );

    // Aggregate by category
    const categoryMap = new Map<string, { total: number; count: number }>();

    for (const transaction of filteredTransactions) {
      const category = transaction.category || "Uncategorized";
      const existing = categoryMap.get(category) || { total: 0, count: 0 };
      categoryMap.set(category, {
        total: existing.total + transaction.amount,
        count: existing.count + 1,
      });
    }

    // Convert to array format
    return Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      total: data.total,
      count: data.count,
    }));
  },
});

/**
 * Aggregate transactions by month for a user
 * Returns monthly totals for histogram visualization
 */
export const aggregateByMonth = query({
  args: {
    userId: v.id("users"),
    monthsBack: v.number(), // Number of months to look back
  },
  handler: async (ctx, args) => {
    // Calculate the start date (beginning of N months ago)
    const now = new Date();
    const startDate = new Date(
      now.getFullYear(),
      now.getMonth() - args.monthsBack + 1,
      1
    ).getTime();

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_userId_createdAt", (q) => q.eq("userId", args.userId))
      .collect();

    // Filter to transactions within the time range
    const filteredTransactions = transactions.filter(
      (t) => t.createdAt >= startDate
    );

    // Aggregate by month
    const monthMap = new Map<string, { total: number; count: number }>();

    for (const transaction of filteredTransactions) {
      const date = new Date(transaction.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const existing = monthMap.get(monthKey) || { total: 0, count: 0 };
      monthMap.set(monthKey, {
        total: existing.total + transaction.amount,
        count: existing.count + 1,
      });
    }

    // Convert to sorted array format
    return Array.from(monthMap.entries())
      .map(([month, data]) => ({
        month,
        total: data.total,
        count: data.count,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  },
});
