# Tasks: Phase 2 Enhancements

**Input**: Design documents from `/specs/002-phase2-enhancements/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: NOT included - no test tasks requested in feature specification

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Dependencies & Configuration)

**Purpose**: Project initialization, dependency installation, and configuration changes

- [X] T001 Install next-intl package for i18n support
- [X] T002 [P] Update tailwind.config.ts to enable `darkMode: "media"`
- [X] T003 [P] Create messages/en.json with English translations
- [X] T004 [P] Create messages/zh-HK.json with Traditional Chinese translations
- [X] T005 [P] Create src/i18n.ts for i18n configuration
- [X] T006 [P] Create src/i18n/request.ts for server-side i18n
- [X] T007 [P] Create src/lib/providers.tsx modification for NextIntlClientProvider

---

## Phase 2: Schema & Legacy Cleanup (Blocking Prerequisites)

**Purpose**: Core infrastructure and schema changes that MUST be complete before user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T008 Update convex/schema.ts - remove apiToken from users, add userCategories table, update locationHistories.category type, update transactions.category type
- [X] T009 [P] Clear Convex development data (users, transactions, locationHistories tables)
- [X] T010 [P] Update convex/users.ts - remove getByApiToken, remove regenerateApiToken, add updateLanguage mutation
- [X] T011 [P] Update convex/transactions.ts - remove createFromApi mutation, update createFromWeb category type
- [X] T012 [P] Update convex/locationHistories.ts - update findNearby radius to 200m, update upsertNearby category type, add update and remove mutations
- [X] T013 [P] Update convex/http.ts - modify users.create to also create default userCategories (Restaurant, Transport)
- [X] T014 [P] Delete src/app/api/transaction/route.ts (external API endpoint)
- [X] T015 [P] Delete src/components/settings/ApiTokenDisplay.tsx
- [X] T016 [P] Update src/types/index.ts - remove CreateTransactionRequest, CreateTransactionResponse, DEFAULT_CATEGORIES, User.apiToken, Transaction.merchant, add User.lang, update Transaction.category to Id type, add UserCategory interface, update LocationHistory.category to Id type

**Checkpoint**: Schema and legacy cleanup complete - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Dark Theme Auto-Detection (Priority: P1) 🎯 MVP

**Goal**: Application automatically matches browser/OS color scheme preference without manual configuration

**Independent Test**: Can be fully tested by toggling system dark mode setting and observing the app automatically switches theme without page reload

### Implementation for User Story 1

- [X] T017 [US1] Update src/app/layout.tsx - add dark mode detection and class on html element
- [X] T018 [US1] Update src/app/globals.css - add CSS variables for dark mode colors
- [X] T019 [US1] Add dark: classes to TransactionCard.tsx
- [X] T020 [US1] Add dark: classes to TransactionList.tsx
- [X] T021 [US1] Add dark: classes to TransactionForm.tsx
- [X] T022 [US1] Add dark: classes to NavigationBar.tsx
- [X] T023 [US1] Add dark: classes to Button.tsx
- [X] T024 [US1] Add dark: classes to Card.tsx
- [X] T025 [US1] Add dark: classes to Toast.tsx
- [X] T026 [US1] Update src/app/(authenticated)/settings/page.tsx - add dark mode classes

**Checkpoint**: User Story 1 complete - dark theme should work by toggling system preference

---

## Phase 4: User Story 2 - Multi-language Support (Priority: P1)

**Goal**: Application displays content in preferred language (English or Traditional Chinese) with automatic detection

**Independent Test**: Can be fully tested by changing browser language preference and verifying all UI text displays in the correct language

### Implementation for User Story 2

- [X] T027 [US2] Create src/hooks/useLanguage.ts - language context hook with system detection, user preference persistence
- [X] T028 [US8] Update src/app/layout.tsx - add NextIntlClientProvider wrapper
- [X] T029 [US2] Update src/lib/providers.tsx - add language provider
- [X] T030 [US2] Create src/components/settings/LanguageSelect.tsx - language dropdown with system/en/zh-HK options
- [X] T031 [US2] Update src/app/(authenticated)/settings/page.tsx - add LanguageSelect component and integration
- [X] T032 [US2] Wrap settings page text with useTranslations for settings section
- [ ] T033 [US2] Wrap categories page text with useTranslations for categories section (deferred - page not created yet)
- [ ] T034 [US2] Wrap locations page text with useTranslations for locations section (deferred - page not created yet)
- [X] T035 [US2] Wrap transaction form text with useTranslations for transactions section
- [X] T036 [US2] Wrap transaction list text with useTranslations for transactions section

**Checkpoint**: User Story 2 complete - language switching should update all UI text immediately
**Note**: T033 and T034 deferred as category and location pages will be created in Phase 3/5

---

## Phase 5: User Story 3 - Custom Category Management (Priority: P1)

**Goal**: Users can create, edit, reorder, and deactivate their own spending categories with emoji icons and bilingual names

**Independent Test**: Can be fully tested by creating a new category with emoji and name, verifying it appears in the transaction form dropdown

### Backend Implementation for User Story 3

- [ ] T037 [US3] Create convex/userCategories.ts - listByUser, listActiveByUser, getById, create, update, deactivate, activate, reorder mutations

### Frontend Implementation for User Story 3

- [ ] T038 [US3] Create src/components/ui/Modal.tsx - reusable modal component with portal, backdrop close, focus trap, keyboard close
- [ ] T039 [US3] Create src/hooks/useSwipeGesture.ts - extracted swipe logic from TransactionCard
- [ ] T040 [US3] Create src/components/ui/SwipeableCard.tsx - reusable swipeable card component
- [ ] T041 [US3] Create src/components/ui/DraggableList.tsx - drag-to-reorder list component
- [ ] T042 [US3] Create src/components/ui/CategoryDropdown.tsx - custom category dropdown with emoji and localized name
- [ ] T043 [US3] Create src/components/settings/CategoryEditModal.tsx - category create/edit popup with emoji picker and name input
- [ ] T044 [US3] Create src/app/(authenticated)/settings/userCategory/page.tsx - category settings page with list, swipe-to-deactivate, drag-to-reorder
- [ ] T045 [US3] Update src/components/transactions/TransactionForm.tsx - remove merchant field, integrate CategoryDropdown, pass userCategory ID
- [ ] T046 [US3] Update src/components/transactions/CategorySelect.tsx - replace with CategoryDropdown component
- [ ] T047 [US3] Update src/types/index.ts - add UserCategory type usage

**Checkpoint**: User Story 3 complete - users can create categories, see them in transaction form, reorder and deactivate them

---

## Phase 6: User Story 4 - Location-Based Transaction Suggestions (Priority: P2)

**Goal**: Transaction form suggests nearby location histories when GPS coordinates are available, pre-filling the form with closest location details

**Independent Test**: Can be fully tested by creating a transaction at a location, then returning to the same location and verifying the form pre-fills with previous details

### Implementation for User Story 4

- [ ] T048 [US4] Create src/hooks/useNearbyLocations.ts - hook to query nearby locations within 200m radius
- [ ] T049 [US4] Create src/components/transactions/LocationHistoryDropdown.tsx - dropdown for nearby location selection sorted by distance
- [ ] T050 [US4] Update src/components/transactions/TransactionForm.tsx - add LocationHistoryDropdown when GPS coordinates exist, pre-fill form with closest location, pass selectedLocationId to upsertNearby

**Checkpoint**: User Story 4 complete - transaction form shows nearby locations and pre-fills when selected

---

## Phase 7: User Story 5 - Location History Management (Priority: P2)

**Goal**: Users can view and manage their saved location histories, updating names, amounts, and categories

**Independent Test**: Can be fully tested by navigating to Location History settings, editing a location's name, and verifying the change appears when creating a new transaction at that location

### Implementation for User Story 5

- [ ] T051 [US5] Create src/components/settings/LocationHistoryEditModal.tsx - location history edit popup with name, amount, category fields
- [ ] T052 [US5] Create src/app/(authenticated)/settings/locationHistories/page.tsx - location history settings page with list, swipe-to-delete, edit functionality

**Checkpoint**: User Story 5 complete - users can view, edit, and delete location histories

---

## Phase 8: User Story 6 - Settings Navigation Enhancement (Priority: P3)

**Goal**: Easy access to Category and Location History management from main Settings page

**Independent Test**: Can be fully tested by clicking the Category settings link and Location History settings link from the Settings page

### Implementation for User Story 6

- [ ] T053 [US6] Update src/app/(authenticated)/settings/page.tsx - add navigation links to Category Settings and Location History Settings

**Checkpoint**: User Story 6 complete - settings page has links to both management pages

---

## Phase 9: User Story 7 - Legacy Data Cleanup (Priority: P3)

**Goal**: Remove deprecated fields (apiToken from users, merchant from transactions) and external API endpoint

**Independent Test**: Can be fully tested by verifying POST /api/transaction endpoint no longer exists and transactions can be created without merchant field

### Implementation for User Story 7

- [ ] T054 [US7] Run verification: curl -X POST http://localhost:3000/api/transaction returns 404
- [ ] T055 [US7] Run verification: Users table schema has no apiToken field
- [ ] T056 [US7] Run verification: Transactions table schema has no merchant field
- [ ] T057 [US7] Run verification: Settings page has no API token section
- [ ] T058 [US7] Run verification: Transaction form has no merchant input field

**Checkpoint**: User Story 7 complete - legacy code completely removed and verified

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements, accessibility, and integration validation

- [ ] T059 [P] Update TransactionCard.tsx to use SwipeableCard component (refactor from extracted logic)
- [ ] T060 [P] Add missing dark: classes to any remaining components
- [ ] T061 [P] Add missing i18n translations to any remaining text strings
- [ ] T062 [P] Add accessibility attributes (ARIA labels, keyboard navigation) to new components
- [ ] T063 [P] Run bun run lint to verify no linting errors
- [ ] T064 [P] Run bun run build to verify production build succeeds
- [ ] T065 [P] Verify quickstart.md testing checklist items

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-9)**: All depend on Foundational phase completion
  - User stories can proceed in parallel or sequentially in priority order
- **Polish (Phase 10)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Phase 2 - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Phase 2 - No dependencies on other stories
- **User Story 3 (P1)**: Can start after Phase 2 - Depends on userCategories schema (Phase 2)
- **User Story 4 (P2)**: Can start after Phase 2 - Can run in parallel with US1, US2, US3
- **User Story 5 (P2)**: Can start after Phase 2 - Can run in parallel with US1-US4
- **User Story 6 (P3)**: Can start after Phase 2 - Depends on US3 (category page) and US5 (location page) existence
- **User Story 7 (P3)**: Can start after Phase 2 - Can run anytime, validation tasks only

### Within Each User Story

- Backend changes before frontend changes where applicable
- Reusable components (hooks, UI components) before story-specific components
- Core implementation before integration into existing pages
- Story complete before moving to next priority if sequential

### Parallel Opportunities

- All Setup tasks (T001-T007) marked [P] can run in parallel
- All Foundational tasks (T008-T016) marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel if team capacity allows
- US1 dark theme tasks (T017-T026) can run in parallel
- US2 i18n tasks (T027-T036) can run in parallel
- US3 category backend (T037) can run parallel with US1/US2 frontend tasks
- US4 location tasks (T048-T050) can run after US3 creates userCategories module
- US5 location settings tasks (T051-T052) can run after US4
- US6 settings page update (T053) depends on US3 category page and US5 location page existence
- Polish tasks (T059-T065) marked [P] can run in parallel once all stories complete

---

## Parallel Example: After Foundation Phase

```bash
# Developer A works on User Story 1 (Dark Theme)
Task T017: Update layout.tsx for dark mode detection
Task T018: Update globals.css with CSS variables
Task T019-T026: Add dark: classes to various components

