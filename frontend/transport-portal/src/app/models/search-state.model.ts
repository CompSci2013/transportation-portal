import { SearchFilters } from './search-filters.model';
import { SearchStatistics } from './search-statistics.model';

/**
 * Complete application state for search feature
 * Managed by StateManagementService
 */
export interface SearchState {
  // Current search filters (synced with URL)
  filters: SearchFilters;
  
  // Search results (aircraft array)
  results: any[];  // Will be Aircraft[] once we update aircraft.model.ts
  
  // Statistics for histograms
  statistics: SearchStatistics | null;
  
  // Loading state
  loading: boolean;
  
  // Error message (null when no error)
  error: string | null;
  
  // Whether a search has been performed (shows "no search" vs "no results")
  hasSearched: boolean;
  
  // Total count of results matching filters
  totalResults: number;
  
  // Selected manufacturer for Histogram 2 (null = show all manufacturers)
  selectedManufacturer: string | null;
}
