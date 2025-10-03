import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Aircraft } from '../models/aircraft.model';
import { SearchFilters, SearchResponse } from '../models';
import { environment } from '../../environments/environment';

interface ManufacturerStateCombinationsResponse {
  total: number;
  page: number;
  size: number;
  items: Array<{
    manufacturer: string;
    state: string;
    count: number;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Search aircraft with filters
   * Returns enhanced response with statistics
   */
  searchAircraft(filters: SearchFilters): Observable<SearchResponse> {
    let params = new HttpParams();
    
    // Convert SearchFilters to HTTP params
    Object.keys(filters).forEach(key => {
      const value = (filters as any)[key];
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
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
   * Get API info
   */
  getInfo(): Observable<any> {
    return this.http.get(`${this.apiUrl}/info`);
  }

  /**
   * Get manufacturer-state combinations with pagination and search
   */
  getManufacturerStateCombinations(
    page: number = 1, 
    size: number = 50, 
    search: string = ''
  ): Observable<ManufacturerStateCombinationsResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<ManufacturerStateCombinationsResponse>(
      `${this.apiUrl}/manufacturer-state-combinations`, 
      { params }
    );
  }
}
