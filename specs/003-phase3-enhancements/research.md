# Research: Phase 3 Enhancements

**Feature**: Phase 3 Enhancements  
**Date**: 2026-02-04  
**Status**: Complete

## Overview

This document consolidates research findings for the Phase 3 Enhancements feature. All technical unknowns from the Technical Context have been researched and decisions have been made.

## Research Tasks

### R1: API Token Generation Strategy

**Question**: What approach should be used to generate secure, unique API tokens for users?

**Decision**: Use Node.js `crypto.randomBytes()` to generate 32-byte (256-bit) random tokens, encoded as base64url strings.

**Rationale**:
- **Cryptographically secure**: `crypto.randomBytes()` uses the system's CSPRNG (cryptographically secure pseudorandom number generator)
- **Sufficient entropy**: 32 bytes = 256 bits of entropy, making brute force attacks computationally infeasible
- **URL-safe encoding**: Base64url encoding (RFC 4648) produces tokens safe for use in URLs and JSON without escaping
- **Standard practice**: This approach is widely used in OAuth2 bearer tokens and API key generation
- **Built-in availability**: Node.js crypto module is built-in, no external dependencies required

**Alternatives Considered**:
1. **UUID v4**: Only 122 bits of entropy (weaker than 256 bits), less flexible format
2. **JWT tokens**: Overkill for simple API authentication, adds complexity and payload size
3. **Hash-based tokens**: Requires storing plaintext values to verify, security risk

**Implementation Pattern**:

This single utility function is used in TWO contexts:
1. **Initial token generation** - Called during user creation (OAuth login)
2. **Token regeneration** - Called when user explicitly requests a new token from settings

```typescript
import { randomBytes } from "crypto";

/**
 * Generate a cryptographically secure API token
 * Used by both initial creation (user.create mutation) and regeneration (user.regenerateApiToken mutation)
 */
function generateApiToken(): string {
  return randomBytes(32)
    .toString("base64url")
    .replace(/[^a-zA-Z0-9]/g, ""); // Remove any non-alphanumeric chars for safety
}

// Usage in create mutation:
export const create = mutation({
  handler: async (ctx, args) => {
    const apiToken = generateApiToken(); // ← single utility
    return await ctx.db.insert("users", { ...args, apiToken });
  },
});

// Usage in regenerate mutation:
export const regenerateApiToken = mutation({
  handler: async (ctx, args) => {
    const newToken = generateApiToken(); // ← same utility
    await ctx.db.patch(args.userId, { apiToken: newToken });
  },
});
```

**Benefits of consolidation**:
- **DRY principle**: Token generation logic exists in one place
- **Consistency**: All tokens guaranteed to use same format and security standards
- **Maintainability**: Changes to token format only require updating one function

**Storage**: Tokens will be stored directly in Convex users table, indexed for fast lookup. No hashing required since tokens have sufficient entropy and are transmitted securely over HTTPS.

---

### R2: API Endpoint Implementation Approach

**Question**: Should the external API endpoint be implemented as a Next.js API route or a Convex HTTP action?

**Decision**: Implement as a Next.js API Route (`src/app/api/transactions/create/route.ts`)

**Rationale**:
- **Flexibility**: Next.js API routes provide full control over HTTP request/response handling
- **Middleware support**: Easier to implement rate limiting, request logging, and custom error handling
- **Convex client integration**: Can use ConvexHttpClient to call Convex mutations from the API route
- **Consistent with codebase**: Existing auth API routes follow this pattern
- **Better error handling**: Can return standard REST error responses (401, 400, 500) with custom messages

**Alternatives Considered**:
1. **Convex HTTP actions**: Limited HTTP customization, harder to implement rate limiting and detailed logging
2. **Serverless functions (Vercel)**: Same outcome as Next.js API routes when deployed to Vercel, but API routes provide better local dev experience

**Implementation Pattern**:
- Next.js API route handler validates request
- Uses ConvexHttpClient to call Convex mutations
- Returns JSON responses with appropriate status codes
- Implements basic in-memory rate limiting (60 requests/minute per token)

