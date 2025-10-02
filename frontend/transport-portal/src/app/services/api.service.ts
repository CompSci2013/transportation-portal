import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Aircraft, SearchResponse, Statistics } from '../models/aircraft.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Search aircraft with filters
   */
  searchAircraft(filters: {
    manufacturer?: string;
    model?: string;
    year_min?: number;
    year_max?: number;
    state?: string;
    from?: number;
    size?: number;
  }): Observable<SearchResponse> {
    let params = new HttpParams();
    
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
   * Get aggregate statistics
   */
  getStatistics(): Observable<Statistics> {
    return this.http.get<Statistics>(`${this.apiUrl}/statistics`);
  }

  /**
   * Get API info
   */
  getInfo(): Observable<any> {
    return this.http.get(`${this.apiUrl}/info`);
  }
}
