# Feature Specification: Phase 3 Enhancements

**Feature Branch**: `003-phase3-enhancements`  
**Created**: 2026-02-04  
**Status**: Draft  
**Input**: User description: "003-phase3-enchancement

1. add back apiTokenDisplay from previous commit e6a6a180f7926e4e02ec7981f1e25fd21c308da8
2. add back apiToken field in user table, the apiToken is used to verify and identify which user is calling the api
3. add a POST request endpoint /api/transactions/create that accepts payload json with amount, category, name and apiToken
amount: number, category: string, name: optional string, apiToken
use the category string to query userCategory with the same user and category name, if such userCategory is not found, create one with a Default emoji, finally create a new transaction record, if apiToken does not match any user, return error
4. disable swipe to right gesture from transactions list, userCategory list and locationHistories list, only keep swipe left to delete or swipe left to deactivate for userCategory
5. remove order field from userCategory, remove draggable list function, user cannot reorder userCategory, userCategory dropdown is ordered by createdAt asc
6. stats page currently does not support i18n
7. remove week, month, year button from stats page
8. changes to Spending by Category pie chart, display spendings by category for the month labeled by userCategory name, display MM/yyyy in the top middle of the pie chart card under the chart title, with arrow button on left and right, user can use the button to navigate back and forth month, user can also click on the \"MM/yyyy\" and display a dropdown to select which month, default display current month
9. changes to Recent spending histogram, add a userCategory dropdown with a option \"All\" on the top left of \"Recent spending\" graph card, user can filter by userCategory, default is All"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - External API Transaction Creation (Priority: P1)

External systems (mobile apps, IoT devices, automation scripts) need to create transaction records in Spendy without requiring web session authentication. Users can generate an API token from their settings page and use it to submit transactions programmatically.

**Why this priority**: Enables integration with external systems and automated workflows, expanding the application's utility beyond manual web-based entry. This is foundational for users who want to track spending from multiple sources.

**Independent Test**: Can be fully tested by obtaining an API token from settings, making a POST request with valid transaction data, and verifying the transaction appears in the records list. Delivers immediate value for API-based integrations.

**Acceptance Scenarios**:

1. **Given** a user has generated an API token, **When** they send a POST request to `/api/transactions/create` with valid `amount`, `category`, `name`, and `apiToken`, **Then** a new transaction record is created and associated with their account
2. **Given** a user sends a POST request with a category name that doesn't exist in their userCategories (e.g., `category: "Transport"`), **When** the API processes the request, **Then** a new userCategory is automatically created with `en_name: "Transport"`, `zh_name: "Transport"`, default emoji (❓), and the transaction is created with this category
3. **Given** a user sends a POST request with an invalid or missing `apiToken`, **When** the API validates the request, **Then** the API returns an authentication error (401) and no transaction is created
4. **Given** a user sends a POST request with invalid data (missing `amount`, negative `amount`, or invalid data types), **When** the API validates the request, **Then** the API returns a validation error (400) with specific error details
5. **Given** a user has an existing category with `en_name: "Food"` and `zh_name: "食物"`, **When** they send a POST request with `category: "FOOD"` or `category: "food"` or `category: "食物"`, **Then** the API matches the existing category case-insensitively and creates a transaction linked to that category (no duplicate category is created)
6. **Given** a user is viewing their settings page, **When** they access the API token section, **Then** they can view their current API token and copy it for use in external systems

---

### User Story 2 - Simplified Swipe Gestures (Priority: P1)

Users interact with transaction lists, category lists, and location histories through swipe gestures. The current bidirectional swipe system (both left and right) can be confusing and lead to accidental actions. Simplifying to left-swipe-only makes the interface more intuitive and reduces user errors.

**Why this priority**: Improves user experience by removing confusing gesture options and reducing accidental deletions. This affects core list interactions used frequently throughout the app.

**Independent Test**: Can be fully tested by attempting to swipe right on transaction, category, and location items (should have no effect), then swiping left to trigger delete/deactivate actions. Delivers immediate UX improvement.

**Acceptance Scenarios**:

1. **Given** a user is viewing their transaction list, **When** they swipe right on a transaction item, **Then** no action occurs (swipe right is disabled)
2. **Given** a user is viewing their transaction list, **When** they swipe left on a transaction item past the threshold, **Then** the delete action is triggered
3. **Given** a user is viewing their active userCategory list, **When** they swipe left on a category item, **Then** the deactivate action is triggered
4. **Given** a user is viewing their location histories list, **When** they swipe right on a location item, **Then** no action occurs (swipe right is disabled)
5. **Given** a user is viewing their location histories list, **When** they swipe left on a location item, **Then** the delete action is triggered

