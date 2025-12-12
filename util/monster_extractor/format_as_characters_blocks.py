#!/usr/bin/env python3
"""
Script to find and reformat "as characters" blocks in monster text files.

This script processes all .txt files in the text_clean directory and reformats
"as characters" blocks to match the proper format:
- Title in all uppercase: "[RACE] AS CHARACTERS"
- Optional descriptive text (0-2 lines, 4-space indent)
- Trait header: "    [Race] characters possess the following racial traits."
- Trait items: Each on its own line, starting with "    - " (4 spaces, dash, space)
- No blank lines between traits
- Consistent 4-space indentation
"""

import re
import os
import argparse
from pathlib import Path


def find_block_boundaries(lines, start_idx):
    """
    Find the end of an "as characters" block.
    
    The block ends when we encounter:
    - "Favored Class" (case-insensitive) - block ends after this line
    - "Level adjustment" or "Level Adjustment" (case-insensitive) - block ends after this
    - An empty line followed by a non-indented line that looks like a new monster entry
    - A line that looks like a new monster entry (all caps monster name)
    - End of file
    
    Note: Lines starting with '--' are still part of the block (malformed bullets).
    Lines starting with "Hit Dice:", "Skills:", "Feats:" etc. that follow trait patterns
    are also part of the block (continuations of split traits).
    
    Returns the index of the last line of the block (inclusive).
    """
    i = start_idx + 1
    while i < len(lines):
        line = lines[i].strip()
        raw_line = lines[i]
        line_lower = line.lower()
        
        # Check if this line contains "Favored Class" or "Level adjustment"
        # These mark the end of the block
        has_favored_class = 'favored class' in line_lower
        has_level_adjustment = 'level adjustment' in line_lower or 'level adjustment:' in line_lower
        
        # If we find "Level adjustment", the block ends here
        if has_level_adjustment:
            return i
        
        # If we find "Favored Class" (and haven't found "Level adjustment" yet)
        if has_favored_class:
            # Check if "Level adjustment" is on the same line
            if has_level_adjustment:
                return i
            # Check if "Level adjustment" is on the next line
            elif i + 1 < len(lines):
                next_line = lines[i + 1].strip()
                next_line_lower = next_line.lower()
                if 'level adjustment' in next_line_lower:
                    # Include the next line in the block
                    return i + 1
            # "Favored Class" without "Level adjustment" - block ends after this line
            return i
        
        # Skip empty lines and lines that are clearly part of the block
        if line == '' or line.startswith(' ') or line.startswith('\t') or line.startswith('--'):
            i += 1
            continue
        
        # Check if this line is a continuation of a trait (like "Hit Dice:" after "--Racial")
        # These patterns indicate trait continuations, not new sections
        trait_continuation_patterns = [
            'Hit Dice:', 'Skills:', 'Feats:', 'Weapon Proficiency:', 
            'Automatic Languages:', 'Bonus Languages:', 'Special Attacks', 'Special Qualities'
        ]
        
        is_trait_continuation = any(line.startswith(pattern) for pattern in trait_continuation_patterns)
        
        # If it looks like a trait continuation, check the context
        if is_trait_continuation:
            # Check previous lines to see if this is part of the trait block
            # Look back a few lines for patterns like "--Racial", indented lines, or other trait markers
            is_part_of_block = False
            for j in range(max(start_idx, i - 5), i):
                prev_line = lines[j].strip()
                if (prev_line.startswith('--') or 
                    prev_line.startswith('-') or
                    lines[j].startswith(' ') or
                    lines[j].startswith('\t') or
                    'trait' in prev_line.lower() or
                    'possess' in prev_line.lower()):
                    is_part_of_block = True
                    break
            
            if is_part_of_block:
                i += 1
                continue
        
        # Check if we've hit a new section (empty line + non-indented text that's a new monster)
        if i > 0:
            prev_line = lines[i - 1].strip()
            if prev_line == '' and line != '':
                # Check if this line is not indented (new section)
                if not raw_line.startswith(' ') and not raw_line.startswith('\t'):
                    # This might be the end, but check if it's actually a new monster entry
                    # New monster entries are typically all caps with multiple words
                    if (line.isupper() and len(line.split()) >= 2 and len(line) > 5):
                        # Make sure it's not a trait keyword
                        trait_keywords = ['CHARACTERS', 'TRAITS', 'LANGUAGES', 'CLASS', 'ADJUSTMENT', 
                                        'HIT DICE', 'SKILLS', 'FEATS', 'PROFICIENCY']
                        if not any(keyword in line for keyword in trait_keywords):
                            return i - 2  # Block ends before the empty line (i-1) and the new section (i)
        
        # Check if current line looks like a new monster entry (all caps, multiple words)
        if line and not raw_line.startswith(' ') and not raw_line.startswith('\t') and not line.startswith('--'):
            # New monster entries are typically all caps with multiple words
            if line.isupper() and len(line.split()) >= 2 and len(line) > 5 and i > start_idx + 5:
                # Make sure it's not a trait keyword
                trait_keywords = ['CHARACTERS', 'TRAITS', 'LANGUAGES', 'CLASS', 'ADJUSTMENT']
                if not any(keyword in line for keyword in trait_keywords):
                    return i - 1
        
        i += 1
    
    # Reached end of file
    return len(lines) - 1


