"use client";

import { useState, useCallback } from "react";
import { useQuery } from "convex/react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { api } from "../../../../convex/_generated/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { TransactionList } from "@/components/records/TransactionList";
import {
  TransactionFilters,
  TransactionFiltersState,
} from "@/components/records/TransactionFilters";
import { TransactionDetail } from "@/components/records/TransactionDetail";
import type { Transaction } from "@/types";

export default function RecordsPage() {
  const { data: session } = useSession();
  const [filters, setFilters] = useState<TransactionFiltersState>({});
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);

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
    setSelectedTransaction(transaction);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedTransaction(null);
  }, []);

  // Loading state while fetching user
  if (user === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // User not found state
  if (user === null) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <span className="text-2xl">⚠️</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900">User not found</h3>
        <p className="mt-2 max-w-sm text-sm text-gray-500">
          Please try logging out and logging back in.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Records</h2>
        <Link
          href="/records/new"
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
        <CardHeader className="px-3 pt-2">
          <CardTitle>Your Transactions</CardTitle>
        </CardHeader>
        <CardContent className="px-1">
          <TransactionList
            userId={user._id}
            filters={filters}
            onTransactionClick={handleTransactionClick}
          />
        </CardContent>
      </Card>

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <TransactionDetail
          transaction={selectedTransaction}
          onClose={handleCloseDetail}
          onDeleted={handleCloseDetail}
          onUpdated={handleCloseDetail}
        />
      )}
    </div>
  );
}
