# Implementation Plan: Phase 2 Enhancements

**Branch**: `002-phase2-enhancements` | **Date**: 2026-02-01 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/002-phase2-enhancements/spec.md`

## Summary

Phase 2 enhances Spendy with dark theme support (automatic, follows browser), internationalization (English and Traditional Chinese), custom user-defined categories with emoji icons, improved location-based transaction suggestions, and removal of deprecated API token and merchant functionality. The implementation uses `next-intl` for i18n, Tailwind's built-in dark mode classes, and extracts existing swipe gesture logic into reusable hooks.

## Technical Context

**Language/Version**: TypeScript 5.4+, Node.js 18+  
**Primary Dependencies**: Next.js 14.2+, React 18.3+, Convex 1.31+, next-intl 3.x (new), Tailwind CSS 3.4+  
**Storage**: Convex (serverless database)  
**Testing**: Vitest (unit), Playwright (e2e)  
**Target Platform**: Web (PWA), iOS/Android via browser  
**Project Type**: Web application (Next.js App Router + Convex backend)  
**Performance Goals**: <100ms theme transitions, <500ms category reorder, <1s location suggestions  
**Constraints**: <200KB JS bundle, offline-capable (PWA), mobile-first  
**Scale/Scope**: Single-user expense tracking, ~10 screens

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### I. Code Quality & Type Safety

| Principle                 | Status | Notes                                   |
| ------------------------- | ------ | --------------------------------------- |
| Explicit TypeScript types | PASS   | All new interfaces defined in contracts |
| No type assertions        | PASS   | No `as` casts planned                   |
| Strict mode               | PASS   | Already enabled                         |
| ESLint enforcement        | PASS   | Will run lint before commits            |
| Prettier formatting       | PASS   | Already configured                      |

### II. Testing Standards

| Principle               | Status | Notes                                       |
| ----------------------- | ------ | ------------------------------------------- |
| Contract tests for APIs | PASS   | Convex mutations/queries to be tested       |
| Integration tests       | PASS   | User journeys for category management, i18n |
| Component tests         | PASS   | New UI components will have unit tests      |
| Test isolation          | PASS   | Each test independent                       |
| Test naming             | PASS   | Will follow "should...when" format          |

### III. User Experience Consistency

| Principle              | Status | Notes                               |
| ---------------------- | ------ | ----------------------------------- |
| Mobile-first design    | PASS   | All new pages mobile-first          |
| Responsive breakpoints | PASS   | Using Tailwind standard breakpoints |
| Touch targets 44x44px  | PASS   | Existing pattern followed           |
| Loading states         | PASS   | Spinners for all async operations   |
| Error handling         | PASS   | Toast notifications for errors      |
| Accessibility          | PASS   | Keyboard nav, ARIA labels planned   |

### IV. Performance Requirements

| Principle                | Status | Notes                                 |
| ------------------------ | ------ | ------------------------------------- |
| LCP < 2.5s               | PASS   | No heavy new dependencies             |
| FID < 100ms              | PASS   | Gesture handlers optimized            |
| CLS < 0.1                | PASS   | No layout shifts planned              |
| Bundle < 200KB           | PASS   | next-intl is lightweight (~15KB)      |
| API response < 500ms p95 | PASS   | Convex queries optimized with indexes |
| Offline capability       | PASS   | PWA already configured                |

### V. Simplicity & Maintainability

| Principle                 | Status | Notes                                      |
| ------------------------- | ------ | ------------------------------------------ |
| YAGNI                     | PASS   | Only building specified features           |
| Single responsibility     | PASS   | Each component/hook has one purpose        |
| Dependency minimization   | PASS   | Only adding next-intl (justified for i18n) |
| No premature optimization | PASS   | No over-engineering                        |
| Documentation             | PASS   | Complex logic will be documented           |

**Constitution Check Result**: ALL GATES PASS

## Project Structure

### Documentation (this feature)

```text
specs/002-phase2-enhancements/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Technology decisions
├── data-model.md        # Entity definitions
├── quickstart.md        # Developer guide
├── contracts/           # API contracts
│   ├── convex-api.md    # Convex mutations/queries
│   └── component-api.md # React component interfaces
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Implementation tasks (created by /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── layout.tsx                          # Root layout (add i18n provider)
│   ├── globals.css                         # Global styles (dark mode CSS vars)
│   └── (authenticated)/
│       ├── transactions/page.tsx           # Transaction list
│       ├── records/page.tsx                # Records page
│       ├── stats/page.tsx                  # Stats page
│       └── settings/
│           ├── page.tsx                    # Main settings (modified)
│           ├── userCategory/
│           │   └── page.tsx                # NEW: Category management
│           └── locationHistories/
│               └── page.tsx                # NEW: Location history management
├── components/
│   ├── ui/
│   │   ├── Button.tsx                      # Existing (add dark mode)
│   │   ├── Card.tsx                        # Existing (add dark mode)
│   │   ├── Toast.tsx                       # Existing (add dark mode)
│   │   ├── Modal.tsx                       # NEW: Reusable modal
│   │   ├── SwipeableCard.tsx               # NEW: Extracted swipe component
│   │   ├── DraggableList.tsx               # NEW: Drag-to-reorder list
│   │   └── CategoryDropdown.tsx            # NEW: Custom category dropdown
│   ├── transactions/
│   │   ├── TransactionForm.tsx             # Modified (remove merchant, add location)
│   │   ├── TransactionCard.tsx             # Modified (use SwipeableCard)
│   │   ├── TransactionList.tsx             # Modified (dark mode)
│   │   ├── LocationHistoryDropdown.tsx     # NEW: Location selection
│   │   └── CategorySelect.tsx              # DEPRECATED: Replace with CategoryDropdown
│   ├── settings/
│   │   ├── LanguageSelect.tsx              # NEW: Language dropdown
│   │   ├── CategoryEditModal.tsx           # NEW: Category create/edit popup
│   │   ├── LocationHistoryEditModal.tsx    # NEW: Location edit popup
│   │   └── ApiTokenDisplay.tsx             # DELETE: No longer needed
│   └── navigation/
│       └── BottomNav.tsx                   # Existing (add dark mode)
├── hooks/
│   ├── useSwipeGesture.ts                  # NEW: Extracted swipe logic
│   ├── useLanguage.ts                      # NEW: Language context hook
│   └── useNearbyLocations.ts               # NEW: Location query hook
├── lib/
│   ├── auth.ts                             # Existing (no changes)
│   └── providers.tsx                       # Existing (add i18n provider)
├── types/
│   └── index.ts                            # Modified (update interfaces)
├── i18n.ts                                 # NEW: i18n configuration
└── i18n/
    └── request.ts                          # NEW: Server-side i18n

messages/
├── en.json                                 # NEW: English translations
└── zh-TW.json                              # NEW: Traditional Chinese translations

convex/
├── schema.ts                               # Modified (new schema)
├── users.ts                                # Modified (remove apiToken, add lang)
├── transactions.ts                         # Modified (remove createFromApi, merchant)
├── locationHistories.ts                    # Modified (200m radius, category ID)
├── userCategories.ts                       # NEW: Category CRUD
└── http.ts                                 # Modified (update user sync for defaults)

tests/
├── unit/
│   ├── hooks/                              # NEW: Hook tests
│   └── components/                         # NEW: Component tests
└── e2e/
    ├── categories.spec.ts                  # NEW: Category management tests
    └── i18n.spec.ts                        # NEW: Language switching tests
```

**Structure Decision**: Web application using Next.js App Router with Convex serverless backend. All frontend code in `src/`, backend in `convex/`, tests in `tests/`. Follows existing project structure with additions for new features.

## Complexity Tracking

> No Constitution Check violations. All features use standard patterns with minimal new dependencies.

| Decision                             | Rationale                                    | Alternative Considered                     |
| ------------------------------------ | -------------------------------------------- | ------------------------------------------ |
| Add next-intl                        | Needed for i18n, lightweight, Next.js native | Custom solution would reinvent the wheel   |
| Extract swipe hook                   | Reuse existing tested logic                  | Adding gesture library is heavier          |
| Store category ID in locationHistory | Data integrity                               | String storage loses referential integrity |

## Related Documents

- [Research Decisions](./research.md) - Technology choices and rationale
- [Data Model](./data-model.md) - Schema definitions
- [Convex API Contracts](./contracts/convex-api.md) - Backend API specs
- [Component API Contracts](./contracts/component-api.md) - Frontend component specs
- [Quickstart Guide](./quickstart.md) - Developer onboarding

## Post-Design Constitution Re-Check

Performed after Phase 1 design completion.

| Principle      | Status | Notes                                              |
| -------------- | ------ | -------------------------------------------------- |
| Type safety    | PASS   | All contracts have TypeScript interfaces           |
| Testing        | PASS   | Test locations defined in structure                |
| UX consistency | PASS   | Reusing existing patterns (TransactionCard, Toast) |
| Performance    | PASS   | No heavy dependencies, optimized queries           |
| Simplicity     | PASS   | Single responsibility maintained                   |

**Final Status**: Ready for `/speckit.tasks`
