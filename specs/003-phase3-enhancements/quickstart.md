# Quickstart Guide: Phase 3 Enhancements

**Feature**: Phase 3 Enhancements  
**Date**: 2026-02-04  
**For**: Developers implementing this feature

## Overview

This guide provides step-by-step instructions for implementing Phase 3 Enhancements. Follow the sections in order to ensure proper integration and testing.

## Key Design Decision: Token Generation Consolidation

**Important clarification (2026-02-04)**: The three token-related functions have been consolidated into a **single `generateApiToken()` utility function** for DRY principles and consistency.

- **Single source of truth**: One function generates all API tokens (both for initial creation and regeneration)
- **Shared utility**: Both the `create()` user mutation and `regenerateApiToken()` mutation call `generateApiToken()`
- **No duplicate `generateInitialApiToken()` mutation**: Initial token is generated during user creation; regeneration uses the same utility

This eliminates code duplication and ensures all tokens follow identical security standards.

## Prerequisites

- [ ] Development environment set up (Node.js 18+, Bun/npm)
- [ ] Convex CLI installed (`npm install -g convex`)
- [ ] Local dev server running (`bun run dev`)
- [ ] Access to Convex dashboard for schema changes
- [ ] Familiarity with Next.js App Router, Convex, and React hooks

## Phase 1: Schema & Database (Priority: Do First)

### 1.1 Update Convex Schema

**File**: `convex/schema.ts`

**Changes**:
```typescript
export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    image: v.optional(v.string()),
    lang: v.optional(v.string()),
    apiToken: v.string(), // ADD THIS LINE
    createdAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_apiToken", ["apiToken"]), // ADD THIS LINE

  userCategories: defineTable({
    userId: v.id("users"),
    isActive: v.boolean(),
    emoji: v.string(),
    en_name: v.optional(v.string()),
    zh_name: v.optional(v.string()),
    order: v.number(), // KEEP THIS (deprecated but not removed)
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_isActive", ["userId", "isActive"]),
    // Remove index: by_userId_order is no longer used
  
  // transactions and locationHistories unchanged
});
```

**Deploy**:
```bash
# Push schema changes to Convex
convex deploy
```

**Verify**:
- [ ] Convex dashboard shows `apiToken` field in users table
- [ ] `by_apiToken` index is created and active
- [ ] No errors in Convex logs

---

### 1.2 Add API Token Mutations to Convex

**File**: `convex/users.ts`

**Add these functions**:
```typescript
import { randomBytes } from "crypto";

/**
 * Generate a secure API token
 * 32 bytes = 256 bits of entropy
 */
function generateApiToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Get a user by their API token
 */
export const getByApiToken = query({
  args: { apiToken: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_apiToken", (q) => q.eq("apiToken", args.apiToken))
      .unique();
  },
});

/**
 * Regenerate API token for a user (also called during initial creation if user lacks token)
 * Uses the shared generateApiToken() utility function
 */
export const regenerateApiToken = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Generate new token (same utility used for initial creation)
    const newToken = generateApiToken();
    await ctx.db.patch(args.userId, { apiToken: newToken });
    return newToken;
  },
});

/**
 * Note: Initial token generation happens during user creation in the create() mutation
 * which also calls the shared generateApiToken() utility function
 */
```

**Test**:
```bash
# In Convex dashboard, test query
getByApiToken({ apiToken: "test-token" })
```

---

### 1.3 Add UserCategory Query Functions

**File**: `convex/userCategories.ts`

**Add this function**:
```typescript
/**
 * Find a category by user and English name (case-sensitive exact match)
 * Used by API endpoint to match incoming category names
 */
export const findByName = query({
  args: {
    userId: v.id("users"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    // Query all categories for the user
    const categories = await ctx.db
      .query("userCategories")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    
    // Filter for exact case-sensitive match on en_name
    return categories.find((cat) => cat.en_name === args.name) || null;
  },
});
```

