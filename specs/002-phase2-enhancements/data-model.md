# Data Model: Phase 2 Enhancements

**Date**: 2026-02-01  
**Feature**: Phase 2 Enhancements

## Overview

This document defines the data model changes for Phase 2, including the new `userCategories` table and modifications to existing tables.

---

## Entity Relationship Diagram

```
┌─────────────┐       ┌──────────────────┐       ┌─────────────────────┐
│   users     │       │  userCategories  │       │    transactions     │
├─────────────┤       ├──────────────────┤       ├─────────────────────┤
│ _id (PK)    │──┐    │ _id (PK)         │   ┌──▶│ _id (PK)            │
│ name        │  │    │ userId (FK)──────│───┘   │ userId (FK)─────────│───┐
│ email       │  └───▶│ isActive         │       │ name                │   │
│ image       │       │ emoji            │◀──────│ category (FK)       │   │
│ lang        │       │ en_name          │       │ amount              │   │
│ createdAt   │       │ zh_name          │       │ createdAt           │   │
└─────────────┘       │ order            │       │ source              │   │
       │              │ createdAt        │       └─────────────────────┘   │
       │              └──────────────────┘                                 │
       │                      ▲                                            │
       │                      │                                            │
       │              ┌───────┴───────┐                                    │
       │              │               │                                    │
       │       ┌──────────────────────┴───┐                                │
       │       │   locationHistories      │                                │
       │       ├──────────────────────────┤                                │
       └──────▶│ _id (PK)                 │                                │
               │ userId (FK)──────────────│────────────────────────────────┘
               │ latitude                 │
               │ longitude                │
               │ amount                   │
               │ category (FK)────────────│──▶ userCategories._id
               │ name                     │
               │ count                    │
               │ createdAt                │
               └──────────────────────────┘
```

---

## Tables

### users (Modified)

User accounts with authentication and preferences.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| _id | Id<"users"> | Yes | Primary key (auto-generated) |
| name | string | Yes | Display name from OAuth provider |
| email | string | Yes | Email address (unique) |
| image | string | No | Profile image URL |
| lang | string | No | Language preference: `"system"`, `"en"`, `"zh-TW"` |
| createdAt | number | Yes | Timestamp of account creation |

**Removed Fields**:
- `apiToken` - No longer needed (external API removed)

**Indexes**:
- `by_email` on `[email]` (unique lookup)

**Removed Indexes**:
- `by_apiToken` - No longer needed

**Validation Rules**:
- `email` must be unique
- `lang` must be one of: `"system"`, `"en"`, `"zh-TW"`, or undefined

---

### userCategories (New)

User-defined spending categories with emoji icons and bilingual names.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| _id | Id<"userCategories"> | Yes | Primary key (auto-generated) |
| userId | Id<"users"> | Yes | Foreign key to users table |
| isActive | boolean | Yes | Whether category is active |
| emoji | string | Yes | Single emoji character |
| en_name | string | No | English category name |
| zh_name | string | No | Traditional Chinese category name |
| order | number | Yes | Display order (0 = first) |
| createdAt | number | Yes | Timestamp of creation |

**Indexes**:
- `by_userId` on `[userId]` - List all categories for a user
- `by_userId_isActive` on `[userId, isActive]` - List active/inactive categories
- `by_userId_order` on `[userId, order]` - Ordered category list

**Validation Rules**:
- `emoji` should be a valid emoji (1-2 characters)
- `order` must be >= 0
- At least one of `en_name` or `zh_name` must be non-empty after creation

**Default Records** (created on user registration):
1. `{ isActive: true, emoji: "🍗", en_name: "Restaurant", zh_name: "食飯", order: 0 }`
2. `{ isActive: true, emoji: "🚃", en_name: "Transport", zh_name: "搭車", order: 1 }`

---

### transactions (Modified)

Financial transaction records.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| _id | Id<"transactions"> | Yes | Primary key (auto-generated) |
| userId | Id<"users"> | Yes | Foreign key to users table |
| name | string | No | Transaction description |
| category | Id<"userCategories"> | No | Foreign key to userCategories |
| amount | number | Yes | Transaction amount (positive) |
| createdAt | number | Yes | Timestamp of transaction |
| source | "web" | Yes | Transaction source (only "web" now) |

**Removed Fields**:
- `merchant` - Consolidated into `name` field

**Indexes**:
- `by_userId` on `[userId]`
- `by_userId_createdAt` on `[userId, createdAt]`
- `by_userId_category` on `[userId, category]`

**Validation Rules**:
- `amount` must be > 0
- `category` must reference an existing userCategory owned by the same user

**State Transitions**:
- None (transactions are immutable after creation, except for updates)

---

### locationHistories (Modified)

Geolocation-based transaction memory for form pre-filling.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| _id | Id<"locationHistories"> | Yes | Primary key (auto-generated) |
| userId | Id<"users"> | Yes | Foreign key to users table |
| latitude | number | Yes | GPS latitude coordinate |
| longitude | number | Yes | GPS longitude coordinate |
| amount | number | Yes | Last transaction amount |
| category | Id<"userCategories"> | No | Foreign key to userCategories |
| name | string | No | Location/transaction name |
| count | number | Yes | Number of transactions at this location |
| createdAt | number | Yes | Timestamp of first transaction |

**Field Changes**:
- `category`: Changed from `v.optional(v.string())` to `v.optional(v.id("userCategories"))`

**Indexes**:
- `by_userId` on `[userId]`
- `by_userId_createdAt` on `[userId, createdAt]`

**Validation Rules**:
- `latitude` must be between -90 and 90
- `longitude` must be between -180 and 180
- `amount` must be > 0
- `count` must be >= 1

**Behavior Notes**:
- Records within 200m radius are considered "nearby"
- On update: lat/long use weighted average, amount stores latest value
- Category matching is NOT required for update (can update any nearby location)

---

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
    lang: v.optional(v.string()), // "system" | "en" | "zh-TW"
    createdAt: v.number(),
  })
    .index("by_email", ["email"]),

  userCategories: defineTable({
    userId: v.id("users"),
    isActive: v.boolean(),
    emoji: v.string(),
    en_name: v.optional(v.string()),
    zh_name: v.optional(v.string()),
    order: v.number(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_isActive", ["userId", "isActive"])
    .index("by_userId_order", ["userId", "order"]),

  transactions: defineTable({
    userId: v.id("users"),
    name: v.optional(v.string()),
    category: v.optional(v.id("userCategories")),
    amount: v.number(),
    createdAt: v.number(),
    source: v.literal("web"),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_createdAt", ["userId", "createdAt"])
    .index("by_userId_category", ["userId", "category"]),

  locationHistories: defineTable({
    userId: v.id("users"),
    latitude: v.number(),
    longitude: v.number(),
    amount: v.number(),
    category: v.optional(v.id("userCategories")),
    name: v.optional(v.string()),
    count: v.number(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_createdAt", ["userId", "createdAt"]),
});
```

---

## Migration Notes

Since backward compatibility is not required:

1. **Clear existing data** from both dev and prod Convex databases
2. **Deploy new schema** with `npx convex deploy`
3. **Register new users** to get default categories
4. No data migration scripts needed

If backward compatibility were required:
- Would need to create userCategories from existing DEFAULT_CATEGORIES
- Would need to map transaction.category strings to new userCategory IDs
- Would need to regenerate API tokens for users (not applicable since removing)
