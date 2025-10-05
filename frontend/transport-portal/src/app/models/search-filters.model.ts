/**
 * Search filter parameters that map to URL query params
 * and backend API request parameters
 */
export interface SearchFilters {
  q?: string; // Text search across multiple fields
  type?: 'plane' | 'automobile'; // Transport type filter
  manufacturer?: string; // Single manufacturer (legacy/fallback)
  model?: string; // Model name
  yearMin?: number; // Minimum year
  yearMax?: number; // Maximum year
  state?: string; // Single state (legacy/fallback)
  status?: string; // Registration status
  page?: number; // Current page (1-indexed)
  size?: number; // Results per page
  sort?: string; // Field to sort by
  sortOrder?: 'asc' | 'desc'; // Sort direction
  manufacturerStateCombos?: Array<{ manufacturer: string; state: string }>; // Multiple combinations

  // Column filters (server-side)
  filterRegistration?: string; // Registration ID filter
  filterManufacturer?: string; // Manufacturer column filter
  filterModel?: string; // Model column filter
  filterYearMin?: number; // Year minimum (column filter)
  filterYearMax?: number; // Year maximum (column filter)
  filterCategory?: string; // Category/type column filter
  filterState?: string; // State column filter
}
