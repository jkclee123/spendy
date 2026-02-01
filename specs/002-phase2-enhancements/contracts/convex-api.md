# Convex API Contracts: Phase 2 Enhancements

**Date**: 2026-02-01  
**Feature**: Phase 2 Enhancements

This document defines the Convex query and mutation contracts for the Phase 2 features.

---

## users Module

### users.create (Modified)

Creates a new user and their default categories.

**Args**:

```typescript
{
  name: string;
  email: string;
  image?: string;
}
```

**Returns**: `Id<"users">`

**Behavior**:

- If user with email exists, returns existing user ID
- If new user, creates user AND two default userCategories
- Default categories: Restaurant (🍗) and Transport (🚃)

---

### users.getByEmail (Unchanged)

**Args**: `{ email: string }`  
**Returns**: `User | null`

---

### users.getById (Unchanged)

**Args**: `{ userId: Id<"users"> }`  
**Returns**: `User | null`

---

### users.updateLanguage (New)

Updates user's language preference.

**Args**:

```typescript
{
  userId: Id<"users">;
  lang: "system" | "en" | "zh-HK";
}
```

**Returns**: `void`

**Validation**:

- User must exist
- Lang must be one of the valid values

---

### REMOVED: users.getByApiToken

### REMOVED: users.regenerateApiToken

---

## userCategories Module (New)

### userCategories.listByUser

Get all categories for a user, ordered by active status then order.

**Args**:

```typescript
{
  userId: Id<"users">;
}
```

**Returns**:

```typescript
Array<{
  _id: Id<"userCategories">;
  userId: Id<"users">;
  isActive: boolean;
  emoji: string;
  en_name?: string;
  zh_name?: string;
  order: number;
  createdAt: number;
}>;
```

**Behavior**:

- Returns active categories first (sorted by order ASC)
- Then inactive categories (sorted by order ASC)

---

### userCategories.listActiveByUser

Get only active categories for a user.

**Args**:

```typescript
{
  userId: Id<"users">;
}
```

**Returns**: `Array<UserCategory>` (same shape as above, only `isActive: true`)

---

### userCategories.getById

Get a single category by ID.

**Args**:

```typescript
{
  categoryId: Id<"userCategories">;
}
```

**Returns**: `UserCategory | null`

---

### userCategories.create

Create a new category.

**Args**:

```typescript
{
  userId: Id<"users">;
  emoji: string;
  name: string;
  currentLang: "en" | "zh-HK";
}
```

**Returns**: `Id<"userCategories">`

**Behavior**:

- Sets `isActive: true`
- Sets `order` to `max(existing orders) + 1`
- Saves `name` to both `en_name` and `zh_name` (new category has both empty)

---

### userCategories.update

Update a category's name and emoji.

**Args**:

```typescript
{
  categoryId: Id<"userCategories">;
  emoji?: string;
  name?: string;
  currentLang: "en" | "zh-HK";
}
```

**Returns**: `void`

**Behavior**:

- If `en_name` AND `zh_name` are both empty/null: save `name` to both
- Otherwise: save `name` only to the field matching `currentLang`

---

### userCategories.deactivate

Mark a category as inactive.

**Args**:

```typescript
{
  categoryId: Id<"userCategories">;
}
```

**Returns**: `void`

---

### userCategories.activate

Mark a category as active.

**Args**:

```typescript
{
  categoryId: Id<"userCategories">;
}
```

**Returns**: `void`

---

### userCategories.reorder

Update order values for multiple categories.

**Args**:

```typescript
{
  updates: Array<{
    categoryId: Id<"userCategories">;
    order: number;
  }>;
}
```

**Returns**: `void`

**Behavior**:

- Batch updates order values
- Used after drag-to-reorder completes

---

## transactions Module

### transactions.createFromWeb (Modified)

**Args**:

```typescript
{
  userId: Id<"users">;
  amount: number;
  name?: string;
  category?: Id<"userCategories">; // CHANGED from string
}
```

**Returns**: `Id<"transactions">`

**Removed Args**:

- `merchant` - No longer supported

---

### transactions.update (Modified)

**Args**:

```typescript
{
  transactionId: Id<"transactions">;
  amount?: number;
  name?: string;
  category?: Id<"userCategories">; // CHANGED from string
  createdAt?: number;
}
```

**Returns**: `Id<"transactions">`

**Removed Args**:

- `merchant` - No longer supported

