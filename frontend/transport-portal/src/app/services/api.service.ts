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
    
    // Parameter mapping: frontend (camelCase) -> backend (snake_case)
    const paramMap: { [key: string]: string } = {
      'q': 'query',
      'manufacturer': 'manufacturer',
      'model': 'model',
      'yearMin': 'year_min',
      'yearMax': 'year_max',
      'state': 'state',
      'page': 'page',
      'size': 'size'
    };
    
    Object.keys(filters).forEach(key => {
      const value = (filters as any)[key];
      const backendParam = paramMap[key] || key;
      
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(backendParam, value.toString());
      }
    });
    
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
