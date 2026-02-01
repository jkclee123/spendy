"use client";

import { useSession, signOut } from "next-auth/react";
import { useQuery } from "convex/react";
import Image from "next/image";
import { api } from "../../../../convex/_generated/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function SettingsPage() {
  const { data: session } = useSession();

  // Get the user from Convex by email to access API token
  const user = useQuery(
    api.users.getByEmail,
    session?.user?.email ? { email: session.user.email } : "skip"
  );

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
  };

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
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <span className="text-2xl">⚠️</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">User not found</h3>
        <p className="mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">
          Please try logging out and logging back in.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Settings</h2>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {session?.user?.image && (
              <Image
                src={session.user.image}
                alt={session.user.name || "User"}
                width={64}
                height={64}
                className="h-16 w-16 rounded-full"
              />
            )}
            <div>
              <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {session?.user?.name || user.name}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {session?.user?.email || user.email}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sign Out */}
      <Card>
        <CardContent>
          <Button variant="outline" onClick={handleSignOut} className="w-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300">
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
