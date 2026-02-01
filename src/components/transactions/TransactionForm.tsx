"use client";

import { useState, FormEvent, useCallback, useEffect, useMemo, useRef } from "react";
import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import type { Transaction } from "@/types";
import { Button } from "@/components/ui/Button";
import { CategorySelect } from "./CategorySelect";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/Toast";
import { Checkbox } from "@/components/ui/Checkbox";

/**
 * Safely evaluate a mathematical expression string
 * Only supports basic arithmetic: +, -, *, /, decimal numbers
 * Returns null if the expression is invalid
 */
function evaluateFormula(formula: string): number | null {
  // Remove all whitespace
  const sanitized = formula.replace(/\s/g, "");

  // Replace × with * and ÷ with / for evaluation (do this BEFORE validation)
  const normalized = sanitized.replace(/×/g, "*").replace(/÷/g, "/");

  // Check for invalid characters (only allow 0-9, +, -, *, /, .)
  if (!/^[\d+\-*/.]+$/.test(normalized)) {
    return null;
  }

  // Check for invalid patterns (multiple operators in a row, etc.)
  if (/[\+\*\/]{2,}/.test(normalized) || /[\+\-\*\/]$/.test(normalized) || /^[\*\/]/.test(normalized)) {
    return null;
  }

  // Check for multiple decimal points in a number
  const parts = normalized.split(/[\+\-\*\/]/);
  for (const part of parts) {
    if (part.split(".").length > 2) {
      return null;
    }
  }

  try {
    // Use Function constructor for safer evaluation than eval()
    // eslint-disable-next-line no-new-func
    const result = new Function("return " + normalized)();

    // Validate result is a finite number
    if (typeof result !== "number" || !isFinite(result) || isNaN(result)) {
      return null;
    }

    // Round to 2 decimal places for currency
    return Math.round(result * 100) / 100;
  } catch {
    return null;
  }
}

interface FormErrors {
  amount?: string;
  name?: string;
  category?: string;
  general?: string;
}