---

### transactions.listByUser (Modified)

**Returns**: Transactions with `category` as `Id<"userCategories"> | undefined` instead of `string | undefined`

---

### transactions.listByUserPaginated (Modified)

**Args**:

```typescript
{
  userId: Id<"users">;
  paginationOpts: PaginationOpts;
  category?: Id<"userCategories">; // CHANGED from string
  startDate?: number;
  endDate?: number;
  minAmount?: number;
  maxAmount?: number;
}
```

---

### transactions.aggregateByCategory (Modified)

Returns category IDs instead of strings. Frontend must join with userCategories for display.

---

### REMOVED: transactions.createFromApi

---

## locationHistories Module

### locationHistories.findNearby (Modified)

Find nearby location histories with expanded radius.

**Args**:

```typescript
{
  userId: Id<"users">;
  latitude: number;
  longitude: number;
  radiusMeters?: number; // Default: 200 (changed from 100)
}
```

**Returns**:

```typescript
Array<{
  _id: Id<"locationHistories">;
  userId: Id<"users">;
  latitude: number;
  longitude: number;
  amount: number;
  category?: Id<"userCategories">; // CHANGED from string
  name?: string;
  count: number;
  createdAt: number;
  distance: number; // Calculated distance in meters
}>;
```

**Behavior**:

- Default radius changed from 100m to 200m
- Results sorted by distance (ascending)

---

### locationHistories.upsertNearby (Modified)

Create or update location history.

**Args**:

```typescript
{
  userId: Id<"users">;
  latitude: number;
  longitude: number;
  amount: number;
  category?: Id<"userCategories">; // CHANGED from string
  name?: string;
  selectedLocationId?: Id<"locationHistories">; // NEW: explicitly select which to update
}
```

**Returns**: `Id<"locationHistories">`

**Behavior**:

- If `selectedLocationId` provided: update that specific record
- If not provided: create new record
- On update:
  - lat/long: weighted average `newLat = oldLat + (formLat - oldLat) / newCount`
  - amount: store latest value (not weighted)
  - category: store latest value
  - name: store latest value
  - count: increment by 1
- Category matching NOT required (any location within radius can be updated)

---

### locationHistories.update (New)

Update a location history record directly (for settings page).

**Args**:

```typescript
{
  locationHistoryId: Id<"locationHistories">;
  name?: string;
  amount?: number;
  category?: Id<"userCategories">;
}
```

**Returns**: `void`

---

### locationHistories.remove (New)

Delete a location history record.

**Args**:

```typescript
{
  locationHistoryId: Id<"locationHistories">;
}
```

**Returns**: `void`

---

### locationHistories.listByUser (Unchanged)

**Args**: `{ userId: Id<"users"> }`  
**Returns**: `Array<LocationHistory>` (with category as `Id<"userCategories">`)

---

## HTTP Endpoints

### REMOVED: POST /api/transaction

The external API endpoint is removed. All transaction creation now goes through Convex mutations via the web app.

---

## TypeScript Type Changes

### src/types/index.ts

```typescript
// REMOVED
export interface CreateTransactionRequest { ... }
export interface CreateTransactionResponse { ... }
export const DEFAULT_CATEGORIES = [...];
export type DefaultCategory = ...;

// User - MODIFIED
export interface User {
  _id: Id<"users">;
  name: string;
  email: string;
  image?: string;
  lang?: "system" | "en" | "zh-HK"; // NEW
  createdAt: number;
  // REMOVED: apiToken
}

// Transaction - MODIFIED
export interface Transaction {
  _id: Id<"transactions">;
  userId: Id<"users">;
  name?: string;
  // REMOVED: merchant
  category?: Id<"userCategories">; // CHANGED from string
  amount: number;
  createdAt: number;
  source: "web"; // CHANGED from "api" | "web"
}

// UserCategory - NEW
export interface UserCategory {
  _id: Id<"userCategories">;
  userId: Id<"users">;
  isActive: boolean;
  emoji: string;
  en_name?: string;
  zh_name?: string;
  order: number;
  createdAt: number;
}

// LocationHistory - MODIFIED
export interface LocationHistory {
  _id: Id<"locationHistories">;
  userId: Id<"users">;
  latitude: number;
  longitude: number;
  amount: number;
  category?: Id<"userCategories">; // CHANGED from string
  name?: string;
  count: number;
  createdAt: number;
}
```
