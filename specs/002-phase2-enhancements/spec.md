# Feature Specification: Phase 2 Enhancements

**Feature Branch**: `002-phase2-enhancements`  
**Created**: 2026-02-01  
**Status**: Draft  
**Input**: User description: "Phase 2 development: dark theme support (follows browser), i18n (en/zh-TW), remove apiToken and merchant fields, add userCategory table with defaults, update transaction flow with location history selection, new settings pages for categories and location histories"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Dark Theme Auto-Detection (Priority: P1)

Users want the application to automatically match their system/browser color scheme preference without manual configuration, providing a comfortable viewing experience in all lighting conditions.

**Why this priority**: Visual accessibility is fundamental to user experience. Users with dark mode enabled at system level expect applications to respect this preference automatically.

**Independent Test**: Can be fully tested by toggling system dark mode setting and observing the app automatically switches theme without page reload.

**Acceptance Scenarios**:

1. **Given** a user has their browser/OS set to dark mode, **When** they open the application, **Then** the application displays in dark theme colors
2. **Given** a user has their browser/OS set to light mode, **When** they open the application, **Then** the application displays in light theme colors
3. **Given** a user is viewing the application and changes their system theme preference, **When** the preference changes, **Then** the application immediately reflects the new theme without requiring a page refresh
4. **Given** the user's system does not report a theme preference, **When** they open the application, **Then** the application defaults to light theme

---

### User Story 2 - Multi-language Support (Priority: P1)

Users want the application to display content in their preferred language (English or Traditional Chinese), with automatic detection from browser settings and manual override capability.

**Why this priority**: Language accessibility is essential for the target user base. Supporting Traditional Chinese expands usability for Chinese-speaking users.

**Independent Test**: Can be fully tested by changing browser language preference and verifying all UI text displays in the correct language.

**Acceptance Scenarios**:

1. **Given** a new user with browser language set to Chinese (zh, zh-TW, zh-HK, zh-Hant), **When** they first access the application, **Then** all UI text displays in Traditional Chinese
2. **Given** a new user with browser language set to any non-Chinese language, **When** they first access the application, **Then** all UI text displays in English
3. **Given** a user has a language preference saved in their profile, **When** they access the application, **Then** UI text displays in their saved preference regardless of browser language
4. **Given** a user on the Settings page, **When** they select a language option (System, English, Traditional Chinese), **Then** the UI immediately updates to reflect that language
5. **Given** a user selects "System" as language preference, **When** they access the application from a device with different browser language, **Then** the UI displays in the language matching that browser

---

### User Story 3 - Custom Category Management (Priority: P1)

Users want to create, edit, reorder, and deactivate their own spending categories with emoji icons and bilingual names, replacing the hardcoded category list.

**Why this priority**: Personalized categories are core to accurate expense tracking. Users have different spending patterns and need flexibility to categorize their transactions meaningfully.

**Independent Test**: Can be fully tested by creating a new category with emoji and name, verifying it appears in the transaction form dropdown.

**Acceptance Scenarios**:

1. **Given** a new user signs up, **When** their account is created, **Then** two default categories are automatically created: Restaurant (emoji: food icon, en: "Restaurant", zh: "Lunch") and Transport (emoji: train icon, en: "Transport", zh: "Transport")
2. **Given** a user on the Category Settings page, **When** they click the create button, **Then** a popup appears where they can enter an emoji and name
3. **Given** a user creating a new category, **When** they enter only a name (both en_name and zh_name are empty), **Then** the entered name is saved to both en_name and zh_name fields
4. **Given** a user editing a category that already has one language name populated, **When** they update the name, **Then** only the current display language's name field is updated
5. **Given** a user viewing the Category Settings page, **When** they swipe left on a category, **Then** the category is marked as inactive and moves to the inactive section
6. **Given** a user viewing active categories, **When** they drag and drop a category to a new position, **Then** the order values are automatically updated and saved
7. **Given** a user creating a new category, **When** they save, **Then** the category appears at the bottom of the active categories list
8. **Given** a user views the transaction form, **When** they open the category dropdown, **Then** only active categories are displayed with format "[emoji] [localized name]"

---

### User Story 4 - Location-Based Transaction Suggestions (Priority: P2)

Users want the transaction form to suggest nearby location histories when they have GPS coordinates, pre-filling the form with the closest location's details to speed up data entry.

**Why this priority**: Reduces repetitive data entry for users who frequently make purchases at the same locations. Enhances user experience but depends on GPS availability.

**Independent Test**: Can be fully tested by creating a transaction at a location, then returning to the same location and verifying the form pre-fills with previous details.

**Acceptance Scenarios**:

