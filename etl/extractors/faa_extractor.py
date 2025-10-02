"""FAA Aircraft Registry data extractor"""
import requests
import zipfile
import os
import time
from pathlib import Path
from typing import Optional
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class FAAExtractor:
    """Extract FAA aircraft registration data"""
    
    FAA_URL = "https://registry.faa.gov/database/ReleasableAircraft.zip"
    DATA_DIR = Path("/app/data/faa")
    
    def __init__(self):
        """Initialize extractor"""
        self.data_dir = self.DATA_DIR
        self.data_dir.mkdir(parents=True, exist_ok=True)
        logger.info(f"FAA Extractor initialized. Data dir: {self.data_dir}")
    
    def download(self, force: bool = False, max_retries: int = 3) -> Path:
        """
        Download FAA database ZIP file with retry logic
        
        Args:
            force: If True, download even if file exists
            max_retries: Number of retry attempts
            
        Returns:
            Path to downloaded ZIP file
        """
        zip_path = self.data_dir / "ReleasableAircraft.zip"
        
        if zip_path.exists() and not force:
            logger.info(f"ZIP file already exists: {zip_path}")
            logger.info("Use force=True to re-download")
            return zip_path
        
        logger.info(f"Downloading FAA database from {self.FAA_URL}")
        logger.info("This may take a few minutes (~60MB)...")
        
        for attempt in range(max_retries):
            try:
                # Configure session with timeout and headers
                session = requests.Session()
                session.headers.update({
                    'User-Agent': 'Mozilla/5.0 (Transportation Portal ETL)',
                })
                
                response = session.get(
                    self.FAA_URL, 
                    stream=True,
                    timeout=(10, 300)  # (connect, read) timeouts in seconds
                )
                response.raise_for_status()
                
                # Download with progress
                total_size = int(response.headers.get('content-length', 0))
                downloaded = 0
                
                with open(zip_path, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        if chunk:
                            f.write(chunk)
                            downloaded += len(chunk)
                            if total_size > 0:
                                pct = (downloaded / total_size) * 100
                                print(f"\rProgress: {pct:.1f}% ({downloaded / 1024 / 1024:.1f} MB)", 
                                      end='', flush=True)
                
                print()  # New line after progress
                logger.info(f"✅ Downloaded {downloaded / 1024 / 1024:.1f} MB")
                return zip_path
                
            except (requests.exceptions.RequestException, 
                    requests.exceptions.Timeout,
                    ConnectionError) as e:
                logger.warning(f"Attempt {attempt + 1}/{max_retries} failed: {e}")
                
                if attempt < max_retries - 1:
                    wait_time = 5 * (attempt + 1)  # Exponential backoff
                    logger.info(f"Retrying in {wait_time} seconds...")
                    time.sleep(wait_time)
                    
                    # Clean up partial download
                    if zip_path.exists():
                        zip_path.unlink()
                else:
                    logger.error("All download attempts failed")
                    logger.error("Alternative: Download manually from browser and place at:")
                    logger.error(f"  {zip_path}")
                    raise
    
    def extract(self, zip_path: Optional[Path] = None) -> dict:
        """
        Extract ZIP file contents
        
        Args:
            zip_path: Path to ZIP file (downloads if not provided)
            
        Returns:
            Dictionary mapping filename to extracted path
        """
        if zip_path is None:
            zip_path = self.data_dir / "ReleasableAircraft.zip"
            if not zip_path.exists():
                logger.error(f"ZIP file not found: {zip_path}")
                raise FileNotFoundError(f"ZIP file not found: {zip_path}")
        
        extract_dir = self.data_dir / "extracted"
        extract_dir.mkdir(exist_ok=True)
        
        logger.info(f"Extracting {zip_path} to {extract_dir}")
        
        extracted_files = {}
        
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            file_list = zip_ref.namelist()
            logger.info(f"ZIP contains {len(file_list)} files")
            
            for filename in file_list:
                if filename.endswith('.txt'):
                    zip_ref.extract(filename, extract_dir)
                    extracted_path = extract_dir / filename
                    extracted_files[filename] = extracted_path
                    
                    # Get file size
                    size_mb = extracted_path.stat().st_size / 1024 / 1024
                    logger.info(f"  ✅ {filename} ({size_mb:.1f} MB)")
        
        logger.info(f"Extracted {len(extracted_files)} CSV files")
        return extracted_files
    
    def get_files(self) -> dict:
        """
        Get paths to all extracted FAA data files
        
        Returns:
            Dictionary mapping logical name to file path
        """
        extract_dir = self.data_dir / "extracted"
        
        file_mapping = {
            'master': extract_dir / 'MASTER.txt',
            'aircraft_ref': extract_dir / 'ACFTREF.txt',
            'engine': extract_dir / 'ENGINE.txt',
            'dealer': extract_dir / 'DEALER.txt',
            'dereg': extract_dir / 'DEREG.txt',
            'docindex': extract_dir / 'DOCINDEX.txt',
            'reserved': extract_dir / 'RESERVED.txt'
        }
        
        # Check which files exist
        existing = {}
        for name, path in file_mapping.items():
            if path.exists():
                existing[name] = path
            else:
                logger.warning(f"File not found: {path}")
        
        return existing
    
    def run(self, force_download: bool = False) -> dict:
        """
        Complete extraction process
        
        Args:
            force_download: Force re-download even if files exist
            
        Returns:
            Dictionary of extracted file paths
        """
        logger.info("="*60)
        logger.info("FAA Data Extraction")
        logger.info("="*60)
        
        # Download
        try:
            zip_path = self.download(force=force_download)
        except Exception as e:
            logger.error(f"Download failed: {e}")
            logger.info("\nAlternative: Download manually and skip to extraction")
            return {}
        
        # Extract
        self.extract(zip_path)
        
        # Get file paths
        files = self.get_files()
        
        logger.info("="*60)
        logger.info(f"✅ Extraction complete! {len(files)} files ready")
        logger.info("="*60)
        
        return files


if __name__ == "__main__":
    """Test the extractor"""
    extractor = FAAExtractor()
    files = extractor.run()
    
    print("\n📁 Available files:")
    for name, path in files.items():
        print(f"  - {name}: {path}")
