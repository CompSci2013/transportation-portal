// Barrel file for clean imports
// Usage: import { SearchFilters, SearchState, ... } from '@app/models';

// Generic transport base models
export * from './transport-vehicle.model';

// Backward compatibility - Aircraft is now an alias for PlaneVehicle
export { PlaneVehicle as Aircraft } from './transport-vehicle.model';

// Legacy aircraft model (contains old Statistics interface)
export * from './aircraft.model';

// Search-related models
export * from './search-filters.model';
export * from './search-state.model';
export * from './search-statistics.model';
export * from './user-preferences.model';
