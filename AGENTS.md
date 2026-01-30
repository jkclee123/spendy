# Spendy Development Guidelines

Agentic coding guide for the Spendy transaction tracking application.

## Technology Stack

- **Framework**: Next.js 14.2+ with App Router
- **Language**: TypeScript 5.4+ (strict mode enabled)
- **Backend**: Convex (serverless database + functions)
- **Auth**: next-auth with Google OAuth
- **Styling**: Tailwind CSS 3.4+
- **Testing**: Vitest (unit), Playwright (e2e)
- **Icons**: lucide-react
- **Charts**: recharts

## Commands

```bash
# Development
bun run dev              # Start Next.js dev server

# Build & Deploy
bun run build            # Production build
bun start                # Start production server

# Code Quality
bun run lint             # Run ESLint
bun run test             # Run all Vitest tests
bun run test src/components/ui/Button.test.tsx   # Run single test file
bun run test:e2e         # Run Playwright e2e tests
```

## Code Style Guidelines

### TypeScript

- **Strict mode enabled**: No implicit any, strict null checks
- **No explicit any**: Use `@typescript-eslint/no-explicit-any: error`
- **No unused vars**: Use `@typescript-eslint/no-unused-vars: error`
- **Prefer const**: Use `prefer-const: error`
- **Console warnings**: Use `no-console: warn` (avoid console.log in production)

### Imports

Order imports in this sequence:
1. React imports
2. Next.js imports
3. Third-party libraries (convex, next-auth, date-fns, lucide-react, etc.)
4. Absolute path aliases (`@/components`, `@/types`, `@/lib`)
5. Relative imports (siblings, parents)
6. CSS imports last

Example:
```typescript
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation } from "convex/react";
import { useSession } from "next-auth/react";
import { formatDistanceToNow } from "date-fns";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import type { Transaction } from "@/types";
import { TransactionCard } from "./TransactionCard";
import "./styles.css";
```

### Formatting (Prettier)

- Semicolons: enabled
- Single quotes: disabled (use double quotes)
- Tab width: 2 spaces
- Trailing commas: ES5 compatible
- Print width: 100 characters
- Arrow parens: always (e.g., `(x) => x` not `x => x`)
- End of line: LF

### Naming Conventions

- **Components**: PascalCase (e.g., `TransactionFilters.tsx`)
- **Functions**: camelCase (e.g., `handleCategoryChange`)
- **Interfaces/Types**: PascalCase with descriptive names (e.g., `TransactionFiltersState`)
- **Constants**: UPPER_SNAKE_CASE or camelCase for exports (e.g., `DEFAULT_CATEGORIES`)
- **Files**: PascalCase for components, camelCase for utilities
- **Props interfaces**: Suffix with `Props` (e.g., `TransactionFiltersProps`)

### Component Structure

- Use `"use client"` directive for client components
- Export interfaces that are reused (e.g., `TransactionFiltersState`)
- Keep internal interfaces private (not exported)
- Use JSDoc for component descriptions
- Use `forwardRef` for components that need ref forwarding

Example:
```typescript
"use client";

export interface ButtonProps {
  variant?: "primary" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

/**
 * Primary button component with variants
 */
export function Button({ variant = "primary", size = "md", children }: ButtonProps) {
  // Implementation
}
```

### Error Handling

- Use try-catch for async operations
- Show user-friendly error messages via toast notifications
- Log errors appropriately (use console.error for debugging)
- Validate inputs early and throw descriptive errors

Example:
```typescript
const handleSubmit = useCallback(async () => {
  try {
    await mutation({ data });
    showToast("Success!", "success");
  } catch (error) {
    showToast("Failed to save", "error");
    console.error("Mutation failed:", error);
  }
}, [mutation, showToast]);
```

### Convex Backend

- Use validators from `convex/values` for type safety
- Export functions using `query()` and `mutation()` wrappers
- Use JSDoc for function descriptions
- Throw descriptive errors for validation failures
- Use indexes for efficient queries

Example:
```typescript
export const createFromWeb = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    if (args.amount <= 0) {
      throw new Error("Amount must be positive");
    }
    return await ctx.db.insert("transactions", { ...args, createdAt: Date.now() });
  },
});
```

### Styling (Tailwind)

- Use semantic color names from Tailwind palette
- Mobile-first responsive design
- Minimum touch target: 44px (`min-h-[44px]`)
- Use `rounded-xl` for card-like elements
- Spacing: 4px base unit (e.g., `p-4`, `gap-2`)
- Ensure sufficient color contrast (WCAG AA)

### Accessibility

- All inputs must have associated labels with `htmlFor`
- Use proper button types (`type="button"` vs `type="submit"`)
- Include aria-labels for icon-only buttons
- Support keyboard navigation
- Maintain focus indicators

## Project Structure

```
src/
  app/                    # Next.js App Router
    (authenticated)/      # Route groups for auth
      records/
      stats/
      settings/
    login/
    layout.tsx           # Root layout
  components/
    records/             # Domain-specific components
    ui/                  # Generic UI components
    stats/               # Stats page components
    navigation/          # Navigation components
    settings/            # Settings components
  lib/                   # Utilities and providers
  types/                 # Shared TypeScript types
convex/                  # Backend functions
  transactions.ts
  users.ts
  schema.ts
```

## Cursor Rules (Auto-generated)

Located in `.cursor/rules/specify-rules.mdc`:
- Follow TypeScript strict mode conventions
- Run `bun test && bun run lint` before committing
- Last updated: 2026-01-30

## Important Notes

- **No explicit any allowed**: Always define proper types
- **Run lint after changes**: `bun run lint` is required
- **PWA enabled**: App uses next-pwa for offline support
- **Convex generated files**: Located in `convex/_generated/`, do not edit manually
- **Auth protected routes**: Use `(authenticated)` route group
- **API token auth**: External API uses token-based auth (not session-based)
