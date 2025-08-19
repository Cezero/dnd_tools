#!/usr/bin/env python3
"""
Content Audit: Compare markdown rules vs cleaned HTML
Focus: Rules and mechanics (NOT individual classes/spells/monsters which go in database)
"""

import os
import re
from pathlib import Path
from bs4 import BeautifulSoup
from collections import defaultdict

class ContentAuditor:
    def __init__(self):
        self.markdown_dir = Path('../dnd-rules/v3.x')
        self.html_dir = Path('final-clean-content')
        self.audit_results = defaultdict(list)
        
    def extract_html_content(self, html_file):
        """Extract readable text content from cleaned HTML"""
        try:
            with open(html_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            soup = BeautifulSoup(content, 'html.parser')
            
            # Extract text while preserving some structure
            text_content = []
            for element in soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'li']):
                text = element.get_text(strip=True)
                if text and len(text) > 10:  # Skip very short content
                    text_content.append(text)
            
            return '\n'.join(text_content)
        except Exception as e:
            return f"ERROR reading {html_file}: {e}"
    
    def extract_markdown_content(self, md_file):
        """Extract readable text content from markdown"""
        try:
            with open(md_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Remove markdown formatting for comparison
            content = re.sub(r'#{1,6}\s*', '', content)  # Headers
            content = re.sub(r'\*\*(.*?)\*\*', r'\1', content)  # Bold
            content = re.sub(r'\*(.*?)\*', r'\1', content)  # Italic
            content = re.sub(r'`(.*?)`', r'\1', content)  # Code
            content = re.sub(r'\[(.*?)\]\(.*?\)', r'\1', content)  # Links
            content = re.sub(r'\n\s*\n', '\n', content)  # Multiple newlines
            
            return content.strip()
        except Exception as e:
            return f"ERROR reading {md_file}: {e}"
    
    def categorize_html_files(self):
        """Categorize HTML files by type (rules vs individual data)"""
        rules_files = []
        data_files = []
        
        for html_file in self.html_dir.rglob('*.html'):
            filename = html_file.name.lower()
            
            # Individual data records (for database)
            if any(pattern in filename for pattern in [
                'srd_classes_', 'srd_spells_', 'srd_monsters_',
                'srd_feats_', '_spell.htm', '_monster.htm', '_class.htm'
            ]):
                data_files.append(html_file)
            
            # Rules and mechanics (for markdown)
            elif any(pattern in filename for pattern in [
                'combat', 'magic', 'equipment', 'condition', 'skill',
                'environment', 'exploration', 'abilities', 'types'
            ]):
                rules_files.append(html_file)
            
            # General/overview files (likely rules)
            elif 'intro' in filename or 'overview' in filename:
                rules_files.append(html_file)
            else:
                # Default to rules for now
                rules_files.append(html_file)
        
        return rules_files, data_files
    
    def find_content_matches(self):
        """Find potential matches between markdown and HTML rules content"""
        rules_files, data_files = self.categorize_html_files()
        
        print(f"📊 CONTENT CATEGORIZATION:")
        print(f"  🎯 Rules files (for markdown): {len(rules_files)}")
        print(f"  💾 Data files (for database): {len(data_files)}")
        
        # Get all markdown files
        md_files = list(self.markdown_dir.rglob('*.md'))
        print(f"  📝 Existing markdown files: {len(md_files)}")
        
        matches = {}
        missing_html_topics = []
        missing_md_topics = []
        
        # Try to match HTML rules to markdown
        for html_file in rules_files:
            html_content = self.extract_html_content(html_file)
            if html_content.startswith("ERROR"):
                continue
                
            # Extract key topics from HTML
            soup = BeautifulSoup(open(html_file, 'r', encoding='utf-8').read(), 'html.parser')
            h1_tags = soup.find_all('h1')
            html_topics = [h1.get_text(strip=True) for h1 in h1_tags]
            
            # Look for matching markdown files
            best_match = None
            best_score = 0
            
            for md_file in md_files:
                md_content = self.extract_markdown_content(md_file)
                if md_content.startswith("ERROR"):
                    continue
                
                # Simple content overlap scoring
                html_words = set(html_content.lower().split())
                md_words = set(md_content.lower().split())
                
                if html_words and md_words:
                    overlap = len(html_words & md_words)
                    score = overlap / min(len(html_words), len(md_words))
                    
                    if score > best_score and score > 0.1:  # At least 10% overlap
                        best_match = md_file
                        best_score = score
            
            if best_match:
                matches[html_file] = {
                    'markdown': best_match,
                    'score': best_score,
                    'html_topics': html_topics
                }
            else:
                missing_md_topics.extend(html_topics)
        
        return matches, missing_html_topics, missing_md_topics, rules_files, data_files
    
    def analyze_content_gaps(self, matches):
        """Analyze content gaps and summarization"""
        gaps = []
        
        for html_file, match_info in matches.items():
            md_file = match_info['markdown']
            score = match_info['score']
            
            html_content = self.extract_html_content(html_file)
            md_content = self.extract_markdown_content(md_file)
            
            html_length = len(html_content)
            md_length = len(md_content)
            
            # Check for significant size differences (possible summarization)
            if html_length > md_length * 2:  # HTML significantly longer
                gap_info = {
                    'type': 'summarized',
                    'html_file': html_file,
                    'md_file': md_file,
                    'html_length': html_length,
                    'md_length': md_length,
                    'ratio': html_length / md_length if md_length > 0 else float('inf'),
                    'overlap_score': score
                }
                gaps.append(gap_info)
        
        return gaps
    
    def generate_report(self):
        """Generate comprehensive content audit report"""
        print("🔍 CONTENT AUDIT: MARKDOWN vs CLEANED HTML")
        print("=" * 60)
        
        matches, missing_html, missing_md, rules_files, data_files = self.find_content_matches()
        gaps = self.analyze_content_gaps(matches)
        
        print(f"\n📈 MATCHING ANALYSIS:")
        print(f"  ✅ HTML rules matched to markdown: {len(matches)}")
        print(f"  ❓ HTML rules without markdown match: {len(rules_files) - len(matches)}")
        print(f"  📊 Average overlap score: {sum(m['score'] for m in matches.values()) / len(matches) if matches else 0:.2f}")
        
        print(f"\n🎯 TOP CONTENT MATCHES:")
        sorted_matches = sorted(matches.items(), key=lambda x: x[1]['score'], reverse=True)
        for i, (html_file, match_info) in enumerate(sorted_matches[:10]):
            print(f"  {i+1:2d}. {html_file.name} → {match_info['markdown'].name} ({match_info['score']:.2f})")
        
        print(f"\n⚠️  POTENTIAL CONTENT GAPS ({len(gaps)} found):")
        gaps.sort(key=lambda x: x['ratio'], reverse=True)
        for i, gap in enumerate(gaps[:15]):
            print(f"  {i+1:2d}. {gap['html_file'].name}")
            print(f"      → {gap['md_file'].name}")
            print(f"      📏 HTML: {gap['html_length']:,} chars, MD: {gap['md_length']:,} chars")
            print(f"      📊 Ratio: {gap['ratio']:.1f}x larger, Overlap: {gap['overlap_score']:.2f}")
        
        print(f"\n💾 DATABASE CONTENT (excluded from audit):")
        data_categories = defaultdict(int)
        for data_file in data_files:
            if 'classes_' in data_file.name:
                data_categories['Classes'] += 1
            elif 'spells_' in data_file.name:
                data_categories['Spells'] += 1
            elif 'monsters_' in data_file.name:
                data_categories['Monsters'] += 1
            elif 'feats_' in data_file.name:
                data_categories['Feats'] += 1
            else:
                data_categories['Other'] += 1
        
        for category, count in data_categories.items():
            print(f"  📋 {category}: {count} files")
        
        print(f"\n🔍 UNMATCHED HTML TOPICS:")
        unique_missing = list(set(missing_md))
        for i, topic in enumerate(unique_missing[:20]):
            print(f"  {i+1:2d}. {topic}")
        
        # Save detailed results
        with open('content_audit_results.txt', 'w') as f:
            f.write("CONTENT AUDIT DETAILED RESULTS\n")
            f.write("=" * 50 + "\n\n")
            
            f.write("CONTENT GAPS (Potential Summarization):\n")
            for gap in gaps:
                f.write(f"\nHTML: {gap['html_file']}\n")
                f.write(f"MD:   {gap['md_file']}\n")
                f.write(f"Ratio: {gap['ratio']:.1f}x, Score: {gap['overlap_score']:.2f}\n")
        
        print(f"\n💾 Detailed results saved to: content_audit_results.txt")
        return matches, gaps

def main():
    auditor = ContentAuditor()
    matches, gaps = auditor.generate_report()
    
    print(f"\n🎯 NEXT STEPS:")
    print(f"  1. Review content gaps for potential restoration needs")
    print(f"  2. Focus on high-ratio gaps (likely summarized content)")
    print(f"  3. Individual classes/spells/monsters → database (not markdown)")

if __name__ == "__main__":
    main()
