"""Automobile-specific data models (NHTSA vPIC)"""
from typing import Optional, Literal
from pydantic import BaseModel, Field, field_validator
from .common import TransportBase


class SafetyFeatures(BaseModel):
    """Vehicle safety features"""
    abs: Optional[str] = Field(None, description="Anti-lock braking system")
    esc: Optional[str] = Field(None, description="Electronic stability control")
    tpms: Optional[str] = Field(None, description="Tire pressure monitoring")
    airbags: Optional[int] = Field(None, description="Number of airbags")
    other_restraint_info: Optional[str] = None


class ElectricVehicle(BaseModel):
    """Electric/hybrid vehicle specifications"""
    battery_type: Optional[str] = None
    battery_kwh: Optional[float] = Field(None, ge=0)
    battery_voltage: Optional[int] = None
    battery_amps: Optional[int] = None
    battery_modules: Optional[int] = None
    battery_cells: Optional[int] = None
    charger_level: Optional[str] = None
    range_miles: Optional[int] = Field(None, ge=0)


class AutomobileData(BaseModel):
    """NHTSA vPIC-specific vehicle fields"""
    vin: str = Field(..., min_length=17, max_length=17, description="17-character VIN")
    
    # Make/Model IDs
    make_id: Optional[int] = None
    model_id: Optional[int] = None
    manufacturer_id: Optional[int] = None
    
    # Vehicle classification
    vehicle_type: Optional[str] = Field(None, description="PASSENGER CAR, TRUCK, etc.")
    body_class: Optional[str] = Field(None, description="Sedan, SUV, Coupe, etc.")
    series: Optional[str] = Field(None, description="Trim level/series")
    
    # Physical characteristics
    doors: Optional[int] = Field(None, ge=0, le=6)
    seat_rows: Optional[int] = Field(None, ge=1, le=4)
    
    # Engine specifications
    displacement_l: Optional[float] = Field(None, ge=0, description="Liters")
    displacement_ci: Optional[float] = Field(None, ge=0, description="Cubic inches")
    engine_cylinders: Optional[int] = Field(None, ge=0, le=16)
    engine_configuration: Optional[str] = Field(
        None, 
        description="In-Line, V-Type, etc."
    )
    engine_hp: Optional[int] = Field(None, ge=0)
    engine_kw: Optional[int] = Field(None, ge=0)
    engine_manufacturer: Optional[str] = None
    engine_model: Optional[str] = None
    
    # Drivetrain
    transmission_style: Optional[str] = Field(
        None,
        description="Automatic, Manual, CVT"
    )
    transmission_speeds: Optional[int] = Field(None, ge=1, le=12)
    drive_type: Optional[Literal[
        "FWD",
        "RWD", 
        "AWD",
        "4WD",
        "unknown"
    ]] = None
    
    # Brakes
    brake_system_type: Optional[str] = None
    brake_system_desc: Optional[str] = None
    
    # Weight ratings
    gvwr: Optional[str] = Field(None, description="Gross Vehicle Weight Rating")
    curb_weight_lb: Optional[int] = None
    
    # Manufacturing location
    plant_city: Optional[str] = None
    plant_state: Optional[str] = None
    plant_country: Optional[str] = None
    plant_company_name: Optional[str] = None
    
    # Market/Pricing
    destination_market: Optional[str] = None
    base_price: Optional[int] = None
    
    # NCSA codes (National Center for Statistics and Analysis)
    ncsa_make: Optional[str] = None
    ncsa_model: Optional[str] = None
    ncsa_body_type: Optional[str] = None
    
    # Nested objects
    safety: Optional[SafetyFeatures] = None
    electric: Optional[ElectricVehicle] = None
    
    # Decode metadata
    error_code: Optional[str] = Field(None, description="VIN decode error code")
    error_text: Optional[str] = None
    suggested_vin: Optional[str] = Field(
        None,
        description="Corrected VIN if original had errors"
    )

    @field_validator('vin')
    @classmethod
    def validate_vin(cls, v: str) -> str:
        """Ensure VIN is uppercase alphanumeric (no I, O, Q)"""
        if v:
            v = v.upper().strip()
            # VINs don't use I, O, Q to avoid confusion with 1, 0
            invalid_chars = set('IOQ')
            if any(c in invalid_chars for c in v):
                raise ValueError('VIN cannot contain letters I, O, or Q')
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "vin": "1HGBH41JXMN109186",
                "make_id": 474,
                "model_id": 1861,
                "vehicle_type": "PASSENGER CAR",
                "body_class": "Sedan",
                "doors": 4,
                "engine_cylinders": 4,
                "engine_hp": 158,
                "drive_type": "FWD",
                "transmission_style": "Automatic"
            }
        }


class AutomobileTransport(TransportBase):
    """Complete automobile record with common + specific fields"""
    automobile_data: AutomobileData
    
    class Config:
        json_schema_extra = {
            "example": {
                "transport_id": "auto-1HGBH41JXMN109186",
                "transport_type": "automobile",
                "category": "PASSENGER CAR",
                "manufacturer": "Honda",
                "model": "Accord",
                "year": 2021,
                "registration_id": "1HGBH41JXMN109186",
                "registration_country": "US",
                "metadata": {
                    "source": "nhtsa",
                    "source_id": "1HGBH41JXMN109186"
                },
                "automobile_data": {
                    "vin": "1HGBH41JXMN109186",
                    "body_class": "Sedan",
                    "doors": 4,
                    "engine_hp": 158,
                    "drive_type": "FWD"
                }
            }
        }
