"use client";

import { useState, useCallback, FormEvent, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/Button";
import { CategorySelect } from "./CategorySelect";
import { useToast } from "@/components/ui/Toast";
import type { Transaction } from "@/types";
import { formatDistanceToNow } from "date-fns";

interface TransactionDetailProps {
  transaction: Transaction;
  onClose: () => void;
  onDeleted?: () => void;
  onUpdated?: () => void;
}

interface FormErrors {
  amount?: string;
  general?: string;
}

/**
 * Transaction detail view/modal with edit and delete functionality
 * Displays transaction details and allows users to modify or remove transactions
 */
export function TransactionDetail({
  transaction,
  onClose,
  onDeleted,
  onUpdated,
}: TransactionDetailProps) {
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // Form state
  const [amount, setAmount] = useState(transaction.amount.toString());
  const [category, setCategory] = useState(transaction.category || "");

  // Convex mutations with optimistic updates
  const updateTransaction = useMutation(
    api.transactions.update
  ).withOptimisticUpdate((localStore, args) => {
    // Optimistically update the transaction in the list
    const existingTransactions = localStore.getQuery(api.transactions.listByUser, {
      userId: transaction.userId,
    });

    if (existingTransactions !== undefined) {
      const updatedTransactions = existingTransactions.map((t) =>
        t._id === args.transactionId
          ? {
            ...t,
            ...(args.amount !== undefined && { amount: args.amount }),
            ...(args.category !== undefined && { category: args.category }),
          }
          : t
      );
      localStore.setQuery(
        api.transactions.listByUser,
        { userId: transaction.userId },
        updatedTransactions
      );
    }
  });

  const deleteTransaction = useMutation(
    api.transactions.remove
  ).withOptimisticUpdate((localStore, args) => {
    // Optimistically remove the transaction from the list
    const existingTransactions = localStore.getQuery(api.transactions.listByUser, {
      userId: transaction.userId,
    });

    if (existingTransactions !== undefined) {
      const filteredTransactions = existingTransactions.filter(
        (t) => t._id !== args.transactionId
      );
      localStore.setQuery(
        api.transactions.listByUser,
        { userId: transaction.userId },
        filteredTransactions
      );
    }
  });

  // Reset form when transaction changes
  useEffect(() => {
    setAmount(transaction.amount.toString());
    setCategory(transaction.category || "");
    setIsEditing(false);
    setShowDeleteConfirm(false);
    setErrors({});
  }, [transaction]);

  // Format transaction details
  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(transaction.amount);

  const formattedDate = formatDistanceToNow(new Date(transaction.createdAt), {
    addSuffix: true,
  });

  const absoluteDate = new Date(transaction.createdAt).toLocaleDateString(
    "en-US",
    {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }
  );

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

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

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await updateTransaction({
        transactionId: transaction._id,
        amount: parseFloat(amount),
        category: category || undefined,
      });

      setIsEditing(false);
      showToast("Transaction updated successfully", "success");
      onUpdated?.();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to update transaction:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to update transaction. Please try again.";
      setErrors({ general: errorMessage });
      showToast(errorMessage, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setErrors({});

    try {
      await deleteTransaction({
        transactionId: transaction._id,
      });

      showToast("Transaction deleted successfully", "success");
      onDeleted?.();
      onClose();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to delete transaction:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to delete transaction. Please try again.";
      setErrors({ general: errorMessage });
      showToast(errorMessage, "error");
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelEdit = useCallback(() => {
    setAmount(transaction.amount.toString());
    setCategory(transaction.category || "");
    setIsEditing(false);
    setErrors({});
  }, [transaction.amount, transaction.category]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showDeleteConfirm) {
          setShowDeleteConfirm(false);
        } else if (isEditing) {
          handleCancelEdit();
        } else {
          onClose();
        }
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [showDeleteConfirm, isEditing, onClose, handleCancelEdit]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="transaction-detail-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2
            id="transaction-detail-title"
            className="text-lg font-semibold text-gray-900"
          >
            {isEditing ? "Update Transaction" : "Transaction Details"}
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {errors.general && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {errors.general}
            </div>
          )}

          {isEditing ? (
            // Edit Mode
            <form onSubmit={handleSave} className="space-y-4">
              {/* Amount Field */}
              <div>
                <label
                  htmlFor="edit-amount"
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
                    id="edit-amount"
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
                      ${errors.amount
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
              />

              {/* Form Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isSubmitting}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          ) : showDeleteConfirm ? (
            // Delete Confirmation
            <div className="space-y-4">
              <div className="flex flex-col items-center py-4 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                  <svg
                    className="h-8 w-8 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Delete Transaction?
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  This action cannot be undone. The transaction of{" "}
                  <span className="font-medium text-gray-900">
                    {formattedAmount}
                  </span>{" "}
                  will be permanently removed.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  onClick={handleDelete}
                  isLoading={isDeleting}
                  disabled={isDeleting}
                  className="flex-1"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>
          ) : (
            // View Mode
            <div className="space-y-4">
              {/* Amount */}
              <div className="flex flex-col items-center border-b border-gray-100 pb-4">
                <span className="text-sm text-gray-500">Amount</span>
                <span className="text-3xl font-bold text-gray-900">
                  {formattedAmount}
                </span>
              </div>

              {/* Details Grid */}
              <div className="space-y-3">
                <DetailRow
                  label="Category"
                  value={transaction.category || "Uncategorized"}
                  icon={getCategoryIcon(transaction.category)}
                />
                <DetailRow
                  label="Date"
                  value={
                    <span title={absoluteDate}>
                      {formattedDate}
                      <span className="ml-1 text-xs text-gray-400">
                        ({absoluteDate})
                      </span>
                    </span>
                  }
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions (only in view mode) */}
        {!isEditing && !showDeleteConfirm && (
          <div className="flex gap-3 border-t border-gray-100 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteConfirm(true)}
              className="flex-1"
            >
              Delete
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => setIsEditing(true)}
              className="flex-1"
            >
              Edit
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Detail row component for view mode
 */
function DetailRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="flex items-center gap-2 text-sm font-medium text-gray-900">
        {icon && <span>{icon}</span>}
        {value}
      </span>
    </div>
  );
}

/**
 * Get category icon
 */
function getCategoryIcon(category?: string): string {
  const iconMap: Record<string, string> = {
    "Restaurants & Bars": "🍽️",
    Drinks: "🥤",
    Transport: "🚌",
    Entertainment: "🎢",
    Groceries: "👨🏼‍🍳",
    Accommodation: "🏨",
    Healthcare: "💊",
    Insurance: "📜",
    "Rent & Charges": "🏡",
    Shopping: "🛍️",
    Other: "❓",
  };

  return category ? iconMap[category] || "💰" : "💰";
}
