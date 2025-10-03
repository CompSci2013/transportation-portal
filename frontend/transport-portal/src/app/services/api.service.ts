import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { SearchFilters, SearchResponse, Aircraft } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Search aircraft with filters
   * Maps camelCase frontend properties to snake_case backend parameters
   */
  searchAircraft(filters: SearchFilters): Observable<SearchResponse> {
    let params = new HttpParams();
    
    // Handle manufacturer-state combinations (takes precedence)
    if (filters.manufacturerStateCombos && filters.manufacturerStateCombos.length > 0) {
      const combosString = filters.manufacturerStateCombos
        .map(combo => `${combo.manufacturer}:${combo.state}`)
        .join(',');
      params = params.set('manufacturer_state_combos', combosString);
    } else {
      // Fallback to individual fields
      if (filters.manufacturer) {
        params = params.set('manufacturer', filters.manufacturer);
      }
      if (filters.state) {
        params = params.set('state', filters.state);
      }
    }
    
    // Other parameters
    if (filters.q) {
      params = params.set('query', filters.q);
    }
    if (filters.model) {
      params = params.set('model', filters.model);
    }
    if (filters.yearMin !== undefined && filters.yearMin !== null) {
      params = params.set('year_min', filters.yearMin.toString());
    }
    if (filters.yearMax !== undefined && filters.yearMax !== null) {
      params = params.set('year_max', filters.yearMax.toString());
    }
    if (filters.page) {
      params = params.set('page', filters.page.toString());
    }
    if (filters.size) {
      params = params.set('size', filters.size.toString());
    }
    
    return this.http.get<SearchResponse>(`${this.apiUrl}/aircraft`, { params });
  }

  /**
   * Get single aircraft by ID
   */
  getAircraft(id: string): Observable<Aircraft> {
    return this.http.get<Aircraft>(`${this.apiUrl}/aircraft/${id}`);
  }

  /**
   * Get aggregate statistics (for dashboard page)
   * Note: Search endpoint now includes filtered statistics
   */
  getStatistics(): Observable<any> {
    return this.http.get(`${this.apiUrl}/statistics`);
  }

  /**
   * Get manufacturer-state combinations for picker
   */
  getManufacturerStateCombinations(
    page: number = 1,
    size: number = 20,
    search: string = ''
  ): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    if (search) {
      params = params.set('search', search);
    }
    
    return this.http.get(`${this.apiUrl}/manufacturer-state-combinations`, { params });
  }
}
