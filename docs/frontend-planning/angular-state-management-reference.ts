/**
 * Transportation Portal - Complete RxJS State Management Implementation
 * 
 * Angular 13 compatible
 * Features:
 * - URL as source of truth
 * - Handles browser back/forward
 * - Handles page refresh
 * - Handles pasted URLs with parameters
 * - localStorage for preferences
 * - sessionStorage for draft data
 * - Proper hydration priority
 */

// ============================================================================
// 1. MODELS & INTERFACES
// ============================================================================

// models/search-filters.model.ts
export interface SearchFilters {
  q?: string;                    // Text search
  type?: 'plane' | 'automobile'; // Transport type
  manufacturer?: string;
  model?: string;
  year?: number;
  yearMin?: number;
  yearMax?: number;
  country?: string;
  status?: string;
  page?: number;
  size?: number;
  sort?: string;
  sortDirection?: 'asc' | 'desc';
}

// models/app-state.model.ts
export interface AppState {
  filters: SearchFilters;
  results: Transport[];
  loading: boolean;
  error: string | null;
  totalResults: number;
  user: User | null;
}

// models/storage-keys.enum.ts
export enum StorageKey {
  // localStorage (persists across sessions)
  USER_PREFERENCES = 'userPreferences',
  DEFAULT_PAGE_SIZE = 'defaultPageSize',
  THEME = 'theme',
  RECENT_SEARCHES = 'recentSearches',
  
  // sessionStorage (persists only in tab)
  DRAFT_FILTERS = 'draftFilters',
  SCROLL_POSITION = 'scrollPosition',
  EXPANDED_SECTIONS = 'expandedSections'
}

// models/user-preferences.model.ts
export interface UserPreferences {
  defaultPageSize: number;
  defaultView: 'table' | 'cards';
  theme: 'light' | 'dark';
  defaultDateRange: number;
}


// ============================================================================
// 2. STORAGE SERVICE (Abstraction Layer)
// ============================================================================

// core/services/storage.service.ts
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly namespace = 'transport:';

  // ========== LOCAL STORAGE (survives browser close) ==========
  
  setLocal<T>(key: string, value: T): void {
    try {
      const prefixedKey = `${this.namespace}local:${key}`;
      localStorage.setItem(prefixedKey, JSON.stringify(value));
    } catch (error) {
      console.error('localStorage.setItem failed:', error);
      // Handle quota exceeded
    }
  }

  getLocal<T>(key: string): T | null {
    try {
      const prefixedKey = `${this.namespace}local:${key}`;
      const item = localStorage.getItem(prefixedKey);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('localStorage.getItem failed:', error);
      return null;
    }
  }

  removeLocal(key: string): void {
    const prefixedKey = `${this.namespace}local:${key}`;
    localStorage.removeItem(prefixedKey);
  }

  // ========== SESSION STORAGE (survives refresh, not tab close) ==========
  
  setSession<T>(key: string, value: T): void {
    try {
      const prefixedKey = `${this.namespace}session:${key}`;
      sessionStorage.setItem(prefixedKey, JSON.stringify(value));
    } catch (error) {
      console.error('sessionStorage.setItem failed:', error);
    }
  }

  getSession<T>(key: string): T | null {
    try {
      const prefixedKey = `${this.namespace}session:${key}`;
      const item = sessionStorage.getItem(prefixedKey);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('sessionStorage.getItem failed:', error);
      return null;
    }
  }

  removeSession(key: string): void {
    const prefixedKey = `${this.namespace}session:${key}`;
    sessionStorage.removeItem(prefixedKey);
  }

  // ========== UTILITIES ==========
  
  clearAll(): void {
    // Clear only our namespaced items
    this.clearStorage(localStorage);
    this.clearStorage(sessionStorage);
  }

  private clearStorage(storage: Storage): void {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && key.startsWith(this.namespace)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => storage.removeItem(key));
  }

  // Check available quota
  getStorageInfo(): { used: number; available: number } | null {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      // Modern API (async, but we return null for now)
      return null;
    }
    return null;
  }
}


// ============================================================================
// 3. ROUTE STATE SERVICE (URL Synchronization)
// ============================================================================

