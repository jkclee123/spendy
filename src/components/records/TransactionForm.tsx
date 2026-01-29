"use client";

import { useState, FormEvent, useCallback, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import type { Transaction } from "@/types";
import { Button } from "@/components/ui/Button";
import { CategorySelect } from "./CategorySelect";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/Toast";

interface FormErrors {
  amount?: string;
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

  const isEditMode = !!initialData;

  const [amount, setAmount] = useState(
    initialData ? initialData.amount.toString() : ""
  );
  const [category, setCategory] = useState(initialData?.category || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // Reset form when initialData changes (e.g., when navigating between edits)
  useEffect(() => {
    if (initialData) {
      setAmount(initialData.amount.toString());
      setCategory(initialData.category || "");
    } else {
      setAmount("");
      setCategory("");
    }
    setErrors({});
  }, [initialData]);

  // Use mutation with optimistic update for instant UI feedback
  const createTransaction = useMutation(
    api.transactions.createFromWeb
  ).withOptimisticUpdate((localStore, args) => {
    // Create a temporary optimistic transaction
    // The real ID will be assigned by the server
    const optimisticTransaction = {
      _id: `temp_${Date.now()}` as never, // Temporary ID
      _creationTime: Date.now(),
      userId: args.userId,
      amount: args.amount,
      category: args.category,
      paymentMethod: args.paymentMethod,
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

  // Update mutation
  const updateTransaction = useMutation(api.transactions.update);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    // Amount validation
    if (!amount.trim()) {
      newErrors.amount = "Amount is required";
    } else {
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum)) {
        newErrors.amount = "Amount must be a valid number";
      } else if (amountNum <= 0) {
        newErrors.amount = "Amount must be greater than 0";
      } else if (amountNum > 1000000000) {
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
      if (isEditMode && initialData) {
        // Update existing transaction
        await updateTransaction({
          transactionId: initialData._id,
          amount: parseFloat(amount),
          category: category,
        });

        showToast("Transaction updated successfully", "success");
      } else {
        // Create new transaction
        await createTransaction({
          userId: userId,
          amount: parseFloat(amount),
          category: category,
        });

        // Reset form
        setAmount("");
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
            type="number"
            id="amount"
            inputMode="decimal"
            step="0.01"
            min="0"
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
              w-full rounded-xl border bg-white py-3 pl-8 pr-4 text-base text-gray-900
              placeholder:text-gray-400
              transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500
              ${
                errors.amount
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 hover:border-gray-400"
              }
            `}
          />
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
              : "Adding..."
            : isEditMode
              ? "Save Changes"
              : "Add Transaction"}
        </Button>
      </div>
    </form>
  );
}
