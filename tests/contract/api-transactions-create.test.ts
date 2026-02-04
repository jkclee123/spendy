import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "@/app/api/transactions/create/route";
import { NextRequest } from "next/server";
import { ConvexHttpClient } from "convex/browser";

// Mock ConvexHttpClient
vi.mock("convex/browser", () => ({
  ConvexHttpClient: vi.fn().mockImplementation(() => ({
    query: vi.fn(),
    mutation: vi.fn(),
  })),
}));

// Mock the Convex API
vi.mock("@/convex/_generated/api", () => ({
  api: {
    users: {
      getByApiToken: "users.getByApiToken",
    },
    userCategories: {
      findByName: "userCategories.findByName",
      create: "userCategories.create",
      getById: "userCategories.getById",
    },
    transactions: {
      createFromApi: "transactions.createFromApi",
    },
  },
}));

describe("POST /api/transactions/create", () => {
  let mockConvexClient: {
    query: ReturnType<typeof vi.fn>;
    mutation: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    const ConvexClient = ConvexHttpClient as unknown as ReturnType<typeof vi.fn>;
    mockConvexClient = {
      query: vi.fn(),
      mutation: vi.fn(),
    };
    ConvexClient.mockReturnValue(mockConvexClient);
  });

  const createRequest = (body: Record<string, unknown>) => {
    return new NextRequest("http://localhost:3000/api/transactions/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  };

  describe("Valid request", () => {
    it("should return 201 when request is valid", async () => {
      const validToken = "test-api-token-123";
      const mockUser = {
        _id: "user123",
        name: "Test User",
        email: "test@example.com",
      };
      const mockCategory = {
        _id: "category123",
        userId: "user123",
        emoji: "🍔",
        en_name: "Food",
      };
      const mockTransactionId = "transaction123";

      mockConvexClient.query
        .mockResolvedValueOnce(mockUser) // getByApiToken
        .mockResolvedValueOnce(mockCategory); // findByName

      mockConvexClient.mutation.mockResolvedValueOnce(mockTransactionId); // createFromApi

      const request = createRequest({
        apiToken: validToken,
        amount: 45.50,
        category: "Food",
        name: "Lunch",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.transactionId).toBe(mockTransactionId);
      expect(mockConvexClient.query).toHaveBeenCalledTimes(2);
      expect(mockConvexClient.mutation).toHaveBeenCalledTimes(1);
    });
  });

  describe("Authentication errors", () => {
    it("should return 401 when apiToken is missing", async () => {
      const request = createRequest({
        amount: 45.50,
        category: "Food",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Authentication failed");
      expect(data.message).toBe("apiToken is required");
    });

    it("should return 401 when apiToken is invalid", async () => {
      mockConvexClient.query.mockResolvedValueOnce(null); // getByApiToken returns null

      const request = createRequest({
        apiToken: "invalid-token",
        amount: 45.50,
        category: "Food",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Authentication failed");
      expect(data.message).toBe("Invalid or expired API token");
    });
  });

  describe("Validation errors", () => {
    it("should return 400 when amount is missing", async () => {
      const request = createRequest({
        apiToken: "test-token",
        category: "Food",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
      expect(data.message).toContain("amount is required");
    });

    it("should return 400 when amount is negative", async () => {
      const request = createRequest({
        apiToken: "test-token",
        amount: -10,
        category: "Food",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
      expect(data.message).toContain("amount must be a positive number");
    });

    it("should return 400 when category is missing", async () => {
      const request = createRequest({
        apiToken: "test-token",
        amount: 45.50,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
      expect(data.message).toContain("category is required");
    });

    it("should return 400 when category is empty string", async () => {
      const request = createRequest({
        apiToken: "test-token",
        amount: 45.50,
        category: "",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
      expect(data.message).toContain("category is required");
    });
  });

  describe("Rate limiting", () => {
    it("should return 429 when rate limit is exceeded", async () => {
      const validToken = "rate-limit-token";
      const mockUser = {
        _id: "user123",
        name: "Test User",
        email: "test@example.com",
      };

      mockConvexClient.query.mockResolvedValue(mockUser);

      // Make 61 requests (60 is the limit)
      let lastResponse;
      for (let i = 0; i < 61; i++) {
        const request = createRequest({
          apiToken: validToken,
          amount: 45.50,
          category: "Food",
        });
        lastResponse = await POST(request);
      }

      expect(lastResponse!.status).toBe(429);
      const data = await lastResponse!.json();
      expect(data.error).toBe("Rate limit exceeded");
      expect(lastResponse!.headers.get("X-RateLimit-Limit")).toBe("60");
      expect(lastResponse!.headers.get("X-RateLimit-Remaining")).toBe("0");
    });
  });

  describe("Category auto-creation", () => {
    it("should auto-create category when category doesn't exist", async () => {
      const validToken = "test-token";
      const mockUser = {
        _id: "user123",
        name: "Test User",
        email: "test@example.com",
      };
      const newCategoryId = "new-category-123";
      const mockNewCategory = {
        _id: newCategoryId,
        userId: "user123",
        emoji: "❓",
        en_name: "New Category",
      };
      const mockTransactionId = "transaction123";

      mockConvexClient.query
        .mockResolvedValueOnce(mockUser) // getByApiToken
        .mockResolvedValueOnce(null) // findByName returns null (category doesn't exist)
        .mockResolvedValueOnce(mockNewCategory); // getById after creation

      mockConvexClient.mutation
        .mockResolvedValueOnce(newCategoryId) // create category
        .mockResolvedValueOnce(mockTransactionId); // create transaction

      const request = createRequest({
        apiToken: validToken,
        amount: 45.50,
        category: "New Category",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(mockConvexClient.mutation).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userId: mockUser._id,
          emoji: "❓",
          name: "New Category",
          currentLang: "en",
        })
      );
    });
  });

  describe("Error handling", () => {
    it("should return 500 when database error occurs", async () => {
      mockConvexClient.query.mockRejectedValueOnce(new Error("Database error"));

      const request = createRequest({
        apiToken: "test-token",
        amount: 45.50,
        category: "Food",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");
      expect(data.message).toContain("unexpected error");
    });
  });
});