---

### User Story 3 - Simplified Category Management (Priority: P2)

Users no longer need to manually order their categories. Categories are automatically ordered by creation date (oldest first), eliminating the complexity of drag-and-drop reordering. This simplifies the UI and removes unnecessary interaction patterns.

**Why this priority**: Reduces interface complexity and removes a feature that may not provide significant value to most users. Categories ordered by creation date provide a predictable, consistent ordering.

**Independent Test**: Can be fully tested by creating multiple categories and verifying they appear in creation order in dropdowns and lists. Existing drag-and-drop functionality should be removed and non-functional.

**Acceptance Scenarios**:

1. **Given** a user views their category list in settings, **When** the list is displayed, **Then** categories are ordered by creation date (oldest first) and no drag handles or reorder UI is present
2. **Given** a user creates a new category, **When** they view category dropdowns in transaction forms, **Then** the new category appears at the bottom of the list (most recent creation date)
3. **Given** a user has existing categories with `order` field values, **When** they view their category list, **Then** the `order` field is ignored and categories are sorted by `createdAt` ascending
4. **Given** a user attempts to drag a category item, **When** they press and drag, **Then** no reordering occurs (drag functionality is removed)

---

### User Story 4 - Enhanced Monthly Category Spending View (Priority: P1)

Users want to understand their spending patterns by category for specific months. The pie chart should show category breakdowns for a selected month with intuitive navigation controls. Users can step through months or jump to a specific month using a dropdown.

**Why this priority**: Provides powerful insights into monthly spending patterns and enables historical analysis. The month navigation is a critical feature for understanding trends over time.

**Independent Test**: Can be fully tested by navigating to the stats page, clicking arrows to move between months, and selecting a specific month from the dropdown. Pie chart data should update to reflect the selected month only.

**Acceptance Scenarios**:

1. **Given** a user is viewing the stats page, **When** the page loads, **Then** the pie chart displays spending by category for the current month, with "MM/yyyy" (e.g., "02/2026") shown in the top middle of the card
2. **Given** a user is viewing the pie chart, **When** they click the left arrow button, **Then** the chart updates to show the previous month's data and the "MM/yyyy" label updates accordingly
3. **Given** a user is viewing the pie chart, **When** they click the right arrow button, **Then** the chart updates to show the next month's data (up to the current month)
4. **Given** a user is viewing the pie chart, **When** they click on the "MM/yyyy" label, **Then** a dropdown appears with a list of available months
5. **Given** a user has opened the month dropdown, **When** they select a specific month, **Then** the pie chart updates to show that month's category spending data
6. **Given** a user views the pie chart for a selected month, **When** the chart renders, **Then** each category slice is labeled with the userCategory name (with emoji if available) and shows percentage or amount

---

### User Story 5 - Category-Filtered Spending Histogram (Priority: P2)

Users want to see spending trends over time filtered by specific categories. The histogram should allow filtering by a single category or viewing all categories combined. This enables focused analysis of spending patterns for specific expense types.

**Why this priority**: Enhances analytical capabilities by allowing category-specific trend analysis. This is valuable for users tracking specific spending areas (e.g., "How much am I spending on food each month?").

**Independent Test**: Can be fully tested by selecting different categories from the dropdown and verifying the histogram updates to show only transactions in that category. The "All" option should show combined data.

**Acceptance Scenarios**:

1. **Given** a user is viewing the Recent Spending histogram, **When** the chart loads, **Then** a category dropdown with an "All" option appears in the top left of the card, defaulted to "All"
2. **Given** a user selects a specific category from the dropdown, **When** the histogram updates, **Then** only spending data for that category is displayed across the time periods
3. **Given** a user selects "All" from the category dropdown, **When** the histogram updates, **Then** spending data for all categories combined is displayed
4. **Given** a user has filtered by a specific category, **When** they view the histogram, **Then** the visual presentation clearly indicates which category is being displayed
5. **Given** a user has no transactions in a selected category for a time period, **When** the histogram renders, **Then** that time period shows zero or empty data appropriately

---

### User Story 6 - Stats Page Internationalization Support (Priority: P3)

The stats page should support multiple languages consistent with the rest of the application. All labels, titles, and UI text should respect the user's language preference and use the internationalization (i18n) system.

**Why this priority**: Ensures consistency across the application and accessibility for non-English users. This is less urgent than functional features but important for a complete user experience.

