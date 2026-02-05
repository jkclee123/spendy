"use client";

import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../../../../convex/_generated/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function NewTransactionPage() {
  const t = useTranslations();
  const { data: session } = useSession();
  const router = useRouter();

  // Get the user from Convex by email
  const user = useQuery(
    api.users.getByEmail,
    session?.user?.email ? { email: session.user.email } : "skip"
  );

  // Loading state while fetching user
  if (user === undefined) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
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
        <h3 className="text-lg font-medium text-gray-900">
          {t("transactions.errors.userNotFound")}
        </h3>
        <p className="mt-2 max-w-sm text-sm text-gray-500">{t("common.error")}</p>
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
      {/* Add Transaction Form */}
      <Card>
        <CardHeader>
          <CardTitle>{t("transactions.newTransaction")}</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionForm userId={user._id} onSuccess={handleSuccess} onCancel={handleCancel} />
        </CardContent>
      </Card>
    </div>
  );
}
