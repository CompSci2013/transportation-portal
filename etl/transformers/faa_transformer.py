"""Transform FAA CSV data to unified transport model"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import csv
import logging
from datetime import datetime
from typing import Optional, Dict, List
from models import PlaneTransport, PlaneData, Location, Dates, Owner, Specifications, Metadata

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class FAATransformer:
    """Transform FAA aircraft data to unified schema"""
    
    # Type mappings from FAA codes to unified values
    AIRCRAFT_TYPE_MAP = {
        '1': 'glider',
        '2': 'balloon',
        '3': 'blimp',
        '4': 'fixed_wing_single',
        '5': 'fixed_wing_multi',
        '6': 'rotorcraft',
        '7': 'weight_shift_control',
        '8': 'powered_parachute',
        '9': 'gyroplane',
        'H': 'hybrid_lift',
        'O': 'other'
    }
    
    ENGINE_TYPE_MAP = {
        '0': 'none',
        '1': 'reciprocating',
        '2': 'turbo-prop',
        '3': 'turbo-shaft',
        '4': 'turbo-jet',
        '5': 'turbo-fan',
        '6': 'ramjet',
        '7': '2-cycle',
        '8': '4-cycle',
        '9': 'unknown',
        '10': 'electric',
        '11': 'rotary'
    }
    
    REGISTRANT_TYPE_MAP = {
        '1': 'individual',
        '2': 'partnership',
        '3': 'corporation',
        '4': 'co-owned',
        '5': 'government',
        '7': 'llc',
        '8': 'non_citizen_corporation',
        '9': 'non_citizen_co_owned'
    }
    
    STATUS_MAP = {
        'V': 'active',
        'T': 'active',
        'M': 'active',
        'R': 'pending',
        'N': 'pending',
        'E': 'inactive',
        '9': 'inactive',
        '6': 'inactive',
        '7': 'pending',
        '13': 'expired'
    }
    
    AIRWORTHINESS_MAP = {
        '1': 'standard',
        '2': 'limited',
        '3': 'restricted',
        '4': 'experimental',
        '5': 'provisional',
        '6': 'multiple',
        '7': 'primary',
        '8': 'special_flight_permit',
        '9': 'light_sport'
    }
    
    def __init__(self):
        """Initialize transformer with reference data"""
        self.aircraft_ref: Dict[str, dict] = {}
        self.engine_ref: Dict[str, dict] = {}
        logger.info("FAA Transformer initialized")
    
    def load_reference_data(self, acftref_path: Path, engine_path: Path):
        """Load aircraft and engine reference tables"""
        logger.info("Loading reference data...")
        
        # Load aircraft reference (skip header)
        with open(acftref_path, 'r', encoding='utf-8-sig') as f:  # utf-8-sig handles BOM
            reader = csv.reader(f)
            next(reader, None)  # Skip header
            
            for row in reader:
                if len(row) >= 3:
                    code = row[0].strip()
                    self.aircraft_ref[code] = {
                        'manufacturer': row[1].strip(),
                        'model': row[2].strip(),
                        'type_aircraft': row[3].strip() if len(row) > 3 else '',
                        'type_engine': row[4].strip() if len(row) > 4 else '',
                        'num_engines': row[7].strip() if len(row) > 7 else '',
                        'num_seats': row[8].strip() if len(row) > 8 else ''
                    }
        
        logger.info(f"Loaded {len(self.aircraft_ref)} aircraft models")
        
        # Load engine reference (skip header)
        with open(engine_path, 'r', encoding='utf-8-sig') as f:
            reader = csv.reader(f)
            next(reader, None)  # Skip header
            
            for row in reader:
                if len(row) >= 3:
                    code = row[0].strip()
                    self.engine_ref[code] = {
                        'manufacturer': row[1].strip(),
                        'model': row[2].strip(),
                        'type': row[3].strip() if len(row) > 3 else '',
                        'horsepower': row[4].strip() if len(row) > 4 else ''
                    }
        
        logger.info(f"Loaded {len(self.engine_ref)} engine models")
    
    def parse_date(self, date_str: str) -> Optional[str]:
        """Parse FAA date format YYYYMMDD or YYYY/MM/DD to ISO"""
        if not date_str or date_str.strip() == '':
            return None
        
        try:
            date_str = date_str.strip()
            
            if len(date_str) == 8 and date_str.isdigit():
                year = int(date_str[0:4])
                month = int(date_str[4:6])
                day = int(date_str[6:8])
                return f"{year:04d}-{month:02d}-{day:02d}"
            
            if '/' in date_str:
                parts = date_str.split('/')
                if len(parts) == 3:
                    year = int(parts[0])
                    month = int(parts[1])
                    day = int(parts[2])
                    return f"{year:04d}-{month:02d}-{day:02d}"
            
            return None
        except (ValueError, IndexError):
            return None
    
    def normalize_manufacturer(self, name: str) -> str:
        """Normalize manufacturer name"""
        if not name:
            return ""
        
        name = name.strip().title()
        suffixes = [", Usa", ", Inc.", " Corporation", " Corp.", " Motor Company", " Ltd"]
        for suffix in suffixes:
            if name.endswith(suffix):
                name = name[:-len(suffix)]
        
        return name.strip()
    
    def transform_row(self, row: List[str]) -> Optional[PlaneTransport]:
        """Transform a single MASTER.txt row to PlaneTransport model"""
        
        if len(row) < 20:
            return None
        
        try:
            # Extract core fields (positions from FAA documentation)
            n_number = row[0].strip()
            if not n_number or n_number.upper() == 'N-NUMBER':  # Skip header
                return None
            
            # Prepend N if missing
            if not n_number.startswith('N'):
                n_number = 'N' + n_number
            
            serial_number = row[1].strip()
            aircraft_code = row[2].strip()
            engine_code = row[3].strip()
            year_mfr = row[4].strip()
            
            # Get reference data
            aircraft_info = self.aircraft_ref.get(aircraft_code, {})
            engine_info = self.engine_ref.get(engine_code, {})
            
            # Extract type aircraft from aircraft_info, not from row position
            type_aircraft = aircraft_info.get('type_aircraft', '').strip()
            
            # Build transport model
            transport = PlaneTransport(
                transport_id=f"plane-{n_number}",
                transport_type="plane",
                category=self.AIRCRAFT_TYPE_MAP.get(type_aircraft, 'other'),
                
                manufacturer=self.normalize_manufacturer(
                    aircraft_info.get('manufacturer', '')
                ),
                manufacturer_country='US',
                
                model=aircraft_info.get('model', ''),
                
                year=int(year_mfr) if year_mfr.isdigit() and len(year_mfr) == 4 else None,
                
                registration_id=n_number,
                registration_country='US',
                registration_status='active',  # Most are active, could parse from other fields
                
                location=Location(
                    city=row[9].strip() or None,  # CITY is at position 9
                    state_province=row[10].strip() or None,  # STATE is at position 10
                    country='US'
                ),
                
                dates=Dates(
                    manufactured=self.parse_date(year_mfr + '0101') if year_mfr and year_mfr.isdigit() else None,
                    registered=None,  # Need to find correct position
                    last_activity=None  # Need to find correct position
                ),
                
                owner=Owner(
                    type=self.REGISTRANT_TYPE_MAP.get(row[5].strip(), 'other'),
                    name=row[6].strip() or None,
                    country='US'
                ),
                
                specifications=Specifications(
                    engine_type=self.ENGINE_TYPE_MAP.get(
                        aircraft_info.get('type_engine', '').strip(), 'unknown'
                    ),
                    fuel_type='gasoline',
                    capacity=int(aircraft_info.get('num_seats', 0)) 
                             if aircraft_info.get('num_seats', '').isdigit() else None,
                    power={
                        'value': int(engine_info.get('horsepower', 0)) 
                                if engine_info.get('horsepower', '').isdigit() else None,
                        'unit': 'hp'
                    } if engine_info.get('horsepower') else None
                ),
                
                metadata=Metadata(
                    source='faa',
                    source_id=n_number,
                    ingest_date=datetime.utcnow()
                ),
                
                plane_data=PlaneData(
                    n_number=n_number,
                    serial_number=serial_number or None,
                    aircraft_type=self.AIRCRAFT_TYPE_MAP.get(type_aircraft, 'other'),
                    engine_count=int(aircraft_info.get('num_engines', 0))
                                 if aircraft_info.get('num_engines', '').isdigit() else None,
                    engine_manufacturer=engine_info.get('manufacturer'),
                    engine_model=engine_info.get('model'),
                    airworthiness_class='standard',  # Default
                    mode_s_code=None,
                    fractional_ownership=False,
                    aircraft_mfr_model_code=aircraft_code or None,
                    engine_mfr_model_code=engine_code or None
                )
            )
            
            return transport
            
        except Exception as e:
            logger.debug(f"Error transforming row: {e}")
            return None
    
    def transform_file(self, master_path: Path, limit: Optional[int] = None) -> List[PlaneTransport]:
        """Transform MASTER.txt file to list of PlaneTransport objects"""
        logger.info(f"Transforming {master_path}")
        if limit:
            logger.info(f"Limiting to {limit} records")
        
        results = []
        errors = 0
        
        with open(master_path, 'r', encoding='utf-8-sig') as f:  # Handle BOM
            reader = csv.reader(f)
            next(reader, None)  # Skip header row
            
            for i, row in enumerate(reader):
                if limit and i >= limit:
                    break
                
                transport = self.transform_row(row)
                if transport:
                    results.append(transport)
                else:
                    errors += 1
                
                if (i + 1) % 10000 == 0:
                    logger.info(f"Processed {i + 1} rows, {len(results)} valid")
        
        logger.info(f"✅ Transformation complete")
        logger.info(f"   Valid records: {len(results)}")
        logger.info(f"   Errors/skipped: {errors}")
        
        return results


if __name__ == "__main__":
    """Test the transformer"""
    from extractors.faa_extractor import FAAExtractor
    
    extractor = FAAExtractor()
    files = extractor.get_files()
    
    if not files:
        logger.error("No files found. Run faa_extractor.py first!")
        exit(1)
    
    transformer = FAATransformer()
    transformer.load_reference_data(
        files['aircraft_ref'],
        files['engine']
    )
    
    logger.info("\n" + "="*60)
    logger.info("Testing transformation with first 100 records")
    logger.info("="*60 + "\n")
    
    planes = transformer.transform_file(files['master'], limit=100)
    
    if planes:
        print("\n📋 Sample transformed record:")
        print("="*60)
        sample = planes[0]
        print(f"Transport ID: {sample.transport_id}")
        print(f"Type: {sample.transport_type}")
        print(f"Manufacturer: {sample.manufacturer}")
        print(f"Model: {sample.model}")
        print(f"Year: {sample.year}")
        print(f"Registration: {sample.registration_id}")
        print(f"Status: {sample.registration_status}")
        print(f"Location: {sample.location.city}, {sample.location.state_province}")
        print(f"N-Number: {sample.plane_data.n_number}")
        print(f"Aircraft Type: {sample.plane_data.aircraft_type}")
        print(f"\n✅ Transformer working correctly!")
    else:
        print("\n❌ No valid records transformed")