---

### R3: Category Name Matching for API Requests

**Question**: How should the API match incoming category names to existing userCategories? Case-sensitive, case-insensitive, fuzzy matching?

**Decision**: Use **case-sensitive, exact match** for category names in English (en_name field).

**Rationale**:
- **Predictability**: Exact matching is deterministic and easy to understand for API consumers
- **No ambiguity**: Avoids confusion when categories differ only by case (e.g., "Food" vs "food")
- **Simple implementation**: Direct string comparison, no fuzzy matching libraries needed
- **API documentation clarity**: Easy to document: "Category name must match exactly (case-sensitive)"
- **User education**: If category not found, it's auto-created with default emoji, so slight mismatches are handled gracefully

**Alternatives Considered**:
1. **Case-insensitive matching**: Could cause confusion with intentionally different categories (e.g., "IT" vs "it")
2. **Fuzzy matching (Levenshtein distance)**: Overkill for category names, adds complexity and unpredictability
3. **Locale-aware matching**: Difficult with bilingual categories (en_name vs zh_name)

**Implementation Pattern**:
```typescript
// Query for existing category
const existingCategory = await ctx.db
  .query("userCategories")
  .withIndex("by_userId", (q) => q.eq("userId", user._id))
  .filter((q) => q.eq(q.field("en_name"), categoryName)) // Exact match on en_name
  .filter((q) => q.eq(q.field("isActive"), true))
  .first();
```

**Auto-creation behavior**: If no match found, create new category with:
- `en_name`: Exact string from API request
- `zh_name`: Empty or same as en_name (user can edit later)
- `emoji`: Default ❓ (label emoji)
- `isActive`: true
- `createdAt`: Current timestamp

---

### R4: Default Emoji for Auto-Created Categories

**Question**: What emoji should be used as the default for categories created via API?

**Decision**: Use ❓ (label emoji, U+1F3F7) as the default emoji.

**Rationale**:
- **Semantic meaning**: The label emoji represents tagging/categorization, fitting for generic categories
- **Neutral appearance**: Not specific to any spending type (food, transport, etc.), works as a generic placeholder
- **Unicode support**: Widely supported across platforms (iOS, Android, web)
- **Visually distinct**: Easy to identify auto-created categories that need user customization

**Alternatives Considered**:
1. **❓ (question mark)**: Too ambiguous, could imply missing data
2. **📦 (package)**: Less intuitive for spending categories
3. **⭐ (star)**: Too positive, might imply favorite/priority
4. **No emoji (empty string)**: Would require UI fallback logic, less user-friendly

**User Experience**: Users can edit the emoji and name from the settings page after categories are auto-created.

---

### R5: Month Navigation Data Handling

**Question**: How should the pie chart handle months with no transaction data? Show zero data, skip empty months, or disable navigation?

**Decision**: **Allow navigation to any month**, show empty state with $0 spending if no transactions exist.

**Rationale**:
- **Consistency**: Users expect to navigate freely through calendar months, not just months with data
- **Predictable behavior**: Navigation increments/decrements by one month regardless of data availability
- **Clear feedback**: Empty state clearly indicates "No spending this month" rather than silently skipping months
- **User understanding**: Helps users confirm they didn't miss recording transactions for a given month

**Alternatives Considered**:
1. **Skip empty months**: Confusing navigation (pressing "next" might jump 2-3 months)
2. **Disable arrows for empty months**: Frustrating UX, unclear why navigation is blocked
3. **Only show months with data in dropdown**: Limits historical analysis, user can't verify empty months

**Implementation Pattern**:
- Month selector state: stores year and month (independent of data)
- Pie chart query: filters transactions by selected month's date range
- Empty state: Displays "No spending in MM/yyyy" with $0 total
- Dropdown: Lists all months from earliest transaction to current month (or current month - 12 if no transactions)

---

### R6: Histogram Default Time Range

**Question**: What time range should the histogram display by default when time period buttons are removed?

**Decision**: Display **last 6 months** of data (rolling window from current month backward).

