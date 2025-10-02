"""Complete ETL pipeline orchestrator"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

import argparse
import logging
from datetime import datetime

from extractors.faa_extractor import FAAExtractor
from transformers.faa_transformer import FAATransformer
from loaders.elasticsearch_loader import ElasticsearchLoader

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def run_faa_pipeline(limit: int = None, force_download: bool = False):
    """
    Run complete FAA aircraft ETL pipeline
    
    Args:
        limit: Optional limit on number of records to process
        force_download: Force re-download of FAA data
    """
    logger.info("="*80)
    logger.info("FAA AIRCRAFT ETL PIPELINE")
    logger.info("="*80)
    logger.info(f"Started at: {datetime.now().isoformat()}")
    if limit:
        logger.info(f"Record limit: {limit}")
    logger.info("")
    
    # Step 1: Extract
    logger.info("STEP 1: EXTRACTION")
    logger.info("-" * 80)
    extractor = FAAExtractor()
    files = extractor.run(force_download=force_download)
    
    if not files or 'master' not in files:
        logger.error("Failed to extract FAA data")
        return False
    
    # Step 2: Transform
    logger.info("\nSTEP 2: TRANSFORMATION")
    logger.info("-" * 80)
    transformer = FAATransformer()
    transformer.load_reference_data(files['aircraft_ref'], files['engine'])
    
    planes = transformer.transform_file(files['master'], limit=limit)
    
    if not planes:
        logger.error("No valid records transformed")
        return False
    
    # Step 3: Load
    logger.info("\nSTEP 3: LOADING")
    logger.info("-" * 80)
    loader = ElasticsearchLoader()
    
    if not loader.verify_index_exists():
        logger.error("Target index does not exist. Run create_indices.py first!")
        return False
    
    result = loader.load_and_refresh(planes)
    
    # Summary
    logger.info("\n" + "="*80)
    logger.info("PIPELINE SUMMARY")
    logger.info("="*80)
    logger.info(f"Records transformed: {len(planes)}")
    logger.info(f"Records loaded: {result['success']}")
    logger.info(f"Errors: {result['errors']}")
    logger.info(f"Success rate: {result['success']/len(planes)*100:.1f}%")
    
    # Index statistics
    total = loader.get_record_count()
    type_counts = loader.get_transport_type_counts()
    
    logger.info(f"\nTotal documents in index: {total}")
    for t_type, count in type_counts.items():
        logger.info(f"  - {t_type}: {count}")
    
    logger.info(f"\nCompleted at: {datetime.now().isoformat()}")
    logger.info("="*80)
    
    return True


def main():
    """Main entry point with CLI arguments"""
    parser = argparse.ArgumentParser(
        description='Transportation Data ETL Pipeline'
    )
    parser.add_argument(
        '--source',
        choices=['faa', 'nhtsa', 'all'],
        default='faa',
        help='Data source to process'
    )
    parser.add_argument(
        '--limit',
        type=int,
        default=None,
        help='Limit number of records to process (for testing)'
    )
    parser.add_argument(
        '--force-download',
        action='store_true',
        help='Force re-download of source data'
    )
    parser.add_argument(
        '--full',
        action='store_true',
        help='Process all records (no limit)'
    )
    
    args = parser.parse_args()
    
    # Set limit based on args
    limit = None if args.full else args.limit
    
    if args.source == 'faa' or args.source == 'all':
        success = run_faa_pipeline(limit=limit, force_download=args.force_download)
        if not success:
            sys.exit(1)
    
    # Future: Add NHTSA pipeline here
    # if args.source == 'nhtsa' or args.source == 'all':
    #     run_nhtsa_pipeline(limit=limit)
    
    logger.info("\n✅ ETL Pipeline completed successfully!")


if __name__ == "__main__":
    main()
