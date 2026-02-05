import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import type { Id } from "./_generated/dataModel";

/**
 * Create a transaction from the web interface
 * Uses the authenticated user's ID and creates a transaction
 */
export const createFromWeb = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    name: v.optional(v.string()),
    category: v.optional(v.id("userCategories")),
    type: v.union(v.literal("expense"), v.literal("income")),
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
      name: args.name,
      amount: args.amount,
      category: args.category,
      type: args.type,
      createdAt: Date.now(),
    });

    return transactionId;
  },
});

/**
 * Create a transaction from the external API
 * Used by the API endpoint to create transactions programmatically
 */
export const createFromApi = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    categoryId: v.id("userCategories"),
    name: v.optional(v.string()),
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

    // Verify category exists and belongs to the user
    const category = await ctx.db.get(args.categoryId);
    if (!category) {
      throw new Error("Category not found");
    }
    if (category.userId !== args.userId) {
      throw new Error("Category does not belong to user");
    }

    // Create the transaction
    // Note: API transactions default to "expense" type
    const transactionId = await ctx.db.insert("transactions", {
      userId: args.userId,
      name: args.name,
      amount: args.amount,
      category: args.categoryId,
      type: "expense",
      createdAt: Date.now(),
    });

    return transactionId;
  },
});

/**
 * Get a single transaction by ID
 */
export const getById = query({
  args: { transactionId: v.id("transactions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.transactionId);
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
 * Get paginated transactions for a user with optional filters
 * Supports cursor-based pagination for infinite scroll
 * Includes category data (emoji and names) for each transaction
 */
export const listByUserPaginated = query({
  args: {
    userId: v.id("users"),
    paginationOpts: paginationOptsValidator,
    // Optional filters
    category: v.optional(v.id("userCategories")),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    minAmount: v.optional(v.number()),
    maxAmount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Start with base query
    let query = ctx.db
      .query("transactions")
      .withIndex("by_userId_createdAt", (q) => q.eq("userId", args.userId))
      .order("desc");

    // Apply pagination first to get the page
    const results = await query.paginate(args.paginationOpts);

    // Apply filters in application code (Convex doesn't support complex filtering in indexes)
    let filteredPage = results.page;

    if (args.category) {
      filteredPage = filteredPage.filter((t) => t.category === args.category);
    }

    if (args.startDate !== undefined) {
      filteredPage = filteredPage.filter((t) => t.createdAt >= args.startDate!);
    }

    if (args.endDate !== undefined) {
      filteredPage = filteredPage.filter((t) => t.createdAt <= args.endDate!);
    }

    if (args.minAmount !== undefined) {
      filteredPage = filteredPage.filter((t) => t.amount >= args.minAmount!);
    }

    if (args.maxAmount !== undefined) {
      filteredPage = filteredPage.filter((t) => t.amount <= args.maxAmount!);
    }

    // Enrich transactions with category data
    const enrichedPage = await Promise.all(
      filteredPage.map(async (transaction) => {
        if (!transaction.category) {
          return { ...transaction, categoryData: null };
        }

        const categoryData = await ctx.db.get(transaction.category);
        return {
          ...transaction,
          categoryData: categoryData
            ? {
                _id: categoryData._id,
                emoji: categoryData.emoji,
                en_name: categoryData.en_name,
                zh_name: categoryData.zh_name,
              }
            : null,
        };
      })
    );

    return {
      ...results,
      page: enrichedPage,
    };
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
    name: v.optional(v.string()),
    category: v.optional(v.id("userCategories")),
    type: v.optional(v.union(v.literal("expense"), v.literal("income"))),
    createdAt: v.optional(v.number()),
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
    if (updates.name !== undefined) patchData.name = updates.name;
    if (updates.category !== undefined) patchData.category = updates.category;
    if (updates.type !== undefined) patchData.type = updates.type;
    if (updates.createdAt !== undefined) patchData.createdAt = updates.createdAt;

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
 * Aggregate transactions by category for a user within a specific month range
 * Returns category totals with enriched category data (emoji, en_name, zh_name) for pie chart visualization
 * Used for month navigation in stats page
 */
export const aggregateByCategoryForMonth = query({
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

    // Aggregate by category with enriched category data
    const categoryMap = new Map<
      string,
      { total: number; count: number; categoryId: string | null; emoji?: string; en_name?: string; zh_name?: string }
    >();

    for (const transaction of filteredTransactions) {
      const categoryId = transaction.category || null;
      const categoryKey = categoryId || "Uncategorized";
      const existing = categoryMap.get(categoryKey) || {
        total: 0,
        count: 0,
        categoryId,
      };

      categoryMap.set(categoryKey, {
        ...existing,
        total: existing.total + transaction.amount,
        count: existing.count + 1,
      });
    }

    // Enrich with category data
    const enrichedResults = await Promise.all(
      Array.from(categoryMap.entries()).map(async ([categoryKey, data]) => {
        if (data.categoryId) {
          const categoryData = await ctx.db.get(data.categoryId as Id<"userCategories">);
          if (categoryData) {
            return {
              category: categoryKey,
              categoryId: data.categoryId,
              emoji: categoryData.emoji,
              en_name: categoryData.en_name,
              zh_name: categoryData.zh_name,
              total: data.total,
              count: data.count,
            };
          }
        }
        // Uncategorized transactions
        return {
          category: categoryKey,
          categoryId: null,
          emoji: undefined,
          en_name: undefined,
          zh_name: undefined,
          total: data.total,
          count: data.count,
        };
      })
    );

    return enrichedResults;
  },
});

/**
 * Get the earliest transaction date for a user
 * Used to determine available months for month navigation dropdown
 */
export const getEarliestTransactionDate = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_userId_createdAt", (q) => q.eq("userId", args.userId))
      .order("asc")
      .first();

    if (!transactions) {
      return null;
    }

    return transactions.createdAt;
  },
});

/**
 * Aggregate transactions by month for a user
 * Returns monthly totals for histogram visualization
 * Optionally filters by categoryId if provided
 */
export const aggregateByMonth = query({
  args: {
    userId: v.id("users"),
    monthsBack: v.number(), // Number of months to look back
    categoryId: v.optional(v.id("userCategories")), // Optional category filter
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
    let filteredTransactions = transactions.filter(
      (t) => t.createdAt >= startDate
    );

    // Filter by categoryId if provided
    if (args.categoryId !== undefined) {
      filteredTransactions = filteredTransactions.filter(
        (t) => t.category === args.categoryId
      );
    }

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


