#!/usr/bin/env python3
"""
Monster Manual HTML Extractor

Extracts individual monster entries and special chapters from the Monster Manual HTML file.
Cleans HTML by removing bookmarks and font classes while preserving tables, bold, and italic formatting.

Dependencies:
    beautifulsoup4 - Install with: pip install beautifulsoup4

Usage:
    python3 extract_monsters.py [--monster MONSTER_NAME]
    
    Options:
        --monster, -m    Extract only the specified monster (case-insensitive)
                        Example: python3 extract_monsters.py --monster aboleth

Output:
    - util/monster_extractor/output/monsters/*.html - Individual monster files
    - util/monster_extractor/output/improving_monsters.html
    - util/monster_extractor/output/making_monsters.html
    - util/monster_extractor/output/monster_skills_and_feats.html
    - util/monster_extractor/output/glossary.html
"""

import argparse
import logging
import os
import re
import sys
import copy
import unicodedata
from pathlib import Path
from typing import Dict, List, Optional, Tuple

# Global tracking for unhandled non-ASCII characters
# Maps (char, unicode_code) -> list of sample contexts where it appeared
_unhandled_non_ascii: Dict[Tuple[str, str], List[str]] = {}

try:
    from bs4 import BeautifulSoup, Tag, NavigableString
except ImportError:
    print("Error: beautifulsoup4 is required. Install it with: pip install beautifulsoup4")
    sys.exit(1)


def parse_html(file_path: str) -> BeautifulSoup:
    """Parse the HTML file using BeautifulSoup."""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    return BeautifulSoup(content, 'html.parser')


def identify_chapters(soup: BeautifulSoup) -> Dict[str, Optional[Tag]]:
    logger = logging.getLogger(__name__)
    """
    Find chapter boundaries and return positions.
    
    Returns a dict with chapter names as keys and their starting Tag elements as values.
    """
    chapters = {
        'introduction': None,
        'chapter1': None,
        'chapter2': None,
        'chapter3': None,
        'chapter4': None,
        'chapter5': None,
        'chapter6': None,
        'chapter7': None,
    }
    
    # Find all h1 tags
    h1_tags = soup.find_all('h1')
    
    for h1 in h1_tags:
        text = h1.get_text(strip=True).upper()
        
        if 'INTRODUCTION' in text:
            chapters['introduction'] = h1
        elif 'CHAPTER 1' in text or 'MONSTERS A TO Z' in text:
            chapters['chapter1'] = h1
        elif 'CHAPTER 2' in text and 'ANIMALS' in text:
            chapters['chapter2'] = h1
        elif 'CHAPTER 3' in text and 'VERMIN' in text:
            chapters['chapter3'] = h1
        elif 'CHAPTFR 4' in text or 'CHAPTER 4' in text or 'IMPROVING MONSTERS' in text:
            chapters['chapter4'] = h1
        elif 'CHAPTER 5' in text:
            chapters['chapter5'] = h1
        elif 'CHAPTER 6' in text and 'MONSTER SKILLS' in text:
            chapters['chapter6'] = h1
        elif 'CHAPTER 7' in text and 'GLOSSARY' in text:
            chapters['chapter7'] = h1

    return chapters


def is_monster_heading(tag: Tag) -> bool:
    """
    Check if a tag is a monster heading.
    
    Chapter 1: h3 with underline style, or p with span having both bold and underline
    Chapter 2: h3 with bold style
    Chapter 3: h2 with bold style
    Now also handles: h2/h3 with direct text (no spans)
    """
    # Check for h2 or h3 tags (standard monster headings)
    if tag.name in ['h2', 'h3']:
        # First check for spans with classes and styles (fast path)
        span = tag.find('span', class_=re.compile(r'font\d+'))
        if span and span.get('style'):
            style = span.get('style', '')
            # Check for underline (Chapter 1) or bold (Chapters 2 & 3)
            return 'text-decoration:underline' in style or 'font-weight:bold' in style
        
        # Check for any span (cache this to avoid multiple searches)
        any_span = tag.find('span')
        
        # Also check for plain span without class (some headings just have <h3><span>TEXT</span></h3>)
        if any_span and not any_span.get('class'):
            span_text = any_span.get_text(strip=True)
            # Check if it looks like a monster name (all caps, reasonable length)
            if span_text and span_text.isupper() and len(span_text.split()) <= 5:
                return True
        
        # Only check for direct text if there are NO spans at all (new format after HTML cleanup)
        if not any_span:
            # Get direct text content efficiently - just get text and strip
            direct_text = tag.get_text(strip=True)
            if direct_text:
                # Quick check: must be all caps and reasonable length
                if direct_text.isupper() and len(direct_text.split()) <= 5:
                    # Exclude known section headings that are not monsters (use set for O(1) lookup)
                    excluded_headings = {'STATISTICS BLOCK', 'DESCRIPTIVE TEXT', 'READING THE ENTRIES', 
                                       'MONSTERS A TO Z', 'INTRODUCTION'}
                    if direct_text not in excluded_headings:
                        return True
    
    # Check for p tags with span having both bold and underline (Chapter 1 variant)
    # This pattern appears for some monsters like ARROWHAWK
    if tag.name == 'p':
        span = tag.find('span', class_=re.compile(r'font\d+'))
        if span and span.get('style'):
            style = span.get('style', '')
            # Must have both bold and underline to be a monster heading
            if 'font-weight:bold' in style and 'text-decoration:underline' in style:
                # Also check that the span text looks like a monster name
                # (all caps, single word or short phrase)
                span_text = span.get_text(strip=True)
                if span_text and len(span_text.split()) <= 5:
                    # Check if it's mostly uppercase (monster names are typically all caps)
                    if span_text.isupper() or (len(span_text) > 0 and span_text[0].isupper()):
                        return True
    
    return False


def is_subsection_of_monster(heading_text: str, monster_name: str) -> bool:
    """
    Check if a heading is a subsection/variant of a monster rather than a separate monster.
    
    Examples:
    - "GIANTS' BAGS" is a subsection of "GIANT"
    - "GIANT SOCIETY" is a subsection of "GIANT"
    - "FIRE GIANT" is a variant of "GIANT"
    - "ABOLETH MAGE" is a variant of "ABOLETH"
    - "ANGEL, PLANETAR" is a variant of "ANGEL"
    - "CHROMATIC DRAGONS" is a subsection of "DRAGON, TRUE"
    - "METALLIC DRAGONS" is a subsection of "DRAGON, TRUE"
    """
    heading_upper = heading_text.upper().strip()
    monster_upper = monster_name.upper().strip()
    
    # Extract base word from monster name (handle "DRAGON, TRUE" -> "DRAGON")
    # Split by comma and take the first part
    monster_base = monster_upper.split(',')[0].strip()
    heading_base = heading_upper.split(',')[0].strip()
    
    # Check if heading contains the monster name
    if monster_upper in heading_upper:
        return True
    
    # Check if heading contains the base word from monster name
    # This handles "CHROMATIC DRAGONS" for "DRAGON, TRUE"
    if monster_base in heading_upper and len(monster_base) > 2:
        # Make sure it's not just a partial word match
        # Check if it's a whole word match
        if re.search(r'\b' + re.escape(monster_base) + r'\b', heading_upper):
            return True
    
    # Check for possessive forms (e.g., "GIANTS'" for "GIANT")
    # Remove common punctuation and check if the base word matches
    heading_base_clean = re.sub(r"[''""]", '', heading_upper)
    monster_base_clean = re.sub(r"[''""]", '', monster_upper)
    
    # Check if heading starts with monster name + possessive or plural
    if heading_base_clean.startswith(monster_base_clean + 'S') or heading_base_clean.startswith(monster_base_clean + "'"):
        return True
    
    # Check if it's a variant pattern like "X GIANT" where monster is "GIANT"
    # or "GIANT X" where heading is "GIANT X"
    if monster_base == 'GIANT':
        # Patterns like "FIRE GIANT", "HILL GIANT", "GIANT SOCIETY", "GIANTS' BAGS"
        if 'GIANT' in heading_upper:
            return True
    
    # Check for patterns like "MONSTER VARIANT" or "MONSTER, VARIANT"
    # Split by comma or space and check if first part matches monster name
    heading_parts = re.split(r'[,\s]+', heading_upper)
    if heading_parts and heading_parts[0] == monster_upper:
        return True
    
    # Check if heading starts with monster name followed by a space or comma
    if heading_upper.startswith(monster_upper + ' ') or heading_upper.startswith(monster_upper + ','):
        return True
    
    # Check if heading contains the base word + "S" (plural form)
    # This handles "CHROMATIC DRAGONS" for "DRAGON, TRUE"
    if heading_upper.endswith(monster_base + 'S') or monster_base + 'S' in heading_upper:
        # Make sure it's a whole word
        if re.search(r'\b' + re.escape(monster_base) + r'S\b', heading_upper):
            return True
    
    return False


def copy_element(element) -> Tag:
    """Create a deep copy of an element by converting to string and re-parsing."""
    if isinstance(element, NavigableString):
        return NavigableString(str(element))
    
    # Convert to string and re-parse to create a true copy
    # Use a temporary soup to parse the element
    temp_soup = BeautifulSoup(str(element), 'html.parser')
    # Get the first (and only) element
    if temp_soup.contents:
        return temp_soup.contents[0]
    return element


