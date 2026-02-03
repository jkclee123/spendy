"use client";

import { useCallback } from "react";
import { useQuery } from "convex/react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { api } from "../../../../convex/_generated/api";
import { Card, CardContent } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { TransactionList } from "@/components/transactions/TransactionList";
import type { Transaction } from "@/types";

export default function TransactionsPage() {
  const t = useTranslations("transactions");
  const { data: session } = useSession();
  const router = useRouter();

  // Get the user from Convex by email
  const user = useQuery(
    api.users.getByEmail,
    session?.user?.email ? { email: session.user.email } : "skip"
  );



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
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      )}

      {/* User not found state */}
      {!isLoading && user === null && (
        <Card>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <span className="text-2xl">⚠️</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">User not found</h3>
              <p className="mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">
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
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t("title")}</h2>
            <Link
              href="/transactions/create"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-2 text-base font-medium text-white shadow-sm transition-all duration-200 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[44px]"
            >
              + {t("newTransaction")}
            </Link>
          </div>


          {/* Transaction List */}
          <Card padding="sm">
            <CardContent className="px-1">
              <TransactionList
                userId={user._id}
                onTransactionClick={handleTransactionClick}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
