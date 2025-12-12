#!/usr/bin/env python3
"""
Script to remove blank lines from the end of all blocks in tagged monster files.

For example:
{SA}
My ability (Su):
    Some ability text.

{/SA}

becomes:
{SA}
My ability (Su):
    Some ability text.
{/SA}
"""

import os
import re
from pathlib import Path


def remove_trailing_blank_lines_from_blocks(content: str) -> str:
    """
    Remove blank lines that appear before closing tags like {/SA}, {/DESCRIPTION}, etc.
    
    Args:
        content: The file content to process
        
    Returns:
        The processed content with trailing blank lines removed from blocks
    """
    # Pattern to match closing tags: {/TAGNAME}
    # We want to remove blank lines (one or more) that appear immediately before these tags
    # This regex finds closing tags and removes blank lines before them
    lines = content.split('\n')
    result_lines = []
    i = 0
    
    while i < len(lines):
        line = lines[i]
        
        # Check if this is a closing tag
        if re.match(r'^\{/[A-Z]+\}$', line):
            # Remove any trailing blank lines we've accumulated
            while result_lines and result_lines[-1].strip() == '':
                result_lines.pop()
            result_lines.append(line)
        else:
            result_lines.append(line)
        
        i += 1
    
    return '\n'.join(result_lines)


def process_file(file_path: Path) -> bool:
    """
    Process a single file to remove trailing blank lines from blocks.
    
    Args:
        file_path: Path to the file to process
        
    Returns:
        True if the file was modified, False otherwise
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            original_content = f.read()
        
        processed_content = remove_trailing_blank_lines_from_blocks(original_content)
        
        if original_content != processed_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(processed_content)
            return True
        return False
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False


def main():
    """Main function to process all files in the tagged folder."""
    # Get the directory containing this script
    script_dir = Path(__file__).parent
    tagged_dir = script_dir / 'output' / 'monsters' / 'tagged'
    
    if not tagged_dir.exists():
        print(f"Error: Tagged directory not found at {tagged_dir}")
        return
    
    # Get all .txt files in the tagged directory
    txt_files = list(tagged_dir.glob('*.txt'))
    
    if not txt_files:
        print(f"No .txt files found in {tagged_dir}")
        return
    
    print(f"Processing {len(txt_files)} files in {tagged_dir}...")
    
    modified_count = 0
    for file_path in sorted(txt_files):
        if process_file(file_path):
            print(f"Modified: {file_path.name}")
            modified_count += 1
    
    print(f"\nDone! Modified {modified_count} out of {len(txt_files)} files.")


if __name__ == '__main__':
    main()