// core/services/route-state.service.ts
import { Injectable } from '@angular/core';
import { Router, ActivatedRoute, Params, NavigationEnd } from '@angular/router';
import { Observable, BehaviorSubject } from 'rxjs';
import { filter, map, distinctUntilChanged } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class RouteStateService {
  private queryParamsSubject = new BehaviorSubject<Params>({});
  public queryParams$ = this.queryParamsSubject.asObservable();

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.initQueryParamsListener();
  }

  // ========== INITIALIZATION ==========
  
  private initQueryParamsListener(): void {
    // Listen to all navigation events
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      // Get current query params
      const params = this.route.snapshot.queryParamMap;
      const paramsObject: Params = {};
      
      params.keys.forEach(key => {
        paramsObject[key] = params.get(key);
      });
      
      this.queryParamsSubject.next(paramsObject);
    });
    
    // Emit initial params
    const initialParams = this.getCurrentParams();
    this.queryParamsSubject.next(initialParams);
  }

  // ========== READ URL PARAMS ==========
  
  getCurrentParams(): Params {
    const params = this.route.snapshot.queryParamMap;
    const paramsObject: Params = {};
    
    params.keys.forEach(key => {
      paramsObject[key] = params.get(key);
    });
    
    return paramsObject;
  }

  getParam(key: string): string | null {
    return this.route.snapshot.queryParamMap.get(key);
  }

  watchParam(key: string): Observable<string | null> {
    return this.queryParams$.pipe(
      map(params => params[key] || null),
      distinctUntilChanged()
    );
  }

  // ========== WRITE URL PARAMS ==========
  
  updateParams(params: Params, replaceUrl = false): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge', // Merge with existing params
      replaceUrl: replaceUrl         // false = add to history, true = replace
    });
  }

  setParams(params: Params, replaceUrl = false): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: '', // Replace all params
      replaceUrl: replaceUrl
    });
  }

  removeParam(key: string): void {
    const current = this.getCurrentParams();
    delete current[key];
    this.setParams(current);
  }

  clearAllParams(): void {
    this.setParams({});
  }

  // ========== CONVERSIONS ==========
  
  // Convert SearchFilters to URL params
  filtersToParams(filters: SearchFilters): Params {
    const params: Params = {};
    
    Object.keys(filters).forEach(key => {
      const value = (filters as any)[key];
      if (value !== undefined && value !== null && value !== '') {
        params[key] = String(value);
      }
    });
    
    return params;
  }

  // Convert URL params to SearchFilters
  paramsToFilters(params: Params): SearchFilters {
    const filters: SearchFilters = {};
    
    if (params['q']) filters.q = params['q'];
    if (params['type']) filters.type = params['type'] as 'plane' | 'automobile';
    if (params['manufacturer']) filters.manufacturer = params['manufacturer'];
    if (params['model']) filters.model = params['model'];
    if (params['year']) filters.year = parseInt(params['year'], 10);
    if (params['yearMin']) filters.yearMin = parseInt(params['yearMin'], 10);
    if (params['yearMax']) filters.yearMax = parseInt(params['yearMax'], 10);
    if (params['country']) filters.country = params['country'];
    if (params['status']) filters.status = params['status'];
    if (params['page']) filters.page = parseInt(params['page'], 10);
    if (params['size']) filters.size = parseInt(params['size'], 10);
    if (params['sort']) filters.sort = params['sort'];
    if (params['sortDirection']) filters.sortDirection = params['sortDirection'] as 'asc' | 'desc';
    
    return filters;
  }
}


// ============================================================================
// 4. STATE MANAGEMENT SERVICE (Core Logic)
// ============================================================================

