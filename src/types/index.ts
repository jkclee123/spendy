import type { Id } from "../../convex/_generated/dataModel";

/**
 * User entity representing an authenticated user
 */
export interface User {
  _id: Id<"users">;
  name: string;
  email: string;
  image?: string;
  lang?: "system" | "en" | "zh-HK";
  createdAt: number;
}

/**
 * User-defined spending category with emoji and bilingual names
 */
export interface UserCategory {
  _id: Id<"userCategories">;
  userId: Id<"users">;
  isActive: boolean;
  emoji: string;
  en_name?: string;
  zh_name?: string;
  order: number;
  createdAt: number;
}

/**
 * Transaction entity representing a financial transaction
 */
export interface Transaction {
  _id: Id<"transactions">;
  userId: Id<"users">;
  name?: string;
  category?: Id<"userCategories">;
  amount: number;
  type: "expense" | "income";
  createdAt: number;
}

/**
 * Transaction with enriched category data
 * Used in transaction list display
 */
export interface TransactionWithCategory extends Transaction {
  categoryData?: {
    _id: Id<"userCategories">;
    emoji: string;
    en_name?: string;
    zh_name?: string;
  } | null;
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
  categoryId?: string | null;
  emoji?: string;
  en_name?: string;
  zh_name?: string;
}

/**
 * Aggregated monthly data for histogram
 */
export interface MonthlyAggregation {
  month: string; // Format: "YYYY-MM"
  total: number;
  count: number;
}

/**
 * Request payload for creating a transaction via external API
 */
export interface CreateTransactionRequest {
  apiToken: string;
  amount: number;
  category: string;
  name?: string;
  type?: "expense" | "income";
}

/**
 * Success response for transaction creation via external API
 */
export interface CreateTransactionResponse {
  success: true;
  transactionId: string;
}
