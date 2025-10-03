This is where the architecture shows its strength. Here's how it handles this scenario:

## The Pattern

```typescript
// Component AA (Date Range Selector)
export class ComponentAA {
  onDateRangeChange(dateFrom: string, dateTo: string): void {
    // Update shared filters
    this.state.updateFilters({
      ...this.getCurrentFilters(),
      dateFrom,
      dateTo
    });
    
    // AA might trigger its own search or just update filters
  }
}

// Component BB (Planes by Date)
export class ComponentBB {
  private destroy$ = new Subject<void>();
  planes$ = new BehaviorSubject<Plane[]>([]);
  
  constructor(
    private state: StateManagementService,
    private api: TransportApiService
  ) {}
  
  ngOnInit(): void {
    // Listen to date range changes
    this.state.filters$.pipe(
      takeUntil(this.destroy$),
      map(filters => ({ dateFrom: filters.dateFrom, dateTo: filters.dateTo })),
      distinctUntilChanged((a, b) => 
        a.dateFrom === b.dateFrom && a.dateTo === b.dateTo
      ),
      switchMap(dates => {
        // Make API call with BB's specific parameters + shared dates
        return this.api.search({
          type: 'plane',              // BB-specific
          dateFrom: dates.dateFrom,   // Shared from AA
          dateTo: dates.dateTo        // Shared from AA
        });
      })
    ).subscribe(response => {
      this.planes$.next(response.items);
    });
  }
}

// Component CC (Autos by Date)
export class ComponentCC {
  private destroy$ = new Subject<void>();
  autos$ = new BehaviorSubject<Auto[]>([]);
  
  constructor(
    private state: StateManagementService,
    private api: TransportApiService
  ) {}
  
  ngOnInit(): void {
    // Listen to SAME date range changes
    this.state.filters$.pipe(
      takeUntil(this.destroy$),
      map(filters => ({ dateFrom: filters.dateFrom, dateTo: filters.dateTo })),
      distinctUntilChanged((a, b) => 
        a.dateFrom === b.dateFrom && a.dateTo === b.dateTo
      ),
      switchMap(dates => {
        // Different API call with CC's specific parameters + shared dates
        return this.api.search({
          type: 'automobile',         // CC-specific
          dateFrom: dates.dateFrom,   // Shared from AA
          dateTo: dates.dateTo        // Shared from AA
        });
      })
    ).subscribe(response => {
      this.autos$.next(response.items);
    });
  }
}
```

## Key Points

**1. Shared State, Component-Specific Queries**
- All components watch `filters$` for the date range
- Each component adds its own query parameters when calling the API
- They're synchronized on shared values, independent on specific values

**2. The `distinctUntilChanged` Pattern**
```typescript
map(filters => ({ dateFrom: filters.dateFrom, dateTo: filters.dateTo })),
distinctUntilChanged((a, b) => 
  a.dateFrom === b.dateFrom && a.dateTo === b.dateTo
)
```
This ensures BB and CC only re-query when **dates actually change**, not when unrelated filters (like `manufacturer`) change.

**3. The `switchMap` Pattern**
```typescript
switchMap(dates => this.api.search({...}))
```
Automatically cancels previous API call if dates change again before first call completes. Prevents race conditions.

## Real-World Flow

```
User Action: AA changes dateFrom to "2020-01-01"
    │
    ├─> state.updateFilters({ dateFrom: "2020-01-01" })
    │
    ├─> URL updates: ?dateFrom=2020-01-01&dateTo=2023-12-31
    │
    ├─> filters$ emits new value
    │
    ├─> BB's subscription fires
    │   └─> API call: /search?type=plane&dateFrom=2020-01-01&dateTo=2023-12-31
    │       └─> BB updates its planes$ with new data
    │
    └─> CC's subscription fires
        └─> API call: /search?type=automobile&dateFrom=2020-01-01&dateTo=2023-12-31
            └─> CC updates its autos$ with new data
```

## Alternative: Derived State Pattern

If BB and CC need more complex coordination:

```typescript
// In StateManagementService
public planesInDateRange$ = combineLatest([
  this.filters$,
  this.api.searchPlanes$ // Assuming reactive API service
]).pipe(
  switchMap(([filters, _]) => 
    this.api.search({ type: 'plane', ...filters })
  ),
  shareReplay(1)
);

public autosInDateRange$ = combineLatest([
  this.filters$,
  this.api.searchAutos$
]).pipe(
  switchMap(([filters, _]) => 
    this.api.search({ type: 'automobile', ...filters })
  ),
  shareReplay(1)
);
```

Then BB and CC just subscribe:
```typescript
// Component BB
planes$ = this.state.planesInDateRange$;

// Component CC  
autos$ = this.state.autosInDateRange$;
```

## Summary

The architecture handles this because:
- **Shared filters** propagate to all components
- **Each component** independently interprets filters for its context
- **RxJS operators** (`distinctUntilChanged`, `switchMap`) ensure efficient, synchronized updates
- **No tight coupling** - components don't know about each other

This is the reactive programming model working as designed: multiple observers responding to the same source of truth with their own specialized logic.
