# Tasks: Phase 3 Enhancements

**Input**: Design documents from `/specs/003-phase3-enhancements/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Test tasks included per Constitution requirements (contract tests, integration tests, unit tests)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

This is a **Next.js web application** with unified structure:
- Frontend/Backend: `src/app/` (App Router with API routes)
- Components: `src/components/`
- Convex backend: `convex/`
- i18n: `messages/`
- Tests: `tests/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and schema preparation

- [X] T001 Review existing project structure and verify all dependencies are installed
- [X] T002 [P] Run ESLint and TypeScript type check to ensure clean baseline
- [X] T003 [P] Create test directory structure: `tests/contract/`, `tests/integration/`, `tests/unit/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core schema and infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Schema Changes

- [X] T004 Update Convex schema in `convex/schema.ts` to add `apiToken: v.string()` field to users table
- [X] T005 Update Convex schema in `convex/schema.ts` to add `.index("by_apiToken", ["apiToken"])` to users table
- [ ] T006 Deploy Convex schema changes with `convex deploy` and verify in dashboard (MANUAL STEP - requires Convex CLI)

### Convex Backend - Core Mutations/Queries

- [X] T007 [P] Add `generateApiToken()` helper function in `convex/users.ts` using `crypto.randomUUID()` or `crypto.randomBytes(32).toString('base64url')` - this single utility will be used by both initial creation and regeneration mutations
- [X] T008 [P] Add `getByApiToken` query in `convex/users.ts` with args `{ apiToken: v.string() }`
- [X] T009 [P] Add `regenerateApiToken` mutation in `convex/users.ts` with args `{ userId: v.id("users") }` - calls `generateApiToken()` helper to get new token
- [X] T010 [P] Update `create` mutation in `convex/users.ts` to call `generateApiToken()` helper when initially creating user (instead of inline UUID generation)
- [X] T011 [P] Add `findByName` query in `convex/userCategories.ts` with args `{ userId: v.id("users"), name: v.string() }` for case-insensitive match on both `en_name` and `zh_name`
- [X] T012 [P] Add `createFromApi` mutation in `convex/transactions.ts` with args `{ userId, amount, categoryId, name? }`

### Convex Backend - Update Existing Queries

- [X] T013 [P] Update all userCategory queries in `convex/userCategories.ts` to use `by_userId` index with `.order("asc")` instead of `by_userId_order`
- [X] T014 [P] Update category list queries to order by `createdAt` ascending (oldest first)

### Type Definitions

- [X] T015 [P] Add API request/response types in `src/types/index.ts`: `CreateTransactionRequest`, `CreateTransactionResponse`, `ErrorResponse`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - External API Transaction Creation (Priority: P1) 🎯 MVP

**Goal**: Enable external systems to create transactions via REST API using API token authentication

**Independent Test**: Obtain API token from settings, make POST request with curl, verify transaction appears in records list

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T016 [P] [US1] Create contract test file `tests/contract/api-transactions-create.test.ts` with test cases for: valid request (201), missing apiToken (401), invalid apiToken (401), missing amount (400), negative amount (400), missing category (400), rate limit (429), category auto-creation (201)
- [X] T017 [P] [US1] Create integration test file `tests/integration/api-token.test.ts` with full flow: generate token → copy token → API call succeeds → transaction appears in list

### Implementation for User Story 1

- [X] T018 [US1] Create API route directory `src/app/api/transactions/create/`
- [X] T019 [US1] Implement POST handler in `src/app/api/transactions/create/route.ts` with request validation (apiToken, amount, category)
- [X] T020 [US1] Add rate limiting logic in `src/app/api/transactions/create/route.ts` (60 req/min per token, in-memory Map)
- [X] T021 [US1] Implement user authentication via `convex.query(api.users.getByApiToken)` in route handler
- [X] T022 [US1] Implement category matching/auto-creation logic using `api.userCategories.findByName` and `api.userCategories.create`
- [X] T023 [US1] Implement transaction creation using `api.transactions.createFromApi` in route handler
- [X] T024 [US1] Add error handling for all error cases (401, 400, 429, 500) with descriptive messages
- [X] T025 [US1] Add rate limit headers (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset) to responses
- [X] T026 [US1] Create `src/components/settings/ApiTokenDisplay.tsx` component with show/hide toggle, copy button, regenerate confirmation
- [X] T027 [US1] Add ApiTokenDisplay component to settings page in `src/app/(authenticated)/settings/page.tsx`
- [X] T028 [US1] Ensure API token is generated for existing users (call `regenerateApiToken` on settings page load if token missing)
- [X] T029 [US1] Add usage instructions section to ApiTokenDisplay component explaining endpoint URL and payload format

**Checkpoint**: At this point, User Story 1 should be fully functional - users can generate tokens, make API calls, and see transactions created

---

## Phase 4: User Story 2 - Simplified Swipe Gestures (Priority: P1)

**Goal**: Remove right-swipe gestures from all lists, keep only left-swipe for delete/deactivate actions

**Independent Test**: Attempt to swipe right on transaction/category/location items (no effect), swipe left to trigger actions

### Tests for User Story 2

- [X] T030 [P] [US2] Create unit test file `tests/unit/swipe-gestures.test.ts` to verify right-swipe has no effect and left-swipe triggers actions

### Implementation for User Story 2

- [X] T031 [P] [US2] Update `src/hooks/useSwipeGesture.ts` to remove `onSwipeRight` from config interface
- [X] T032 [P] [US2] Update `src/hooks/useSwipeGesture.ts` to remove right-swipe detection logic in `handleTouchEnd`
- [X] T033 [P] [US2] Update `src/components/ui/SwipeableCard.tsx` to remove `onSwipeRightAction`, `rightActionLabel`, `rightActionColor` props
- [X] T034 [P] [US2] Update `src/components/ui/SwipeableCard.tsx` to remove right action background rendering
- [X] T035 [P] [US2] Update `src/components/transactions/TransactionCard.tsx` to remove any `onSwipeRightAction` prop usage
- [X] T036 [P] [US2] Update `src/app/(authenticated)/settings/userCategory/page.tsx` to remove any `onSwipeRightAction` prop usage
- [X] T037 [P] [US2] Update `src/app/(authenticated)/settings/locationHistories/page.tsx` to remove any `onSwipeRightAction` prop usage

**Checkpoint**: Swipe gestures simplified - right-swipe disabled across all lists

---

## Phase 5: User Story 3 - Simplified Category Management (Priority: P2)

**Goal**: Remove drag-and-drop reordering, display categories ordered by createdAt

**Independent Test**: Create multiple categories, verify they appear in creation order with no drag handles

### Tests for User Story 3

- [X] T038 [P] [US3] Create unit test file `tests/unit/category-ordering.test.ts` to verify categories ordered by createdAt ascending

### Implementation for User Story 3

- [X] T039 [P] [US3] Remove drag handle UI elements from `src/app/(authenticated)/settings/userCategory/page.tsx`
- [X] T040 [P] [US3] Remove drag event handlers (`onDragStart`, `onDragOver`, `onDrop`) from category management page
- [X] T041 [P] [US3] Remove any reorder mutation calls from `src/app/(authenticated)/settings/userCategory/page.tsx`
- [X] T042 [P] [US3] Verify category dropdowns in transaction forms display categories in createdAt order

**Checkpoint**: Category management simplified - no drag-and-drop, predictable ordering by creation date

---

## Phase 6: User Story 4 - Enhanced Monthly Category Spending View (Priority: P1)

**Goal**: Add month navigation to pie chart with arrows and dropdown for selecting specific months

**Independent Test**: Navigate stats page, click arrows to change months, select month from dropdown, verify data updates

### Tests for User Story 4

- [X] T043 [P] [US4] Create integration test file `tests/integration/stats-navigation.test.ts` for month navigation: arrow clicks, dropdown selection, data updates

### Implementation for User Story 4

- [X] T044 [US4] Add Convex query `aggregateByCategoryForMonth` in `convex/transactions.ts` with args `{ userId, startDate, endDate }` to filter by month range
- [X] T045 [US4] Add month state to `src/components/stats/CategoryPieChart.tsx`: `{ year: number, month: number }`
- [X] T046 [US4] Add month navigation controls JSX in CategoryPieChart: left arrow, clickable "MM/yyyy" label, right arrow (with 44px min touch targets)
- [X] T047 [US4] Implement `goToPreviousMonth()` handler in CategoryPieChart to decrement month state
- [X] T048 [US4] Implement `goToNextMonth()` handler in CategoryPieChart to increment month (disabled if current month)
- [X] T049 [US4] Implement month dropdown component that appears when clicking "MM/yyyy" label
- [X] T050 [US4] Populate month dropdown with available months (earliest transaction to current month)
- [X] T051 [US4] Update Convex query call in CategoryPieChart to use `aggregateByCategoryForMonth` with calculated startDate/endDate from selected month
- [X] T052 [US4] Add loading state for chart data updates
- [X] T053 [US4] Add empty state handling for months with no transactions (display "$0 spending")
- [X] T054 [US4] Ensure category labels use userCategory emoji + name (respecting user language preference)
- [X] T055 [US4] Add aria-labels to navigation arrows for accessibility

**Checkpoint**: Pie chart month navigation complete - users can explore historical spending by month

---

## Phase 7: User Story 5 - Category-Filtered Spending Histogram (Priority: P2)

**Goal**: Add category dropdown filter to histogram to show spending trends for specific categories

**Independent Test**: Select different categories from dropdown, verify histogram shows only that category's data

### Implementation for User Story 5

- [X] T056 [US5] Update `aggregateByMonth` query in `convex/transactions.ts` to accept optional `categoryId` parameter
- [X] T057 [US5] Add category filter logic to `aggregateByMonth` query to filter transactions by categoryId if provided
- [X] T058 [US5] Add category state to `src/components/stats/MonthlyHistogram.tsx`: `selectedCategoryId: Id<"userCategories"> | null`
- [X] T059 [US5] Add category dropdown JSX to top left of histogram card with "All" option + user's active categories
- [X] T060 [US5] Fetch active userCategories for dropdown using existing Convex query
- [X] T061 [US5] Implement `handleCategoryChange` handler to update selectedCategoryId state
- [X] T062 [US5] Update Convex query call to pass `categoryId: selectedCategoryId` parameter
- [X] T063 [US5] Add visual indicator showing which category is filtered (update card title or add badge)
- [X] T064 [US5] Add aria-label to category dropdown for accessibility

**Checkpoint**: Histogram category filtering complete - users can analyze spending trends by specific category

**Note (2026-02-04)**: Phase 7 implementation verified complete. All "Loading..." strings across the project have been updated to use i18n translations (`common.loading`) for better internationalization support.

---

## Phase 8: User Story 6 - Stats Page Internationalization Support (Priority: P3)

**Goal**: Add i18n support to stats page for English and Chinese languages

**Independent Test**: Switch language preference, verify all stats page text updates to selected language

### Implementation for User Story 6

- [ ] T065 [P] [US6] Add stats translations to `messages/en.json`: "spendingByCategory", "recentSpending", "categoryFilter.all", "monthNavigation.previousMonth", "monthNavigation.nextMonth", "totalSpending", "noDataForMonth"
- [ ] T066 [P] [US6] Add stats translations to `messages/zh-HK.json` (Chinese versions of above keys)
- [ ] T067 [P] [US6] Add `useTranslations('stats')` hook to `src/app/(authenticated)/stats/page.tsx`
- [ ] T068 [P] [US6] Replace hardcoded text in stats page with translation keys
- [ ] T069 [P] [US6] Add `useTranslations('stats')` hook to `src/components/stats/CategoryPieChart.tsx`
- [ ] T070 [P] [US6] Replace hardcoded text in pie chart component with translation keys
- [ ] T071 [P] [US6] Add `useTranslations('stats')` hook to `src/components/stats/MonthlyHistogram.tsx`
- [ ] T072 [P] [US6] Replace hardcoded text in histogram component with translation keys
- [ ] T073 [P] [US6] Implement category name display logic: use `zh_name` when lang is "zh-HK", fallback to `en_name`
- [ ] T074 [P] [US6] Update chart tooltips and legends to use localized text

**Checkpoint**: Stats page i18n complete - page displays correctly in both English and Chinese

---

## Phase 9: User Story 7 - Streamlined Stats Time Period Selection (Priority: P2)

**Goal**: Remove week/month/year toggle buttons from stats page

**Independent Test**: Verify toggle buttons are not present, pie chart and histogram use their own navigation

### Implementation for User Story 7

- [ ] T075 [P] [US7] Remove `timePeriod` state (week/month/year) from `src/app/(authenticated)/stats/page.tsx`
- [ ] T076 [P] [US7] Remove time period toggle button JSX from stats page header
- [ ] T077 [P] [US7] Remove `periodButtonClass()` and `getPeriodLabel()` helper functions
- [ ] T078 [P] [US7] Remove `dateRange` calculation based on timePeriod (no longer needed)
- [ ] T079 [P] [US7] Update histogram to use fixed 6-month range (already implemented in US5, verify it works)

**Checkpoint**: Stats page UI simplified - time period buttons removed

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup, documentation, and cross-story validation

### Code Cleanup

- [ ] T080 [P] Remove unused imports across all modified files
- [ ] T081 [P] Add JSDoc comments to `generateApiToken()` utility function explaining token generation approach (crypto.randomUUID or crypto.randomBytes) and that it is used by both initial user creation and token regeneration
- [ ] T082 [P] Add JSDoc comments explaining case-sensitive category name matching
- [ ] T083 [P] Add JSDoc comments for default emoji selection (❓) in category auto-creation

### Testing & Validation

- [ ] T084 Run all tests with `bun run test` and ensure 100% pass rate
- [ ] T085 Run ESLint with `bun run lint` and fix any warnings/errors
- [ ] T086 Run TypeScript type check and ensure no type errors
- [ ] T087 Manual testing: Test API endpoint with curl for all error cases (401, 400, 429, 500)
- [ ] T088 Manual testing: Test month navigation in pie chart (arrows, dropdown, current month boundary)
- [ ] T089 Manual testing: Test category filtering in histogram (All, specific categories, empty data)
- [ ] T090 Manual testing: Test swipe gestures (right-swipe disabled, left-swipe works)
- [ ] T091 Manual testing: Test category ordering (verify createdAt order in all dropdowns)
- [ ] T092 Manual testing: Test i18n (switch language, verify all text updates)
- [ ] T093 Manual testing: Test API token display (show/hide, copy, regenerate with confirmation)

### Performance Validation

- [ ] T094 Measure API endpoint response time (should be < 500ms at p95)
- [ ] T095 Measure pie chart data update time (should be < 1s)
- [ ] T096 Measure histogram data update time (should be < 1s)
- [ ] T097 Check bundle size impact (should be < 5KB increase from API token component)

### Documentation

- [ ] T098 Update README if needed with API endpoint documentation
- [ ] T099 Verify all code follows TypeScript strict mode conventions
- [ ] T100 Verify all new components have proper TypeScript interfaces

---

## Dependencies & Parallel Execution

### User Story Dependencies

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational) ← MUST complete before any user stories
    ↓
    ├─→ Phase 3 (US1: API) ← MVP (can test independently)
    ├─→ Phase 4 (US2: Swipe) ← No dependencies (parallel with US1)
    ├─→ Phase 5 (US3: Category Order) ← No dependencies (parallel with US1, US2)
    ├─→ Phase 6 (US4: Pie Chart) ← No dependencies (parallel with US1-US3)
    ├─→ Phase 7 (US5: Histogram) ← No dependencies (parallel with US1-US4)
    ├─→ Phase 8 (US6: i18n) ← Requires US4, US5 complete (depends on chart components existing)
    └─→ Phase 9 (US7: Remove Buttons) ← Requires US4 complete (depends on pie chart navigation)
         ↓
    Phase 10 (Polish) ← Requires all user stories complete
```

