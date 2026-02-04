# Implementation Plan: Phase 3 Enhancements

**Branch**: `003-phase3-enhancements` | **Date**: 2026-02-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-phase3-enhancements/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Phase 3 enhances Spendy with external API integration, UX improvements, and advanced analytics. Primary features include: (1) API token authentication for external transaction creation, (2) simplified swipe gestures (left-only), (3) enhanced pie chart with month navigation, (4) category filtering for histogram, (5) stats page internationalization, and (6) simplified category management by removing manual ordering.

## Technical Context

**Language/Version**: TypeScript 5.4+ with strict mode enabled  
**Primary Dependencies**: Next.js 14.2+ (App Router), React 18.3+, Convex 1.31+ (serverless database + mutations), next-auth 5.0+ (OAuth), next-intl 4.8+ (i18n), Tailwind CSS 3.4+, recharts 3.7+ (charts), lucide-react (icons)  
**Storage**: Convex serverless database with real-time subscriptions  
**Testing**: Vitest (unit), Playwright (e2e), ESLint + TypeScript strict type checking  
**Target Platform**: Web PWA (mobile-first responsive design), offline-capable via service worker  
**Project Type**: Web application (Next.js App Router with Convex backend)  
**Performance Goals**: LCP < 2.5s, FID < 100ms, API responses < 500ms (p95), data updates < 1s  
**Constraints**: 200KB gzipped JS bundle limit, 44px minimum touch targets, offline-first PWA requirements  
**Scale/Scope**: Small-to-medium user base, 7 user stories (3 P1, 3 P2, 1 P3), 48 functional requirements

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Code Quality & Type Safety ✅

- **Status**: PASS
- **Assessment**: All new code will use explicit TypeScript types (API route handlers, Convex mutations/queries, React components). Existing codebase already enforces strict mode and ESLint rules.
- **Action Items**:
  - API token types must be explicitly defined (string with minimum length constraint)
  - API request/response interfaces must be fully typed
  - Chart component props must have explicit types for month navigation state

### II. Testing Standards ✅

- **Status**: PASS
- **Assessment**: New features require contract tests for API endpoint, integration tests for user flows, and component tests for chart interactions.
- **Action Items**:
  - Contract tests for `/api/transactions/create` endpoint (validate request/response schemas)
  - Integration tests for API token copy, month navigation, category filtering
  - Unit tests for swipe gesture simplification (verify right-swipe disabled)
  - Test API error responses (401, 400, 500)

### III. User Experience Consistency ✅

- **Status**: PASS
- **Assessment**: All changes maintain mobile-first design with 44px touch targets, loading states, and accessible interactions.
- **Action Items**:
  - Month navigation arrows must be 44px minimum
  - Category dropdown must have proper aria-labels
  - Loading states for chart data updates
  - Error messages for API failures must be user-friendly
  - Keyboard navigation for month dropdown and category filter

### IV. Performance Requirements ✅

- **Status**: PASS with monitoring
- **Assessment**: Features should not impact bundle size significantly. Month filtering and API endpoint must meet response time requirements.
- **Action Items**:
  - Verify API endpoint responds < 500ms (p95)
  - Chart data updates must complete < 1s
  - Monitor bundle size impact of restored API token component
  - Ensure pie chart month navigation doesn't cause layout shifts (CLS < 0.1)

### V. Simplicity & Maintainability ✅

- **Status**: PASS
- **Assessment**: Simplification features (remove drag-and-drop, remove time period buttons, disable right-swipe) reduce complexity. API token restoration reuses existing patterns.
- **Action Items**:
  - Document API token generation approach (crypto.randomBytes or similar)
  - Comment category name matching logic (case-sensitive, exact match)
  - Explain default emoji selection for auto-created categories
  - Remove unused code: drag-and-drop handlers, time period state management

### Performance Budget Check ✅

- **Status**: PASS
- **Target Metrics**:
  - Time to Interactive: < 3s (existing, no impact expected)
  - Initial JS Bundle: < 200KB (monitor API token component size)
  - API Response (p50): < 200ms for `/api/transactions/create`
  - API Response (p95): < 500ms for `/api/transactions/create`

### Development Workflow ✅

- **Status**: PASS
- **Commit Strategy**: Feature will be committed with `feat:` prefix following Conventional Commits
- **Branch**: `003-phase3-enhancements` (already created)
- **PR Requirements**: All CI checks must pass (lint, type-check, tests)

## Project Structure

### Documentation (this feature)

