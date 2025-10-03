import { Injectable, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';
import { map, distinctUntilChanged, takeUntil, filter } from 'rxjs/operators';
import { SearchState, SearchFilters, SearchStatistics } from '../../models';
import { RouteStateService } from './route-state.service';
import { ApiService } from '../../services/api.service';

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

  constructor(
    private routeState: RouteStateService,
    private api: ApiService,
    private router: Router
  ) {
    this.initializeFromUrl();
    this.watchUrlChanges();
  }

  private getInitialState(): SearchState {
    return {
      filters: {
        page: 1,
        size: 20
      },
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
    const params = this.routeState.getCurrentParams();
    const filters = this.routeState.paramsToFilters(params);
    const selectedManufacturer = params['mfr'] || null;

    this.updateState({
      filters,
      selectedManufacturer
    });

    if (this.hasSearchableFilters(filters)) {
      this.performSearch();
    }
  }

  private watchUrlChanges(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      const params = this.routeState.getCurrentParams();
      const filters = this.routeState.paramsToFilters(params);
      const selectedManufacturer = params['mfr'] || null;
      
      const currentState = this.stateSubject.value;
      
      // Only update if something actually changed
      if (JSON.stringify(filters) !== JSON.stringify(currentState.filters) ||
          selectedManufacturer !== currentState.selectedManufacturer) {
        
        this.updateState({ 
          filters,
          selectedManufacturer 
        });

        if (this.hasSearchableFilters(filters)) {
          this.performSearch();
        } else {
          this.resetResults();
        }
      }
    });
  }

  private hasSearchableFilters(filters: SearchFilters): boolean {
    // Check for manufacturer-state combinations
    if (filters.manufacturerStateCombos && filters.manufacturerStateCombos.length > 0) {
      return true;
    }

    return !!(
      filters.q ||
      filters.manufacturer ||
      filters.model ||
      filters.yearMin ||
      filters.yearMax ||
      filters.state ||
      filters.status
    );
  }

  private updateState(updates: Partial<SearchState>): void {
    const current = this.stateSubject.value;
    this.stateSubject.next({ ...current, ...updates });
  }

  private syncStateToUrl(): void {
    const state = this.stateSubject.value;
    const params = this.routeState.filtersToParams(state.filters);
    
    // Add selectedManufacturer to URL params
    if (state.selectedManufacturer) {
      params['mfr'] = state.selectedManufacturer;
    }
    
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

  // ========== PUBLIC METHODS ==========

  updateFilters(filters: SearchFilters): void {
    const currentFilters = this.stateSubject.value.filters;
    const newFilters = {
      ...currentFilters,
      ...filters,
      page: 1  // Reset to page 1 on filter change
    };

    this.updateState({ filters: newFilters });
    this.syncStateToUrl();

    if (this.hasSearchableFilters(newFilters)) {
      this.performSearch();
    } else {
      this.resetResults();
    }
  }

  performSearch(): void {
    const filters = this.stateSubject.value.filters;

    if (!this.hasSearchableFilters(filters)) {
      this.resetResults();
      return;
    }

    this.updateState({ loading: true, error: null });

    this.api.searchAircraft(filters).subscribe({
      next: (response) => {
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
        this.updateState({
          loading: false,
          error: 'Failed to load search results. Please try again.',
          results: [],
          statistics: null,
          hasSearched: true
        });
        console.error('Search error:', error);
      }
    });
  }

  updatePage(page: number): void {
    const currentFilters = this.stateSubject.value.filters;
    const newFilters = { ...currentFilters, page };

    this.updateState({ filters: newFilters });
    this.syncStateToUrl();
    this.performSearch();
  }

  selectManufacturer(manufacturer: string | null): void {
    this.updateState({ selectedManufacturer: manufacturer });
    this.syncStateToUrl();
  }

  resetSearch(): void {
    const initialFilters: SearchFilters = {
      page: 1,
      size: 20
    };

    this.updateState({
      filters: initialFilters,
      results: [],
      statistics: null,
      hasSearched: false,
      totalResults: 0,
      error: null,
      selectedManufacturer: null
    });

    this.syncStateToUrl();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
