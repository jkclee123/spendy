"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

export default function RecordsPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900">Records</h2>
      
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
