"use client";

import { useState, useCallback } from "react";
import { useQuery } from "convex/react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "../../../../convex/_generated/api";
import { Card, CardContent } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { TransactionList } from "@/components/transactions/TransactionList";
import {
  TransactionFilters,
  TransactionFiltersState,
} from "@/components/transactions/TransactionFilters";
import type { Transaction } from "@/types";

export default function TransactionsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [filters, setFilters] = useState<TransactionFiltersState>({});

  // Get the user from Convex by email
  const user = useQuery(
    api.users.getByEmail,
    session?.user?.email ? { email: session.user.email } : "skip"
  );

  const handleFiltersChange = useCallback(
    (newFilters: TransactionFiltersState) => {
      setFilters(newFilters);
    },
    []
  );

  const handleClearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const handleTransactionClick = useCallback((transaction: Transaction) => {
    router.push(`/transactions/update/${transaction._id}`);
  }, [router]);

  // Loading state
  const isLoading = user === undefined;

  return (
    <div className="space-y-4">
      {/* Loading State */}
      {isLoading && (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      )}

      {/* User not found state */}
      {!isLoading && user === null && (
        <Card>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <span className="text-2xl">⚠️</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900">User not found</h3>
              <p className="mt-2 max-w-sm text-sm text-gray-500">
                Please try logging out and logging back in.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      {!isLoading && user && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Transactions</h2>
            <Link
              href="/transactions/create"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-2 text-base font-medium text-white shadow-sm transition-all duration-200 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[44px]"
            >
              + New Transaction
            </Link>
          </div>

          {/* Filters */}
          <TransactionFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
          />

          {/* Transaction List */}
          <Card padding="sm">
            <CardContent className="px-1">
              <TransactionList
                userId={user._id}
                filters={filters}
                onTransactionClick={handleTransactionClick}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
