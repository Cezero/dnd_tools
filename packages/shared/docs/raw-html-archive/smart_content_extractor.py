#!/usr/bin/env python3
"""
Smart Content Extractor: Extract focused sections from HTML for AI-optimized markdown
Focus: 50-100 line files with clear topics that aid D&D tool development
"""

import os
import re
from pathlib import Path
from bs4 import BeautifulSoup
from collections import defaultdict

class SmartContentExtractor:
    def __init__(self):
        self.html_dir = Path('final-clean-content')
        self.markdown_dir = Path('../dnd-rules/v3.x')
        
    def extract_html_sections(self, html_file, section_keywords):
        """Extract specific sections from HTML based on keywords"""
        try:
            with open(html_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            soup = BeautifulSoup(content, 'html.parser')
            sections = {}
            
            # Find all headers (H1-H6)
            headers = soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
            
            for keyword in section_keywords:
                for header in headers:
                    header_text = header.get_text(strip=True).lower()
                    if keyword.lower() in header_text:
                        # Extract content from this header until next same-level header
                        section_content = self._extract_section_content(header)
                        if section_content:
                            sections[keyword] = {
                                'header': header.get_text(strip=True),
                                'content': section_content,
                                'html_length': len(section_content)
                            }
                        break
            
            return sections
        
        except Exception as e:
            print(f"Error extracting from {html_file}: {e}")
            return {}
    
    def _extract_section_content(self, start_header):
        """Extract content from header until next same-level header"""
        content_elements = []
        header_level = start_header.name
        
        # Add the starting header
        content_elements.append(str(start_header))
        
        # Get all following siblings until next same-level header
        current = start_header
        while current:
            current = current.next_sibling
            if current and hasattr(current, 'name'):
                # Stop if we hit a same-level or higher header
                if current.name and current.name <= header_level:
                    break
                
                # Include this element
                if current.name in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'table', 'blockquote', 'div']:
                    content_elements.append(str(current))
        
        return '\n'.join(content_elements)
    
    def html_to_markdown(self, html_content, topic_name):
        """Convert HTML section to clean markdown"""
        soup = BeautifulSoup(html_content, 'html.parser')
        
        markdown_lines = []
        
        for element in soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th']):
            if element.name.startswith('h'):
                # Headers
                level = int(element.name[1])
                header_text = element.get_text(strip=True)
                markdown_lines.append(f"{'#' * level} {header_text}")
                markdown_lines.append("")
                
            elif element.name == 'p':
                # Paragraphs
                text = element.get_text(strip=True)
                if text:
                    # Convert links
                    text = self._convert_links(text, element)
                    markdown_lines.append(text)
                    markdown_lines.append("")
                    
            elif element.name in ['ul', 'ol']:
                # Lists (process separately to avoid duplication)
                if not element.find_parent(['ul', 'ol']):  # Top-level lists only
                    list_items = element.find_all('li', recursive=False)
                    for li in list_items:
                        li_text = li.get_text(strip=True)
                        if li_text:
                            markdown_lines.append(f"- {li_text}")
                    markdown_lines.append("")
                    
            elif element.name == 'table':
                # Tables (simplified)
                markdown_lines.append("| Column | Column |")
                markdown_lines.append("|--------|--------|")
                rows = element.find_all('tr')
                for row in rows:
                    cells = row.find_all(['td', 'th'])
                    if cells:
                        row_text = " | ".join(cell.get_text(strip=True) for cell in cells)
                        markdown_lines.append(f"| {row_text} |")
                markdown_lines.append("")
        
        # Clean up multiple empty lines
        cleaned_lines = []
        last_empty = False
        for line in markdown_lines:
            if line.strip() == "":
                if not last_empty:
                    cleaned_lines.append("")
                last_empty = True
            else:
                cleaned_lines.append(line)
                last_empty = False
        
        # Limit to ~100 lines
        if len(cleaned_lines) > 100:
            cleaned_lines = cleaned_lines[:95]
            cleaned_lines.append("")
            cleaned_lines.append("*[Content continues...]*")
        
        return '\n'.join(cleaned_lines)
    
    def _convert_links(self, text, element):
        """Convert HTML links to markdown format"""
        # Simple link conversion - this could be enhanced
        links = element.find_all('a')
        for link in links:
            href = link.get('href', '#')
            link_text = link.get_text()
            if link_text and href:
                text = text.replace(link_text, f"[{link_text}]({href})")
        return text
    
    def extract_special_abilities(self):
        """Extract Special Abilities sections for AI-optimized files"""
        html_file = self.html_dir / 'general' / 'srd_specialAbilities.htm_extracted.html'
        
        if not html_file.exists():
            print(f"❌ {html_file} not found")
            return
        
        # Define sections to extract
        sections_to_extract = [
            'extraordinary abilities',
            'supernatural abilities', 
            'spell-like abilities',
            'natural abilities'
        ]
        
        print(f"🔍 Extracting Special Abilities sections...")
        sections = self.extract_html_sections(html_file, sections_to_extract)
        
        # Create output directory
        output_dir = self.markdown_dir / 'abilities' / 'special-abilities'
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Convert each section to markdown
        for section_name, section_data in sections.items():
            filename = section_name.replace(' ', '-').replace('abilities', 'ability') + '.md'
            output_file = output_dir / filename
            
            markdown_content = self.html_to_markdown(section_data['content'], section_name)
            
            # Add front matter
            final_content = f"""# {section_data['header']}

{markdown_content}

---

> **📖 Related**: [Special Abilities Overview](overview.md), [Magic](../../magic/), [Combat](../../combat/)
"""
            
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(final_content)
            
            lines = len(final_content.split('\n'))
            print(f"  ✅ {filename}: {lines} lines")
    
    def preview_extraction(self, html_file, keywords):
        """Preview what would be extracted from an HTML file"""
        sections = self.extract_html_sections(html_file, keywords)
        
        print(f"\n🔍 PREVIEW: {html_file.name}")
        print("=" * 50)
        
        for keyword, section_data in sections.items():
            estimated_lines = len(section_data['content'].split('\n'))
            print(f"  📄 {keyword}:")
            print(f"      Header: {section_data['header']}")
            print(f"      HTML size: {section_data['html_length']:,} chars")
            print(f"      Estimated lines: {estimated_lines}")

def main():
    extractor = SmartContentExtractor()
    
    print("🧠 SMART CONTENT EXTRACTION")
    print("=" * 40)
    
    # Preview some key extractions
    special_abilities_file = extractor.html_dir / 'general' / 'srd_specialAbilities.htm_extracted.html'
    if special_abilities_file.exists():
        extractor.preview_extraction(special_abilities_file, [
            'extraordinary abilities',
            'supernatural abilities', 
            'spell-like abilities'
        ])
    
    # Actually extract special abilities
    print(f"\n🎯 EXTRACTING CONTENT:")
    extractor.extract_special_abilities()

if __name__ == "__main__":
    main()