def normalize_title(line):
    """Convert title to uppercase format: '[RACE] AS CHARACTERS'"""
    # Find the "as characters" part (case-insensitive)
    match = re.search(r'(.+?)\s+as\s+characters', line, re.IGNORECASE)
    if match:
        race_part = match.group(1).strip().upper()
        return f"{race_part} AS CHARACTERS"
    return line.upper().strip()


def split_concatenated_items(text, depth=0):
    """
    Split text that has items concatenated with '--' or ' - ' separator.
    Also handles cases where items start with '--' or '- --'.
    Handles specific patterns like '--Racial', '--Skills', '--Feats' as separators.
    
    Args:
        text: Text to split
        depth: Recursion depth to prevent infinite loops
    """
    # Prevent infinite recursion
    if depth > 10:
        return [text] if text.strip() else []
    
    items = []
    
    # First, handle specific trait separators: --Racial, --Skills, --Feats
    # These should split items even if they're part of a word boundary
    # When we see --Racial, the next item should start with "Racial"
    if '--Racial' in text:
        # Split on all occurrences of --Racial
        # Use a more careful split that preserves context
        parts = re.split(r'\s+--Racial\s+', text)
        if len(parts) == 1:
            # Try without requiring spaces
            parts = text.split('--Racial')
        
        # Process each part
        for j, part in enumerate(parts):
            part = part.strip()
            if not part:
                # Empty part after --Racial means next item should start with "Racial"
                # This will be handled when we process the next non-empty part
                continue
            # Remove leading '--' or '- --' if present
            part = re.sub(r'^-\s*--\s*', '', part)
            part = re.sub(r'^--\s*', '', part)
            # Remove trailing '--' if present (but keep --Racial if it's a separator)
            part = re.sub(r'--\s*$', '', part)
            if part:
                # If this is not the first part and it doesn't already start with "Racial",
                # add "Racial" prefix (for items like "Skills:", "Feats:", etc.)
                if j > 0 and not part.startswith('Racial '):
                    # Check if it starts with a trait keyword that should have "Racial" prefix
                    trait_keywords = ['Hit Dice', 'Skills', 'Feats']
                    if any(part.startswith(kw) for kw in trait_keywords):
                        part = f"Racial {part}"
                
                # Check if this part still contains --Racial (needs further splitting)
                if '--Racial' in part:
                    # Recursively split
                    sub_items = split_concatenated_items(part, depth + 1)
                    items.extend(sub_items)
                # Check if it contains other separators
                elif ' --' in part or '. - ' in part or re.search(r'\s+-\s+(?=[A-Z])', part):
                    sub_items = split_concatenated_items(part, depth + 1)
                    items.extend(sub_items)
                else:
                    items.append(part)
        # If we split on --Racial, return early (don't process further with generic logic)
        if len(parts) > 1:
            return items
    
    # Handle --Skills and --Feats similarly
    if '--Skills' in text:
        parts = text.split('--Skills')
        for j, part in enumerate(parts):
            part = part.strip()
            if not part:
                continue
            part = re.sub(r'^-\s*--\s*', '', part)
            part = re.sub(r'^--\s*', '', part)
            part = re.sub(r'--\s*$', '', part)
            if part:
                if j > 0 and not part.startswith('Skills '):
                    if part.startswith('Feats'):
                        part = f"Racial {part}"
                items.append(part)
        if len(parts) > 1:
            return items
    
    if '--Feats' in text:
        parts = text.split('--Feats')
        for j, part in enumerate(parts):
            part = part.strip()
            if not part:
                continue
            part = re.sub(r'^-\s*--\s*', '', part)
            part = re.sub(r'^--\s*', '', part)
            part = re.sub(r'--\s*$', '', part)
            if part:
                items.append(part)
        if len(parts) > 1:
            return items
    
    # If no trait separators, split on generic ' --' pattern (space before double dash)
    # This handles cases like "item1 -- item2"
    parts = re.split(r'\s+--\s*', text)
    
    # If we got multiple parts from '--', process them
    if len(parts) > 1:
        for part in parts:
            part = part.strip()
            if not part:
                continue
            # Remove leading '--' or '- --' if present
            part = re.sub(r'^-\s*--\s*', '', part)
            part = re.sub(r'^--\s*', '', part)
            # Remove trailing '--' if present
            part = re.sub(r'--\s*$', '', part)
            if part:
                items.append(part)
        return items
    
    # If no '--' found, try splitting on '. - ' pattern (period, space, dash, space)
    # This handles cases like "item1. - item2" where items are concatenated
    parts = re.split(r'\.\s+-\s+', text)
    
    if len(parts) > 1:
        for i, part in enumerate(parts):
            part = part.strip()
            if not part:
                continue
            # Add period back to all but the last part (if it doesn't already have one)
            if i < len(parts) - 1 and not part.endswith('.'):
                part = part + '.'
            items.append(part)
        return items
    
    # Also try splitting on ' - ' followed by capital letter (for items without periods)
    # This handles cases like "item1 - Item2" where items are concatenated
    parts = re.split(r'\s+-\s+(?=[A-Z])', text)
    
    if len(parts) > 1:
        for part in parts:
            part = part.strip()
            if part:
                items.append(part)
        return items
    
    # If still one part, return it as single item
    text = text.strip()
    # Remove leading '--' or '- --' if present
    text = re.sub(r'^-\s*--\s*', '', text)
    text = re.sub(r'^--\s*', '', text)
    # Remove trailing '--' if present
    text = re.sub(r'--\s*$', '', text)
    
    if text:
        items.append(text)
    
    return items


