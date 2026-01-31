"use client";

import { useState, FormEvent, useCallback, useEffect, useMemo, useRef } from "react";
import { useMutation } from "convex/react";
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
  initialCategory?: string;
  initialName?: string;
  initialMerchant?: string;
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
  initialMerchant,
  onSuccess,
  onCancel,
}: TransactionFormProps) {
  const { data: session } = useSession();
  const { showToast } = useToast();

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
  const [merchant, setMerchant] = useState(
    initialData?.merchant ?? initialMerchant ?? ""
  );
  const [category, setCategory] = useState(
    initialData?.category ?? initialCategory ?? ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [rememberTransaction, setRememberTransaction] = useState(false);
  const amountInputRef = useRef<HTMLInputElement>(null);

  // Reset form when initial values change
  useEffect(() => {
    if (initialData) {
      setAmount(initialData.amount.toString());
      setName(initialData.name || "");
      setMerchant(initialData.merchant || "");
      setCategory(initialData.category || "");
    } else {
      setAmount(initialAmount !== undefined ? initialAmount.toString() : "");
      setName(initialName ?? "");
      setMerchant(initialMerchant ?? "");
      setCategory(initialCategory ?? "");
    }
    setErrors({});
  }, [
    initialData,
    initialAmount,
    initialCategory,
    initialName,
    initialMerchant,
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
        merchant: args.merchant,
        amount: args.amount,
        category: args.category,
        createdAt: Date.now(),
        source: "web" as const,
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
      newErrors.amount = "Amount is required";
    } else {
      // Try to evaluate as a formula first
      const evaluatedAmount = evaluateFormula(amount);
      if (evaluatedAmount === null) {
        newErrors.amount = "Amount must be a valid number or formula";
      } else if (evaluatedAmount <= 0) {
        newErrors.amount = "Amount must be greater than 0";
      } else if (evaluatedAmount > 1000000000) {
        newErrors.amount = "Amount is too large";
      }
    }

    // Category validation
    if (!category.trim()) {
      newErrors.category = "Category is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [amount, category]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!userId) {
      setErrors({ general: "User not found. Please try logging in again." });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Evaluate amount formula before submission
      const evaluatedAmount = evaluateFormula(amount);
      if (evaluatedAmount === null) {
        setErrors({ amount: "Amount must be a valid number or formula" });
        setIsSubmitting(false);
        return;
      }

      if (isEditMode && initialData) {
        // Update existing transaction
        await updateTransaction({
          transactionId: initialData._id,
          amount: evaluatedAmount,
          name: name,
          merchant: merchant,
          category: category,
        });

        showToast("Transaction updated successfully", "success");
      } else {
        // Create new transaction
        await createTransaction({
          userId: userId,
          amount: evaluatedAmount,
          name: name,
          merchant: merchant,
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
        setMerchant("");
        setCategory("");

        showToast("Transaction added successfully", "success");
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
            ? "Failed to update transaction. Please try again."
            : "Failed to create transaction. Please try again.";
      setErrors({ general: errorMessage });
      showToast(errorMessage, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.general && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {errors.general}
        </div>
      )}

      {/* Amount Field */}
      <div>
        <label
          htmlFor="amount"
          className="mb-1.5 block text-sm font-medium text-gray-700"
        >
          Amount <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
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
            placeholder="0.00"
            disabled={isSubmitting}
            className={`
              w-full rounded-xl border bg-white py-3 pl-8 pr-10 text-base text-gray-900
              placeholder:text-gray-400
              transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500
              ${errors.amount
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 hover:border-gray-400"
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
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
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
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-lg font-semibold text-gray-700 transition-colors hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
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
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-lg font-semibold text-gray-700 transition-colors hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
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
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-lg font-semibold text-gray-700 transition-colors hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
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
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-lg font-semibold text-gray-700 transition-colors hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
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
                setErrors((prev) => ({ ...prev, amount: "Invalid amount" }));
                const input = amountInputRef.current;
                if (input) {
                  input.focus();
                }
              }
            }}
            disabled={isSubmitting}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500 text-lg font-semibold text-white transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Evaluate formula"
          >
            =
          </button>
        </div>

        {errors.amount && (
          <p className="mt-1.5 text-sm text-red-500">{errors.amount}</p>
        )}
      </div>

      {/* Category Field */}
      <CategorySelect
        label="Category"
        required
        value={category}
        onChange={(e) => {
          setCategory(e.target.value);
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
          className="mb-1.5 block text-sm font-medium text-gray-700"
        >
          Name
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
          placeholder="e.g., Lunch at Starbucks"
          disabled={isSubmitting}
          className={`
            w-full rounded-xl border bg-white py-3 px-4 text-base text-gray-900
            placeholder:text-gray-400
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500
            ${errors.name
              ? "border-red-500 focus:ring-red-500"
              : "border-gray-300 hover:border-gray-400"
            }
          `}
        />
        {errors.name && (
          <p className="mt-1.5 text-sm text-red-500">{errors.name}</p>
        )}
      </div>

      {/* Remember Transaction Checkbox - Only on create page with coordinates */}
      {!isEditMode && latitude !== undefined && longitude !== undefined && (
        <div className="pt-2">
          <Checkbox
            id="rememberTransaction"
            onChange={(e) => setRememberTransaction(e.target.checked)}
            label="Remember transaction"
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
            Cancel
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
              ? "Saving..."
              : "Creating..."
            : isEditMode
              ? "Save Changes"
              : "Create"}
        </Button>
      </div>
    </form>
  );
}