def extract_monster_entries(soup: BeautifulSoup, start_tag: Optional[Tag], end_tag: Optional[Tag], monster_filter: Optional[str] = None) -> List[Tuple[str, Tag]]:
    logger = logging.getLogger(__name__)
    """
    Extract all monster entries from a chapter section.
    
    Args:
        soup: BeautifulSoup instance
        start_tag: Starting tag for the chapter
        end_tag: Ending tag for the chapter
        monster_filter: Optional monster name to filter to (case-insensitive). If provided, only extracts that monster.
    
    Returns a list of tuples: (monster_name, content_element)
    """
    monsters = []
    
    if not start_tag:
        return monsters
    
    # Find all monster headings within the chapter boundaries
    monster_headings = []
    current = start_tag.find_next()
    
    if start_tag:
        start_text = start_tag.get_text(strip=True)[:50]
    else:
        start_text = 'None'
    if end_tag:
        end_text = end_tag.get_text(strip=True)[:50]
    else:
        end_text = 'None'
    logger.debug(f"extract_monster_entries: start_tag={start_tag.name if start_tag else 'None'} ('{start_text}'), end_tag={end_tag.name if end_tag else 'None'} ('{end_text}')")
    if start_tag == end_tag:
        logger.debug(f"extract_monster_entries: WARNING - start_tag and end_tag are the same tag!")
    
    if current:
        current_text = current.get_text(strip=True)[:50] if hasattr(current, 'get_text') else str(current)[:50]
        logger.debug(f"extract_monster_entries: First current element: {current.name if hasattr(current, 'name') else type(current).__name__} ('{current_text}')")
        if current == end_tag:
            logger.debug(f"extract_monster_entries: WARNING - find_next() returned end_tag immediately!")
    
    # Collect all monster headings first (only within chapter boundaries)
    # Use find_next() with a filter to efficiently find only monster headings
    # This is much more efficient than iterating through every element
    # An "iteration" with find_next() visits every single element (tags, text nodes, etc.)
    # By using find_next() with a filter, we skip directly to the next heading
    
    previous_monster_name = None
    heading_count = 0
    monster_filter_upper = monster_filter.upper() if monster_filter else None
    
    # Start from start_tag and use find_next() with a filter to find only monster headings
    current = start_tag
    while current:
        # Use find_next() with a filter function to find the next potential monster heading
        # Include h1 to detect chapter boundaries
        current = current.find_next(['h1', 'h2', 'h3', 'h4', 'p'])
        
        if not current:
            break
        
        # Stop if we've reached the end tag
        if current == end_tag:
            logger.debug(f"extract_monster_entries: Reached end_tag, stopping")
            break
        
        # Check for chapter boundaries (h1 tags)
        if isinstance(current, Tag) and current.name == 'h1' and current != start_tag:
            # Check if this h1 is a chapter heading (not just any h1)
            h1_text = current.get_text(strip=True).upper()
            # Check if it's a chapter heading (contains "CHAPTER" or known chapter keywords)
            if ('CHAPTER' in h1_text or 
                'IMPROVING MONSTERS' in h1_text or 
                'MAKING MONSTERS' in h1_text or
                'MONSTER SKILLS' in h1_text or
                'GLOSSARY' in h1_text):
                logger.debug(f"extract_monster_entries: Reached new h1 chapter '{h1_text[:50]}', stopping")
                break
            # If it's an h1 but not a recognized chapter, continue (might be a section heading)
            continue
        
        # Check if this is a monster heading
        if is_monster_heading(current):
            heading_text = current.get_text(strip=True)
            heading_count += 1
            logger.debug(f"extract_monster_entries: Found monster heading #{heading_count}: {heading_text[:50]}")
            
            # Only add if it's not a subsection of the previous monster
            if previous_monster_name and is_subsection_of_monster(heading_text, previous_monster_name):
                # Skip this heading - it will be included in the previous monster's content
                logger.debug(f"extract_monster_entries: Skipping subsection: {heading_text[:50]}")
                # But if this is the filtered monster and it's a subsection, we still want it
                if monster_filter_upper and heading_text.upper() == monster_filter_upper:
                    # This is the filtered monster, but it's a subsection - add it anyway
                    monster_headings.append(current)
                    logger.debug(f"extract_monster_entries: Found filtered monster '{heading_text}' as subsection, stopping search")
                    break
                pass
            else:
                monster_headings.append(current)
                previous_monster_name = heading_text
                
                # If we have a filter and found the matching monster, stop searching
                if monster_filter_upper and heading_text.upper() == monster_filter_upper:
                    logger.debug(f"extract_monster_entries: Found filtered monster '{heading_text}', stopping search")
                    break
    
    logger.debug(f"extract_monster_entries: Found {len(monster_headings)} monster headings")
    
    # If a filter is provided, find the matching heading
    filtered_headings = monster_headings
    if monster_filter:
        matching_heading = None
        for heading in monster_headings:
            heading_text = heading.get_text(strip=True)
            if heading_text.upper() == monster_filter_upper:
                matching_heading = heading
                break
        if not matching_heading:
            # Return empty list - monster not found
            return []
        # Only extract the matching monster
        filtered_headings = [matching_heading]
    
    # Extract content for each monster
    for i, heading in enumerate(filtered_headings):
        # Get monster name
        # For p tags with span, use just the span text (not the full paragraph)
        if heading.name == 'p':
            span = heading.find('span', class_=re.compile(r'font\d+'))
            if span and span.get('style'):
                style = span.get('style', '')
                if 'font-weight:bold' in style and 'text-decoration:underline' in style:
                    monster_name = span.get_text(strip=True)
                else:
                    monster_name = heading.get_text(strip=True)
            else:
                monster_name = heading.get_text(strip=True)
        else:
            monster_name = heading.get_text(strip=True)
        
        # Create container for this monster's content
        container = soup.new_tag('div')
        # Copy the heading
        copied_heading = copy_element(heading)
        if copied_heading:
            container.append(copied_heading)
        
        # Get all content until next monster or end tag
        # Use find_next() but skip elements that are descendants of the heading
        current = heading.find_next()
        # Find the next heading in the original list (not filtered list) to know where to stop
        heading_index_in_full_list = monster_headings.index(heading)
        next_heading = monster_headings[heading_index_in_full_list + 1] if heading_index_in_full_list + 1 < len(monster_headings) else end_tag
        
        # Skip elements that are descendants of the heading
        while current and current in heading.descendants:
            current = current.find_next()
        
        # Skip duplicate spans that may appear right after the heading or paragraphs
        # Check if current is a span with duplicate content
        if isinstance(current, Tag) and current.name == 'span':
            current_text = current.get_text(strip=True)
            # Skip if it's a duplicate of the monster name
            if current_text == monster_name:
                current = current.find_next()
                # Skip descendants again
                while current and current in heading.descendants:
                    current = current.find_next()
            # Also check if it's a duplicate of the previous element's content
            elif current.find_previous_sibling():
                prev = current.find_previous_sibling()
                if isinstance(prev, Tag):
                    prev_text = prev.get_text(strip=True)
                    if prev_text and current_text and current_text == prev_text:
                        # Duplicate content, skip it
                        current = current.find_next()
                        while current and current in heading.descendants:
                            current = current.find_next()
        
        # Track processed elements and their content to detect duplicates
        processed_elements = set()  # Track original elements we've processed
        added_text_contents = set()  # Track text content we've already added
        
        while current:
            # Stop if we hit the next monster heading or end tag
            if current == next_heading or current == end_tag:
                break
            
            # Stop if we hit another monster heading (check by content, not just reference)
            # This must be checked BEFORE processing the element
            # Check both the current element and its immediate children (in case heading is in a div)
            found_other_monster = False
            if isinstance(current, Tag):
                # Check if current element itself is a monster heading
                if is_monster_heading(current):
                    current_heading_text = current.get_text(strip=True)
                    if current_heading_text != monster_name:
                        # Check if this is a subsection/variant of the current monster
                        if not is_subsection_of_monster(current_heading_text, monster_name):
                            found_other_monster = True
                        # If it is a subsection, continue including it in this monster entry
                # Also check for h4 tags that might be variant headings (like "ABOLETH MAGE")
                elif current.name == 'h4':
                    current_heading_text = current.get_text(strip=True)
                    if current_heading_text != monster_name:
                        # Check if this is a subsection/variant of the current monster
                        if not is_subsection_of_monster(current_heading_text, monster_name):
                            # Not a variant, but also not a monster heading - continue including it
                            # (h4 tags are often variant headings or COMBAT sections)
                            pass
                        # If it is a subsection, continue including it in this monster entry
                # Also check if any direct child is a monster heading (common pattern: div > h3)
                elif current.name in ['div', 'p']:
                    for child in current.children:
                        if isinstance(child, Tag):
                            # Check if it's a monster heading or h4 variant
                            if is_monster_heading(child) or child.name == 'h4':
                                child_heading_text = child.get_text(strip=True)
                                if child_heading_text != monster_name:
                                    # Check if this is a subsection/variant of the current monster
                                    if not is_subsection_of_monster(child_heading_text, monster_name):
                                        # Only stop if it's a recognized monster heading, not just any h4
                                        if is_monster_heading(child):
                                            found_other_monster = True
                                            break
                                    # If it is a subsection, continue including it in this monster entry
                
                if found_other_monster:
                    # This is a different monster, stop extracting immediately
                    break
                
                # Stop if we hit a chapter boundary (h1)
                if current.name == 'h1':
                    break
            
            # Skip if this element is a descendant of an element we've already processed
            is_descendant_of_processed = False
            for processed_elem in processed_elements:
                if isinstance(current, Tag) and current in processed_elem.descendants:
                    is_descendant_of_processed = True
                    break
            
            if is_descendant_of_processed:
                current = current.find_next()
                while current and current in heading.descendants:
                    current = current.find_next()
                continue
            
            # Check for duplicate content
            if isinstance(current, Tag):
                current_text = current.get_text(strip=True)
                
                # For statblock labels like "Level Adjustment", allow duplicates across variants
                # (e.g., SOLAR and PLANETAR both have "Level Adjustment: --")
                is_statblock_label = False
                if current_text:
                    for label in STATBLOCK_LABELS:
                        if re.match(re.escape(label) + r':?\s*', current_text, re.IGNORECASE):
                            is_statblock_label = True
                            break
                
                # Skip if this element's text content is already in the container
                # (but allow tables and other structural elements)
                # BUT allow statblock labels to appear multiple times (for different variants)
                if current_text and current_text in added_text_contents and not is_statblock_label:
                    # For spans, paragraphs, and divs, skip if duplicate
                    if current.name in ['span', 'p']:
                        current = current.find_next()
                        while current and current in heading.descendants:
                            current = current.find_next()
                        continue
                    # For divs, only skip if they don't contain tables
                    # But don't skip empty divs or divs that are just structural (like statblock containers)
                    elif current.name == 'div':
                        # If div is empty or only contains formatting, skip it but continue extraction
                        if not current.find('table') and not current.get_text(strip=True):
                            # Empty div - skip it but continue
                            current = current.find_next()
                            while current and current in heading.descendants:
                                current = current.find_next()
                            continue
                        # If div contains content we've already seen, skip it
                        elif current_text and current_text in added_text_contents:
                            current = current.find_next()
                            while current and current in heading.descendants:
                                current = current.find_next()
                            continue
                
                # For spans, check if their content is within a parent we just processed
                if current.name == 'span' and current_text:
                    parent = current.parent
                    while parent and parent != container and parent != heading:
                        if parent in processed_elements:
                            # This span is inside a parent we already processed, skip it
                            current = current.find_next()
                            while current and current in heading.descendants:
                                current = current.find_next()
                            break
                        parent = parent.parent
                    else:
                        # Not inside a processed parent, continue to add
                        pass
                    if parent and parent in processed_elements:
                        continue
                
                # Copy the element
                next_elem = current.find_next()
                while next_elem and next_elem in heading.descendants:
                    next_elem = next_elem.find_next()
                
                copied = copy_element(current)
                if copied:
                    container.append(copied)
                    processed_elements.add(current)  # Track the original element
                    if current_text:
                        added_text_contents.add(current_text)
                
                current = next_elem
            elif isinstance(current, NavigableString):
                text = str(current).strip()
                if text and text not in added_text_contents:
                    container.append(NavigableString(text))
                    added_text_contents.add(text)
                
                current = current.find_next()
                while current and current in heading.descendants:
                    current = current.find_next()
            else:
                # Handle other element types (like br tags)
                # Skip br clear="all" tags but continue extraction
                if isinstance(current, Tag) and current.name == 'br':
                    current = current.find_next()
                    while current and current in heading.descendants:
                        current = current.find_next()
                else:
                    current = current.find_next()
                    while current and current in heading.descendants:
                        current = current.find_next()
        
        monsters.append((monster_name, container))
    
    return monsters


def normalize_whitespace(text: str) -> str:
    """
    Normalize whitespace characters, replacing non-breaking spaces and other
    Unicode whitespace with regular spaces.
    """
    if not text:
        return text
    
    # Replace non-breaking space (U+00A0) and other Unicode whitespace with regular space
    # Common Unicode whitespace characters:
    # U+00A0: Non-breaking space
    # U+2000-U+200A: Various spaces (en space, em space, thin space, etc.)
    # U+202F: Narrow no-break space
    # U+205F: Medium mathematical space
    # U+3000: Ideographic space
    text = text.replace('\u00A0', ' ')  # Non-breaking space
    text = text.replace('\u2000', ' ')  # En quad
    text = text.replace('\u2001', ' ')  # Em quad
    text = text.replace('\u2002', ' ')  # En space
    text = text.replace('\u2003', ' ')  # Em space
    text = text.replace('\u2004', ' ')  # Three-per-em space
    text = text.replace('\u2005', ' ')  # Four-per-em space
    text = text.replace('\u2006', ' ')  # Six-per-em space
    text = text.replace('\u2007', ' ')  # Figure space
    text = text.replace('\u2008', ' ')  # Punctuation space
    text = text.replace('\u2009', ' ')  # Thin space
    text = text.replace('\u200A', ' ')  # Hair space
    text = text.replace('\u202F', ' ')  # Narrow no-break space
    text = text.replace('\u205F', ' ')  # Medium mathematical space
    text = text.replace('\u3000', ' ')  # Ideographic space
    
    return text


def normalize_to_ascii(text: str) -> str:
    """
    Replace non-ASCII characters with their ASCII equivalents.
    
    Common replacements:
    - Curly quotes and apostrophes → straight quotes and apostrophes
    - Em/en dashes → hyphens
    - Ellipsis → three dots
    - Other typographic characters → ASCII equivalents
    
    Unhandled non-ASCII characters are tracked and reported at the end.
    """
    if not text:
        return text
    
    # Set of explicitly handled Unicode code points
    handled_codepoints = {
        0x2018, 0x2019, 0x201A, 0x201B,  # Single quotes
        0x201C, 0x201D, 0x201E, 0x201F,  # Double quotes
        0x2032, 0x2033,  # Primes
        0x2013, 0x2014, 0x2015,  # Dashes
        0x2026,  # Ellipsis
        0x00A9, 0x00AE, 0x2122,  # Copyright, registered, trademark
        0x00B0, 0x00B1, 0x00D7, 0x00F7,  # Math symbols
        0x00BC, 0x00BD, 0x00BE, 0x2153, 0x2154,  # Fractions
        0x2022, 0x2023, 0x2043,  # Bullets
    }
    
    # Curly quotes and apostrophes
    text = text.replace('\u2018', "'")  # Left single quotation mark
    text = text.replace('\u2019', "'")  # Right single quotation mark (common apostrophe)
    text = text.replace('\u201A', "'")  # Single low-9 quotation mark
    text = text.replace('\u201B', "'")  # Single high-reversed-9 quotation mark
    text = text.replace('\u201C', '"')  # Left double quotation mark
    text = text.replace('\u201D', '"')  # Right double quotation mark
    text = text.replace('\u201E', '"')  # Double low-9 quotation mark
    text = text.replace('\u201F', '"')  # Double high-reversed-9 quotation mark
    text = text.replace('\u2032', "'")  # Prime (minutes)
    text = text.replace('\u2033', '"')  # Double prime (seconds)
    
    # Dashes
    text = text.replace('\u2013', '-')  # En dash
    text = text.replace('\u2014', '--')  # Em dash
    text = text.replace('\u2015', '--')  # Horizontal bar
    
    # Ellipsis
    text = text.replace('\u2026', '...')  # Horizontal ellipsis
    
    # Other common typographic characters
    text = text.replace('\u00A9', '(c)')  # Copyright sign
    text = text.replace('\u00AE', '(R)')  # Registered sign
    text = text.replace('\u2122', '(TM)')  # Trade mark sign
    text = text.replace('\u00B0', ' degrees')  # Degree sign
    text = text.replace('\u00B1', '+/-')  # Plus-minus sign
    text = text.replace('\u00D7', 'x')  # Multiplication sign
    text = text.replace('\u00F7', '/')  # Division sign
    
    # Fractions (common ones)
    text = text.replace('\u00BC', '1/4')  # Vulgar fraction one quarter
    text = text.replace('\u00BD', '1/2')  # Vulgar fraction one half
    text = text.replace('\u00BE', '3/4')  # Vulgar fraction three quarters
    text = text.replace('\u2153', '1/3')  # Vulgar fraction one third
    text = text.replace('\u2154', '2/3')  # Vulgar fraction two thirds
    
    # Bullets and other symbols
    text = text.replace('\u2022', '*')  # Bullet
    text = text.replace('\u2023', '>')  # Triangular bullet
    text = text.replace('\u2043', '-')  # Hyphen bullet
    
    # Check for unhandled non-ASCII characters in the original text (before NFKD normalization)
    # This allows us to track characters that weren't explicitly handled
    original_text = text
    for i, char in enumerate(original_text):
        char_code = ord(char)
        if char_code >= 128 and char_code not in handled_codepoints:
            # Create a context sample (surrounding text, max 50 chars)
            context_start = max(0, i - 25)
            context_end = min(len(original_text), i + 25)
            context = original_text[context_start:context_end].replace('\n', ' ').replace('\r', ' ').strip()
            if len(context) > 50:
                context = context[:47] + '...'
            
            key = (char, f'U+{char_code:04X}')
            if key not in _unhandled_non_ascii:
                _unhandled_non_ascii[key] = []
            if len(_unhandled_non_ascii[key]) < 5:  # Limit to 5 examples per character
                _unhandled_non_ascii[key].append(context)
    
    # For any remaining non-ASCII characters, use Unicode normalization
    # and then replace with closest ASCII equivalent or remove
    # First try to decompose and then remove combining marks
    normalized = unicodedata.normalize('NFKD', text)
    # Replace any remaining non-ASCII characters with closest ASCII or remove
    ascii_text = ''
    for char in normalized:
        if ord(char) < 128:
            ascii_text += char
        else:
            # Check if this is a combining mark (diacritic) - these are expected after NFKD
            if unicodedata.category(char).startswith('M'):
                # Combining mark, skip it (it should have been decomposed)
                continue
            
            # Try to get a close ASCII equivalent
            try:
                ascii_char = unicodedata.normalize('NFKD', char).encode('ascii', 'ignore').decode('ascii')
                ascii_text += ascii_char
            except:
                # If no equivalent, skip the character (it will be removed)
                pass
    text = ascii_text
    
    return text


