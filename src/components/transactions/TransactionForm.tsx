"use client";

import { useState, FormEvent, useCallback, useEffect, useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import type { Transaction } from "@/types";
import { Button } from "@/components/ui/Button";
import { CategoryDropdown } from "@/components/ui/CategoryDropdown";
import { useToast } from "@/components/ui/Toast";
import { useLanguage } from "@/hooks/useLanguage";

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
  if (
    /[\+\*\/]{2,}/.test(normalized) ||
    /[\+\-\*\/]$/.test(normalized) ||
    /^[\*\/]/.test(normalized)
  ) {
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

/**
 * Format a YYYY-MM-DDTHH:mm string into dd/MM/yyyy HH:mm for display
 */
function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const [datePart, timePart] = dateStr.split("T");
    const [year, month, day] = datePart.split("-");
    const [hours, minutes] = timePart.split(":");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return dateStr;
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
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function TransactionForm({
  userId,
  initialData,
  onSuccess,
  onCancel,
}: TransactionFormProps) {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const { lang } = useLanguage();
  const t = useTranslations("transactions");
  const tCommon = useTranslations("common");

  const isEditMode = !!initialData;

  // Fetch user categories
  const categories = useQuery(api.userCategories.listActiveByUser, userId ? { userId } : "skip");

  const [type, setType] = useState<"expense" | "income">(initialData?.type ?? "expense");
  const [amount, setAmount] = useState(initialData ? initialData.amount.toString() : "");
  const [name, setName] = useState(initialData?.name ?? "");
  const [category, setCategory] = useState<Id<"userCategories"> | undefined>(initialData?.category);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [createdAt, setCreatedAt] = useState<string>("");

  // Reset form when initial values change
  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setAmount(initialData.amount.toString());
      setName(initialData.name || "");
      setCategory(initialData.category);
      // Convert to local time for datetime-local input
      const date = new Date(initialData.createdAt);
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      setCreatedAt(`${year}-${month}-${day}T${hours}:${minutes}`);
    } else {
      setAmount("");
      setName("");
      setCategory(undefined);
      setCreatedAt("");
    }
    setErrors({});
  }, [initialData]);

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
        type: args.type,
        createdAt: Date.now(),
      };

      // Get current transactions from local store and add the optimistic one
      const existingTransactions = localStore.getQuery(api.transactions.listByUser, {
        userId: args.userId,
      });

      if (existingTransactions !== undefined) {
        localStore.setQuery(api.transactions.listByUser, { userId: args.userId }, [
          optimisticTransaction,
          ...existingTransactions,
        ]);
      }
    });
  }, [createTransactionBase]);

  // Update mutation
  const updateTransaction = useMutation(api.transactions.update);

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

    // Category validation - only required for expense transactions
    if (type === "expense" && !category) {
      newErrors.category = t("errors.categoryRequired");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [amount, category, t, type]);

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
          type: type,
        });

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

      {/* Type Selector - Expense/Income Toggle */}
      <div className="flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700">
        <button
          type="button"
          onClick={() => {
            setType("expense");
            if (errors.category) {
              setErrors((prev) => ({ ...prev, category: undefined }));
            }
          }}
          disabled={isSubmitting}
          className={`
            flex-1 py-2.5 text-sm font-medium transition-colors duration-200
            ${
              type === "expense"
                ? "bg-blue-500 text-white"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            }
            disabled:cursor-not-allowed disabled:opacity-50
          `}
        >
          {t("expense")}
        </button>
        <button
          type="button"
          onClick={() => {
            setType("income");
            if (errors.category) {
              setErrors((prev) => ({ ...prev, category: undefined }));
            }
          }}
          disabled={isSubmitting}
          className={`
            flex-1 py-2.5 text-sm font-medium transition-colors duration-200
            ${
              type === "income"
                ? "bg-blue-500 text-white"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            }
            disabled:cursor-not-allowed disabled:opacity-50
          `}
        >
          {t("income")}
        </button>
      </div>

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
              w-full min-w-0 rounded-xl border bg-white py-3 pl-8 pr-10 text-base text-gray-900
              dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700
              placeholder:text-gray-400 dark:placeholder:text-gray-500
              transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:text-gray-500
              ${
                errors.amount
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
              aria-label={t("clearAmount")}
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

        {errors.amount && (
          <p className="mt-1.5 text-sm text-red-500 dark:text-red-400">{errors.amount}</p>
        )}
      </div>

      {/* Category Field - Only for expense transactions */}
      {type === "expense" && (
        <CategoryDropdown
          label={t("category")}
          placeholder={t("selectCategory")}
          required
          categories={categories || []}
          value={category}
          onChange={(newCategory) => {
            setCategory(newCategory);
            if (errors.category) {
              setErrors((prev) => ({ ...prev, category: undefined }));
            }
          }}
          currentLang={lang}
          disabled={isSubmitting}
          error={errors.category}
        />
      )}

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
          placeholder={type === "income" ? t("namePlaceholderIncome") : t("namePlaceholder")}
          disabled={isSubmitting}
          className={`
            w-full min-w-0 rounded-xl border bg-white py-3 px-4 text-base text-gray-900
            dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700
            placeholder:text-gray-400 dark:placeholder:text-gray-500
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:text-gray-500
            ${
              errors.name
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
        <div className="w-full">
          <label
            htmlFor="createdAt"
            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {t("dateTime")}
          </label>
          <div className="relative w-full">
            {/* Display formatted date */}
            <div
              className={`
                w-full rounded-xl border bg-white py-3 px-4 text-base text-gray-900
                dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700
                border-gray-300 dark:border-gray-700
                flex items-center
              `}
            >
              {formatDisplayDate(createdAt)}
            </div>
            {/* Hidden native picker overlay */}
            <input
              type="datetime-local"
              id="createdAt"
              value={createdAt}
              onChange={(e) => setCreatedAt(e.target.value)}
              disabled={isSubmitting}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0 [color-scheme:light] dark:[color-scheme:dark]"
              style={{ fontSize: "16px" }}
            />
          </div>
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
