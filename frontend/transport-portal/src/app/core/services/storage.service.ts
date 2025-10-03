import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { UserPreferences } from '../../models';
import { environment } from '../../../environments/environment';

/**
 * StorageService
 * 
 * Interfaces with backend API for user preferences stored in Elasticsearch
 * NOTE: NOT localStorage - preferences are stored server-side
 */
@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly apiUrl = `${environment.apiUrl}/preferences`;

  constructor(private http: HttpClient) {}

  // ========== USER PREFERENCES (Backend API) ==========
  
  /**
   * Get user preferences from backend
   * Returns default preferences if none exist
   */
  getUserPreferences(userId: string): Observable<UserPreferences> {
    return this.http.get<UserPreferences>(`${this.apiUrl}/${userId}`).pipe(
      catchError(error => {
        console.warn('Failed to load user preferences, using defaults:', error);
        return of(this.getDefaultPreferences(userId));
      })
    );
  }

  /**
   * Update user preferences in backend
   */
  updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Observable<UserPreferences> {
    return this.http.put<UserPreferences>(`${this.apiUrl}/${userId}`, preferences);
  }

  /**
   * Create new user preferences document
   */
  createUserPreferences(preferences: UserPreferences): Observable<UserPreferences> {
    return this.http.post<UserPreferences>(this.apiUrl, preferences);
  }

  /**
   * Delete user preferences
   */
  deleteUserPreferences(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${userId}`);
  }

  // ========== DEFAULTS ==========
  
  private getDefaultPreferences(userId: string): UserPreferences {
    return {
      userId: userId,
      defaultPageSize: 20,
      defaultView: 'table',
      theme: 'light',
      savedSearches: []
    };
  }

  // ========== TEMPORARY: Browser SessionStorage for Draft State ==========
  // This is for tab-specific temporary data only
  // Will be removed per requirement (no session storage)
  
  // Note: Keeping these methods commented out as placeholders
  // in case you decide to add session storage later
  
  // setSessionItem<T>(key: string, value: T): void {
  //   try {
  //     sessionStorage.setItem(key, JSON.stringify(value));
  //   } catch (error) {
  //     console.error('sessionStorage.setItem failed:', error);
  //   }
  // }
  
  // getSessionItem<T>(key: string): T | null {
  //   try {
  //     const item = sessionStorage.getItem(key);
  //     return item ? JSON.parse(item) : null;
  //   } catch (error) {
  //     console.error('sessionStorage.getItem failed:', error);
  //     return null;
  //   }
  // }
}
