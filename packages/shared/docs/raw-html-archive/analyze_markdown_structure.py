#!/usr/bin/env python3
"""
Analyze existing markdown structure for AI-optimized content restoration
Focus: File sizes, organization patterns, cross-references
"""

import os
from pathlib import Path
from collections import defaultdict

def analyze_markdown_files():
    """Analyze existing markdown structure and sizing"""
    markdown_dir = Path('../dnd-rules/v3.x')
    
    file_sizes = []
    structure_analysis = defaultdict(list)
    
    print("🔍 ANALYZING EXISTING MARKDOWN STRUCTURE")
    print("=" * 60)
    
    # Analyze all markdown files
    for md_file in markdown_dir.rglob('*.md'):
        try:
            with open(md_file, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                line_count = len(lines)
                
            # Get relative path for categorization
            relative_path = md_file.relative_to(markdown_dir)
            category = relative_path.parts[0] if len(relative_path.parts) > 1 else 'root'
            
            file_info = {
                'file': md_file.name,
                'path': str(relative_path),
                'lines': line_count,
                'category': category
            }
            
            file_sizes.append(file_info)
            structure_analysis[category].append(file_info)
            
        except Exception as e:
            print(f"Error reading {md_file}: {e}")
    
    # Analyze size distribution
    file_sizes.sort(key=lambda x: x['lines'])
    
    print(f"\n📊 SIZE DISTRIBUTION ({len(file_sizes)} files):")
    size_ranges = {
        'Very Small (≤50)': [],
        'Small (51-100)': [],
        'Medium (101-150)': [],
        'Large (151-200)': [],
        'Very Large (201+)': []
    }
    
    for file_info in file_sizes:
        lines = file_info['lines']
        if lines <= 50:
            size_ranges['Very Small (≤50)'].append(file_info)
        elif lines <= 100:
            size_ranges['Small (51-100)'].append(file_info)
        elif lines <= 150:
            size_ranges['Medium (101-150)'].append(file_info)
        elif lines <= 200:
            size_ranges['Large (151-200)'].append(file_info)
        else:
            size_ranges['Very Large (201+)'].append(file_info)
    
    for size_range, files in size_ranges.items():
        print(f"  {size_range}: {len(files)} files")
        if len(files) <= 5:  # Show files if few enough
            for file_info in files:
                print(f"    - {file_info['path']} ({file_info['lines']} lines)")
    
    # Optimal size analysis
    optimal_files = [f for f in file_sizes if 50 <= f['lines'] <= 150]
    print(f"\n🎯 AI-OPTIMAL SIZE (50-150 lines): {len(optimal_files)}/{len(file_sizes)} files ({len(optimal_files)/len(file_sizes)*100:.1f}%)")
    
    # Category analysis
    print(f"\n📁 STRUCTURE BY CATEGORY:")
    for category, files in sorted(structure_analysis.items()):
        avg_size = sum(f['lines'] for f in files) / len(files)
        print(f"  {category}/: {len(files)} files, avg {avg_size:.0f} lines")
        
        # Show largest files in each category
        large_files = [f for f in files if f['lines'] > 150]
        if large_files:
            print(f"    📏 Large files needing splitting:")
            for file_info in sorted(large_files, key=lambda x: x['lines'], reverse=True)[:3]:
                print(f"      - {file_info['file']}: {file_info['lines']} lines")
    
    # Identify splitting opportunities
    print(f"\n🔨 FILES NEEDING SPLITTING (>150 lines):")
    large_files = [f for f in file_sizes if f['lines'] > 150]
    for file_info in sorted(large_files, key=lambda x: x['lines'], reverse=True):
        print(f"  - {file_info['path']}: {file_info['lines']} lines")
    
    # Show examples of well-sized files
    print(f"\n✅ WELL-SIZED EXAMPLES (50-100 lines):")
    good_examples = [f for f in file_sizes if 50 <= f['lines'] <= 100]
    for file_info in sorted(good_examples, key=lambda x: x['lines'])[:10]:
        print(f"  - {file_info['path']}: {file_info['lines']} lines")
    
    return file_sizes, structure_analysis

def analyze_content_patterns():
    """Analyze content organization patterns"""
    markdown_dir = Path('../dnd-rules/v3.x')
    
    print(f"\n📋 CONTENT ORGANIZATION PATTERNS:")
    
    # Look for cross-reference patterns
    cross_ref_patterns = []
    header_patterns = defaultdict(int)
    
    for md_file in markdown_dir.rglob('*.md'):
        try:
            with open(md_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Count header levels
            lines = content.split('\n')
            for line in lines:
                if line.startswith('#'):
                    level = len(line) - len(line.lstrip('#'))
                    if level <= 6:
                        header_patterns[f'H{level}'] += 1
            
            # Look for cross-references
            if '[' in content and '](' in content:
                import re
                refs = re.findall(r'\[([^\]]+)\]\(([^)]+)\)', content)
                if refs:
                    cross_ref_patterns.extend(refs)
                    
        except Exception as e:
            continue
    
    print(f"  🔗 Cross-references found: {len(cross_ref_patterns)}")
    print(f"  📑 Header distribution:")
    for header_level, count in sorted(header_patterns.items()):
        print(f"    {header_level}: {count}")
    
    # Sample some cross-references
    if cross_ref_patterns:
        print(f"  📝 Sample cross-references:")
        for i, (text, link) in enumerate(cross_ref_patterns[:5]):
            print(f"    - [{text}]({link})")

def main():
    file_sizes, structure_analysis = analyze_markdown_files()
    analyze_content_patterns()
    
    print(f"\n🎯 RECOMMENDATIONS FOR CONTENT RESTORATION:")
    print(f"  1. Target 50-150 lines per file (optimal for AI)")
    print(f"  2. Split large HTML sections into focused topics")
    print(f"  3. Maintain existing cross-reference patterns")
    print(f"  4. Use existing category structure as guide")
    print(f"  5. Focus on rules/mechanics that aid tool development")

if __name__ == "__main__":
    main()