**Modify existing queries to use `createdAt` ordering**:
```typescript
// BEFORE:
.withIndex("by_userId_order", (q) => q.eq("userId", args.userId))

// AFTER:
.withIndex("by_userId", (q) => q.eq("userId", args.userId))
.order("asc") // Orders by createdAt ascending
```

---

### 1.4 Add Transaction API Mutation

**File**: `convex/transactions.ts`

**Add this function**:
```typescript
/**
 * Create a transaction from external API
 * Similar to createFromWeb but includes category auto-creation logic
 */
export const createFromApi = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    categoryId: v.id("userCategories"),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate amount
    if (args.amount <= 0) {
      throw new Error("amount must be a positive number");
    }

    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Verify category exists and belongs to user
    const category = await ctx.db.get(args.categoryId);
    if (!category || category.userId !== args.userId) {
      throw new Error("Invalid category");
    }

    // Create the transaction
    const transactionId = await ctx.db.insert("transactions", {
      userId: args.userId,
      name: args.name,
      amount: args.amount,
      category: args.categoryId,
      createdAt: Date.now(),
    });

    return transactionId;
  },
});
```

---

## Phase 2: API Endpoint (Priority: High)

### 2.1 Create API Route Handler

**File**: `src/app/api/transactions/create/route.ts` (NEW FILE)

**Implementation**:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 60;

function isRateLimited(apiToken: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(apiToken);
  
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(apiToken, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  
  if (entry.count >= RATE_LIMIT_MAX) return true;
  entry.count++;
  return false;
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { apiToken, amount, category, name } = body;

    // Validate required fields
    if (!apiToken || typeof apiToken !== "string") {
      return NextResponse.json(
        { error: "Validation failed", message: "apiToken is required" },
        { status: 400 }
      );
    }

    // Check rate limit
    if (isRateLimited(apiToken)) {
      return NextResponse.json(
        { error: "Rate limit exceeded", message: "Too many requests. Limit: 60/minute." },
        { status: 429 }
      );
    }

    // Validate amount
    if (typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { error: "Validation failed", message: "amount must be a positive number" },
        { status: 400 }
      );
    }

    // Validate category
    if (!category || typeof category !== "string" || category.trim().length === 0) {
      return NextResponse.json(
        { error: "Validation failed", message: "category is required" },
        { status: 400 }
      );
    }

    // Authenticate user
    const user = await convex.query(api.users.getByApiToken, { apiToken });
    if (!user) {
      return NextResponse.json(
        { error: "Authentication failed", message: "Invalid or expired API token" },
        { status: 401 }
      );
    }

    // Find or create category
    let userCategory = await convex.query(api.userCategories.findByName, {
      userId: user._id,
      name: category,
    });

    if (!userCategory) {
      // Auto-create category
      const categoryId = await convex.mutation(api.userCategories.create, {
        userId: user._id,
        emoji: "❓",
        en_name: category,
        zh_name: category, // Use same name for Chinese by default
        isActive: true,
      });
      userCategory = { _id: categoryId };
    }

    // Create transaction
    const transactionId = await convex.mutation(api.transactions.createFromApi, {
      userId: user._id,
      amount,
      categoryId: userCategory._id,
      name: name || undefined,
    });

    return NextResponse.json(
      { success: true, transactionId, message: "Transaction created successfully" },
      { status: 201 }
    );

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
```

**Test**:
```bash
# Get API token from settings page first, then:
curl -X POST http://localhost:3000/api/transactions/create \
  -H "Content-Type: application/json" \
  -d '{
    "apiToken": "YOUR_TOKEN_HERE",
    "amount": 50.00,
    "category": "Food",
    "name": "Lunch"
  }'
```

---

## Phase 3: UI Components (Priority: High)

### 3.1 Restore API Token Display Component

**File**: `src/components/settings/ApiTokenDisplay.tsx` (NEW FILE)

Restore from commit e6a6a180f7926e4e02ec7981f1e25fd21c308da8 (see research.md for full code).

**Key features**:
- Show/hide token toggle
- Copy to clipboard
- Regenerate token with confirmation
- Usage instructions

**Integration in settings page**:
```typescript
// src/app/(authenticated)/settings/page.tsx
import { ApiTokenDisplay } from "@/components/settings/ApiTokenDisplay";