### Parallel Execution Opportunities

**After Phase 2 (Foundation) is complete:**

- **Group A** (can work in parallel):
  - User Story 1 (API): T016-T029
  - User Story 2 (Swipe): T030-T037
  - User Story 3 (Category Order): T038-T042
  - User Story 4 (Pie Chart): T043-T055
  - User Story 5 (Histogram): T056-T064

- **Group B** (requires Group A user story 4 & 5 complete):
  - User Story 6 (i18n): T065-T074

- **Group C** (requires Group A user story 4 complete):
  - User Story 7 (Remove Buttons): T075-T079

**Polish Phase** (requires all user stories complete):
- All T080-T100 tasks can run in parallel except testing tasks which should run after code cleanup

---

## Implementation Strategy

### MVP Scope (Recommended First Iteration)

Implement **User Story 1 only** (T001-T029) for initial MVP:
- Foundational schema changes (T004-T015)
- API endpoint with authentication (T016-T029)
- Delivers immediate value: external API integration
- Independently testable
- Can be deployed without other stories

### Incremental Delivery Plan

1. **Sprint 1**: Foundation + US1 (API) - T001-T029
2. **Sprint 2**: US2 (Swipe) + US3 (Category Order) - T030-T042
3. **Sprint 3**: US4 (Pie Chart) + US5 (Histogram) - T043-T064
4. **Sprint 4**: US6 (i18n) + US7 (Remove Buttons) + Polish - T065-T100

