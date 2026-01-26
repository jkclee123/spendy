"use client";

import { useState, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import type { Id } from "../../../convex/_generated/dataModel";

interface ApiTokenDisplayProps {
  userId: Id<"users">;
  apiToken: string;
}

/**
 * Component to display and manage the user's API token
 * Includes copy-to-clipboard functionality and regenerate token with confirmation
 */
export function ApiTokenDisplay({ userId, apiToken }: ApiTokenDisplayProps) {
  const { showToast } = useToast();
  const [showToken, setShowToken] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showConfirmRegenerate, setShowConfirmRegenerate] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const regenerateApiToken = useMutation(api.users.regenerateApiToken);

  const handleCopyToken = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(apiToken);
      setCopied(true);
      showToast("Token copied to clipboard", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to copy token:", error);
      showToast("Failed to copy token", "error");
    }
  }, [apiToken, showToast]);

  const handleRegenerateToken = useCallback(async () => {
    setIsRegenerating(true);
    try {
      await regenerateApiToken({ userId });
      setShowConfirmRegenerate(false);
      showToast("API token regenerated successfully", "success");
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to regenerate token:", error);
      showToast("Failed to regenerate token", "error");
    } finally {
      setIsRegenerating(false);
    }
  }, [regenerateApiToken, userId, showToast]);

  const toggleShowToken = useCallback(() => {
    setShowToken((prev) => !prev);
  }, []);

  const maskedToken = apiToken.slice(0, 8) + "••••••••••••••••••••••••";

  return (
    <div className="space-y-4">
      {/* Token Display */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Your API Token
        </label>
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 font-mono text-sm text-gray-800 break-all">
            {showToken ? apiToken : maskedToken}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleShowToken}
            className="shrink-0"
            aria-label={showToken ? "Hide token" : "Show token"}
          >
            {showToken ? (
              <EyeOffIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleCopyToken}
          className="flex items-center gap-2"
        >
          {copied ? (
            <>
              <CheckIcon className="h-4 w-4 text-green-600" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <CopyIcon className="h-4 w-4" />
              <span>Copy Token</span>
            </>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowConfirmRegenerate(true)}
          className="flex items-center gap-2"
        >
          <RefreshIcon className="h-4 w-4" />
          <span>Regenerate Token</span>
        </Button>
      </div>

      {/* Usage Instructions */}
      <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
        <p className="font-medium">How to use your API token:</p>
        <p className="mt-1 text-blue-700">
          Include the token in your POST requests to{" "}
          <code className="rounded bg-blue-100 px-1 py-0.5 font-mono text-xs">
            /api/transaction
          </code>{" "}
          as the <code className="rounded bg-blue-100 px-1 py-0.5 font-mono text-xs">apiToken</code> field
          in the request body.
        </p>
      </div>

      {/* Regenerate Confirmation Modal */}
      {showConfirmRegenerate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">
              Regenerate API Token?
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              This will invalidate your current token. Any external integrations
              using the old token will stop working and need to be updated with
              the new token.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowConfirmRegenerate(false)}
                disabled={isRegenerating}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleRegenerateToken}
                isLoading={isRegenerating}
              >
                Regenerate
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple inline icons to avoid adding lucide-react dependency overhead
function EyeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
      />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}