// core/services/state-management.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, distinctUntilChanged, debounceTime, tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class StateManagementService {
  // ========== STATE SUBJECTS ==========
  
  private stateSubject = new BehaviorSubject<AppState>(this.getInitialState());
  public state$ = this.stateSubject.asObservable();

  // ========== DERIVED OBSERVABLES ==========
  
  public filters$ = this.state$.pipe(
    map(state => state.filters),
    distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
  );

  public results$ = this.state$.pipe(
    map(state => state.results),
    distinctUntilChanged()
  );

  public loading$ = this.state$.pipe(
    map(state => state.loading),
    distinctUntilChanged()
  );

  public error$ = this.state$.pipe(
    map(state => state.error),
    distinctUntilChanged()
  );

  public totalResults$ = this.state$.pipe(
    map(state => state.totalResults),
    distinctUntilChanged()
  );

  public user$ = this.state$.pipe(
    map(state => state.user),
    distinctUntilChanged()
  );

  constructor(
    private storage: StorageService,
    private routeState: RouteStateService
  ) {
    this.initializeStateFromSources();
    this.syncUrlToState();
  }

  // ========== INITIALIZATION ==========
  
  private getInitialState(): AppState {
    return {
      filters: {},
      results: [],
      loading: false,
      error: null,
      totalResults: 0,
      user: null
    };
  }

  private initializeStateFromSources(): void {
    // Priority: URL > Session > Local > Defaults
    
    // 1. Get URL params (HIGHEST PRIORITY)
    const urlParams = this.routeState.getCurrentParams();
    const urlFilters = this.routeState.paramsToFilters(urlParams);
    
    // 2. Get session storage (draft data)
    const sessionFilters = this.storage.getSession<SearchFilters>(StorageKey.DRAFT_FILTERS);
    
    // 3. Get local storage (user preferences)
    const preferences = this.storage.getLocal<UserPreferences>(StorageKey.USER_PREFERENCES);
    
    // 4. Build merged state (URL wins all conflicts)
    const mergedFilters: SearchFilters = {
      // Defaults
      page: 1,
      size: preferences?.defaultPageSize || 50,
      
      // Session data (if no URL params)
      ...(Object.keys(urlFilters).length === 0 ? sessionFilters : {}),
      
      // URL params (always win)
      ...urlFilters
    };
    
    // Update state
    this.updateState({
      filters: mergedFilters
    });
    
    // Ensure URL reflects current state (in case we loaded from session/local)
    if (Object.keys(urlFilters).length === 0 && Object.keys(mergedFilters).length > 0) {
      this.syncStateToUrl(false); // Don't add to history
    }
  }

  private syncUrlToState(): void {
    // Listen to URL changes (back/forward button, pasted URLs)
    this.routeState.queryParams$.pipe(
      debounceTime(100), // Prevent rapid fire
      map(params => this.routeState.paramsToFilters(params))
    ).subscribe(filtersFromUrl => {
      // Update state from URL
      this.updateState({
        filters: filtersFromUrl
      });
    });
  }

  // ========== STATE UPDATES ==========
  
  private updateState(updates: Partial<AppState>): void {
    const current = this.stateSubject.value;
    const newState = { ...current, ...updates };
    this.stateSubject.next(newState);
  }

  updateFilters(filters: SearchFilters): void {
    // Update state
    this.updateState({ filters });
    
    // Sync to URL (source of truth)
    this.syncStateToUrl(true);
    
    // Save to session storage (draft)
    this.storage.setSession(StorageKey.DRAFT_FILTERS, filters);
  }

  updateResults(results: Transport[], total: number): void {
    this.updateState({
      results,
      totalResults: total,
      loading: false,
      error: null
    });
  }

  setLoading(loading: boolean): void {
    this.updateState({ loading });
  }

  setError(error: string): void {
    this.updateState({
      error,
      loading: false
    });
  }

  clearError(): void {
    this.updateState({ error: null });
  }

  // ========== URL SYNCHRONIZATION ==========
  
  private syncStateToUrl(addToHistory = true): void {
    const filters = this.stateSubject.value.filters;
    const params = this.routeState.filtersToParams(filters);
    this.routeState.updateParams(params, !addToHistory);
  }

  // ========== USER PREFERENCES ==========
  
  updatePreferences(preferences: Partial<UserPreferences>): void {
    const current = this.storage.getLocal<UserPreferences>(StorageKey.USER_PREFERENCES) || {
      defaultPageSize: 50,
      defaultView: 'table',
      theme: 'light',
      defaultDateRange: 30
    };
    
    const updated = { ...current, ...preferences };
    this.storage.setLocal(StorageKey.USER_PREFERENCES, updated);
  }

  getPreferences(): UserPreferences {
    return this.storage.getLocal<UserPreferences>(StorageKey.USER_PREFERENCES) || {
      defaultPageSize: 50,
      defaultView: 'table',
      theme: 'light',
      defaultDateRange: 30
    };
  }

  // ========== RESET ==========
  
  resetFilters(): void {
    this.updateFilters({});
    this.storage.removeSession(StorageKey.DRAFT_FILTERS);
  }

  clearAllState(): void {
    this.stateSubject.next(this.getInitialState());
    this.storage.clearAll();
    this.routeState.clearAllParams();
  }
}


