"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

export default function StatsPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900">Stats</h2>

      <Card>
        <CardHeader>
          <CardTitle>Spending Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              No data to display
            </h3>
            <p className="mt-2 max-w-sm text-sm text-gray-500">
              Charts and insights will appear here once you have some transaction data.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