1. **Given** a user opens the transaction form with GPS coordinates, **When** location histories exist within 200 meters, **Then** a location dropdown appears showing all nearby locations sorted by distance (closest first)
2. **Given** a user opens the transaction form with GPS coordinates and nearby locations exist, **When** the form loads, **Then** the closest location is selected by default and the form pre-fills with that location's name and category
3. **Given** a user submits a transaction with "Remember transaction" checked and a location history selected, **When** the form submits, **Then** the selected location history is updated with the new name, category, and weighted average lat/long (amount is kept as the latest value)
4. **Given** a user submits a transaction with "Remember transaction" checked and no location history selected (or none available), **When** the form submits, **Then** a new location history record is created
5. **Given** a user opens the transaction form without GPS coordinates, **When** the form loads, **Then** no location dropdown is displayed
6. **Given** no location histories exist within 200 meters, **When** the user opens the transaction form with GPS, **Then** no location dropdown is displayed

---

### User Story 5 - Location History Management (Priority: P2)

Users want to view and manage their saved location histories, updating names, amounts, and categories for locations they frequently visit.

**Why this priority**: Allows users to correct or customize location data that may have been auto-saved with incorrect information.

**Independent Test**: Can be fully tested by navigating to Location History settings, editing a location's name, and verifying the change appears when creating a new transaction at that location.

**Acceptance Scenarios**:

1. **Given** a user navigates to Settings > Location Histories, **When** the page loads, **Then** all location history records for the user are displayed in a list format consistent with the transaction list UI
2. **Given** a user viewing the Location Histories page, **When** they tap on a location history record, **Then** a popup appears allowing them to edit name, amount, and category
3. **Given** a user edits a location history in the popup, **When** they save changes, **Then** the list updates immediately to reflect the changes
4. **Given** a user viewing the Location Histories page, **When** they swipe left on a record, **Then** the record is deleted
5. **Given** a user on the Location Histories page, **When** they attempt to create a new record, **Then** no create option is available (locations are only created through transactions)

---

### User Story 6 - Settings Navigation Enhancement (Priority: P3)

Users want easy access to Category and Location History management from the main Settings page.

**Why this priority**: Navigation improvements that depend on other features being implemented first.

**Independent Test**: Can be fully tested by clicking the Category settings link and Location History settings link from the Settings page.

**Acceptance Scenarios**:

1. **Given** a user on the Settings page, **When** they view the page, **Then** they see links to "Category Settings" and "Location History Settings"
2. **Given** a user clicks "Category Settings", **When** the navigation occurs, **Then** they are taken to /settings/userCategory page
3. **Given** a user clicks "Location History Settings", **When** the navigation occurs, **Then** they are taken to /settings/locationHistories page

---

### User Story 7 - Legacy Data Cleanup (Priority: P3)

The system removes deprecated fields (apiToken from users, merchant from transactions) and the external API endpoint to simplify the data model.

**Why this priority**: Database cleanup that can be done independently but is lower priority than user-facing features.

**Independent Test**: Can be fully tested by verifying the POST /api/transaction endpoint no longer exists and transactions can be created without merchant field.

**Acceptance Scenarios**:

1. **Given** the new schema is deployed, **When** a user record is queried, **Then** no apiToken field exists
2. **Given** the new schema is deployed, **When** a transaction record is queried, **Then** no merchant field exists
3. **Given** an external client attempts to POST to /api/transaction, **When** the request is made, **Then** a 404 response is returned
4. **Given** the Settings page loads, **When** user data is displayed, **Then** no API token section is visible
5. **Given** the transaction form loads, **When** available fields are rendered, **Then** no merchant input field exists

---

### Edge Cases

- What happens when a user's browser doesn't support prefers-color-scheme media query? System defaults to light theme.
- How does the system handle when GPS coordinates are extremely imprecise (>500m accuracy)? Location suggestions still appear if any histories are within 200m of reported coordinates.
- What happens when a user deactivates all their categories? The category dropdown shows empty state with prompt to create a category.
- How does the system handle concurrent category reordering (e.g., on two devices)? Last write wins; order values are recalculated on save.
- What happens to existing transactions with hardcoded categories after migration? Existing category strings remain as-is; they will not match new userCategory IDs.
- How are default categories handled for existing users? Default categories are only created for new user registrations; existing users must create categories manually or through a one-time migration prompt.

## Requirements _(mandatory)_

### Functional Requirements

**Theme Support**

- **FR-001**: System MUST detect and apply browser/OS color scheme preference (light/dark) automatically on page load
- **FR-002**: System MUST respond to real-time theme preference changes without requiring page refresh
- **FR-003**: System MUST default to light theme when no system preference is detectable

**Internationalization**

- **FR-004**: System MUST support two languages: English (en) and Traditional Chinese (zh-TW)
- **FR-005**: System MUST detect browser language on first visit and set appropriate default (Chinese variants map to zh-TW, all others to en)
- **FR-006**: System MUST persist user language preference in their profile (lang field on user record)
- **FR-007**: System MUST provide three language options in Settings: System (follows browser), English, Traditional Chinese
- **FR-008**: System MUST immediately update all UI text when language preference changes

