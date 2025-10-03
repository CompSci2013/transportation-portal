/**
 * User preferences stored in Elasticsearch backend
 * Each user has one document with their preferences
 */
export interface UserPreferences {
  userId: string;              // Unique user identifier
  defaultPageSize: number;     // Default results per page (20, 50, 100)
  defaultView: 'table' | 'cards';  // Preferred view mode
  theme: 'light' | 'dark';     // UI theme preference
  savedSearches?: SavedSearch[];   // Array of saved search configurations
}

/**
 * Saved search configuration
 */
export interface SavedSearch {
  id: string;                  // Unique identifier
  name: string;                // User-defined name
  filters: any;                // SearchFilters object (will import later)
  createdAt: string;           // ISO timestamp
}
