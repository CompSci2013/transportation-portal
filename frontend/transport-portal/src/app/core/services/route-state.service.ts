import { Injectable } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { SearchFilters } from '../../models';

/**
 * RouteStateService
 * 
 * Handles URL query parameter synchronization
 * Pure URL operations - no business logic or API calls
 */
@Injectable({
  providedIn: 'root'
})
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
    // Subscribe to route query params changes
    this.route.queryParams.subscribe(params => {
      this.queryParamsSubject.next(params);
    });
  }

  // ========== READ URL PARAMS ==========
  
  getCurrentParams(): Params {
    return this.route.snapshot.queryParams;
  }

  getParam(key: string): string | null {
    return this.route.snapshot.queryParams[key] || null;
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
      queryParamsHandling: 'merge',
      replaceUrl: replaceUrl
    });
  }

  setParams(params: Params, replaceUrl = false): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: '',
      replaceUrl: replaceUrl
    });
  }

  removeParam(key: string): void {
    const current = this.getCurrentParams();
    delete current[key];
    this.setParams(current);
  }

  clearAllParams(): void {
    this.setParams({}, true);
  }

  // ========== CONVERSIONS ==========
  
  filtersToParams(filters: SearchFilters): Params {
    const params: Params = {};
    
    // Handle manufacturer-state combinations
    if (filters.manufacturerStateCombos && filters.manufacturerStateCombos.length > 0) {
      params['combos'] = filters.manufacturerStateCombos
        .map(c => `${c.manufacturer}:${c.state}`)
        .join(',');
    } else {
      // Fallback to individual fields
      if (filters.manufacturer) params['manufacturer'] = filters.manufacturer;
      if (filters.state) params['state'] = filters.state;
    }
    
    // Other filters
    if (filters.q) params['q'] = filters.q;
    if (filters.type) params['type'] = filters.type;
    if (filters.model) params['model'] = filters.model;
    if (filters.yearMin !== undefined && filters.yearMin !== null) {
      params['yearMin'] = String(filters.yearMin);
    }
    if (filters.yearMax !== undefined && filters.yearMax !== null) {
      params['yearMax'] = String(filters.yearMax);
    }
    if (filters.status) params['status'] = filters.status;
    if (filters.page) params['page'] = String(filters.page);
    if (filters.size) params['size'] = String(filters.size);
    
    return params;
  }

  paramsToFilters(params: Params): SearchFilters {
    const filters: SearchFilters = {};
    
    // Handle manufacturer-state combinations from URL
    if (params['combos']) {
      const combosArray = params['combos'].split(',').map((combo: string) => {
        const [manufacturer, state] = combo.split(':');
        return { manufacturer, state };
      });
      filters.manufacturerStateCombos = combosArray;
    } else {
      // Fallback to individual fields
      if (params['manufacturer']) filters.manufacturer = params['manufacturer'];
      if (params['state']) filters.state = params['state'];
    }
    
    // Other filters
    if (params['q']) filters.q = params['q'];
    if (params['type']) filters.type = params['type'] as 'plane' | 'automobile';
    if (params['model']) filters.model = params['model'];
    if (params['yearMin']) filters.yearMin = parseInt(params['yearMin'], 10);
    if (params['yearMax']) filters.yearMax = parseInt(params['yearMax'], 10);
    if (params['status']) filters.status = params['status'];
    if (params['page']) filters.page = parseInt(params['page'], 10);
    if (params['size']) filters.size = parseInt(params['size'], 10);
    
    return filters;
  }
}
