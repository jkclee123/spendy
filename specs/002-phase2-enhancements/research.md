# Research: Phase 2 Enhancements

**Date**: 2026-02-01  
**Feature**: Phase 2 Enhancements (Dark Theme, i18n, UserCategory, Location History Updates)

## Summary

This document captures technology decisions and research findings for the Phase 2 enhancements.

---

## 1. Internationalization (i18n)

### Decision: next-intl

**Rationale**:
- Native support for Next.js 14 App Router
- Server-side rendering support for SEO
- Type-safe translations with TypeScript
- Lightweight compared to react-i18next
- Built-in support for locale detection from `navigator.language`
- Active maintenance and good documentation

**Alternatives Considered**:

| Alternative | Reason Rejected |
|-------------|-----------------|
| react-i18next | Heavier bundle, more complex setup for App Router |
| Custom solution | More manual work, no SSR support, reinventing the wheel |
| next-translate | Less active maintenance, fewer features |

**Implementation Approach**:
1. Add `next-intl` package
2. Create `/messages/en.json` and `/messages/zh-HK.json` translation files
3. Create `i18n.ts` configuration with locale detection
4. Wrap app in `NextIntlClientProvider`
5. Use `useTranslations` hook in components
6. Store user preference in `user.lang` field (values: `"system"`, `"en"`, `"zh-HK"`)

**Browser Language Detection Logic**:
```
if user.lang === "system" || user.lang is empty:
  browserLang = navigator.language
  if browserLang starts with "zh":
    use "zh-HK"
  else:
    use "en"
else:
  use user.lang
```

---

## 2. Dark Theme Implementation

### Decision: Tailwind `dark:` Classes

**Rationale**:
- Tailwind CSS already installed and configured
- Explicit control over each component's dark appearance
- No need for extensive CSS variable system
- Works with `prefers-color-scheme` media query out of the box
- Easier to maintain and debug (co-located with components)

**Alternatives Considered**:

| Alternative | Reason Rejected |
|-------------|-----------------|
| CSS variables only | Requires more CSS changes, less explicit control |
| Theme provider library | Adds complexity, not needed for system-only theme |

**Implementation Approach**:
1. Enable `darkMode: 'media'` in `tailwind.config.ts` (uses `prefers-color-scheme`)
2. Add `dark:` variants to all components
3. No manual theme toggle needed (follows system automatically)
4. Ensure CSS variables in `globals.css` work as fallback for base styles

**Key Color Mappings**:
| Element | Light | Dark |
|---------|-------|------|
| Background | white / gray-50 | gray-900 / gray-800 |
| Text primary | gray-900 | gray-100 |
| Text secondary | gray-500 | gray-400 |
| Border | gray-200 / gray-300 | gray-700 / gray-600 |
| Card background | gray-50 | gray-800 |
| Primary action | blue-500 | blue-400 |
| Destructive | red-500 | red-400 |

---

## 3. Gesture Handling (Swipe & Drag)

### Decision: Extract Existing Pattern + Custom Drag-to-Reorder

**Rationale**:
- `TransactionCard.tsx` already has working swipe-to-delete implementation
- No additional dependencies needed
- Consistent UX across all list components
- Drag-to-reorder can use native HTML5 drag-and-drop with touch polyfill

**Alternatives Considered**:

| Alternative | Reason Rejected |
|-------------|-----------------|
| @use-gesture/react | Adds dependency for features we can build |
| dnd-kit | Overkill for simple reorder within a single list |
| react-beautiful-dnd | Deprecated, not maintained |

**Implementation Approach**:
1. Extract swipe logic from `TransactionCard.tsx` into `useSwipeGesture` hook
2. Create `SwipeableCard` component that wraps content with swipe behavior
3. For drag-to-reorder: use `draggable` attribute + touch events
4. Create `useDragReorder` hook for list reordering
5. Auto-save on drop (no save button needed)

**Swipe Actions by Page**:
| Page | Swipe Left Action |
|------|-------------------|
| Transactions | Delete (existing) |
| Categories | Deactivate |
| Location Histories | Delete |

---

## 4. Category-Location Relationship

### Decision: Store userCategory ID in locationHistory.category

**Rationale**:
- Maintains referential integrity between entities
- Category emoji/name changes automatically reflect in location history display
- Consistent with the transaction.category field migration
- Enables proper foreign key relationships in queries

**Alternatives Considered**:

| Alternative | Reason Rejected |
|-------------|-----------------|
| Keep string category | No referential integrity, stale data when category renamed |
| Denormalize (store both) | Data duplication, sync issues |

