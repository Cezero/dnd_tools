#!/usr/bin/env python3
"""
Clean Content Extractor for D20SRD HTML files
Based on HTML structure analysis, extracts ONLY D&D rules content
"""

import os
import sys
from bs4 import BeautifulSoup
from pathlib import Path

def extract_clean_content(html_content):
    """Extract only D&D rules content, removing all navigation/boilerplate"""
    
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Remove all navigation/boilerplate elements
    elements_to_remove = [
        # Site navigation and headers
        {'id': 'header'},
        {'id': 'path'}, 
        {'id': 'rollovermenu'},
        {'id': 'hd20srdMenu'},
        {'id': 'extrasMenu'},
        {'id': 'd20SystemMenu'},
        {'id': 'bolsMenu'},
        
        # Generic navigation patterns
        {'class': 'nav'},
        {'class': 'navigation'},
        {'class': 'menu'},
        {'class': 'sidebar'},
        {'class': 'footer'},
        
        # Common boilerplate tags
        'script',
        'style',
        'meta',
        'link'
    ]
    
    # Remove identified boilerplate elements
    for element_spec in elements_to_remove:
        if isinstance(element_spec, str):
            # Remove by tag name
            for element in soup.find_all(element_spec):
                element.decompose()
        else:
            # Remove by attributes
            for element in soup.find_all(attrs=element_spec):
                element.decompose()
    
    # Find the main content starting with H1
    h1_tag = soup.find('h1')
    if not h1_tag:
        return "ERROR: No H1 tag found - not a content page"
    
    # Extract content from H1 onwards, but also look for content before H1
    content_elements = []
    
    # Look for content elements before H1 that might be class info (like tables)
    for element in soup.find_all(['table'], limit=10):
        if element != h1_tag and element.find_previous('h1') is None:
            # This element comes before the H1, might be class table
            element_text = element.get_text(strip=True)
            if any(keyword in element_text.lower() for keyword in ['barbarian', 'table:', 'level']):
                content_elements.append(str(element))
    
    # Add the H1 title
    content_elements.append(str(h1_tag))
    
    # Get all siblings after H1 that are actual content
    current = h1_tag
    while current:
        current = current.next_sibling
        if current and hasattr(current, 'name') and current.name:
            # Keep content elements (headers, paragraphs, tables, lists)
            if current.name in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'table', 'ul', 'ol', 'div', 'blockquote']:
                # Check if this is actual content or navigation
                element_text = current.get_text(strip=True)
                element_id = current.get('id', '')
                element_class = ' '.join(current.get('class', []))
                
                # Skip navigation-like elements
                if any(nav_word in element_id.lower() for nav_word in ['menu', 'nav', 'header', 'footer']):
                    continue
                if any(nav_word in element_class.lower() for nav_word in ['menu', 'nav', 'header', 'footer']):
                    continue
                if any(nav_phrase in element_text.lower() for nav_phrase in ['home >', 'site search', 'community forum', 'd20srd', 'facebook']):
                    continue
                
                # Keep substantial content (headers can be short but important)
                if len(element_text) > 3 or current.name.startswith('h'):  # Keep headers regardless of length
                    content_elements.append(str(current))
    
    # Combine into clean HTML
    clean_html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>D&D 3.5 Rules Content</title>
</head>
<body>
    {''.join(content_elements)}
</body>
</html>"""
    
    return clean_html

def main():
    if len(sys.argv) != 2:
        print("Usage: python3 clean_content_extractor.py <input_file>")
        print("Example: python3 clean_content_extractor.py extracted-content/classes/srd_barbarian.html")
        return
    
    input_file = sys.argv[1]
    
    if not os.path.exists(input_file):
        print(f"Error: File {input_file} does not exist")
        return
    
    # Read input file
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            html_content = f.read()
    except Exception as e:
        print(f"Error reading {input_file}: {e}")
        return
    
    # Extract clean content
    try:
        clean_content = extract_clean_content(html_content)
        
        if clean_content.startswith("ERROR:"):
            print(f"❌ {input_file}: {clean_content}")
            return
        
        # Create output file
        output_file = input_file.replace('extracted-content/', 'final-clean-content/')
        output_dir = os.path.dirname(output_file)
        os.makedirs(output_dir, exist_ok=True)
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(clean_content)
        
        print(f"✅ {input_file} -> {output_file}")
        
    except Exception as e:
        print(f"❌ Error processing {input_file}: {e}")

if __name__ == "__main__":
    main()
