/**
 * Statistics data structure returned by backend API
 * Used for histogram visualizations
 */
export interface SearchStatistics {
  // Histogram 1: Total count per manufacturer
  // Example: { "Boeing": 42, "Cessna": 300, "Cirrus": 150 }
  byManufacturer: { [manufacturer: string]: number };
  
  // Histogram 2: Models nested within each manufacturer
  // Example: { "Boeing": { "737": 50, "747": 30 }, "Cessna": { "172": 200 } }
  modelsByManufacturer: { 
    [manufacturer: string]: { 
      [model: string]: number 
    } 
  };
  
  // Total count matching current search filters
  totalCount: number;
}

/**
 * Complete search response from backend API
 */
export interface SearchResponse {
  items: any[];           // Array of Aircraft objects
  total: number;          // Total results matching search
  page: number;           // Current page number
  size: number;           // Results per page
  statistics: SearchStatistics;
}
