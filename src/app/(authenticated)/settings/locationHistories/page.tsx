"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { ChevronLeft, MapPin } from "lucide-react";
import { api } from "../../../../../convex/_generated/api";
import { SwipeableCard } from "@/components/ui/SwipeableCard";
import { LocationHistoryEditModal } from "@/components/settings/LocationHistoryEditModal";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useLanguage } from "@/hooks/useLanguage";
import type { LocationHistory, UserCategory } from "@/types";
import type { Id } from "../../../../../convex/_generated/dataModel";

/**
 * Location history management page
 * - Lists all location histories
 * - Swipe to delete
 * - Tap opens LocationHistoryEditModal
 * - No create button (locations are created via transactions)
 */
export default function LocationHistoriesSettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { lang } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<LocationHistory | undefined>(undefined);

  // Get the user from Convex by email
  const user = useQuery(
    api.users.getByEmail,
    session?.user?.email ? { email: session.user.email } : "skip"
  );

  // Query location histories
  const locationHistories = useQuery(
    api.locationHistories.listByUser,
    user?._id ? { userId: user._id } : "skip"
  );

  // Query active categories for the dropdown (ordered by createdAt)
  const activeCategories = useQuery(
    api.userCategories.listActiveByUser,
    user?._id ? { userId: user._id } : "skip"
  );

  // Query all categories (for display purposes)
  const allCategories = useQuery(
    api.userCategories.listByUser,
    user?._id ? { userId: user._id } : "skip"
  );

  // Mutations
  const updateLocation = useMutation(api.locationHistories.update);
  const removeLocation = useMutation(api.locationHistories.remove);

  const handleOpenEdit = (location: LocationHistory) => {
    setEditingLocation(location);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingLocation(undefined);
  };

  const handleSave = async (data: {
    name?: string;
    amount?: number;
    category?: Id<"userCategories">;
  }) => {
    if (!editingLocation) return;

    await updateLocation({
      locationHistoryId: editingLocation._id,
      ...data,
    });
  };

  const handleDelete = async (location: LocationHistory) => {
    const locationName = location.name || (lang === "en" ? "this location" : "此位置");
    const confirmed = window.confirm(
      lang === "en"
        ? `Delete ${locationName}? This cannot be undone.`
        : `刪除${locationName}？此操作無法撤銷。`
    );
    if (confirmed) {
      await removeLocation({ locationHistoryId: location._id });
    }
  };

  const getCategoryInfo = (categoryId: Id<"userCategories"> | undefined): UserCategory | undefined => {
    if (!categoryId || !allCategories) return undefined;
    return allCategories.find((c) => c._id === categoryId);
  };

  const getLocalizedCategoryName = (category: UserCategory | undefined): string => {
    if (!category) return "";
    if (lang === "en") {
      return category.en_name || category.zh_name || "";
    } else {
      return category.zh_name || category.en_name || "";
    }
  };

  const formatAmount = (amount: number): string => {
    return amount.toLocaleString(lang === "en" ? "en-US" : "zh-HK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Loading state while fetching user or locationHistories
  const isLoading = user === undefined || locationHistories === undefined;

  if (!session) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label={lang === "en" ? "Go back" : "返回"}
            >
              <ChevronLeft className="h-6 w-6 text-gray-700 dark:text-gray-300" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {lang === "en" ? "Location History" : "常用交易"}
            </h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="p-4 space-y-4">
        {/* Description */}
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {lang === "en"
            ? "Swipe left to delete, tap to edit"
            : "向左滑動以刪除，點擊以編輯"}
        </p>

        {/* Location list */}
        {locationHistories.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-8 text-center">
            <MapPin className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {lang === "en" ? "No saved locations yet" : "尚未儲存常用交易"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {locationHistories.map((location) => {
              const category = getCategoryInfo(location.category);
              return (
                <SwipeableCard
                  key={location._id}
                  onSwipeAction={() => handleDelete(location)}
                  actionLabel={lang === "en" ? "Delete" : "刪除"}
                  actionColor="red"
                  onClick={() => handleOpenEdit(location)}
                >
                  <div className="flex items-center justify-between w-full gap-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {category && (
                        <span className="text-2xl flex-shrink-0">{category.emoji}</span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {location.name || (lang === "en" ? "Unnamed location" : "未命名位置")}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          {category && (
                            <span>{getLocalizedCategoryName(category)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        ${formatAmount(location.amount)}
                      </p>
                    </div>
                  </div>
                </SwipeableCard>
              );
            })}
          </div>
        )}
      </main>

      {/* Location History Edit Modal */}
      {editingLocation && (
        <LocationHistoryEditModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          locationHistory={editingLocation}
          categories={
            // Use active categories (ordered by createdAt), plus the selected category if it's inactive
            (activeCategories || []).concat(
              editingLocation.category && allCategories
                ? allCategories.filter(
                    (c) => c._id === editingLocation.category && !c.isActive
                  )
                : []
            )
          }
          currentLang={lang}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
