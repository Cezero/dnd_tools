#!/usr/bin/env python3
"""
Batch process all HTML files with the working clean content extractor
"""

import os
import subprocess
import time
from pathlib import Path

def main():
    # Find all HTML files in extracted-content/
    extracted_dir = Path('extracted-content')
    if not extracted_dir.exists():
        print("❌ extracted-content directory not found")
        return
    
    # Get all HTML files
    html_files = list(extracted_dir.rglob('*.html'))
    total_files = len(html_files)
    
    print(f"🔍 Found {total_files} HTML files to process")
    print("🚀 Starting batch processing...")
    
    success_count = 0
    error_count = 0
    start_time = time.time()
    
    for i, html_file in enumerate(html_files, 1):
        # Progress indicator
        if i % 50 == 0 or i == total_files:
            elapsed = time.time() - start_time
            rate = i / elapsed if elapsed > 0 else 0
            eta = (total_files - i) / rate if rate > 0 else 0
            print(f"📊 Progress: {i}/{total_files} ({i/total_files*100:.1f}%) - {rate:.1f} files/sec - ETA: {eta:.0f}s")
        
        try:
            # Run the extractor on this file
            result = subprocess.run(
                ['python3', 'clean_content_extractor.py', str(html_file)],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                success_count += 1
            else:
                error_count += 1
                print(f"❌ Error processing {html_file}: {result.stderr.strip()}")
                
        except subprocess.TimeoutExpired:
            error_count += 1
            print(f"⏰ Timeout processing {html_file}")
        except Exception as e:
            error_count += 1
            print(f"💥 Exception processing {html_file}: {e}")
    
    elapsed = time.time() - start_time
    print(f"\n🎉 BATCH PROCESSING COMPLETE!")
    print(f"✅ Successfully processed: {success_count}/{total_files}")
    print(f"❌ Errors: {error_count}/{total_files}")
    print(f"⏱️  Total time: {elapsed:.1f} seconds")
    print(f"📈 Average rate: {total_files/elapsed:.1f} files/second")
    
    # Check output directory
    output_dir = Path('final-clean-content')
    if output_dir.exists():
        output_files = list(output_dir.rglob('*.html'))
        print(f"📁 Output files created: {len(output_files)}")

if __name__ == "__main__":
    main()
