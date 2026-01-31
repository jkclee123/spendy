# Data Model: Transaction Tracker

**Branch**: `001-transaction-tracker` | **Date**: 2026-01-26

## Entity Relationship Diagram

```
┌─────────────────────┐
│   Transaction       │
├─────────────────────┤
│ _id: Id<"trans..."> │
│ userId: Id<"users"> │
│ name?: string       │
│ merchant?: string   │
│ category?: string   │
│ amount: number      │
│ createdAt: number   │
│ source: "api"|"web" │
└─────────────────────┘
```

## Entities

### User

Represents an authenticated user of the application.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| _id | Id<"users"> | Yes (auto) | Convex-generated unique identifier |
| name | string | Yes | User's display name from Google |
| email | string | Yes | User's email from Google OAuth |
| image | string | No | Profile picture URL from Google |
| apiToken | string | Yes | Unique token for external API authentication |
| createdAt | number | Yes | Unix timestamp of account creation |

**Indexes**:
- `by_email`: Lookup user by email (for OAuth login)
- `by_apiToken`: Lookup user by API token (for external API auth)

**Validation Rules**:
- `email`: Must be unique, valid email format
- `apiToken`: Must be unique, UUID v4 format
- `name`: Non-empty string

**State Transitions**: None (users are created on first login, not deleted in MVP)

### Transaction

Represents a single financial transaction record.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| _id | Id<"transactions"> | Yes (auto) | Convex-generated unique identifier |
| userId | Id<"users"> | Yes | Reference to owning user |
| name | string | No | Transaction name/description |
| merchant | string | No | Merchant name |
| category | string | No | Transaction category (e.g., "Food", "Transport") |
| amount | number | Yes | Transaction amount (positive float) |
| createdAt | number | Yes | Unix timestamp when transaction was recorded |
| source | "api" \| "web" | Yes | Whether created via external API or web interface |

**Indexes**:
- `by_userId`: List all transactions for a user
- `by_userId_createdAt`: List user transactions sorted by date (for records page)
- `by_userId_category`: Aggregate by category (for pie chart)

**Validation Rules**:
- `amount`: Must be a positive number
- `category`: If provided, non-empty string
- `userId`: Must reference existing user

**State Transitions**: Created → (optionally Edited) → (optionally Deleted)

## Convex Schema Definition

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    image: v.optional(v.string()),
    apiToken: v.string(),
    createdAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_apiToken", ["apiToken"]),

  transactions: defineTable({
    userId: v.id("users"),
    name: v.optional(v.string()),
    merchant: v.optional(v.string()),
    category: v.optional(v.string()),
    amount: v.number(),
    createdAt: v.number(),
    source: v.union(v.literal("api"), v.literal("web")),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_createdAt", ["userId", "createdAt"])
    .index("by_userId_category", ["userId", "category"]),
});
```

## Query Patterns

### Records Page (Transaction List)

```typescript
// Get all transactions for current user, sorted by date descending
query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("transactions")
      .withIndex("by_userId_createdAt", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});
```

### Stats Page (Category Pie Chart)

```typescript
// Get transactions for current month, grouped by category
query({
  args: { userId: v.id("users"), startOfMonth: v.number(), endOfMonth: v.number() },
  handler: async (ctx, args) => {
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_userId_createdAt", (q) =>
        q.eq("userId", args.userId)
         .gte("createdAt", args.startOfMonth)
         .lte("createdAt", args.endOfMonth)
      )
      .collect();
    
    // Aggregate by category in application code
    return aggregateByCategory(transactions);
  },
});
```

### Stats Page (Monthly Histogram)

```typescript
// Get transactions for last 12 months
query({
  args: { userId: v.id("users"), twelveMonthsAgo: v.number() },
  handler: async (ctx, args) => {
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_userId_createdAt", (q) =>
        q.eq("userId", args.userId)
         .gte("createdAt", args.twelveMonthsAgo)
      )
      .collect();
    
    // Aggregate by month in application code
    return aggregateByMonth(transactions);
  },
});
```

### External API (Create Transaction)

```typescript
// Lookup user by apiToken and create transaction
mutation({
  args: {
    apiToken: v.string(),
    amount: v.number(),
    name: v.optional(v.string()),
    merchant: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_apiToken", (q) => q.eq("apiToken", args.apiToken))
      .unique();

    if (!user) throw new Error("Invalid API token");

    return await ctx.db.insert("transactions", {
      userId: user._id,
      name: args.name,
      merchant: args.merchant,
      amount: args.amount,
      category: args.category,
      createdAt: Date.now(),
      source: "api",
    });
  },
});
```

## Default Categories

For MVP, categories are free-form strings. Suggested defaults shown in UI:
- Food & Dining
- Transport
- Shopping
- Entertainment
- Bills & Utilities
- Health
- Other