**Independent Test**: Can be fully tested by switching the application language and verifying all stats page text (titles, labels, tooltips) updates to the selected language.

**Acceptance Scenarios**:

1. **Given** a user has selected Chinese language preference, **When** they view the stats page, **Then** all titles, labels, and button text appear in Chinese
2. **Given** a user switches language from English to Chinese, **When** the stats page re-renders, **Then** all chart labels, tooltips, and UI elements update to Chinese
3. **Given** a user views category names in the pie chart, **When** the user's language is set to Chinese, **Then** the `zh_name` field of userCategories is used for labels (falling back to `en_name` if unavailable)

---

### User Story 7 - Streamlined Stats Time Period Selection (Priority: P2)

The stats page should focus on monthly and custom month-selection views rather than week/year aggregations. Removing the week, month, year toggle buttons simplifies the interface and aligns with the enhanced month navigation in the pie chart.

**Why this priority**: Simplifies the stats page UI and eliminates redundant controls. The new month navigation in the pie chart provides more granular control than the previous time period buttons.

**Independent Test**: Can be fully tested by verifying the week/month/year button group is removed from the stats page and confirming the pie chart month navigation and histogram category filter are the primary controls.

**Acceptance Scenarios**:

1. **Given** a user views the stats page, **When** the page loads, **Then** the week/month/year toggle buttons are not present
2. **Given** a user views the stats page, **When** they want to change the time period, **Then** they use the pie chart month navigation arrows or dropdown instead
3. **Given** the histogram component, **When** it displays data, **Then** it shows a reasonable default time range (e.g., last 3-6 months) without requiring time period selection from buttons

---

### Edge Cases

- What happens when a user provides an API token that has been revoked or deleted?
- How does the system handle API requests with duplicate transaction data (same amount, category, timestamp)?
- What happens when a user navigates to a future month in the pie chart? (Should be disabled or show empty data)
- How does the system handle category names with special characters or very long names in API requests?
- What happens when a user has no transactions in any month for the pie chart navigation?
- How does the histogram display when a selected category has sparse or no data for the visible time range?
- What happens if a user creates a category via API with an empty or whitespace-only category name?
- How does the system handle concurrent API requests trying to create the same non-existent category simultaneously?
- What happens if case-insensitive matching returns multiple categories (e.g., user has both `en_name: "Food"` in category A and `zh_name: "food"` in category B)? (System returns the category with earliest `createdAt` timestamp for deterministic behavior)

## Requirements *(mandatory)*

### Functional Requirements

**API Token Management:**

- **FR-001**: System MUST add an `apiToken` field to the user table schema for storing unique authentication tokens
- **FR-002**: System MUST restore the API token display component that allows users to view and copy their API token
- **FR-003**: API tokens MUST be unique per user and sufficiently long/random to prevent guessing (minimum 32 characters, cryptographically secure)
- **FR-004**: Users MUST be able to access their API token from the settings page at any time

**External API Endpoint:**

- **FR-005**: System MUST implement a POST endpoint at `/api/transactions/create` that accepts JSON payloads with `amount`, `category`, `name` (optional), and `apiToken` fields
- **FR-006**: The API endpoint MUST validate that the `apiToken` exists and matches a valid user before processing the request
- **FR-007**: The API endpoint MUST return a 401 error with a descriptive message if the `apiToken` is invalid or missing
- **FR-008**: The API endpoint MUST validate that `amount` is a positive number and `category` is a non-empty string
- **FR-009**: The API endpoint MUST return a 400 error with specific validation details if required fields are missing or invalid
- **FR-010**: The API endpoint MUST query for an existing userCategory matching the user and the `category` name string by performing a case-insensitive search against both `en_name` and `zh_name` fields (returning a match if either field matches). If multiple categories match, the system MUST return the category with the earliest `createdAt` timestamp. Implementation note: Case-insensitive matching should be performed in application code after fetching all user categories, using JavaScript `.toLowerCase()` comparison
- **FR-011**: If no matching userCategory exists, the API MUST automatically create a new userCategory with both `en_name` and `zh_name` set to the provided `category` string value, a default emoji (❓), and `isActive: true`
- **FR-012**: The API endpoint MUST create a new transaction record associated with the authenticated user, linking to the found or newly created userCategory
- **FR-013**: The API endpoint MUST return a 201 status code with the created transaction details on success
- **FR-014**: The API endpoint MUST handle and return appropriate error responses for database failures or server errors (500)

**Swipe Gesture Simplification:**

