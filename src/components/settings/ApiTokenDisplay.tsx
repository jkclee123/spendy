"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { Eye, EyeOff, Copy, RefreshCw } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import type { Id } from "../../../convex/_generated/dataModel";

interface ApiTokenDisplayProps {
  userId: Id<"users">;
}

/**
 * Component for displaying and managing API token
 * - Shows/hides token with toggle button
 * - Copy token to clipboard
 * - Regenerate token with confirmation
 * - Usage instructions
 */
export function ApiTokenDisplay({ userId }: ApiTokenDisplayProps) {
  const t = useTranslations("settings.apiToken");
  const tCommon = useTranslations("common");
  const { showToast } = useToast();

  const [isTokenVisible, setIsTokenVisible] = useState(false);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Get user data to access API token
  const user = useQuery(api.users.getById, { userId });
  const regenerateToken = useMutation(api.users.regenerateApiToken);

  // Ensure API token exists for existing users
  useEffect(() => {
    if (user && !user.apiToken) {
      // Token missing - regenerate it
      regenerateToken({ userId })
        .then(() => {
          showToast(t("regenerateSuccess"), "success");
        })
        .catch(() => {
          showToast(t("regenerateError"), "error");
        });
    }
  }, [user, userId, regenerateToken, showToast, t]);

  const handleCopyToken = async () => {
    if (!user?.apiToken) return;

    try {
      await navigator.clipboard.writeText(user.apiToken);
      showToast(t("copySuccess"), "success");
    } catch {
      showToast(t("copyError"), "error");
    }
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      await regenerateToken({ userId });
      setIsTokenVisible(false); // Hide token after regeneration
      setShowRegenerateModal(false);
      showToast(t("regenerateSuccess"), "success");
    } catch {
      showToast(t("regenerateError"), "error");
    } finally {
      setIsRegenerating(false);
    }
  };

  if (!user) {
    return null;
  }

  const apiToken = user.apiToken || "";

  // Show first 5 characters when token is hidden
  const VISIBLE_CHARS = 5;
  const getDisplayToken = () => {
    if (!apiToken) return "Generating...";
    if (isTokenVisible) return apiToken;
    return apiToken.slice(0, VISIBLE_CHARS) + "*".repeat(apiToken.length - VISIBLE_CHARS);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">{t("description")}</p>

          {/* Token Display */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <code className="flex-1 min-w-0 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm font-mono truncate whitespace-nowrap text-gray-900 dark:text-gray-100">
                {getDisplayToken()}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsTokenVisible(!isTokenVisible)}
                aria-label={isTokenVisible ? t("hideToken") : t("showToken")}
              >
                {isTokenVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyToken}
                disabled={!apiToken}
                aria-label={t("copyToken")}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            {/* Regenerate Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRegenerateModal(true)}
              disabled={!apiToken}
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {t("regenerateToken")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Regenerate Confirmation Modal */}
      <Modal
        isOpen={showRegenerateModal}
        onClose={() => setShowRegenerateModal(false)}
        title={t("regenerateConfirmTitle")}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">{t("regenerateConfirmMessage")}</p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowRegenerateModal(false)}
              disabled={isRegenerating}
            >
              {tCommon("cancel")}
            </Button>
            <Button variant="danger" onClick={handleRegenerate} isLoading={isRegenerating}>
              {t("regenerateToken")}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
