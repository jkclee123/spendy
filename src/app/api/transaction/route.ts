import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import type {
  CreateTransactionRequest,
  CreateTransactionResponse,
  ErrorResponse,
} from "@/types";

// Initialize Convex HTTP client for server-side usage
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// ============================================================================
// Rate Limiting (T029)
// Basic in-memory rate limiter - use Redis in production for distributed systems
// ============================================================================

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 60; // 60 requests per minute per token

/**
 * Check if request is rate limited
 * Returns true if the request should be blocked
 */
function isRateLimited(apiToken: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(apiToken);

  if (!entry || now > entry.resetTime) {
    // No entry or window expired - create new entry
    rateLimitMap.set(apiToken, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    });
    return false;
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  // Increment count
  entry.count++;
  return false;
}

/**
 * Get remaining requests and reset time for rate limit headers
 */
function getRateLimitInfo(apiToken: string): {
  remaining: number;
  resetTime: number;
} {
  const entry = rateLimitMap.get(apiToken);
  if (!entry) {
    return { remaining: RATE_LIMIT_MAX_REQUESTS, resetTime: Date.now() + RATE_LIMIT_WINDOW_MS };
  }
  return {
    remaining: Math.max(0, RATE_LIMIT_MAX_REQUESTS - entry.count),
    resetTime: entry.resetTime,
  };
}

// ============================================================================
// Request Logging (T028)
// ============================================================================

interface LogEntry {
  timestamp: string;
  method: string;
  path: string;
  apiToken: string;
  status: number;
  duration: number;
  userAgent?: string;
  error?: string;
}

/**
 * Log request for audit purposes
 * In production, this would write to a logging service (e.g., CloudWatch, Datadog)
 */
function logRequest(entry: LogEntry): void {
  // Mask the API token for security (show first 8 chars only)
  const maskedToken = entry.apiToken
    ? `${entry.apiToken.substring(0, 8)}...`
    : "none";

  const logData = {
    ...entry,
    apiToken: maskedToken,
  };

  if (entry.status >= 400) {
    // eslint-disable-next-line no-console
    console.error("[Transaction API]", JSON.stringify(logData));
  } else {
    // eslint-disable-next-line no-console
    console.log("[Transaction API]", JSON.stringify(logData));
  }
}

// ============================================================================
// Validation Helpers
// ============================================================================

interface ValidationResult {
  valid: boolean;
  error?: ErrorResponse;
}

/**
 * Validate the incoming request body
 */
function validateRequest(body: unknown): ValidationResult {
  if (!body || typeof body !== "object") {
    return {
      valid: false,
      error: {
        error: "Validation failed",
        message: "Request body is required",
      },
    };
  }

  const data = body as Record<string, unknown>;

  // Check required field: apiToken
  if (!data.apiToken || typeof data.apiToken !== "string") {
    return {
      valid: false,
      error: {
        error: "Validation failed",
        message: "apiToken is required",
      },
    };
  }

  // Check required field: amount
  if (data.amount === undefined || data.amount === null) {
    return {
      valid: false,
      error: {
        error: "Validation failed",
        message: "amount is required",
      },
    };
  }

  if (typeof data.amount !== "number" || isNaN(data.amount)) {
    return {
      valid: false,
      error: {
        error: "Validation failed",
        message: "amount must be a number",
      },
    };
  }

  if (data.amount <= 0) {
    return {
      valid: false,
      error: {
        error: "Validation failed",
        message: "amount must be a positive number",
      },
    };
  }

  // Validate optional fields
  if (data.category !== undefined && typeof data.category !== "string") {
    return {
      valid: false,
      error: {
        error: "Validation failed",
        message: "category must be a string",
      },
    };
  }

  return { valid: true };
}