# Standard statblock labels that should be bold (without colons, to handle OCR errors)
# Statblock labels in their canonical order (used for detection and splitting)
STATBLOCK_LABELS_ORDERED = [
    'Hit Dice', 'Initiative', 'Speed', 'Armor Class', 'Base Attack/Grapple',
    'Attack', 'Full Attack', 'Space/Reach', 'Special Attacks', 'Special Qualities',
    'Saves', 'Abilities', 'Skills', 'Feats', 'Environment', 'Organization',
    'Challenge Rating', 'Treasure', 'Alignment', 'Advancement', 'Level Adjustment'
]

STATBLOCK_LABELS = set(STATBLOCK_LABELS_ORDERED)


def is_label(text: str, allow_no_colon: bool = False) -> bool:
    """
    Check if text is a label (should be bold).
    Labels are statblock labels or special ability names, not general text.
    
    Args:
        text: Text to check
        allow_no_colon: If True, also match labels without colon (for OCR error handling)
    """
    if not text:
        return False
    
    text = text.strip()
    text_no_colon = text.rstrip(':').strip()
    
    # Check if it's a known statblock label (with or without colon)
    if text_no_colon in STATBLOCK_LABELS:
        return True
    
    # Check if it ends with colon (standard label pattern)
    if text.endswith(':'):
        # Check for special ability patterns like "Something (Su):" or "Something (Ex):"
        # These are typically ability names with abbreviations in parentheses
        words = text.split()
        if len(words) <= 5 and len(text) <= 50:
            # Pattern: words followed by (Abbrev): like "Aura of Menace (Su):"
            if re.match(r'^[\w\s\-]+\([A-Za-z]+\):\s*$', text):
                return True
            # Pattern: simple label ending in colon, but must be short and look like a label
            # Exclude common sentence starters
            if re.match(r'^[\w\s\-]+:\s*$', text) and len(words) <= 3:
                # Exclude common sentence patterns
                if not text.lower().startswith(('the ', 'a ', 'an ', 'this ', 'that ', 'these ', 'those ')):
                    return True
    
    # If allow_no_colon is True, also check without colon (for OCR errors)
    if allow_no_colon and not text.endswith(':'):
        words = text.split()
        if len(words) <= 5 and len(text) <= 50:
            # Check for special ability patterns like "Something (Su)" or "Something (Ex)"
            if re.match(r'^[\w\s\-]+\([A-Za-z]+\)\s*$', text):
                return True
            # Very restrictive: only short labels (1-3 words) that look like statblock entries
            # Exclude common sentence starters
            if len(words) <= 3 and not text.lower().startswith(('the ', 'a ', 'an ', 'this ', 'that ', 'these ', 'those ')):
                # Must match a pattern that looks like a label, not a sentence
                if re.match(r'^[A-Z][\w\s\-]+(\([A-Za-z]+\))?\s*$', text):
                    return True
    
    return False


def _check_statblock_context(paragraph: Tag, all_paragraphs: List[Tag]) -> bool:
    """
    Check if a paragraph is within a statblock context.
    Statblocks start with 'Hit Dice' and end with 'Level Adjustment'.
    
    Args:
        paragraph: The paragraph to check
        all_paragraphs: List of all paragraphs in the element
        
    Returns:
        True if the paragraph is within a statblock context
    """
    if paragraph not in all_paragraphs:
        return False
    
    p_idx = all_paragraphs.index(paragraph)
    in_statblock = False
    
    for i in range(p_idx + 1):
        check_p = all_paragraphs[i]
        if check_p.find_parent('table'):
            continue
        check_text = check_p.get_text()
        for statblock_label in STATBLOCK_LABELS_ORDERED:
            statblock_pattern = r'^' + re.escape(statblock_label) + r':\s*'
            if re.match(statblock_pattern, check_text, re.IGNORECASE):
                if statblock_label == 'Hit Dice':
                    in_statblock = True
                elif statblock_label == 'Level Adjustment':
                    in_statblock = False
                break
    
    return in_statblock


def _process_table_bold_formatting(table: Tag) -> None:
    """
    Process bold formatting for a table.
    - First column should be bold (if it's a label)
    - Other columns should not be bold
    - Exception: rows with empty first column should be bold
    """
    for row in table.find_all('tr'):
        cells = row.find_all(['td', 'th'])
        if not cells:
            continue
        
        # Clean up table cells: remove <p> tags, vertical-align styles, and normalize whitespace
        for cell in cells:
            # Remove vertical-align:bottom; from style
            style = cell.get('style', '')
            if style:
                # Remove vertical-align:bottom; (with or without semicolon)
                new_style = re.sub(r'vertical-align:\s*bottom[;\s]*', '', style).strip()
                # Clean up extra semicolons and spaces
                new_style = re.sub(r';\s*;+', ';', new_style)  # Remove double semicolons
                new_style = new_style.strip(';').strip()  # Remove trailing semicolon
                if new_style:
                    cell['style'] = new_style
                else:
                    del cell['style']
            
            # Unwrap all <p> tags within the cell (preserving their content)
            for p in cell.find_all('p'):
                p.unwrap()
            
            # Normalize whitespace in text nodes: remove newlines and collapse multiple spaces
            # Process all text nodes in the cell (including nested ones)
            # Collect all text nodes first to avoid modification during iteration
            text_nodes_to_process = []
            for descendant in cell.descendants:
                if isinstance(descendant, NavigableString):
                    text_nodes_to_process.append(descendant)
            
            for text_node in text_nodes_to_process:
                # Skip if node has been removed
                if text_node.parent is None:
                    continue
                
                text = str(text_node)
                # Replace newlines, carriage returns, tabs with space, then collapse all whitespace
                normalized = re.sub(r'[\n\r\t]+', ' ', text)  # Replace newlines/tabs with space
                normalized = re.sub(r'[ \xa0\u2000-\u200B\u202F\u205F\u3000]+', ' ', normalized)  # Replace all space variants with regular space
                normalized = re.sub(r'\s+', ' ', normalized)  # Collapse multiple spaces
                normalized = normalized.strip()  # Remove leading/trailing whitespace
                
                if normalized != text:
                    # Replace the text node
                    try:
                        text_node.replace_with(NavigableString(normalized))
                    except (ValueError, AttributeError):
                        # Node might have been removed, skip it
                        pass
        
        first_cell = cells[0]
        first_cell_text = first_cell.get_text(strip=True)
        
        # Check if first cell is empty
        if not first_cell_text:
            # Empty first column: make entire row bold
            for cell in cells:
                # Make sure cell content is bold at td level
                _ensure_bold(cell)
                # Remove any inner bold spans (double wrapping)
                for bold_span in cell.find_all('span', style=lambda x: x and 'font-weight:bold' in x):
                    bold_span.replace_with_children()
        else:
            # First column should be bold (if it's a label, with or without colon)
            if is_label(first_cell_text, allow_no_colon=True):
                _ensure_bold(first_cell)
                # Remove any inner bold spans (double wrapping)
                for bold_span in first_cell.find_all('span', style=lambda x: x and 'font-weight:bold' in x):
                    bold_span.replace_with_children()
            else:
                _remove_bold(first_cell)
            
            # Other columns should not be bold
            for cell in cells[1:]:
                _remove_bold(cell)
                # Also remove any inner bold spans
                for bold_span in cell.find_all('span', style=lambda x: x and 'font-weight:bold' in x):
                    bold_span.replace_with_children()


def _wrap_label_in_text_node(child: NavigableString, matched_text_clean: str, soup: BeautifulSoup) -> bool:
    """
    Wrap a label found in a text node with a bold span.
    
    Args:
        child: The NavigableString containing the label
        matched_text_clean: Cleaned version of the label for matching
        soup: BeautifulSoup instance for creating new tags
        
    Returns:
        True if the label was wrapped, False otherwise
    """
    text = str(child)
    # Normalize whitespace for comparison
    text_normalized = re.sub(r'\s+', ' ', text).strip()
    
    # Check if text starts with the label (case-insensitive, handling whitespace)
    if text_normalized.lower().startswith(matched_text_clean.lower()):
        # Found the label - find the actual position in the original text
        # Try to find the label in the original text (case-insensitive)
        pattern_escaped = re.escape(matched_text_clean)
        # Replace spaces in pattern with flexible whitespace matcher
        pattern_flexible = pattern_escaped.replace(r'\ ', r'\s+')
        match_obj = re.search(pattern_flexible, text, re.IGNORECASE)
        if match_obj:
            label_pos = match_obj.start()
            label_end = match_obj.end()
            
            # Found the label - split the text node
            before = text[:label_pos]
            # Use the actual matched text from the original (preserve original formatting)
            matched_actual = text[label_pos:label_end]
            after = text[label_end:]
            
            # Create new structure: [before, bold_span(label), after]
            new_nodes = []
            
            if before:
                new_nodes.append(NavigableString(before))
            
            label_span = soup.new_tag('span', style='font-weight:bold;')
            label_span.string = matched_actual.strip()
            new_nodes.append(label_span)
            
            if after:
                new_nodes.append(NavigableString(after))
            
            # Replace the text node with the new structure
            child.replace_with(*new_nodes)
            return True
    
    return False


def _process_bold_tags(element: Tag) -> None:
    """
    Process b and strong tags, converting them to spans or removing bold as appropriate.
    
    Args:
        element: The element to process
    """
    for tag in list(element.find_all(['b', 'strong'])):
        text = tag.get_text(strip=True)
        # Check if parent is a table (already processed)
        if tag.find_parent('table'):
            continue
        
        # Check if it's a label (with or without colon)
        if is_label(text, allow_no_colon=True):
            # Keep it bold, but convert to span with style for consistency
            if tag.name in ['b', 'strong']:
                soup = tag.find_parent(BeautifulSoup) or BeautifulSoup('', 'html.parser')
                span = soup.new_tag('span', style='font-weight:bold;')
                span.string = tag.get_text()
                tag.replace_with(span)
        else:
            # Remove bold, unwrap the tag
            tag.unwrap()


