"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "convex/react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "../../../../../convex/_generated/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { TransactionForm } from "@/components/records/TransactionForm";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewTransactionPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read latitude and longitude from query parameters
  const latitude = searchParams.get("latitude");
  const longitude = searchParams.get("longitude");

  // Get the user from Convex by email
  const user = useQuery(
    api.users.getByEmail,
    session?.user?.email ? { email: session.user.email } : "skip"
  );

  // Query nearby location histories if both latitude and longitude are provided
  const nearbyLocations = useQuery(
    api.locationHistories.findNearby,
    latitude && longitude && user?._id
      ? {
          userId: user._id,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
        }
      : "skip"
  );

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

  const handleSuccess = () => {
    router.push("/records");
  };

  const handleCancel = () => {
    router.push("/records");
  };

  // Prepare initial location history data if nearby locations exist
  const initialLocationHistory =
    nearbyLocations && nearbyLocations.length > 0
      ? {
          amount: nearbyLocations[0].amount,
          category: nearbyLocations[0].category || "",
        }
      : undefined;

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

      {/* Add Transaction Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Transaction</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionForm
            userId={user._id}
            latitude={latitude ? parseFloat(latitude) : undefined}
            longitude={longitude ? parseFloat(longitude) : undefined}
            initialLocationHistory={initialLocationHistory}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </CardContent>
      </Card>
    </div>
  );
}
