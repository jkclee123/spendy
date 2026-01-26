"use client";

import { useSession, signOut } from "next-auth/react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ApiTokenDisplay } from "@/components/settings/ApiTokenDisplay";

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

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900">Settings</h2>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {session?.user?.image && (
              <img
                src={session.user.image}
                alt={session.user.name || "User"}
                className="h-16 w-16 rounded-full"
              />
            )}
            <div>
              <p className="text-lg font-medium text-gray-900">
                {session?.user?.name || user.name}
              </p>
              <p className="text-sm text-gray-500">
                {session?.user?.email || user.email}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Token Card */}
      <Card>
        <CardHeader>
          <CardTitle>API Token</CardTitle>
        </CardHeader>
        <CardContent>
          <ApiTokenDisplay userId={user._id} apiToken={user.apiToken} />
        </CardContent>
      </Card>

      {/* Sign Out */}
      <Card>
        <CardContent>
          <Button variant="outline" onClick={handleSignOut} className="w-full">
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
