"""Plane-specific data models (FAA Aircraft Registry)"""
from typing import Optional, Literal
from pydantic import BaseModel, Field
from .common import TransportBase


class PlaneData(BaseModel):
    """FAA-specific aircraft fields"""
    n_number: str = Field(..., description="FAA registration N-number")
    serial_number: Optional[str] = None
    
    # Aircraft classification
    aircraft_type: Optional[Literal[
        "glider",
        "balloon",
        "blimp",
        "fixed_wing_single",
        "fixed_wing_multi",
        "rotorcraft",
        "weight_shift_control",
        "powered_parachute",
        "gyroplane",
        "hybrid_lift",
        "other"
    ]] = None
    
    # Engine details
    engine_count: Optional[int] = Field(None, ge=0, le=12)
    engine_manufacturer: Optional[str] = None
    engine_model: Optional[str] = None
    
    # Airworthiness
    airworthiness_class: Optional[Literal[
        "standard",
        "limited",
        "restricted",
        "experimental",
        "provisional",
        "multiple",
        "primary",
        "special_flight_permit",
        "light_sport"
    ]] = None
    airworthiness_date: Optional[str] = None
    
    # Additional identifiers
    mode_s_code: Optional[str] = Field(
        None, 
        description="Mode S transponder code (hex)"
    )
    mode_s_code_hex: Optional[str] = None
    
    # Ownership details
    fractional_ownership: bool = False
    
    # Type certificate
    type_certificate: Optional[str] = Field(
        None,
        description="Type certificate data sheet number"
    )
    
    # Kit aircraft
    kit_manufacturer: Optional[str] = None
    kit_model: Optional[str] = None
    
    # Weight classification
    weight_class: Optional[int] = Field(None, ge=1, le=4)
    
    # Performance
    cruising_speed_mph: Optional[int] = None
    
    # Region
    faa_region: Optional[str] = None
    county_code: Optional[str] = None
    
    # Reference codes (for joining with FAA reference tables)
    aircraft_mfr_model_code: Optional[str] = None
    engine_mfr_model_code: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "n_number": "N12345",
                "serial_number": "17272788",
                "aircraft_type": "fixed_wing_single",
                "engine_count": 1,
                "airworthiness_class": "standard",
                "mode_s_code": "A1B2C3",
                "fractional_ownership": False
            }
        }


class PlaneTransport(TransportBase):
    """Complete plane record with common + specific fields"""
    plane_data: PlaneData
    
    class Config:
        json_schema_extra = {
            "example": {
                "transport_id": "plane-N12345",
                "transport_type": "plane",
                "category": "fixed_wing_single",
                "manufacturer": "Cessna",
                "model": "172S Skyhawk",
                "year": 2020,
                "registration_id": "N12345",
                "registration_country": "US",
                "registration_status": "active",
                "metadata": {
                    "source": "faa",
                    "source_id": "N12345"
                },
                "plane_data": {
                    "n_number": "N12345",
                    "aircraft_type": "fixed_wing_single",
                    "engine_count": 1,
                    "airworthiness_class": "standard"
                }
            }
        }