def _process_statblock_labels_in_paragraphs(element: Tag, soup: BeautifulSoup) -> None:
    """
    Find and bold statblock labels that appear in the middle of paragraphs.
    Only bolds labels that appear at the START of a statblock entry (not as part of other text).
    Uses the known order of labels to identify valid label positions.
    Only bolds statblock labels when within a statblock context.
    
    Args:
        element: The element to process
        soup: BeautifulSoup instance for creating new tags
    """
    logger = logging.getLogger(__name__)
    paragraphs = list(element.find_all('p'))
    
    # Track whether we're within a statblock context
    # Statblocks start with 'Hit Dice' and end with 'Level Adjustment'
    in_statblock = False
    
    for p in paragraphs:
        if p.find_parent('table'):
            continue
        
        # Check if this paragraph starts with a statblock label to update context
        paragraph_text = p.get_text()
        first_label = None
        for label in STATBLOCK_LABELS_ORDERED:
            pattern = r'^' + re.escape(label) + r':\s*'
            if re.match(pattern, paragraph_text, re.IGNORECASE):
                first_label = label
                break
        
        # Update statblock context tracking
        # Note: We need to process "Level Adjustment" while still in statblock context
        # So we only exit statblock context AFTER processing the paragraph
        if first_label == 'Hit Dice':
            in_statblock = True
        
        # Only process statblock labels if we're within a statblock context
        # (unless it's a special ability label like "Something (Ex):" which should always be bold)
        if not in_statblock:
            # Skip statblock label processing, but still check for special ability labels
            # Check if paragraph starts with a special ability pattern
            ability_pattern = r'^[\w\s\-]+\([A-Za-z]+\):\s*'
            if re.match(ability_pattern, paragraph_text):
                # This is a special ability label, process it
                pass
            else:
                # Not in statblock and not a special ability, skip statblock label bolding
                continue
        
        # Get the full paragraph text to check for label order
        # Find all statblock labels in the paragraph, checking their order
        # Only bold labels that appear in the correct sequence (indicating they're actual statblock entries)
        found_labels = []
        current_pos = 0
        last_label_index = -1  # Track the index of the last found label in STATBLOCK_LABELS_ORDERED
        
        for label_index, label in enumerate(STATBLOCK_LABELS_ORDERED):
            # Only process STATBLOCK_LABELS if we're within a statblock context
            # This prevents matching "abilities:" when it's part of "psionic abilities:" outside statblocks
            if label in STATBLOCK_LABELS and not in_statblock:
                continue
            
            # Look for this label in the remaining text
            # When in statblock context, use word boundaries to catch labels in the middle of paragraphs
            # When not in statblock context, only match at start or after sentence-ending punctuation
            if current_pos == 0:
                # At start of paragraph - match label at beginning
                pattern = r'^' + re.escape(label) + r':\s*'
            elif in_statblock:
                # In statblock context - use word boundaries to match labels in middle of paragraphs
                # This catches cases like "Armor Class: 15 Base Attack/Grapple: +2"
                pattern = r'\b' + re.escape(label) + r':\s*'
            else:
                # Not in statblock - only match after sentence-ending punctuation
                # This prevents matching "abilities:" when it's part of "psionic abilities:"
                pattern = r'(?:\.\s+|;\s+|\?\s+|\!\s+)' + re.escape(label) + r':\s*'
            match = re.search(pattern, paragraph_text[current_pos:], re.IGNORECASE)
            
            if match:
                match_start = current_pos + match.start()
                match_end = current_pos + match.end()
                label_text = match.group(0)
                
                
                # Only accept this label if it comes after the previous label in order
                # (or if it's the first label we've found)
                # AND if we're within a statblock context (for statblock labels)
                # EXCEPT for "Level Adjustment" which should be processed even if it's the first label
                should_process = (label_index > last_label_index) or (label == 'Level Adjustment' and current_pos == 0)
                
                if should_process:
                    # Check if we're in statblock context for statblock labels
                    # (special ability labels like "Something (Ex):" are always bold)
                    # "Level Adjustment" should be processed if we're in a statblock or if it's at the start of a paragraph
                    if label in STATBLOCK_LABELS:
                        # This is a statblock label - only bold if in statblock context
                        # OR if it's "Level Adjustment" at the start of a paragraph (might be end of statblock)
                        if not in_statblock and not (label == 'Level Adjustment' and current_pos == 0):
                            # Skip this label - it's a statblock label but we're not in a statblock
                            current_pos = match_end
                            continue

                    # Check if this position is already within a bold span
                    already_bold = False
                    # Find the text node containing this position
                    text_pos = 0
                    for child in p.descendants:
                        if isinstance(child, NavigableString):
                            child_text = str(child)
                            child_start = text_pos
                            child_end = text_pos + len(child_text)
                            if child_start <= match_start < child_end:
                                # This text node contains the label
                                parent = child.parent
                                if isinstance(parent, Tag):
                                    style = parent.get('style', '')
                                    if 'font-weight:bold' in style:
                                        already_bold = True
                                        break
                            text_pos = child_end
                            if text_pos > match_end:
                                break
                    
                    if not already_bold:
                        found_labels.append((match_start, match_end, label_text, label))
                        last_label_index = label_index
                    
                    # Always update current_pos to continue searching after this label,
                    # even if it's already bold (so we can find subsequent labels)
                    current_pos = match_end
        
        # Update statblock context AFTER processing labels in this paragraph
        # If this paragraph starts with "Level Adjustment", we've reached the end
        if first_label == 'Level Adjustment':
            in_statblock = False  # We've reached the end of the statblock
        
        # If we found labels in order, bold them
        # Process in reverse order to avoid position shifts from previous boldings
        if found_labels:
            # Process in reverse order (from end to start) to avoid index issues
            for match_start, match_end, label_text, label_name in reversed(found_labels):
                # Find the text node containing this position and split it
                # We need to recalculate positions from the current paragraph state
                # since previous boldings may have changed the structure
                text_pos = 0
                found_text_node = None
                label_pos_in_node = None
                
                for child in list(p.descendants):
                    if isinstance(child, NavigableString) and child.parent:
                        child_text = str(child)
                        child_start = text_pos
                        child_end = text_pos + len(child_text)
                        
                        # Check if this text node contains the label position
                        # We need to find the label text in the current node, not use absolute positions
                        # since the paragraph structure may have changed from previous boldings
                        if label_text.lower() in child_text.lower():
                            # Found the label in this text node
                            # Find its exact position (case-insensitive)
                            label_match = re.search(re.escape(label_text), child_text, re.IGNORECASE)
                            if label_match:
                                found_text_node = child
                                label_pos_in_node = label_match.start()
                                break
                        
                        text_pos = child_end
                
                if found_text_node and label_pos_in_node is not None:
                    # Split the text node at the label position
                    node_text = str(found_text_node)
                    before = node_text[:label_pos_in_node]
                    label_part = node_text[label_pos_in_node:label_pos_in_node + len(label_text)]
                    after = node_text[label_pos_in_node + len(label_text):]
                    
                    new_nodes = []
                    if before:
                        new_nodes.append(NavigableString(before))
                    
                    label_span = soup.new_tag('span', style='font-weight:bold;')
                    label_span.string = label_part
                    new_nodes.append(label_span)
                    
                    if after:
                        new_nodes.append(NavigableString(after))
                    
                    try:
                        found_text_node.replace_with(*new_nodes)
                    except (ValueError, AttributeError):
                        pass


def _split_paragraphs_with_flavor_text(element: Tag, soup: BeautifulSoup) -> None:
    """
    Split paragraphs that contain italic spans (flavor text) mixed with regular text.
    Fully italic spans should be in their own paragraph.
    Only detects flavor text once per variant, and never inside COMBAT blocks.
    
    Args:
        element: The element to process
        soup: BeautifulSoup instance for creating new tags
    """
    paragraphs = list(element.find_all('p'))
    
    # Track if we've already found flavor text for this variant
    # Flavor text only appears once per variant, before any COMBAT section
    flavor_text_found = False
    
    # Find all COMBAT sections (h4, h5 with "Combat" text)
    # Each variant can have its own COMBAT section, so we need to track them all
    combat_sections = []
    for heading in element.find_all(['h4', 'h5']):
        heading_text = heading.get_text(strip=True)
        if 'combat' in heading_text.lower():
            combat_sections.append(heading)
    
    for p in list(paragraphs):
        if p.find_parent('table'):
            continue
        
        # Skip if we're inside a COMBAT block
        # Check if this paragraph comes after any COMBAT heading and before the next heading
        in_combat = False
        for combat_section in combat_sections:
            # Check if paragraph comes after this COMBAT heading
            current = combat_section.find_next()
            found_p = False
            found_next_heading = False
            
            while current:
                if current == p:
                    found_p = True
                    break
                # Check if we hit another heading (h3, h4, h5) - that's the end of this COMBAT section
                if isinstance(current, Tag) and current.name in ['h3', 'h4', 'h5']:
                    found_next_heading = True
                    break
                current = current.find_next()
            
            if found_p and not found_next_heading:
                # This paragraph is after a COMBAT heading and before the next heading
                in_combat = True
                break
        
        if in_combat:
            # We're in COMBAT section, skip flavor text detection
            continue
        
        # Skip if we've already found flavor text for this variant
        # But reset if we hit a variant heading (h4) - each variant can have its own flavor text
        # Check if there's a variant heading before this paragraph
        prev_heading = p.find_previous(['h3', 'h4'])
        if prev_heading and isinstance(prev_heading, Tag):
            # Check if it's a variant heading (h4, not the main monster heading h3)
            # But also check if it's a COMBAT heading - if so, we're past flavor text
            prev_text = prev_heading.get_text(strip=True)
            if prev_heading.name == 'h4' and 'combat' not in prev_text.lower():
                # This is a new variant heading (not COMBAT), reset flavor text tracking
                flavor_text_found = False
            elif prev_heading.name in ['h4', 'h5'] and 'combat' in prev_text.lower():
                # We're in a COMBAT section, skip flavor text detection (already handled above)
                continue
        
        if flavor_text_found:
            continue
        
        # Check if paragraph contains both italic and non-italic content
        italic_spans = p.find_all('span', style=lambda x: x and 'font-style:italic' in x)
        regular_content = False
        
        # Check for non-italic text nodes or non-italic spans
        for child in p.children:
            if isinstance(child, NavigableString):
                if child.strip():
                    regular_content = True
                    break
            elif isinstance(child, Tag):
                # Check if it's not an italic span
                child_style = child.get('style') or ''
                if 'font-style:italic' not in child_style:
                    # Check if it has text content
                    if child.get_text(strip=True):
                        regular_content = True
                        break
        
        # If we have both italic spans and regular content, check if we should split
        # Only split if there's a substantial italic span (flavor text)
        # Don't split if there are just short italic spans (spell names) mixed with regular text
        if italic_spans and regular_content:
            # Check if any italic span is substantial (flavor text, not spell names)
            # Spell names are typically short (< 30 chars), flavor text is longer
            substantial_italic_span = None
            for italic_span in italic_spans:
                italic_text = italic_span.get_text(strip=True)
                if len(italic_text) > 50:  # Substantial flavor text
                    substantial_italic_span = italic_span
                    break
            
            # Only split if we found a substantial italic span
            if substantial_italic_span:
                italic_text = substantial_italic_span.get_text(strip=True)
                
                # Determine the order: check if italic comes before or after regular content
                children_list = list(p.children)
                italic_pos = None
                regular_pos = None
                
                for i, child in enumerate(children_list):
                    if child == substantial_italic_span or (isinstance(child, Tag) and child in italic_spans and len(child.get_text(strip=True)) > 50):
                        if italic_pos is None:
                            italic_pos = i
                    elif isinstance(child, NavigableString):
                        if child.strip() and regular_pos is None:
                            regular_pos = i
                    elif isinstance(child, Tag):
                        child_style = child.get('style') or ''
                        if 'font-style:italic' not in child_style:
                            if child.get_text(strip=True) and regular_pos is None:
                                regular_pos = i
                
                # Create a new paragraph for the italic content
                new_p = soup.new_tag('p')
                
                # Move all substantial italic spans to the new paragraph
                # Find all substantial italic spans (consecutive ones)
                move_content = False
                for child in list(p.children):
                    if child == substantial_italic_span or (isinstance(child, Tag) and child in italic_spans and len(child.get_text(strip=True)) > 50):
                        move_content = True
                        new_p.append(child.extract())
                    elif move_content:
                        # Check if this is part of the italic block (whitespace, etc.)
                        if isinstance(child, NavigableString):
                            if not child.strip():
                                # Whitespace - keep it with italic
                                new_p.append(child.extract())
                            else:
                                # Non-whitespace text - we've reached regular content, stop
                                break
                        elif isinstance(child, Tag):
                            child_style = child.get('style') or ''
                            if 'font-style:italic' in child_style and len(child.get_text(strip=True)) > 50:
                                # Another substantial italic span - move it
                                new_p.append(child.extract())
                            else:
                                # Non-italic tag or short italic (spell name) - we've reached regular content, stop
                                break
                
                # Insert the new paragraph in the correct position
                if len(new_p.contents) > 0:
                    if regular_pos is not None and italic_pos is not None and regular_pos < italic_pos:
                        # Regular content comes first - insert italic paragraph after
                        p.insert_after(new_p)
                    else:
                        # Italic content comes first - insert italic paragraph before
                        p.insert_before(new_p)
                    
                    # Mark that we've found flavor text for this variant
                    flavor_text_found = True


