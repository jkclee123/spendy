# Component API Contracts: Phase 2 Enhancements

**Date**: 2026-02-01  
**Feature**: Phase 2 Enhancements

This document defines the React component interfaces for the Phase 2 features.

---

## UI Components

### Modal

Generic modal/popup component.

**Location**: `src/components/ui/Modal.tsx`

```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg"; // Default: "md"
}
```

**Behavior**:
- Renders via portal at document root
- Closes on backdrop click
- Closes on Escape key
- Traps focus within modal
- Animates in/out

---

### SwipeableCard

Reusable card component with swipe-to-action gesture.

**Location**: `src/components/ui/SwipeableCard.tsx`

```typescript
interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeAction: () => void;
  actionLabel?: string; // Default: "Delete"
  actionColor?: "red" | "yellow" | "blue"; // Default: "red"
  onClick?: () => void;
  disabled?: boolean;
}
```

**Behavior**:
- Swipe left reveals action button
- Swipe past threshold triggers `onSwipeAction`
- Extracted from TransactionCard logic

---

### DraggableList

List component with drag-to-reorder functionality.

**Location**: `src/components/ui/DraggableList.tsx`

```typescript
interface DraggableListProps<T> {
  items: T[];
  keyExtractor: (item: T) => string;
  renderItem: (item: T, index: number) => React.ReactNode;
  onReorder: (newOrder: T[]) => void;
  disabled?: boolean;
}
```

**Behavior**:
- Supports touch and mouse drag
- Provides visual feedback during drag
- Calls `onReorder` on drop with new array order

---

### CategoryDropdown

Custom dropdown for category selection with emoji display.

**Location**: `src/components/ui/CategoryDropdown.tsx`

```typescript
interface CategoryDropdownProps {
  categories: UserCategory[];
  value?: Id<"userCategories">;
  onChange: (categoryId: Id<"userCategories"> | undefined) => void;
  placeholder?: string; // Default: "Select a category"
  required?: boolean;
  disabled?: boolean;
  error?: string;
  label?: string;
  currentLang: "en" | "zh-TW";
}
```

**Behavior**:
- Displays `[emoji] [localized name]` for each option
- Uses `en_name` or `zh_name` based on `currentLang`
- Falls back to the other name if current language name is empty

---

### LanguageSelect

Dropdown for language preference selection.

**Location**: `src/components/settings/LanguageSelect.tsx`

```typescript
interface LanguageSelectProps {
  value: "system" | "en" | "zh-TW";
  onChange: (lang: "system" | "en" | "zh-TW") => void;
  disabled?: boolean;
}
```

**Options**:
- System (follows browser)
- English
- 繁體中文 (Traditional Chinese)

---

### LocationHistoryDropdown

Dropdown for selecting nearby location histories.

**Location**: `src/components/transactions/LocationHistoryDropdown.tsx`

```typescript
interface LocationHistoryDropdownProps {
  locations: Array<LocationHistory & { distance: number }>;
  value?: Id<"locationHistories">;
  onChange: (locationId: Id<"locationHistories"> | undefined) => void;
  disabled?: boolean;
}
```

**Behavior**:
- Displays location name and distance
- Sorted by distance (closest first)
- First option (closest) selected by default

---

## Page Components

### CategorySettingsPage

Category management page.

**Location**: `src/app/(authenticated)/settings/userCategory/page.tsx`

**Features**:
- Lists active categories (top section)
- Lists inactive categories (bottom section)
- Swipe to deactivate/activate
- Drag to reorder (active only)
- Create button opens CategoryEditModal
- Tap category opens CategoryEditModal
- Auto-saves on reorder

---

### LocationHistoriesSettingsPage

Location history management page.

**Location**: `src/app/(authenticated)/settings/locationHistories/page.tsx`

**Features**:
- Lists all location histories
- Swipe to delete
- Tap opens LocationHistoryEditModal
- No create button

---

### CategoryEditModal

Modal for creating/editing categories.

**Location**: `src/components/settings/CategoryEditModal.tsx`

```typescript
interface CategoryEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: UserCategory; // undefined = create mode
  currentLang: "en" | "zh-TW";
  onSave: (data: { emoji: string; name: string }) => Promise<void>;
}
```

**Features**:
- Emoji picker or text input for emoji
- Single name input with smart-save logic
- Create or Update button

---

### LocationHistoryEditModal

Modal for editing location histories.

**Location**: `src/components/settings/LocationHistoryEditModal.tsx`

```typescript
interface LocationHistoryEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationHistory: LocationHistory;
  categories: UserCategory[];
  currentLang: "en" | "zh-TW";
  onSave: (data: {
    name?: string;
    amount?: number;
    category?: Id<"userCategories">;
  }) => Promise<void>;
}
```

