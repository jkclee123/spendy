"use client";

import { useEffect, useRef, useCallback } from "react";
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
 * Displays a paginated list of transactions with infinite scroll
 * Supports filtering by category, date range, and amount
 */
export function TransactionList({
  userId,
  onTransactionClick,
}: TransactionListProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();
  const t = useTranslations("transactions");

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
        const errorMessage =
          error instanceof Error
            ? error.message
            : t("list.deleteFailed");
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

  // Loading state for initial load
  if (status === "LoadingFirstPage") {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-gray-500 dark:text-gray-400">{t("list.loading")}</p>
      </div>
    );
  }

  // Empty state
  if (results.length === 0) {
    return <EmptyState t={t} />;
  }

  return (
    <div className="space-y-3">
      {/* Transaction list */}
      {results.map((transaction) => (
        <TransactionCard
          key={transaction._id}
          transaction={transaction as TransactionWithCategory}
          onClick={onTransactionClick}
          onDelete={handleDelete}
        />
      ))}

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
