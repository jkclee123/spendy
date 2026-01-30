"use client";

import { useState, FormEvent, useCallback, useEffect, useMemo } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import type { Transaction } from "@/types";
import { Button } from "@/components/ui/Button";
import { CategorySelect } from "./CategorySelect";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/Toast";
import { Checkbox } from "@/components/ui/Checkbox";

interface FormErrors {
  amount?: string;
  name?: string;
  merchant?: string;
  category?: string;
  paymentMethod?: string;
  general?: string;
}

interface LocationHistoryData {
  amount: number;
  category: string;
}

interface TransactionFormProps {
  userId: Id<"users">;
  initialData?: Transaction;
  latitude?: number;
  longitude?: number;
  initialLocationHistory?: LocationHistoryData;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function TransactionForm({
  userId,
  initialData,
  latitude,
  longitude,
  initialLocationHistory,
  onSuccess,
  onCancel,
}: TransactionFormProps) {
  const { data: session } = useSession();
  const { showToast } = useToast();

  const isEditMode = !!initialData;

  const [amount, setAmount] = useState(
    initialData
      ? initialData.amount.toString()
      : initialLocationHistory
        ? initialLocationHistory.amount.toString()
        : ""
  );
  const [name, setName] = useState(initialData?.name ?? "");
  const [merchant, setMerchant] = useState(initialData?.merchant ?? "");
  const [category, setCategory] = useState(
    initialData?.category ?? initialLocationHistory?.category ?? ""
  );
  const [paymentMethod, setPaymentMethod] = useState(
    initialData?.paymentMethod ?? ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [rememberTransaction, setRememberTransaction] = useState(false);

  // Reset form when initialData or initialLocationHistory changes
  useEffect(() => {
    if (initialData) {
      setAmount(initialData.amount.toString());
      setName(initialData.name || "");
      setMerchant(initialData.merchant || "");
      setCategory(initialData.category || "");
      setPaymentMethod(initialData.paymentMethod || "");
    } else if (initialLocationHistory) {
      setAmount(initialLocationHistory.amount.toString());
      setName("");
      setMerchant("");
      setCategory(initialLocationHistory.category);
      setPaymentMethod("");
    } else {
      setAmount("");
      setName("");
      setMerchant("");
      setCategory("");
      setPaymentMethod("");
    }
    setErrors({});
  }, [initialData, initialLocationHistory]);

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
          name: name,
          merchant: merchant,
          category: category,
          paymentMethod: paymentMethod,
        });

        showToast("Transaction updated successfully", "success");
      } else {
        // Create new transaction
        await createTransaction({
          userId: userId,
          amount: parseFloat(amount),
          name: name,
          merchant: merchant,
          category: category,
          paymentMethod: paymentMethod,
        });

        // Update or create location history if checkbox is checked and coordinates exist
        if (rememberTransaction && latitude !== undefined && longitude !== undefined) {
          await upsertLocationHistory({
            userId: userId,
            latitude: latitude,
            longitude: longitude,
            amount: parseFloat(amount),
            category: category,
          });
        }

        // Reset form
        setAmount("");
        setName("");
        setMerchant("");
        setCategory("");
        setPaymentMethod("");

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
            ${
              errors.name
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 hover:border-gray-400"
            }
          `}
        />
        {errors.name && (
          <p className="mt-1.5 text-sm text-red-500">{errors.name}</p>
        )}
      </div>

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
          onChange={(e) => {
            setPaymentMethod(e.target.value);
            if (errors.paymentMethod) {
              setErrors((prev) => ({ ...prev, paymentMethod: undefined }));
            }
          }}
          placeholder="e.g., Credit Card, Cash"
          disabled={isSubmitting}
          className={`
            w-full rounded-xl border bg-white py-3 px-4 text-base text-gray-900
            placeholder:text-gray-400
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500
            ${
              errors.paymentMethod
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 hover:border-gray-400"
            }
          `}
        />
        {errors.paymentMethod && (
          <p className="mt-1.5 text-sm text-red-500">{errors.paymentMethod}</p>
        )}
      </div>

      {/* Merchant Field */}
      <div>
        <label
          htmlFor="merchant"
          className="mb-1.5 block text-sm font-medium text-gray-700"
        >
          Merchant
        </label>
        <input
          type="text"
          id="merchant"
          value={merchant}
          onChange={(e) => {
            setMerchant(e.target.value);
            if (errors.merchant) {
              setErrors((prev) => ({ ...prev, merchant: undefined }));
            }
          }}
          placeholder="e.g., Starbucks, Amazon"
          disabled={isSubmitting}
          className={`
            w-full rounded-xl border bg-white py-3 px-4 text-base text-gray-900
            placeholder:text-gray-400
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500
            ${
              errors.merchant
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 hover:border-gray-400"
            }
          `}
        />
        {errors.merchant && (
          <p className="mt-1.5 text-sm text-red-500">{errors.merchant}</p>
        )}
      </div>

      {/* Remember Transaction Checkbox - Only on create page with coordinates */}
      {!isEditMode && latitude !== undefined && longitude !== undefined && (
        <div className="pt-2">
          <Checkbox
            id="rememberTransaction"
            checked={rememberTransaction}
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
              : "Adding..."
            : isEditMode
              ? "Save Changes"
              : "Add Transaction"}
        </Button>
      </div>
    </form>
  );
}