interface TransactionFormProps {
  userId: Id<"users">;
  initialData?: Transaction;
  latitude?: number;
  longitude?: number;
  initialAmount?: number;
  initialCategory?: Id<"userCategories">;
  initialName?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function TransactionForm({
  userId,
  initialData,
  latitude,
  longitude,
  initialAmount,
  initialCategory,
  initialName,
  onSuccess,
  onCancel,
}: TransactionFormProps) {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const t = useTranslations("transactions");
  const tCommon = useTranslations("common");

  const isEditMode = !!initialData;

  const [amount, setAmount] = useState(
    initialData
      ? initialData.amount.toString()
      : initialAmount !== undefined
        ? initialAmount.toString()
        : ""
  );
  const [name, setName] = useState(
    initialData?.name ?? initialName ?? ""
  );
  const [category, setCategory] = useState<Id<"userCategories"> | undefined>(
    initialData?.category ?? initialCategory
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [rememberTransaction, setRememberTransaction] = useState(false);
  const [createdAt, setCreatedAt] = useState<string>("");
  const amountInputRef = useRef<HTMLInputElement>(null);

  // Reset form when initial values change
  useEffect(() => {
    if (initialData) {
      setAmount(initialData.amount.toString());
      setName(initialData.name || "");
      setCategory(initialData.category);
      setCreatedAt(new Date(initialData.createdAt).toISOString().slice(0, 16));
    } else {
      setAmount(initialAmount !== undefined ? initialAmount.toString() : "");
      setName(initialName ?? "");
      setCategory(initialCategory);
      setCreatedAt("");
    }
    setErrors({});
  }, [
    initialData,
    initialAmount,
    initialCategory,
    initialName,
  ]);

  // Pre-check "Remember transaction" if latitude and longitude exist in query params
  useEffect(() => {
    if (latitude !== undefined && longitude !== undefined) {
      setRememberTransaction(true);
    } else {
      setRememberTransaction(false);
    }
  }, [latitude, longitude]);

  // Get the base mutation hook (following rules of hooks - must be at top level)
  const createTransactionBase = useMutation(api.transactions.createFromWeb);

  // Memoize the mutation with optimistic update to prevent expensive re-creation
  // on every keystroke. The .withOptimisticUpdate() creates a new function each time
  // it's called, so we need to memoize the result.
  const createTransaction = useMemo(() => {
    return createTransactionBase.withOptimisticUpdate((localStore, args) => {
      // Create a temporary optimistic transaction
      // The real ID will be assigned by the server
      const optimisticTransaction = {
        _id: `temp_${Date.now()}` as never, // Temporary ID
        _creationTime: Date.now(),
        userId: args.userId,
        name: args.name,
        amount: args.amount,
        category: args.category,
        createdAt: Date.now(),
      };

      // Get current transactions from local store and add the optimistic one
      const existingTransactions = localStore.getQuery(api.transactions.listByUser, {
        userId: args.userId,
      });

      if (existingTransactions !== undefined) {
        localStore.setQuery(
          api.transactions.listByUser,
          { userId: args.userId },
          [optimisticTransaction, ...existingTransactions]
        );
      }
    });
  }, [createTransactionBase]);

  // Update mutation
  const updateTransaction = useMutation(api.transactions.update);

  // Location history mutation
  const upsertLocationHistory = useMutation(api.locationHistories.upsertNearby);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    // Amount validation
    if (!amount.trim()) {
      newErrors.amount = t("errors.amountRequired");
    } else {
      // Try to evaluate as a formula first
      const evaluatedAmount = evaluateFormula(amount);
      if (evaluatedAmount === null) {
        newErrors.amount = t("errors.amountInvalid");
      } else if (evaluatedAmount <= 0) {
        newErrors.amount = t("errors.amountTooSmall");
      } else if (evaluatedAmount > 1000000000) {
        newErrors.amount = t("errors.amountTooLarge");
      }
    }

    // Category validation
    if (!category) {
      newErrors.category = t("errors.categoryRequired");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [amount, category, t]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!userId) {
      setErrors({ general: t("errors.userNotFound") });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Evaluate amount formula before submission
      const evaluatedAmount = evaluateFormula(amount);
      if (evaluatedAmount === null) {
        setErrors({ amount: t("errors.amountInvalid") });
        setIsSubmitting(false);
        return;
      }

      if (isEditMode && initialData) {
        // Update existing transaction
        const updateData: {
          transactionId: Id<"transactions">;
          amount: number;
          name: string;
          category?: Id<"userCategories">;
          createdAt?: number;
        } = {
          transactionId: initialData._id,
          amount: evaluatedAmount,
          name: name,
          category: category,
        };

        if (createdAt) {
          updateData.createdAt = new Date(createdAt).getTime();
        }

        await updateTransaction(updateData);

        showToast(t("successMessages.updated"), "success");
      } else {
        // Create new transaction
        await createTransaction({
          userId: userId,
          amount: evaluatedAmount,
          name: name,
          category: category,
        });

        // Update or create location history if checkbox is checked and coordinates exist
        if (rememberTransaction && latitude !== undefined && longitude !== undefined) {
          await upsertLocationHistory({
            userId: userId,
            latitude: latitude,
            longitude: longitude,
            amount: evaluatedAmount,
            category: category,
            name: name,
          });
        }

        // Reset form
        setAmount("");
        setName("");
        setCategory(undefined);

        showToast(t("successMessages.created"), "success");
      }

      onSuccess?.();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(
        isEditMode ? "Failed to update transaction:" : "Failed to create transaction:",
        error
      );
      const errorMessage =
        error instanceof Error
          ? error.message
          : isEditMode
            ? t("errors.updateFailed")
            : t("errors.createFailed");
      setErrors({ general: errorMessage });
      showToast(errorMessage, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.general && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-600 dark:text-red-400">
          {errors.general}
        </div>
      )}

      {/* Amount Field */}
      <div>
        <label
          htmlFor="amount"
          className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {t("amount")} <span className="text-red-500 dark:text-red-400">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
            $
          </span>
          <input
            ref={amountInputRef}
            type="text"
            id="amount"
            inputMode="decimal"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              if (errors.amount) {
                setErrors((prev) => ({ ...prev, amount: undefined }));
              }
            }}
            placeholder={t("amountPlaceholder")}
            disabled={isSubmitting}
            className={`
              w-full rounded-xl border bg-white py-3 pl-8 pr-10 text-base text-gray-900
              dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700
              placeholder:text-gray-400 dark:placeholder:text-gray-500
              transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:text-gray-500
              ${errors.amount
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600"
              }
            `}
          />
          {amount && (
            <button
              type="button"
              onClick={() => {
                setAmount("");
                document.getElementById("amount")?.focus();
              }}
              disabled={isSubmitting}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Clear amount"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Calculator Buttons */}
        <div className="mt-2 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              const input = amountInputRef.current;
              if (input) {
                const start = input.selectionStart || amount.length;
                const newValue = amount.slice(0, start) + "+" + amount.slice(start);
                setAmount(newValue);
                input.focus();
                setTimeout(() => {
                  input.setSelectionRange(start + 1, start + 1);
                }, 0);
              }
            }}
            disabled={isSubmitting}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 text-lg font-semibold text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Add plus operator"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => {
              const input = amountInputRef.current;
              if (input) {
                const start = input.selectionStart || amount.length;
                const newValue = amount.slice(0, start) + "-" + amount.slice(start);
                setAmount(newValue);
                input.focus();
                setTimeout(() => {
                  input.setSelectionRange(start + 1, start + 1);
                }, 0);
              }
            }}
            disabled={isSubmitting}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 text-lg font-semibold text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Add minus operator"
          >
            -
          </button>
          <button
            type="button"
            onClick={() => {
              const input = amountInputRef.current;
              if (input) {
                const start = input.selectionStart || amount.length;
                const newValue = amount.slice(0, start) + "×" + amount.slice(start);
                setAmount(newValue);
                input.focus();
                setTimeout(() => {
                  input.setSelectionRange(start + 1, start + 1);
                }, 0);
              }
            }}
            disabled={isSubmitting}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 text-lg font-semibold text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Add multiply operator"
          >
            ×
          </button>
          <button
            type="button"
            onClick={() => {
              const input = amountInputRef.current;
              if (input) {
                const start = input.selectionStart || amount.length;
                const newValue = amount.slice(0, start) + "÷" + amount.slice(start);
                setAmount(newValue);
                input.focus();
                setTimeout(() => {
                  input.setSelectionRange(start + 1, start + 1);
                }, 0);
              }
            }}
            disabled={isSubmitting}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 text-lg font-semibold text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Add divide operator"
          >
            ÷
          </button>
          <button
            type="button"
            onClick={() => {
              const result = evaluateFormula(amount);
              if (result !== null) {
                setAmount(result.toString());
                setErrors((prev) => ({ ...prev, amount: undefined }));
                const input = amountInputRef.current;
                if (input) {
                  input.focus();
                  setTimeout(() => {
                    input.setSelectionRange(result.toString().length, result.toString().length);
                  }, 0);
                }
               } else {
                // Invalid formula - show error instead of clearing
                setErrors((prev) => ({ ...prev, amount: t("errors.amountInvalid") }));
                const input = amountInputRef.current;
                if (input) {
                  input.focus();
                }
              }
            }}
            disabled={isSubmitting}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500 dark:bg-blue-600 text-lg font-semibold text-white transition-colors hover:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Evaluate formula"
          >
            =
          </button>
        </div>

        {errors.amount && (
          <p className="mt-1.5 text-sm text-red-500 dark:text-red-400">{errors.amount}</p>
        )}
      </div>

      {/* Category Field */}
      <CategorySelect
        label={t("category")}
        required
        userId={userId}
        value={category as string}
        onChange={(e) => {
          setCategory(e.target.value as Id<"userCategories">);
          if (errors.category) {
            setErrors((prev) => ({ ...prev, category: undefined }));
          }
        }}
        disabled={isSubmitting}
        error={errors.category}
      />

      {/* Name Field */}
      <div>
        <label
          htmlFor="name"
          className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {t("name")}
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) {
              setErrors((prev) => ({ ...prev, name: undefined }));
            }
          }}
          placeholder={t("namePlaceholder")}
          disabled={isSubmitting}
          className={`
            w-full rounded-xl border bg-white py-3 px-4 text-base text-gray-900
            dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700
            placeholder:text-gray-400 dark:placeholder:text-gray-500
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:text-gray-500
            ${errors.name
              ? "border-red-500 focus:ring-red-500"
              : "border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600"
            }
          `}
        />
        {errors.name && (
          <p className="mt-1.5 text-sm text-red-500 dark:text-red-400">{errors.name}</p>
        )}
      </div>

      {/* Created At Field - Only in edit mode */}
      {isEditMode && (
        <div>
          <label
            htmlFor="createdAt"
            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {t("dateTime")}
          </label>
          <input
            type="datetime-local"
            id="createdAt"
            value={createdAt}
            onChange={(e) => setCreatedAt(e.target.value)}
            disabled={isSubmitting}
            className={`
              w-full rounded-xl border bg-white py-3 px-4 text-base text-gray-900
              dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700
              transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:text-gray-500
              border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600
            `}
          />
        </div>
      )}

      {/* Remember Transaction Checkbox - Only on create page with coordinates */}
      {!isEditMode && latitude !== undefined && longitude !== undefined && (
        <div className="pt-2">
          <Checkbox
            id="rememberTransaction"
            onChange={(e) => setRememberTransaction(e.target.checked)}
            label={t("rememberTransaction")}
            disabled={isSubmitting}
          />
        </div>
      )}

      {/* Form Actions */}
      <div className="flex gap-3 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1"
          >
            {tCommon("cancel")}
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          disabled={isSubmitting || !session?.user}
          className="flex-1"
        >
          {isSubmitting
            ? isEditMode
              ? t("saving")
              : t("creating")
            : isEditMode
              ? t("saveChanges")
              : tCommon("create")}
        </Button>
      </div>
    </form>
  );
}
