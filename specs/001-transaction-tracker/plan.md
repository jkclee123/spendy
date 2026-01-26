# Implementation Plan: Transaction Tracker

**Branch**: `001-transaction-tracker` | **Date**: 2026-01-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-transaction-tracker/spec.md`

## Summary

Build a PWA expense tracking application using Next.js, Bun, Tailwind CSS, and Convex database. The app accepts transactions via external API (`/api/transaction`) and displays them with visualization charts. Mobile-first SPA with Google OAuth authentication and a responsive bottom/side navigation bar.

## Technical Context

**Language/Version**: TypeScript 5.x with strict mode  
**Runtime**: Bun 1.x  
**Framework**: Next.js 14 (App Router, client-side routing for SPA)  
**Primary Dependencies**: Next.js, Convex, Tailwind CSS, next-auth (Google OAuth), recharts (visualization)  
**Storage**: Convex (real-time database)  
**Testing**: Vitest + React Testing Library + Playwright  
**Target Platform**: Web (PWA) - Mobile-first, responsive  
**Project Type**: Web application (single Next.js project)  
**Performance Goals**: LCP < 2.5s, FID < 100ms, CLS < 0.1, API < 500ms p95  
**Constraints**: Offline-capable (PWA), < 200KB JS bundle gzipped, mobile touch targets 44x44px  
**Scale/Scope**: Single user MVP, ~5 screens, real-time data sync

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality & Type Safety | ✅ PASS | TypeScript strict mode, explicit types, ESLint + Prettier |
| II. Testing Standards | ✅ PASS | Contract tests for API, integration tests for auth flow, component tests |
| III. User Experience Consistency | ✅ PASS | Mobile-first design, Tailwind breakpoints, touch targets, loading states |
| IV. Performance Requirements | ✅ PASS | PWA with service worker, Convex for real-time, bundle size monitoring |
| V. Simplicity & Maintainability | ✅ PASS | Single Next.js app, minimal dependencies, YAGNI approach |

**Gate Status**: ✅ PASSED - Proceed to Phase 0

## Project Structure

### Documentation (this feature)

```text
specs/001-transaction-tracker/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (API schemas)
│   └── transaction-api.yaml
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── app/                      # Next.js App Router
│   ├── layout.tsx            # Root layout with auth provider
│   ├── page.tsx              # Redirect to /records or /login
│   ├── login/
│   │   └── page.tsx          # Google OAuth login page
│   ├── (authenticated)/      # Route group for protected pages
│   │   ├── layout.tsx        # Layout with navigation bar
│   │   ├── records/
│   │   │   └── page.tsx      # Transaction list view
│   │   ├── stats/
│   │   │   └── page.tsx      # Charts and graphs
│   │   └── settings/
│   │       └── page.tsx      # User settings & API token
│   └── api/
│       ├── auth/[...nextauth]/
│       │   └── route.ts      # NextAuth.js handlers
│       └── transaction/
│           └── route.ts      # External transaction API endpoint
├── components/
│   ├── ui/                   # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Header.tsx        # App header with "Spendy" title
│   │   └── LoadingSpinner.tsx
│   ├── navigation/
│   │   └── NavigationBar.tsx # Responsive bottom/side nav
│   ├── records/
│   │   └── TransactionList.tsx
│   ├── stats/
│   │   ├── CategoryPieChart.tsx
│   │   └── MonthlyHistogram.tsx
│   └── settings/
│       └── ApiTokenDisplay.tsx
├── convex/                   # Convex backend
│   ├── _generated/           # Auto-generated types
│   ├── schema.ts             # Database schema
│   ├── transactions.ts       # Transaction queries/mutations
│   └── users.ts              # User queries/mutations
├── lib/
│   ├── auth.ts               # NextAuth configuration
│   └── convex.ts             # Convex client setup
└── types/
    └── index.ts              # Shared TypeScript types

public/
├── manifest.json             # PWA manifest
├── sw.js                     # Service worker
└── icons/                    # PWA icons

tests/
├── contract/
│   └── transaction-api.test.ts
├── integration/
│   └── auth-flow.test.ts
└── unit/
    └── components/
```

**Structure Decision**: Single Next.js application with Convex as backend-as-a-service. The App Router provides both the SPA pages and the API endpoint for external transactions. Convex handles real-time data sync and eliminates the need for a separate backend.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |

## Key Design Decisions

1. **Convex over traditional backend**: Provides real-time sync out of the box, TypeScript-first, eliminates need for separate API layer for internal operations
2. **Next.js App Router**: Enables client-side routing while keeping `/api/transaction` as server-side for external requests
3. **NextAuth.js**: Standard OAuth solution for Next.js with Google provider
4. **recharts**: Lightweight, React-native charting library with good mobile support
5. **PWA via next-pwa**: Handles service worker generation and caching strategies
