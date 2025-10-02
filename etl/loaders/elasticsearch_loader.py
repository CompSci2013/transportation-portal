"""Load transformed data into Elasticsearch"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import logging
from typing import List, Dict, Any
from elasticsearch import Elasticsearch
from elasticsearch.helpers import bulk, BulkIndexError
from models import PlaneTransport, AutomobileTransport

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ElasticsearchLoader:
    """Load transport data into Elasticsearch"""
    
    def __init__(self, es_url: str = "http://thor:30398", index_name: str = "transport-unified"):
        """
        Initialize loader
        
        Args:
            es_url: Elasticsearch connection URL
            index_name: Target index name
        """
        self.es = Elasticsearch([es_url])
        self.index_name = index_name
        logger.info(f"Elasticsearch Loader initialized")
        logger.info(f"  URL: {es_url}")
        logger.info(f"  Index: {index_name}")
        
        # Test connection
        try:
            health = self.es.cluster.health()
            logger.info(f"  Cluster: {health['cluster_name']} ({health['status']})")
        except Exception as e:
            logger.error(f"Failed to connect to Elasticsearch: {e}")
            raise
    
    def verify_index_exists(self) -> bool:
        """Check if target index exists"""
        exists = self.es.indices.exists(index=self.index_name)
        if exists:
            logger.info(f"✅ Index '{self.index_name}' exists")
        else:
            logger.error(f"❌ Index '{self.index_name}' does not exist")
            logger.error("Run create_indices.py first!")
        return exists
    
    def prepare_bulk_actions(self, records: List[Any]) -> List[Dict]:
        """
        Convert Pydantic models to Elasticsearch bulk actions
        
        Args:
            records: List of PlaneTransport or AutomobileTransport objects
            
        Returns:
            List of bulk action dictionaries
        """
        actions = []
        
        for record in records:
            # Convert Pydantic model to dict
            doc = record.model_dump(mode='json')
            
            # Create bulk action
            action = {
                '_index': self.index_name,
                '_id': record.transport_id,
                '_source': doc
            }
            actions.append(action)
        
        return actions
    
    def load_batch(self, records: List[Any], chunk_size: int = 1000) -> Dict[str, int]:
        """
        Load a batch of records using bulk API
        
        Args:
            records: List of transport records (PlaneTransport, etc.)
            chunk_size: Number of documents per bulk request
            
        Returns:
            Dictionary with success/error counts
        """
        if not records:
            logger.warning("No records to load")
            return {'success': 0, 'errors': 0}
        
        logger.info(f"Loading {len(records)} records in chunks of {chunk_size}")
        
        # Prepare bulk actions
        actions = self.prepare_bulk_actions(records)
        
        try:
            # Execute bulk insert
            success, errors = bulk(
                self.es,
                actions,
                chunk_size=chunk_size,
                raise_on_error=False,
                raise_on_exception=False
            )
            
            logger.info(f"✅ Loaded {success} records")
            if errors:
                logger.warning(f"⚠️  {len(errors)} errors occurred")
            
            return {'success': success, 'errors': len(errors) if isinstance(errors, list) else 0}
            
        except BulkIndexError as e:
            logger.error(f"Bulk indexing error: {e}")
            return {'success': 0, 'errors': len(e.errors)}
        except Exception as e:
            logger.error(f"Unexpected error during load: {e}")
            return {'success': 0, 'errors': len(records)}
    
    def load_and_refresh(self, records: List[Any]) -> Dict[str, int]:
        """
        Load records and refresh index for immediate availability
        
        Args:
            records: List of transport records
            
        Returns:
            Dictionary with success/error counts
        """
        result = self.load_batch(records)
        
        # Refresh index to make documents searchable immediately
        self.es.indices.refresh(index=self.index_name)
        logger.info(f"Index refreshed, documents immediately searchable")
        
        return result
    
    def get_record_count(self) -> int:
        """Get total number of documents in index"""
        count = self.es.count(index=self.index_name)
        return count['count']
    
    def get_transport_type_counts(self) -> Dict[str, int]:
        """Get document counts by transport type"""
        query = {
            "size": 0,
            "aggs": {
                "by_type": {
                    "terms": {
                        "field": "transport_type"
                    }
                }
            }
        }
        
        result = self.es.search(index=self.index_name, body=query)
        
        counts = {}
        for bucket in result['aggregations']['by_type']['buckets']:
            counts[bucket['key']] = bucket['doc_count']
        
        return counts
    
    def sample_search(self, transport_type: str = None, size: int = 5) -> List[Dict]:
        """
        Perform a sample search
        
        Args:
            transport_type: Filter by type (plane, automobile, train)
            size: Number of results to return
            
        Returns:
            List of matching documents
        """
        query = {"match_all": {}}
        
        if transport_type:
            query = {
                "term": {
                    "transport_type": transport_type
                }
            }
        
        result = self.es.search(
            index=self.index_name,
            body={"query": query, "size": size}
        )
        
        return [hit['_source'] for hit in result['hits']['hits']]


if __name__ == "__main__":
    """Test the loader with sample data"""
    from transformers.faa_transformer import FAATransformer
    from extractors.faa_extractor import FAAExtractor
    
    logger.info("\n" + "="*60)
    logger.info("Testing Elasticsearch Loader")
    logger.info("="*60 + "\n")
    
    # Get FAA files
    extractor = FAAExtractor()
    files = extractor.get_files()
    
    if not files:
        logger.error("No FAA files found!")
        exit(1)
    
    # Transform sample data
    transformer = FAATransformer()
    transformer.load_reference_data(files['aircraft_ref'], files['engine'])
    
    logger.info("Transforming first 1000 records...")
    planes = transformer.transform_file(files['master'], limit=1000)
    logger.info(f"Transformed {len(planes)} valid records")
    
    # Load into Elasticsearch
    loader = ElasticsearchLoader()
    
    if not loader.verify_index_exists():
        exit(1)
    
    logger.info("\n" + "="*60)
    logger.info("Loading data into Elasticsearch")
    logger.info("="*60 + "\n")
    
    result = loader.load_and_refresh(planes)
    
    logger.info("\n" + "="*60)
    logger.info("Load Summary")
    logger.info("="*60)
    logger.info(f"  Successfully loaded: {result['success']}")
    logger.info(f"  Errors: {result['errors']}")
    
    # Show statistics
    total = loader.get_record_count()
    logger.info(f"  Total documents in index: {total}")
    
    type_counts = loader.get_transport_type_counts()
    for t_type, count in type_counts.items():
        logger.info(f"    - {t_type}: {count}")
    
    # Sample search
    logger.info("\n" + "="*60)
    logger.info("Sample Search Results")
    logger.info("="*60 + "\n")
    
    samples = loader.sample_search(transport_type='plane', size=3)
    for i, doc in enumerate(samples, 1):
        print(f"{i}. {doc['transport_id']}: {doc['manufacturer']} {doc['model']} ({doc.get('year', 'N/A')})")
    
    print("\n✅ Loader test complete!")
