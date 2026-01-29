import type { Id } from "../../convex/_generated/dataModel";

/**
 * User entity representing an authenticated user
 */
export interface User {
  _id: Id<"users">;
  name: string;
  email: string;
  image?: string;
  apiToken: string;
  createdAt: number;
}

/**
 * Transaction entity representing a financial transaction
 */
export interface Transaction {
  _id: Id<"transactions">;
  userId: Id<"users">;
  category?: string;
  amount: number;
  paymentMethod?: string;
  createdAt: number;
  source: "api" | "web";
}

/**
 * Request body for creating a transaction via external API
 */
export interface CreateTransactionRequest {
  category?: string;
  amount: number;
  paymentMethod?: string;
  apiToken: string;
}

/**
 * Response body for successful transaction creation
 */
export interface CreateTransactionResponse {
  success: boolean;
  transactionId: string;
  message: string;
}

/**
 * Standard error response format
 */
export interface ErrorResponse {
  error: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Default transaction categories
 */
export const DEFAULT_CATEGORIES = [
  "🍽️ Restaurants & Bars",
  "🥤 Drinks",
  "🚌 Transport",
  "🎢 Entertainment",
  "👨🏼‍🍳 Groceries",
  "🏨 Accommodation",
  "💊 Healthcare",
  "📜 Insurance",
  "🏡 Rent & Charges",
  "🛍️ Shopping",
  "❓ Other",
] as const;

export type DefaultCategory = (typeof DEFAULT_CATEGORIES)[number];

/**
 * Time period options for stats filtering
 */
export type TimePeriod = "week" | "month" | "year";

/**
 * Aggregated category data for pie chart
 */
export interface CategoryAggregation {
  category: string;
  total: number;
  count: number;
}

/**
 * Aggregated monthly data for histogram
 */
export interface MonthlyAggregation {
  month: string; // Format: "YYYY-MM"
  total: number;
  count: number;
}
