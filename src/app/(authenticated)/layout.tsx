import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { NavigationBar } from "@/components/navigation/NavigationBar";
import { Header } from "@/components/ui/Header";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <Header />

      {/* Main content area with bottom padding for mobile nav */}
      <main className="flex-1 pb-20 pt-4 md:pl-20 bg-white dark:bg-gray-900">
        <div className="mx-auto max-w-4xl px-4">
          <ErrorBoundary>{children}</ErrorBoundary>
        </div>
      </main>

      {/* Navigation Bar - bottom on mobile, side on desktop */}
      <NavigationBar />
    </div>
  );
}
