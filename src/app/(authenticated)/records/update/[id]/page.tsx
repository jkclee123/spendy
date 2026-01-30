"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "convex/react";
import { useRouter, useParams } from "next/navigation";
import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { TransactionForm } from "@/components/records/TransactionForm";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function EditTransactionPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const transactionId = params.id as Id<"transactions">;

  // Get the user from Convex by email
  const user = useQuery(
    api.users.getByEmail,
    session?.user?.email ? { email: session.user.email } : "skip"
  );

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
        <h3 className="text-lg font-medium text-gray-900">
          Transaction not found
        </h3>
        <p className="mt-2 max-w-sm text-sm text-gray-500">
          The transaction you are looking for does not exist.
        </p>
        <Link
          href="/records"
          className="mt-4 text-blue-500 hover:text-blue-600"
        >
          Back to Records
        </Link>
      </div>
    );
  }

  const handleSuccess = () => {
    router.push("/records");
  };

  const handleCancel = () => {
    router.push("/records");
  };

  return (
    <div className="space-y-4">
      {/* Header with back link */}
      <div className="flex items-center gap-2">
        <Link
          href="/records"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-sm font-medium">Back to Records</span>
        </Link>
      </div>

      {/* Edit Transaction Form */}
      <Card>
        <CardHeader>
          <CardTitle>Edit Transaction</CardTitle>
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
