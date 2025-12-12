#!/usr/bin/env python3
"""
HTML to Plain Text Converter for Monster Documents

Converts HTML monster documents to plain text format, preserving paragraph
structure and ensuring labels start on new lines.

Usage:
    python3 html_to_text.py [--input-dir DIR] [--output-dir DIR] [--file FILE] [--all]
"""

import argparse
import logging
import re
import sys
from pathlib import Path
from typing import Optional, Set

try:
    from bs4 import BeautifulSoup, Tag, NavigableString
except ImportError:
    print("Error: beautifulsoup4 is required. Install it with: pip install beautifulsoup4")
    sys.exit(1)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Statblock labels (from import_monsters.py)
STATBLOCK_LABELS_ORDERED = [
    'Hit Dice', 'Initiative', 'Speed', 'Armor Class', 'Base Attack/Grapple',
    'Attack', 'Full Attack', 'Space/Reach', 'Special Attacks', 'Special Qualities',
    'Saves', 'Abilities', 'Skills', 'Feats', 'Environment', 'Organization',
    'Challenge Rating', 'Treasure', 'Alignment', 'Advancement', 'Level Adjustment'
]

STATBLOCK_LABELS = set(STATBLOCK_LABELS_ORDERED)

# Pattern for special ability labels: "Name (Ex):", "Name (Su):", "Name (Sp):"
SPECIAL_ABILITY_PATTERN = re.compile(r'^\s*\w+.*?\s*\([ES][xp]\)\s*:\s*$', re.IGNORECASE)


def is_statblock_label(text: str) -> bool:
    """Check if text is a statblock label."""
    text = text.strip().rstrip(':').strip()
    return text in STATBLOCK_LABELS


def is_special_ability_label(text: str) -> bool:
    """Check if text matches special ability label pattern."""
    text = text.strip()
    return bool(SPECIAL_ABILITY_PATTERN.match(text))


def is_label(text: str) -> bool:
    """Check if text is any kind of label (statblock or special ability)."""
    return is_statblock_label(text) or is_special_ability_label(text)


def detect_label(text: str) -> bool:
    """Check if text is a statblock label or special ability label."""
    return is_label(text)


def is_bold_element(element: Tag) -> bool:
    """Check if element is bold (has font-weight:bold style or is a bold tag)."""
    if element.name in ['b', 'strong']:
        return True
    
    style = element.get('style', '')
    if style and 'font-weight:bold' in style.lower():
        return True
    
    return False


def get_text_from_element(element: Tag) -> str:
    """Extract text from element, handling nested elements."""
    if isinstance(element, NavigableString):
        return str(element)
    
    text_parts = []
    for child in element.children:
        if isinstance(child, NavigableString):
            text_parts.append(str(child))
        elif isinstance(child, Tag):
            text_parts.append(get_text_from_element(child))
    
    return ' '.join(text_parts)


def is_statblock_table(table: Tag) -> bool:
    """Check if a table is a statblock table (has statblock labels in first column)."""
    rows = table.find_all('tr')
    if len(rows) < 2:
        return False
    
    # Check if any row has a statblock label in the first cell
    for row in rows[1:]:  # Skip header row
        cells = row.find_all(['td', 'th'])
        if cells:
            first_cell_text = get_text_from_element(cells[0]).strip().rstrip(':').strip()
            if is_statblock_label(first_cell_text):
                return True
    
    return False


def process_table(table: Tag) -> str:
    """
    Convert HTML table to plain text format.
    If it's a statblock table, convert to inline statblock format.
    """
    # Check if this is a statblock table
    if is_statblock_table(table):
        return process_statblock_table(table)
    
    # Regular table processing
    lines = []
    rows = table.find_all('tr')
    
    for row in rows:
        cells = row.find_all(['td', 'th'])
        if not cells:
            continue
        
        row_parts = []
        for cell in cells:
            cell_text = get_text_from_element(cell).strip()
            row_parts.append(cell_text)
        
        if row_parts:
            row_text = ' | '.join(row_parts)
            lines.append(row_text)
    
    return '\n'.join(lines) + '\n\n'