def join_split_lines(lines):
    """
    Join lines that were incorrectly split.
    For example: "Racial\nHit Dice:" should become "Racial Hit Dice:"
    
    Looks for patterns where a line ends without punctuation and the next line
    starts with a capital letter (likely a continuation).
    """
    if not lines:
        return []
    
    joined = []
    i = 0
    
    while i < len(lines):
        current = lines[i].strip()
        
        # If this line doesn't end with punctuation and next line starts with capital
        # and is not a bullet point, it might be a continuation
        if i + 1 < len(lines):
            next_line = lines[i + 1].strip()
            
            # Check if current line ends without punctuation (except colon, period, comma)
            # and next line starts with capital letter (not a bullet)
            if (current and 
                not current.endswith(('.', ':', ',', ';', '!', '?')) and
                next_line and
                next_line[0].isupper() and
                not next_line.startswith('-') and
                not next_line.startswith('--')):
                # Join them
                current = f"{current} {next_line}"
                i += 1  # Skip the next line since we joined it
        
        if current:
            joined.append(current)
        i += 1
    
    return joined


def parse_trait_block(lines):
    """
    Parse the trait block content and extract individual traits.
    
    Returns a list of trait strings (without the bullet prefix).
    """
    # Filter out empty lines
    non_empty_lines = [line for line in lines if line.strip()]
    
    if not non_empty_lines:
        return []
    
    # Check if most lines are already on separate lines (even if malformed)
    # Count lines that start with some form of bullet or are indented
    lines_on_separate_lines = sum(
        1 for line in non_empty_lines
        if line.strip().startswith(('-', '--')) or line.startswith('    ')
    )
    
    # If most items are on separate lines, process line by line
    # BUT: First collect and join lines that should be together, preserving '--' separators
    if lines_on_separate_lines >= len(non_empty_lines) * 0.5:
        # First pass: join lines that should be together (like "Racial" + "Hit Dice:")
        # while preserving '--' separators, but keep items that start with '--' separate
        joined_lines = []
        i = 0
        while i < len(lines):
            line_stripped = lines[i].strip()
            if not line_stripped:
                # Empty line - add a marker to indicate item boundary
                joined_lines.append('|||ITEM_BOUNDARY|||')
                i += 1
                continue
            
            # Check if this line starts with '-' or '--' (new item)
            if line_stripped.startswith(('-', '--')):
                # Remove leading dashes but keep content
                line_clean = re.sub(r'^[-–—]+\s*', '', line_stripped)
                
                # Check if next line should be joined (like "Racial" + "Hit Dice:")
                if i + 1 < len(lines):
                    next_line = lines[i + 1].strip()
                    # If next line is a continuation (starts with capital, not a bullet)
                    if (next_line and 
                        next_line[0].isupper() and
                        not next_line.startswith('--') and
                        not next_line.startswith('-') and
                        any(next_line.startswith(prefix) for prefix in ['Hit Dice', 'Skills', 'Feats', 'Weapon', 'Automatic', 'Bonus', 'Favored', 'Level', 'Special'])):
                        # Join them - PRESERVE any '--' separators in the next line
                        line_clean = f"{line_clean} {next_line}"
                        i += 1  # Skip next line
                
                # Add item boundary before this item (except for the first one)
                if joined_lines:
                    joined_lines.append('|||ITEM_BOUNDARY|||')
                joined_lines.append(line_clean)
            else:
                # Line doesn't start with bullet, might be continuation
                # Check if it's indented (continuation of previous line)
                is_indented = lines[i].startswith(' ') or lines[i].startswith('\t')
                
                # Only join if:
                # 1. Previous line ended without punctuation (likely continuation)
                # 2. OR this line is indented (definitely a continuation)
                # 3. OR this line starts with a trait keyword that should be joined
                prev_line_ends_properly = (joined_lines and 
                                          joined_lines[-1] != '|||ITEM_BOUNDARY|||' and
                                          not joined_lines[-1].endswith(('.', ':', ',', ';', '!', '?')))
                
                trait_keywords = ['Hit Dice', 'Skills', 'Feats', 'Weapon', 'Automatic', 'Bonus', 'Favored', 'Level', 'Special']
                is_trait_keyword = any(line_stripped.startswith(kw) for kw in trait_keywords)
                
                if (prev_line_ends_properly or is_indented or is_trait_keyword) and joined_lines and joined_lines[-1] != '|||ITEM_BOUNDARY|||':
                    # Join with previous
                    joined_lines[-1] = f"{joined_lines[-1]} {line_stripped}"
                else:
                    # New item (add boundary if not first)
                    if joined_lines:
                        joined_lines.append('|||ITEM_BOUNDARY|||')
                    joined_lines.append(line_stripped)
            i += 1
        
        # Now join lines, using item boundaries to separate items
        # Items separated by boundaries should be split separately
        full_text = ' '.join(joined_lines)
        
        # Split on item boundaries first, then on '--' separators within each item
        if '|||ITEM_BOUNDARY|||' in full_text:
            item_groups = full_text.split('|||ITEM_BOUNDARY|||')
            items = []
            for group in item_groups:
                group = group.strip()
                if group:
                    # Split this group on '--' separators
                    group_items = split_concatenated_items(group)
                    items.extend(group_items)
        else:
            # No boundaries, split on all separators
            items = split_concatenated_items(full_text)
        
        return items
    
    # Old line-by-line processing (fallback - shouldn't be reached often)
    items = []
    current_item = []
    
    for i, line in enumerate(lines):
        line_stripped = line.strip()
        if not line_stripped:
            # Empty line - if we have current_item, finalize it
            if current_item:
                item_text = ' '.join(current_item).strip()
                # Remove bullet markers
                item_text = re.sub(r'^[-–—]\s*', '', item_text)
                # Remove trailing dashes
                item_text = re.sub(r'\s*[-–—]\s*$', '', item_text)
                if item_text:
                    items.append(item_text)
                current_item = []
            continue
            
            # Check if this line starts a new item (starts with bullet marker or '--')
            if line_stripped.startswith(('-', '--')):
                # Finalize previous item if any
                if current_item:
                    item_text = ' '.join(current_item).strip()
                    item_text = re.sub(r'^[-–—]\s*', '', item_text)
                    item_text = re.sub(r'\s*[-–—]\s*$', '', item_text)
                    if item_text:
                        items.append(item_text)
                    current_item = []
                
                # Start new item
                line_clean = re.sub(r'^[-–—]+\s*', '', line_stripped)  # Remove one or more dashes
                
                # Check if next line should be joined (preserving '--' separators)
                if i + 1 < len(lines):
                    next_line = lines[i + 1].strip()
                    # If next line is a continuation (starts with capital, not a bullet)
                    if (next_line and 
                        next_line[0].isupper() and
                        not next_line.startswith('--') and
                        not next_line.startswith('-') and
                        not line_clean.endswith(('.', ':', ',', ';', '!', '?'))):
                        # Join them - PRESERVE any '--' separators
                        line_clean = f"{line_clean} {next_line}"
                        i += 1  # Skip next line
                
                # NOW check if the line (possibly joined) contains multiple items
                if ' --' in line_clean or line_clean.startswith('--') or '. - ' in line_clean or re.search(r'\s+-\s+(?=[A-Z])', line_clean):
                    # Split on '--' or '. - ' or ' - '
                    parts = split_concatenated_items(line_clean)
                    items.extend(parts)
                else:
                    current_item.append(line_clean)
            else:
                # Line doesn't start with bullet - could be continuation or new item
                # Check if it starts with '--' (malformed bullet on separate line)
                if line_stripped.startswith('--'):
                    # Finalize previous item if any
                    if current_item:
                        item_text = ' '.join(current_item).strip()
                        item_text = re.sub(r'^[-–—]\s*', '', item_text)
                        item_text = re.sub(r'\s*[-–—]\s*$', '', item_text)
                        if item_text:
                            items.append(item_text)
                        current_item = []
                    
                    # Process this line as new item starting with '--'
                    line_clean = re.sub(r'^[-–—]+\s*', '', line_stripped)
                    
                    # Check if next line should be joined (like "Racial" followed by "Hit Dice:")
                    # IMPORTANT: Preserve '--' separators when joining so we can split later
                    if i + 1 < len(lines):
                        next_line_raw = lines[i + 1]
                        next_line = next_line_raw.strip()
                        
                        # If next line starts with capital and looks like a continuation
                        if (next_line and 
                            next_line[0].isupper() and
                            not next_line.startswith('--') and
                            not next_line.startswith('-') and
                            any(next_line.startswith(prefix) for prefix in ['Hit Dice', 'Skills', 'Feats', 'Weapon', 'Automatic', 'Bonus', 'Favored', 'Level', 'Special'])):
                            # Join them - PRESERVE any '--' separators in the next line
                            line_clean = f"{line_clean} {next_line}"
                            i += 1  # Skip next line
                    
                    # NOW check if the joined line contains separators that need splitting
                    # This must happen AFTER joining, not before
                    if ' --' in line_clean or '. - ' in line_clean or re.search(r'\s+-\s+(?=[A-Z])', line_clean):
                        # Split on separators - this will handle '--Racial', '--Skills', etc.
                        parts = split_concatenated_items(line_clean)
                        items.extend(parts)
                    else:
                        current_item.append(line_clean)
                # Continuation of current item or incorrectly split line
                elif current_item and i > 0:
                    prev_line = lines[i-1].strip()
                    prev_clean = re.sub(r'^[-–—]\s*', '', prev_line)
                    if (prev_clean and 
                        not prev_clean.endswith(('.', ':', ',', ';', '!', '?')) and
                        line_stripped and
                        line_stripped[0].isupper() and
                        not line_stripped.startswith('--')):
                        # Join with previous
                        current_item.append(line_stripped)
                    else:
                        # Might be a new item without bullet marker, or continuation
                        # If it starts with capital and previous ended properly, it's continuation
                        if current_item:
                            current_item.append(line_stripped)
                        else:
                            # New item without bullet
                            current_item.append(line_stripped)
                else:
                    current_item.append(line_stripped)
        
        # Finalize last item
        if current_item:
            item_text = ' '.join(current_item).strip()
            item_text = re.sub(r'^[-–—]\s*', '', item_text)
            item_text = re.sub(r'\s*[-–—]\s*$', '', item_text)
            if item_text:
                items.append(item_text)
        
        # Clean up items
        processed_items = []
        for item in items:
            item = item.strip()
            # Remove any remaining '--' patterns
            item = re.sub(r'\s*--\s*', ' ', item)
            # Remove double spaces
            item = re.sub(r'\s+', ' ', item)
            # Remove empty items
            if item and item != '-':
                processed_items.append(item)
        
        return processed_items
    
    # Block is mostly concatenated - treat as single text and split
    # Join all lines into a single text block
    full_text = ' '.join(line.strip() for line in lines if line.strip())
    
    # Remove leading bullet marker if present (we'll add it back per item)
    full_text = re.sub(r'^[-–—]\s*', '', full_text)
    
    # Split on '--' or '. - ' separators to get individual items
    items = split_concatenated_items(full_text)
    
    # Further process items
    processed_items = []
    for item in items:
        # Clean up the item
        item = item.strip()
        
        # Remove any remaining '--' patterns
        item = re.sub(r'\s*--\s*', ' ', item)
        
        # Remove double spaces
        item = re.sub(r'\s+', ' ', item)
        
        if item and item != '-':
            processed_items.append(item)
    
    return processed_items


