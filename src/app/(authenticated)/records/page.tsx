"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TransactionForm } from "@/components/records/TransactionForm";

export default function RecordsPage() {
  const [showForm, setShowForm] = useState(false);

  const handleSuccess = () => {
    setShowForm(false);
  };

  const handleCancel = () => {
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
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

      {/* Transaction List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <span className="text-2xl">📝</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              No transactions yet
            </h3>
            <p className="mt-2 max-w-sm text-sm text-gray-500">
              Your transactions will appear here once you start tracking your spending.
            </p>
            {!showForm && (
              <Button
                onClick={() => setShowForm(true)}
                variant="primary"
                size="md"
                className="mt-4"
              >
                Add Your First Transaction
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