def process_statblock_table(table: Tag) -> str:
    """
    Convert statblock table to inline statblock format.
    Each variant gets its own inline statblock.
    """
    rows = table.find_all('tr')
    if not rows:
        return ''
    
    # Extract variant names from header row
    header_row = rows[0]
    header_cells = header_row.find_all(['td', 'th'])
    
    # Find which columns contain variant names (skip first column if empty)
    variant_columns = []
    variant_names = []
    
    for i, cell in enumerate(header_cells):
        cell_text = get_text_from_element(cell).strip()
        # Skip empty first column
        if i == 0 and not cell_text:
            continue
        if cell_text and not is_statblock_label(cell_text.rstrip(':')):
            variant_columns.append(i)
            variant_names.append(cell_text)
    
    if not variant_columns:
        # Fallback: treat all columns after first as variants
        for i in range(1, len(header_cells)):
            variant_columns.append(i)
            variant_names.append(f"Variant {i}")
    
    # Extract type lines if present (check second row, or first row if it has type info)
    type_lines = {}
    size_keywords = ['Fine', 'Diminutive', 'Tiny', 'Small', 'Medium', 
                     'Large', 'Huge', 'Gargantuan', 'Colossal']
    
    # Check second row for type lines
    if len(rows) > 1:
        type_row = rows[1]
        type_cells = type_row.find_all(['td', 'th'])
        
        # Check if first cell is empty (indicates this is a type line row)
        first_cell_text = get_text_from_element(type_cells[0]).strip() if type_cells else ''
        is_type_row = not first_cell_text or not is_statblock_label(first_cell_text.rstrip(':'))
        
        if is_type_row:
            for i, col_idx in enumerate(variant_columns):
                if col_idx < len(type_cells):
                    type_text = get_text_from_element(type_cells[col_idx]).strip()
                    # Check if it looks like a type line (contains size keywords)
                    if any(size in type_text for size in size_keywords):
                        type_lines[i] = type_text
    
    # Determine start row for data (skip header and type line rows)
    start_row = 2 if type_lines else 1
    
    # Build statblocks for each variant
    statblocks = []
    
    for variant_idx, variant_name in enumerate(variant_names):
        statblock_lines = []
        
        # Add variant name as heading
        if variant_name:
            statblock_lines.append(f"\n{variant_name}")
        
        # Add type line if present
        if variant_idx in type_lines:
            statblock_lines.append(f"{type_lines[variant_idx]}")
        
        # Process data rows
        for row in rows[start_row:]:
            cells = row.find_all(['td', 'th'])
            if not cells:
                continue
            
            # Get label from first cell
            label_cell = cells[0]
            label_text = get_text_from_element(label_cell).strip().rstrip(':').strip()
            
            # Check if this is a statblock label
            if not is_statblock_label(label_text):
                continue
            
            # Get value for this variant's column
            col_idx = variant_columns[variant_idx]
            if col_idx < len(cells):
                value_cell = cells[col_idx]
                value_text = get_text_from_element(value_cell).strip()
                
                # Format as inline statblock: label on one line, value on next
                statblock_lines.append(f"{label_text}:")
                statblock_lines.append(f"{value_text}")
        
        if statblock_lines:
            statblocks.append('\n'.join(statblock_lines))
    
    # Join all statblocks with double newline
    return '\n\n'.join(statblocks) + '\n\n'


