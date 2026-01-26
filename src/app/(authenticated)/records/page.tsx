"use client";

import { useState, useCallback } from "react";
import { useQuery } from "convex/react";
import { useSession } from "next-auth/react";
import { api } from "../../../../convex/_generated/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { TransactionForm } from "@/components/records/TransactionForm";
import { TransactionList } from "@/components/records/TransactionList";
import {
  TransactionFilters,
  TransactionFiltersState,
} from "@/components/records/TransactionFilters";
import { TransactionDetail } from "@/components/records/TransactionDetail";
import type { Transaction } from "@/types";

export default function RecordsPage() {
  const { data: session } = useSession();
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState<TransactionFiltersState>({});
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);

  // Get the user from Convex by email
  const user = useQuery(
    api.users.getByEmail,
    session?.user?.email ? { email: session.user.email } : "skip"
  );

  const handleSuccess = useCallback(() => {
    setShowForm(false);
  }, []);

  const handleCancel = useCallback(() => {
    setShowForm(false);
  }, []);

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
        {!showForm && (
          <Button
            onClick={() => setShowForm(true)}
            variant="primary"
            size="md"
          >
            + Add Transaction
          </Button>
        )}
      </div>

      {/* Add Transaction Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Transaction</CardTitle>
          </CardHeader>
          <CardContent>
            <TransactionForm onSuccess={handleSuccess} onCancel={handleCancel} />
          </CardContent>
        </Card>
      )}

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

      {/* Add first transaction CTA when no form is shown */}
      {!showForm && (
        <div className="fixed bottom-20 left-0 right-0 px-4 pb-4 md:hidden">
          <Button
            onClick={() => setShowForm(true)}
            variant="primary"
            size="lg"
            className="w-full shadow-lg"
          >
            + Add Transaction
          </Button>
        </div>
      )}

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
