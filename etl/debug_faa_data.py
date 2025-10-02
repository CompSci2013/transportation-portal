"""Debug FAA data parsing issues"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

import csv

# Read first few rows of MASTER.txt
faa_file = Path("/app/data/faa/extracted/MASTER.txt")

print("="*60)
print("Examining MASTER.txt structure")
print("="*60)

with open(faa_file, 'r', encoding='latin-1') as f:
    reader = csv.reader(f)
    
    for i, row in enumerate(reader):
        if i >= 3:  # Just look at first 3 rows
            break
        
        print(f"\nRow {i + 1}:")
        print(f"  Number of fields: {len(row)}")
        print(f"  First 10 fields:")
        for j, field in enumerate(row[:10]):
            print(f"    [{j}] = '{field}'")
        
        # Show key fields we're trying to extract
        print(f"\n  Key fields:")
        print(f"    [0] N-Number: '{row[0]}'")
        print(f"    [2] Aircraft code: '{row[2]}'")
        print(f"    [4] Year: '{row[4]}'")
        print(f"    [33] Type aircraft: '{row[33] if len(row) > 33 else 'MISSING'}'")
        print(f"    [34] Status: '{row[34] if len(row) > 34 else 'MISSING'}'")

# Check ACFTREF.txt
print("\n" + "="*60)
print("Examining ACFTREF.txt structure")
print("="*60)

acftref_file = Path("/app/data/faa/extracted/ACFTREF.txt")

with open(acftref_file, 'r', encoding='latin-1') as f:
    reader = csv.reader(f)
    
    for i, row in enumerate(reader):
        if i >= 2:
            break
        
        print(f"\nRow {i + 1}:")
        print(f"  Number of fields: {len(row)}")
        for j, field in enumerate(row[:5]):
            print(f"    [{j}] = '{field}'")
