# Transportation Portal - State Management Implementation Structure

## Complete Directory Tree

```
~/projects/transportation/frontend/transport-portal/src/
├── app/
│   ├── app.module.ts                          # Root module with APP_INITIALIZER
│   ├── app-routing.module.ts                   # Routes
│   ├── app.component.ts                        # Root component
│   │
│   ├── core/                                   # Singleton services (provided in root)
│   │   ├── services/
│   │   │   ├── storage.service.ts              # Elasticsearch user preferences (NOT localStorage)
│   │   │   ├── route-state.service.ts          # URL parameter sync
│   │   │   ├── state-management.service.ts     # Main state orchestrator
│   │   │   ├── user-preferences.service.ts     # Backend API for user prefs
│   │   │   └── transport-api.service.ts        # HTTP calls to backend (already exists)
│   │   │
│   │   └── core.module.ts                      # Optional: organize core services
│   │
│   ├── shared/                                 # Reusable components/pipes/directives
│   │   ├── components/
│   │   │   ├── loading-spinner/
│   │   │   │   ├── loading-spinner.component.ts
│   │   │   │   └── loading-spinner.component.scss
│   │   │   │
│   │   │   └── error-message/
│   │   │       ├── error-message.component.ts
│   │   │       └── error-message.component.scss
│   │   │
│   │   ├── pipes/
│   │   │   └── safe-key.pipe.ts                # For keyvalue pipe with types
│   │   │
│   │   └── shared.module.ts
│   │
│   ├── models/                                 # TypeScript interfaces
│   │   ├── aircraft.model.ts                   # Already exists
│   │   ├── search-filters.model.ts             # NEW: SearchFilters interface
│   │   ├── search-state.model.ts               # NEW: SearchState interface
│   │   ├── search-statistics.model.ts          # NEW: SearchStatistics, SearchResponse
│   │   └── user-preferences.model.ts           # NEW: UserPreferences interface
│   │
│   ├── features/                               # Feature modules
│   │   │
│   │   ├── search/                             # Search feature
│   │   │   ├── search-routing.module.ts
│   │   │   ├── search.module.ts
│   │   │   │
│   │   │   ├── pages/
│   │   │   │   └── search-page/
│   │   │   │       ├── search-page.component.ts        # Layout container
│   │   │   │       ├── search-page.component.html
│   │   │   │       └── search-page.component.scss
│   │   │   │
│   │   │   └── components/
│   │   │       ├── aircraft-search/            # Search form (refactor existing)
│   │   │       │   ├── aircraft-search.component.ts
│   │   │       │   ├── aircraft-search.component.html
│   │   │       │   └── aircraft-search.component.scss
│   │   │       │
│   │   │       ├── results-table/              # Paginated table
│   │   │       │   ├── results-table.component.ts
│   │   │       │   ├── results-table.component.html
│   │   │       │   └── results-table.component.scss
│   │   │       │
│   │   │       ├── pagination/                 # Pagination controls
│   │   │       │   ├── pagination.component.ts
│   │   │       │   ├── pagination.component.html
│   │   │       │   └── pagination.component.scss
│   │   │       │
│   │   │       ├── histogram/                  # Reusable histogram
│   │   │       │   ├── histogram.component.ts
│   │   │       │   ├── histogram.component.html
│   │   │       │   └── histogram.component.scss
│   │   │       │
│   │   │       └── results-summary/            # "Found X results" banner
│   │   │           ├── results-summary.component.ts
│   │   │           ├── results-summary.component.html
│   │   │           └── results-summary.component.scss
│   │   │
│   │   ├── aircraft-detail/                    # Detail page feature
│   │   │   ├── aircraft-detail-routing.module.ts
│   │   │   ├── aircraft-detail.module.ts
│   │   │   └── pages/
│   │   │       └── aircraft-detail-page/
│   │   │           ├── aircraft-detail-page.component.ts
│   │   │           ├── aircraft-detail-page.component.html
│   │   │           └── aircraft-detail-page.component.scss
│   │   │
│   │   └── statistics/                         # Statistics dashboard feature
│   │       ├── statistics-routing.module.ts
│   │       ├── statistics.module.ts
│   │       └── pages/
│   │           └── statistics-dashboard/
│   │               ├── statistics-dashboard.component.ts
│   │               ├── statistics-dashboard.component.html
│   │               └── statistics-dashboard.component.scss
│   │
│   └── environments/
│       ├── environment.ts                       # Already exists
│       └── environment.prod.ts
```

---

## Service Responsibilities

### 1. **StorageService** (`core/services/storage.service.ts`)
```typescript
// Interfaces with backend for user preferences
// NOT localStorage - that was in the reference doc
// Actual implementation: HTTP calls to backend user preferences endpoint

class StorageService {
  getUserPreferences(userId: string): Observable<UserPreferences>
  updateUserPreferences(userId: string, prefs: Partial<UserPreferences>): Observable<void>
  // No localStorage methods
}
```

