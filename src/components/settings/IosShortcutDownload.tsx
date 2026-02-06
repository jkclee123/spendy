"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { Download } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

/**
 * Component for downloading the iOS Shortcut file
 * - Displays information about the iOS shortcut
 * - Provides a download button that fetches and opens the file URL
 */
export function IosShortcutDownload() {
  const t = useTranslations("settings.iosShortcut");
  const { showToast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

  // Fetch the download URL from Convex
  const downloadUrlData = useQuery(api.files.getIosShortcutUrl);

  const handleDownload = async () => {
    if (!downloadUrlData?.url) {
      showToast(t("downloadError"), "error");
      return;
    }

    setIsDownloading(true);
    try {
      // Fetch the file as a blob to set custom filename
      const response = await fetch(downloadUrlData.url);
      if (!response.ok) {
        throw new Error("Failed to fetch file");
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      // Create anchor element with download attribute for custom filename
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = "Spendy-iOS-API.shortcut";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the blob URL
      window.URL.revokeObjectURL(blobUrl);

      showToast(t("downloadSuccess"), "success");
    } catch {
      showToast(t("downloadError"), "error");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">{t("description")}</p>

        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          disabled={!downloadUrlData?.url || isDownloading}
          isLoading={isDownloading}
          className="w-full"
        >
          <Download className="h-4 w-4 mr-2" />
          {t("downloadButton")}
        </Button>
      </CardContent>
    </Card>
  );
}
