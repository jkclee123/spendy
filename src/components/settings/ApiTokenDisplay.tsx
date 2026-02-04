"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { Eye, EyeOff, Copy, RefreshCw, Info } from "lucide-react";
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
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://spendy.example.com";

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t("description")}
          </p>

          {/* Token Display */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <code
                className={`flex-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm font-mono break-all ${
                  isTokenVisible ? "text-gray-900 dark:text-gray-100" : "text-transparent select-none"
                }`}
                style={
                  !isTokenVisible
                    ? {
                        backgroundImage:
                          "repeating-linear-gradient(45deg, #e5e7eb 0px, #e5e7eb 10px, transparent 10px, transparent 20px)",
                        WebkitTextFillColor: "transparent",
                        WebkitBackgroundClip: "text",
                      }
                    : undefined
                }
              >
                {apiToken || "Generating..."}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsTokenVisible(!isTokenVisible)}
                aria-label={isTokenVisible ? t("hideToken") : t("showToken")}
              >
                {isTokenVisible ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
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

          {/* Usage Instructions */}
          <div className="mt-6 space-y-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-4">
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                {t("usageInstructions")}
              </h4>
            </div>

            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {t("endpoint")}:
                </span>{" "}
                <code className="ml-2 rounded bg-gray-200 dark:bg-gray-800 px-2 py-1">
                  {baseUrl}/api/transactions/create
                </code>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {t("method")}:
                </span>{" "}
                <code className="ml-2 rounded bg-gray-200 dark:bg-gray-800 px-2 py-1">
                  POST
                </code>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {t("headers")}:
                </span>{" "}
                <code className="ml-2 rounded bg-gray-200 dark:bg-gray-800 px-2 py-1">
                  Content-Type: application/json
                </code>
              </div>
              <div className="pt-2">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {t("exampleRequest")}:
                </span>
                <pre className="mt-1 rounded bg-gray-200 dark:bg-gray-800 p-2 text-xs overflow-x-auto">
                  {`curl -X POST ${baseUrl}/api/transactions/create \\
  -H "Content-Type: application/json" \\
  -d '{
    "apiToken": "YOUR_TOKEN_HERE",
    "amount": 45.50,
    "category": "Food",
    "name": "Lunch at Cafe"
  }'`}
                </pre>
              </div>
              <div className="pt-2">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {t("exampleResponse")}:
                </span>
                <pre className="mt-1 rounded bg-gray-200 dark:bg-gray-800 p-2 text-xs overflow-x-auto">
                  {`{
  "success": true,
  "transactionId": "j5k2l8m9n3o4p6q7"
}`}
                </pre>
              </div>
              <div className="pt-2 text-xs text-gray-600 dark:text-gray-400">
                {t("rateLimit")}
              </div>
            </div>
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
          <p className="text-gray-700 dark:text-gray-300">
            {t("regenerateConfirmMessage")}
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowRegenerateModal(false)}
              disabled={isRegenerating}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              variant="danger"
              onClick={handleRegenerate}
              isLoading={isRegenerating}
            >
              {t("regenerateToken")}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
