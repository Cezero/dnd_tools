#!/usr/bin/env python3
"""
Fix Concatenated Statblock Labels

Processes all .txt files in the tagged directory to ensure each STATBLOCK_LABEL
appears on its own line by splitting concatenated labels. Only fixes labels
found within {STATBLOCK} blocks.

Usage:
    python3 fix_statblock_labels.py [--input-dir DIR] [--dry-run]
"""

import argparse
import logging
import re
import sys
from pathlib import Path
from typing import List

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Statblock labels in their canonical order
STATBLOCK_LABELS_ORDERED = [
    'Hit Dice', 'Initiative', 'Speed', 'Armor Class', 'Base Attack/Grapple',
    'Attack', 'Full Attack', 'Space/Reach', 'Special Attacks', 'Special Qualities',
    'Saves', 'Abilities', 'Skills', 'Feats', 'Environment', 'Organization',
    'Challenge Rating', 'Treasure', 'Alignment', 'Advancement', 'Level Adjustment'
]

STATBLOCK_LABELS = set(STATBLOCK_LABELS_ORDERED)


def is_statblock_start(line: str) -> bool:
    """Check if a line starts a statblock (starts with 'Hit Dice:')."""
    return line.strip().startswith('Hit Dice:')


def is_statblock_end(line: str) -> bool:
    """Check if a line ends a statblock (contains 'Level Adjustment:' or 'Advancement:')."""
    stripped = line.strip()
    return stripped.startswith('Level Adjustment:') or stripped.startswith('Advancement:')


def split_concatenated_labels(line: str) -> List[str]:
    """
    Split a line that contains multiple statblock labels.
    
    Returns a list of lines, where each statblock label starts on its own line.
    Labels can be:
    - Immediately concatenated (e.g., 'poisonSpecial Qualities:')
    - On the same line separated by content (e.g., 'Skills: ... Feats:')
    
    Process labels in order, only checking for the next expected label in sequence.
    Start searching for each next label from the end of the previously found label.
    This prevents false matches (e.g., matching "Attack:" inside "Full Attack:").
    """
    # Walk through labels in order (front to back)
    # For each label found, recursively check for all subsequent labels on the same line
    split_positions = []
    current_pos = 0  # Current position in the line
    
    for i in range(len(STATBLOCK_LABELS_ORDERED)):
        label = STATBLOCK_LABELS_ORDERED[i]
        
        # Build pattern for this label
        if ' ' in label or '/' in label:
            pattern = re.escape(label) + r':'
        else:
            pattern = r'\b' + re.escape(label) + r':'
        
        # Search for this label starting from current_pos
        match = re.search(pattern, line[current_pos:])
        
        if not match:
            # Also check for immediately concatenated labels (no space before)
            concatenated_pattern = r'([^\s\n])' + re.escape(label) + r':'
            match = re.search(concatenated_pattern, line[current_pos:])
            if match:
                # Adjust position (pattern captures one char before label)
                label_start = current_pos + match.start() + 1
            else:
                continue
        else:
            label_start = current_pos + match.start()
        
        # Found current label - update current_pos to end of this label
        label_end = label_start + len(label) + 1  # +1 for the colon
        
        # Recursively check for all subsequent labels on the same line
        # Start from the label we just found and keep checking for next labels
        search_pos = label_end
        label_idx = i
        
        while label_idx < len(STATBLOCK_LABELS_ORDERED) - 1:
            next_label = STATBLOCK_LABELS_ORDERED[label_idx + 1]
            
            # Build pattern for next label
            if ' ' in next_label or '/' in next_label:
                next_pattern = re.escape(next_label) + r':'
            else:
                next_pattern = r'\b' + re.escape(next_label) + r':'
            
            # Search for next label starting from search_pos
            next_match = re.search(next_pattern, line[search_pos:])
            
            if not next_match:
                # Also check for concatenated next label
                next_concatenated_pattern = r'([^\s\n])' + re.escape(next_label) + r':'
                next_match = re.search(next_concatenated_pattern, line[search_pos:])
                if next_match:
                    next_label_start = search_pos + next_match.start() + 1
                else:
                    # No next label found, stop checking
                    break
            else:
                next_label_start = search_pos + next_match.start()
            
            # Found next label - mark position to split before it
            if next_label_start not in split_positions:
                split_positions.append(next_label_start)
            
            # Continue checking for the label after this one
            search_pos = next_label_start + len(next_label) + 1
            label_idx += 1
        
        # Move current_pos forward to continue searching
        current_pos = label_end
    
    # Sort split positions (descending for reverse processing)
    split_positions.sort(reverse=True)
    
    # If no splits needed, return line as-is
    if not split_positions:
        return [line.rstrip()]
    
    # Insert newlines at split positions (in reverse order)
    modified_line = line
    for split_pos in split_positions:
        modified_line = modified_line[:split_pos] + '\n' + modified_line[split_pos:]
    
    # Split into lines and return
    result_lines = [l.rstrip() for l in modified_line.split('\n') if l.strip()]
    return result_lines if result_lines else [line.rstrip()]