**Features**:
- Name text input
- Amount number input
- Category dropdown

---

## Modified Components

### TransactionForm

**Location**: `src/components/transactions/TransactionForm.tsx`

**Changes**:
- Remove `merchant` field
- Replace `CategorySelect` with `CategoryDropdown`
- Add `LocationHistoryDropdown` when GPS coordinates exist
- Pre-fill form when location selected
- Pass `selectedLocationId` to `upsertNearby` when "Remember transaction" checked

**New Props**:
```typescript
interface TransactionFormProps {
  userId: Id<"users">;
  initialData?: Transaction;
  latitude?: number;
  longitude?: number;
  initialAmount?: number;
  initialCategory?: Id<"userCategories">; // CHANGED from string
  initialName?: string;
  // REMOVED: initialMerchant
  nearbyLocations?: Array<LocationHistory & { distance: number }>; // NEW
  onSuccess?: () => void;
  onCancel?: () => void;
}
```

---

### TransactionCard

**Location**: `src/components/transactions/TransactionCard.tsx`

**Changes**:
- Extract swipe logic to `useSwipeGesture` hook
- Use `SwipeableCard` wrapper
- Update `CategoryIcon` to accept `UserCategory` object instead of string
- Remove `merchant` display
- Add dark mode classes

---

### SettingsPage

**Location**: `src/app/(authenticated)/settings/page.tsx`

**Changes**:
- Remove API Token section
- Add Language dropdown
- Add link to Category Settings
- Add link to Location History Settings
- Add dark mode classes

---

### CategorySelect → CategoryDropdown

**Location**: `src/components/transactions/CategorySelect.tsx` → `src/components/ui/CategoryDropdown.tsx`

**Changes**:
- Rename component
- Accept `UserCategory[]` instead of hardcoded list
- Display `[emoji] [name]`
- Use category ID as value instead of string name

---

## Hooks

### useSwipeGesture

**Location**: `src/hooks/useSwipeGesture.ts`

```typescript
interface SwipeGestureConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number; // Default: 80
  disabled?: boolean;
}

interface SwipeGestureReturn {
  offset: number;
  isSwiping: boolean;
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
    onMouseDown: (e: React.MouseEvent) => void;
    onMouseMove: (e: React.MouseEvent) => void;
    onMouseUp: () => void;
    onMouseLeave: () => void;
  };
}

function useSwipeGesture(config: SwipeGestureConfig): SwipeGestureReturn;
```

---

### useLanguage

**Location**: `src/hooks/useLanguage.ts`

```typescript
interface LanguageContext {
  lang: "en" | "zh-TW";
  userPreference: "system" | "en" | "zh-TW";
  setUserPreference: (lang: "system" | "en" | "zh-TW") => Promise<void>;
}

function useLanguage(): LanguageContext;
```

**Behavior**:
- Resolves `"system"` to actual language based on `navigator.language`
- Persists preference to user record
- Triggers re-render when language changes

---

### useNearbyLocations

**Location**: `src/hooks/useNearbyLocations.ts`

```typescript
function useNearbyLocations(
  userId: Id<"users"> | undefined,
  latitude: number | undefined,
  longitude: number | undefined
): {
  locations: Array<LocationHistory & { distance: number }> | undefined;
  isLoading: boolean;
};
```

**Behavior**:
- Queries `locationHistories.findNearby` with 200m radius
- Returns undefined/loading if coordinates not available
- Sorted by distance ascending

---

## i18n Integration

### Translation Provider

**Location**: `src/lib/i18n.ts` and `src/app/layout.tsx`

```typescript
// Messages structure
interface Messages {
  common: {
    save: string;
    cancel: string;
    delete: string;
    create: string;
    edit: string;
    loading: string;
    error: string;
    success: string;
  };
  settings: {
    title: string;
    profile: string;
    language: string;
    languageOptions: {
      system: string;
      en: string;
      zhTW: string;
    };
    categorySettings: string;
    locationHistorySettings: string;
    signOut: string;
  };
  categories: {
    title: string;
    active: string;
    inactive: string;
    createNew: string;
    editCategory: string;
    name: string;
    emoji: string;
    swipeToDeactivate: string;
    dragToReorder: string;
    noCategories: string;
  };
  locations: {
    title: string;
    editLocation: string;
    swipeToDelete: string;
    noLocations: string;
  };
  transactions: {
    title: string;
    amount: string;
    category: string;
    name: string;
    rememberTransaction: string;
    create: string;
    update: string;
    selectLocation: string;
    noTransactions: string;
  };
  // ... more sections
}
```

**Usage in Components**:
```typescript
import { useTranslations } from 'next-intl';

function MyComponent() {
  const t = useTranslations('settings');
  return <h1>{t('title')}</h1>; // "Settings" or "設定"
}
```