**Implementation Approach**:
1. Change `locationHistories.category` from `v.optional(v.string())` to `v.optional(v.id("userCategories"))`
2. Update `findNearby` query to join with userCategories for display
3. Update `upsertNearby` mutation to accept userCategory ID
4. Update transaction form to pass userCategory ID instead of string

**Note**: Since no backward compatibility is required, existing locationHistories can be cleared.

---

## 5. Category Name Input UX

### Decision: Single Input with Smart-Save Logic

**Rationale**:
- Simpler user experience - one field to fill
- Matches the spec requirement exactly
- Most users will use the same name in both languages initially
- Power users can edit in different language context to set different names

**Alternatives Considered**:

| Alternative | Reason Rejected |
|-------------|-----------------|
| Two separate inputs | Complex UI, confusing for most users |
| Tab-based language switching | Adds complexity without clear benefit |

**Implementation Approach**:
1. Single "Name" input field in category create/edit popup
2. On save:
   - If both `en_name` AND `zh_name` are empty/null: save to both
   - If either has a value: save only to current display language field
3. Display shows the localized name based on current language
4. User can switch app language and edit to set different name

**Save Logic Pseudocode**:
```typescript
function saveCategoryName(
  category: UserCategory,
  newName: string,
  currentLang: "en" | "zh-HK"
) {
  if (!category.en_name && !category.zh_name) {
    // Both empty - save to both
    return { en_name: newName, zh_name: newName };
  } else {
    // One has value - save only to current language
    if (currentLang === "en") {
      return { en_name: newName };
    } else {
      return { zh_name: newName };
    }
  }
}
```

---

## 6. Popup/Modal Component

### Decision: Create New Modal Component

**Rationale**:
- No existing modal component in codebase
- Needed for category create/edit and location history edit
- Should follow existing UI patterns (rounded-xl, consistent spacing)

**Implementation Approach**:
1. Create `Modal` component in `src/components/ui/Modal.tsx`
2. Use portal to render at document root
3. Support backdrop click to close
4. Trap focus for accessibility
5. Support keyboard close (Escape key)
6. Animate in/out with CSS transitions

---

## 7. Location History Query Optimization

### Decision: Expand Radius to 200m (was 100m)

**Rationale**:
- Spec requires 200m radius for location suggestions
- Current `findNearby` uses 100m default
- Need to update both the query and the form logic

**Changes Required**:
1. Update `findNearby` default radius from 100m to 200m
2. Update `upsertNearby` radius check from 100m to 200m
3. Remove category matching constraint in `upsertNearby` (spec says "does not need to match category")
4. Return all results within radius, sorted by distance

---

## 8. Default Categories

### Decision: Create in User Registration Flow

**Rationale**:
- Spec requires 2 default categories for new users
- User creation happens in `convex/http.ts` via `api.users.create`
- Should create categories atomically with user creation

**Default Categories**:
| Order | Emoji | en_name | zh_name |
|-------|-------|---------|---------|
| 0 | 🍗 | Restaurant | 食飯 |
| 1 | 🚃 | Transport | 搭車 |

**Implementation Approach**:
1. Modify `users.create` mutation to also create default userCategories
2. Use transaction to ensure atomicity
3. Only create defaults for NEW users (not existing)

---

## Dependencies to Add

| Package | Version | Purpose |
|---------|---------|---------|
| next-intl | ^3.x | Internationalization |

No other new dependencies required.

---

## Files to Remove (Legacy Cleanup)

| File/Code | Reason |
|-----------|--------|
| `src/app/api/transaction/route.ts` | Remove entire file (external API) |
| `src/components/settings/ApiTokenDisplay.tsx` | Remove entire file |
| `convex/users.ts` - `getByApiToken` | Remove query |
| `convex/users.ts` - `regenerateApiToken` | Remove mutation |
| `convex/transactions.ts` - `createFromApi` | Remove mutation |
| `src/types/index.ts` - `CreateTransactionRequest` | Remove interface |
| `src/types/index.ts` - `CreateTransactionResponse` | Remove interface |
| `src/types/index.ts` - `User.apiToken` | Remove field |
| `src/types/index.ts` - `Transaction.merchant` | Remove field |
| `src/types/index.ts` - `DEFAULT_CATEGORIES` | Remove constant |

---

## Schema Changes Summary

| Table | Field | Change |
|-------|-------|--------|
| users | apiToken | REMOVE |
| users | lang | ADD: `v.optional(v.string())` |
| transactions | merchant | REMOVE |
| transactions | category | CHANGE: `v.string()` → `v.optional(v.id("userCategories"))` |
| transactions | source | Keep but only "web" value used |
| locationHistories | category | CHANGE: `v.string()` → `v.optional(v.id("userCategories"))` |
| userCategories | (new table) | ADD: id, isActive, emoji, userId, en_name, zh_name, order |