**Rationale**:
- **Sufficient context**: 6 months provides meaningful trend analysis without overwhelming the chart
- **Mobile-friendly**: 6 bars fit comfortably on mobile screens without horizontal scrolling
- **Matches user expectations**: Common pattern in financial apps (bank statements, credit card apps)
- **Performance**: Reasonable query size, won't impact page load times

**Alternatives Considered**:
1. **Last 3 months**: Too short for meaningful trend analysis
2. **Last 12 months**: Too many bars for mobile screens, harder to read
3. **Dynamic based on screen size**: Adds complexity, inconsistent across devices
4. **All available data**: Could be overwhelming for long-time users, performance concerns

**Implementation Pattern**:
```typescript
// Calculate 6 months ago from now
const now = new Date();
const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

// Query uses existing aggregateByMonth with monthsBack: 6
const histogramData = useQuery(api.transactions.aggregateByMonth, {
  userId: user._id,
  monthsBack: 6,
});
```

---

### R7: Swipe Gesture Component Modification Strategy

**Question**: How should swipe gesture components be modified to disable right-swipe? Modify the hook, the component, or both?

**Decision**: **Modify both the hook and components** for complete coverage:
1. Update `useSwipeGesture` hook to not call `onSwipeRight` handler
2. Update `SwipeableCard` component to not render right-action background
3. Update all consuming components to remove `onSwipeRightAction` props

**Rationale**:
- **Defense in depth**: Multiple layers ensure right-swipe is completely disabled
- **Clear intent**: Code explicitly shows right-swipe is not supported (not just missing handlers)
- **Prevents accidents**: Developers can't accidentally re-enable right-swipe by passing handlers
- **Simplifies API**: Removing unused props makes component API cleaner

**Alternatives Considered**:
1. **Hook only**: Components would still render unused UI elements
2. **Component only**: Hook would still detect and process right-swipe, wasting cycles
3. **New separate components**: Code duplication, harder to maintain

**Implementation Pattern**:
```typescript
// useSwipeGesture hook: Remove onSwipeRight callback entirely
export function useSwipeGesture(config: {
  onSwipeLeft?: () => void;
  threshold?: number;
  disabled?: boolean;
}): SwipeGestureReturn {
  // Only handle left swipe
  if (currentOffset.current <= -threshold && onSwipeLeft) {
    onSwipeLeft();
  }
  // Remove: right-swipe handling
}

// SwipeableCard component: Remove right-action props and rendering
interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeftAction?: () => void;
  leftActionLabel?: string;
  leftActionColor?: string;
  // Remove: onSwipeRightAction, rightActionLabel, rightActionColor
}
```

---

### R8: Category Ordering Migration Strategy

**Question**: How should existing data be migrated when removing the `order` field from userCategories?

**Decision**: **Soft deprecation** - Keep the field in schema but ignore it in all queries. Use `createdAt` for ordering everywhere.

**Rationale**:
- **Zero-risk migration**: No data loss, no schema migration required
- **Rollback safety**: If ordering needs to be restored, data is still available
- **Simple implementation**: Just change query `.withIndex("by_userId_order")` to `.withIndex("by_userId")` and add `.order("asc")` by createdAt
- **No user impact**: Existing categories will appear in creation order naturally

**Alternatives Considered**:
1. **Drop field from schema**: Requires Convex migration, risky, irreversible
2. **Keep using order field**: Doesn't achieve simplification goal
3. **Add createdAt-based index**: Already exists (`by_userId` index can be used with order)

**Implementation Pattern**:
```typescript
// Before (order-based):
const categories = await ctx.db
  .query("userCategories")
  .withIndex("by_userId_order", (q) => q.eq("userId", userId))
  .collect();

// After (createdAt-based):
const categories = await ctx.db
  .query("userCategories")
  .withIndex("by_userId", (q) => q.eq("userId", userId))
  .order("asc") // Orders by createdAt ascending
  .collect();
```

**Note**: The `order` field can be removed from schema in a future cleanup phase after verifying no issues.

---

### R9: Stats Page Internationalization Implementation

**Question**: How should stats page text be internationalized using next-intl? What translation keys are needed?

