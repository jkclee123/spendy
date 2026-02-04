"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Plus, ChevronLeft } from "lucide-react";
import { api } from "../../../../../convex/_generated/api";
import { SwipeableCard } from "@/components/ui/SwipeableCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { CategoryEditModal } from "@/components/settings/CategoryEditModal";
import { useLanguage } from "@/hooks/useLanguage";
import type { UserCategory } from "@/types";

/**
 * Category management page
 * - Lists active categories (top section) ordered by createdAt
 * - Lists inactive categories (bottom section) ordered by createdAt
 * - Swipe left to delete/deactivate
 * - Create button opens CategoryEditModal
 * - Tap category opens CategoryEditModal
 */
export default function CategorySettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { lang } = useLanguage();
  const t = useTranslations("categories");
  const tCommon = useTranslations("common");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<UserCategory | undefined>(undefined);

  // Get the user from Convex by email
  const user = useQuery(
    api.users.getByEmail,
    session?.user?.email ? { email: session.user.email } : "skip"
  );

  // Query categories
  const categories = useQuery(
    api.userCategories.listByUser,
    user?._id ? { userId: user._id } : "skip"
  );

  // Mutations
  const createCategory = useMutation(api.userCategories.create);
  const updateCategory = useMutation(api.userCategories.update);
  const deactivateCategory = useMutation(api.userCategories.remove);
  const activateCategory = useMutation(api.userCategories.activate);

  const activeCategories = categories?.filter((c) => c.isActive) || [];
  const inactiveCategories = categories?.filter((c) => !c.isActive) || [];

  const handleOpenCreate = () => {
    setEditingCategory(undefined);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (category: UserCategory) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(undefined);
  };

  const handleSave = async (data: { emoji: string; name: string }) => {
    if (!user?._id) return;

    if (editingCategory) {
      // Update existing category
      await updateCategory({
        categoryId: editingCategory._id,
        emoji: data.emoji,
        name: data.name,
        currentLang: lang,
      });
    } else {
      // Create new category
      await createCategory({
        userId: user._id,
        emoji: data.emoji,
        name: data.name,
        currentLang: lang,
      });
    }
  };

  const handleDeactivate = async (category: UserCategory) => {
    // Soft delete - just deactivates the category, no confirmation needed
    await deactivateCategory({ categoryId: category._id });
  };

  const handleActivate = async (category: UserCategory) => {
    // Activate the category - no confirmation needed
    await activateCategory({ categoryId: category._id });
  };

  const getLocalizedName = (category: UserCategory): string => {
    if (lang === "en") {
      return category.en_name || category.zh_name || "Unnamed";
    } else {
      return category.zh_name || category.en_name || "未命名";
    }
  };

  // Loading state while fetching user or categories
  const isLoading = user === undefined || categories === undefined;

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
              aria-label="Go back"
            >
              <ChevronLeft className="h-6 w-6 text-gray-700 dark:text-gray-300" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {t("title")}
            </h1>
          </div>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            aria-label={t("createNew")}
          >
            <Plus className="h-5 w-5" aria-hidden="true" />
            <span>{tCommon("create")}</span>
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="p-4 space-y-8">
        {/* Active categories */}
        <section aria-labelledby="active-categories-heading">
          <div className="mb-4">
            <h2 id="active-categories-heading" className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {t("activeCategories")}
            </h2>
          </div>

          {activeCategories.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                {t("noActiveCategories")}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeCategories.map((category) => (
                <SwipeableCard
                  key={category._id}
                  onSwipeAction={() => handleDeactivate(category)}
                  actionLabel={t("deactivate")}
                  actionColor="yellow"
                  onClick={() => handleOpenEdit(category)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl" aria-hidden="true">{category.emoji}</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {getLocalizedName(category)}
                    </span>
                  </div>
                </SwipeableCard>
              ))}
            </div>
          )}
        </section>

        {/* Inactive categories */}
        {inactiveCategories.length > 0 && (
          <section aria-labelledby="inactive-categories-heading">
            <div className="mb-4">
              <h2 id="inactive-categories-heading" className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {t("inactiveCategories")}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {t("inactiveHint")}
              </p>
            </div>

            <div className="space-y-2">
              {inactiveCategories.map((category) => (
                <SwipeableCard
                  key={category._id}
                  onSwipeAction={() => handleActivate(category)}
                  actionLabel={t("active")}
                  actionColor="blue"
                  onClick={() => handleActivate(category)}
                >
                  <div className="flex items-center gap-3 opacity-60">
                    <span className="text-2xl" aria-hidden="true">{category.emoji}</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {getLocalizedName(category)}
                    </span>
                  </div>
                </SwipeableCard>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Category Edit Modal */}
      <CategoryEditModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        category={editingCategory}
        currentLang={lang}
        onSave={handleSave}
      />
    </div>
  );
}
