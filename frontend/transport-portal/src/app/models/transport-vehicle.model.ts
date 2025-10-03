/**
 * Base interface for all transport vehicles
 * Extended by PlaneVehicle, AutomobileVehicle, MarineVehicle
 */
export interface TransportVehicle {
  transport_id: string;
  transport_type: 'plane' | 'automobile' | 'marine';
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
}

/**
 * Plane-specific vehicle extending base
 */
export interface PlaneVehicle extends TransportVehicle {
  transport_type: 'plane';
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
 * Automobile-specific vehicle extending base
 * Ready for future implementation
 */
export interface AutomobileVehicle extends TransportVehicle {
  transport_type: 'automobile';
  automobile_data?: {
    vin?: string;
    make_id?: number;
    model_id?: number;
    body_class?: string;
    // Add more automobile-specific fields as needed
  };
}

/**
 * Marine-specific vehicle extending base
 * Ready for future implementation
 */
export interface MarineVehicle extends TransportVehicle {
  transport_type: 'marine';
  marine_data?: {
    imo_number?: string;
    vessel_type?: string;
    gross_tonnage?: number;
    // Add more marine-specific fields as needed
  };
}