**Decision**: Extend existing `messages/en.json` and `messages/zh-HK.json` files with stats-specific keys under the `"stats"` namespace.

**Rationale**:
- **Consistent with existing structure**: App already uses next-intl with message files
- **Namespace organization**: `"stats"` namespace already exists with some keys (week, month, year)
- **Component-level translation**: Use `useTranslations('stats')` hook in components
- **Format support**: next-intl supports ICU MessageFormat for plurals and variables

**Required Translation Keys**:
```json
{
  "stats": {
    "title": "Stats",
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
    "noDataForMonth": "No spending in {month}",
    "transactions": "{count, plural, =0 {No transactions} =1 {1 transaction} other {# transactions}}"
  }
}
```

**Implementation Pattern**:
```typescript
import { useTranslations } from 'next-intl';

export function CategoryPieChart() {
  const t = useTranslations('stats');
  
  return (
    <div>
      <h3>{t('spendingByCategory')}</h3>
      <p>{t('totalSpending')}</p>
    </div>
  );
}
```

---

### R10: Rate Limiting Strategy for API Endpoint

**Question**: What rate limiting approach should be used for the external API endpoint?

**Decision**: Implement **basic in-memory rate limiting** with 60 requests per minute per API token.

**Rationale**:
- **Sufficient for MVP**: Small-to-medium user base doesn't require distributed rate limiting
- **Simple implementation**: In-memory Map stores token → count + reset time
- **No external dependencies**: Avoids Redis or other external services for simplicity
- **Per-token limits**: Prevents individual user/token from overwhelming the API
- **Standard headers**: Returns `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` headers

**Alternatives Considered**:
1. **Redis-based rate limiting**: Overkill for current scale, adds infrastructure complexity
2. **No rate limiting**: Risk of abuse/DoS attacks
3. **Global rate limit**: Doesn't prevent individual bad actors
4. **Token bucket algorithm**: More complex, unnecessary for current needs

**Implementation Pattern**:
```typescript
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 60;

function isRateLimited(apiToken: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(apiToken);
  
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(apiToken, { count: 1, resetTime: now + WINDOW_MS });
    return false;
  }
  
  if (entry.count >= MAX_REQUESTS) return true;
  
  entry.count++;
  return false;
}
```

**Future Enhancement**: Can be upgraded to Redis-based rate limiting if scale requires distributed tracking.

---

## Summary of Key Decisions

| Area | Decision | Rationale |
|------|----------|-----------|
| API Token Generation | `crypto.randomBytes(32)` + base64url | Cryptographically secure, 256-bit entropy, URL-safe |
| API Implementation | Next.js API Route | Flexibility, middleware support, consistent with codebase |
| Category Matching | Case-sensitive exact match on `en_name` | Predictable, no ambiguity, simple to implement |
| Default Emoji | ❓ (label) | Semantic, neutral, widely supported |
| Month Navigation | Allow all months, show empty state | Consistent UX, clear feedback |
| Histogram Time Range | Last 6 months (rolling) | Sufficient context, mobile-friendly, performance |
| Swipe Gesture Removal | Modify hook + component + consumers | Defense in depth, clear intent, clean API |
| Category Order Migration | Soft deprecation (keep field, use `createdAt`) | Zero-risk, rollback safety, simple |
| Stats i18n | Extend `messages/*.json` with stats namespace | Consistent structure, format support |
| Rate Limiting | In-memory, 60 req/min per token | Simple, sufficient for scale, no external deps |

## Dependencies & Constraints

**No new external dependencies required**. All features can be implemented using existing packages:
- `crypto` (Node.js built-in) for token generation
- `convex` (already installed) for database operations
- `next-intl` (already installed) for internationalization
- `recharts` (already installed) for chart components

**Performance constraints met**:
- API endpoint can respond < 500ms (single Convex query + mutation)
- Chart updates < 1s (Convex real-time subscriptions)
- No significant bundle size impact (restored component < 5KB)

## Next Steps

All research tasks are complete. Ready to proceed to **Phase 1: Design & Contracts**.