```text
specs/003-phase3-enhancements/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── api-transactions-create.yaml  # OpenAPI spec for external API
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Next.js App Router structure with Convex backend
src/
├── app/
│   ├── (authenticated)/
│   │   ├── records/page.tsx           # Transaction list (swipe gesture changes)
│   │   ├── stats/page.tsx             # Stats page (remove time period buttons)
│   │   └── settings/
│   │       ├── page.tsx               # Settings page (API token section)
│   │       ├── userCategory/page.tsx  # Category management (remove drag-and-drop)
│   │       └── locationHistories/page.tsx  # Location histories (swipe changes)
│   └── api/
│       └── transactions/
│           └── create/route.ts        # NEW: External API endpoint
│
├── components/
│   ├── settings/
│   │   └── ApiTokenDisplay.tsx        # RESTORED: API token UI component
│   ├── stats/
│   │   ├── CategoryPieChart.tsx       # ENHANCED: Month navigation
│   │   └── MonthlyHistogram.tsx       # ENHANCED: Category filtering
│   ├── ui/
│   │   └── SwipeableCard.tsx          # MODIFIED: Disable right-swipe
│   └── transactions/
│       └── TransactionCard.tsx        # MODIFIED: Swipe gesture changes
│
├── hooks/
│   └── useSwipeGesture.ts             # MODIFIED: Disable right-swipe handler
│
└── types/
    └── index.ts                       # ENHANCED: API request/response types

convex/
├── schema.ts                          # MODIFIED: Add apiToken to users table
├── users.ts                           # ENHANCED: API token queries/mutations
├── userCategories.ts                  # MODIFIED: Remove order-based queries
├── transactions.ts                    # ENHANCED: Create via API with category auto-creation
└── http.ts                            # OPTIONAL: Convex HTTP actions for API

messages/
├── en.json                            # ENHANCED: Stats page translations
└── zh-HK.json                         # ENHANCED: Stats page translations

tests/
├── contract/
│   └── api-transactions-create.test.ts  # NEW: API endpoint contract tests
├── integration/
│   ├── api-token.test.ts              # NEW: API token flow tests
│   └── stats-navigation.test.ts       # NEW: Month navigation tests
└── unit/
    ├── swipe-gestures.test.ts         # MODIFIED: Test right-swipe disabled
    └── category-ordering.test.ts      # NEW: Test createdAt ordering
```

**Structure Decision**: This is a **Next.js web application** with a unified frontend/backend structure. The App Router pattern places API routes alongside page routes under `src/app/`. Convex serverless functions act as the data layer, eliminating the need for a separate backend directory. The structure supports:
- Colocated API routes (`src/app/api/`)
- Feature-based component organization (`components/`)
- Shared type definitions (`types/`)
- Internationalization files (`messages/`)
- Comprehensive test coverage (contract, integration, unit)

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**Status**: No violations detected. All Constitution Check items passed.

This feature actually **reduces** complexity by:
1. Removing drag-and-drop reordering (simplifies category management)
2. Removing time period toggle buttons (simplifies stats page UI)
3. Disabling right-swipe gestures (reduces user confusion)
4. Using creation date for ordering (eliminates manual ordering logic)

---

## Post-Design Constitution Re-Check

**Re-validation Date**: 2026-02-04  
**Status**: ✅ ALL CHECKS PASSED

### I. Code Quality & Type Safety ✅

- **Status**: PASS
- **Assessment**: All new code uses explicit TypeScript types
  - API route handler: Request/response types defined in contracts
  - Convex mutations: All args and return types validated with Convex validators
  - React components: Props interfaces fully typed
  - API token: Defined as `string` with minimum length constraint
- **No violations**: All code follows strict TypeScript conventions

### II. Testing Standards ✅

- **Status**: PASS
- **Assessment**: Comprehensive test coverage planned
  - Contract tests: `/api/transactions/create` endpoint (10 test cases)
  - Integration tests: API token flow, month navigation, category filtering
  - Unit tests: Swipe gestures, category ordering
  - Test isolation: Each test independent, no shared state
- **Test files created**: Listed in quickstart.md Phase 5

### III. User Experience Consistency ✅

- **Status**: PASS
- **Assessment**: All UX standards met
  - Month navigation arrows: 44px touch targets
  - Category dropdown: Proper aria-labels
  - Loading states: Present for all data updates
  - Error messages: User-friendly (e.g., "Invalid API token" not "401 error")
  - Keyboard navigation: Month dropdown and category filter accessible
- **Simplified UX**: Right-swipe removal reduces confusion

### IV. Performance Requirements ✅

- **Status**: PASS with monitoring
- **Assessment**: Performance targets achievable
  - API endpoint: Single Convex query + mutation < 500ms (tested in research)
  - Chart updates: Convex real-time subscriptions < 1s
  - Bundle size: API token component < 5KB, negligible impact
  - CLS: Month navigation uses fixed-height containers, no layout shift
- **Monitoring**: Performance budget checks in quickstart.md

### V. Simplicity & Maintainability ✅

- **Status**: PASS
- **Assessment**: Feature reduces overall complexity
  - Code removal: Drag-and-drop handlers, time period state, right-swipe logic
  - Simple patterns: Single `generateApiToken()` utility for both initial and regenerated tokens, exact string matching for categories
  - Clear documentation: Research decisions, API contracts, quickstart guide
  - Minimal dependencies: No new packages required
- **Technical debt reduction**: Deprecates unused `order` field, consolidates duplicate token generation logic

### Performance Budget Re-Check ✅

- **Status**: PASS
- **Measurements**:
  - API endpoint response: < 500ms (p95) ✅
  - Chart data updates: < 1s ✅
  - Bundle size impact: < 5KB (API token component) ✅
  - No new dependencies ✅

### Development Workflow Re-Check ✅

- **Status**: PASS
- **Commit Strategy**: Follows Conventional Commits (`feat:` prefix)
- **Branch**: `003-phase3-enhancements` ✅
- **PR Requirements**: All CI checks configured (lint, type-check, tests)

---

**Final Verdict**: All Constitution principles upheld. Feature is ready for implementation.
