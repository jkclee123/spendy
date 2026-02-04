import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import type {
  CreateTransactionRequest,
  CreateTransactionResponse,
  ErrorResponse,
} from "@/types";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Rate limiting: in-memory Map tracking requests per API token
// Key: apiToken, Value: { count: number, resetTime: number }
const rateLimitMap = new Map<
  string,
  { count: number; resetTime: number }
>();

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 60; // 60 requests per minute

/**
 * Check if an API token has exceeded the rate limit
 * Returns true if rate limited, false otherwise
 */
function isRateLimited(apiToken: string): {
  limited: boolean;
  remaining: number;
  resetTime: number;
} {
  const now = Date.now();
  const entry = rateLimitMap.get(apiToken);

  if (!entry || now > entry.resetTime) {
    // Reset or initialize
    const resetTime = now + RATE_LIMIT_WINDOW_MS;
    rateLimitMap.set(apiToken, { count: 1, resetTime });
    return {
      limited: false,
      remaining: RATE_LIMIT_MAX - 1,
      resetTime,
    };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return {
      limited: true,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  entry.count++;
  return {
    limited: false,
    remaining: RATE_LIMIT_MAX - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * POST /api/transactions/create
 * Creates a new transaction via external API using API token authentication
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = (await request.json()) as CreateTransactionRequest;

    // Validate required fields
    if (!body.apiToken || typeof body.apiToken !== "string") {
      const errorResponse: ErrorResponse = {
        error: "Authentication failed",
        message: "apiToken is required",
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    if (body.amount === undefined || typeof body.amount !== "number") {
      const errorResponse: ErrorResponse = {
        error: "Validation failed",
        message: "amount is required and must be a positive number",
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    if (body.amount <= 0) {
      const errorResponse: ErrorResponse = {
        error: "Validation failed",
        message: "amount must be a positive number (greater than 0)",
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    if (!body.category || typeof body.category !== "string" || body.category.trim() === "") {
      const errorResponse: ErrorResponse = {
        error: "Validation failed",
        message: "category is required and must be a non-empty string",
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Check rate limit
    const rateLimit = isRateLimited(body.apiToken);
    if (rateLimit.limited) {
      const errorResponse: ErrorResponse = {
        error: "Rate limit exceeded",
        message: `Too many requests. Limit: ${RATE_LIMIT_MAX} requests per minute. Try again in ${Math.ceil((rateLimit.resetTime - Date.now()) / 1000)} seconds.`,
      };
      return NextResponse.json(errorResponse, {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(RATE_LIMIT_MAX),
          "X-RateLimit-Remaining": String(rateLimit.remaining),
          "X-RateLimit-Reset": String(rateLimit.resetTime),
          "Retry-After": String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)),
        },
      });
    }

    // Authenticate user via API token
    const user = await convex.query(api.users.getByApiToken, {
      apiToken: body.apiToken,
    });

    if (!user) {
      const errorResponse: ErrorResponse = {
        error: "Authentication failed",
        message: "Invalid or expired API token",
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    // Find or create category
    let category = await convex.query(api.userCategories.findByName, {
      userId: user._id,
      name: body.category,
    });

    if (!category) {
      // Auto-create category with default emoji (❓ - question mark emoji)
      // This default emoji is used when a category name is provided via API that doesn't match
      // any existing category. Users can later edit the category to change the emoji.
      const categoryId = await convex.mutation(api.userCategories.create, {
        userId: user._id,
        emoji: "❓",
        name: body.category,
        currentLang: "en",
      });
      category = await convex.query(api.userCategories.getById, {
        categoryId,
      });
    }

    if (!category) {
      const errorResponse: ErrorResponse = {
        error: "Internal server error",
        message: "Failed to create or find category",
      };
      return NextResponse.json(errorResponse, { status: 500 });
    }

    // Create transaction
    const transactionId = await convex.mutation(api.transactions.createFromApi, {
      userId: user._id,
      amount: body.amount,
      categoryId: category._id,
      name: body.name,
    });

    const successResponse: CreateTransactionResponse = {
      success: true,
      transactionId,
    };

    return NextResponse.json(successResponse, {
      status: 201,
      headers: {
        "X-RateLimit-Limit": String(RATE_LIMIT_MAX),
        "X-RateLimit-Remaining": String(rateLimit.remaining),
        "X-RateLimit-Reset": String(rateLimit.resetTime),
      },
    });
  } catch (error) {
    // Handle unexpected errors
    const errorResponse: ErrorResponse = {
      error: "Internal server error",
      message: "An unexpected error occurred. Please try again later.",
    };

    // Log error for debugging (in production, use proper logging service)
    // eslint-disable-next-line no-console
    console.error("API transaction creation error:", error);

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