// ============================================================================
// 5. APP INITIALIZER (Bootstrap Setup)
// ============================================================================

// app.module.ts
import { APP_INITIALIZER, NgModule } from '@angular/core';

export function initializeApp(
  stateManagement: StateManagementService,
  // Add auth service when ready
  // authService: AuthService
): () => Promise<void> {
  return () => {
    return new Promise((resolve) => {
      // State management initializes in constructor
      // Just need to ensure it's instantiated
      
      // Future: Check authentication
      // authService.checkAuth().subscribe();
      
      // Future: Load user preferences from server
      // configService.loadConfig().subscribe();
      
      resolve();
    });
  };
}

@NgModule({
  // ... other config
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [StateManagementService],
      multi: true
    }
  ]
})
export class AppModule { }


// ============================================================================
// 6. COMPONENT USAGE EXAMPLES
// ============================================================================

// ========== Example 1: Search Component ==========

// features/search/search.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-search',
  template: `
    <form [formGroup]="searchForm">
      <input formControlName="q" placeholder="Search...">
      <select formControlName="type">
        <option value="">All Types</option>
        <option value="plane">Planes</option>
        <option value="automobile">Automobiles</option>
      </select>
      <input formControlName="manufacturer" placeholder="Manufacturer">
      <button type="button" (click)="clearFilters()">Clear</button>
    </form>
    
    <div *ngIf="loading$ | async">Loading...</div>
    <div *ngIf="error$ | async as error">{{ error }}</div>
    
    <div *ngFor="let result of results$ | async">
      {{ result.manufacturer }} {{ result.model }}
    </div>
  `
})
export class SearchComponent implements OnInit, OnDestroy {
  searchForm: FormGroup;
  
  filters$ = this.state.filters$;
  results$ = this.state.results$;
  loading$ = this.state.loading$;
  error$ = this.state.error$;
  
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private state: StateManagementService,
    private api: TransportApiService // Your API service
  ) {
    this.searchForm = this.fb.group({
      q: [''],
      type: [''],
      manufacturer: [''],
      model: [''],
      year: [null]
    });
  }

  ngOnInit(): void {
    // CRITICAL: Hydrate form from state (which came from URL)
    this.state.filters$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(filters => {
      // Update form WITHOUT triggering valueChanges
      this.searchForm.patchValue(filters, { emitEvent: false });
      
      // Perform search with these filters
      this.performSearch(filters);
    });

    // Listen to form changes and update state
    this.searchForm.valueChanges.pipe(
      takeUntil(this.destroy$),
      debounceTime(300),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
    ).subscribe(formValue => {
      // Update state (which updates URL)
      this.state.updateFilters(formValue);
    });
  }

  private performSearch(filters: SearchFilters): void {
    if (Object.keys(filters).length === 0) {
      return; // Don't search with no filters
    }
    
    this.state.setLoading(true);
    
    this.api.search(filters).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.state.updateResults(response.items, response.total);
      },
      error: (error) => {
        this.state.setError('Search failed. Please try again.');
        console.error('Search error:', error);
      }
    });
  }

  clearFilters(): void {
    this.state.resetFilters();
    this.searchForm.reset();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}


// ========== Example 2: Simple Component (Read-Only State) ==========

// features/results-summary/results-summary.component.ts
@Component({
  selector: 'app-results-summary',
  template: `
    <div class="summary">
      <span>Found {{ totalResults$ | async }} results</span>
      <span *ngIf="filters$ | async as filters">
        <ng-container *ngIf="filters.type">
          for {{ filters.type }}
        </ng-container>
      </span>
    </div>
  `
})
export class ResultsSummaryComponent {
  totalResults$ = this.state.totalResults$;
  filters$ = this.state.filters$;

  constructor(private state: StateManagementService) {}
}


// ========== Example 3: Pagination Component ==========

@Component({
  selector: 'app-pagination',
  template: `
    <div class="pagination">
      <button 
        (click)="previousPage()" 
        [disabled]="(currentPage$ | async) === 1">
        Previous
      </button>
      
      <span>Page {{ currentPage$ | async }} of {{ totalPages$ | async }}</span>
      
      <button 
        (click)="nextPage()"
        [disabled]="(currentPage$ | async) === (totalPages$ | async)">
        Next
      </button>
    </div>
  `
})
export class PaginationComponent {
  currentPage$ = this.state.filters$.pipe(
    map(filters => filters.page || 1)
  );
  
