import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in meters
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Find location history records within a radius of given coordinates
 * Returns records sorted by distance (closest first)
 */
export const findNearby = query({
  args: {
    userId: v.id("users"),
    latitude: v.number(),
    longitude: v.number(),
    radiusMeters: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const radius = args.radiusMeters ?? 200;
    
    // Calculate bounding box
    // 1 degree latitude ≈ 111,000 meters
    const latDelta = radius / 111000;
    // 1 degree longitude varies by latitude
    const longDelta = radius / (111000 * Math.cos((args.latitude * Math.PI) / 180));
    
    const minLat = args.latitude - latDelta;
    const maxLat = args.latitude + latDelta;
    const minLong = args.longitude - longDelta;
    const maxLong = args.longitude + longDelta;
    
    // Get all location histories for the user
    const allHistories = await ctx.db
      .query("locationHistories")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    
    // Filter by bounding box and calculate exact distances
    const nearby: Array<Doc<"locationHistories"> & { distance: number }> = [];
    
    for (const history of allHistories) {
      // Quick bounding box check
      if (history.latitude < minLat || history.latitude > maxLat) continue;
      if (history.longitude < minLong || history.longitude > maxLong) continue;
      
      // Calculate exact distance
      const distance = calculateDistance(
        args.latitude,
        args.longitude,
        history.latitude,
        history.longitude
      );
      
      if (distance <= radius) {
        nearby.push({ ...history, distance });
      }
    }
    
    // Sort by distance (closest first)
    return nearby.sort((a, b) => a.distance - b.distance);
  },
});

/**
 * Create or update a location history record within 200 meters
 * If selectedLocationId is provided, update that specific record
 * Otherwise, create a new record
 */
export const upsertNearby = mutation({
  args: {
    userId: v.id("users"),
    latitude: v.number(),
    longitude: v.number(),
    amount: v.number(),
    category: v.optional(v.id("userCategories")),
    name: v.optional(v.string()),
    selectedLocationId: v.optional(v.id("locationHistories")),
  },
  handler: async (ctx, args) => {
    if (args.selectedLocationId) {
      // Update the specific selected location
      const existing = await ctx.db.get(args.selectedLocationId);
      if (!existing) {
        throw new Error("Selected location history not found");
      }
      
      if (existing.userId !== args.userId) {
        throw new Error("Cannot update another user's location history");
      }
      
      const newCount = existing.count + 1;
      
      // Calculate weighted average for location
      // newLat = oldLat + (formLat - oldLat) / newCount
      const newLat =
        existing.latitude +
        (args.latitude - existing.latitude) / newCount;
      const newLong =
        existing.longitude +
        (args.longitude - existing.longitude) / newCount;
      
      await ctx.db.patch(args.selectedLocationId, {
        latitude: newLat,
        longitude: newLong,
        amount: args.amount,
        category: args.category,
        name: args.name,
        count: newCount,
      });
      
      return args.selectedLocationId;
    } else {
      // Create new record
      const newId = await ctx.db.insert("locationHistories", {
        userId: args.userId,
        latitude: args.latitude,
        longitude: args.longitude,
        amount: args.amount,
        category: args.category,
        name: args.name,
        count: 1,
        createdAt: Date.now(),
      });
      
      return newId;
    }
  },
});

/**
 * Get all location history records for a user
 */
export const listByUser = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("locationHistories")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

/**
 * Get a single location history by ID
 */
export const getById = query({
  args: {
    locationHistoryId: v.id("locationHistories"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.locationHistoryId);
  },
});

/**
 * Update a location history record
 */
export const update = mutation({
  args: {
    locationHistoryId: v.id("locationHistories"),
    name: v.optional(v.string()),
    amount: v.optional(v.number()),
    category: v.optional(v.id("userCategories")),
  },
  handler: async (ctx, args) => {
    const { locationHistoryId, ...updates } = args;

    // Validate amount if provided
    if (updates.amount !== undefined && updates.amount <= 0) {
      throw new Error("amount must be a positive number");
    }

    // Verify location history exists
    const locationHistory = await ctx.db.get(locationHistoryId);
    if (!locationHistory) {
      throw new Error("Location history not found");
    }

    // Apply updates (only include defined values)
    const patchData: Record<string, unknown> = {};
    if (updates.name !== undefined) patchData.name = updates.name;
    if (updates.amount !== undefined) patchData.amount = updates.amount;
    if (updates.category !== undefined) patchData.category = updates.category;

    await ctx.db.patch(locationHistoryId, patchData);
  },
});

/**
 * Delete a location history record
 */
export const remove = mutation({
  args: {
    locationHistoryId: v.id("locationHistories"),
  },
  handler: async (ctx, args) => {
    // Verify location history exists
    const locationHistory = await ctx.db.get(args.locationHistoryId);
    if (!locationHistory) {
      throw new Error("Location history not found");
    }

    await ctx.db.delete(args.locationHistoryId);
  },
});
