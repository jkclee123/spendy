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
    const radius = args.radiusMeters ?? 100;
    
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
 * Create or update a location history record within 100 meters
 * If a record exists within 100m, update it with weighted average location
 * Otherwise, create a new record
 */
export const upsertNearby = mutation({
  args: {
    userId: v.id("users"),
    latitude: v.number(),
    longitude: v.number(),
    amount: v.number(),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const radius = 100;
    
    // Calculate bounding box for 100m
    const latDelta = radius / 111000;
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
    
    // Find closest record within 100m
    let closest: { history: Doc<"locationHistories">; distance: number } | null = null;
    
    for (const history of allHistories) {
      if (history.latitude < minLat || history.latitude > maxLat) continue;
      if (history.longitude < minLong || history.longitude > maxLong) continue;
      
      const distance = calculateDistance(
        args.latitude,
        args.longitude,
        history.latitude,
        history.longitude
      );
      
      if (distance <= radius) {
        if (!closest || distance < closest.distance) {
          closest = { history, distance };
        }
      }
    }
    
    if (closest) {
      // Update existing record
      const newCount = closest.history.count + 1;
      
      // Calculate weighted average for location
      // newLat = oldLat + (formLat - oldLat) / newCount
      const newLat =
        closest.history.latitude +
        (args.latitude - closest.history.latitude) / newCount;
      const newLong =
        closest.history.longitude +
        (args.longitude - closest.history.longitude) / newCount;
      
      await ctx.db.patch(closest.history._id, {
        latitude: newLat,
        longitude: newLong,
        amount: args.amount,
        category: args.category,
        count: newCount,
      });
      
      return closest.history._id;
    } else {
      // Create new record
      const newId = await ctx.db.insert("locationHistories", {
        userId: args.userId,
        latitude: args.latitude,
        longitude: args.longitude,
        amount: args.amount,
        category: args.category,
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