def process_element(element: Tag, in_paragraph: bool = False) -> str:
    """
    Recursively process HTML elements, handling paragraphs and labels.
    
    Args:
        element: BeautifulSoup Tag element
        in_paragraph: Whether we're currently inside a paragraph
    
    Returns:
        Processed text with appropriate line breaks
    """
    if isinstance(element, NavigableString):
        text = str(element).strip()
        return text if text else ''
    
    result_parts = []
    element_name = element.name.lower() if element.name else ''
    
    # Handle paragraphs
    if element_name == 'p':
        # Process children and check for labels
        children_text = []
        has_label_at_start = False
        
        for i, child in enumerate(element.children):
            if isinstance(child, Tag):
                # Check if this is a bold span that's a label
                if child.name == 'span' and is_bold_element(child):
                    span_text = get_text_from_element(child).strip()
                    if span_text and is_label(span_text):
                        # This is a label - if it's the first significant content, mark it
                        prev_text = ''.join(children_text).strip()
                        if not prev_text:
                            has_label_at_start = True
                        # Add newline before label if there's previous content
                        if prev_text:
                            children_text.append('\n')
                        children_text.append(span_text + ' ')
                        continue
                
                # Process other children normally
                child_text = process_element(child, in_paragraph=True)
                if child_text:
                    children_text.append(child_text)
            elif isinstance(child, NavigableString):
                text = str(child).strip()
                if text:
                    children_text.append(text)
        
        paragraph_text = ''.join(children_text).strip()
        if paragraph_text:
            # If paragraph starts with a label, ensure it's on a new line
            if has_label_at_start:
                result_parts.append('\n' + paragraph_text)
            else:
                result_parts.append(paragraph_text)
            result_parts.append('\n\n')
        return ''.join(result_parts)
    
    # Handle headings
    if element_name in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
        heading_text = get_text_from_element(element).strip()
        if heading_text:
            result_parts.append('\n' + heading_text + '\n\n')
        return ''.join(result_parts)
    
    # Handle tables
    if element_name == 'table':
        return process_table(element)
    
    # Handle line breaks
    if element_name == 'br':
        return '\n'
    
    # Handle lists
    if element_name in ['ul', 'ol']:
        list_items = element.find_all('li', recursive=False)
        list_text = []
        for item in list_items:
            item_text = get_text_from_element(item).strip()
            if item_text:
                list_text.append('  - ' + item_text)
        if list_text:
            result_parts.append('\n' + '\n'.join(list_text) + '\n\n')
        return ''.join(result_parts)
    
    # Handle divs with special classes
    if element_name == 'div':
        class_name = element.get('class', [])
        if isinstance(class_name, list):
            class_name = ' '.join(class_name)
        
        # Check for statblock labels
        if 'statblock-label' in class_name:
            label_text = get_text_from_element(element).strip()
            if label_text:
                return '\n' + label_text + ' '
        
        # Check for special ability names
        if 'special-ability-name' in class_name:
            label_text = get_text_from_element(element).strip()
            if label_text:
                return '\n' + label_text + ' '
        
        # Check for statblock values
        if 'statblock-value' in class_name:
            value_text = get_text_from_element(element).strip()
            if value_text:
                return value_text + '\n'
    
    # Handle bold spans that might be labels
    # Note: This is handled in paragraph processing, but keep for other contexts
    if element_name == 'span' and is_bold_element(element):
        span_text = get_text_from_element(element).strip()
        if span_text and is_label(span_text):
            # This is a label - ensure it starts on new line
            # But don't add newline if we're already in a paragraph (handled there)
            if not in_paragraph:
                return '\n' + span_text + ' '
            else:
                return span_text + ' '
    
    # Process children recursively
    for child in element.children:
        if isinstance(child, NavigableString):
            text = str(child).strip()
            if text:
                result_parts.append(text)
        elif isinstance(child, Tag):
            child_text = process_element(child, in_paragraph=in_paragraph)
            if child_text:
                result_parts.append(child_text)
    
    # Join parts with spaces if in paragraph, otherwise return as-is
    if in_paragraph:
        return ' '.join(result_parts)
    else:
        return ''.join(result_parts)


def normalize_text(text: str) -> str:
    """
    Clean up whitespace and formatting.
    
    - Collapse multiple consecutive spaces to single space
    - Preserve line breaks from <p> tags
    - Preserve line breaks before labels
    - Remove trailing whitespace from lines
    - Remove empty lines at start/end of document
    - Normalize line endings (use \n)
    """
    # Normalize line endings
    text = text.replace('\r\n', '\n').replace('\r', '\n')
    
    # Split into lines for processing
    lines = text.split('\n')
    normalized_lines = []
    
    for line in lines:
        # Collapse multiple spaces to single space (but preserve intentional structure)
        line = re.sub(r' +', ' ', line)
        # Remove trailing whitespace
        line = line.rstrip()
        normalized_lines.append(line)
    
    # Remove empty lines at start
    while normalized_lines and not normalized_lines[0].strip():
        normalized_lines.pop(0)
    
    # Remove empty lines at end
    while normalized_lines and not normalized_lines[-1].strip():
        normalized_lines.pop()
    
    # Join lines back together
    text = '\n'.join(normalized_lines)
    
    # Ensure labels start on new lines (post-process)
    # Look for labels that might not be on their own line
    lines = text.split('\n')
    final_lines = []
    
    for i, line in enumerate(lines):
        line = line.strip()
        if not line:
            final_lines.append('')
            continue
        
        # Check if line starts with a label
        # Look for pattern: "Label:" at start of line or after some text
        label_match = re.match(r'^(.+?):\s*(.*)$', line)
        if label_match:
            potential_label = label_match.group(1).strip()
            rest = label_match.group(2).strip()
            
            # Check if this is a known label
            if is_label(potential_label + ':'):
                # Ensure it's on its own line
                if final_lines and final_lines[-1].strip():
                    final_lines.append('')
                final_lines.append(line)
                continue
        
        # Check if line contains a label in the middle
        # Pattern: "text Label: value"
        label_in_middle = re.search(r'(\w+\s*\([ES][xp]\)\s*:|\b(?:' + 
                                    '|'.join(re.escape(label) for label in STATBLOCK_LABELS) + 
                                    r')\s*:)', line, re.IGNORECASE)
        if label_in_middle:
            # Split at the label
            label_pos = label_in_middle.start()
            before_label = line[:label_pos].rstrip()
            after_label = line[label_pos:].strip()
            
            if before_label:
                final_lines.append(before_label)
            if after_label:
                final_lines.append(after_label)
            continue
        
        final_lines.append(line)
    
    # Join and clean up excessive blank lines (max 2 consecutive)
    text = '\n'.join(final_lines)
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    return text