def _split_paragraphs_with_multiple_labels(element: Tag, soup: BeautifulSoup) -> None:
    """
    Split paragraphs that contain multiple statblock labels.
    Each statblock label should be in its own paragraph.
    
    This function only splits paragraphs based on existing bold spans (labels that were
    already bolded by earlier functions). It does NOT bold labels itself.
    
    Args:
        element: The element to process
        soup: BeautifulSoup instance for creating new tags
    """
    paragraphs = list(element.find_all('p'))
    
    for p in list(paragraphs):
        if p.find_parent('table'):
            continue
        
        # Find all bold spans that contain statblock labels or ability labels
        bold_spans = p.find_all('span', style=lambda x: x and 'font-weight:bold' in x)
        label_spans = []
        for span in bold_spans:
            span_text = span.get_text(strip=True)
            # Check if this span contains a statblock label
            is_label_span = False
            for label in STATBLOCK_LABELS:
                pattern = re.escape(label) + r':?\s*'
                if re.match(pattern, span_text, re.IGNORECASE):
                    label_spans.append(span)
                    is_label_span = True
                    break
            
            # Also check for ability labels (like "Stun (Su):", "Aura of Menace (Su):", etc.)
            # and special labels like "Spell-Like Abilities:"
            if not is_label_span:
                # Pattern: word(s) followed by (Ex), (Su), (Sp), or similar, optionally followed by colon
                ability_pattern = r'^[\w\s\-]+\([A-Za-z]+\):?\s*$'
                if re.match(ability_pattern, span_text):
                    label_spans.append(span)
                # Also check for "Spell-Like Abilities:" or similar special ability headers
                elif re.match(r'^[\w\s\-]+(?:Abilities|Attacks|Qualities):?\s*$', span_text, re.IGNORECASE):
                    label_spans.append(span)
        
        # If we found more than one label span, split the paragraph
        if len(label_spans) > 1:
            current_p = p
            # Split at each label span (except the first one)
            # We need to process them in reverse order to avoid index issues
            # Actually, let's process them one at a time and re-find spans after each split
            remaining_splits = len(label_spans) - 1
            while remaining_splits > 0:
                # Re-find label spans in the current paragraph (they may have moved)
                current_bold_spans = current_p.find_all('span', style=lambda x: x and 'font-weight:bold' in x)
                current_label_spans = []
                for span in current_bold_spans:
                    span_text = span.get_text(strip=True)
                    is_label_span = False
                    # Check if this span contains a statblock label
                    for label in STATBLOCK_LABELS:
                        pattern = re.escape(label) + r':?\s*'
                        if re.match(pattern, span_text, re.IGNORECASE):
                            current_label_spans.append(span)
                            is_label_span = True
                            break
                    
                    # Also check for ability labels (like "Stun (Su):", "Aura of Menace (Su):", etc.)
                    # and special labels like "Spell-Like Abilities:"
                    if not is_label_span:
                        # Pattern: word(s) followed by (Ex), (Su), (Sp), or similar, optionally followed by colon
                        ability_pattern = r'^[\w\s\-]+\([A-Za-z]+\):?\s*$'
                        if re.match(ability_pattern, span_text):
                            current_label_spans.append(span)
                        # Also check for "Spell-Like Abilities:" or similar special ability headers
                        elif re.match(r'^[\w\s\-]+(?:Abilities|Attacks|Qualities):?\s*$', span_text, re.IGNORECASE):
                            current_label_spans.append(span)
                
                # If we still have multiple labels, split at the second one
                if len(current_label_spans) > 1:
                    label_span = current_label_spans[1]  # Second label
                    
                    # Create a new paragraph
                    new_p = soup.new_tag('p')
                    
                    # Find all elements from this label span onwards
                    move_children = False
                    for child in list(current_p.children):
                        # Check if this child or its descendants contain the label span
                        if isinstance(child, Tag):
                            if label_span in child.descendants or label_span == child:
                                move_children = True
                        elif label_span == child:
                            move_children = True
                        
                        if move_children:
                            new_p.append(child.extract())
                    
                    if len(new_p.contents) > 0:
                        # Insert the new paragraph after the current one
                        current_p.insert_after(new_p)
                        current_p = new_p
                        remaining_splits -= 1
                    else:
                        # Couldn't split, break to avoid infinite loop
                        break
                else:
                    # No more splits needed
                    break


def _process_bold_spans(element: Tag) -> None:
    """
    Process span elements with font-weight:bold, ensuring only labels are bolded
    and removing bold from non-labels.
    
    Args:
        element: The element to process
    """
    soup = element if isinstance(element, BeautifulSoup) else element.find_parent(BeautifulSoup) or BeautifulSoup('', 'html.parser')
    all_paragraphs = list(element.find_all('p'))
    
    # Pre-compute statblock context for all paragraphs to avoid repeated expensive lookups
    # Create a map from paragraph to its statblock context
    paragraph_statblock_map = {}
    in_statblock = False
    # Pre-compile regex patterns for statblock labels
    statblock_patterns = [(re.compile(r'^' + re.escape(label) + r':\s*', re.IGNORECASE), label) 
                          for label in STATBLOCK_LABELS_ORDERED]
    
    for p in all_paragraphs:
        if p.find_parent('table'):
            paragraph_statblock_map[p] = False
            continue
        check_text = p.get_text()
        # Use pre-compiled patterns
        for pattern, statblock_label in statblock_patterns:
            if pattern.match(check_text):
                if statblock_label == 'Hit Dice':
                    in_statblock = True
                elif statblock_label == 'Level Adjustment':
                    in_statblock = False
                break
        paragraph_statblock_map[p] = in_statblock
    
    # Only process spans that are bold - use a more efficient filter
    bold_spans = list(element.find_all('span', style=lambda x: x and 'font-weight:bold' in x))
    
    # Pre-compile regex patterns for label matching
    statblock_label_patterns = [(re.compile(re.escape(label) + r':?\s*', re.IGNORECASE), label) 
                                for label in STATBLOCK_LABELS]
    ability_pattern = re.compile(r'^[\w\s\-]+\([A-Za-z]+\):\s*', re.IGNORECASE)
    
    for span in bold_spans:
        # Skip if inside a table (already processed)
        if span.find_parent('table'):
            continue
        
        style = span.get('style', '')
        
        # Quick check: get text
        text = span.get_text(strip=True)
        
        # If span has no colon, it's definitely not a label - remove bold and continue
        if ':' not in text:
            # Remove bold from style
            new_style = re.sub(r'font-weight:\s*bold[;\s]*', '', style).strip()
            if new_style.endswith(';'):
                new_style = new_style[:-1]
            if new_style:
                span['style'] = new_style
            else:
                del span['style']
            # If span has no attributes left, unwrap it
            if not span.attrs and span.parent:
                span.unwrap()
            continue
        
        # Extract label part (before colon)
        colon_pos = text.find(':')
        text_for_label_check = text[:colon_pos + 1].strip()
        
        # Early exit: label part should be reasonably short (labels are typically < 30 chars)
        # If the label part is too long, it's probably not a label - remove bold
        if len(text_for_label_check) > 30:
            # Remove bold from style
            new_style = re.sub(r'font-weight:\s*bold[;\s]*', '', style).strip()
            if new_style.endswith(';'):
                new_style = new_style[:-1]
            if new_style:
                span['style'] = new_style
            else:
                del span['style']
            # If span has no attributes left, unwrap it
            if not span.attrs and span.parent:
                span.unwrap()
            continue
        
        # Check if this is a known statblock label using pre-compiled patterns
        label_text = None
        is_statblock_label = False
        for pattern, label in statblock_label_patterns:
            if pattern.match(text_for_label_check):
                label_text = text_for_label_check
                is_statblock_label = True
                break
                        
        # Check if this is a special ability label (always bold, regardless of statblock context)
        is_ability_label = ability_pattern.match(text_for_label_check) is not None
        
        # Check statblock context for this specific span by looking at its paragraph
        in_statblock_for_this_span = False
        if is_statblock_label:
            # Find the paragraph containing this span
            p = span.find_parent('p')
            if p and not p.find_parent('table'):
                # Use pre-computed statblock context instead of calling _check_statblock_context
                in_statblock_for_this_span = paragraph_statblock_map.get(p, False)
        
        # Only bold statblock labels if we're within a statblock context
        # (unless it's a special ability label)
        should_be_bold = False
        if is_ability_label:
            should_be_bold = True
        elif is_statblock_label:
            # Only bold statblock labels when within statblock context
            # EXCEPT for "Level Adjustment" which should always be bold (it marks the end of the statblock)
            should_be_bold = in_statblock_for_this_span or (label_text and 'Level Adjustment' in label_text)
        elif is_label(text_for_label_check, allow_no_colon=True) or is_label(text, allow_no_colon=True):
            # Other labels (not statblock labels) can be bold if they match label patterns
            should_be_bold = True
        
        if should_be_bold:
            # This is a label, but it might include a value after the colon
            # If there's content after the label, split it into label (bold) and value (not bold)
            # Check if the span contains both label and value (has colon and content after it)
            # Split for statblock labels, ability labels, or any other recognized label
            is_any_label = is_statblock_label or is_ability_label or is_label(text_for_label_check, allow_no_colon=True)
            if ':' in text and is_any_label:
                # Find the colon position in the full text
                colon_pos = text.find(':')
                # Check if there's content after the colon
                after_colon = text[colon_pos + 1:].strip()
                if after_colon:
                    # The span contains both label and value - split them
                    # Get the full text with original whitespace to find the split point
                    full_text = span.get_text()
                    colon_pos_full = full_text.find(':')
                    if colon_pos_full != -1:
                        # Find the end of the label (colon + optional whitespace)
                        label_end = colon_pos_full + 1
                        # Skip whitespace after colon
                        while label_end < len(full_text) and full_text[label_end] in ' \t\n\r':
                            label_end += 1
                        
                        # Split the text
                        label_part = full_text[:label_end]
                        value_part = full_text[label_end:]
                        
                        if value_part.strip():
                            # Check if the original span had italic style (to preserve it in the value)
                            has_italic = 'font-style:italic' in style or 'font-style: italic' in style
                            
                            # Clear the span and rebuild with two spans
                            span.clear()
                            
                            # Create bold label span
                            label_span = soup.new_tag('span', style='font-weight:bold;')
                            label_span.string = label_part
                            span.append(label_span)
                            
                            # Create non-bold value span (preserve italic if it was in the original)
                            value_style = 'font-style:italic;' if has_italic else ''
                            value_span = soup.new_tag('span', style=value_style if value_style else None)
                            value_span.string = value_part
                            span.append(value_span)
                            
                            # Remove bold from outer span before unwrapping
                            # (the inner spans now have the correct formatting)
                            if 'style' in span.attrs:
                                new_style = re.sub(r'font-weight:\s*bold[;\s]*', '', span.get('style', '')).strip()
                                if new_style.endswith(';'):
                                    new_style = new_style[:-1]
                                if new_style:
                                    span['style'] = new_style
                                else:
                                    del span['style']
                            
                            # Now unwrap the outer span since it only contains the two inner spans
                            span.unwrap()
            
            # Check for double wrapping (after potential splitting)
            inner_bold = span.find('span', style=lambda x: x and 'font-weight:bold' in x)
            if inner_bold and inner_bold.get_text(strip=True) == span.get_text(strip=True) and inner_bold.parent:
                # Move inner content to parent and remove inner span
                inner_bold.replace_with_children()
        else:
            # Remove bold from style
            new_style = re.sub(r'font-weight:\s*bold[;\s]*', '', style).strip()
            if new_style.endswith(';'):
                new_style = new_style[:-1]
            if new_style:
                span['style'] = new_style
            else:
                del span['style']
            # If span has no attributes left, unwrap it
            if not span.attrs and span.parent:
                span.unwrap()


def _process_paragraph_labels_at_start(p: Tag, soup: BeautifulSoup, in_statblock_for_p: bool) -> None:
    """
    Process paragraphs that start with labels, wrapping the label in a bold span.
    
    Args:
        p: The paragraph to process
        soup: BeautifulSoup instance for creating new tags
        in_statblock_for_p: Whether this paragraph is within a statblock context
    """
    logger = logging.getLogger(__name__)
    # Skip paragraphs that are entirely italic (like flavor text)
    # Only skip if the paragraph itself is italic, or if the first meaningful content is italic
    # Don't skip just because there are italic children later (like spell names)
    skip_paragraph = False
    if p.get('style') and 'font-style:italic' in p.get('style', ''):
        skip_paragraph = True
    else:
        # Check if the first non-whitespace child is italic
        for child in p.children:
            if isinstance(child, NavigableString):
                if child.strip():
                    # First meaningful content is text, not italic - don't skip
                    break
            elif isinstance(child, Tag):
                if child.get('style') and 'font-style:italic' in child.get('style', ''):
                    # First meaningful content is italic - this is likely flavor text
                    skip_paragraph = True
                break
    
    if skip_paragraph:
        # This is italic text (like flavor text), don't process for labels
        return
    
    text = p.get_text(strip=True)
    
    # Check if paragraph starts with a label (with or without colon)
    # Try matching known statblock labels first
    for label in STATBLOCK_LABELS:
        # Match label with or without colon, followed by optional whitespace
        pattern = re.escape(label) + r':?\s*'
        match = re.match(pattern, text, re.IGNORECASE)
        
        if match:
            # Only process statblock labels if we're in a statblock context
            # EXCEPT for "Level Adjustment" which should be processed even if not in statblock
            # (it marks the end of the statblock)
            if not in_statblock_for_p and label != 'Level Adjustment':
                # Skip this - it's a statblock label but we're not in a statblock
                continue
            
            # Extract the matched label (preserve original case and colon if present)
            matched_text = match.group(0).rstrip()
            # Clean version for matching (just the label with colon, no extra whitespace)
            matched_text_clean = re.sub(r'\s+', ' ', matched_text).strip()
            
            # Find the first text node that contains the label and wrap just that part
            # This preserves all other formatting (like italic spans)
            label_wrapped = False
            for child in p.descendants:
                if isinstance(child, NavigableString):
                    if _wrap_label_in_text_node(child, matched_text_clean, soup):
                        label_wrapped = True
                        break
                
                # If we couldn't find it as a text node, check if it's already wrapped
                if not label_wrapped:
                    # Check if there's already a bold span at the start
                    first_child = next(p.children, None)
                    if first_child and isinstance(first_child, Tag) and first_child.get('style') and 'font-weight:bold' in first_child.get('style', ''):
                        # Already bold, but check for double wrapping
                        # If the bold span contains another bold span, unwrap the inner one
                        inner_bold = first_child.find('span', style=lambda x: x and 'font-weight:bold' in x)
                        if inner_bold and inner_bold.parent:
                            # Double wrapped - unwrap the inner span
                            inner_bold.replace_with_children()
                    else:
                        # Fallback: wrap the first part if it's plain text
                        # But try to preserve structure
                        pass
                
                # After wrapping, check for and remove any double wrapping
                # Find all bold spans and check if they contain nested bold spans with the same text
                for bold_span in p.find_all('span', style=lambda x: x and 'font-weight:bold' in x):
                    inner_bold = bold_span.find('span', style=lambda x: x and 'font-weight:bold' in x)
                    if inner_bold and inner_bold.parent:
                        inner_text = inner_bold.get_text(strip=True)
                        outer_text = bold_span.get_text(strip=True)
                        # If the inner span's text matches the outer span's text, it's a double wrap
                        if inner_text == outer_text or inner_text == matched_text:
                            inner_bold.replace_with_children()
                
                break
    
    # Also check for other label patterns at the start (generic labels)
    # Match pattern: word(s) optionally ending with colon, followed by content
    # This handles labels like "Aura of Menace (Su):" or "Aura of Menace (Su)" (OCR error)
    # But only if it's a very short phrase at the start
    match = re.match(r'^([\w\s\-()]+:?\s*)(.+)', text)
    if match:
        potential_label = match.group(1).strip()
        # Check if it's a label (with or without colon) - be more restrictive
        # Only match if it's clearly a label (ends with colon or has ability abbreviation)
        if potential_label.endswith(':'):
            # Check if it's a label - this should match all ability labels like "(Ex):", "(Su):", "(Sp):"
            if is_label(potential_label, allow_no_colon=False):
                # Find the first text node that contains the label and wrap just that part
                # This preserves all other formatting (like italic spans)
                label_wrapped = False
                for child in p.descendants:
                    if isinstance(child, NavigableString):
                        text = str(child)
                        if text.strip().startswith(potential_label):
                            # Found the label - split the text node
                            before = text[:text.find(potential_label)]
                            after = text[text.find(potential_label) + len(potential_label):]
                            
                            # Create new structure: [before, bold_span(label), after]
                            parent = child.parent
                            new_nodes = []
                            
                            if before:
                                new_nodes.append(NavigableString(before))
                            
                            label_span = soup.new_tag('span', style='font-weight:bold;')
                            label_span.string = potential_label
                            new_nodes.append(label_span)
                            
                            if after:
                                new_nodes.append(NavigableString(after))
                            
                            # Replace the text node with the new structure
                            child.replace_with(*new_nodes)
                            label_wrapped = True
                            break
                
                # If we couldn't find it, check if it's already bold
                if not label_wrapped:
                    first_child = next(p.children, None)
                    if first_child and isinstance(first_child, Tag) and first_child.get('style') and 'font-weight:bold' in first_child.get('style', ''):
                        # Already bold, but check for double wrapping
                        inner_bold = first_child.find('span', style=lambda x: x and 'font-weight:bold' in x)
                        if inner_bold and inner_bold.parent:
                            inner_text = inner_bold.get_text(strip=True)
                            outer_text = first_child.get_text(strip=True)
                            if inner_text == outer_text or inner_text == potential_label:
                                inner_bold.replace_with_children()
                
                # After wrapping, check for and remove any double wrapping
                for bold_span in p.find_all('span', style=lambda x: x and 'font-weight:bold' in x):
                    inner_bold = bold_span.find('span', style=lambda x: x and 'font-weight:bold' in x)
                    if inner_bold and inner_bold.parent:
                        inner_text = inner_bold.get_text(strip=True)
                        outer_text = bold_span.get_text(strip=True)
                        if inner_text == outer_text or inner_text == potential_label:
                            inner_bold.replace_with_children()


