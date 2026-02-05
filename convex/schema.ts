import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    image: v.optional(v.string()),
    lang: v.optional(v.string()),
    apiToken: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_apiToken", ["apiToken"]),

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
    type: v.union(v.literal("expense"), v.literal("income")),
    createdAt: v.number(),
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