# Developer B works on User Story 2 (i18n)
Task T027: Create useLanguage hook
Task T028: Update layout.tsx with NextIntlClientProvider
Task T029-T036: Wrap UI text with useTranslations

# Developer C works on User Story 3 (Categories)
Task T037: Create convex/userCategories.ts backend module
Task T038: Create Modal component
Task T039-T047: Create hooks and components for category management
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Dark Theme)
4. **STOP and VALIDATE**: Test dark theme by toggling system preference
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP with dark theme)
3. Add User Story 2 → Test independently → Deploy/Demo (now with i18n)
4. Add User Story 3 → Test independently → Deploy/Demo (now with categories)
5. Add User Story 4 → Test independently → Deploy/Demo (now with location suggestions)
6. Add User Story 5 → Test independently → Deploy/Demo (now with location management)
7. Add User Story 6 → Test independently → Deploy/Demo (now with settings navigation)
8. Add User Story 7 → Test independently → Deploy/Demo (legacy cleanup complete)

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Dark Theme)
   - Developer B: User Story 2 (i18n)
   - Developer C: User Story 3 (Categories)
3. After US3 completes, Developer C can start US4 (Location Suggestions)
4. After US4 completes, Developer C can start US5 (Location Management)
5. After US3 and US5 complete, any developer can add US6 (Settings Navigation)
6. US7 (Legacy Cleanup) can be done by any developer anytime after Phase 2

