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
    paymentMethod: v.optional(v.string()),
    createdAt: v.number(),
    source: v.union(v.literal("api"), v.literal("web")),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_createdAt", ["userId", "createdAt"])
    .index("by_userId_category", ["userId", "category"]),

  locationHistories: defineTable({
    userId: v.id("users"),
    latitude: v.number(),
    longitude: v.number(),
    amount: v.number(),
    category: v.optional(v.string()),
    count: v.number(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_createdAt", ["userId", "createdAt"]),
});
