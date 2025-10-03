/**
 * Aircraft model representing FAA aircraft registry data
 */
export interface Aircraft {
  transport_id: string;
  transport_type: string;
  registration_id: string;
  manufacturer?: string;
  model?: string;
  year?: number;
  category?: string;
  registration_status?: string;
  location?: {
    city?: string;
    state_province?: string;
    country?: string;
  };
  plane_data?: {
    n_number?: string;
    serial_number?: string;
    aircraft_type?: string;
    engine_count?: number;
    engine_manufacturer?: string;
    engine_model?: string;
  };
}

/**
 * Old Statistics interface - deprecated, use SearchStatistics instead
 * Kept for backwards compatibility if needed
 */
export interface Statistics {
  totalRecords: number;
  topManufacturers: Array<{ name: string; count: number }>;
  topStates: Array<{ state: string; count: number }>;
  aircraftByYear: Array<{ year: number; count: number }>;
  aircraftByType: Array<{ type: string; count: number }>;
}
