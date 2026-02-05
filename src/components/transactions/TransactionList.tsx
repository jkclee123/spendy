"use client";

import { useEffect, useRef, useCallback, useMemo } from "react";
import { usePaginatedQuery, useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import type { TransactionWithCategory } from "@/types";
import { TransactionCard } from "./TransactionCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useToast } from "@/components/ui/Toast";

interface TransactionListProps {
  userId: Id<"users">;
  onTransactionClick?: (transaction: TransactionWithCategory) => void;
}

const PAGE_SIZE = 20;

/**
 * Format date to "YYYY/MM/DD DayOfWeek" format with localization
 */
function formatDateHeader(date: Date, t: (key: string) => string): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const dayOfWeek = t(`daysOfWeek.${date.getDay()}`);

  return `${year}/${month}/${day} ${dayOfWeek}`;
}

/**
 * Get date string for grouping (YYYY-MM-DD)
 */
function getDateKey(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * Calculate daily total from transactions
 */
function calculateDailyTotal(transactions: TransactionWithCategory[]): number {
  return transactions.reduce((total, t) => {
    return t.type === "expense" ? total - t.amount : total + t.amount;
  }, 0);
}

/**
 * Group transactions by date
 */
function groupTransactionsByDate(
  transactions: TransactionWithCategory[]
): Map<string, TransactionWithCategory[]> {
  const grouped = new Map<string, TransactionWithCategory[]>();

  transactions.forEach((transaction) => {
    const dateKey = getDateKey(transaction.createdAt);

    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, []);
    }

    grouped.get(dateKey)!.push(transaction);
  });

  return grouped;
}

/**
 * Displays a paginated list of transactions with infinite scroll
 * Supports filtering by category, date range, and amount
 * Groups transactions by date with daily totals in headers
 */
export function TransactionList({ userId, onTransactionClick }: TransactionListProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();
  const t = useTranslations("transactions");
  const tcommon = useTranslations("common");

  // Use paginated query with filters
  const { results, status, loadMore } = usePaginatedQuery(
    api.transactions.listByUserPaginated,
    { userId },
    { initialNumItems: PAGE_SIZE }
  );

  // Delete mutation
  const deleteTransaction = useMutation(api.transactions.remove);

  const handleDelete = useCallback(
    async (transaction: TransactionWithCategory) => {
      try {
        await deleteTransaction({
          transactionId: transaction._id,
        });
        showToast(t("successMessages.deleted"), "success");
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : t("list.deleteFailed");
        showToast(errorMessage, "error");
      }
    },
    [deleteTransaction, showToast, t]
  );

  // Set up intersection observer for infinite scroll
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target.isIntersecting && status === "CanLoadMore") {
        loadMore(PAGE_SIZE);
      }
    },
    [status, loadMore]
  );

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    observerRef.current = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: "100px",
      threshold: 0,
    });

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleObserver]);

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    return groupTransactionsByDate(results as TransactionWithCategory[]);
  }, [results]);

  // Sort date keys in descending order (newest first)
  const sortedDateKeys = useMemo(() => {
    return Array.from(groupedTransactions.keys()).sort((a, b) => b.localeCompare(a));
  }, [groupedTransactions]);

  // Loading state for initial load
  if (status === "LoadingFirstPage") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Empty state
  if (results.length === 0) {
    return <EmptyState t={t} />;
  }

  return (
    <div className="space-y-6">
      {/* Grouped transaction list */}
      {sortedDateKeys.map((dateKey) => {
        const transactions = groupedTransactions.get(dateKey)!;
        const dailyTotal = calculateDailyTotal(transactions);
        const isNegative = dailyTotal < 0;

        // Parse date key for header display
        const [year, month, day] = dateKey.split("-").map(Number);
        const headerDate = new Date(year, month - 1, day);

        return (
          <div key={dateKey} className="space-y-3">
            {/* Date header with daily total */}
            <div className="flex items-center justify-between border-b border-gray-200 pb-2 dark:border-gray-700">
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {formatDateHeader(headerDate, tcommon)}
              </span>
              <span
                className={`font-semibold ${
                  isNegative
                    ? "text-red-500 dark:text-red-400"
                    : "text-green-500 dark:text-green-400"
                }`}
              >
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                  signDisplay: "always",
                }).format(dailyTotal)}
              </span>
            </div>

            {/* Transactions for this date */}
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <TransactionCard
                  key={transaction._id}
                  transaction={transaction as TransactionWithCategory}
                  onClick={onTransactionClick}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Load more trigger element */}
      <div ref={loadMoreRef} className="py-4">
        {status === "LoadingMore" && (
          <div className="flex items-center justify-center">
            <LoadingSpinner size="md" />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Empty state component when no transactions exist
 */
function EmptyState({ t }: { t: (key: string) => string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
        <span className="text-2xl">📝</span>
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
        {t("list.noTransactionsTitle")}
      </h3>
    </div>
  );
}