Each sprint delivers independently testable value.

---

## Task Summary

**Total Tasks**: 99  
**Setup Phase**: 3 tasks  
**Foundational Phase**: 11 tasks (blocking) ← *Consolidated token generation from 2 separate mutations to 1 utility + 2 mutations*  
**User Story 1 (P1)**: 14 tasks (MVP)  
**User Story 2 (P1)**: 8 tasks  
**User Story 3 (P2)**: 5 tasks  
**User Story 4 (P1)**: 13 tasks  
**User Story 5 (P2)**: 9 tasks  
**User Story 6 (P3)**: 10 tasks  
**User Story 7 (P2)**: 5 tasks  
**Polish Phase**: 21 tasks

**Parallelizable Tasks**: 68 tasks marked with [P]  
**Sequential Tasks**: 32 tasks (have dependencies)

**Independent Test Criteria**:
- US1: API call succeeds, transaction appears in records
- US2: Right-swipe has no effect, left-swipe triggers actions
- US3: Categories appear in creation order, no drag handles
- US4: Month navigation works, data updates per month
- US5: Category filter works, histogram shows filtered data
- US6: Language switch updates all text
- US7: Time period buttons removed

**Suggested MVP**: User Story 1 (T001-T029) - 29 tasks for fully functional external API integration

