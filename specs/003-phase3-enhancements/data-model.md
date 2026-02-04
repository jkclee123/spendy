# Data Model: Phase 3 Enhancements

**Feature**: Phase 3 Enhancements  
**Date**: 2026-02-04  
**Status**: Complete

## Overview

This document defines the data model changes and entity relationships for Phase 3 Enhancements. The feature modifies existing entities (User, UserCategory) and introduces new API-related data flows.

## Entity Changes

### User (Modified)

**Purpose**: Represents an authenticated user account with API access capabilities.

**Schema Changes**:
```typescript
{
  _id: Id<"users">,
  name: string,
  email: string,
  image?: string,
  lang?: string,              // Language preference: "system" | "en" | "zh-HK"
  apiToken: string,           // NEW: API authentication token (32-byte base64url)
  createdAt: number,          // Unix timestamp
}
```

**Indexes**:
- `by_email`: Existing, used for OAuth login lookup
- `by_apiToken`: **NEW**, required for fast API token validation (unique index)

**Field Details**:
- `apiToken`: 
  - Type: string
  - Format: Base64url-encoded 32-byte random value (e.g., "a7f9e2d1c4b3...")
  - Length: ~43 characters
  - Uniqueness: MUST be unique across all users (enforced by index)
  - Generation: Server-side using `crypto.randomBytes(32).toString('base64url')`
  - Security: Not hashed (sufficient entropy, transmitted over HTTPS)

**Validation Rules**:
- `apiToken` must be non-empty string
- `apiToken` must be unique (database constraint)
- `lang` must be one of: "system", "en", "zh-HK"

**State Transitions**:
- On user creation (OAuth first login): `apiToken` is generated and stored
- On token regeneration: `apiToken` is replaced with new random value
- On user deletion: Associated `apiToken` is removed (prevents further API access)

**Relationships**:
- Has many `transactions` (via `userId` foreign key)
- Has many `userCategories` (via `userId` foreign key)
- Has many `locationHistories` (via `userId` foreign key)

---

### UserCategory (Modified)

**Purpose**: Represents a user-defined spending category.

**Schema Changes**:
```typescript
{
  _id: Id<"userCategories">,
  userId: Id<"users">,
  isActive: boolean,
  emoji: string,
  en_name?: string,           // English name (used for API category matching)
  zh_name?: string,           // Chinese name (used for i18n display)
  order: number,              // DEPRECATED: No longer used in queries
  createdAt: number,          // Unix timestamp (now used for ordering)
}
```

**Indexes**:
- `by_userId`: Existing, used for category queries (ordered by `createdAt`)
- `by_userId_isActive`: Existing, used for active category filtering
- ~~`by_userId_order`~~: **DEPRECATED**, no longer used (queries use `createdAt` ordering)

**Field Details**:
- `order`: 
  - Status: **Deprecated** (kept in schema for rollback safety)
  - New behavior: Ignored in all queries
  - Future: Can be removed in later schema migration
- `createdAt`:
  - Purpose: **Primary ordering field** (replaces `order`)
  - Sorting: Categories ordered by `createdAt ASC` (oldest first)
  - Immutable: Never changes after category creation
- `en_name`:
  - Purpose: Category name in English, **used for API category matching**
  - Matching: Case-sensitive exact match
  - Auto-creation: Set to API request `category` string if category doesn't exist
- `emoji`:
  - Default for API-created categories: "🏷️" (label emoji)
  - User-editable: Can be changed via settings UI

**Validation Rules**:
- `userId` must reference a valid user
- `emoji` must be non-empty string (valid emoji character)
- At least one of `en_name` or `zh_name` must be present
- `isActive` must be boolean
- `createdAt` must be positive Unix timestamp

**State Transitions**:
- On creation: `order` can be set to any value (ignored), `createdAt` is current time
- On API category auto-creation: `en_name` = API category string, `emoji` = "🏷️", `isActive` = true
- On deactivation: `isActive` = false (swipe-left on active category)
- On activation: `isActive` = true (swipe-left on inactive category)

**Relationships**:
- Belongs to one `user` (via `userId`)
- Has many `transactions` (via `category` foreign key)
- Has many `locationHistories` (via `category` foreign key)

---

### Transaction (Existing, No Schema Changes)

