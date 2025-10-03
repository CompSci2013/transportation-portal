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
    
    Object.keys(filters).forEach(key => {
      const value = (filters as any)[key];
      if (value !== undefined && value !== null && value !== '') {
        params[key] = String(value);
      }
    });
    
    return params;
  }

  paramsToFilters(params: Params): SearchFilters {
    const filters: SearchFilters = {};
    
    if (params['q']) filters.q = params['q'];
    if (params['type']) filters.type = params['type'] as 'plane' | 'automobile';
    if (params['manufacturer']) filters.manufacturer = params['manufacturer'];
    if (params['model']) filters.model = params['model'];
    if (params['yearMin']) filters.yearMin = parseInt(params['yearMin'], 10);
    if (params['yearMax']) filters.yearMax = parseInt(params['yearMax'], 10);
    if (params['state']) filters.state = params['state'];
    if (params['status']) filters.status = params['status'];
    if (params['page']) filters.page = parseInt(params['page'], 10);
    if (params['size']) filters.size = parseInt(params['size'], 10);
    
    return filters;
  }
}
