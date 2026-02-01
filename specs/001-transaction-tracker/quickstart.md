# Quickstart: Transaction Tracker

**Branch**: `001-transaction-tracker` | **Date**: 2026-01-26

## Prerequisites

- [Bun](https://bun.sh/) v1.0 or later
- [Node.js](https://nodejs.org/) v18+ (for some tooling)
- Google Cloud Console project with OAuth 2.0 credentials
- Convex account (free tier available)

## Initial Setup

### 1. Create Next.js Project

```bash
# Create new Next.js app with Bun
bun create next-app spendy --typescript --tailwind --eslint --app --src-dir

cd spendy
```

### 2. Install Dependencies

```bash
# Core dependencies
bun add convex next-auth@beta @auth/core
bun add recharts lucide-react

# PWA support
bun add next-pwa

# Development dependencies
bun add -d @types/node vitest @testing-library/react @playwright/test
```

### 3. Initialize Convex

```bash
# Login to Convex and initialize project
bunx convex dev

# This will:
# - Create convex/ directory
# - Generate _generated/ types
# - Start local development server
```

### 4. Configure Environment Variables

Create `.env.local` from the example:

```bash
cp .env.example .env.local
```

Required variables:

```env
# Convex
CONVEX_DEPLOYMENT=dev:your-deployment-name
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-generated-secret-here

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 5. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Navigate to "APIs & Services" → "Credentials"
4. Create OAuth 2.0 Client ID
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Secret to `.env.local`

### 6. Create Convex Schema

Create `convex/schema.ts`:

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    image: v.optional(v.string()),
    apiToken: v.string(),
    createdAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_apiToken", ["apiToken"]),

  transactions: defineTable({
    userId: v.id("users"),
    name: v.optional(v.string()),
    merchant: v.optional(v.string()),
    category: v.optional(v.string()),
    amount: v.number(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_createdAt", ["userId", "createdAt"]),
});
```

## Development

### Start Development Server

```bash
# Terminal 1: Start Convex dev server
bunx convex dev

# Terminal 2: Start Next.js dev server
bun dev
```

App will be available at `http://localhost:3000`

### Project Structure

```
spendy/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   ├── lib/              # Utilities and config
│   └── types/            # TypeScript types
├── convex/               # Convex backend
├── public/               # Static assets & PWA
└── tests/                # Test files
```

## Key Implementation Notes

### PWA Configuration

Add to `next.config.js`:

```javascript
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

module.exports = withPWA({
  // Next.js config
});
```

### Client-Side Routing

Use `next/navigation` for SPA-like navigation:

```typescript
import { useRouter } from "next/navigation";

// In component
const router = useRouter();
router.push("/records"); // No page reload
```

### Protected Routes

Wrap authenticated routes in a layout that checks session:

```typescript
// src/app/(authenticated)/layout.tsx
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AuthLayout({ children }) {
  const session = await auth();
  if (!session) redirect('/login');
  return <>{children}</>;
}
```

## Testing

```bash
# Run unit tests
bun test

# Run E2E tests
bun playwright test

# Run all tests
bun test:all
```

## Common Issues

### "Convex deployment not found"

- Run `bunx convex dev` to initialize/connect deployment

### "Google OAuth redirect URI mismatch"

- Ensure `http://localhost:3000/api/auth/callback/google` is in authorized URIs

### "NEXTAUTH_SECRET missing"

- Generate with: `openssl rand -base64 32`

## Resources

- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [Convex Documentation](https://docs.convex.dev/)
- [NextAuth.js v5 Docs](https://authjs.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Recharts](https://recharts.org/)
