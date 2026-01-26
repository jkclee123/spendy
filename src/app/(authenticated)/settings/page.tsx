"use client";

import { useSession, signOut } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function SettingsPage() {
  const { data: session } = useSession();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
  };

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
                {session?.user?.name}
              </p>
              <p className="text-sm text-gray-500">{session?.user?.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Token Card - Placeholder for T059 */}
      <Card>
        <CardHeader>
          <CardTitle>API Token</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            Your API token will be displayed here for integrating with external services.
          </p>
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