def fix_level_adjustment_line(line: str) -> tuple[str, bool]:
    """
    Ensure there's a newline after 'Level Adjustment: value'.
    If text follows the value, split it to a new line.
    
    Returns (fixed_line, was_modified)
    """
    stripped = line.strip()
    if not stripped.startswith('Level Adjustment:'):
        return line.rstrip(), False
    
    # Remove the "Level Adjustment: " prefix
    after_label = stripped[len('Level Adjustment:'):].strip()
    
    if not after_label:
        return line.rstrip(), False
    
    # Value patterns: +0, +2, --, --., or "Same as the base creature +2."
    # If there's text after that starts with an uppercase letter,
    # it should be on a new line
    # Pattern: match value, then capture any following text starting with uppercase letter
    # The value can be:
    #   - A number: +0, +2, etc.
    #   - -- or --.
    #   - "Same as..." ending with period
    #   - Any sequence of non-letters (digits, +, -, ., spaces) up to the first uppercase letter
    
    # Match: value (non-letters, but allow +, -, digits, periods, spaces) followed by text starting with uppercase
    pattern = r'^([^A-Z]+?)([A-Z][A-Za-z].*)$'
    match = re.match(pattern, after_label)
    
    if match:
        value_part = match.group(1).strip()
        text_part = match.group(2).strip()
        
        # Validate that value_part looks like a valid Level Adjustment value
        # It should contain: digits, +, --, or "Same as", and not be too long
        is_valid_value = (
            len(value_part) < 60 and
            (re.search(r'\+?\d+', value_part) or 
             '--' in value_part or 
             value_part.startswith('Same as') or
             value_part.strip() in ['--', '--.'])
        )
        
        if is_valid_value:
            return f"Level Adjustment: {value_part}\n{text_part}", True
    
    return line.rstrip(), False