def clean_bold_formatting(element: Tag) -> None:
    """
    Clean up bold formatting according to rules:
    - Outside tables: only labels (ending in ':') should be bold
    - Inside tables: first column should be bold, other columns not bold
      Exception: rows with empty first column should be bold
    """
    # First, process all tables
    for table in element.find_all('table'):
        _process_table_bold_formatting(table)
    
    # Process non-table content
    # First, handle paragraphs that start with labels
    # Get the soup object from the element
    soup = element if isinstance(element, BeautifulSoup) else element.find_parent(BeautifulSoup) or BeautifulSoup('', 'html.parser')
    
    all_paragraphs_for_context = list(element.find_all('p'))
    
    # Pre-compute statblock context for all paragraphs to avoid O(n²) lookups
    paragraph_statblock_map = {}
    in_statblock = False
    # Pre-compile regex patterns
    statblock_patterns = [(re.compile(r'^' + re.escape(label) + r':\s*', re.IGNORECASE), label) 
                          for label in STATBLOCK_LABELS_ORDERED]
    
    for p in all_paragraphs_for_context:
        if p.find_parent('table'):
            paragraph_statblock_map[p] = False
            continue
        check_text = p.get_text()
        for pattern, statblock_label in statblock_patterns:
            if pattern.match(check_text):
                if statblock_label == 'Hit Dice':
                    in_statblock = True
                elif statblock_label == 'Level Adjustment':
                    in_statblock = False
                break
        paragraph_statblock_map[p] = in_statblock
    
    paragraphs_to_process = [p for p in element.find_all('p') if not p.find_parent('table')]
    
    for p in paragraphs_to_process:
        # Get pre-computed statblock context instead of calling _check_statblock_context
        in_statblock_for_p = paragraph_statblock_map.get(p, False)
        
        # Process labels at the start of the paragraph
        _process_paragraph_labels_at_start(p, soup, in_statblock_for_p)
    
    # Process paragraphs to find and bold statblock labels that appear in the middle of paragraphs
    _process_statblock_labels_in_paragraphs(element, soup)
    
    # Process b/strong tags
    _process_bold_tags(element)
    
    # Process span elements with font-weight:bold
    _process_bold_spans(element)
    
    # After bolding labels, split paragraphs that contain multiple statblock labels
    _split_paragraphs_with_multiple_labels(element, soup)
    
    # Split paragraphs that contain italic spans (flavor text) mixed with regular text
    _split_paragraphs_with_flavor_text(element, soup)
    
    # Merge consecutive paragraphs that are part of the same statblock label
    # This handles cases where a label like "Skills:" is split across multiple paragraphs
    paragraphs = list(element.find_all('p'))
    i = 0
    
    # Track whether we're within a statblock context
    # Statblocks start with 'Hit Dice' and end with 'Level Adjustment'
    in_statblock = False
    seen_hit_dice = False
    seen_level_adjustment = False
    
    while i < len(paragraphs):
        p = paragraphs[i]
        if p.find_parent('table'):
            i += 1
            continue
        
        # Check if this paragraph starts with a statblock label
        text = p.get_text(strip=True)
        label_found = None
        for label in STATBLOCK_LABELS:
            pattern = re.escape(label) + r':?\s*'
            match = re.match(pattern, text, re.IGNORECASE)
            if match:
                label_found = label
                break
        
        # Update statblock context tracking
        if label_found == 'Hit Dice':
            seen_hit_dice = True
            in_statblock = True
        elif label_found == 'Level Adjustment':
            seen_level_adjustment = True
            in_statblock = False  # We've reached the end of the statblock
        
        # Only merge paragraphs if we're within a statblock context
        # OR if we just processed 'Abilities' (special case mentioned by user)
        should_merge = in_statblock or (label_found == 'Abilities' and i > 0)
        
        if label_found and should_merge:
            # Special case: "Level Adjustment" is the last statblock entry
            # Don't merge paragraphs after it - they are descriptive text
            if label_found == 'Level Adjustment':
                # Don't merge anything after Level Adjustment
                i += 1
                continue
            
            # Special case: "Advancement" is the second-to-last statblock entry
            # Don't merge anything after "Advancement" - "Level Adjustment" should be in its own paragraph,
            # and descriptive text should also be in separate paragraphs
            if label_found == 'Advancement':
                # Don't merge anything after Advancement
                i += 1
                continue
            
            # Check if next paragraph(s) continue this statblock entry
            # (i.e., they don't start with a new label)
            paragraphs_to_merge = []
            j = i + 1
            while j < len(paragraphs):
                next_p = paragraphs[j]
                if next_p.find_parent('table'):
                    break
                
                next_text = next_p.get_text(strip=True)
                # Check if next paragraph starts with a statblock label
                starts_with_label = False
                for label in STATBLOCK_LABELS:
                    pattern = re.escape(label) + r':?\s*'
                    if re.match(pattern, next_text, re.IGNORECASE):
                        starts_with_label = True
                        break
                
                if starts_with_label:
                    # Next paragraph starts with a new label, stop merging
                    break
                
                # Also check for ability labels (like "Something (Ex):")
                if re.match(r'^[\w\s\-]+\([A-Za-z]+\):\s*', next_text):
                    # Next paragraph starts with an ability label, stop merging
                    break
                
                # Check if this paragraph is entirely italic (flavor text) - don't merge these
                if next_p.find('span', style=lambda x: x and 'font-style:italic' in x):
                    # Check if the entire paragraph is italic
                    all_italic = True
                    for child in next_p.descendants:
                        if isinstance(child, NavigableString):
                            parent = child.parent
                            if parent and isinstance(parent, Tag):
                                style = parent.get('style', '')
                                if 'font-style:italic' not in style:
                                    # Check if parent is the paragraph itself
                                    if parent.name != 'p':
                                        all_italic = False
                                        break
                    if all_italic and len(next_p.get_text(strip=True)) > 50:
                        # This is flavor text, don't merge
                        break
                
                # This paragraph continues the statblock entry, merge it
                paragraphs_to_merge.append(next_p)
                j += 1
            
            # Merge the paragraphs
            if paragraphs_to_merge:
                # Get all children from paragraphs to merge
                for merge_p in paragraphs_to_merge:
                    # Add a space before merging
                    p.append(' ')
                    # Move all children from merge_p to p
                    for child in list(merge_p.children):
                        p.append(child)
                    # Remove the merged paragraph
                    merge_p.decompose()
                    paragraphs.remove(merge_p)
        
        i += 1
    
    # Split paragraphs that contain "Advancement" followed by other statblock labels or descriptive text
    paragraphs = list(element.find_all('p'))
    soup = element if isinstance(element, BeautifulSoup) else element.find_parent(BeautifulSoup) or BeautifulSoup('', 'html.parser')
    
    for p in list(paragraphs):
        if p.find_parent('table'):
            continue
        
        text = p.get_text(strip=True)
        
        # Check if this paragraph contains "Advancement" followed by "Level Adjustment" or descriptive text
        advancement_match = re.search(r'Advancement:?\s*[^\n]*', text, re.IGNORECASE)
        if advancement_match:
            advancement_end_pos = advancement_match.end()
            remaining_text = text[advancement_end_pos:].strip()
            
            if remaining_text:
                # Check if remaining text starts with "Level Adjustment"
                level_adj_match = re.match(r'Level Adjustment:?\s*', remaining_text, re.IGNORECASE)
                if level_adj_match:
                    # Split at "Level Adjustment"
                    # Find the position of "Level Adjustment" in the paragraph structure
                    # We need to find where "Level Adjustment" appears in the text
                    full_text = p.get_text()
                    level_adj_pos_in_text = full_text.find('Level Adjustment')
                    
                    if level_adj_pos_in_text != -1:
                        # Find which child contains "Level Adjustment"
                        children = list(p.children)
                        split_index = None
                        current_pos = 0
                        
                        for i, child in enumerate(children):
                            child_text = child.get_text() if hasattr(child, 'get_text') else str(child)
                            child_start = current_pos
                            child_end = current_pos + len(child_text)
                            
                            if child_start <= level_adj_pos_in_text < child_end:
                                # "Level Adjustment" is in this child
                                # If it's a text node or span, we need to split it
                                if isinstance(child, NavigableString):
                                    # Split the text node
                                    before = str(child)[:level_adj_pos_in_text - child_start]
                                    after = str(child)[level_adj_pos_in_text - child_start:]
                                    if before:
                                        child.replace_with(NavigableString(before))
                                    # Create new paragraph starting with "Level Adjustment"
                                    new_p = soup.new_tag('p')
                                    # Find the rest of the content starting from "Level Adjustment"
                                    remaining_children = [NavigableString(after)] + list(children[i+1:])
                                    for remaining_child in remaining_children:
                                        if remaining_child.parent == p:
                                            remaining_child.extract()
                                            new_p.append(remaining_child)
                                    if len(new_p.contents) > 0:
                                        p.insert_after(new_p)
                                    break
                                else:
                                    # It's a tag - split at this point
                                    split_index = i
                                    break
                            
                            current_pos = child_end
                        
                        if split_index is not None:
                            # Create new paragraph starting at split_index
                            new_p = soup.new_tag('p')
                            for child in children[split_index:]:
                                if child.parent == p:
                                    child.extract()
                                    new_p.append(child)
                            
                            if len(new_p.contents) > 0:
                                p.insert_after(new_p)
                
                # Check if remaining text is descriptive (not a statblock label)
                elif not any(re.match(re.escape(label) + r':?\s*', remaining_text, re.IGNORECASE) for label in STATBLOCK_LABELS):
                    # This is descriptive text - split it
                    # Find where Advancement ends
                    children = list(p.children)
                    split_index = None
                    found_advancement_value = False
                    
                    for i, child in enumerate(children):
                        child_text = child.get_text(strip=True) if hasattr(child, 'get_text') else str(child).strip()
                        
                        if 'Advancement' in child_text:
                            found_advancement_value = True
                            # Find the end of the Advancement value
                            # Usually it's a span with the value, followed by descriptive text
                            continue
                        
                        if found_advancement_value:
                            # Check if this is descriptive text (italic or substantial text)
                            if isinstance(child, Tag):
                                style = child.get('style', '')
                                if 'font-style:italic' in style or len(child_text) > 30:
                                    split_index = i
                                    break
                            elif len(child_text) > 30:
                                split_index = i
                                break
                    
                    if split_index is not None:
                        # Create new paragraph starting at split_index
                        new_p = soup.new_tag('p')
                        for child in children[split_index:]:
                            new_p.append(child.extract())
                        
                        if len(new_p.contents) > 0:
                            p.insert_after(new_p)
    
    # Ensure paragraph break after "Level Adjustment" before descriptive text
    # Split paragraphs that contain "Level Adjustment" followed by descriptive text
    paragraphs = list(element.find_all('p'))
    
    for p in paragraphs:
        if p.find_parent('table'):
            continue
        
        text = p.get_text(strip=True)
        
        # Check if this paragraph contains "Level Adjustment" followed by descriptive text
        # Pattern: "Level Adjustment: [value]" followed by text that's not a statblock label
        level_adj_match = re.search(r'Level Adjustment:?\s*[^\n]*', text, re.IGNORECASE)
        if level_adj_match:
            # Find where "Level Adjustment" ends in the structure
            level_adj_end_pos = level_adj_match.end()
            
            # Check if there's content after Level Adjustment that looks like descriptive text
            remaining_text = text[level_adj_end_pos:].strip()
            if remaining_text:
                # Check if remaining text starts with a statblock label
                starts_with_label = False
                for label in STATBLOCK_LABELS:
                    pattern = re.escape(label) + r':?\s*'
                    if re.match(pattern, remaining_text, re.IGNORECASE):
                        starts_with_label = True
                        break
                
                # Check for ability labels
                starts_with_ability = bool(re.match(r'^[\w\s\-]+\([A-Za-z]+\):\s*', remaining_text))
                
                # If remaining text doesn't start with a label, it's descriptive text
                # Split the paragraph at this point
                if not starts_with_label and not starts_with_ability:
                    # Find where to split: after "Level Adjustment: [value]"
                    # Look for the first italic span (description) - that's where we split
                    children = list(p.children)
                    split_index = None
                    found_level_adj_span = False
                    
                    for i, child in enumerate(children):
                        # Check if this child contains the Level Adjustment label
                        if isinstance(child, Tag):
                            if child.find('span', style=lambda x: x and 'font-weight:bold' in x and 'Level Adjustment' in (x.find('span') or child).get_text() if x.find('span') else 'Level Adjustment' in child.get_text()):
                                found_level_adj_span = True
                                continue
                        
                        # After finding Level Adjustment, look for the value then descriptive content
                        if found_level_adj_span:
                            child_text = child.get_text(strip=True) if hasattr(child, 'get_text') else str(child).strip()
                            
                            # Skip the value (usually "--" or whitespace)
                            if re.match(r'^[-\d\s]*$', child_text) and len(child_text) <= 5:
                                continue
                            
                            # Check if this is an italic span (description) or substantial text
                            if isinstance(child, Tag) and child.get('style') and 'font-style:italic' in child.get('style', ''):
                                # Found italic description - split here
                                split_index = i
                                break
                            elif child_text and len(child_text) > 10:
                                # Substantial text content - split here
                                split_index = i
                                break
                    
                    # If we found a split point, create a new paragraph
                    if split_index is not None and split_index < len(children):
                        # Create new paragraph for descriptive text
                        new_p = soup.new_tag('p')
                        for child in children[split_index:]:
                            child.extract()
                            new_p.append(child)
                        
                        # Insert new paragraph after the original
                        p.insert_after(new_p)
    
    # Wrap italicized description blocks in <p> if they aren't already
    # Find italic spans that are direct children of the element (not in paragraphs)
    for span in list(element.find_all('span')):
        if span.find_parent('p') or span.find_parent('table'):
            continue
        
        if span.get('style') and 'font-style:italic' in span.get('style', ''):
            # This italic span is not in a paragraph - wrap it
            parent = span.parent
            if parent and parent != element:
                # Create a new paragraph
                new_p = soup.new_tag('p')
                span.extract()
                new_p.append(span)
                # Insert after the previous sibling or at the start
                if span.previous_sibling:
                    span.previous_sibling.insert_after(new_p)
                else:
                    parent.insert(0, new_p)