// In component:
{user && (
  <Card>
    <CardHeader>
      <CardTitle>API Access</CardTitle>
    </CardHeader>
    <CardContent>
      <ApiTokenDisplay userId={user._id} apiToken={user.apiToken || ""} />
    </CardContent>
  </Card>
)}
```

---

### 3.2 Disable Right-Swipe Gestures

**File**: `src/hooks/useSwipeGesture.ts`

**Remove right-swipe handler**:
```typescript
interface SwipeGestureConfig {
  onSwipeLeft?: () => void;
  // REMOVE: onSwipeRight?: () => void;
  threshold?: number;
  disabled?: boolean;
}

// In handleTouchEnd:
if (currentOffset.current <= -threshold && onSwipeLeft) {
  onSwipeLeft();
}
// REMOVE: right-swipe handling
```

**File**: `src/components/ui/SwipeableCard.tsx`

**Remove right-swipe props**:
```typescript
interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeftAction?: () => void;
  leftActionLabel?: string;
  leftActionColor?: string;
  // REMOVE: onSwipeRightAction, rightActionLabel, rightActionColor
}

// REMOVE: Right action background rendering
```

**Update consumers**:
- `src/components/transactions/TransactionCard.tsx`
- `src/app/(authenticated)/settings/userCategory/page.tsx`
- `src/app/(authenticated)/settings/locationHistories/page.tsx`

Remove all `onSwipeRightAction` props.

---

### 3.3 Remove Category Drag-and-Drop

**File**: `src/app/(authenticated)/settings/userCategory/page.tsx`

**Changes**:
- Remove drag handle UI
- Remove reorder mutation calls
- Remove drag event handlers
- Categories will automatically render in `createdAt` order from Convex query

---

### 3.4 Enhance Pie Chart with Month Navigation

**File**: `src/components/stats/CategoryPieChart.tsx`

**Add state**:
```typescript
const [selectedMonth, setSelectedMonth] = useState(() => {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
});
```

**Add month controls**:
```tsx
<div className="flex items-center justify-center gap-2 mb-4">
  <button onClick={goToPreviousMonth} aria-label="Previous month">
    <ChevronLeft className="h-5 w-5" />
  </button>
  
  <button onClick={toggleMonthDropdown} className="font-medium">
    {formatMonth(selectedMonth)} {/* e.g., "02/2026" */}
  </button>
  
  <button onClick={goToNextMonth} aria-label="Next month" disabled={isCurrentMonth}>
    <ChevronRight className="h-5 w-5" />
  </button>
</div>

{showMonthDropdown && (
  <MonthDropdown
    availableMonths={getAvailableMonths()}
    selectedMonth={selectedMonth}
    onSelect={handleMonthSelect}
  />
)}
```

**Update query to filter by month**:
```typescript
const startDate = new Date(selectedMonth.year, selectedMonth.month, 1).getTime();
const endDate = new Date(selectedMonth.year, selectedMonth.month + 1, 0, 23, 59, 59).getTime();

const categoryData = useQuery(api.transactions.aggregateByCategoryForMonth, {
  userId: user._id,
  startDate,
  endDate,
});
```

---

### 3.5 Add Category Filter to Histogram

**File**: `src/components/stats/MonthlyHistogram.tsx`

**Add state**:
```typescript
const [selectedCategoryId, setSelectedCategoryId] = useState<Id<"userCategories"> | null>(null);
```

**Add category dropdown**:
```tsx
<div className="mb-4">
  <select
    value={selectedCategoryId || "all"}
    onChange={(e) => setSelectedCategoryId(e.target.value === "all" ? null : e.target.value)}
    className="rounded-lg border px-3 py-2"
  >
    <option value="all">{t('categoryFilter.all')}</option>
    {categories.map((cat) => (
      <option key={cat._id} value={cat._id}>
        {cat.emoji} {getCategoryName(cat)}
      </option>
    ))}
  </select>