def process_file(file_path: Path, dry_run: bool = False) -> bool:
    """
    Process a single file to fix concatenated statblock labels.
    
    Returns True if the file was modified, False otherwise.
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except Exception as e:
        logger.error(f"Error reading {file_path}: {e}")
        return False
    
    modified_lines = []
    in_statblock_tag = False  # Track if we're inside {STATBLOCK}...{/STATBLOCK}
    in_statblock = False  # Track if we're in the actual statblock content (between Hit Dice and Level Adjustment)
    file_modified = False
    line_number = 0
    seen_abilities = False  # Track if we've seen Abilities (Skills/Feats come after)
    in_paragraph_section = False  # Track if we're in paragraph section before COMBAT
    paragraph_started = False  # Track if we've seen the first paragraph line
    first_paragraph_blank_kept = False  # Track if we've kept the blank line after first paragraph
    i = 0
    
    while i < len(lines):
        line = lines[i]
        line_number = i + 1
        original_line = line
        stripped_line = line.strip()
        
        # Check for STATBLOCK tag boundaries
        if stripped_line == '{STATBLOCK}':
            in_statblock_tag = True
            in_statblock = False
            seen_abilities = False
            modified_lines.append(line.rstrip())
            i += 1
            continue
        elif stripped_line == '{/STATBLOCK}':
            in_statblock_tag = False
            in_statblock = False
            seen_abilities = False
            in_paragraph_section = False
            paragraph_started = False
            first_paragraph_blank_kept = False
            modified_lines.append(line.rstrip())
            i += 1
            continue
        
        # Only process label-fixing logic when inside a STATBLOCK tag
        if not in_statblock_tag:
            # Outside STATBLOCK tags, keep lines as-is
            modified_lines.append(line.rstrip())
            i += 1
            continue
        
        # We're inside a STATBLOCK tag - now check if we're in the actual statblock content
        # Check if we're entering a statblock
        if is_statblock_start(line):
            in_statblock = True
            seen_abilities = False
        
        # Check for "Spell-Like" split across lines (outside statblocks)
        # Pattern: line ending with "Spell-Like" (possibly indented 4 spaces) 
        # followed by line starting with "Abilities:"
        # Only process this outside statblock content (but still inside STATBLOCK tag)
        if not in_statblock and in_statblock_tag:
            # Check if line ends with "Spell-Like" (with or without leading spaces)
            stripped_line = line.rstrip()
            if stripped_line.endswith('Spell-Like') and not stripped_line.endswith('Spell-Like Abilities:'):
                # Check if next line starts with "Abilities:"
                if i + 1 < len(lines):
                    next_line = lines[i + 1]
                    next_stripped = next_line.strip()
                    if next_stripped.startswith('Abilities:'):
                        # Extract the content after "Abilities:"
                        abilities_content = next_line[len('Abilities:'):].strip()
                        # Remove leading spaces from abilities_content if it starts with spaces
                        abilities_content = abilities_content.lstrip()
                        
                        # Build the fixed version:
                        # 1. If there's content before "Spell-Like" on the same line, split it
                        spell_like_pos = stripped_line.rfind('Spell-Like')
                        content_before = stripped_line[:spell_like_pos].rstrip() if spell_like_pos > 0 else ''
                        
                        fixed_lines = []
                        
                        # If there's content before "Spell-Like" on the same line, add it as a separate line
                        if content_before:
                            fixed_lines.append(content_before)
                        
                        # Insert a blank line before "Spell-Like Abilities:" if there's content before it
                        # (either on the same line or on the previous line)
                        if content_before or (i > 0 and modified_lines and modified_lines[-1].strip()):
                            fixed_lines.append('')
                        
                        # Add "Spell-Like Abilities:" at the start of the line (no indentation)
                        fixed_lines.append('Spell-Like Abilities:')
                        
                        # Add content on next line, indented 4 spaces
                        if abilities_content:
                            fixed_lines.append('    ' + abilities_content)
                        
                        if dry_run:
                            print(f"\n{file_path.name}:{line_number}-{line_number + 1}")
                            print(f"  Original line {line_number}: {original_line.rstrip()}")
                            print(f"  Original line {line_number + 1}: {next_line.rstrip()}")
                            print(f"  Fixed:")
                            for fixed_part in fixed_lines:
                                print(f"    {fixed_part}")
                        
                        modified_lines.extend(fixed_lines)
                        file_modified = True
                        i += 2  # Skip both lines
                        continue
            
            # Check for "Skills:" outside statblocks - insert blank line before it
            # Only process this inside STATBLOCK tag but outside statblock content
            if not in_statblock and in_statblock_tag and line.strip() == 'Skills:':
                # Check if previous line has content (not blank)
                if i > 0 and modified_lines and modified_lines[-1].strip():
                    if dry_run:
                        print(f"\n{file_path.name}:{line_number}")
                        print(f"  Original: {original_line.rstrip()}")
                        print(f"  Fixed:")
                        print(f"    (blank line)")
                        print(f"    Skills:")
                    
                    # Insert blank line before "Skills:"
                    modified_lines.append('')
                    modified_lines.append('Skills:')
                    file_modified = True
                    i += 1
                    continue
            
            # Check for headings like "XXX CHARACTERS", "XXX AS CHARACTERS", "XXX SOCIETY"
            # These should be at the start of a line with a blank line before them
            # Only process this inside STATBLOCK tag but outside statblock content
            if not in_statblock and in_statblock_tag:
                # Pattern: Match full heading first (monster name must be 2+ capital letters)
                # Monster name pattern: 2+ capitals, optionally followed by more capitals, spaces, or hyphens
                heading_pattern = r'([A-Z]{2,}[A-Z -]* (?:AS )?(?:CHARACTERS|SOCIETY))'
                heading_match = re.search(heading_pattern, line)
                if heading_match:
                    heading = heading_match.group(1).strip()
                    heading_start = heading_match.start()
                    
                    # Check if there's text before the heading
                    text_before = line[:heading_start].rstrip()
                    
                    # Only process if there's actual content before the heading (not just whitespace)
                    if text_before and text_before.strip():
                        # Check if previous line needs a blank line before the heading
                        needs_blank_line = True
                        if modified_lines and modified_lines[-1].strip():
                            # Previous line has content, need blank line
                            pass
                        else:
                            # Previous line is blank, don't add another
                            needs_blank_line = False
                        
                        fixed_lines = []
                        if text_before.strip():
                            fixed_lines.append(text_before)
                        if needs_blank_line:
                            fixed_lines.append('')
                        fixed_lines.append(heading)
                        
                        if dry_run:
                            print(f"\n{file_path.name}:{line_number}")
                            print(f"  Original: {original_line.rstrip()}")
                            print(f"  Fixed:")
                            for fixed_part in fixed_lines:
                                print(f"    {fixed_part}")
                        
                        modified_lines.extend(fixed_lines)
                        file_modified = True
                        i += 1
                        continue
                    else:
                        # Heading is already at start (no text before, or only whitespace)
                        # Remove any leading whitespace from the heading and ensure blank line before it
                        heading_clean = heading.strip()
                        needs_blank = modified_lines and modified_lines[-1].strip()
                        needs_fix = (heading != heading_clean) or needs_blank
                        
                        if needs_fix:
                            if dry_run:
                                print(f"\n{file_path.name}:{line_number}")
                                print(f"  Original: {original_line.rstrip()}")
                                print(f"  Fixed:")
                                if needs_blank:
                                    print(f"    (blank line)")
                                print(f"    {heading_clean}")
                            
                            if needs_blank:
                                modified_lines.append('')
                            modified_lines.append(heading_clean)
                            file_modified = True
                            i += 1
                            continue
        
        # Check for Level Adjustment - this can be the last line of a statblock,
        # so check it even if we just left the statblock (after Advancement)
        # Only process this inside STATBLOCK tag
        # NOTE: We do NOT split Level Adjustment lines - they can legitimately contain
        # text in parentheses like "+4 (+6 with Otto's irresistible dance)"
        if in_statblock_tag and line.strip().startswith('Level Adjustment:'):
            # Check if this is the end of a statblock
            if in_statblock:
                in_statblock = False
                seen_abilities = False
                # After statblock ends, we enter paragraph section
                in_paragraph_section = True
                paragraph_started = False
                first_paragraph_blank_kept = False
            
            # Keep Level Adjustment line as-is (don't split it)
            modified_lines.append(line.rstrip())
            i += 1
            continue
        
        # Process line if we're in a statblock (inside STATBLOCK tag and in statblock content)
        if in_statblock_tag and in_statblock:
            
            # Check if this is Skills: or Feats: with value on next line
            # Only process if we're between Abilities and Environment
            stripped = line.strip()
            if seen_abilities and (stripped == 'Skills:' or stripped == 'Feats:'):
                # Check if next line exists and is indented (contains the value)
                if i + 1 < len(lines):
                    next_line = lines[i + 1]
                    # If next line is indented (starts with whitespace) and not a label, merge it
                    if next_line and (next_line.startswith(' ') or next_line.startswith('\t')):
                        next_stripped = next_line.strip()
                        # Don't merge if next line is a statblock label
                        is_next_line_label = False
                        for label in STATBLOCK_LABELS_ORDERED:
                            if next_stripped.startswith(label + ':'):
                                is_next_line_label = True
                                break
                        
                        if not is_next_line_label:
                            # Merge: Skills: or Feats: with the next line's content
                            merged_line = stripped + ' ' + next_stripped
                            if dry_run:
                                print(f"\n{file_path.name}:{line_number}-{line_number + 1}")
                                print(f"  Original line {line_number}: {original_line.rstrip()}")
                                print(f"  Original line {line_number + 1}: {next_line.rstrip()}")
                                print(f"  Fixed: {merged_line}")
                            modified_lines.append(merged_line)
                            file_modified = True
                            i += 2  # Skip both lines
                            continue
            
            # Track when we see Abilities (Skills/Feats come after)
            if line.strip().startswith('Abilities:'):
                seen_abilities = True
            elif line.strip().startswith('Environment:'):
                seen_abilities = False  # Reset after Environment
            
            # Check if this line contains multiple statblock labels and split if needed
            # split_concatenated_labels will return the original line if no splitting is needed
            split_lines = split_concatenated_labels(line)
            
            # Check if the line was actually modified
            if len(split_lines) > 1 or (len(split_lines) == 1 and split_lines[0] != line.rstrip()):
                # Line was modified - show changes in dry-run mode
                if dry_run:
                    print(f"\n{file_path.name}:{line_number}")
                    print(f"  Original: {original_line.rstrip()}")
                    print(f"  Fixed:")
                    for fixed_line in split_lines:
                        print(f"    {fixed_line}")
                
                modified_lines.extend(split_lines)
                file_modified = True
            else:
                # No change needed
                modified_lines.append(line.rstrip())
        elif in_statblock_tag:
            # Inside STATBLOCK tag but not in statblock content
            # Check if we hit COMBAT header (ends paragraph section)
            if line.strip() == 'COMBAT':
                in_paragraph_section = False
                paragraph_started = False
                first_paragraph_blank_kept = False
                modified_lines.append(line.rstrip())
                i += 1
                continue
            
            # Handle paragraph section: remove blank lines between paragraph lines
            # but keep blank line before first paragraph, after first paragraph, and before COMBAT
            if in_paragraph_section:
                stripped = line.strip()
                is_blank = not stripped
                
                # If this is a blank line
                if is_blank:
                    # Check if next line is COMBAT - keep the blank line
                    if i + 1 < len(lines) and lines[i + 1].strip() == 'COMBAT':
                        # This is expected - blank line before COMBAT should be kept
                        # Only mark as modified if we're actually changing something
                        # (in this case, we're just keeping it, so no change needed)
                        modified_lines.append(line.rstrip())
                        i += 1
                        continue
                    # Check if next line is a paragraph line (not blank, not COMBAT, not a header ending with :)
                    elif i + 1 < len(lines):
                        next_stripped = lines[i + 1].strip()
                        # If next line is a paragraph line
                        if next_stripped and next_stripped != 'COMBAT' and not next_stripped.endswith(':'):
                            if not paragraph_started:
                                # This is the blank line before first paragraph - keep it
                                modified_lines.append(line.rstrip())
                                i += 1
                                continue
                            else:
                                # Check if this is the blank line after the first paragraph
                                if not first_paragraph_blank_kept:
                                    # Check if previous line was the first paragraph
                                    if modified_lines and modified_lines[-1].strip() and not modified_lines[-1].strip().endswith(':'):
                                        # This is the blank line after the first paragraph - keep it
                                        first_paragraph_blank_kept = True
                                        modified_lines.append(line.rstrip())
                                        i += 1
                                        continue
                                
                                # This is a blank line before 2nd+ paragraph - remove it
                                if dry_run:
                                    # Show context: previous line, blank line being removed, next line
                                    prev_line = modified_lines[-1] if modified_lines else ""
                                    next_line_preview = next_stripped[:80] + "..." if len(next_stripped) > 80 else next_stripped
                                    print(f"\n{file_path.name}:{line_number}")
                                    if prev_line.strip():
                                        print(f"  Previous line: {prev_line[:80]}{'...' if len(prev_line) > 80 else ''}")
                                    print(f"  Original line {line_number}: (blank line)")
                                    print(f"  Next line: {next_line_preview}")
                                    print(f"  Fixed: (blank line removed - paragraphs joined)")
                                file_modified = True
                                i += 1
                                continue
                    # Fall through - blank line that doesn't match above conditions, keep it
                    modified_lines.append(line.rstrip())
                    i += 1
                    continue
                elif stripped and not stripped.endswith(':'):
                    # This is a paragraph line
                    if not paragraph_started:
                        paragraph_started = True
                    modified_lines.append(line.rstrip())
                    i += 1
                    continue
                # Fall through for other lines (headers, etc.) - keep as-is
                modified_lines.append(line.rstrip())
                i += 1
                continue
            
            # Not in paragraph section, keep line as-is
            modified_lines.append(line.rstrip())
            i += 1
            continue
        
        # Check if we're leaving a statblock (via Advancement)
        # Only check this inside STATBLOCK tag
        if in_statblock_tag and in_statblock and is_statblock_end(line):
            in_statblock = False
            seen_abilities = False
            # After statblock ends, we enter paragraph section
            in_paragraph_section = True
            paragraph_started = False
            first_paragraph_blank_kept = False
        
        i += 1
    
    # Write back if modified
    if file_modified and not dry_run:
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                for line in modified_lines:
                    f.write(line + '\n')
            logger.info(f"Fixed {file_path.name}")
            return True
        except Exception as e:
            logger.error(f"Error writing {file_path}: {e}")
            return False
    elif file_modified:
        logger.info(f"[DRY RUN] Would fix {file_path.name}")
        return True
    
    return False


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description='Fix concatenated statblock labels in monster text files'
    )
    parser.add_argument(
        '--input-dir',
        type=str,
        default='output/monsters/tagged',
        help='Directory containing .txt files to process (default: output/monsters/tagged)'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Show what would be changed without modifying files'
    )
    
    args = parser.parse_args()
    
    # Resolve input directory relative to script location
    script_dir = Path(__file__).parent
    input_dir = script_dir / args.input_dir
    
    if not input_dir.exists():
        logger.error(f"Input directory does not exist: {input_dir}")
        sys.exit(1)
    
    # Find all .txt files
    txt_files = sorted(input_dir.glob('*.txt'))
    
    if not txt_files:
        logger.warning(f"No .txt files found in {input_dir}")
        return
    
    logger.info(f"Processing {len(txt_files)} files in {input_dir}")
    if args.dry_run:
        logger.info("DRY RUN mode - no files will be modified")
    
    modified_count = 0
    for txt_file in txt_files:
        if process_file(txt_file, dry_run=args.dry_run):
            modified_count += 1
    
    logger.info(f"Processing complete. {modified_count} file(s) {'would be ' if args.dry_run else ''}modified.")


if __name__ == '__main__':
    main()