def _ensure_bold(element: Tag) -> None:
    """Ensure element content is bold."""
    # Check if already has bold styling
    style = element.get('style', '')
    if 'font-weight:bold' in style:
        return
    
    # Check if wrapped in b or strong
    if element.find(['b', 'strong']):
        return
    
    # Make it bold by adding style
    if style:
        # Add bold to existing style
        if 'font-weight:bold' not in style:
            element['style'] = style.rstrip(';') + '; font-weight:bold;'
    else:
        element['style'] = 'font-weight:bold;'


def _remove_bold(element: Tag) -> None:
    """Remove bold formatting from element and its descendants."""
    # Remove b and strong tags (unwrap them)
    for bold_tag in list(element.find_all(['b', 'strong'])):
        bold_tag.unwrap()
    
    # Remove bold from span styles
    for span in list(element.find_all('span')):
        style = span.get('style', '')
        if 'font-weight:bold' in style:
            # Remove bold from style
            new_style = re.sub(r'font-weight:\s*bold[;\s]*', '', style).strip()
            # Clean up semicolons
            new_style = re.sub(r';\s*;', ';', new_style)  # Remove double semicolons
            new_style = new_style.strip(';').strip()
            if new_style:
                span['style'] = new_style
            else:
                del span['style']
            # If span has no attributes left, unwrap it
            if not span.attrs:
                span.unwrap()
    
    # Also check the element itself
    style = element.get('style', '')
    if 'font-weight:bold' in style:
        new_style = re.sub(r'font-weight:\s*bold[;\s]*', '', style).strip()
        new_style = re.sub(r';\s*;', ';', new_style)
        new_style = new_style.strip(';').strip()
        if new_style:
            element['style'] = new_style
        else:
            del element['style']


