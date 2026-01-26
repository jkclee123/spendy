# Research: Transaction Tracker

**Branch**: `001-transaction-tracker` | **Date**: 2026-01-26

## Technology Decisions

### 1. Next.js with Bun Runtime

**Decision**: Use Next.js 14 with App Router, running on Bun

**Rationale**:
- App Router provides built-in client-side navigation (no page reloads)
- Bun offers faster install times and runtime performance
- Server components for initial load, client components for interactivity
- Native API routes for external transaction endpoint

**Alternatives Considered**:
- Vite + React: Rejected - no built-in API routes, would need separate backend
- Remix: Rejected - less ecosystem support for Convex and PWA

**Best Practices**:
- Use `"use client"` directive only where needed
- Leverage route groups for authentication layout
- Use `next/navigation` for client-side routing

### 2. Convex Database

**Decision**: Use Convex as the primary database and backend

**Rationale**:
- Real-time data sync out of the box
- TypeScript-first with generated types
- Built-in authentication integration
- Handles complex queries with indexes
- No server management needed

**Alternatives Considered**:
- Supabase: Good real-time support but requires more setup for TypeScript types
- Firebase: More complex pricing, less TypeScript integration
- PlanetScale + Prisma: Rejected - would need separate real-time solution

**Best Practices**:
- Define schema in `convex/schema.ts`
- Use indexes for filtered queries
- Leverage optimistic updates for responsive UI

### 3. Authentication with NextAuth.js + Google OAuth

**Decision**: Use NextAuth.js v5 with Google provider only

**Rationale**:
- Native Next.js integration
- Simple Google OAuth setup
- Session management built-in
- Works with Convex authentication

**Alternatives Considered**:
- Clerk: Good UX but adds dependency and cost
- Auth0: Enterprise-focused, overkill for MVP

**Integration Pattern**:
- NextAuth handles OAuth flow
- Store user in Convex on first login
- Generate unique `apiToken` per user for external API authentication

### 4. PWA Implementation

**Decision**: Use `next-pwa` package for Progressive Web App features

**Rationale**:
- Automatic service worker generation
- Workbox integration for caching strategies
- Manifest generation helpers
- Works with Next.js App Router

**Caching Strategy**:
- Static assets: Cache-first
- API responses: Network-first with cache fallback
- Transaction list: Stale-while-revalidate

### 5. Charting Library

**Decision**: Use Recharts for data visualization

**Rationale**:
- Built specifically for React
- Responsive out of the box
- Good mobile touch support
- Lightweight bundle impact (~40KB)
- Simple API for pie charts and bar charts

**Alternatives Considered**:
- Chart.js + react-chartjs-2: More setup required
- Victory: Heavier bundle
- Tremor: Opinionated styling might conflict with Tailwind

### 6. Navigation Pattern

**Decision**: Responsive icon navigation bar (bottom on mobile, left sidebar on desktop)

**Rationale**:
- Matches user's reference design (image provided)
- Bottom navigation is thumb-friendly on mobile
- Side navigation scales better on larger screens
- Only 3 tabs keeps it minimal

**Implementation**:
- Use Tailwind's responsive classes
- `fixed bottom-0` on mobile, `fixed left-0` on desktop
- Icons: List (records), BarChart (stats), Settings (settings)
- Active state with filled icon variant

### 7. API Token Authentication

**Decision**: Generate unique UUID-based API tokens stored with user

**Rationale**:
- Simple, stateless authentication for external API
- User can regenerate if compromised
- Copy-to-clipboard for easy integration with external services

**Security**:
- Tokens stored hashed in production (MVP can use plaintext)
- HTTPS required for API endpoint
- Rate limiting recommended for production

## External API Design

### POST /api/transaction

**Authentication**: Bearer token or `apiToken` in request body

**Request Body**:
```json
{
  "category": "Food",
  "amount": 25.50,
  "paymentMethod": "Credit Card",
  "apiToken": "user-unique-token"
}
```

**Validation Rules**:
- `amount`: Required, positive number
- `category`: Optional, string (defaults to "Uncategorized")
- `paymentMethod`: Optional, string
- `apiToken`: Required, must match existing user

**Response**:
- 201: Transaction created successfully
- 400: Validation error
- 401: Invalid or missing API token
- 500: Server error

## Dependencies Summary

| Package | Version | Purpose |
|---------|---------|---------|
| next | ^14.0 | Framework |
| convex | ^1.0 | Database & backend |
| next-auth | ^5.0 | Authentication |
| next-pwa | ^5.6 | PWA support |
| recharts | ^2.10 | Charts |
| tailwindcss | ^3.4 | Styling |
| lucide-react | ^0.300 | Icons |
| vitest | ^1.0 | Unit testing |
| @testing-library/react | ^14.0 | Component testing |
| playwright | ^1.40 | E2E testing |
