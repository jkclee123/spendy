"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id, Doc } from "../../convex/_generated/dataModel";

/**
 * Location history with calculated distance
 */
export type LocationHistoryWithDistance = Doc<"locationHistories"> & { distance: number };

/**
 * Hook to query nearby locations within 200m radius
 * - Queries locationHistories.findNearby with 200m radius
 * - Returns undefined/loading if coordinates not available
 * - Results sorted by distance ascending
 */
export function useNearbyLocations(
  userId: Id<"users"> | undefined,
  latitude: number | undefined,
  longitude: number | undefined
): {
  locations: LocationHistoryWithDistance[] | undefined;
  isLoading: boolean;
} {
  const shouldQuery =
    userId !== undefined && latitude !== undefined && longitude !== undefined;

  const locations = useQuery(
    api.locationHistories.findNearby,
    shouldQuery
      ? {
          userId: userId,
          latitude: latitude,
          longitude: longitude,
          radiusMeters: 200,
        }
      : "skip"
  );

  return {
    locations,
    isLoading: shouldQuery && locations === undefined,
  };
}
