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
  sort?: string; // NEW: Field to sort by
  sortOrder?: 'asc' | 'desc'; // NEW: Sort direction
  manufacturerStateCombos?: Array<{ manufacturer: string; state: string }>; // Multiple combinations
}
