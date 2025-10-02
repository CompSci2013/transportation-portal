export interface Aircraft {
  transport_id: string;
  transport_type: string;
  category?: string;
  manufacturer?: string;
  manufacturer_country?: string;
  model?: string;
  model_variant?: string;
  year?: number;
  registration_id?: string;
  registration_country?: string;
  registration_status?: string;
  location?: Location;
  dates?: Dates;
  owner?: Owner;
  specifications?: Specifications;
  metadata: Metadata;
  plane_data?: PlaneData;
}

export interface Location {
  city?: string;
  state_province?: string;
  country?: string;
  coordinates?: {
    lat: number;
    lon: number;
  };
}

export interface Dates {
  manufactured?: string;
  registered?: string;
  last_activity?: string;
  expires?: string;
}

export interface Owner {
  type?: string;
  name?: string;
  country?: string;
}

export interface Specifications {
  engine_type?: string;
  fuel_type?: string;
  capacity?: number;
  power?: {
    value: number;
    unit: string;
  };
}

export interface Metadata {
  source: string;
  source_id: string;
  ingest_date: string;
  last_updated?: string;
}

export interface PlaneData {
  n_number: string;
  serial_number?: string;
  aircraft_type?: string;
  engine_count?: number;
  engine_manufacturer?: string;
  engine_model?: string;
  airworthiness_class?: string;
  mode_s_code?: string;
  fractional_ownership?: boolean;
  aircraft_mfr_model_code?: string;
  engine_mfr_model_code?: string;
}

export interface SearchResponse {
  total: number;
  results: Aircraft[];
  from: number;
  size: number;
}

export interface Statistics {
  totalRecords: number;
  topManufacturers: Array<{ name: string; count: number }>;
  topStates: Array<{ state: string; count: number }>;
  aircraftByYear: Array<{ year: number; count: number }>;
  aircraftByType: Array<{ type: string; count: number }>;
}
