Excellent! This clarifies the design significantly. The interactive histogram feature (click manufacturer → show models) is a great UX pattern. Let me refine the architecture based on your answers.

## Refined Architecture Design

### Updated Data Flow with Interactive Histograms

```
User clicks "Boeing" in Histogram1
    ↓
StateManagementService.selectManufacturer('Boeing')
    ↓
State updated: selectedManufacturer = 'Boeing'
    ↓
Histogram2 subscribes to selectedManufacturer$
    ↓
Histogram2 filters statistics to show only Boeing models
    ↓
User can click "Clear Selection" to return to full view
```

### Updated Models

```typescript
// models/search-state.model.ts

export interface SearchFilters {
  q?: string;
  type?: 'plane' | 'automobile';
  manufacturer?: string;
  model?: string;
  yearMin?: number;
  yearMax?: number;
  state?: string;
  status?: string;
  page?: number;
  size?: number;
}

export interface SearchStatistics {
  // Histogram 1: All manufacturers with total aircraft count
  byManufacturer: { [manufacturer: string]: number };
  
  // Histogram 2: Models grouped by manufacturer
  // Structure: { "Boeing": { "737": 150, "747": 80 }, "Cessna": { "172": 300 } }
  modelsByManufacturer: { 
    [manufacturer: string]: { 
      [model: string]: number 
    } 
  };
  
  totalCount: number;
}

export interface SearchState {
  filters: SearchFilters;
  results: Aircraft[];
  statistics: SearchStatistics | null;
  loading: boolean;
  error: string | null;
  hasSearched: boolean;
  totalResults: number;
  
  // NEW: Track selected manufacturer for Histogram2
  selectedManufacturer: string | null;
}

export interface UserPreferences {
  defaultPageSize: number;
  defaultView: 'table' | 'cards';
  theme: 'light' | 'dark';
  savedSearches?: SearchFilters[];
  // Add more as needed
}

// API Response from backend
export interface SearchResponse {
  items: Aircraft[];
  total: number;
  page: number;
  size: number;
  statistics: SearchStatistics;
}
```

---

## Service Implementation Plan

We'll implement in this order:
1. **StorageService** - Handles Elasticsearch user preferences (instead of localStorage)
2. **RouteStateService** - URL synchronization
3. **StateManagementService** - Core state logic with histogram interaction
4. **UserPreferencesService** - Interfaces with backend for user preferences

---

### Step 1: Investigate Backend API

**Server:** Thor  
**Directory:** `/home/odin/projects/transportation/backend/`

Let's check what your current API returns:

```bash
cd /home/odin/projects/transportation/backend
```

**Command:**
```bash
curl -s 'http://transportation.minilab/api/v1/aircraft?manufacturer=Boeing&size=5' | jq '.'
```

**Explanation:**
- `curl -s` - Silent mode, fetch the API response
- Query with manufacturer filter to see current response structure
- `jq '.'` - Pretty-print JSON response

**What to look for:**
- Does response include a `statistics` object?
- What does the response structure look like?
- Do we need to add statistics aggregation?

**Preview:** Based on the response, I'll show you how to add the statistics aggregation if needed.

---

Please run this command and paste the output so we can see the current API response structure.