- **FR-015**: System MUST disable swipe-to-right gesture on transaction list items; the item MUST remain stationary when a right-swipe is attempted
- **FR-016**: System MUST preserve swipe-to-left gesture for deleting transactions
- **FR-017**: System MUST disable swipe-to-right gesture on userCategory list items; the item MUST remain stationary when a right-swipe is attempted
- **FR-018**: System MUST preserve swipe-to-left gesture for deactivating userCategories
- **FR-019**: System MUST disable swipe-to-right gesture on locationHistories list items; the item MUST remain stationary when a right-swipe is attempted
- **FR-020**: System MUST preserve swipe-to-left gesture for deleting location histories
- **FR-021**: Swipe gesture components MUST not display right-swipe action backgrounds or labels

**Category Management Simplification:**

- **FR-022**: System MUST remove the `order` field from the userCategories schema (or deprecate it and stop using it in queries)
- **FR-023**: System MUST remove all drag-and-drop reordering UI components from the userCategory management interface
- **FR-024**: System MUST order userCategory lists and dropdowns by `createdAt` in ascending order (oldest first)
- **FR-025**: System MUST not provide any UI controls for manually reordering categories

**Enhanced Pie Chart Month Navigation:**

- **FR-026**: System MUST display "MM/yyyy" format (e.g., "02/2026") in the top middle of the pie chart card, below the chart title
- **FR-027**: System MUST display left and right arrow buttons adjacent to the month label for navigation
- **FR-028**: System MUST update the pie chart data to show spending for the previous month when the left arrow is clicked
- **FR-029**: System MUST update the pie chart data to show spending for the next month when the right arrow is clicked (disabled or no-op if already at current month)
- **FR-030**: System MUST make the "MM/yyyy" label clickable and display a dropdown menu of available months when clicked
- **FR-031**: The month dropdown MUST allow users to select any month where transaction data exists
- **FR-032**: System MUST update the pie chart to display spending for the selected month when a month is chosen from the dropdown
- **FR-033**: System MUST default the pie chart to display the current month on initial page load
- **FR-034**: System MUST label pie chart segments with userCategory names (including emoji) rather than generic category labels
- **FR-035**: System MUST query transactions filtered by the selected month's date range (start of month to end of month)

**Histogram Category Filtering:**

- **FR-036**: System MUST add a category dropdown to the top left of the Recent Spending histogram card
- **FR-037**: The category dropdown MUST include an "All" option and list all active userCategories
- **FR-038**: System MUST default the histogram to show "All" categories on initial page load
- **FR-039**: System MUST update the histogram data to show only transactions for the selected category when a specific category is chosen
- **FR-040**: System MUST show combined data for all categories when "All" is selected
- **FR-041**: The histogram MUST clearly indicate which category filter is currently applied

**Stats Page Internationalization:**

- **FR-042**: System MUST support i18n for all labels, titles, and text on the stats page
- **FR-043**: System MUST use the appropriate language file (locale) for displaying stats page content based on user preference
- **FR-044**: System MUST display userCategory names using the `zh_name` field when the user's language is Chinese, falling back to `en_name` if unavailable
- **FR-045**: Chart components (pie chart, histogram) MUST support localized labels, tooltips, and legends

**Stats Page Time Period Controls:**

- **FR-046**: System MUST remove the week/month/year toggle button group from the stats page header
- **FR-047**: System MUST remove any associated state management for week/year time period selection
- **FR-048**: The histogram MUST display a reasonable default time range without requiring time period selection from buttons

**Documentation:**

- **FR-049**: The specification (spec.md), implementation plan (plan.md), and task list (tasks.md) MUST be updated to document the case-insensitive category name matching behavior for the API endpoint, including examples of matching logic across `en_name` and `zh_name` fields

### Key Entities

- **User**: Represents an authenticated user account
  - Attributes: name, email, image, language preference, API token, creation timestamp
  - Relationships: Has many transactions, has many userCategories, has many locationHistories

- **UserCategory**: Represents a spending category customized by the user
  - Attributes: emoji, English name, Chinese name, active status, creation timestamp
  - Relationships: Belongs to a user, has many transactions, has many locationHistories
  - Note: The `order` field is removed/deprecated in this phase

- **Transaction**: Represents a spending record
  - Attributes: amount, optional name/description, creation timestamp
  - Relationships: Belongs to a user, belongs to a userCategory (optional)
  - Creation source: Manual entry via web UI or external API

- **LocationHistory**: Represents a location-based spending record
  - Attributes: latitude, longitude, amount, optional name, count, creation timestamp
  - Relationships: Belongs to a user, belongs to a userCategory (optional)