---

## Summary

- **Total Task Count**: 65 tasks
- **Task Count Per User Story**:
  - User Story 1 (Dark Theme): 10 tasks
  - User Story 2 (i18n): 10 tasks
  - User Story 3 (Categories): 11 tasks
  - User Story 4 (Location Suggestions): 3 tasks
  - User Story 5 (Location Management): 2 tasks
  - User Story 6 (Settings Navigation): 1 task
  - User Story 7 (Legacy Cleanup): 5 tasks
  - Setup Phase: 7 tasks
  - Foundational Phase: 9 tasks
  - Polish Phase: 7 tasks
- **Parallel Opportunities**: High - once foundational phase completes, all user stories can proceed in parallel
- **Independent Test Criteria**:
  - US1: Toggle system dark mode, verify app theme changes without reload
  - US2: Change browser language, verify all UI text updates
  - US3: Create category, verify it appears in transaction form dropdown
  - US4: Create transaction at location, return and verify pre-fill
  - US5: Edit location history, verify change persists in transaction
  - US6: Click settings links, verify navigation to correct pages
  - US7: Verify API endpoint returns 404 and no merchant field in UI
- **Suggested MVP Scope**: User Story 1 (Dark Theme) or User Story 2 (i18n) depending on priority. Both are P1 and can be delivered first.