**User Category Management**

- **FR-009**: System MUST create userCategory table with fields: id, isActive, emoji, user reference, en_name, zh_name, order
- **FR-010**: System MUST create two default categories (Restaurant, Transport) for each new user registration
- **FR-011**: System MUST display category list at /settings/userCategory with active categories first, inactive categories below
- **FR-012**: System MUST support swipe-to-deactivate gesture for categories (moves to inactive section)
- **FR-013**: System MUST support drag-to-reorder for active categories with auto-save
- **FR-014**: System MUST provide popup interface for creating and editing categories (emoji + name)
- **FR-015**: System MUST save name to both en_name and zh_name when both are empty during create/edit
- **FR-016**: System MUST save name only to current language field when the other language field already has a value
- **FR-017**: New categories MUST be assigned order = max(existing order) + 1
- **FR-018**: Category dropdown in transaction form MUST display as "[emoji] [localized name]" with userCategory ID as value

**Location History Enhancement**

- **FR-019**: System MUST query location histories within 200 meters when transaction form loads with GPS coordinates
- **FR-020**: System MUST display location history dropdown sorted by distance (ascending) when nearby locations exist
- **FR-021**: System MUST pre-fill transaction form with closest location's name and category when locations exist
- **FR-022**: System MUST update selected location history with new name, category, and weighted average lat/long when "Remember transaction" is checked
- **FR-023**: System MUST keep the latest amount value (not weighted average) when updating location history
- **FR-024**: System MUST create new location history when "Remember transaction" is checked and no existing location is selected

**Location History Management Page**

- **FR-025**: System MUST display all user's location histories at /settings/locationHistories
- **FR-026**: System MUST support swipe-to-delete for location histories
- **FR-027**: System MUST NOT provide create functionality on location histories page
- **FR-028**: System MUST provide popup for editing location history (name, amount, category fields only)

**Settings Page Updates**

- **FR-029**: System MUST display language preference dropdown with three options on Settings page
- **FR-030**: System MUST display navigation links to Category Settings and Location History Settings

**Legacy Removal**

- **FR-031**: System MUST remove apiToken field from user schema
- **FR-032**: System MUST remove by_apiToken index from user schema
- **FR-033**: System MUST remove merchant field from transaction schema
- **FR-034**: System MUST remove the POST /api/transaction endpoint
- **FR-035**: System MUST remove ApiTokenDisplay component and related UI
- **FR-036**: System MUST remove getByApiToken query from users.ts
- **FR-037**: System MUST remove createFromApi mutation from transactions.ts

### Key Entities

- **User**: Authenticated user account. Stores profile information and language preference. Removed: apiToken field.
- **UserCategory**: User-defined spending category with bilingual names, emoji icon, active status, and display order. New entity.
- **Transaction**: Financial transaction record. Stores amount, category reference (now links to userCategory ID), name, timestamp. Removed: merchant field, source field differentiation for API.
- **LocationHistory**: Geolocation-based transaction memory. Stores coordinates, name, category, amount, visit count for pre-filling transaction forms.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users experience theme changes within 100ms of system preference change
- **SC-002**: 100% of UI text elements support both English and Traditional Chinese translations
- **SC-003**: New users have 2 default categories available immediately upon first login
- **SC-004**: Category reorder operations complete and persist within 500ms
- **SC-005**: Location history suggestions appear within 1 second of form load when GPS coordinates are available
- **SC-006**: Users can complete category creation (tap create, enter name/emoji, save) in under 30 seconds
- **SC-007**: Users can access Category Settings and Location History Settings within 2 taps from main Settings page
- **SC-008**: All deprecated fields (apiToken, merchant) are removed from schema with zero runtime errors
- **SC-009**: External API endpoint returns 404, confirming removal with zero false positives

## Assumptions

1. **Browser Compatibility**: Target browsers support CSS `prefers-color-scheme` media query and the `matchMedia` API for real-time theme detection.
2. **Emoji Support**: Target devices render emoji characters consistently. No fallback icons needed for emoji display.
3. **GPS Accuracy**: Location coordinates from browser geolocation API are accurate within 200 meters for the location suggestion feature to be useful.
4. **Translation Scope**: Only UI text is translated; user-generated content (transaction names, category names) remains in the language entered by the user.
5. **Migration Strategy**: Existing data can be cleared (as stated: "no backwards compatibility needed"). No migration scripts required for existing users' categories or location histories.
6. **Existing Users**: Existing users will need to manually create categories; default categories only apply to new registrations.
7. **Category Reference Migration**: Existing transaction category strings will remain as strings; no automatic migration to userCategory IDs.
8. **Single User Context**: The application operates in a single-user context per session; no multi-user category sharing.
