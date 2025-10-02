"""Common fields shared across all transportation types"""
from datetime import date, datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field


class Location(BaseModel):
    """Geographic location information"""
    city: Optional[str] = None
    state_province: Optional[str] = None
    country: Optional[str] = None  # ISO 2-letter code
    coordinates: Optional[dict] = Field(
        None,
        description="GPS coordinates with lat/lon"
    )


class Dates(BaseModel):
    """Important dates for the transport"""
    manufactured: Optional[date] = None
    registered: Optional[date] = None
    last_activity: Optional[date] = None
    expires: Optional[date] = None


class Owner(BaseModel):
    """Owner/registrant information"""
    type: Optional[Literal[
        "individual", 
        "corporation", 
        "government", 
        "partnership",
        "llc",
        "other"
    ]] = None
    name: Optional[str] = None
    country: Optional[str] = None  # ISO 2-letter code


class Specifications(BaseModel):
    """Technical specifications"""
    engine_type: Optional[str] = None
    fuel_type: Optional[str] = None
    capacity: Optional[int] = Field(None, description="Seats/passengers")
    power: Optional[dict] = Field(
        None,
        description="Power output with value and unit (hp or kw)"
    )


class Metadata(BaseModel):
    """Data source and ingestion metadata"""
    source: Literal["faa", "nhtsa", "trainline"]
    source_id: str = Field(..., description="Original ID from data source")
    ingest_date: datetime = Field(default_factory=datetime.utcnow)
    last_updated: Optional[datetime] = None


class TransportBase(BaseModel):
    """Base model with common fields for all transport types"""
    transport_id: str = Field(..., description="Unified ID: type-sourceId")
    transport_type: Literal["plane", "automobile", "train"]
    category: Optional[str] = None
    
    # Manufacturer info
    manufacturer: Optional[str] = None
    manufacturer_country: Optional[str] = None
    
    # Model info
    model: Optional[str] = None
    model_variant: Optional[str] = None
    
    # Year
    year: Optional[int] = Field(None, ge=1900, le=2030)
    
    # Registration
    registration_id: Optional[str] = None
    registration_country: Optional[str] = None
    registration_status: Optional[Literal[
        "active",
        "inactive", 
        "pending",
        "expired",
        "deregistered"
    ]] = None
    
    # Nested common objects
    location: Optional[Location] = None
    dates: Optional[Dates] = None
    owner: Optional[Owner] = None
    specifications: Optional[Specifications] = None
    metadata: Metadata

    class Config:
        """Pydantic configuration"""
        json_schema_extra = {
            "example": {
                "transport_id": "plane-N12345",
                "transport_type": "plane",
                "manufacturer": "Cessna",
                "model": "172",
                "year": 2020,
                "registration_id": "N12345",
                "registration_country": "US",
                "metadata": {
                    "source": "faa",
                    "source_id": "N12345"
                }
            }
        }
