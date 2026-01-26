# Tasks: Transaction Tracker

**Input**: Design documents from `/specs/001-transaction-tracker/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/, research.md, quickstart.md

**Tests**: Not explicitly requested in spec - test tasks are omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Project Type**: Single Next.js project with Convex backend
- **Source**: `src/` at repository root
- **Convex**: `convex/` at repository root
- **Public**: `public/` for PWA assets

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create Next.js 14 project with TypeScript, Tailwind, ESLint, App Router, and src directory using Bun
- [X] T002 Install core dependencies (convex, next-auth@beta, @auth/core, recharts, lucide-react, next-pwa)
- [X] T003 Install dev dependencies (@types/node, vitest, @testing-library/react, @playwright/test)
- [X] T004 [P] Create .env.example with required environment variables (CONVEX_DEPLOYMENT, NEXT_PUBLIC_CONVEX_URL, NEXTAUTH_URL, NEXTAUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
- [X] T005 [P] Configure ESLint and Prettier for TypeScript strict mode
- [X] T006 Initialize Convex project with `bunx convex dev`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T007 Create Convex schema with users and transactions tables in convex/schema.ts (per data-model.md)
- [ ] T008 [P] Create user queries/mutations in convex/users.ts (getByEmail, getByApiToken, create)
- [ ] T009 [P] Create shared TypeScript types in src/types/index.ts (Transaction, User, CreateTransactionRequest, etc.)
- [ ] T010 Configure NextAuth with Google OAuth provider in src/lib/auth.ts
- [ ] T011 Create NextAuth API route handlers in src/app/api/auth/[...nextauth]/route.ts
- [ ] T012 Set up Convex client provider in src/lib/convex.ts
- [ ] T013 Create root layout with Convex and auth providers in src/app/layout.tsx
- [ ] T014 [P] Create login page with Google OAuth button in src/app/login/page.tsx
- [ ] T015 [P] Create redirect logic in src/app/page.tsx (redirect to /records or /login based on auth)
- [ ] T016 Create authenticated route group layout with session check in src/app/(authenticated)/layout.tsx
- [ ] T017 [P] Create Button component in src/components/ui/Button.tsx
- [ ] T018 [P] Create Card component in src/components/ui/Card.tsx
- [ ] T019 [P] Create Header component with "Spendy" title in src/components/ui/Header.tsx
- [ ] T020 [P] Create LoadingSpinner component in src/components/ui/LoadingSpinner.tsx
- [ ] T021 Create responsive NavigationBar component (bottom on mobile, side on desktop) in src/components/navigation/NavigationBar.tsx
- [ ] T022 Add NavigationBar to authenticated layout in src/app/(authenticated)/layout.tsx
- [ ] T023 [P] Create PWA manifest in public/manifest.json
- [ ] T024 [P] Create PWA icons in public/icons/ (192x192, 512x512)
- [ ] T025 Configure next-pwa in next.config.js

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Receive External Transaction (Priority: P1) 🎯 MVP

**Goal**: Accept transaction data from external sources via secure POST requests and store them

**Independent Test**: Send a POST request to `/api/transaction` with valid data and verify transaction is created

### Implementation for User Story 1

- [ ] T026 [US1] Create transaction mutations in convex/transactions.ts (createFromApi with apiToken lookup)
- [ ] T027 [US1] Create transaction API endpoint in src/app/api/transaction/route.ts implementing:
  - Request body parsing and validation per contracts/transaction-api.yaml
  - apiToken authentication via Convex user lookup
  - Call Convex mutation to create transaction with source="api"
  - Return 201 on success, 400 for validation errors, 401 for auth failures
- [ ] T028 [US1] Add request logging for audit purposes in src/app/api/transaction/route.ts
- [ ] T029 [US1] Add rate limiting middleware (basic implementation) in src/app/api/transaction/route.ts

**Checkpoint**: External systems can now send transactions via API

---

## Phase 4: User Story 2 - View Transaction Dashboard (Priority: P1) 🎯 MVP

**Goal**: Display transactions through charts and graphs for spending insights

**Independent Test**: Load the dashboard with sample transaction data and verify charts render with category breakdowns and time trends

### Implementation for User Story 2

- [ ] T030 [US2] Create Convex query for transactions by date range in convex/transactions.ts (getByUserAndDateRange)
- [ ] T031 [US2] Create Convex query for category aggregation in convex/transactions.ts (aggregateByCategory)
- [ ] T032 [US2] Create Convex query for monthly aggregation in convex/transactions.ts (aggregateByMonth)
- [ ] T033 [P] [US2] Create CategoryPieChart component using recharts in src/components/stats/CategoryPieChart.tsx
- [ ] T034 [P] [US2] Create MonthlyHistogram component using recharts in src/components/stats/MonthlyHistogram.tsx
- [ ] T035 [US2] Create stats page with time period selector (week, month, year) in src/app/(authenticated)/stats/page.tsx
- [ ] T036 [US2] Add empty state with guidance when no transactions in src/app/(authenticated)/stats/page.tsx
- [ ] T037 [US2] Implement real-time chart updates using Convex subscriptions in stats page

**Checkpoint**: Users can view their spending patterns through interactive charts

---

## Phase 5: User Story 3 - Manually Create Transaction (Priority: P2)

**Goal**: Allow users to manually add transaction records through the app interface

**Independent Test**: User fills out transaction form, submits, and new transaction appears in transaction list

### Implementation for User Story 3

- [ ] T038 [US3] Create Convex mutation for web-created transactions in convex/transactions.ts (createFromWeb)
- [ ] T039 [US3] Create transaction form component with amount, description, date, category fields in src/components/records/TransactionForm.tsx
- [ ] T040 [US3] Add category selector with default categories (Food & Dining, Transport, Shopping, Entertainment, Bills & Utilities, Health, Other) in src/components/records/CategorySelect.tsx
- [ ] T041 [US3] Add client-side validation with clear error messages in src/components/records/TransactionForm.tsx
- [ ] T042 [US3] Add "Add Transaction" button to records page that opens form/modal in src/app/(authenticated)/records/page.tsx
- [ ] T043 [US3] Integrate TransactionForm with Convex mutation in src/components/records/TransactionForm.tsx

**Checkpoint**: Users can manually add transactions through the web interface

---

## Phase 6: User Story 4 - View Transaction List (Priority: P2)

**Goal**: Display paginated list of all transactions with filtering capabilities

**Independent Test**: Load transaction list page, verify all transactions display with correct details, and filtering/sorting works

### Implementation for User Story 4

- [ ] T044 [US4] Create Convex query for paginated transactions in convex/transactions.ts (listByUser with cursor pagination)
- [ ] T045 [US4] Create TransactionList component displaying amount, description, category, date, source in src/components/records/TransactionList.tsx
- [ ] T046 [US4] Create TransactionCard component for individual transaction display in src/components/records/TransactionCard.tsx
- [ ] T047 [US4] Create records page with transaction list in src/app/(authenticated)/records/page.tsx
- [ ] T048 [US4] Add filter controls (date range, category, amount range) in src/components/records/TransactionFilters.tsx
- [ ] T049 [US4] Implement lazy loading/infinite scroll for transaction list in src/components/records/TransactionList.tsx
- [ ] T050 [US4] Add empty state when no transactions match filters in src/app/(authenticated)/records/page.tsx

**Checkpoint**: Users can browse and filter their complete transaction history

---

## Phase 7: User Story 5 - Edit and Delete Transactions (Priority: P3)

**Goal**: Allow users to edit or delete transactions for data hygiene

**Independent Test**: Edit a transaction's details and verify changes persist; delete a transaction and confirm it no longer appears

### Implementation for User Story 5

- [ ] T051 [US5] Create Convex mutation for updating transactions in convex/transactions.ts (update)
- [ ] T052 [US5] Create Convex mutation for deleting transactions in convex/transactions.ts (remove)
- [ ] T053 [US5] Create transaction detail view/modal in src/components/records/TransactionDetail.tsx
- [ ] T054 [US5] Add edit mode to transaction detail with editable fields in src/components/records/TransactionDetail.tsx
- [ ] T055 [US5] Add delete button with confirmation dialog in src/components/records/TransactionDetail.tsx
- [ ] T056 [US5] Integrate edit/delete with Convex mutations in src/components/records/TransactionDetail.tsx
- [ ] T057 [US5] Wire up TransactionCard click to open TransactionDetail in src/components/records/TransactionCard.tsx

**Checkpoint**: Users have full control over their transaction data

---

## Phase 8: Settings & API Token (Priority: P3)

**Goal**: Allow users to view and manage their API token for external integrations

**Independent Test**: User can view their API token and copy it to clipboard; regenerate token works

### Implementation for Settings

- [ ] T058 Create settings page in src/app/(authenticated)/settings/page.tsx
- [ ] T059 [P] Create ApiTokenDisplay component with copy-to-clipboard in src/components/settings/ApiTokenDisplay.tsx
- [ ] T060 Create Convex mutation for regenerating API token in convex/users.ts (regenerateApiToken)
- [ ] T061 Add regenerate token button with confirmation in src/components/settings/ApiTokenDisplay.tsx
- [ ] T062 Display user profile info (name, email, avatar) in settings page

**Checkpoint**: Users can manage their API tokens for external integrations

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T063 [P] Add consistent error handling and error boundaries across all pages
- [ ] T064 [P] Add loading states with LoadingSpinner across all async operations
- [ ] T065 [P] Add toast notifications for success/error feedback using a lightweight solution
- [ ] T066 Implement optimistic updates for transaction create/edit/delete
- [ ] T067 [P] Ensure touch targets are 44x44px minimum on mobile
- [ ] T068 [P] Verify responsive breakpoints work correctly across all pages
- [ ] T069 Bundle size optimization - verify < 200KB JS gzipped
- [ ] T070 Performance audit - verify LCP < 2.5s, FID < 100ms, CLS < 0.1
- [ ] T071 Run quickstart.md validation to ensure setup instructions work

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - US1 and US2 are both P1 and can proceed in parallel
  - US3 and US4 are both P2 and can proceed in parallel (after US1/US2 or concurrently)
  - US5 depends on US4 (needs transaction list UI to edit/delete)
- **Settings (Phase 8)**: Can proceed after Foundational (independent of other stories)
- **Polish (Phase 9)**: Depends on all desired user stories being complete

### User Story Dependencies

| Story | Priority | Can Start After | Dependencies |
|-------|----------|-----------------|--------------|
| US1 - External Transaction | P1 | Foundational | None |
| US2 - Dashboard | P1 | Foundational | None (uses same transaction data as US1) |
| US3 - Manual Create | P2 | Foundational | None (can work with empty list) |
| US4 - Transaction List | P2 | Foundational | None |
| US5 - Edit/Delete | P3 | US4 | Needs transaction list UI |

### Within Each User Story

- Models/schema before queries
- Queries before components that consume them
- Base components before page integration
- Core implementation before enhancements

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, US1 and US2 can start in parallel
- US3 and US4 can start in parallel (after or with US1/US2)
- All UI component tasks marked [P] within a story can run in parallel

---

## Parallel Example: Phase 2 Foundational

```bash
# These tasks can run in parallel:
Task: T008 [P] Create user queries/mutations in convex/users.ts
Task: T009 [P] Create shared TypeScript types in src/types/index.ts

