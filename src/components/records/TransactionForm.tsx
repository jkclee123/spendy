"use client";

import { useState, FormEvent, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/Button";
import { CategorySelect } from "./CategorySelect";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/Toast";

interface FormErrors {
  amount?: string;
  category?: string;
  paymentMethod?: string;
  general?: string;
}

interface TransactionFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function TransactionForm({ onSuccess, onCancel }: TransactionFormProps) {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // Get the user from Convex by email
  const user = useQuery(
    api.users.getByEmail,
    session?.user?.email ? { email: session.user.email } : "skip"
  );

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [amount]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!user?._id) {
      setErrors({ general: "User not found. Please try logging in again." });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await createTransaction({
        userId: user._id,
        amount: parseFloat(amount),
        category: category || undefined,
        paymentMethod: paymentMethod || undefined,
      });

      // Reset form
      setAmount("");
      setCategory("");
      setPaymentMethod("");

      showToast("Transaction added successfully", "success");
      onSuccess?.();
    } catch (error) {
      console.error("Failed to create transaction:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
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
              w-full rounded-xl border py-3 pl-8 pr-4 text-base
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
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        disabled={isSubmitting}
        error={errors.category}
      />

      {/* Payment Method Field */}
      <div>
        <label
          htmlFor="paymentMethod"
          className="mb-1.5 block text-sm font-medium text-gray-700"
        >
          Payment Method
        </label>
        <input
          type="text"
          id="paymentMethod"
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          placeholder="e.g., Credit Card, Cash"
          disabled={isSubmitting}
          className={`
            w-full rounded-xl border border-gray-300 px-4 py-3 text-base
            transition-colors duration-200
            hover:border-gray-400
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500
          `}
        />
      </div>

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
          disabled={isSubmitting || !user}
          className="flex-1"
        >
          {isSubmitting ? "Adding..." : "Add Transaction"}
        </Button>
      </div>
    </form>
  );
}