**Purpose**: Represents a spending record.

**Schema** (unchanged):
```typescript
{
  _id: Id<"transactions">,
  userId: Id<"users">,
  name?: string,
  category?: Id<"userCategories">,
  amount: number,
  createdAt: number,
}
```

**Creation Sources**:
1. **Web UI**: Manual entry via `createFromWeb` mutation (existing)
2. **External API**: Via `/api/transactions/create` endpoint (**NEW**)

**API Creation Flow**:
1. API endpoint validates `apiToken` → finds `userId`
2. API endpoint queries for matching `userCategory` by `en_name`
3. If no match: API endpoint creates new `userCategory` with default emoji
4. API endpoint creates `transaction` with `userId` and `category` (reference to found/created category)

**Validation Rules**:
- `amount` must be positive number (> 0)
- `userId` must reference a valid user
- `category` (if present) must reference a valid userCategory belonging to the same user

---

### LocationHistory (Existing, No Schema Changes)

**Purpose**: Represents a location-based spending record.

**Schema** (unchanged):
```typescript
{
  _id: Id<"locationHistories">,
  userId: Id<"users">,
  latitude: number,
  longitude: number,
  amount: number,
  category?: Id<"userCategories">,
  name?: string,
  count: number,
  createdAt: number,
}
```

**Changes**: No schema changes, only UI behavior changes (swipe gestures).

---

## API Data Flow

### External Transaction Creation Flow

```
[External Client]
    |
    | POST /api/transactions/create
    | Body: { apiToken, amount, category, name? }
    |
    v
[Next.js API Route Handler]
    |
    | 1. Validate request body (amount > 0, category non-empty, apiToken present)
    | 2. Check rate limit (60 req/min per token)
    | 3. Query user by apiToken
    |
    v
[Convex: users.getByApiToken(apiToken)]
    |
    | Returns: User | null
    |
    v
[API Route: Authenticate]
    |
    | If user null → Return 401 Unauthorized
    | Else → Continue
    |
    v
[Convex: userCategories.findByName(userId, categoryName)]
    |
    | Query: Filter by userId + en_name (case-sensitive)
    | Returns: UserCategory | null
    |
    v
[API Route: Category Resolution]
    |
    | If category exists → Use existing category._id
    | If category null → Create new category
    |
    v
[Convex: userCategories.create(userId, en_name, emoji="🏷️")]
    |
    | Returns: categoryId
    |
    v
[Convex: transactions.createFromApi(userId, amount, categoryId, name?)]
    |
    | Validates: amount > 0, userId exists
    | Creates transaction with current timestamp
    | Returns: transactionId
    |
    v
[API Route: Success Response]
    |
    | Return 201 Created
    | Body: { success: true, transactionId }
    |
    v
[External Client]
```

**Error Paths**:
- Missing/invalid `apiToken` → 401 Unauthorized
- Rate limit exceeded → 429 Too Many Requests
- Invalid `amount` (≤ 0) → 400 Bad Request
- Missing required fields → 400 Bad Request
- Database error → 500 Internal Server Error

---

## Stats Page Data Flow

### Pie Chart Month Navigation

```
[Stats Page Component]
    |
    | State: selectedMonth (year + month)
    |
    v
[Calculate Date Range]
    |
    | startDate = Date(year, month, 1).getTime()
    | endDate = Date(year, month + 1, 0, 23, 59, 59).getTime()
    |
    v
[Convex: transactions.aggregateByCategoryForMonth(userId, startDate, endDate)]
    |
    | Query: Filter transactions by userId + createdAt range
    | Aggregate: Group by category, sum amounts
    | Enrich: Join with userCategories to get emoji + names
    |
    v
[Return Category Aggregates]
    |
    | [{ category: "Food", emoji: "🍔", en_name: "Food", zh_name: "食物", total: 150, count: 5 }]
    |
    v
[Pie Chart Rendering]
    |
    | Display category labels using locale (en_name or zh_name based on user lang)
    | Display total spending for selected month
    |
    v
[User Interaction]
    |
    | Left arrow → selectedMonth -= 1 month → Re-query
    | Right arrow → selectedMonth += 1 month → Re-query
    | Click MM/yyyy → Show month dropdown → Select month → Re-query
```