  totalPages$ = combineLatest([
    this.state.totalResults$,
    this.state.filters$
  ]).pipe(
    map(([total, filters]) => {
      const pageSize = filters.size || 50;
      return Math.ceil(total / pageSize);
    })
  );

  constructor(private state: StateManagementService) {}

  nextPage(): void {
    this.state.filters$.pipe(take(1)).subscribe(filters => {
      const currentPage = filters.page || 1;
      this.state.updateFilters({
        ...filters,
        page: currentPage + 1
      });
    });
  }

  previousPage(): void {
    this.state.filters$.pipe(take(1)).subscribe(filters => {
      const currentPage = filters.page || 1;
      if (currentPage > 1) {
        this.state.updateFilters({
          ...filters,
          page: currentPage - 1
        });
      }
    });
  }
}


// ============================================================================
// 7. TESTING SCENARIOS
// ============================================================================

/**
 * TEST SCENARIOS - All Should Work:
 * 
 * 1. FRESH LOAD
 *    - Navigate to /search
 *    - Should show empty form
 *    - Should not trigger search
 * 
 * 2. PASTED URL
 *    - Paste: /search?type=plane&manufacturer=boeing&page=2
 *    - Form should populate with these values
 *    - Search should execute automatically
 *    - Results should show page 2 of Boeing planes
 * 
 * 3. BROWSER BACK BUTTON
 *    - User searches for "boeing"
 *    - User searches for "cessna"
 *    - User clicks back button
 *    - Should return to "boeing" search
 *    - Form should show "boeing"
 *    - Results should show boeing results
 * 
 * 4. BROWSER FORWARD BUTTON
 *    - After clicking back (above scenario)
 *    - User clicks forward button
 *    - Should return to "cessna" search
 * 
 * 5. PAGE REFRESH (F5)
 *    - User has active search with filters
 *    - User presses F5
 *    - Page reloads
 *    - URL params preserved
 *    - Form populates from URL
 *    - Search executes with same filters
 *    - Results match pre-refresh state
 * 
 * 6. BOOKMARK/SHARE
 *    - User copies URL: /search?type=automobile&year=2020
 *    - User pastes in new browser tab
 *    - Search executes with these exact filters
 *    - Results show 2020 automobiles
 * 
 * 7. MULTI-TAB
 *    - Open search in Tab 1
 *    - Search for "boeing"
 *    - Open same URL in Tab 2
 *    - Both tabs show same results
 *    - Changes in Tab 1 don't affect Tab 2 (separate session)
 * 
 * 8. PREFERENCES PERSIST
 *    - User sets pageSize to 100
 *    - User closes browser
 *    - User reopens browser
 *    - pageSize still 100
 *    - But URL params override if present
 */


// ============================================================================
// 8. KEY PRINCIPLES DEMONSTRATED
// ============================================================================

/**
 * STATE PRIORITY HIERARCHY (Enforced):
 * 
 * 1. URL Query Params      (HIGHEST - Source of truth)
 * 2. Session Storage       (Tab-specific drafts)
 * 3. Local Storage         (User preferences)
 * 4. Application Defaults  (LOWEST - Fallback)
 * 
 * URL ALWAYS WINS!
 * - When URL has params, they override everything
 * - When form changes, URL updates immediately
 * - When back button pressed, URL changes, form updates
 * - When page refreshes, URL persists, state rebuilds from URL
 */

/**
 * CRITICAL PATTERNS:
 * 
 * 1. Form hydration: ALWAYS use { emitEvent: false } when patching from state
 * 2. URL sync: ALWAYS update URL when state changes
 * 3. State sync: ALWAYS update state when URL changes
 * 4. Subscription cleanup: ALWAYS use takeUntil pattern
 * 5. Distinctness: ALWAYS use distinctUntilChanged for efficiency
 */

/**
 * WHAT THIS SOLVES:
 * 
 * ✅ Browser back/forward buttons work correctly
 * ✅ Page refresh preserves state
 * ✅ URLs are shareable/bookmarkable
 * ✅ Deep linking works
 * ✅ Multi-tab scenarios handled
 * ✅ User preferences persist across sessions
 * ✅ Draft data persists within session
 * ✅ No state pollution between tabs
 * ✅ Single source of truth (URL)
 * ✅ Testable architecture
 */