- **API Token**: Represents an authentication credential for external API access
  - Attributes: token string (unique, secure)
  - Relationships: Belongs to a user (1:1 relationship)
  - Purpose: Authenticate external systems for transaction creation

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can successfully create transactions via external API with valid API token, achieving 100% success rate for valid requests
- **SC-002**: API endpoint returns appropriate error codes (401 for auth failures, 400 for validation errors) 100% of the time
- **SC-003**: Users can view and copy their API token from the settings page in under 10 seconds
- **SC-004**: Swipe-right gestures on transaction, category, and location lists have no effect (disabled), eliminating accidental actions
- **SC-005**: Swipe-left gestures on lists successfully trigger delete/deactivate actions 100% of the time
- **SC-006**: Category lists and dropdowns display in creation-date order consistently across all UI locations
- **SC-007**: Users can navigate between months in the pie chart using arrow buttons, with data updating in under 1 second per navigation
- **SC-008**: Users can select any historical month from the dropdown and see accurate spending data for that month
- **SC-009**: The pie chart correctly shows category spending for the selected month only, not aggregated across multiple months
- **SC-010**: Users can filter the histogram by specific categories, with data updating in under 1 second per filter change
- **SC-011**: The histogram "All" filter shows combined data matching the sum of individual category filters
- **SC-012**: Stats page displays in the user's selected language with 100% of text localized correctly
- **SC-013**: Drag-and-drop reordering functionality is completely removed from category management UI
- **SC-014**: Week/month/year toggle buttons are removed from stats page, simplifying the interface
- **SC-015**: Automatically created categories via API have the default emoji (❓) and are immediately usable for future transactions
- **SC-016**: API category lookup correctly matches case-insensitive input against both `en_name` and `zh_name` fields 100% of the time, preventing duplicate category creation for variations in case (e.g., "Food", "food", "FOOD" all match the same category)

## Clarifications

### Session 2026-02-04

- Q: How should the UI respond to a disabled right-swipe gesture? → A: The item remains stationary; the gesture is completely ignored.
- Q: Are generateApiToken, generateInitialApiToken and regenerateApiToken the same? Can they be grouped into one? → A: Yes, consolidate into single `generateApiToken()` utility function that both `create` and `regenerateApiToken` mutations call. Token generation logic (crypto.randomBytes or UUID) is identical; only the timing and context differ.
- Q: When a user submits a category name via the API (e.g., "FOOD" or "食物"), which field(s) should the system match against? → A: Search both `en_name` AND `zh_name` fields case-insensitively, returning a match if either field matches
- Q: When automatically creating a new category via the API, how should the system populate `en_name` and `zh_name` fields from the single `category` input string? → A: Set both `en_name` and `zh_name` to the same value from the `category` input string
- Q: What specific documentation needs to be updated for the case-insensitive category name search feature? → A: tasks.md, specs.md, plan.md
- Q: When the API performs case-insensitive matching and multiple categories could potentially match, what should the system's behavior be? → A: Return the category with the earliest `createdAt` timestamp (oldest category wins)
- Q: For the case-insensitive search implementation in Convex queries, should the matching be performed at the database level or in application code? → A: Filter in application code after fetching all user categories from the database

## Assumptions

- The API token will be generated server-side using a single `generateApiToken()` utility function that both initial creation and regeneration will call
- The API token format is cryptographically secure UUID v4 (minimum 32 characters)
- The default emoji for auto-created categories is ❓ (generic label emoji)
- Month navigation in the pie chart is limited to months where transaction data exists (empty months may be shown as zero data)
- The histogram default time range is determined by implementation (likely last 3-6 months based on existing pattern)
- API token display component structure from commit e6a6a180f7926e4e02ec7981f1e25fd21c308da8 can be reused with minimal modifications
- Existing internationalization infrastructure (next-intl) can be extended to cover stats page content
- Category name matching for API requests is case-insensitive, searches both `en_name` and `zh_name` fields, and uses exact-match (no fuzzy matching or partial substring matching). When multiple categories match, the oldest category (by `createdAt`) is selected for deterministic behavior
- Case-insensitive category matching is performed in application code after fetching user categories from Convex, rather than using database-level filtering, due to Convex's query limitations and typical low category counts per user (<100)
- The right arrow in pie chart month navigation becomes disabled or no-op when already at the current month
- Month dropdown in pie chart shows all months from the earliest transaction date to the current month
- Removing the `order` field from schema is a schema migration that will be handled during implementation
- Existing transactions with category references remain valid after `order` field removal
- Swipe gesture threshold and behavior (distance, animation) remain unchanged, only direction is disabled
