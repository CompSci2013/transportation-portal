import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { map, distinctUntilChanged, takeUntil, take } from 'rxjs/operators';
import { SearchFilters, SearchState, SearchStatistics, SearchResponse } from '../../models';
import { RouteStateService } from './route-state.service';
import { StorageService } from './storage.service';
import { ApiService } from '../../services/api.service';

/**
 * StateManagementService
 * 
 * Core state orchestrator for the application
 * - URL is single source of truth
 * - Coordinates between RouteState, Storage, and API services
 * - Provides reactive state observables for components
 */
@Injectable({
  providedIn: 'root'
})
export class StateManagementService implements OnDestroy {
  private destroy$ = new Subject<void>();
  
  // ========== PRIVATE STATE ==========
  
  private stateSubject = new BehaviorSubject<SearchState>(this.getInitialState());
  
  // ========== PUBLIC OBSERVABLES ==========
  
  public state$ = this.stateSubject.asObservable();
  
  public filters$ = this.state$.pipe(
    map(state => state.filters),
    distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
  );
  
  public results$ = this.state$.pipe(
    map(state => state.results),
    distinctUntilChanged()
  );
  
  public statistics$ = this.state$.pipe(
    map(state => state.statistics),
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
  
  public hasSearched$ = this.state$.pipe(
    map(state => state.hasSearched),
    distinctUntilChanged()
  );
  
  public totalResults$ = this.state$.pipe(
    map(state => state.totalResults),
    distinctUntilChanged()
  );
  
  public selectedManufacturer$ = this.state$.pipe(
    map(state => state.selectedManufacturer),
    distinctUntilChanged()
  );

  constructor(
    private routeState: RouteStateService,
    private storage: StorageService,
    private api: ApiService
  ) {
    this.initializeFromUrl();
    this.watchUrlChanges();
  }

  // ========== INITIALIZATION ==========
  
  private getInitialState(): SearchState {
    return {
      filters: {},
      results: [],
      statistics: null,
      loading: false,
      error: null,
      hasSearched: false,
      totalResults: 0,
      selectedManufacturer: null
    };
  }
  
  private initializeFromUrl(): void {
    const urlParams = this.routeState.getCurrentParams();
    const filters = this.routeState.paramsToFilters(urlParams);
    
    // Merge with default page size (could load from user preferences later)
    const mergedFilters: SearchFilters = {
      page: filters.page || 1,
      size: filters.size || 20,
      ...filters
    };
    
    this.updateState({ filters: mergedFilters });
    
    // Auto-execute search if URL has searchable params
    if (this.hasSearchableFilters(mergedFilters)) {
      this.performSearch();
    }
  }
  
  private watchUrlChanges(): void {
    this.routeState.queryParams$.pipe(
      takeUntil(this.destroy$),
      map(params => this.routeState.paramsToFilters(params)),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
    ).subscribe(filters => {
      this.updateState({ filters });
      
      if (this.hasSearchableFilters(filters)) {
        this.performSearch();
      } else {
        this.resetResults();
      }
    });
  }
  
  private hasSearchableFilters(filters: SearchFilters): boolean {
    const searchableKeys = ['q', 'type', 'manufacturer', 'model', 'yearMin', 'yearMax', 'state'];
    return searchableKeys.some(key => filters[key as keyof SearchFilters] !== undefined);
  }

  // ========== PUBLIC API ==========
  
  /**
   * Update filters and sync to URL
   * Called by search form
   */
  updateFilters(filters: SearchFilters): void {
    const updatedFilters = { ...filters, page: 1 };
    this.updateState({ filters: updatedFilters });
    this.syncStateToUrl();
  }
  
  /**
   * Execute search with current filters
   * Called explicitly by Search button or automatically by URL changes
   */
  performSearch(): void {
    const filters = this.stateSubject.value.filters;
    
    if (!this.hasSearchableFilters(filters)) {
      return;
    }
    
    this.updateState({ loading: true, error: null });
    
    this.api.searchAircraft(filters).pipe(
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
    this.performSearch();
  }
  
  /**
   * Select manufacturer for Histogram 2 detail view
   * Called when clicking a bar in Histogram 1
   */
  selectManufacturer(manufacturer: string | null): void {
    this.updateState({ selectedManufacturer: manufacturer });
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
      error: null,
      selectedManufacturer: null
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
    this.routeState.setParams(params, false);
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
