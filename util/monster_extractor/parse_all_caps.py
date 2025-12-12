#!/usr/bin/env python3
"""
Parse ALL CAPS Phrases Script

Processes all .txt files in text_clean_p2 folder, identifies ALL CAPS phrases
(single words with 3+ uppercase letters or sequences of uppercase words),
extracts them to their own lines with at least one blank line preceding them,
and writes the processed output to a new text_clean_p3 folder.

Usage:
    python3 parse_all_caps.py [--input-dir DIR] [--output-dir DIR] [--dry-run]
"""

import argparse
import logging
import re
import sys
from pathlib import Path
from typing import List, Tuple

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Pattern to match ALL CAPS phrases:
# - Single uppercase words with 3+ letters (e.g., "COMBAT", "ARCHON")
# - Sequences of uppercase words separated by spaces (e.g., "LANTERN ARCHON", "HOUND ARCHON HERO")
ALL_CAPS_PATTERN = re.compile(r'\b([A-Z]{3,}(?:\s+[A-Z]{3,})*)\b')


def find_all_caps_phrases(line: str) -> List[Tuple[int, int, str]]:
    """
    Find all ALL CAPS phrases in a line.
    
    Returns a list of tuples: (start_pos, end_pos, phrase)
    """
    matches = []
    for match in ALL_CAPS_PATTERN.finditer(line):
        start, end = match.span()
        phrase = match.group(1)
        matches.append((start, end, phrase))
    return matches


def split_line_with_all_caps(line: str) -> List[str]:
    """
    Split a line that contains ALL CAPS phrases.
    
    If a line contains "some text ALL CAPS more text", it becomes:
    - "some text"
    - "ALL CAPS"
    - "more text"
    
    Returns a list of line parts. If the line is entirely an ALL CAPS phrase,
    returns the line as-is (blank line handling will be done separately).
    """
    phrases = find_all_caps_phrases(line)
    
    if not phrases:
        # No ALL CAPS phrases found, return line as-is
        return [line]
    
    # Check if the entire line is just the ALL CAPS phrase(s)
    stripped_line = line.strip()
    if len(phrases) == 1:
        start, end, phrase = phrases[0]
        # Check if the entire line (minus leading/trailing whitespace) is the phrase
        if stripped_line == phrase:
            return [line]
    
    # Check if line contains multiple phrases that together make up the whole line
    # (e.g., "COMBAT TACTICS" where both words are ALL CAPS)
    first_start = phrases[0][0]
    last_end = phrases[-1][1]
    # Check if there's any non-whitespace before first phrase or after last phrase
    has_text_before = line[:first_start].strip() != ''
    has_text_after = line[last_end:].strip() != ''
    
    if not has_text_before and not has_text_after:
        # Line is entirely ALL CAPS phrase(s), return as-is
        return [line]
    
    # Split the line into parts
    result = []
    last_end = 0
    
    for start, end, phrase in phrases:
        # Add text before the phrase
        before = line[last_end:start].rstrip()
        if before:
            result.append(before)
        
        # Add the ALL CAPS phrase
        result.append(phrase)
        
        last_end = end
    
    # Add any remaining text after the last phrase
    after = line[last_end:].lstrip()
    if after:
        result.append(after)
    
    return result


def ensure_blank_line_before(lines: List[str], index: int) -> List[str]:
    """
    Ensure at least one blank line exists before the line at the given index.
    Preserves existing blank lines if 2+ already exist.
    Does not add a blank line if the line is at the start of the file (index 0).
    
    Returns the modified list of lines.
    """
    if index == 0:
        # At the start of file, do not add a blank line
        return lines
    
    # Count blank lines before current line
    blank_count = 0
    for i in range(index - 1, -1, -1):
        if lines[i].strip() == '':
            blank_count += 1
        else:
            break
    
    if blank_count == 0:
        # No blank line exists, insert one
        lines.insert(index, '')
        return lines
    # If blank_count >= 1, we preserve existing blank lines
    return lines


def process_file(input_path: Path, output_path: Path, dry_run: bool = False) -> None:
    """
    Process a single file to extract ALL CAPS phrases.
    """
    logger.info(f"Processing: {input_path.name}")
    
    with open(input_path, 'r', encoding='utf-8') as f:
        input_lines = f.readlines()
    
    output_lines = []
    
    for line_num, line in enumerate(input_lines):
        # Check if line contains ALL CAPS phrases
        phrases = find_all_caps_phrases(line)
        
        if not phrases:
            # No ALL CAPS phrases, add line as-is
            output_lines.append(line.rstrip('\n'))
            continue
        
        # Check if line is entirely an ALL CAPS phrase (with possible whitespace)
        stripped_line = line.strip()
        if len(phrases) == 1:
            start, end, phrase = phrases[0]
            # Check if the entire line (minus leading/trailing whitespace) is the phrase
            if stripped_line == phrase:
                # Line is already just the ALL CAPS phrase
                # Ensure blank line before it
                output_lines.append(line.rstrip('\n'))
                # We'll handle blank line insertion after processing all lines
                continue
        
        # Line contains ALL CAPS phrase(s) with other text - split it
        parts = split_line_with_all_caps(line.rstrip('\n'))
        
        # Add each part as a separate line
        for part in parts:
            if part.strip():  # Only add non-empty parts (empty parts are handled by blank line logic)
                output_lines.append(part)
    
    # Now ensure blank lines before ALL CAPS phrase lines
    i = 0
    while i < len(output_lines):
        line = output_lines[i]
        stripped = line.strip()
        # Check if this line is entirely an ALL CAPS phrase
        if stripped and ALL_CAPS_PATTERN.fullmatch(stripped):
            # Ensure blank line before
            original_len = len(output_lines)
            output_lines = ensure_blank_line_before(output_lines, i)
            # Adjust index if we inserted a line
            if len(output_lines) > original_len:
                i += 1  # Skip the blank line we just inserted
        i += 1
    
    # Write output
    if not dry_run:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, 'w', encoding='utf-8') as f:
            for line in output_lines:
                f.write(line + '\n')
        logger.info(f"Written: {output_path}")
    else:
        logger.info(f"[DRY RUN] Would write {len(output_lines)} lines to: {output_path}")


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description='Parse ALL CAPS phrases from text files'
    )
    parser.add_argument(
        '--input-dir',
        type=str,
        default='output/monsters/text_clean_p2',
        help='Input directory containing .txt files (default: output/monsters/text_clean_p2)'
    )
    parser.add_argument(
        '--output-dir',
        type=str,
        default='output/monsters/text_clean_p3',
        help='Output directory for processed files (default: output/monsters/text_clean_p3)'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Process files without writing output (for testing)'
    )
    
    args = parser.parse_args()
    
    # Resolve paths relative to script directory
    script_dir = Path(__file__).parent
    input_dir = script_dir / args.input_dir
    output_dir = script_dir / args.output_dir
    
    if not input_dir.exists():
        logger.error(f"Input directory does not exist: {input_dir}")
        sys.exit(1)
    
    # Find all .txt files
    txt_files = list(input_dir.glob('*.txt'))
    
    if not txt_files:
        logger.warning(f"No .txt files found in: {input_dir}")
        return
    
    logger.info(f"Found {len(txt_files)} .txt files to process")
    
    # Process each file
    for txt_file in sorted(txt_files):
        relative_path = txt_file.relative_to(input_dir)
        output_path = output_dir / relative_path
        process_file(txt_file, output_path, args.dry_run)
    
    logger.info("Processing complete!")


if __name__ == '__main__':
    main()