# These can also run in parallel after T013:
Task: T014 [P] Create login page
Task: T015 [P] Create redirect logic
Task: T017 [P] Create Button component
Task: T018 [P] Create Card component
Task: T019 [P] Create Header component
Task: T020 [P] Create LoadingSpinner component
```

---

## Parallel Example: User Story 2 - Dashboard

```bash
# After T030-T032 (queries) complete, these can run in parallel:
Task: T033 [P] [US2] Create CategoryPieChart component
Task: T034 [P] [US2] Create MonthlyHistogram component
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 - External Transaction API
4. Complete Phase 4: User Story 2 - Dashboard
5. **STOP and VALIDATE**: Test API endpoint and dashboard independently
6. Deploy/demo if ready - users can receive transactions and view insights

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add US1 (External Transaction) → Test independently → MVP can receive data
3. Add US2 (Dashboard) → Test independently → MVP can visualize data
4. Add US3 (Manual Create) + US4 (Transaction List) → Full CRUD experience
5. Add US5 (Edit/Delete) → Data hygiene capabilities
6. Add Settings → API token management
7. Polish → Production-ready

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (API) + User Story 3 (Manual Create)
   - Developer B: User Story 2 (Dashboard) + User Story 4 (List)
   - Developer C: Settings + Polish
3. Developer A or B: User Story 5 (Edit/Delete) after US4 complete

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
