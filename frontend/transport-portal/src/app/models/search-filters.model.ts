/**
 * Search filter parameters that map to URL query params
 * and backend API request parameters
 */
export interface SearchFilters {
  q?: string;                    // Text search across multiple fields
  type?: 'plane' | 'automobile'; // Transport type filter
  manufacturer?: string;          // Manufacturer name
  model?: string;                 // Model name
  yearMin?: number;               // Minimum year
  yearMax?: number;               // Maximum year
  state?: string;                 // State/province code
  status?: string;                // Registration status
  page?: number;                  // Current page (1-indexed)
  size?: number;                  // Results per page
}