### Histogram Category Filtering

```
[Stats Page Component]
    |
    | State: selectedCategoryId (null = "All", or specific category ID)
    |
    v
[Convex: transactions.aggregateByMonth(userId, monthsBack=6, categoryId?)]
    |
    | Query: Filter by userId + last 6 months
    | If categoryId specified → Also filter by category
    | Aggregate: Group by month (YYYY-MM), sum amounts
    |
    v
[Return Monthly Aggregates]
    |
    | [{ month: "2026-01", total: 450, count: 12 }, { month: "2026-02", total: 380, count: 9 }]
    |
    v
[Histogram Rendering]
    |
    | Display bars for each month
    | Show category name in title if filtered
    |
    v
[User Interaction]
    |
    | Select category from dropdown → Update selectedCategoryId → Re-query
```

---

## Query Patterns

### Key Convex Queries/Mutations

**Users**:
- `users.getByApiToken(apiToken: string)`: Find user by API token (NEW)
- `users.regenerateApiToken(userId: Id<"users">)`: Generate new token (NEW)
- `users.getByEmail(email: string)`: Existing, used for OAuth login

**UserCategories**:
- `userCategories.findByName(userId, name)`: Find category by exact en_name match (NEW)
- `userCategories.create(userId, en_name, emoji, zh_name?)`: Create new category (EXISTING, used by API)
- `userCategories.listActive(userId)`: Get active categories ordered by createdAt ASC (MODIFIED)
- `userCategories.listAll(userId)`: Get all categories ordered by createdAt ASC (MODIFIED)

**Transactions**:
- `transactions.createFromApi(userId, amount, categoryId, name?)`: Create transaction via API (NEW)
- `transactions.aggregateByCategoryForMonth(userId, startDate, endDate)`: Aggregate by category for specific month (NEW)
- `transactions.aggregateByMonth(userId, monthsBack, categoryId?)`: Aggregate by month with optional category filter (MODIFIED)

---

## Indexing Strategy

**Critical Indexes**:
1. `users.by_apiToken` (**NEW**): Enables fast API token validation (O(1) lookup)
2. `userCategories.by_userId`: Used for category queries ordered by createdAt
3. `transactions.by_userId_createdAt`: Used for date-range filtering and aggregation

**Index Performance**:
- API token lookup: Single index scan, < 10ms
- Category listing: Index scan + sort by createdAt, < 20ms
- Transaction aggregation: Index scan + in-memory grouping, < 100ms for 6 months of data

---

## Data Migration Notes

**Schema Changes**:
1. **Add `apiToken` to users**: Convex will auto-generate on first user update. Initial value can be empty string, populated on first settings page visit or token regeneration.
2. **Add `by_apiToken` index**: Convex automatically creates index on next schema push.
3. **Deprecate `order` field**: No migration required, queries simply stop using `by_userId_order` index.

**Backward Compatibility**:
- Existing transactions, categories, and location histories remain unchanged
- Existing category `order` values are preserved but ignored
- No data loss during migration

**Rollback Safety**:
- If `order` field needs to be restored, data is still available
- API token can be removed by dropping the field (users would need to regenerate)

---

## Security Considerations

**API Token Storage**:
- **No hashing required**: 32-byte tokens have 256 bits of entropy, making brute force infeasible
- **HTTPS only**: Tokens must be transmitted over HTTPS to prevent interception
- **Token regeneration**: Users can regenerate tokens if compromised
- **Rate limiting**: 60 requests/minute per token prevents abuse

**Category Auto-Creation**:
- **User isolation**: Auto-created categories belong to the authenticated user only
- **No injection risk**: Category names are stored as-is (no code execution)
- **Emoji validation**: Default emoji is hardcoded, user can only change via UI

**Query Security**:
- **User-scoped queries**: All queries filter by `userId` to prevent cross-user data access
- **No raw SQL**: Convex uses type-safe query builder, prevents injection attacks

---

## Summary

**Key Changes**:
1. Users gain `apiToken` field for external API authentication
2. UserCategories use `createdAt` for ordering (deprecate `order` field)
3. New API flow: token validation → category matching/creation → transaction creation
4. Enhanced queries for month-specific aggregation and category filtering

**No Breaking Changes**: All existing functionality remains intact. New features are additive.