---

## Token Generation Consolidation Pattern

### Clarification (2026-02-04)

The three token-related functions have been consolidated into a **single `generateApiToken()` utility function** to follow DRY principles and reduce code duplication.

**Previous approach** (removed):
- `generateInitialApiToken()` mutation with separate logic
- `regenerateApiToken()` mutation with duplicate logic
- Inline token generation in `create()` mutation

**New consolidated approach**:

```typescript
// convex/users.ts

/**
 * Generate a cryptographically secure API token
 * Used by both initial token generation (during user creation) and regeneration
 */
function generateApiToken(): string {
  return crypto.randomUUID();
}

export const create = mutation({
  args: { name: v.string(), email: v.string(), image: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const apiToken = generateApiToken(); // ← calls utility
    return await ctx.db.insert("users", { ...args, apiToken, createdAt: Date.now() });
  },
});

export const regenerateApiToken = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const newToken = generateApiToken(); // ← same utility
    await ctx.db.patch(args.userId, { apiToken: newToken });
    return newToken;
  },
});
```

**Benefits**:
1. **Single source of truth** - Token format changes only require updating one function
2. **Consistency** - All tokens guaranteed to follow same format and security standards
3. **Testability** - One function to unit test for token generation logic
4. **Maintainability** - Clear intent that both operations use identical token strategy

**Implementation Note**: This consolidation reduces Foundational Phase tasks from 12 to 11 (T007-T012 instead of T007-T013).