// ============================================================================
// POST Handler
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  let apiToken = "";

  try {
    // Parse request body
    let body: CreateTransactionRequest;
    try {
      body = await request.json();
    } catch {
      const response: ErrorResponse = {
        error: "Validation failed",
        message: "Invalid JSON in request body",
      };
      logRequest({
        timestamp: new Date().toISOString(),
        method: "POST",
        path: "/api/transaction",
        apiToken: "",
        status: 400,
        duration: Date.now() - startTime,
        userAgent: request.headers.get("user-agent") ?? undefined,
        error: response.message,
      });
      return NextResponse.json(response, { status: 400 });
    }

    apiToken = body.apiToken || "";

    // Validate request body
    const validation = validateRequest(body);
    if (!validation.valid) {
      logRequest({
        timestamp: new Date().toISOString(),
        method: "POST",
        path: "/api/transaction",
        apiToken,
        status: 400,
        duration: Date.now() - startTime,
        userAgent: request.headers.get("user-agent") ?? undefined,
        error: validation.error?.message,
      });
      return NextResponse.json(validation.error, { status: 400 });
    }

    // Check rate limit
    if (isRateLimited(apiToken)) {
      const rateLimitInfo = getRateLimitInfo(apiToken);
      const response: ErrorResponse = {
        error: "Rate limit exceeded",
        message: "Too many requests. Please try again later.",
        details: {
          retryAfter: Math.ceil(
            (rateLimitInfo.resetTime - Date.now()) / 1000
          ),
        },
      };
      logRequest({
        timestamp: new Date().toISOString(),
        method: "POST",
        path: "/api/transaction",
        apiToken,
        status: 429,
        duration: Date.now() - startTime,
        userAgent: request.headers.get("user-agent") ?? undefined,
        error: response.message,
      });
      return NextResponse.json(response, {
        status: 429,
        headers: {
          "Retry-After": String(
            Math.ceil((rateLimitInfo.resetTime - Date.now()) / 1000)
          ),
          "X-RateLimit-Limit": String(RATE_LIMIT_MAX_REQUESTS),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(rateLimitInfo.resetTime / 1000)),
        },
      });
    }

    // Call Convex mutation to create transaction
    const transactionId = await convex.mutation(api.transactions.createFromApi, {
      apiToken: body.apiToken,
      amount: body.amount,
      category: body.category,
    });

    // Success response
    const response: CreateTransactionResponse = {
      success: true,
      transactionId: transactionId,
      message: "Transaction recorded successfully",
    };

    // Get rate limit info for headers
    const rateLimitInfo = getRateLimitInfo(apiToken);

    logRequest({
      timestamp: new Date().toISOString(),
      method: "POST",
      path: "/api/transaction",
      apiToken,
      status: 201,
      duration: Date.now() - startTime,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    return NextResponse.json(response, {
      status: 201,
      headers: {
        "X-RateLimit-Limit": String(RATE_LIMIT_MAX_REQUESTS),
        "X-RateLimit-Remaining": String(rateLimitInfo.remaining),
        "X-RateLimit-Reset": String(Math.ceil(rateLimitInfo.resetTime / 1000)),
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // Check if it's an authentication error
    if (errorMessage.includes("Invalid") && errorMessage.includes("API token")) {
      const response: ErrorResponse = {
        error: "Unauthorized",
        message: "Invalid or missing API token",
      };
      logRequest({
        timestamp: new Date().toISOString(),
        method: "POST",
        path: "/api/transaction",
        apiToken,
        status: 401,
        duration: Date.now() - startTime,
        userAgent: request.headers.get("user-agent") ?? undefined,
        error: response.message,
      });
      return NextResponse.json(response, { status: 401 });
    }

    // Server error
    const response: ErrorResponse = {
      error: "Server error",
      message: "An unexpected error occurred",
    };
    logRequest({
      timestamp: new Date().toISOString(),
      method: "POST",
      path: "/api/transaction",
      apiToken,
      status: 500,
      duration: Date.now() - startTime,
      userAgent: request.headers.get("user-agent") ?? undefined,
      error: errorMessage,
    });
    return NextResponse.json(response, { status: 500 });
  }
}