def convert_html_to_text(html_path: Path, output_path: Path) -> None:
    """
    Main conversion function.
    
    Args:
        html_path: Path to input HTML file
        output_path: Path to output text file
    """
    try:
        logger.info(f"Processing: {html_path.name}")
        
        # Read HTML file
        with open(html_path, 'r', encoding='utf-8') as f:
            html_content = f.read()
        
        # Parse HTML
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Remove script and style elements
        for script in soup(['script', 'style']):
            script.decompose()
        
        # Get body content (or entire document if no body)
        body = soup.find('body')
        if body:
            content = body
        else:
            content = soup
        
        # Process elements
        text = process_element(content)
        
        # Normalize text
        text = normalize_text(text)
        
        # Write output
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(text)
        
        logger.info(f"✓ Converted: {html_path.name} -> {output_path.name}")
    
    except Exception as e:
        logger.error(f"✗ Error processing {html_path.name}: {e}", exc_info=True)
        raise


def main():
    """Main function."""
    parser = argparse.ArgumentParser(
        description='Convert HTML monster documents to plain text',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Convert all HTML files
  python3 html_to_text.py --all
  
  # Convert single file
  python3 html_to_text.py --file animated-object.html
  
  # Specify custom directories
  python3 html_to_text.py --all --input-dir ./monsters --output-dir ./text
        """
    )
    parser.add_argument('--input-dir', type=str, 
                       default='output/monsters',
                       help='Input directory containing HTML files (default: output/monsters)')
    parser.add_argument('--output-dir', type=str, 
                       default=None,
                       help='Output directory for text files (default: same as input-dir, or input-dir/text/)')
    parser.add_argument('--file', type=str,
                       help='Process single HTML file by name')
    parser.add_argument('--all', action='store_true',
                       help='Process all HTML files in input directory')
    
    args = parser.parse_args()
    
    # Validate arguments
    if not args.file and not args.all:
        parser.error("Either --file or --all must be specified")
    
    if args.file and args.all:
        parser.error("Cannot specify both --file and --all")
    
    # Setup paths
    script_dir = Path(__file__).parent
    input_dir = script_dir / args.input_dir
    
    if not input_dir.exists():
        logger.error(f"Input directory not found: {input_dir}")
        sys.exit(1)
    
    # Determine output directory
    if args.output_dir:
        output_dir = script_dir / args.output_dir
    else:
        # Default: create text/ subdirectory in input directory
        output_dir = input_dir / 'text'
    
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Get list of HTML files
    html_files = list(input_dir.glob('*.html'))
    
    if args.file:
        # Filter by file name
        matching_files = [f for f in html_files if args.file.lower() in f.name.lower()]
        if not matching_files:
            logger.error(f"No HTML files found matching '{args.file}'")
            sys.exit(1)
        html_files = matching_files
        logger.info(f"Found {len(html_files)} file(s) matching '{args.file}'")
    elif args.all:
        logger.info(f"Found {len(html_files)} HTML file(s) to process")
    
    # Process files
    success_count = 0
    error_count = 0
    errors = []
    
    for html_file in sorted(html_files):
        try:
            # Determine output path
            output_file = output_dir / (html_file.stem + '.txt')
            
            convert_html_to_text(html_file, output_file)
            success_count += 1
        except Exception as e:
            error_count += 1
            errors.append((html_file.name, str(e)))
    
    # Print summary
    logger.info("")
    logger.info("=" * 60)
    logger.info("CONVERSION SUMMARY")
    logger.info("=" * 60)
    logger.info(f"Total files processed: {len(html_files)}")
    logger.info(f"✓ Successful: {success_count}")
    logger.info(f"✗ Failed: {error_count}")
    
    if errors:
        logger.info("")
        logger.info("ERRORS:")
        for filename, error_msg in errors:
            logger.info(f"  {filename}: {error_msg}")
    
    if error_count > 0:
        sys.exit(1)


if __name__ == '__main__':
    main()