def fix_spell_preparation_blocks(element: Tag) -> None:
    """
    Fix spell preparation blocks that were split by OCR.
    Merges split paragraphs/divs into a single paragraph and italicizes spell names.
    """
    logger = logging.getLogger(__name__)
    
    # Pattern to match "Typical XXX Spells Prepared" (where XXX can be Wizard, Cleric, Druid, etc.)
    spell_prep_pattern = re.compile(r'Typical\s+\w+\s+Spells\s+Prepared', re.IGNORECASE)
    
    # Get the soup object
    soup = element if isinstance(element, BeautifulSoup) else element.find_parent(BeautifulSoup) or BeautifulSoup('', 'html.parser')
    
    # Find all paragraphs and divs
    all_elements = list(element.find_all(['p', 'div']))
    
    i = 0
    while i < len(all_elements):
        elem = all_elements[i]
        text = elem.get_text(strip=True)
        
        # Check if this element starts a spell preparation block
        match = spell_prep_pattern.search(text)
        if match:
            # Skip if this is inside a table
            if elem.find_parent('table'):
                i += 1
                continue
            
            # Collect all content until we hit a clear break
            collected_elements = [elem]
            j = i + 1
            
            # Collect following elements until we hit a break
            while j < len(all_elements):
                next_elem = all_elements[j]
                next_text = next_elem.get_text(strip=True)
                
                # Stop if we hit a clear break:
                # - New heading (check if heading is a direct child or in the element itself)
                # - Table
                # - Statblock label (like "Hit Dice:", "Initiative:", etc.)
                # - Empty element
                # - Check if next_elem itself is a heading
                is_heading = isinstance(next_elem, Tag) and next_elem.name in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']
                has_heading = next_elem.find(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']) if isinstance(next_elem, Tag) else False
                has_table = next_elem.find('table') if isinstance(next_elem, Tag) else False
                is_statblock = any(next_text.startswith(label + ':') or next_text.startswith(label + ' ') 
                                  for label in STATBLOCK_LABELS)
                
                if is_heading or has_heading or has_table or is_statblock or not next_text:
                    break
                
                # Check if next element looks like continuation of spell block
                # Must contain spell slot patterns (like "4/6/5"), spell level markers (like "1st--"), 
                # or be part of a spell list (contains spell level markers or follows them)
                # Don't continue if it looks like a different section (starts with label, long prose, etc.)
                
                # Check for spell slot patterns or spell level markers first (strong indicators)
                has_spell_slots = bool(re.search(r'\d+/\d+', next_text))
                has_spell_levels = bool(re.search(r'\d+st--|\d+nd--|\d+rd--|\d+th--', next_text))
                
                # Check if it starts with a label (like "Possessions:", "Skills:", etc.) - stop immediately
                starts_with_label = bool(re.match(r'^[\w\s]+:\s*', next_text))
                
                # Check if it's a long prose paragraph (likely not part of spell block)
                # Spell blocks are typically short, technical lists
                is_long_prose = len(next_text) > 200 and not has_spell_slots and not has_spell_levels
                
                # Only continue if it has spell indicators and doesn't look like a new section
                if (has_spell_slots or has_spell_levels) and not starts_with_label and not is_long_prose:
                    collected_elements.append(next_elem)
                    j += 1
                else:
                    break
            
            # Get full text from all elements, removing duplicates
            full_text_parts = []
            seen_text = set()
            for e in collected_elements:
                text = e.get_text(separator=' ', strip=True)
                # Skip if we've seen this exact text before (handles duplicates)
                if text and text not in seen_text:
                    full_text_parts.append(text)
                    seen_text.add(text)
            
            full_text = ' '.join(full_text_parts)
            
            # Normalize whitespace: fix spacing issues
            # Fix spaces in spell slot list first: "(4 /6/5" -> "(4/6/5"
            full_text = re.sub(r'\((\d+)\s*/\s*(\d+)', r'(\1/\2', full_text)
            # Fix space before semicolon in spell slot list: "3 ; save" -> "3; save"
            # This needs to match the pattern: digits followed by semicolon and "save"
            full_text = re.sub(r'(\d+)\s*;\s*(save\s+DC)', r'\1; \2', full_text)
            # Remove spaces before commas/semicolons (but preserve space after semicolon if followed by word)
            full_text = re.sub(r'\s+([,;])', r'\1', full_text)
            # Add space after semicolons (if not already present)
            full_text = re.sub(r'([,;])([a-z0-9])', r'\1 \2', full_text)
            # Add space before opening parentheses (for spell counts like "(2)")
            full_text = re.sub(r'([a-z])\s*\(', r'\1 (', full_text)
            # Add space after double dashes (spell level markers)
            full_text = re.sub(r'--([a-z])', r'-- \1', full_text)
            # Normalize other whitespace (multiple spaces to single space)
            full_text = re.sub(r'\s+', ' ', full_text).strip()
            
            # Process the text to italicize "Typical XXX Spells Prepared" header only
            # Find the header
            match = spell_prep_pattern.search(full_text)
            if match:
                header_start = match.start()
                header_end = match.end()
                header = full_text[header_start:header_end]
                rest = full_text[header_end:].strip()
                
                # Create new paragraph
                new_p = soup.new_tag('p')
                
                # Add italicized header
                header_span = soup.new_tag('span', style='font-style:italic;')
                header_span.string = header
                new_p.append(header_span)
                
                # Add the rest as plain text (spell names are not italicized)
                new_p.append(NavigableString(rest))
                
                # Replace first element with new paragraph
                first_elem = collected_elements[0]
                
                # Debug: Check what's before and after the first element
                prev_sibling = first_elem.find_previous_sibling()
                next_sibling = first_elem.find_next_sibling()
                
                first_elem.replace_with(new_p)
                
                # Remove other collected elements
                for elem_to_remove in collected_elements[1:]:
                    if elem_to_remove in element.find_all(['p', 'div']):
                        elem_to_remove.decompose()
                
                # Update the list
                all_elements = list(element.find_all(['p', 'div']))
                
                # Find new position
                try:
                    i = all_elements.index(new_p)
                except ValueError:
                    i = j - len(collected_elements)
        
        i += 1


def clean_html(element: Tag) -> Tag:
    """
    Remove bookmarks, font classes, preserve formatting.
    Normalize whitespace characters.
    Clean up bold formatting.
    
    Modifies the element in place and returns it.
    """
    # Remove all bookmark anchors (a tags with name="bookmark...")
    for anchor in element.find_all('a', {'name': re.compile(r'bookmark\d+')}):
        anchor.decompose()
    
    # Remove all anchor tags with name attributes (bookmarks)
    for anchor in element.find_all('a', {'name': True}):
        anchor.decompose()
    
    # Remove font classes but preserve style attributes
    for tag in element.find_all(True):  # Find all tags
        if 'class' in tag.attrs:
            classes = tag.attrs['class']
            if isinstance(classes, list):
                # Remove font classes (font0-font26)
                new_classes = [c for c in classes if not re.match(r'^font\d+$', c)]
                if new_classes:
                    tag.attrs['class'] = new_classes
                else:
                    del tag.attrs['class']
            elif isinstance(classes, str):
                # Handle string class attribute
                if re.match(r'^font\d+$', classes):
                    del tag.attrs['class']
    
    # Normalize whitespace and convert non-ASCII characters to ASCII in all text nodes
    for text_node in element.find_all(string=True):
        if isinstance(text_node, NavigableString):
            # First normalize whitespace
            normalized = normalize_whitespace(str(text_node))
            # Then normalize to ASCII
            normalized = normalize_to_ascii(normalized)
            if normalized != str(text_node):
                text_node.replace_with(NavigableString(normalized))
    
    # Remove empty divs and br clear="all" that are just formatting
    for br in element.find_all('br', {'clear': 'all'}):
        br.decompose()
    
    # Remove empty divs (but keep those with meaningful content)
    for div in list(element.find_all('div')):
        # Check if div is empty or only contains whitespace
        text_content = div.get_text(strip=True)
        has_meaningful_content = div.find_all(['table', 'img', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'ul', 'ol', 'li'])
        if not text_content and not has_meaningful_content:
            # Unwrap the div (replace it with its contents)
            div.unwrap()
    
    # Clean up bold formatting (must be done after other cleaning)
    clean_bold_formatting(element)
    
    # Fix spell preparation blocks (must be done after bold cleaning)
    fix_spell_preparation_blocks(element)
    
    return element


def normalize_filename(name: str) -> str:
    """Convert monster name to safe lowercase filename."""
    # Convert to lowercase
    name = name.lower()
    # Replace spaces and special characters with hyphens
    name = re.sub(r'[^\w\s-]', '', name)
    name = re.sub(r'[-\s]+', '-', name)
    # Remove leading/trailing hyphens
    name = name.strip('-')
    return name


def write_monster_file(name: str, content: Tag, output_dir: Path) -> None:
    """Write cleaned HTML to file."""
    # Clean the content
    cleaned = clean_html(content)
    
    # Normalize table cell text: remove newlines from all table cells
    for table in cleaned.find_all('table'):
        for cell in table.find_all(['td', 'th']):
            # Get all text nodes in the cell
            text_nodes = []
            for descendant in cell.descendants:
                if isinstance(descendant, NavigableString):
                    text_nodes.append(descendant)
            
            # Normalize each text node
            for text_node in text_nodes:
                if text_node.parent is None:
                    continue
                text = str(text_node)
                # Replace newlines, carriage returns, tabs with space, then collapse whitespace
                normalized = re.sub(r'[\n\r\t]+', ' ', text)
                normalized = re.sub(r'\s+', ' ', normalized)
                normalized = normalized.strip()
                if normalized != text:
                    try:
                        text_node.replace_with(NavigableString(normalized))
                    except (ValueError, AttributeError):
                        pass
    
    # Normalize the title to ASCII
    normalized_title = normalize_to_ascii(name)
    
    # Create HTML structure
    html_content = cleaned.prettify()
    
    # Post-process to remove newlines within table cells (prettify adds formatting newlines)
    # Match table cells and replace newlines in their content with spaces
    def remove_newlines_in_cell(match):
        tag = match.group(1)  # 'td' or 'th'
        attrs = match.group(2)  # attributes
        content = match.group(3)  # cell content
        # Replace newlines and carriage returns with spaces, collapse whitespace
        normalized = re.sub(r'[\n\r]+', ' ', content)
        normalized = re.sub(r'[ \t]+', ' ', normalized)
        normalized = normalized.strip()
        return f'<{tag}{attrs}>{normalized}</{tag}>'
    
    # Match table cells: <td...>content</td> or <th...>content</th>
    # Use DOTALL to match across newlines, but be careful with nested tags
    # This regex matches the opening tag, content (including nested tags), and closing tag
    html_content = re.sub(r'<([th]d)([^>]*)>((?:[^<]|<(?!/\1>))*?)</\1>', 
                         remove_newlines_in_cell, html_content, flags=re.DOTALL)
    
    # Post-process to remove spaces before punctuation in spell preparation blocks
    # Remove ALL whitespace (including newlines, spaces, tabs) before commas, semicolons, and periods
    # that come after closing </span> tags
    html_content = re.sub(r'</span>[\s\n\r\t]+([,;.])', r'</span>\1', html_content)
    # Also handle cases with parentheses: </span> (N) should become </span>(N)
    html_content = re.sub(r'</span>[\s\n\r\t]+\(', r'</span>(', html_content)
    
    html_doc = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{normalized_title}</title>
</head>
<body>
{html_content}
</body>
</html>"""
    
    # Normalize filename
    filename = normalize_filename(name)
    if not filename:
        filename = 'unnamed-monster'
    
    # Use the normalized filename (overwrite if exists)
    filepath = output_dir / f"{filename}.html"
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(html_doc)
    
    print(f"Extracted: {name} -> {filepath.name}")


def extract_chapter_content(soup: BeautifulSoup, start_tag: Optional[Tag], end_tag: Optional[Tag]) -> Optional[Tag]:
    """Extract chapter content between start and end tags."""
    if not start_tag:
        return None
    
    container = soup.new_tag('div')
    
    # Get chapter name for duplicate detection
    chapter_name = start_tag.get_text(strip=True)
    
    # Include the starting tag (create a copy)
    container.append(copy_element(start_tag))
    
    # Track processed elements and their content to detect duplicates
    processed_elements = set()  # Track original elements we've processed
    added_text_contents = set()  # Track text content we've already added
    
    # Skip duplicate span that may appear right after the heading
    current = start_tag.find_next()
    while current and current != end_tag:
        # Stop if we hit a chapter boundary
        if isinstance(current, Tag) and current.name == 'h1' and current != start_tag:
            break
        
        # Skip if this element is a descendant of an element we've already processed
        is_descendant_of_processed = False
        for processed_elem in processed_elements:
            if isinstance(current, Tag) and current in processed_elem.descendants:
                is_descendant_of_processed = True
                break
        
        if is_descendant_of_processed:
            current = current.find_next()
            continue
        
        # Skip duplicate span that matches the chapter name
        if isinstance(current, Tag) and current.name == 'span':
            current_text = current.get_text(strip=True)
            if current_text == chapter_name:
                # Duplicate chapter name, skip it
                current = current.find_next()
                continue
        
        # Check for duplicate content
        if isinstance(current, Tag):
            current_text = current.get_text(strip=True)
            
            # For spans, check if their content is within a parent we just processed
            if current.name == 'span' and current_text:
                parent = current.parent
                while parent and parent != container and parent != start_tag:
                    if parent in processed_elements:
                        # This span is inside a parent we already processed, skip it
                        current = current.find_next()
                        break
                    parent = parent.parent
                else:
                    # Not inside a processed parent, continue to add
                    pass
                if parent and parent in processed_elements:
                    continue
            
            # Skip if this element's text content is already in the container
            if current_text and current_text in added_text_contents:
                # For spans and paragraphs, skip if duplicate
                if current.name in ['span', 'p']:
                    current = current.find_next()
                    continue
                # For divs, only skip if they don't contain tables
                elif current.name == 'div' and not current.find('table'):
                    current = current.find_next()
                    continue
            
            # Copy the element
            next_sibling = current.find_next()
            copied = copy_element(current)
            if copied:
                container.append(copied)
                processed_elements.add(current)  # Track the original element
                if current_text:
                    added_text_contents.add(current_text)
            
            current = next_sibling
        elif isinstance(current, NavigableString):
            text = str(current).strip()
            if text and text not in added_text_contents:
                container.append(NavigableString(text))
                added_text_contents.add(text)
            
            current = current.find_next()
        else:
            current = current.find_next()
    
    return container


def write_chapter_file(name: str, content: Tag, output_dir: Path) -> None:
    """Write chapter HTML to file."""
    # Clean the content
    cleaned = clean_html(content)
    
    # Normalize the title to ASCII
    normalized_title = normalize_to_ascii(name)
    
    # Create HTML structure
    html_content = cleaned.prettify()
    
    # Post-process to remove spaces before punctuation in spell preparation blocks
    # Remove ALL whitespace (including newlines, spaces, tabs) before commas, semicolons, and periods
    # that come after closing </span> tags
    html_content = re.sub(r'</span>[\s\n\r\t]+([,;.])', r'</span>\1', html_content)
    # Also handle cases with parentheses: </span> (N) should become </span>(N)
    html_content = re.sub(r'</span>[\s\n\r\t]+\(', r'</span>(', html_content)
    
    html_doc = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{normalized_title}</title>
</head>
<body>
{html_content}
</body>
</html>"""
    
    filename = f"{name.lower().replace(' ', '_')}.html"
    filepath = output_dir / filename
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(html_doc)
    
    print(f"Extracted chapter: {name} -> {filename}")


def main():
    """Main extraction function."""
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Extract monsters from Monster Manual HTML')
    parser.add_argument('--monster', '-m', type=str, help='Extract only the specified monster (case-insensitive)')
    parser.add_argument('--debug', '-d', action='store_true', help='Enable debug logging')
    args = parser.parse_args()
    
    # Set up logging
    if args.debug:
        logging.basicConfig(level=logging.DEBUG, format='%(levelname)s: %(message)s')
    else:
        logging.basicConfig(level=logging.INFO, format='%(message)s')
    
    logger = logging.getLogger(__name__)
    
    # Reset global tracking for unhandled non-ASCII characters
    global _unhandled_non_ascii
    _unhandled_non_ascii.clear()
    
    # Get input file path
    script_dir = Path(__file__).parent
    input_file = script_dir.parent / 'cache' / 'html' / 'mm.html'
    
    if not input_file.exists():
        print(f"Error: Input file not found: {input_file}")
        sys.exit(1)
    
    # Create output directories
    output_dir = script_dir / 'output'
    monsters_dir = output_dir / 'monsters'
    monsters_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"Parsing HTML file: {input_file}")
    soup = parse_html(str(input_file))
    
    print("Identifying chapters...")
    chapters = identify_chapters(soup)
    
    # Extract monsters from Chapter 1
    print("\nExtracting monsters from Chapter 1...")
    if chapters['chapter1'] and chapters['chapter2']:
        # Pass the filter to extract_monster_entries so it only extracts the requested monster
        monster_filter = args.monster if args.monster else None
        monsters = extract_monster_entries(soup, chapters['chapter1'], chapters['chapter2'], monster_filter=monster_filter)
        
        if args.monster:
            if not monsters:
                # Try to get a list of available monsters for the error message
                # We need to find headings without extracting content
                all_headings = []
                current = chapters['chapter1']
                while current:
                    current = current.find_next(['h2', 'h3', 'h4', 'p'])
                    if not current or current == chapters['chapter2']:
                        break
                    if is_monster_heading(current):
                        heading_text = current.get_text(strip=True)
                        all_headings.append(heading_text)
                        if len(all_headings) >= 10:
                            break
                
                print(f"Error: Monster '{args.monster}' not found in Chapter 1")
                if all_headings:
                    print(f"Available monsters (first 10): {', '.join(all_headings)}")
                sys.exit(1)
            print(f"Extracted 1 monster matching '{args.monster}'")
        else:
            print(f"Found {len(monsters)} monsters in Chapter 1")
        
        for name, content in monsters:
            write_monster_file(name, content, monsters_dir)
    
    # Extract monsters from Chapter 2 (Animals) - only if not filtering to specific monster
    if not args.monster:
        print("\nExtracting monsters from Chapter 2 (Animals)...")
        if chapters['chapter2'] and chapters['chapter3']:
            monsters = extract_monster_entries(soup, chapters['chapter2'], chapters['chapter3'])
            print(f"Found {len(monsters)} monsters in Chapter 2")
            for name, content in monsters:
                write_monster_file(name, content, monsters_dir)
        
        # Extract monsters from Chapter 3 (Vermin)
        print("\nExtracting monsters from Chapter 3 (Vermin)...")
        if chapters['chapter3'] and chapters['chapter4']:
            monsters = extract_monster_entries(soup, chapters['chapter3'], chapters['chapter4'])
            print(f"Found {len(monsters)} monsters in Chapter 3")
            for name, content in monsters:
                write_monster_file(name, content, monsters_dir)
    
    # Extract special chapters - only if not filtering to specific monster
    if not args.monster:
        print("\nExtracting special chapters...")
        
        # Chapter 4: Improving Monsters
        if chapters['chapter4'] and chapters['chapter5']:
            content = extract_chapter_content(soup, chapters['chapter4'], chapters['chapter5'])
            if content:
                write_chapter_file('Improving Monsters', content, output_dir)
        
        # Chapter 5: Making Monsters
        if chapters['chapter5'] and chapters['chapter6']:
            content = extract_chapter_content(soup, chapters['chapter5'], chapters['chapter6'])
            if content:
                write_chapter_file('Making Monsters', content, output_dir)
        
        # Chapter 6: Monster Skills and Feats
        if chapters['chapter6'] and chapters['chapter7']:
            content = extract_chapter_content(soup, chapters['chapter6'], chapters['chapter7'])
            if content:
                write_chapter_file('Monster Skills and Feats', content, output_dir)
        
        # Chapter 7: Glossary
        if chapters['chapter7']:
            # Find the end of the document
            last_tag = soup.find_all()[-1] if soup.find_all() else None
            content = extract_chapter_content(soup, chapters['chapter7'], last_tag)
            if content:
                write_chapter_file('Glossary', content, output_dir)
    
    print("\nExtraction complete!")
    
    # Report any unhandled non-ASCII characters
    report_unhandled_non_ascii()


def report_unhandled_non_ascii() -> None:
    """Report any unhandled non-ASCII characters encountered during processing."""
    if not _unhandled_non_ascii:
        print("\n✓ All characters successfully converted to ASCII")
        return
    
    print(f"\n⚠️  Found {len(_unhandled_non_ascii)} unhandled non-ASCII character(s):")
    print("=" * 80)
    
    # Sort by Unicode code point for easier review
    sorted_chars = sorted(_unhandled_non_ascii.items(), key=lambda x: int(x[0][1].replace('U+', ''), 16))
    
    for (char, unicode_code), contexts in sorted_chars:
        char_name = unicodedata.name(char, 'UNNAMED')
        print(f"\nCharacter: '{char}' ({unicode_code}) - {char_name}")
        print(f"  Occurrences: {len(contexts)} example(s)")
        print("  Context examples:")
        for i, context in enumerate(contexts, 1):
            # Highlight the character in context
            highlighted = context.replace(char, f"[{char}]")
            print(f"    {i}. ...{highlighted}...")
    
    print("\n" + "=" * 80)
    print("Please add appropriate replacements for these characters in normalize_to_ascii()")
    print("=" * 80)


if __name__ == '__main__':
    main()