def format_block(title, descriptive_lines, trait_header, traits):
    """
    Format the complete block with proper indentation and structure.
    """
    lines = []
    
    # Title (no indentation)
    lines.append(title)
    
    # Optional descriptive text (4-space indent, max 2 lines)
    for desc_line in descriptive_lines[:2]:
        if desc_line.strip():
            # Ensure 4-space indent
            indent = '    ' if not desc_line.startswith(' ') else desc_line[:4] if len(desc_line) >= 4 and desc_line.startswith(' ') else '    '
            content = desc_line.strip()
            lines.append(f"{indent}{content}")
    
    # Trait header (4-space indent)
    if trait_header.strip():
        lines.append(f"    {trait_header.strip()}")
    
    # Traits (each on its own line with "    - " prefix)
    for trait in traits:
        if trait.strip():
            # Ensure it starts with proper bullet format
            trait_clean = trait.strip()
            # Remove any existing bullet markers
            trait_clean = re.sub(r'^[-–—]\s*', '', trait_clean)
            lines.append(f"    - {trait_clean}")
    
    return lines


def process_file(file_path, dry_run=False):
    """
    Process a single file to find and reformat "as characters" blocks.
    
    Args:
        file_path: Path to the file to process
        dry_run: If True, don't write changes to file, just return if changes would be made
    
    Returns:
        If dry_run: tuple of (bool modified, list of (before, after) block pairs)
        Otherwise: bool indicating if changes were made
    """
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Find all "as characters" blocks
    block_starts = []
    for i, line in enumerate(lines):
        if re.search(r'as\s+characters', line, re.IGNORECASE):
            block_starts.append(i)
    
    if not block_starts:
        return (False, []) if dry_run else False
    
    # Process blocks from end to start to preserve indices
    modified = False
    new_lines = lines.copy()
    changes = []  # Store before/after for dry-run
    
    for start_idx in reversed(block_starts):
        # Find block boundaries
        end_idx = find_block_boundaries(new_lines, start_idx)
        
        # Extract block content
        block_lines = [line.rstrip('\n\r') for line in new_lines[start_idx:end_idx + 1]]
        
        # Check if the last line contains "Level adjustment" with text after it
        # If so, split it so the block only includes up to "Level adjustment"
        line_was_split = False
        if block_lines:
            last_line = block_lines[-1]
            last_line_lower = last_line.lower()
            
            # Check if "Level adjustment" is in the last line
            if 'level adjustment' in last_line_lower:
                # Find the position of "Level adjustment" (case-insensitive)
                # Look for pattern like "Level adjustment +5." or "Level adjustment: +5"
                match = re.search(r'[Ll]evel\s+[Aa]djustment[:\s]*[+-]?\d+\.?', last_line)
                if match:
                    end_pos = match.end()
                    # Check if there's more text after "Level adjustment +X."
                    remaining_text = last_line[end_pos:].strip()
                    if remaining_text:
                        # Split the line - keep only up to "Level adjustment +X."
                        block_lines[-1] = last_line[:end_pos].rstrip()
                        line_was_split = True
                        # Update the original line in new_lines to split off the remaining text
                        # Insert a new line after the block with the remaining text
                        new_lines[end_idx] = last_line[:end_pos].rstrip() + '\n'
                        if end_idx + 1 < len(new_lines):
                            # Insert remaining text as a new line
                            new_lines.insert(end_idx + 1, remaining_text + '\n')
                        else:
                            new_lines.append(remaining_text + '\n')
        
        # Store original block for comparison (use the potentially split version)
        # We need this for comparison in both dry-run and actual run modes
        original_block = '\n'.join(block_lines)
        
        # Parse the block
        title_line = block_lines[0]
        title = normalize_title(title_line)
        
        # Find the trait header line
        trait_header_idx = None
        for i, line in enumerate(block_lines):
            if 'possess the following racial traits' in line.lower():
                trait_header_idx = i
                break
        
        if trait_header_idx is None:
            # Skip if we can't find the trait header
            continue
        
        # Extract descriptive text (between title and trait header)
        descriptive_lines = []
        for i in range(1, trait_header_idx):
            line = block_lines[i].strip()
            if line:
                descriptive_lines.append(block_lines[i])  # Keep original formatting for now
        
        trait_header_line = block_lines[trait_header_idx]
        
        # Check if trait header line contains '--' (meaning first trait is on same line)
        trait_header_parts = trait_header_line.split(' --', 1)
        if len(trait_header_parts) == 2:
            # Trait header and first trait are on the same line
            trait_header = trait_header_parts[0].strip()
            first_trait = trait_header_parts[1].strip()
        else:
            trait_header = trait_header_line.strip()
            first_trait = None
        
        # Extract trait content (everything after trait header)
        trait_content_lines = []
        if first_trait:
            # Add the first trait that was on the same line as header
            trait_content_lines.append(first_trait)
        
        for i in range(trait_header_idx + 1, len(block_lines)):
            line = block_lines[i]
            if line.strip():  # Skip empty lines
                trait_content_lines.append(line)
        
        # Parse traits
        traits = parse_trait_block(trait_content_lines)
        
        # Format the new block (ensure trait_header is properly formatted)
        if not trait_header.endswith('.'):
            trait_header = trait_header.rstrip('.') + '.'
        
        formatted_block = format_block(title, descriptive_lines, trait_header, traits)
        
        # Store formatted block for comparison (needed for both dry-run and actual run)
        formatted_block_text = '\n'.join(formatted_block)
        
        # Replace the old block with the new one
        # Convert formatted_block to include newlines
        formatted_block_with_newlines = [line + '\n' for line in formatted_block]
        
        # Check if we need to make changes
        # Changes are needed if:
        # 1. The block content is different (formatting changes)
        # 2. OR a line was split (line_was_split is True)
        needs_change = (original_block != formatted_block_text) or line_was_split
        
        if needs_change:
            # Replace in new_lines
            new_lines[start_idx:end_idx + 1] = formatted_block_with_newlines
            
            # Store before/after for dry-run
            if dry_run:
                # Use the original block before splitting for comparison
                original_before_split = '\n'.join([line.rstrip('\n\r') for line in lines[start_idx:end_idx + 1]])
                changes.append((original_before_split, formatted_block_text))
            
            modified = True
    
    if modified:
        if not dry_run:
            # Write back to file
            with open(file_path, 'w', encoding='utf-8') as f:
                f.writelines(new_lines)
    
    if dry_run:
        return (modified, changes)
    return modified


