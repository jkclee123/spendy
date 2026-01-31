"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "convex/react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "../../../../../convex/_generated/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function NewTransactionPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read query parameters
  const latitude = searchParams.get("latitude");
  const longitude = searchParams.get("longitude");
  const amount = searchParams.get("amount");
  const paymentMethod = searchParams.get("paymentMethod");
  const merchant = searchParams.get("merchant");
  // isMobile is accepted but not used (reserved for future use)
  searchParams.get("isMobile");

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
    router.push("/transactions");
  };

  const handleCancel = () => {
    router.push("/transactions");
  };

  // Check if we have nearby location history data
  const hasNearbyLocation = nearbyLocations && nearbyLocations.length > 0;
  const nearbyLocation = hasNearbyLocation ? nearbyLocations[0] : null;

  // Prepare initial values
  // Amount: query param (if not empty) > locationHistory > undefined
  const initialAmount =
    amount && amount.trim() !== ""
      ? parseFloat(amount)
      : nearbyLocation?.amount;

  // Category from locationHistory if available
  const initialCategory = nearbyLocation?.category || "";

  // Name from locationHistory if available
  const initialName = nearbyLocation?.name || "";

  // Payment method and merchant from query params (if not empty)
  const initialPaymentMethod =
    paymentMethod && paymentMethod.trim() !== "" ? paymentMethod : undefined;
  const initialMerchant =
    merchant && merchant.trim() !== "" ? merchant : undefined;

  return (
    <div className="space-y-4">
      {/* Add Transaction Form */}
      <Card>
        <CardHeader>
          <CardTitle>New Transaction</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionForm
            userId={user._id}
            latitude={latitude ? parseFloat(latitude) : undefined}
            longitude={longitude ? parseFloat(longitude) : undefined}
            initialAmount={initialAmount}
            initialCategory={initialCategory}
            initialName={initialName}
            initialPaymentMethod={initialPaymentMethod}
            initialMerchant={initialMerchant}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </CardContent>
      </Card>
    </div>
  );
}
