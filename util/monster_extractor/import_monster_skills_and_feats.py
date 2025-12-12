#!/usr/bin/env python3
"""
Monster Skills and Feats Import Script

Imports monster skills and feats from HTML file into the database.
Parses skill and feat data from the Monster Manual Chapter 6.

Dependencies:
    beautifulsoup4 - Install with: pip install beautifulsoup4
    mysql-connector-python - Install with: pip install mysql-connector-python
    python-dotenv - Install with: pip install python-dotenv

Usage:
    python3 import_monster_skills_and_feats.py [--dry-run] [--skip-existing]
    
    Options:
        --dry-run        Parse and validate without inserting into database
        --skip-existing  Skip skills/feats that already exist in the database
"""

import argparse
import logging
import os
import re
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from dotenv import load_dotenv

try:
    from bs4 import BeautifulSoup, Tag, NavigableString
except ImportError:
    print("Error: beautifulsoup4 is required. Install it with: pip install beautifulsoup4")
    sys.exit(1)

try:
    import mysql.connector
    from mysql.connector import Error
except ImportError:
    print("Error: mysql-connector-python is required. Install it with: pip install mysql-connector-python")
    sys.exit(1)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Constants
EDITION_ID_DND_3_5 = 5
SOURCE_BOOK_ID_MONSTER_MANUAL_3_5 = 44

# Ability ID mapping (matches AbilityId enum)
ABILITY_ID_MAP = {
    'STR': 1, 'STRENGTH': 1,
    'DEX': 2, 'DEXTERITY': 2,
    'CON': 3, 'CONSTITUTION': 3,
    'INT': 4, 'INTELLIGENCE': 4,
    'WIS': 5, 'WISDOM': 5,
    'CHA': 6, 'CHARISMA': 6,
}

# Feat type mapping (matches FeatType enum)
FEAT_TYPE_MAP = {
    'GENERAL': 1,
    'ITEM CREATION': 2,
    'METAMAGIC': 3,
    'FIGHTER': 1,  # Fighter feats are also General type
}