def main():
    """Main function to process all files."""
    parser = argparse.ArgumentParser(
        description='Format "as characters" blocks in monster text files.'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Show what would be changed without actually modifying files'
    )
    args = parser.parse_args()
    
    script_dir = Path(__file__).parent
    text_clean_dir = script_dir / 'output' / 'monsters' / 'text_clean'
    
    if not text_clean_dir.exists():
        print(f"Error: Directory not found: {text_clean_dir}")
        return
    
    # Find all .txt files
    txt_files = list(text_clean_dir.glob('*.txt'))
    
    if not txt_files:
        print(f"No .txt files found in {text_clean_dir}")
        return
    
    mode_text = "DRY RUN - Would process" if args.dry_run else "Processing"
    print(f"{mode_text} {len(txt_files)} files...")
    if args.dry_run:
        print("(No files will be modified)\n")
    
    modified_count = 0
    skipped_count = 0
    for file_path in sorted(txt_files):
        try:
            if args.dry_run:
                modified, changes = process_file(file_path, dry_run=True)
                if modified and changes:
                    print(f"\n{'='*80}")
                    print(f"File: {file_path.name}")
                    print(f"{'='*80}")
                    for i, (before, after) in enumerate(changes, 1):
                        if len(changes) > 1:
                            print(f"\n--- Block {i} of {len(changes)} ---")
                        print("\nBEFORE:")
                        print("-" * 80)
                        print(before)
                        print("\nAFTER:")
                        print("-" * 80)
                        print(after)
                        print()
                    modified_count += 1
                elif not modified:
                    skipped_count += 1
            else:
                if process_file(file_path, dry_run=False):
                    print(f"  Modified: {file_path.name}")
                    modified_count += 1
                else:
                    skipped_count += 1
        except Exception as e:
            print(f"  Error processing {file_path.name}: {e}")
    
    if args.dry_run:
        print(f"\n{'='*80}")
        print(f"DRY RUN complete.")
        print(f"  Would modify: {modified_count} file(s)")
        if skipped_count > 0:
            print(f"  Already properly formatted: {skipped_count} file(s)")
        print("Run without --dry-run to apply changes.")
    else:
        print(f"\nDone. Modified {modified_count} file(s).")
        if skipped_count > 0:
            print(f"Skipped {skipped_count} file(s) that were already properly formatted.")


if __name__ == '__main__':
    main()