### 2. **RouteStateService** (`core/services/route-state.service.ts`)
```typescript
// Pure URL synchronization
// No business logic, no API calls

class RouteStateService {
  queryParams$: Observable<Params>                      // Stream of URL changes
  getCurrentParams(): Params                             // Snapshot
  updateParams(params: Params, replaceUrl: boolean)      // Merge into URL
  setParams(params: Params, replaceUrl: boolean)         // Replace URL
  filtersToParams(filters: SearchFilters): Params        // Conversion
  paramsToFilters(params: Params): SearchFilters         // Conversion
}
```

### 3. **StateManagementService** (`core/services/state-management.service.ts`)
```typescript
// Core state orchestrator
// Single source of truth for application state

class StateManagementService {
  // Public observables (components subscribe)
  state$: Observable<SearchState>
  filters$: Observable<SearchFilters>
  results$: Observable<Aircraft[]>
  statistics$: Observable<SearchStatistics | null>
  loading$: Observable<boolean>
  error$: Observable<string | null>
  hasSearched$: Observable<boolean>
  selectedManufacturer$: Observable<string | null>      // For Histogram2
  
  // Public methods (components call)
  updateFilters(filters: SearchFilters): void           // Form changes
  performSearch(): void                                  // Execute search
  updatePage(page: number): void                         // Pagination
  selectManufacturer(name: string | null): void          // Histogram click
  resetSearch(): void                                    // Clear all
  
  // Private methods
  - initializeFromUrl(): void
  - watchUrlChanges(): void
  - syncStateToUrl(): void
}
```

### 4. **UserPreferencesService** (`core/services/user-preferences.service.ts`)
```typescript
// Backend API for user preferences stored in Elasticsearch

class UserPreferencesService {
  getPreferences(userId: string): Observable<UserPreferences>
  updatePreferences(userId: string, prefs: Partial<UserPreferences>): Observable<UserPreferences>
  
  // Future: Authentication integration
  getCurrentUserId(): string
}
```

### 5. **TransportApiService** (`core/services/transport-api.service.ts`)
```typescript
// Already exists - just update types

class TransportApiService {
  // UPDATED: Now returns SearchResponse with statistics
  search(filters: SearchFilters): Observable<SearchResponse>
  
  getAircraftById(id: string): Observable<Aircraft>
  getStatistics(): Observable<Statistics>  // Keep for dashboard page
}
```

---

## Component Responsibilities

### Search Page Container
```typescript
// search/pages/search-page/search-page.component.ts
// Pure layout - no logic
// Just arranges child components
```

### Aircraft Search Form
```typescript
// search/components/aircraft-search/aircraft-search.component.ts
// Responsibilities:
// - Display form fields
// - Hydrate from state$ on init
// - Call state.updateFilters() on form changes
// - Call state.performSearch() on submit
// - NO direct API calls
// - NO URL manipulation
```

### Results Table
```typescript
// search/components/results-table/results-table.component.ts
// Responsibilities:
// - Subscribe to results$, loading$, error$, hasSearched$
// - Display table rows
// - NO logic, just presentation
```

### Pagination
```typescript
// search/components/pagination/pagination.component.ts
// Responsibilities:
// - Subscribe to filters$ (for current page)
// - Calculate total pages from totalResults$ and pageSize
// - Call state.updatePage() on click
```

### Histogram (Reusable)
```typescript
// search/components/histogram/histogram.component.ts
// Responsibilities:
// - @Input() dataType: 'byManufacturer' | 'selectedManufacturerModels'
// - @Input() title: string
// - Subscribe to statistics$ and selectedManufacturer$
// - Filter data based on dataType
// - Emit click events: @Output() barClick = new EventEmitter<string>()
// - Parent calls state.selectManufacturer()
```

---

## Data Flow Diagram

```
User Action (Form/Click/URL)
    ↓
Component Method Call
    ↓
StateManagementService Public Method
    ↓
[State Update + URL Sync] OR [API Call via TransportApiService]
    ↓
BehaviorSubject.next(newState)
    ↓
All Components React via Observable Subscriptions
    ↓
UI Updates Automatically
```

---

## Key Files Count

**Services:** 5 new files
- storage.service.ts
- route-state.service.ts  
- state-management.service.ts
- user-preferences.service.ts
- transport-api.service.ts (update existing)

**Models:** 4 new files
- search-filters.model.ts
- search-state.model.ts
- search-statistics.model.ts
- user-preferences.model.ts

**Components to Create:** 4
- results-table component
- pagination component
- histogram component
- results-summary component

**Components to Refactor:** 1
- aircraft-search (existing, needs state integration)

**Total New/Modified Files:** ~14 files

---

## Implementation Order

1. **Models** (15 minutes)
2. **RouteStateService** (30 minutes)
3. **StorageService** + **UserPreferencesService** (45 minutes)
4. **StateManagementService** (60 minutes)
5. **Update TransportApiService** (15 minutes)
6. **Test services in isolation** (30 minutes)
7. **Refactor aircraft-search component** (30 minutes)
8. **Create new components** (2 hours)
9. **Integration testing** (1 hour)

**Estimated Total:** 6-7 hours

---

Does this structure align with your expectations? Any adjustments needed before we start implementation?
