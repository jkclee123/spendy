# Quickstart: Phase 2 Enhancements

**Date**: 2026-02-01  
**Feature**: Phase 2 Enhancements

This guide helps developers get started with implementing the Phase 2 features.

---

## Prerequisites

1. Node.js 18+ and bun installed
2. Convex CLI: `npm install -g convex`
3. Access to Convex dev and prod environments
4. Existing Spendy development environment set up

---

## Setup Steps

### 1. Install New Dependencies

```bash
bun add next-intl
```

### 2. Clear Existing Data

Since no backward compatibility is required, clear existing data from Convex:

```bash
# Development
npx convex data delete --table users
npx convex data delete --table transactions
npx convex data delete --table locationHistories

# Production (be careful!)
npx convex data delete --table users --prod
npx convex data delete --table transactions --prod
npx convex data delete --table locationHistories --prod
```

### 3. Update Schema

Replace `convex/schema.ts` with the new schema from `data-model.md`, then:

```bash
npx convex dev  # For development
npx convex deploy  # For production
```

### 4. Enable Tailwind Dark Mode

Update `tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "media", // Add this line
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // ... rest of config
};
```

### 5. Set Up i18n

Create translation files:

```bash
mkdir -p messages
touch messages/en.json
touch messages/zh-HK.json
```

Create i18n configuration:

```bash
touch src/i18n.ts
touch src/i18n/request.ts
```

See `contracts/component-api.md` for the Messages interface structure.

---

## Development Order

Recommended implementation order to minimize blocking dependencies:

### Phase A: Foundation (No Dependencies)

1. **Tailwind dark mode** - Add `dark:` classes to all components
2. **Remove legacy code** - Delete apiToken, merchant, and API endpoint
3. **Schema update** - Deploy new schema with userCategories table

### Phase B: Core Features

4. **Create userCategories module** - New Convex module with all mutations/queries
5. **Update users.create** - Add default category creation
6. **Create Modal component** - Reusable popup component
7. **Create SwipeableCard component** - Extract from TransactionCard

### Phase C: i18n

8. **Set up next-intl** - Provider, configuration, message files
9. **Create useLanguage hook** - Language context and persistence
10. **Translate all components** - Use `useTranslations` throughout

### Phase D: Category Management

11. **CategoryDropdown component** - Replace CategorySelect
12. **Category Settings page** - List, swipe, drag-to-reorder
13. **CategoryEditModal** - Create/edit popup

### Phase E: Location Features

14. **Update locationHistories module** - 200m radius, category ID
15. **LocationHistoryDropdown** - For transaction form
16. **Location History Settings page** - List, swipe-to-delete, edit popup
17. **Update TransactionForm** - Integrate location dropdown and pre-fill

### Phase F: Final Integration

18. **Update Settings page** - Language dropdown, navigation links
19. **Testing** - Unit and integration tests
20. **Polish** - Accessibility, error handling, loading states

---

## Key Files to Create/Modify

### New Files

```
src/
├── components/
│   ├── ui/
│   │   ├── Modal.tsx
│   │   ├── SwipeableCard.tsx
│   │   ├── DraggableList.tsx
│   │   └── CategoryDropdown.tsx
│   └── settings/
│       ├── LanguageSelect.tsx
│       ├── CategoryEditModal.tsx
│       └── LocationHistoryEditModal.tsx
├── hooks/
│   ├── useSwipeGesture.ts
│   ├── useLanguage.ts
│   └── useNearbyLocations.ts
├── app/(authenticated)/settings/
│   ├── userCategory/
│   │   └── page.tsx
│   └── locationHistories/
│       └── page.tsx
├── i18n.ts
└── i18n/
    └── request.ts

messages/
├── en.json
└── zh-HK.json

convex/
└── userCategories.ts
```

### Files to Modify

```
convex/
├── schema.ts          # New schema
├── users.ts           # Remove apiToken, add default categories
├── transactions.ts    # Remove createFromApi, update category type
└── locationHistories.ts  # Update radius, category type

src/
├── app/
│   ├── layout.tsx     # Add i18n provider
│   └── (authenticated)/settings/page.tsx  # Remove API token, add links
├── components/
│   ├── transactions/
│   │   ├── TransactionForm.tsx  # Remove merchant, add location dropdown
│   │   ├── TransactionCard.tsx  # Dark mode, use SwipeableCard
│   │   └── CategorySelect.tsx   # Replace with CategoryDropdown
│   └── settings/
│       └── ApiTokenDisplay.tsx  # DELETE THIS FILE
├── types/
│   └── index.ts       # Update interfaces
└── lib/
    └── auth.ts        # No changes needed

tailwind.config.ts     # Add darkMode: "media"
```

### Files to Delete

```
src/app/api/transaction/route.ts
src/components/settings/ApiTokenDisplay.tsx
```

---

## Testing Checklist

Before marking implementation complete:

- [ ] Dark theme: Toggle system preference, verify all pages update
- [ ] i18n: Switch language in settings, verify all text updates
- [ ] Categories: Create, edit, reorder, deactivate categories
- [ ] Transactions: Create with new category dropdown
- [ ] Locations: Pre-fill from nearby location, remember new location
- [ ] Location settings: Edit and delete location histories
- [ ] Legacy: Verify `/api/transaction` returns 404
- [ ] Legacy: Verify no apiToken or merchant fields in UI
- [ ] Accessibility: Keyboard navigation, screen reader support
- [ ] Mobile: Touch gestures work correctly

---

## Common Issues

### Issue: Convex schema mismatch

**Solution**: Clear all data and redeploy schema. Convex doesn't support migrations, so schema changes require data clearing.

### Issue: next-intl not detecting language

**Solution**: Ensure `NextIntlClientProvider` wraps the app and locale is passed correctly. Check browser language settings.

### Issue: Dark mode not working

**Solution**: Verify `darkMode: "media"` in tailwind.config.ts and `dark:` classes are added to components.

### Issue: Swipe gestures conflict with scroll

**Solution**: Ensure swipe threshold is high enough and only horizontal swipes trigger actions.

---

## Resources

- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [Tailwind Dark Mode](https://tailwindcss.com/docs/dark-mode)
- [Convex Schema](https://docs.convex.dev/database/schemas)
- [Spendy Constitution](.specify/memory/constitution.md)
