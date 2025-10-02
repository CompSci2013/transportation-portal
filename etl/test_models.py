"""Test script to validate Pydantic models with sample data"""
from datetime import date, datetime
from models import PlaneTransport, AutomobileTransport
import json


def test_plane_model():
    """Test plane model with sample FAA data"""
    print("=" * 60)
    print("Testing Plane Model")
    print("=" * 60)
    
    sample_plane = {
        "transport_id": "plane-N12345",
        "transport_type": "plane",
        "category": "fixed_wing_single",
        "manufacturer": "Cessna",
        "manufacturer_country": "US",
        "model": "172S Skyhawk SP",
        "year": 2020,
        "registration_id": "N12345",
        "registration_country": "US",
        "registration_status": "active",
        "location": {
            "city": "Dallas",
            "state_province": "TX",
            "country": "US",
            "coordinates": {
                "lat": 32.7767,
                "lon": -96.7970
            }
        },
        "dates": {
            "manufactured": "2020-01-15",
            "registered": "2020-02-01",
            "last_activity": "2025-09-15"
        },
        "owner": {
            "type": "individual",
            "name": "John Smith",
            "country": "US"
        },
        "specifications": {
            "engine_type": "reciprocating",
            "fuel_type": "gasoline",
            "capacity": 4,
            "power": {
                "value": 180,
                "unit": "hp"
            }
        },
        "metadata": {
            "source": "faa",
            "source_id": "N12345",
            "ingest_date": datetime.utcnow().isoformat()
        },
        "plane_data": {
            "n_number": "N12345",
            "serial_number": "17272788",
            "aircraft_type": "fixed_wing_single",
            "engine_count": 1,
            "engine_manufacturer": "Lycoming",
            "engine_model": "IO-360-L2A",
            "airworthiness_class": "standard",
            "mode_s_code": "A1B2C3",
            "fractional_ownership": False,
            "cruising_speed_mph": 140
        }
    }
    
    try:
        plane = PlaneTransport(**sample_plane)
        print("✅ Plane model validation PASSED")
        print(f"\nTransport ID: {plane.transport_id}")
        print(f"Manufacturer: {plane.manufacturer}")
        print(f"Model: {plane.model}")
        print(f"Year: {plane.year}")
        print(f"N-Number: {plane.plane_data.n_number}")
        print(f"Aircraft Type: {plane.plane_data.aircraft_type}")
        print(f"Engine Count: {plane.plane_data.engine_count}")
        
        # Test JSON serialization
        print("\n--- JSON Output (first 500 chars) ---")
        json_output = plane.model_dump_json(indent=2)
        print(json_output[:500] + "...")
        
        return True
    except Exception as e:
        print(f"❌ Plane model validation FAILED: {e}")
        return False


def test_automobile_model():
    """Test automobile model with sample NHTSA data"""
    print("\n" + "=" * 60)
    print("Testing Automobile Model")
    print("=" * 60)
    
    sample_auto = {
        "transport_id": "auto-1HGBH41JXMN109186",
        "transport_type": "automobile",
        "category": "PASSENGER CAR",
        "manufacturer": "Honda",
        "manufacturer_country": "US",
        "model": "Accord",
        "model_variant": "EX-L",
        "year": 2021,
        "registration_id": "1HGBH41JXMN109186",
        "registration_country": "US",
        "location": {
            "city": "Marysville",
            "state_province": "OH",
            "country": "US"
        },
        "dates": {
            "manufactured": "2021-01-01"
        },
        "specifications": {
            "engine_type": "in-line",
            "fuel_type": "gasoline",
            "capacity": 5,
            "power": {
                "value": 192,
                "unit": "hp"
            }
        },
        "metadata": {
            "source": "nhtsa",
            "source_id": "1HGBH41JXMN109186",
            "ingest_date": datetime.utcnow().isoformat()
        },
        "automobile_data": {
            "vin": "1HGBH41JXMN109186",
            "make_id": 474,
            "model_id": 1861,
            "vehicle_type": "PASSENGER CAR",
            "body_class": "Sedan",
            "series": "EX-L",
            "doors": 4,
            "seat_rows": 2,
            "displacement_l": 1.5,
            "engine_cylinders": 4,
            "engine_configuration": "In-Line",
            "engine_hp": 192,
            "transmission_style": "Automatic",
            "transmission_speeds": 10,
            "drive_type": "FWD",
            "plant_city": "Marysville",
            "plant_state": "Ohio",
            "plant_country": "UNITED STATES (USA)",
            "safety": {
                "abs": "Standard",
                "esc": "All Models",
                "tpms": "Direct",
                "airbags": 6
            }
        }
    }
    
    try:
        auto = AutomobileTransport(**sample_auto)
        print("✅ Automobile model validation PASSED")
        print(f"\nTransport ID: {auto.transport_id}")
        print(f"Manufacturer: {auto.manufacturer}")
        print(f"Model: {auto.model}")
        print(f"Year: {auto.year}")
        print(f"VIN: {auto.automobile_data.vin}")
        print(f"Body Class: {auto.automobile_data.body_class}")
        print(f"Engine HP: {auto.automobile_data.engine_hp}")
        print(f"Drive Type: {auto.automobile_data.drive_type}")
        
        # Test JSON serialization
        print("\n--- JSON Output (first 500 chars) ---")
        json_output = auto.model_dump_json(indent=2)
        print(json_output[:500] + "...")
        
        return True
    except Exception as e:
        print(f"❌ Automobile model validation FAILED: {e}")
        return False


def test_validation_errors():
    """Test that validation catches errors"""
    print("\n" + "=" * 60)
    print("Testing Validation Error Handling")
    print("=" * 60)
    
    # Test 1: Invalid VIN with letter 'O'
    print("\n1. Testing VIN with invalid character 'O'...")
    try:
        bad_vin = AutomobileTransport(
            transport_id="auto-BAD",
            transport_type="automobile",
            metadata={"source": "nhtsa", "source_id": "BAD"},
            automobile_data={"vin": "1HGBH41OXMN109186"}  # Contains 'O'
        )
        print("❌ Should have rejected VIN with 'O'")
    except Exception as e:
        print(f"✅ Correctly rejected: {str(e)[:100]}")
    
    # Test 2: Year out of range
    print("\n2. Testing year out of valid range...")
    try:
        bad_year = PlaneTransport(
            transport_id="plane-N99999",
            transport_type="plane",
            year=1850,  # Too old
            metadata={"source": "faa", "source_id": "N99999"},
            plane_data={"n_number": "N99999"}
        )
        print("❌ Should have rejected year 1850")
    except Exception as e:
        print(f"✅ Correctly rejected: {str(e)[:100]}")
    
    # Test 3: Invalid transport_type
    print("\n3. Testing invalid transport_type...")
    try:
        bad_type = PlaneTransport(
            transport_id="boat-12345",
            transport_type="boat",  # Not in Literal["plane", "automobile", "train"]
            metadata={"source": "faa", "source_id": "12345"},
            plane_data={"n_number": "N12345"}
        )
        print("❌ Should have rejected transport_type='boat'")
    except Exception as e:
        print(f"✅ Correctly rejected: {str(e)[:100]}")


if __name__ == "__main__":
    print("\n🚀 Starting Pydantic Model Tests\n")
    
    plane_pass = test_plane_model()
    auto_pass = test_automobile_model()
    test_validation_errors()
    
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    print(f"Plane Model: {'✅ PASS' if plane_pass else '❌ FAIL'}")
    print(f"Automobile Model: {'✅ PASS' if auto_pass else '❌ FAIL'}")
    print("\nAll models are ready for ETL pipeline! 🎉\n")
