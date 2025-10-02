"""Create Elasticsearch indices for transportation data"""
from elasticsearch import Elasticsearch
import json


def create_transport_index():
    """Create unified transport index with mappings"""
    es = Elasticsearch(['http://thor:30398'])
    
    index_name = "transport-unified"
    
    # Check if index already exists
    if es.indices.exists(index=index_name):
        print(f"⚠️  Index '{index_name}' already exists")
        response = input("Delete and recreate? (yes/no): ")
        if response.lower() == 'yes':
            es.indices.delete(index=index_name)
            print(f"🗑️  Deleted existing index")
        else:
            print("Skipping index creation")
            return
    
    # Define index settings and mappings
    index_body = {
        "settings": {
            "number_of_shards": 1,
            "number_of_replicas": 0,
            "analysis": {
                "analyzer": {
                    "transport_analyzer": {
                        "type": "custom",
                        "tokenizer": "standard",
                        "filter": ["lowercase", "asciifolding"]
                    }
                }
            }
        },
        "mappings": {
            "properties": {
                # Common fields
                "transport_id": {"type": "keyword"},
                "transport_type": {"type": "keyword"},
                "category": {"type": "keyword"},
                
                # Manufacturer
                "manufacturer": {
                    "type": "text",
                    "analyzer": "transport_analyzer",
                    "fields": {
                        "keyword": {"type": "keyword"}
                    }
                },
                "manufacturer_country": {"type": "keyword"},
                
                # Model
                "model": {
                    "type": "text",
                    "analyzer": "transport_analyzer",
                    "fields": {
                        "keyword": {"type": "keyword"}
                    }
                },
                "model_variant": {"type": "keyword"},
                
                # Year
                "year": {"type": "integer"},
                
                # Registration
                "registration_id": {"type": "keyword"},
                "registration_country": {"type": "keyword"},
                "registration_status": {"type": "keyword"},
                
                # Location (nested object)
                "location": {
                    "properties": {
                        "city": {"type": "keyword"},
                        "state_province": {"type": "keyword"},
                        "country": {"type": "keyword"},
                        "coordinates": {"type": "geo_point"}
                    }
                },
                
                # Dates (nested object)
                "dates": {
                    "properties": {
                        "manufactured": {"type": "date"},
                        "registered": {"type": "date"},
                        "last_activity": {"type": "date"},
                        "expires": {"type": "date"}
                    }
                },
                
                # Owner (nested object)
                "owner": {
                    "properties": {
                        "type": {"type": "keyword"},
                        "name": {
                            "type": "text",
                            "fields": {"keyword": {"type": "keyword"}}
                        },
                        "country": {"type": "keyword"}
                    }
                },
                
                # Specifications (nested object)
                "specifications": {
                    "properties": {
                        "engine_type": {"type": "keyword"},
                        "fuel_type": {"type": "keyword"},
                        "capacity": {"type": "integer"},
                        "power": {"type": "object", "enabled": True}
                    }
                },
                
                # Metadata (nested object)
                "metadata": {
                    "properties": {
                        "source": {"type": "keyword"},
                        "source_id": {"type": "keyword"},
                        "ingest_date": {"type": "date"},
                        "last_updated": {"type": "date"}
                    }
                },
                
                # Type-specific data (stored as objects, not indexed deeply)
                "plane_data": {"type": "object", "enabled": True},
                "automobile_data": {"type": "object", "enabled": True},
                "train_data": {"type": "object", "enabled": True}
            }
        }
    }
    
    # Create the index
    es.indices.create(index=index_name, body=index_body)
    print(f"✅ Created index: {index_name}")
    
    # Verify creation
    info = es.indices.get(index=index_name)
    print(f"📊 Index settings:")
    print(f"   - Shards: {info[index_name]['settings']['index']['number_of_shards']}")
    print(f"   - Replicas: {info[index_name]['settings']['index']['number_of_replicas']}")
    print(f"   - Mappings: {len(info[index_name]['mappings']['properties'])} top-level fields")


def create_type_specific_indices():
    """Create separate indices for each transport type (alternative approach)"""
    es = Elasticsearch(['http://thor:30398'])
    
    indices = {
        "planes": "transport-planes",
        "automobiles": "transport-automobiles"
    }
    
    print("\n" + "="*60)
    print("Type-Specific Indices (Optional)")
    print("="*60)
    
    for transport_type, index_name in indices.items():
        if es.indices.exists(index=index_name):
            print(f"ℹ️  Index '{index_name}' already exists, skipping")
            continue
        
        # Simplified mapping (inherits from unified but type-specific)
        index_body = {
            "settings": {
                "number_of_shards": 1,
                "number_of_replicas": 0
            },
            "mappings": {
                "properties": {
                    "transport_id": {"type": "keyword"},
                    "manufacturer": {"type": "keyword"},
                    "model": {"type": "text"},
                    "year": {"type": "integer"}
                    # Additional type-specific fields would go here
                }
            }
        }
        
        es.indices.create(index=index_name, body=index_body)
        print(f"✅ Created type-specific index: {index_name}")


def test_index_access():
    """Verify we can write to and read from the index"""
    es = Elasticsearch(['http://thor:30398'])
    index_name = "transport-unified"
    
    print("\n" + "="*60)
    print("Testing Index Operations")
    print("="*60)
    
    # Test document
    test_doc = {
        "transport_id": "test-001",
        "transport_type": "plane",
        "manufacturer": "Test Aircraft Co",
        "model": "Test Model",
        "year": 2025,
        "metadata": {
            "source": "faa",
            "source_id": "TEST001"
        }
    }
    
    # Index a test document
    result = es.index(index=index_name, id="test-001", document=test_doc)
    print(f"✅ Indexed test document: {result['result']}")
    
    # Retrieve it
    doc = es.get(index=index_name, id="test-001")
    print(f"✅ Retrieved test document: {doc['_source']['manufacturer']}")
    
    # Delete test document
    es.delete(index=index_name, id="test-001")
    print(f"✅ Deleted test document")
    
    # Refresh index
    es.indices.refresh(index=index_name)
    print(f"✅ Index operations working correctly!")


if __name__ == "__main__":
    print("\n🔧 Creating Elasticsearch Indices\n")
    
    create_transport_index()
    # create_type_specific_indices()  # Uncomment if you want separate indices
    test_index_access()
    
    print("\n✅ Elasticsearch indices are ready for data ingestion! 🎉\n")
