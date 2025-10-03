# Transportation Portal - State Management Architecture Design

## Expected Behavior Documentation

### Scenario Analysis

#### **Scenario 1: Fresh Page Load (No URL Parameters)**
```
URL: http://transportation.minilab/search
```

**Expected Behavior:**
1. Search form renders empty
2. Data table shows "No search performed" message
3. Histogram 1 (Aircraft by Manufacturer) shows "No data - perform search"
4. Histogram 2 (Models by Manufacturer) shows "No data - perform search"
5. **No API call is made** (important - don't search with empty criteria)

**State:**
- `filters`: `{}`
- `results`: `[]`
- `statistics`: `null`
- `hasSearched`: `false`

---

#### **Scenario 2: User Enters Criteria and Clicks Search**
```
User enters: manufacturer="Boeing", yearMin=2000
Clicks "Search" button
```

**Expected Behavior:**
1. URL updates to: `/search?manufacturer=Boeing&yearMin=2000`
2. Loading indicator appears on all components
3. **Single API call** fetches both results AND statistics
4. Search form remains populated with "Boeing" and "2000"
5. Data table displays paginated results (page 1, default 20 items)
6. Histogram 1 shows count distribution across manufacturers (Boeing will be prominent)
7. Histogram 2 shows model count per manufacturer
8. All four components display data from **same API response**

**State:**
- `filters`: `{ manufacturer: "Boeing", yearMin: 2000, page: 1, size: 20 }`
- `results`: `[...aircraft data...]`
- `statistics`: `{ byManufacturer: {...}, modelsByManufacturer: {...} }`
- `hasSearched`: `true`

---

#### **Scenario 3: Page Refresh (F5) After Search**
```
Current URL: /search?manufacturer=Boeing&yearMin=2000&page=2
User presses F5
```

**Expected Behavior:**
1. Application initializes
2. StateManagement reads URL parameters
3. Form hydrates with "Boeing" and "2000", page selector shows "2"
4. **Automatic API call** executes with URL parameters
5. All four components render with results from page 2
6. State is **identical** to pre-refresh state

**Critical Implementation Detail:**
- Router params are read in `ngOnInit`
- API call triggered automatically if URL has search params
- Form uses `patchValue(..., { emitEvent: false })` to prevent duplicate API calls

---

#### **Scenario 4: Unsaved Changes + Browser Back Button**
```
Step 1: User has active search (manufacturer=Boeing)
Step 2: User types "Cessna" in form but DOES NOT click Search
Step 3: User clicks browser back button
Step 4: User clicks browser forward button
```

**Expected Behavior:**

**Step 2 (typing but not searched):**
- Form shows "Cessna"
- URL still shows `?manufacturer=Boeing`
- Data table still shows Boeing results
- Histograms still show Boeing statistics
- **No API call made** (search button not clicked)

**Step 3 (browser back):**
- Navigates to previous URL (e.g., homepage or previous search)
- Form clears or shows previous search
- Components reflect previous page state

**Step 4 (browser forward):**
- Returns to URL: `/search?manufacturer=Boeing`
- Form resets to "Boeing" (URL is source of truth)
- User's unsaved "Cessna" input is **LOST** (correct behavior - URL wins)
- Data table and histograms show Boeing results again

**Design Principle:**
> URL is immutable source of truth. Unsaved form data is intentionally volatile.

---

#### **Scenario 5: Pasted URL with Parameters**
```
User pastes: http://transportation.minilab/search?type=plane&manufacturer=Cessna&yearMin=1990&yearMax=2020&page=3&size=50
```

**Expected Behavior:**
1. Application initializes
2. Form hydrates with all parameters:
   - Type dropdown: "plane"
   - Manufacturer: "Cessna"
   - Year range: 1990-2020
   - Page: 3, Size: 50
3. **Automatic API call** with these exact parameters
4. Data table shows page 3 with 50 results per page
5. Histograms show statistics for Cessna planes 1990-2020
6. User can immediately click "Next Page" and see page 4

**This is the "shareable search" scenario - it must work flawlessly.**

---

#### **Scenario 6: Multi-Tab Behavior**
```
Tab 1: User searches for Boeing
Tab 2: User opens same URL
Tab 3: User pastes Cessna search URL
```

**Expected Behavior:**
- Each tab has independent state
- Tab 1 shows Boeing, Tab 2 shows Boeing, Tab 3 shows Cessna
- URL changes in Tab 1 do NOT affect Tab 2 or Tab 3
- No shared state between tabs (by design - prevents conflicts)

---

#### **Scenario 7: Pagination Within Search Results**
```
Current: /search?manufacturer=Boeing&page=1
User clicks "Next Page"
```

**Expected Behavior:**
1. URL updates to: `/search?manufacturer=Boeing&page=2`
2. **Single API call** for page 2 data
3. Form remains unchanged (manufacturer still "Boeing")
4. Data table shows page 2 results
5. Histograms **remain unchanged** (they show aggregate stats, not per-page)
6. Browser back button returns to page 1

**Implementation Note:**
- Pagination updates `filters.page` only
- Statistics are fetched once per search, cached during pagination

---

#### **Scenario 8: User Preferences (Future Enhancement)**
```
User sets: defaultPageSize = 50 (instead of 20)
User closes browser
User reopens and navigates to /search
```

**Expected Behavior:**
1. Form shows page size dropdown defaulting to "50"
2. When user searches (without specifying size in URL), API uses size=50
3. If URL has `?size=100`, that overrides preference (URL wins)

**Storage:**
- User preferences in `localStorage` (survives browser close)
- But URL parameters **always** override preferences

---

## Architecture Design

### Core Principles

1. **URL as Single Source of Truth**
   - All search state lives in URL query parameters
   - Components react to URL changes
   - Form changes update URL
   - URL changes trigger API calls

2. **Single API Call Pattern**
   - One search = one API call returning results + statistics
   - No separate calls for each component
   - Prevents race conditions and inconsistencies

3. **Reactive Data Flow**
   ```
   URL Changes → State Updates → All Components React
   ```

4. **No Session Storage**
   - Per your requirement
   - Unsaved form data is intentionally volatile

---

### Service Architecture

```
┌─────────────────────────────────────────────────────┐
│                   COMPONENT LAYER                    │
│  ┌──────────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ Search Form  │  │ Results  │  │ Histograms   │  │
│  │  Component   │  │  Table   │  │  (2 types)   │  │
│  └──────┬───────┘  └────┬─────┘  └──────┬───────┘  │
│         │               │                │          │
│         └───────────────┼────────────────┘          │
│                         │                            │
│                    Subscribe to                      │
│                  State Observables                   │
│                         │                            │
└─────────────────────────┼────────────────────────────┘
                          │
┌─────────────────────────▼────────────────────────────┐
│            STATE MANAGEMENT SERVICE                  │
│  ┌────────────────────────────────────────────────┐ │
│  │  Private State (BehaviorSubjects)              │ │
│  │  • filters$                                     │ │
│  │  • results$                                     │ │
│  │  • statistics$                                  │ │
│  │  • loading$                                     │ │
│  │  • error$                                       │ │
│  │  • hasSearched$                                 │ │
│  └────────────────────────────────────────────────┘ │
│                         │                            │
│  Public Methods:                                     │
│  • updateFilters(filters)  ─────► Updates URL       │
│  • performSearch()         ─────► Calls API         │
│  • updateResults(data)                               │
│  • setLoading(bool)                                  │
│  • resetSearch()                                     │
└─────────────────────────┬────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
┌─────────▼──────┐ ┌─────▼──────┐ ┌─────▼──────────┐
│ RouteState     │ │ Storage    │ │ Transport API  │
│ Service        │ │ Service    │ │ Service        │
│                │ │            │ │                │
│ • Reads URL    │ │ • User     │ │ • search()     │
│ • Updates URL  │ │   Prefs    │ │ • getStats()   │
│ • Converts     │ │ • Local    │ │ • Combined     │
│   params<->    │ │   Storage  │ │   endpoint     │
│   filters      │ │            │ │                │
└────────────────┘ └────────────┘ └────────────────┘
```

---

### Implementation Structure

```typescript
// 1. MODELS (models/search-state.model.ts)
export interface SearchFilters {
  q?: string;
  type?: 'plane' | 'automobile';
  manufacturer?: string;
  model?: string;
  yearMin?: number;
  yearMax?: number;
  state?: string;
  status?: string;
  page?: number;
  size?: number;
}

export interface SearchStatistics {
  byManufacturer: { [key: string]: number };      // Histogram 1 data
  modelsByManufacturer: { [key: string]: number }; // Histogram 2 data
  totalCount: number;
  yearDistribution?: { [year: number]: number };
}

export interface SearchState {
  filters: SearchFilters;
  results: Aircraft[];
  statistics: SearchStatistics | null;
  loading: boolean;
  error: string | null;
  hasSearched: boolean;
  totalResults: number;
}

// 2. API RESPONSE (returned from backend)
export interface SearchResponse {
  items: Aircraft[];
  total: number;
  page: number;
  size: number;
  statistics: SearchStatistics;  // Backend computes this in single query
}
```

---

### Key Service: StateManagementService

```typescript
// core/services/state-management.service.ts

@Injectable({ providedIn: 'root' })
export class StateManagementService implements OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Private state
  private stateSubject = new BehaviorSubject<SearchState>({
    filters: {},
    results: [],
    statistics: null,
    loading: false,
    error: null,
    hasSearched: false,
    totalResults: 0
  });

  // Public observables (components subscribe to these)
  public state$ = this.stateSubject.asObservable();
  
  public filters$ = this.state$.pipe(
    map(s => s.filters),
    distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
  );
  
  public results$ = this.state$.pipe(
    map(s => s.results),
    distinctUntilChanged()
  );
  
  public statistics$ = this.state$.pipe(
    map(s => s.statistics),
    distinctUntilChanged()
  );
  
  public loading$ = this.state$.pipe(
    map(s => s.loading),
    distinctUntilChanged()
  );
  
  public error$ = this.state$.pipe(
    map(s => s.error),
    distinctUntilChanged()
  );
  
  public hasSearched$ = this.state$.pipe(
    map(s => s.hasSearched),
    distinctUntilChanged()
  );

  constructor(
    private routeState: RouteStateService,
    private storage: StorageService,
    private api: TransportApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.initializeFromUrl();
    this.watchUrlChanges();
  }

  // ========== INITIALIZATION ==========
  
  private initializeFromUrl(): void {
    // Read URL params on app load
    const urlParams = this.routeState.getCurrentParams();
    const filters = this.routeState.paramsToFilters(urlParams);
    
    // Merge with user preferences (URL wins conflicts)
    const preferences = this.storage.getLocal<UserPreferences>('preferences');
    const mergedFilters: SearchFilters = {
      page: filters.page || 1,
      size: filters.size || preferences?.defaultPageSize || 20,
      ...filters  // URL params override everything
    };
    
    this.updateState({ filters: mergedFilters });
    
    // If URL has search params, auto-execute search
    if (this.hasSearchableFilters(mergedFilters)) {
      this.performSearch();
    }
  }

  private watchUrlChanges(): void {
    // React to browser back/forward, pasted URLs
    this.routeState.queryParams$.pipe(
      takeUntil(this.destroy$),
      debounceTime(100),
      map(params => this.routeState.paramsToFilters(params)),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
    ).subscribe(filters => {
      this.updateState({ filters });
      
      // Auto-search if URL has searchable params
      if (this.hasSearchableFilters(filters)) {
        this.performSearch();
      } else {
        // Clear results if URL params removed
        this.resetResults();
      }
    });
  }

  private hasSearchableFilters(filters: SearchFilters): boolean {
    // Define what constitutes a valid search
    const searchableKeys = ['q', 'type', 'manufacturer', 'model', 'yearMin', 'yearMax', 'state'];
    return searchableKeys.some(key => filters[key as keyof SearchFilters] !== undefined);
  }

  // ========== PUBLIC API ==========
  
  /**
   * Update filters and sync to URL
   * Called by search form
   */
  updateFilters(filters: SearchFilters): void {
    // Reset to page 1 when filters change (not pagination)
    const updatedFilters = { ...filters, page: 1 };
    
    this.updateState({ filters: updatedFilters });
    this.syncStateToUrl();
  }

  /**
   * Execute search with current filters
   * Called explicitly by Search button
   * Called automatically by URL changes
   */
  performSearch(): void {
    const filters = this.stateSubject.value.filters;
    
    if (!this.hasSearchableFilters(filters)) {
      return; // Don't search with empty criteria
    }
    
    this.updateState({ loading: true, error: null });
    
    // Single API call gets results + statistics
    this.api.search(filters).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: SearchResponse) => {
        this.updateState({
          results: response.items,
          statistics: response.statistics,
          totalResults: response.total,
          loading: false,
          hasSearched: true,
          error: null
        });
      },
      error: (error) => {
        console.error('Search failed:', error);
        this.updateState({
          loading: false,
          error: 'Search failed. Please try again.',
          hasSearched: true
        });
      }
    });
  }

  /**
   * Change page within current search
   * Called by pagination component
   */
  updatePage(page: number): void {
    const currentFilters = this.stateSubject.value.filters;
    const updatedFilters = { ...currentFilters, page };
    
    this.updateState({ filters: updatedFilters });
    this.syncStateToUrl();
    this.performSearch(); // Fetch new page
  }

  /**
   * Reset search to initial state
   */
  resetSearch(): void {
    this.updateState({
      filters: {},
      results: [],
      statistics: null,
      hasSearched: false,
      totalResults: 0,
      error: null
    });
    this.routeState.clearAllParams();
  }

  // ========== PRIVATE HELPERS ==========
  
  private updateState(updates: Partial<SearchState>): void {
    const current = this.stateSubject.value;
    this.stateSubject.next({ ...current, ...updates });
  }

  private syncStateToUrl(): void {
    const filters = this.stateSubject.value.filters;
    const params = this.routeState.filtersToParams(filters);
    this.routeState.setParams(params, false); // Add to history
  }

  private resetResults(): void {
    this.updateState({
      results: [],
      statistics: null,
      hasSearched: false,
      totalResults: 0
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

---

### Component Implementation Pattern

#### Search Form Component

```typescript
@Component({
  selector: 'app-aircraft-search',
  template: `
    <form [formGroup]="searchForm" (ngSubmit)="onSearch()">
      <!-- Form fields -->
      <button type="submit" [disabled]="loading$ | async">
        {{ (loading$ | async) ? 'Searching...' : 'Search' }}
      </button>
      <button type="button" (click)="onReset()">Clear</button>
    </form>
  `
})
export class AircraftSearchComponent implements OnInit, OnDestroy {
  searchForm: FormGroup;
  loading$ = this.state.loading$;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private state: StateManagementService
  ) {
    this.searchForm = this.fb.group({
      manufacturer: [''],
      model: [''],
      yearMin: [null],
      yearMax: [null],
      state: ['']
    });
  }

  ngOnInit(): void {
    // CRITICAL: Hydrate form from URL/state
    this.state.filters$.pipe(
      takeUntil(this.destroy$),
      take(1) // Only initial load
    ).subscribe(filters => {
      this.searchForm.patchValue(filters, { emitEvent: false });
    });
  }

  onSearch(): void {
    const formValue = this.searchForm.value;
    
    // Remove empty values
    const filters = Object.keys(formValue).reduce((acc, key) => {
      const value = formValue[key];
      if (value !== null && value !== '' && value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as SearchFilters);
    
    // Update state (which updates URL and triggers search)
    this.state.updateFilters(filters);
    this.state.performSearch();
  }

  onReset(): void {
    this.searchForm.reset();
    this.state.resetSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

#### Results Table Component

```typescript
@Component({
  selector: 'app-results-table',
  template: `
    <div *ngIf="hasSearched$ | async; else noSearch">
      <div *ngIf="loading$ | async">Loading results...</div>
      
      <div *ngIf="error$ | async as error" class="error">{{ error }}</div>
      
      <table *ngIf="!(loading$ | async) && (results$ | async) as results">
        <tr *ngFor="let aircraft of results">
          <td>{{ aircraft.manufacturer }}</td>
          <td>{{ aircraft.model }}</td>
          <td>{{ aircraft.year }}</td>
        </tr>
      </table>
      
      <app-pagination></app-pagination>
    </div>
    
    <ng-template #noSearch>
      <div class="no-search">
        Enter search criteria and click Search to view results
      </div>
    </ng-template>
  `
})
export class ResultsTableComponent {
  results$ = this.state.results$;
  loading$ = this.state.loading$;
  error$ = this.state.error$;
  hasSearched$ = this.state.hasSearched$;

  constructor(private state: StateManagementService) {}
}
```

#### Histogram Component (Reusable)

```typescript
@Component({
  selector: 'app-histogram',
  template: `
    <div *ngIf="hasSearched$ | async; else noData">
      <div *ngIf="loading$ | async">Loading statistics...</div>
      
      <div *ngIf="data$ | async as data" class="histogram">
        <div *ngFor="let item of data | keyvalue" class="bar">
          <span class="label">{{ item.key }}</span>
          <div class="value" [style.width.%]="getWidth(item.value, data)">
            {{ item.value }}
          </div>
        </div>
      </div>
    </div>
    
    <ng-template #noData>
      <div class="no-data">No data - perform a search</div>
    </ng-template>
  `
})
export class HistogramComponent {
  @Input() dataType: 'byManufacturer' | 'modelsByManufacturer' = 'byManufacturer';
  @Input() title: string = 'Distribution';
  
  loading$ = this.state.loading$;
  hasSearched$ = this.state.hasSearched$;
  
  data$ = this.state.statistics$.pipe(
    map(stats => stats ? stats[this.dataType] : null)
  );

  constructor(private state: StateManagementService) {}

  getWidth(value: number, data: { [key: string]: number }): number {
    const max = Math.max(...Object.values(data));
    return (value / max) * 100;
  }
}
```

#### Pagination Component

```typescript
@Component({
  selector: 'app-pagination',
  template: `
    <div class="pagination" *ngIf="totalPages$ | async as totalPages">
      <button (click)="previousPage()" [disabled]="(currentPage$ | async) === 1">
        Previous
      </button>
      <span>Page {{ currentPage$ | async }} of {{ totalPages }}</span>
      <button (click)="nextPage()" [disabled]="(currentPage$ | async) === totalPages">
        Next
      </button>
    </div>
  `
})
export class PaginationComponent {
  currentPage$ = this.state.filters$.pipe(map(f => f.page || 1));
  
  totalPages$ = combineLatest([
    this.state.state$.pipe(map(s => s.totalResults)),
    this.state.filters$.pipe(map(f => f.size || 20))
  ]).pipe(
    map(([total, size]) => Math.ceil(total / size))
  );

  constructor(private state: StateManagementService) {}

  nextPage(): void {
    this.currentPage$.pipe(take(1)).subscribe(page => {
      this.state.updatePage(page + 1);
    });
  }

  previousPage(): void {
    this.currentPage$.pipe(take(1)).subscribe(page => {
      if (page > 1) {
        this.state.updatePage(page - 1);
      }
    });
  }
}
```

---

### Search Page Layout

```typescript
@Component({
  selector: 'app-search-page',
  template: `
    <div class="search-page">
      <!-- Row 1: Search Form -->
      <app-aircraft-search></app-aircraft-search>
      
      <!-- Row 2: Results Table -->
      <app-results-table></app-results-table>
      
      <!-- Row 3: Two Histograms Side-by-Side -->
      <div class="histograms">
        <app-histogram 
          dataType="byManufacturer" 
          title="Aircraft Count by Manufacturer">
        </app-histogram>
        
        <app-histogram 
          dataType="modelsByManufacturer" 
          title="Model Count by Manufacturer">
        </app-histogram>
      </div>
    </div>
  `
})
export class SearchPageComponent {
  // This component is purely layout - no logic needed
  // All child components subscribe to same StateManagementService
}
```

---

## Benefits of This Architecture

### 1. **Data Consistency**
- All components consume same `state$` observables
- Single API call ensures all data comes from same query
- No race conditions or mismatched data

### 2. **URL-Driven State**
- Shareable URLs work perfectly
- Browser navigation works correctly
- Page refresh preserves state
- Deep linking supported

### 3. **Easy Extensibility**
Adding a new component (e.g., "Year Distribution Histogram"):
```typescript
@Component({
  selector: 'app-year-histogram',
  template: `...`
})
export class YearHistogramComponent {
  data$ = this.state.statistics$.pipe(
    map(stats => stats?.yearDistribution || null)
  );
  
  constructor(private state: StateManagementService) {}
}
```

Just inject `StateManagementService` and subscribe to `statistics$` - done!

### 4. **Testability**
Each component can be tested in isolation by mocking `StateManagementService`:
```typescript
const mockState = {
  statistics$: of({ byManufacturer: { Boeing: 50, Cessna: 30 } })
};
```

### 5. **Performance**
- `distinctUntilChanged()` prevents unnecessary re-renders
- Single API call reduces server load
- RxJS operators handle complex async logic cleanly

---

## Implementation Checklist

### Phase 1: Core Services
- [ ] Create `StorageService` (localStorage only)
- [ ] Create `RouteStateService` (URL sync)
- [ ] Create `StateManagementService` (main logic)
- [ ] Update models (SearchFilters, SearchState, SearchStatistics)

### Phase 2: Backend API Update
- [ ] Modify `/api/v1/aircraft` to return statistics in response
- [ ] Add aggregation queries for histogram data
- [ ] Test combined response format

### Phase 3: Component Refactoring
- [ ] Refactor `AircraftSearchComponent` to use state service
- [ ] Create `ResultsTableComponent` (if not exists)
- [ ] Create reusable `HistogramComponent`
- [ ] Create `PaginationComponent`
- [ ] Update `SearchPageComponent` layout

### Phase 4: Testing
- [ ] Test fresh load
- [ ] Test search submission
- [ ] Test page refresh
- [ ] Test browser back/forward
- [ ] Test pasted URLs
- [ ] Test pagination

---

## Questions for You

1. **Backend API**: Does your current `/api/v1/aircraft` endpoint return statistics, or do we need to add that?

2. **Statistics Data**: What aggregations do you want for the histograms? (e.g., top 10 manufacturers, all manufacturers, specific groupings?)

3. **User Preferences**: Do you want to implement localStorage for preferences now, or wait until later?

4. **Implementation Order**: Should we start with services first, or refactor existing search component first?

Let me know and I'll provide step-by-step implementation instructions!
