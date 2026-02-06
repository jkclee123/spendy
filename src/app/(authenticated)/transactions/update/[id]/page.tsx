"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "convex/react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAutoLogoutOnInvalidUser } from "@/hooks/useConvexWithAuth";

export default function EditTransactionPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const transactionId = params.id as Id<"transactions">;
  const t = useTranslations("transactions");

  // Get the user from Convex by email
  const user = useQuery(
    api.users.getByEmail,
    session?.user?.email ? { email: session.user.email } : "skip"
  );

  // Auto logout if user not found (invalid session)
  useAutoLogoutOnInvalidUser(user);

  // Get the transaction to edit
  const transaction = useQuery(
    api.transactions.getById,
    transactionId ? { transactionId } : "skip"
  );

  // Loading state while fetching user or transaction
  if (user === undefined || transaction === undefined) {
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

  // Transaction not found state
  if (transaction === null) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <span className="text-2xl">⚠️</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900">Transaction not found</h3>
        <p className="mt-2 max-w-sm text-sm text-gray-500">
          The transaction you are looking for does not exist.
        </p>
      </div>
    );
  }

  const handleSuccess = () => {
    router.push("/transactions");
  };

  const handleCancel = () => {
    router.push("/transactions");
  };

  return (
    <div className="space-y-4">
      {/* Edit Transaction Form */}
      <Card>
        <CardHeader>
          <CardTitle>{t("update")}</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionForm
            userId={user._id}
            initialData={transaction}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </CardContent>
      </Card>
    </div>
  );
}