class DatabaseConnection:
    """Manages database connection and operations."""
    
    def __init__(self, dry_run: bool = False):
        self.dry_run = dry_run
        self.conn = None
        self.cursor = None
        self.connect()
    
    def connect(self):
        """Connect to the database."""
        try:
            # Load .env from parent directory (util folder) or current directory
            script_dir = Path(__file__).parent
            parent_env = script_dir.parent / '.env'
            current_env = script_dir / '.env'
            
            # Try parent directory first (util/.env), then current directory
            if parent_env.exists():
                load_dotenv(dotenv_path=parent_env)
                logger.debug(f"Loaded .env from: {parent_env}")
            elif current_env.exists():
                load_dotenv(dotenv_path=current_env)
                logger.debug(f"Loaded .env from: {current_env}")
            else:
                # Fall back to default behavior (searches current dir and parents)
                load_dotenv()
                logger.debug("Using default .env search behavior")
            
            # Validate required environment variables
            db_host = os.getenv('DB_HOST')
            db_user = os.getenv('DB_USER')
            db_pass = os.getenv('DB_PASS')
            db_name = os.getenv('DB_NAME')
            
            if not all([db_host, db_user, db_pass, db_name]):
                missing = [k for k, v in [('DB_HOST', db_host), ('DB_USER', db_user), 
                                         ('DB_PASS', db_pass), ('DB_NAME', db_name)] if not v]
                raise ValueError(f"Missing required environment variables: {', '.join(missing)}")
            
            self.conn = mysql.connector.connect(
                host=db_host,
                user=db_user,
                password=db_pass,
                database=db_name,
                autocommit=True
            )
            self.cursor = self.conn.cursor(dictionary=True)
            logger.info("Connected to database")
        except Error as e:
            logger.error(f"Error connecting to database: {e}")
            raise
    
    def close(self):
        """Close database connection."""
        if self.cursor:
            self.cursor.close()
        if self.conn and self.conn.is_connected():
            self.conn.close()
            logger.info("Database connection closed")
    
    def execute(self, query: str, params: Optional[Tuple] = None):
        """Execute a SELECT query."""
        if self.dry_run:
            logger.debug(f"DRY RUN QUERY: {query} with params {params}")
        self.cursor.execute(query, params)
        return self.cursor.fetchall()
    
    def execute_insert(self, query: str, params: Optional[Tuple] = None):
        """Execute an insert query and return the last insert ID."""
        if self.dry_run:
            logger.info(f"DRY RUN INSERT: {query} with params {params}")
            return 0  # Return fake ID for dry-run
        self.cursor.execute(query, params)
        return self.cursor.lastrowid
    
    def get_skill_id(self, name: str) -> Optional[int]:
        """Get skill ID by name."""
        query = "SELECT id FROM Skill WHERE name = %s"
        result = self.execute(query, (name,))
        if result:
            return result[0]['id']
        return None
    
    def get_feat_id(self, name: str) -> Optional[int]:
        """Get feat ID by name."""
        query = "SELECT id FROM Feat WHERE name = %s"
        result = self.execute(query, (name,))
        if result:
            return result[0]['id']
        return None
    
    def insert_skill(self, skill_data: Dict) -> int:
        """Insert a skill into the database."""
        # Check if skill already exists
        existing_id = self.get_skill_id(skill_data['name'])
        if existing_id:
            logger.info(f"Skill '{skill_data['name']}' already exists with ID {existing_id}")
            return existing_id
        
        # Insert skill
        query = """
            INSERT INTO Skill (
                name, abilityId, checkDescription, actionDescription, retryDescription,
                specialNotes, description, editionId, isVisible
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        params = (
            skill_data['name'],
            skill_data.get('abilityId', 1),
            skill_data.get('checkDescription'),
            skill_data.get('actionDescription'),
            skill_data.get('retryDescription'),
            skill_data.get('specialNotes'),
            skill_data.get('description'),
            EDITION_ID_DND_3_5,
            True
        )
        skill_id = self.execute_insert(query, params)
        
        # Insert source book reference
        if skill_id:
            source_query = """
                INSERT INTO SkillSourceBookMap (skillId, sourceBookId, pageNumber)
                VALUES (%s, %s, %s)
            """
            self.execute_insert(source_query, (skill_id, SOURCE_BOOK_ID_MONSTER_MANUAL_3_5, None))
            logger.info(f"Inserted skill: {skill_data['name']} (ID: {skill_id})")
        
        return skill_id
    
    def insert_feat(self, feat_data: Dict) -> int:
        """Insert a feat into the database."""
        # Check if feat already exists
        existing_id = self.get_feat_id(feat_data['name'])
        if existing_id:
            logger.info(f"Feat '{feat_data['name']}' already exists with ID {existing_id}")
            return existing_id
        
        # Insert feat
        query = """
            INSERT INTO Feat (
                name, typeId, description, benefit, normalEffect, specialEffect,
                prerequisites, repeatable, fighterBonus, isVisible, editionId
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        params = (
            feat_data['name'],
            feat_data.get('typeId', 1),  # Default to GENERAL
            feat_data.get('description'),
            feat_data.get('benefit'),
            feat_data.get('normalEffect'),
            feat_data.get('specialEffect'),
            feat_data.get('prerequisites'),
            feat_data.get('repeatable', False),
            feat_data.get('fighterBonus', False),
            True,
            EDITION_ID_DND_3_5
        )
        feat_id = self.execute_insert(query, params)
        
        # Insert source book reference
        if feat_id:
            source_query = """
                INSERT INTO FeatSourceBookMap (featId, sourceBookId, pageNumber)
                VALUES (%s, %s, %s)
            """
            self.execute_insert(source_query, (feat_id, SOURCE_BOOK_ID_MONSTER_MANUAL_3_5, None))
            logger.info(f"Inserted feat: {feat_data['name']} (ID: {feat_id})")
        
        return feat_id


def extract_text_from_element(element) -> str:
    """Extract and clean text from a BeautifulSoup element."""
    if element is None:
        return ""
    text = element.get_text(separator=' ', strip=True)
    # Clean up multiple spaces
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def strip_header(text: str, header_patterns: List[str]) -> str:
    """Strip header labels from text (e.g., 'Benefit: ', 'Prerequisites: ')."""
    if not text:
        return text
    
    for pattern in header_patterns:
        # Case-insensitive match at the start of the string
        text = re.sub(r'^' + re.escape(pattern) + r'\s*', '', text, flags=re.IGNORECASE)
    
    return text.strip()


def to_title_case(text: str) -> str:
    """Convert ALL CAPS text to Title Case (e.g., 'ABILITY FOCUS' -> 'Ability Focus')."""
    if not text:
        return text
    
    # If the text is all uppercase (or mostly uppercase), convert to title case
    # Check if more than 50% of letters are uppercase
    letters = [c for c in text if c.isalpha()]
    if letters and sum(1 for c in letters if c.isupper()) / len(letters) > 0.5:
        return text.title()
    
    return text


def parse_skill(soup: BeautifulSoup) -> Optional[Dict]:
    """Parse the Control Shape skill from the HTML."""
    # Find the h2 with "CONTROL SHAPE" - check all h2 tags for the text
    h2 = None
    for heading in soup.find_all('h2'):
        heading_text = extract_text_from_element(heading)
        if 'CONTROL SHAPE' in heading_text.upper():
            h2 = heading
            break
    
    if not h2:
        return None
    
    # Extract ability ID from span if present (e.g., "(WIS)")
    ability_id = ABILITY_ID_MAP.get('WIS', 5)  # Default to Wisdom
    ability_span = h2.find('span')
    if ability_span:
        ability_text = extract_text_from_element(ability_span).upper()
        # Extract ability abbreviation from parentheses, e.g., "(WIS)" -> "WIS"
        ability_match = re.search(r'\(([A-Z]+)\)', ability_text)
        if ability_match:
            ability_abbr = ability_match.group(1)
            ability_id = ABILITY_ID_MAP.get(ability_abbr, ABILITY_ID_MAP.get('WIS', 5))
    
    skill_data = {
        'name': 'Control Shape',
        'abilityId': ability_id,
        'description': '',
        'checkDescription': '',
        'retryDescription': '',
        'specialNotes': ''
    }
    
    # Collect all paragraphs and tables after the h2 until the next h2
    current = h2.next_sibling
    description_parts = []
    check_parts = []
    retry_parts = []
    special_parts = []
    
    while current:
        if isinstance(current, Tag):
            if current.name == 'h2':
                break  # Stop at next section
            
            if current.name == 'p':
                text = extract_text_from_element(current)
                if text:
                    # Check for specific sections
                    if text.startswith('Check'):
                        # Strip "Check (Involuntary Change): " or "Check (Voluntary Change): " or "Check: "
                        stripped = strip_header(text, ['Check (Involuntary Change):', 'Check (Voluntary Change):', 'Check:'])
                        check_parts.append(stripped)
                    elif text.startswith('Retry'):
                        # Strip "Retry (Involuntary Change): " or "Retry (Voluntary Change): " or "Retry: "
                        stripped = strip_header(text, ['Retry (Involuntary Change):', 'Retry (Voluntary Change):', 'Retry:'])
                        retry_parts.append(stripped)
                    elif 'Special:' in text or text.startswith('Special'):
                        # Strip "Special: " or "Special "
                        stripped = strip_header(text, ['Special:', 'Special'])
                        special_parts.append(stripped)
                    else:
                        description_parts.append(text)
            
            elif current.name == 'table':
                # Extract table data for check descriptions
                table_text = extract_text_from_element(current)
                if table_text:
                    check_parts.append(table_text)
        
        current = current.next_sibling
    
    skill_data['description'] = ' '.join(description_parts)
    skill_data['checkDescription'] = ' '.join(check_parts)
    skill_data['retryDescription'] = ' '.join(retry_parts)
    skill_data['specialNotes'] = ' '.join(special_parts)
    
    return skill_data


def parse_feat(feat_heading: Tag) -> Optional[Dict]:
    """Parse a feat from its h2 heading or paragraph."""
    # Extract feat name and type
    h2_text = extract_text_from_element(feat_heading)
    
    # Remove type brackets from the text
    feat_name = re.sub(r'\s*\[.*?\]\s*', '', h2_text).strip()
    
    # Convert to title case (e.g., "ABILITY FOCUS" -> "Ability Focus")
    feat_name = to_title_case(feat_name)
    
    # Extract feat type from span or brackets in the text
    feat_type = 1  # Default to GENERAL
    type_span = feat_heading.find('span')
    if type_span:
        type_text = extract_text_from_element(type_span).upper()
        # Remove brackets
        type_text = re.sub(r'[\[\]]', '', type_text).strip()
        feat_type = FEAT_TYPE_MAP.get(type_text, 1)
    else:
        # Try to extract from brackets in the h2 text
        bracket_match = re.search(r'\[([^\]]+)\]', h2_text)
        if bracket_match:
            type_text = bracket_match.group(1).upper().strip()
            feat_type = FEAT_TYPE_MAP.get(type_text, 1)
    
    feat_data = {
        'name': feat_name,
        'typeId': feat_type,
        'description': '',
        'benefit': '',
        'prerequisites': '',
        'specialEffect': '',
        'repeatable': False,
        'fighterBonus': False
    }
    
    # Check if it's a fighter bonus feat
    if 'FIGHTER' in h2_text.upper():
        feat_data['fighterBonus'] = True
    
    # Collect all paragraphs after the h2 until the next h2
    current = feat_heading.next_sibling
    description_parts = []
    benefit_parts = []
    prerequisite_parts = []
    normal_parts = []
    special_parts = []
    
    while current:
        if isinstance(current, Tag):
            if current.name == 'h2':
                break  # Stop at next section
            
            if current.name == 'p':
                text = extract_text_from_element(current)
                if not text:
                    current = current.next_sibling
                    continue
                
                # Check for specific sections
                if text.startswith('Prerequisite') or text.startswith('Prerequisites'):
                    prerequisite_parts.append(text)
                elif text.startswith('Benefit') or text.startswith('Benefits'):
                    benefit_parts.append(text)
                elif text.startswith('Normal'):
                    normal_parts.append(text)
                elif text.startswith('Special'):
                    special_parts.append(text)
                else:
                    # First paragraph is usually the description
                    if not description_parts:
                        description_parts.append(text)
                    else:
                        # Could be continuation of description or other content
                        description_parts.append(text)
            
            elif current.name == 'table':
                # Extract table data
                table_text = extract_text_from_element(current)
                if table_text:
                    # Usually part of benefit or description
                    if benefit_parts:
                        benefit_parts.append(table_text)
                    else:
                        description_parts.append(table_text)
        
        current = current.next_sibling
    
    feat_data['description'] = ' '.join(description_parts)
    # Strip headers from benefit, prerequisites, normal, and special
    feat_data['benefit'] = strip_header(' '.join(benefit_parts), ['Benefit:', 'Benefits:'])
    feat_data['prerequisites'] = strip_header(' '.join(prerequisite_parts), ['Prerequisite:', 'Prerequisites:'])
    feat_data['normalEffect'] = strip_header(' '.join(normal_parts), ['Normal:'])
    feat_data['specialEffect'] = strip_header(' '.join(special_parts), ['Special:'])
    
    # Check if feat is repeatable
    if 'multiple times' in feat_data.get('specialEffect', '').lower() or \
       'can gain this feat multiple times' in feat_data.get('specialEffect', '').lower():
        feat_data['repeatable'] = True
    
    return feat_data


def parse_html_file(file_path: Path) -> Tuple[List[Dict], List[Dict]]:
    """Parse the HTML file and extract skills and feats."""
    logger.info(f"Parsing HTML file: {file_path}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        html_content = f.read()
    
    soup = BeautifulSoup(html_content, 'html.parser')
    
    skills = []
    feats = []
    
    # Parse the Control Shape skill
    skill = parse_skill(soup)
    if skill:
        skills.append(skill)
        logger.info(f"Parsed skill: {skill['name']}")
    
    # Find all h2 headings (feats)
    h2_headings = soup.find_all('h2')
    for h2 in h2_headings:
        h2_text = extract_text_from_element(h2)
        # Skip the Control Shape skill heading
        if 'CONTROL SHAPE' in h2_text.upper():
            continue
        
        # Parse feat
        feat = parse_feat(h2)
        if feat and feat['name']:  # Make sure we got a valid name
            feats.append(feat)
            logger.info(f"Parsed feat: {feat['name']}")
    
    # Also check for feats in paragraphs (like EMPOWER SPELL-LIKE ABILITY)
    # Look for paragraphs that start with all caps feat names followed by [TYPE]
    paragraphs = soup.find_all('p')
    for p in paragraphs:
        p_text = extract_text_from_element(p)
        # Check if this looks like a feat heading in a paragraph
        # Pattern: ALL CAPS NAME [TYPE] followed by description
        feat_match = re.match(r'^([A-Z\s\-]+?)\s*\[([^\]]+)\]\s*(.+)$', p_text)
        if feat_match:
            feat_name = feat_match.group(1).strip()
            # Convert to title case (e.g., "EMPOWER SPELL-LIKE ABILITY" -> "Empower Spell-Like Ability")
            feat_name = to_title_case(feat_name)
            feat_type_text = feat_match.group(2).upper().strip()
            # Skip if we already have this feat
            if any(f['name'].upper() == feat_name.upper() for f in feats):
                continue
            
            feat_type = FEAT_TYPE_MAP.get(feat_type_text, 1)
            
            # The description starts after the type
            description_start = feat_match.group(3)
            
            feat_data = {
                'name': feat_name,
                'typeId': feat_type,
                'description': description_start,
                'benefit': '',
                'prerequisites': '',
                'specialEffect': '',
                'repeatable': False,
                'fighterBonus': False
            }
            
            # Collect remaining paragraphs until next h2 or feat paragraph
            current = p.next_sibling
            benefit_parts = []
            prerequisite_parts = []
            normal_parts = []
            special_parts = []
            
            while current:
                if isinstance(current, Tag):
                    if current.name == 'h2':
                        break
                    if current.name == 'p':
                        next_p_text = extract_text_from_element(current)
                        # Check if this is another feat heading
                        if re.match(r'^[A-Z\s\-]+?\s*\[[^\]]+\]', next_p_text):
                            break
                        
                        if next_p_text.startswith('Prerequisite') or next_p_text.startswith('Prerequisites'):
                            # Strip header before appending
                            stripped = strip_header(next_p_text, ['Prerequisite:', 'Prerequisites:'])
                            prerequisite_parts.append(stripped)
                        elif next_p_text.startswith('Benefit') or next_p_text.startswith('Benefits'):
                            # Strip header before appending
                            stripped = strip_header(next_p_text, ['Benefit:', 'Benefits:'])
                            benefit_parts.append(stripped)
                        elif next_p_text.startswith('Normal'):
                            # Strip header before appending
                            stripped = strip_header(next_p_text, ['Normal:'])
                            normal_parts.append(stripped)
                        elif next_p_text.startswith('Special'):
                            # Strip header before appending
                            stripped = strip_header(next_p_text, ['Special:'])
                            special_parts.append(stripped)
                        else:
                            # Continuation of description
                            if not benefit_parts and not prerequisite_parts:
                                feat_data['description'] += ' ' + next_p_text
                            elif benefit_parts:
                                benefit_parts.append(next_p_text)
                            else:
                                feat_data['description'] += ' ' + next_p_text
                
                current = current.next_sibling
            
            # Strip headers (already stripped during collection, but ensure clean)
            feat_data['benefit'] = strip_header(' '.join(benefit_parts), ['Benefit:', 'Benefits:'])
            feat_data['prerequisites'] = strip_header(' '.join(prerequisite_parts), ['Prerequisite:', 'Prerequisites:'])
            feat_data['normalEffect'] = strip_header(' '.join(normal_parts), ['Normal:'])
            feat_data['specialEffect'] = strip_header(' '.join(special_parts), ['Special:'])
            
            # Check if feat is repeatable
            if 'multiple times' in feat_data.get('specialEffect', '').lower() or \
               'can gain this feat multiple times' in feat_data.get('specialEffect', '').lower():
                feat_data['repeatable'] = True
            
            feats.append(feat_data)
            logger.info(f"Parsed feat from paragraph: {feat_data['name']}")
    
    logger.info(f"Parsed {len(skills)} skill(s) and {len(feats)} feat(s)")
    return skills, feats


def main():
    """Main function."""
    parser = argparse.ArgumentParser(description='Import monster skills and feats from HTML file')
    parser.add_argument('--dry-run', action='store_true', help='Parse and validate without inserting into database')
    parser.add_argument('--skip-existing', action='store_true', help='Skip skills/feats that already exist')
    args = parser.parse_args()
    
    # Get the HTML file path
    script_dir = Path(__file__).parent
    html_file = script_dir / 'output' / 'monster_skills_and_feats.html'
    
    if not html_file.exists():
        logger.error(f"HTML file not found: {html_file}")
        sys.exit(1)
    
    # Parse HTML
    skills, feats = parse_html_file(html_file)
    
    if not skills and not feats:
        logger.warning("No skills or feats found in HTML file")
        return
    
    # Connect to database
    db = DatabaseConnection(dry_run=args.dry_run)
    
    try:
        # Insert skills
        logger.info(f"\n=== Inserting {len(skills)} skill(s) ===")
        for skill in skills:
            if args.skip_existing and db.get_skill_id(skill['name']):
                logger.info(f"Skipping existing skill: {skill['name']}")
                continue
            db.insert_skill(skill)
        
        # Insert feats
        logger.info(f"\n=== Inserting {len(feats)} feat(s) ===")
        for feat in feats:
            if args.skip_existing and db.get_feat_id(feat['name']):
                logger.info(f"Skipping existing feat: {feat['name']}")
                continue
            db.insert_feat(feat)
        
        logger.info("\n=== Import complete ===")
        
    except Exception as e:
        logger.error(f"Error during import: {e}", exc_info=True)
        sys.exit(1)
    finally:
        db.close()


if __name__ == '__main__':
    main()