</div>
```

**Update query**:
```typescript
const histogramData = useQuery(api.transactions.aggregateByMonth, {
  userId: user._id,
  monthsBack: 6,
  categoryId: selectedCategoryId,
});
```

---

## Phase 4: Internationalization (Priority: Medium)

### 4.1 Add Translation Keys

**Files**: `messages/en.json` and `messages/zh-HK.json`

**Add to stats namespace**:
```json
{
  "stats": {
    "spendingByCategory": "Spending by Category",
    "recentSpending": "Recent Spending",
    "categoryFilter": {
      "all": "All Categories",
      "selectCategory": "Select Category"
    },
    "monthNavigation": {
      "previousMonth": "Previous Month",
      "nextMonth": "Next Month",
      "selectMonth": "Select Month"
    },
    "totalSpending": "Total spending",
    "noDataForMonth": "No spending in {month}"
  }
}
```

**Use in components**:
```typescript
import { useTranslations } from 'next-intl';

const t = useTranslations('stats');
return <h3>{t('spendingByCategory')}</h3>;
```

---

### 4.2 Remove Time Period Buttons

**File**: `src/app/(authenticated)/stats/page.tsx`

**Remove**:
- `timePeriod` state (week/month/year)
- Time period toggle buttons UI
- Related functions: `periodButtonClass`, `getPeriodLabel`

**Keep**:
- Month-specific filtering (now handled by pie chart component)
- Histogram 6-month default range

---

## Phase 5: Testing (Priority: Critical)

### 5.1 Contract Tests

**File**: `tests/contract/api-transactions-create.test.ts` (NEW)

**Test cases**:
- [ ] Valid request returns 201
- [ ] Missing apiToken returns 401
- [ ] Invalid apiToken returns 401
- [ ] Missing amount returns 400
- [ ] Negative amount returns 400
- [ ] Missing category returns 400
- [ ] Rate limit enforced (61st request returns 429)
- [ ] Category auto-creation works
- [ ] Transaction appears in database

---

### 5.2 Integration Tests

**File**: `tests/integration/api-token.test.ts` (NEW)

**Test flow**:
1. User generates API token
2. User copies token
3. External API call succeeds
4. Transaction appears in records list

---

### 5.3 Unit Tests

**Files**:
- `tests/unit/swipe-gestures.test.ts`: Verify right-swipe disabled
- `tests/unit/category-ordering.test.ts`: Verify createdAt ordering

---

## Phase 6: Update Agent Context

**Run**:
```bash
.specify/scripts/bash/update-agent-context.sh opencode
```

This updates `AGENTS.md` with new technologies and patterns from this feature.

---

## Deployment Checklist

Before merging to main:

- [ ] All tests pass (`bun run test && bun run lint`)
- [ ] Convex schema deployed
- [ ] API endpoint tested with curl/Postman
- [ ] UI components manually tested
- [ ] Month navigation works correctly
- [ ] Category filter works correctly
- [ ] Swipe gestures behave as expected
- [ ] i18n works for both English and Chinese
- [ ] API token can be copied and regenerated
- [ ] Rate limiting works (test with 61 requests)
- [ ] No console errors in browser
- [ ] Performance meets targets (< 1s data updates)

---

## Rollback Plan

If issues arise:

1. **API endpoint issues**: Disable route by returning 503
2. **Schema issues**: Restore `by_userId_order` index usage
3. **UI issues**: Revert individual components via git
4. **Complete rollback**: `git revert <commit-hash>`

---

## Support Resources

- **API Contract**: `contracts/api-transactions-create.yaml`
- **Data Model**: `data-model.md`
- **Research Decisions**: `research.md`
- **Feature Spec**: `spec.md`

---

## Quick Reference

**API Token Format**: 32-byte base64url (~43 characters)  
**Rate Limit**: 60 requests/minute per token  
**Default Category Emoji**: ❓  
**Histogram Time Range**: Last 6 months  
**Category Ordering**: By `createdAt` ASC  
**Swipe Gestures**: Left-only (right disabled)  
**Month Format**: MM/yyyy (e.g., "02/2026")  
**i18n Namespace**: `stats`
