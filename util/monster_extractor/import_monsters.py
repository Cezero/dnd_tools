#!/usr/bin/env python3
"""
Monster Manual Import Script

Imports monsters from tagged text files into the database.
Parses monster data including base monsters, variants, special abilities, spells, and equipment.

Dependencies:
    mysql-connector-python - Install with: pip install mysql-connector-python
    python-dotenv - Install with: pip install python-dotenv

Usage:
    python3 import_monsters.py [--monster MONSTER_NAME] [--all] [--dry-run] [--skip-existing] [--update] [--list-monsters] [--list-sidebars] [--list-tables]
    
    Options:
        --monster, -m    Import only the specified monster by exact filename match (case-insensitive)
        --all, -a        Import all monsters from the tagged directory
        --dry-run        Parse and validate without inserting into database
        --skip-existing  Skip monsters that already exist in the database (resume functionality)
        --update         Update existing monsters by deleting and re-importing them
        --list-monsters  List all monster and variant names found in file(s)
        --list-sidebars  List all extra description entries (sidebars, CHARACTERS, ASCHARACTERS, etc.) with their types
        --list-tables    List all reference tables detected in file(s)
    
    The script looks for monster files in: output/monsters/tagged/ (relative to script location)
    When using --monster, it matches the exact filename stem (e.g., "giant" matches only "giant.txt", not "giant-bee.txt")
"""

import argparse
import logging
import os
import re
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Set
from dotenv import load_dotenv

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

# Standard statblock labels
STATBLOCK_LABELS_ORDERED = [
    'Hit Dice', 'Initiative', 'Speed', 'Armor Class', 'Base Attack/Grapple',
    'Attack', 'Full Attack', 'Space/Reach', 'Special Attacks', 'Special Qualities',
    'Saves', 'Abilities', 'Skills', 'Feats', 'Environment', 'Organization',
    'Challenge Rating', 'Treasure', 'Alignment', 'Advancement', 'Level Adjustment'
]

STATBLOCK_LABELS = set(STATBLOCK_LABELS_ORDERED)

# Enum mappings (these should match CommonData.ts)
MONSTER_TYPE_MAP = {
    'Aberration': 1,
    'Animal': 2,
    'Construct': 3,
    'Dragon': 4,
    'Elemental': 5,
    'Fey': 6,
    'Giant': 7,
    'Humanoid': 8,
    'Magical Beast': 9,
    'Monstrous Humanoid': 10,
    'Ooze': 11,
    'Outsider': 12,
    'Plant': 13,
    'Undead': 14,
    'Vermin': 15,
}

MONSTER_SUBTYPE_MAP = {
    'Aquatic': 1,
    'Air': 2,
    'Earth': 3,
    'Fire': 4,
    'Water': 5,
    'Cold': 6,
    'Evil': 7,
    'Good': 8,
    'Lawful': 9,
    'Chaotic': 10,
    'Extraplanar': 11,
    'Angel': 12,
    'Archon': 13,
    'Incorporeal': 14,
    'Swarm': 15,
    'Shapechanger': 16,
    'Augmented': 17,
    'Baatezu': 18,
    'Eladrin': 19,
    'Goblinoid': 20,
    'Guardinal': 21,
    'Native': 22,
    'Reptilian': 23,
    'Tanar\'ri': 24,
    # Humanoid race subtypes
    'Dwarf': 25,
    'Elf': 26,
    'Gnoll': 27,
    'Gnome': 28,
    'Halfling': 29,
    'Human': 30,
    'Orc': 31,
}

# Movement type mapping (matches MovementTypeId enum)
MOVEMENT_TYPE_MAP = {
    'land': 1,
    'fly': 2,
    'swim': 3,
    'climb': 4,
    'burrow': 5,
}

# Reverse mappings for display (ID -> name) - used in dry-run logging
MONSTER_TYPE_ID_TO_NAME = {v: k for k, v in MONSTER_TYPE_MAP.items()}
MONSTER_SUBTYPE_ID_TO_NAME = {v: k for k, v in MONSTER_SUBTYPE_MAP.items()}
MOVEMENT_TYPE_ID_TO_NAME = {v: k for k, v in MOVEMENT_TYPE_MAP.items()}

MONSTER_SPECIAL_ABILITY_TYPE = {
    'SpellLike': 1,      # (Sp)
    'Supernatural': 2,   # (Su)
    'Extraordinary': 3,  # (Ex)
}

# Reverse mapping for ability types
MONSTER_SPECIAL_ABILITY_TYPE_ID_TO_NAME = {v: k for k, v in MONSTER_SPECIAL_ABILITY_TYPE.items()}

# Ability ID to name mapping (for saveAbility display)
ABILITY_ID_TO_NAME = {
    1: 'Strength',
    2: 'Dexterity',
    3: 'Constitution',
    4: 'Intelligence',
    5: 'Wisdom',
    6: 'Charisma',
}

MONSTER_ARMOR_COMPONENT_TYPE = {
    'NaturalArmor': 1,
    'Equipment': 2,
    'Other': 3,
}

MONSTER_SPELL_TYPE = {
    'SpellLike': 1,
    'Prepared': 2,
}

# Spell modifiers that can prefix spell names (e.g., "empowered lightning bolt")
# These are meta-magic feats applied to spells
SPELL_MODIFIERS = [
    'empowered',
    'extended',
    'enlarged',
    # Add more modifiers as they are encountered
]

# Descriptors that may appear before or after spell names
# (e.g., "greater invisibility" vs "Invisibility, Greater" or "mass heal" vs "Heal, Mass")
SPELL_DESCRIPTORS = [
    'greater',
    'mass',
    'lesser',
    # Add more descriptors as they are encountered
]

MONSTER_SPELL_USES_PER_DAY = {
    'AtWill': 1,
    '1/Day': 2,
    '2/Day': 3,
    '3/Day': 4,
    '4/Day': 5,
    '5/Day': 6,
    '6/Day': 7,
    '7/Day': 8,
    '1/Round': 9,
}

# Edition ID for D&D 3.5
EDITION_ID_DND_3_5 = 5
SOURCE_BOOK_ID_MONSTER_MANUAL_3_5 = 44

# Monster Extra Description Type IDs (must match CommonData.ts)
MONSTER_EXTRA_DESCRIPTION_TYPE = {
    'Mount': 1,
    'Society': 2,
    'Character': 3,  # For {CHARACTERS} blocks (brief character info)
    'Creating': 4,
    'Tactics': 5,
    'Sidebar': 6,
    'Training': 7,
    'AsCharacters': 8,  # For {ASCHARACTERS} blocks (detailed racial traits for player characters)
}  # D&D 3.5e Monster Manual


class ImportError(Exception):
    """Custom exception for import errors with detailed context."""
    def __init__(self, message: str, monster_name: str = None, field: str = None, value: str = None, line_number: int = None):
        self.message = message
        self.monster_name = monster_name
        self.field = field
        self.value = value
        self.line_number = line_number
        super().__init__(self.message)
    
    def __str__(self):
        parts = [self.message]
        if self.line_number:
            parts.append(f"Line: {self.line_number}")
        if self.monster_name:
            parts.append(f"Monster: {self.monster_name}")
        if self.field:
            parts.append(f"Field: {self.field}")
        if self.value:
            parts.append(f"Value: {self.value}")
        return " | ".join(parts)


class DatabaseConnection:
    """Manages database connection and operations."""
    
    def __init__(self, dry_run: bool = False):
        self.dry_run = dry_run
        self.conn = None
        self.cursor = None
        self.in_transaction = False
        self.pending_inserts = []  # Track what would be inserted in dry-run mode
        self.dry_run_monster_id_counter = 0  # Track monster IDs separately in dry-run mode
        self.file_content = None  # Store current file content for line number tracking
        self.connect()  # Always connect, even in dry-run (needed for lookups)
    
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
                autocommit=True  # Enable autocommit by default to avoid implicit transactions
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
        """Execute a SELECT query (read operations work in dry-run mode)."""
        if self.dry_run:
            logger.debug(f"DRY RUN QUERY: {query} with params {params}")
        self.cursor.execute(query, params)
        return self.cursor.fetchall()
    
    def execute_insert(self, query: str, params: Optional[Tuple] = None, table_name: str = None):
        """
        Execute an insert query and return the last insert ID.
        In dry-run mode, tracks what would be inserted.
        """
        table = table_name or self._extract_table_name(query)
        
        # Generate a descriptive log message for this insert
        log_message = self._format_insert_log_message(table, query, params)
        if log_message:
            logger.info(log_message)
        
        if self.dry_run:
            # Track what would be inserted
            insert_info = {
                'table': table,
                'query': query,
                'params': params
            }
            self.pending_inserts.append(insert_info)
            logger.debug(f"DRY RUN INSERT: {query} with params {params}")
            # For Monster table inserts, return a sequential monster ID
            # For other tables, return a sequential ID based on pending_inserts length
            if table == 'Monster':
                self.dry_run_monster_id_counter += 1
                return self.dry_run_monster_id_counter
            else:
                # Return a mock ID for other tables (incrementing)
                return len(self.pending_inserts)
        try:
            self.cursor.execute(query, params)
            return self.cursor.lastrowid
        except Exception as e:
            # Log detailed error information including query and parameters
            logger.error(f"Error executing INSERT into {table}: {e}")
            logger.error(f"SQL Query: {query}")
            logger.error(f"Parameters: {params}")
            # For string parameters, also log their length
            if params:
                for i, param in enumerate(params):
                    if isinstance(param, str):
                        logger.error(f"  Parameter {i} (string): length={len(param)}, value={param[:200]}..." if len(param) > 200 else f"  Parameter {i} (string): length={len(param)}, value={param}")
            raise
    
    def _format_insert_log_message(self, table: str, query: str, params: Optional[Tuple]) -> Optional[str]:
        """Format a descriptive log message for an insert operation."""
        if not params:
            return None
        
        try:
            if table == 'Monster':
                # First param is usually the name
                monster_name = params[0] if len(params) > 0 else 'Unknown'
                return f"inserting monster: {monster_name}"
            
            elif table == 'MonsterSpell':
                # Need to look up spell name from spellId (usually second param)
                if len(params) >= 2:
                    spell_id = params[1]
                    spell_name = self.get_spell_name(spell_id)
                    if spell_name:
                        return f"inserting monsterSpell: {spell_name}"
                    return f"inserting monsterSpell: (ID: {spell_id})"
            
            elif table == 'MonsterSkillMap':
                # Need to look up skill name from skillId (second param)
                if len(params) >= 2:
                    skill_id = params[1]
                    skill_name = self._get_skill_name(skill_id)
                    skill_subtype_id = params[2] if len(params) > 2 and params[2] else None
                    ranks = params[3] if len(params) > 3 else None
                    if skill_name:
                        subtype_text = f" ({skill_subtype_id})" if skill_subtype_id else ""
                        ranks_text = f" +{ranks}" if ranks else ""
                        return f"inserting MonsterSkillMap: {skill_name}{subtype_text}{ranks_text}"
                    return f"inserting MonsterSkillMap: (ID: {skill_id})"
            
            elif table == 'MonsterFeatMap':
                # Need to look up feat name from featId (second param)
                if len(params) >= 2:
                    feat_id = params[1]
                    feat_name = self._get_feat_name(feat_id)
                    notes = params[2] if len(params) > 2 and params[2] else None
                    if feat_name:
                        notes_text = f" ({notes})" if notes else ""
                        return f"inserting MonsterFeatMap: {feat_name}{notes_text}"
                    return f"inserting MonsterFeatMap: (ID: {feat_id})"
            
            elif table == 'MonsterSpecialAbility':
                # First param is usually the name
                ability_name = params[0] if len(params) > 0 else 'Unknown'
                return f"inserting monsterSpecialAbility: {ability_name}"
            
            elif table == 'MonsterExtraDescription':
                # Params: (monsterId, type, description)
                # Need to look up monster name from monsterId (first param)
                if len(params) >= 2:
                    monster_id = params[0]
                    desc_type = params[1]
                    # Get type name from enum
                    type_name = None
                    for type_key, type_id in MONSTER_EXTRA_DESCRIPTION_TYPE.items():
                        if type_id == desc_type:
                            type_name = type_key
                            break
                    # Try to get monster name (may not be available in dry-run)
                    monster_name = f"(ID: {monster_id})"
                    if not self.dry_run:
                        # Look up monster name
                        query = "SELECT name FROM Monster WHERE id = %s LIMIT 1"
                        result = self.execute(query, (monster_id,))
                        if result and len(result) > 0:
                            monster_name = result[0][0] if isinstance(result[0], (tuple, list)) else result[0]
                    return f"inserting MonsterExtraDescription: {monster_name} - {type_name or desc_type}"
            
            elif table == 'MonsterTypeMap':
                # Need to look up type name from typeId (usually second param)
                if len(params) >= 2:
                    type_id = params[1]
                    type_name = MONSTER_TYPE_ID_TO_NAME.get(type_id)
                    if type_name:
                        return f"inserting monsterType: {type_name}"
                    return f"inserting monsterType: (ID: {type_id})"
            
            elif table == 'MonsterSubtypeMap':
                # Need to look up subtype name from subtypeId (usually second param)
                if len(params) >= 2:
                    subtype_id = params[1]
                    subtype_name = MONSTER_SUBTYPE_ID_TO_NAME.get(subtype_id)
                    if subtype_name:
                        return f"inserting monsterSubtype: {subtype_name}"
                    return f"inserting monsterSubtype: (ID: {subtype_id})"
            
            elif table == 'MonsterAlternateSpeed':
                # Need to look up movement type name
                if len(params) >= 2:
                    movement_type_id = params[1]
                    movement_name = MOVEMENT_TYPE_ID_TO_NAME.get(movement_type_id)
                    speed = params[2] if len(params) > 2 else '?'
                    if movement_name:
                        return f"inserting monsterAlternateSpeed: {movement_name} {speed}"
                    return f"inserting monsterAlternateSpeed: (ID: {movement_type_id}) {speed}"
            
            elif table == 'MonsterArmorBreakdown':
                return "inserting monsterArmorBreakdown"
            
            elif table == 'MonsterExtraHitDie':
                if len(params) >= 3:
                    qty = params[1]
                    die_type = params[2]
                    return f"inserting monsterExtraHitDie: {qty}d{die_type}"
            
            elif table == 'MonsterPreparedSpellSlots':
                if len(params) >= 3:
                    level = params[1]
                    slots = params[2]
                    return f"inserting monsterPreparedSpellSlots: level {level} ({slots} slots)"
            
            elif table == 'MonsterSpecialAbilityMap':
                return "inserting monsterSpecialAbilityMap"
            
            # Default fallback
            return f"inserting {table}"
        except Exception as e:
            # If anything goes wrong formatting, just return None (don't break the insert)
            logger.debug(f"Error formatting insert log message: {e}")
            return None
    
    def _get_skill_name(self, skill_id: int) -> Optional[str]:
        """Get skill name by ID."""
        query = "SELECT name FROM Skill WHERE id = %s"
        result = self.execute(query, (skill_id,))
        if result:
            return result[0]['name']
        return None
    
    def _get_feat_name(self, feat_id: int) -> Optional[str]:
        """Get feat name by ID."""
        query = "SELECT name FROM Feat WHERE id = %s"
        result = self.execute(query, (feat_id,))
        if result:
            return result[0]['name']
        return None
    
    def _extract_table_name(self, query: str) -> str:
        """Extract table name from INSERT query."""
        match = re.search(r'INSERT\s+INTO\s+(\w+)', query, re.IGNORECASE)
        return match.group(1) if match else 'Unknown'
    
    def get_pending_inserts_summary(self) -> Dict[str, List[Dict]]:
        """Get summary of pending inserts grouped by table."""
        summary = {}
        for insert in self.pending_inserts:
            table = insert['table']
            if table not in summary:
                summary[table] = []
            summary[table].append({
                'query': insert['query'],
                'params': insert['params']
            })
        return summary
    
    def print_dry_run_summary(self, monster_name: str):
        """Print a detailed summary of what would be inserted for this monster."""
        if not self.dry_run or not self.pending_inserts:
            return
        
        logger.info("")
        logger.info("=" * 70)
        logger.info(f"DRY RUN SUMMARY: {monster_name}")
        logger.info("=" * 70)
        
        summary = self.get_pending_inserts_summary()
        total_rows = 0
        
        for table, inserts in sorted(summary.items()):
            total_rows += len(inserts)
            logger.info(f"\n📊 {table} ({len(inserts)} row(s)):")
            
            for i, insert in enumerate(inserts, 1):
                # Show detailed field information
                params = insert.get('params', [])
                query = insert.get('query', '')
                
                # Try to extract field names from query
                field_match = re.search(r'INSERT\s+INTO\s+\w+\s*\(([^)]+)\)', query, re.IGNORECASE)
                if field_match:
                    fields = [f.strip() for f in field_match.group(1).split(',')]
                    logger.info(f"  Row {i}:")
                    for field, value in zip(fields, params):
                        # Convert type/subtype IDs to names for better readability
                        display_value = value
                        if field == 'typeId' and isinstance(value, int):
                            type_name = MONSTER_TYPE_ID_TO_NAME.get(value)
                            if type_name:
                                display_value = f"{value} ({type_name})"
                        elif field == 'subtypeId' and isinstance(value, int):
                            subtype_name = MONSTER_SUBTYPE_ID_TO_NAME.get(value)
                            if subtype_name:
                                display_value = f"{value} ({subtype_name})"
                        elif field == 'abilityType' and isinstance(value, int):
                            ability_type_name = MONSTER_SPECIAL_ABILITY_TYPE_ID_TO_NAME.get(value)
                            if ability_type_name:
                                display_value = f"{value} ({ability_type_name})"
                        elif field == 'saveAbility' and isinstance(value, int):
                            ability_name = ABILITY_ID_TO_NAME.get(value)
                            if ability_name:
                                display_value = f"{value} ({ability_name})"
                        elif field == 'spellId' and isinstance(value, int):
                            # Look up spell name for better readability
                            spell_name = self.get_spell_name(value)
                            if spell_name:
                                display_value = f"{value} ({spell_name})"
                        # Truncate long text values for readability
                        elif isinstance(value, str) and len(value) > 100:
                            display_value = value[:100] + "..."
                        logger.info(f"    {field}: {display_value}")
                else:
                    # Fallback: just show params
                    logger.info(f"  Row {i}: {params}")
                # Extract field names from query
                query = insert['query']
                params = insert['params'] or []
                
                # Try to extract field names from INSERT statement
                field_match = re.search(r'INSERT\s+INTO\s+\w+\s*\(([^)]+)\)', query, re.IGNORECASE)
                if field_match and params:
                    field_names = [f.strip() for f in field_match.group(1).split(',')]
                    logger.info(f"  [{i}] Fields: {', '.join(field_names)}")
                    logger.info(f"      Values: {params}")
                else:
                    logger.info(f"  [{i}] {query}")
                    if params:
                        logger.info(f"      Params: {params}")
        
        logger.info("")
        logger.info(f"📈 Total operations: {total_rows} row(s) across {len(summary)} table(s)")
        logger.info("=" * 70)
        logger.info("")
        
        # Clear pending inserts for next monster
        self.pending_inserts = []
    
    def begin_transaction(self):
        """Begin a database transaction."""
        if self.in_transaction:
            raise RuntimeError("Transaction already in progress")
        if not self.dry_run:
            # Ensure autocommit is disabled for explicit transaction control
            if self.conn.autocommit:
                self.conn.autocommit = False
            # Check if there's an active transaction at the database level
            # If so, rollback first to ensure clean state
            try:
                # Try to start a transaction - if it fails, there's already one in progress
                self.conn.start_transaction()
            except Exception as e:
                error_str = str(e).lower()
                if "transaction already in progress" in error_str or "already in progress" in error_str:
                    logger.warning("Transaction already in progress at database level, rolling back first")
                    try:
                        self.conn.rollback()
                        # Reset our flag since we rolled back
                        self.in_transaction = False
                    except Exception as rollback_error:
                        logger.warning(f"Error during rollback: {rollback_error}")
                    # Now try to start the transaction again
                    self.conn.start_transaction()
                else:
                    raise
        self.in_transaction = True
        logger.debug("Transaction started" + (" (DRY RUN)" if self.dry_run else ""))
    
    def commit(self):
        """Commit transaction."""
        if not self.in_transaction:
            raise RuntimeError("No transaction in progress")
        if not self.dry_run:
            self.conn.commit()
        self.in_transaction = False
        logger.debug("Transaction committed" + (" (DRY RUN - no actual commit)" if self.dry_run else ""))
    
    def rollback(self):
        """Rollback transaction."""
        if self.in_transaction:
            if not self.dry_run:
                self.conn.rollback()
            self.in_transaction = False
            logger.debug("Transaction rolled back" + (" (DRY RUN - no actual rollback)" if self.dry_run else ""))
    
    def get_source_book_id(self, name: str) -> Optional[int]:
        """Get source book ID by name."""
        # D&D 3.5e Monster Manual has ID 44
        if name == 'Monster Manual':
            return 44
        query = "SELECT id FROM SourceBook WHERE name = %s AND editionId = %s"
        result = self.execute(query, (name, EDITION_ID_DND_3_5))
        if result:
            return result[0]['id']
        return None
    
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
    
    def get_spell_id(self, name: str) -> Optional[int]:
        """Get spell ID by name."""
        query = "SELECT id FROM Spell WHERE name = %s"
        result = self.execute(query, (name,))
        if result:
            return result[0]['id']
        return None
    
    def get_domain_id(self, name: str) -> Optional[int]:
        """Get domain ID by name."""
        query = "SELECT id FROM Domain WHERE name = %s"
        result = self.execute(query, (name,))
        if result:
            return result[0]['id']
        return None
    
    def get_spell_name(self, spell_id: int) -> Optional[str]:
        """Get spell name by ID."""
        query = "SELECT name FROM Spell WHERE id = %s"
        result = self.execute(query, (spell_id,))
        if result:
            return result[0]['name']
        return None
    
    def get_item_id(self, name: str) -> Optional[int]:
        """Get item ID by name."""
        query = "SELECT id FROM Item WHERE name = %s"
        result = self.execute(query, (name,))
        if result:
            return result[0]['id']
        return None
    
    def get_size_id(self, name: str) -> Optional[int]:
        """Get size ID by name."""
        # Size mapping from CommonData.ts
        size_map = {
            'Fine': 1,
            'Diminutive': 2,
            'Tiny': 3,
            'Small': 4,
            'Medium': 5,
            'Large': 6,
            'Huge': 7,
            'Gargantuan': 8,
            'Colossal': 9,
        }
        return size_map.get(name)
    
    def monster_exists(self, name: str) -> bool:
        """Check if a monster already exists in the database (case-insensitive)."""
        query = "SELECT id FROM Monster WHERE LOWER(name) = LOWER(%s) LIMIT 1"
        result = self.execute(query, (name,))
        return bool(result)
    
    def get_monster_id_by_name(self, name: str) -> Optional[int]:
        """Get monster ID by name (case-insensitive)."""
        query = "SELECT id FROM Monster WHERE LOWER(name) = LOWER(%s) LIMIT 1"
        result = self.execute(query, (name,))
        if result:
            return result[0]['id']
        return None
    
    def get_existing_monster_name(self, name: str) -> Optional[str]:
        """Get the actual name of an existing monster (case-insensitive lookup)."""
        query = "SELECT name FROM Monster WHERE LOWER(name) = LOWER(%s) LIMIT 1"
        result = self.execute(query, (name,))
        if result:
            return result[0]['name']
        return None
    
    def get_or_create_special_ability(self, name: str, description: Optional[str], ability_type: int, 
                                      effective_caster_level: Optional[int] = None, 
                                      save_ability: Optional[int] = None) -> int:
        """
        Get or create a special ability and return its ID.
        Handles deduplication by checking for existing abilities with same name, description, and type.
        """
        # Check if exists (deduplication logic)
        # For spell-like abilities, description might be None, so we need to handle that
        if description:
            query = "SELECT id FROM MonsterSpecialAbility WHERE name = %s AND description = %s AND abilityType = %s LIMIT 1"
            result = self.execute(query, (name, description, ability_type))
        else:
            query = "SELECT id FROM MonsterSpecialAbility WHERE name = %s AND description IS NULL AND abilityType = %s LIMIT 1"
            result = self.execute(query, (name, ability_type))
        
        if result:
            return result[0]['id']
        
        # Create new
        query = """
            INSERT INTO MonsterSpecialAbility (
                name, description, abilityType, effectiveCasterLevel, saveAbility
            ) VALUES (%s, %s, %s, %s, %s)
        """
        return self.execute_insert(query, (name, description, ability_type, effective_caster_level, save_ability), 
                                  table_name='MonsterSpecialAbility')
    
    def get_size_id(self, size_name: str) -> Optional[int]:
        """Get size ID by name."""
        size_map = {
            'Fine': 1, 'Diminutive': 2, 'Tiny': 3, 'Small': 4,
            'Medium': 5, 'Large': 6, 'Huge': 7, 'Gargantuan': 8, 'Colossal': 9
        }
        return size_map.get(size_name)
    
    def validate_type(self, type_name: str, monster_name: str) -> int:
        """Validate and return type ID, raising ImportError if not found."""
        type_id = MONSTER_TYPE_MAP.get(type_name)
        if type_id is None:
            line_number = None
            if self.file_content:
                line_number = find_line_number_for_text(self.file_content, type_name)
            raise ImportError(
                f"Unknown monster type '{type_name}'. This may be an OCR error or missing type.",
                monster_name=monster_name,
                field="Type",
                value=type_name,
                line_number=line_number
            )
        return type_id
    
    def validate_subtype(self, subtype_name: str, monster_name: str) -> int:
        """Validate and return subtype ID, raising ImportError if not found."""
        subtype_id = MONSTER_SUBTYPE_MAP.get(subtype_name)
        if subtype_id is None:
            line_number = None
            if self.file_content:
                line_number = find_line_number_for_text(self.file_content, subtype_name)
            raise ImportError(
                f"Unknown monster subtype '{subtype_name}'. This may be an OCR error or missing subtype.",
                monster_name=monster_name,
                field="Subtype",
                value=subtype_name,
                line_number=line_number
            )
        return subtype_id
    
    def validate_skill(self, skill_name: str, monster_name: str, source_text: str = None) -> int:
        """
        Validate and return skill ID, raising ImportError if not found.
        
        Args:
            skill_name: The skill name to validate
            monster_name: Monster name for error context
            source_text: Optional source text (e.g., full match from regex) for better line number tracking
        """
        skill_id = self.get_skill_id(skill_name)
        if skill_id is None:
            line_number = None
            if self.file_content:
                # Use source_text if provided (better for finding line numbers), otherwise use skill_name
                search_text = source_text if source_text else skill_name
                if search_text:
                    line_number = find_line_number_for_text(self.file_content, search_text)
            raise ImportError(
                f"Unknown skill '{skill_name}'. This may be an OCR error or missing skill in database.",
                monster_name=monster_name,
                field="Skill",
                value=skill_name,
                line_number=line_number
            )
        return skill_id
    
    def get_skill_subtype_id(self, skill_id: int, subtype_name: str) -> Optional[int]:
        """
        Get skill subtype ID by skill ID and subtype name.
        Handles Knowledge, Craft, Perform, and Profession skills.
        Uses hardcoded mappings based on static data enums.
        """
        # Get skill name from database
        skill_query = "SELECT name FROM Skill WHERE id = %s"
        skill_result = self.execute(skill_query, (skill_id,))
        if not skill_result:
            return None
        
        skill_name = skill_result[0]['name'].lower()
        subtype_lower = subtype_name.lower().strip()
        
        # Knowledge skill subtypes (from KnowledgeSkill enum)
        if skill_name == 'knowledge':
            knowledge_subtypes = {
                'arcana': 1,
                'architecture and engineering': 2,
                'dungeoneering': 3,
                'geography': 4,
                'history': 5,
                'local': 6,
                'nature': 7,
                'nobility and royalty': 8,
                'religion': 9,
                'the planes': 10,
            }
            return knowledge_subtypes.get(subtype_lower)
        
        # Craft skill subtypes (from CraftSkill enum)
        elif skill_name == 'craft':
            craft_subtypes = {
                'alchemy': 1,
                'armorsmithing': 2,
                'basketweaving': 3,
                'bookbinding': 4,
                'bowmaking': 5,
                'blacksmithing': 6,
                'calligraphy': 7,
                'carpentry': 8,
                'cobbling': 9,
                'gemcutting': 10,
                'glassblowing': 11,
                'leatherworking': 12,
                'locksmithing': 13,
                'painting': 14,
                'poisonmaking': 15,
                'pottery': 16,
                'sculpting': 17,
                'shipmaking': 18,
                'siege engines': 19,
                'stonemasonry': 20,
                'trapmaking': 21,
                'tattooing': 22,
                'weaponsmithing': 23,
                'weaving': 24,
            }
            return craft_subtypes.get(subtype_lower)
        
        # Perform and Profession use custom subtypes (stored in notes, not as IDs)
        elif skill_name in ['perform', 'profession']:
            return None
        
        return None
    
    def validate_feat(self, feat_name: str, monster_name: str) -> int:
        """Validate and return feat ID, raising ImportError if not found."""
        feat_id = self.get_feat_id(feat_name)
        if feat_id is None:
            line_number = None
            if self.file_content:
                line_number = find_line_number_for_text(self.file_content, feat_name)
            raise ImportError(
                f"Unknown feat '{feat_name}'. This may be an OCR error or missing feat in database.",
                monster_name=monster_name,
                field="Feat",
                value=feat_name,
                line_number=line_number
            )
        return feat_id
    
    def _normalize_spell_name_for_lookup(self, spell_name: str) -> List[str]:
        """
        Normalize a spell name and return a list of possible variations to try for lookup.
        
        Handles descriptor reversal (e.g., "mass enlarge" -> ["Enlarge, Mass", "Enlarge Person, Mass", ...])
        and other common variations.
        
        Args:
            spell_name: The spell name to normalize
            
        Returns:
            List of spell name variations to try (in order of preference)
        """
        variations = []
        spell_name_clean = spell_name.strip().rstrip('.,;:!?')
        
        # First, try the name as-is
        variations.append(spell_name_clean)
        
        # Try descriptor reversal
        for descriptor in SPELL_DESCRIPTORS:
            spell_lower = spell_name_clean.lower()
            if spell_lower.startswith(descriptor.lower() + ' '):
                base_spell_name = spell_name_clean[len(descriptor):].strip()
                
                # Basic reversed variants
                variations.extend([
                    f"{base_spell_name.title()}, {descriptor.capitalize()}",  # "Invisibility, Greater"
                    f"{base_spell_name}, {descriptor.capitalize()}",  # "invisibility, Greater"
                ])
                
                # Try adding common spell suffixes (e.g., "Person" for "Enlarge Person, Mass")
                common_suffixes = ['Person', 'Animal', 'Monster', 'Object']
                for suffix in common_suffixes:
                    variations.extend([
                        f"{base_spell_name.title()} {suffix}, {descriptor.capitalize()}",  # "Enlarge Person, Mass"
                        f"{base_spell_name} {suffix}, {descriptor.capitalize()}",  # "enlarge Person, Mass"
                    ])
                break  # Only process first matching descriptor
        
        return variations
    
    def validate_spell(self, spell_name: str, monster_name: str, context: str = None, source_html: str = None) -> Tuple[int, Optional[str], bool]:
        """
        Validate and return spell ID, modifier (if any), and is_domain_spell flag, raising ImportError if not found.
        
        Checks for spell modifiers (e.g., "empowered", "extended", "enlarged") and strips them
        if the base spell is found. Also handles domain spells (spells ending with '*').
        
        Args:
            spell_name: Spell name to validate
            monster_name: Monster name for error context
            context: Additional context about where this validation is happening (e.g., "Enslave ability", "Prepared spells")
            source_html: Source HTML/text where the spell name was found (for debugging)
        
        Returns:
            Tuple of (spell_id, modifier, is_domain_spell) where:
            - modifier is a comma-separated string of modifiers (e.g., "good, Domain spell") or None
            - is_domain_spell is True if the spell name ended with '*'
        """
        if not spell_name or not spell_name.strip():
            error_msg = "Empty spell name encountered. This is a parsing error in the import script."
            if context:
                error_msg += f" Context: {context}"
            if source_html:
                error_msg += f" Source text (first 200 chars): {source_html[:200]}"
            line_number = None
            if self.file_content and source_html:
                line_number = find_line_number_for_text(self.file_content, source_html[:100])
            raise ImportError(
                error_msg,
                monster_name=monster_name,
                field="Spell",
                value=spell_name or "(empty)",
                line_number=line_number
            )
        
        # Check for domain spell marker (*) - can be at end or before trailing punctuation
        spell_name_stripped = spell_name.strip()
        is_domain_spell = '*' in spell_name_stripped
        
        # Strip whitespace and trailing punctuation first (periods, commas, etc.)
        spell_name_clean = spell_name_stripped.rstrip('.,;:!?')
        
        # Strip domain spell marker (*) if present
        if is_domain_spell:
            spell_name_clean = spell_name_clean.rstrip('*')
        
        # Extract parenthetical modifiers (e.g., "(good)", "(evil)", "(lawful)")
        parenthetical_modifiers = []
        # Match parenthetical content at the end of the spell name
        paren_match = re.search(r'\(([^)]+)\)\s*$', spell_name_clean)
        if paren_match:
            parenthetical_modifiers.append(paren_match.group(1).strip())
            # Remove the parenthetical modifier from the spell name
            spell_name_clean = spell_name_clean[:paren_match.start()].strip()
        
        spell_id = self.get_spell_id(spell_name_clean)
        modifier = None
        
        # If spell not found, check for spell modifiers (e.g., "empowered lightning bolt")
        if spell_id is None:
            for modifier_name in SPELL_MODIFIERS:
                # Check if spell name starts with modifier (case-insensitive)
                if spell_name_clean.lower().startswith(modifier_name.lower() + ' '):
                    # Strip modifier and try again (also strip trailing punctuation from base spell)
                    base_spell_name = spell_name_clean[len(modifier_name):].strip().rstrip('.,;:!?')
                    base_spell_id = self.get_spell_id(base_spell_name)
                    if base_spell_id is not None:
                        spell_id = base_spell_id
                        modifier = modifier_name.lower()
                        logger.debug(f"Found spell modifier '{modifier}' for spell '{base_spell_name}' (original: '{spell_name_clean}')")
                        break
        
        # If spell still not found, try normalized variations (descriptor reversal, etc.)
        # Note: We don't store the descriptor in notes - the spell ID points to the correct Player's Handbook name
        if spell_id is None:
            variations = self._normalize_spell_name_for_lookup(spell_name_clean)
            # Skip the first variation (it's the original, which we already tried)
            for variation in variations[1:]:
                variation_id = self.get_spell_id(variation)
                if variation_id is not None:
                    spell_id = variation_id
                    logger.debug(f"Found spell using normalization: '{variation}' (original: '{spell_name_clean}')")
                    break
        
        if spell_id is None:
            error_msg = f"Unknown spell '{spell_name}'"
            if context:
                error_msg += f" in {context}"
            error_msg += ". This may be an OCR error or missing spell in database."
            if source_html:
                error_msg += f" Source text (first 200 chars): {source_html[:200]}"
            
            # Find line number in file content
            line_number = None
            if self.file_content:
                # Search for the spell name in the file content
                # If the spell name looks like it might be from descriptive text (contains "as the spells" or similar),
                # try to find it in context with surrounding text
                search_text = spell_name if len(spell_name) < 100 else spell_name[:100]
                
                # If source_html is provided, use it for better context
                if source_html and len(source_html) > 50:
                    # Try to find a unique part of the context
                    context_search = source_html[:100] if len(source_html) > 100 else source_html
                    line_number = find_line_number_for_text(self.file_content, context_search)
                
                # Fallback to spell name if context search didn't work
                if not line_number:
                    line_number = find_line_number_for_text(self.file_content, search_text)
            
            raise ImportError(
                error_msg,
                monster_name=monster_name,
                field="Spell",
                value=spell_name,
                line_number=line_number
            )
        
        # Combine all modifiers: parenthetical modifiers, spell modifiers (empowered, etc.), and domain spell
        all_modifiers = []
        if parenthetical_modifiers:
            all_modifiers.extend(parenthetical_modifiers)
        if modifier:
            all_modifiers.append(modifier)
        if is_domain_spell:
            all_modifiers.append("Domain spell")
        
        combined_modifier = ', '.join(all_modifiers) if all_modifiers else None
        
        return spell_id, combined_modifier, is_domain_spell
    
    def is_spell_name(self, text: str) -> bool:
        """Check if text is a spell name in the database (including descriptor reversal)."""
        # Strip trailing punctuation
        text_clean = text.strip().rstrip('.,;:!?')
        
        # Try all normalized variations
        variations = self._normalize_spell_name_for_lookup(text_clean)
        for variation in variations:
            spell_id = self.get_spell_id(variation)
            if spell_id is not None:
                return True
        
        return False
    
    def get_spell_name_for_link(self, text: str) -> Optional[str]:
        """
        Get the database spell name for creating a markdown link.
        Handles descriptor reversal (e.g., "greater invisibility" -> "Invisibility, Greater").
        
        Returns:
            The database spell name if found, None otherwise
        """
        # Strip trailing punctuation
        text_clean = text.strip().rstrip('.,;:!?')
        
        # Try all normalized variations, return the first match (prefer original if it matches)
        variations = self._normalize_spell_name_for_lookup(text_clean)
        for variation in variations:
            spell_id = self.get_spell_id(variation)
            if spell_id is not None:
                return variation  # Return the database spell name
        
        return None
    
    def get_all_spell_names(self) -> List[str]:
        """Get all spell names from database for text processing."""
        query = "SELECT name FROM Spell WHERE editionId = %s"
        result = self.execute(query, (EDITION_ID_DND_3_5,))
        return [row['name'] for row in result] if result else []
    
    def get_reference_table_slug(self, slug: str) -> Optional[str]:
        """Check if a reference table with the given slug exists."""
        query = "SELECT slug FROM ReferenceTable WHERE slug = %s LIMIT 1"
        result = self.execute(query, (slug,))
        if result:
            return result[0]['slug']
        return None
    
    def delete_reference_table(self, slug: str) -> None:
        """
        Delete a reference table and all its related data (columns, rows, cells).
        
        Args:
            slug: The table slug to delete
        """
        if self.dry_run:
            logger.debug(f"DRY RUN: Would delete reference table '{slug}' and all related data")
            return
        
        logger.debug(f"Deleting reference table '{slug}' and all related data...")
        
        # Delete in order to respect foreign key constraints
        # Delete cells first
        self.cursor.execute("DELETE FROM ReferenceTableCell WHERE tableSlug = %s", (slug,))
        
        # Delete rows
        self.cursor.execute("DELETE FROM ReferenceTableRow WHERE tableSlug = %s", (slug,))
        
        # Delete columns
        self.cursor.execute("DELETE FROM ReferenceTableColumn WHERE tableSlug = %s", (slug,))
        
        # Delete main table
        self.cursor.execute("DELETE FROM ReferenceTable WHERE slug = %s", (slug,))
        
        logger.debug(f"Deleted reference table '{slug}'")
    
    def create_reference_table(self, slug: str, name: str, description: Optional[str],
                              columns: List[Dict], rows: List[Dict]) -> None:
        """
        Create a reference table with columns, rows, and cells.
        
        Args:
            slug: Table slug (URL-friendly identifier)
            name: Table name
            description: Optional table description
            columns: List of column dicts with 'index', 'header', 'span' (optional), 'alignment' (optional)
            rows: List of row dicts with 'index' and 'cells' (list of cell dicts with 'columnIndex', 'value', 'colSpan' (optional), 'rowSpan' (optional))
        """
        # Insert main table
        query = "INSERT INTO ReferenceTable (slug, name, description) VALUES (%s, %s, %s)"
        self.execute_insert(query, (slug, name, description), table_name='ReferenceTable')
        
        # Insert columns
        for col in columns:
            query = """
                INSERT INTO ReferenceTableColumn (tableSlug, `index`, header, span, alignment)
                VALUES (%s, %s, %s, %s, %s)
            """
            self.execute_insert(query, (
                slug,
                col['index'],
                col['header'],
                col.get('span'),
                col.get('alignment')
            ), table_name='ReferenceTableColumn')
        
        # Insert rows and cells
        for row in rows:
            # Insert row
            query = "INSERT INTO ReferenceTableRow (tableSlug, `index`) VALUES (%s, %s)"
            self.execute_insert(query, (slug, row['index']), table_name='ReferenceTableRow')
            
            # Insert cells for this row
            for cell in row.get('cells', []):
                query = """
                    INSERT INTO ReferenceTableCell (tableSlug, columnIndex, rowIndex, value, colSpan, rowSpan)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """
                self.execute_insert(query, (
                    slug,
                    cell['columnIndex'],
                    row['index'],
                    cell.get('value'),
                    cell.get('colSpan'),
                    cell.get('rowSpan')
                ), table_name='ReferenceTableCell')


def generate_table_slug(table_name: str) -> str:
    """
    Generate a URL-friendly slug from a table name.
    
    Args:
        table_name: The table name (e.g., "Air Elemental Sizes", "GIANTS' BAGS")
    
    Returns:
        URL-friendly slug (lowercase, alphanumeric + hyphens only)
    """
    # Convert to lowercase
    slug = table_name.lower()
    
    # Replace spaces and special characters with hyphens
    slug = re.sub(r'[^\w\s-]', '', slug)  # Remove special chars except spaces and hyphens
    slug = re.sub(r'[\s_]+', '-', slug)  # Replace spaces and underscores with hyphens
    slug = re.sub(r'-+', '-', slug)  # Collapse multiple hyphens
    slug = slug.strip('-')  # Remove leading/trailing hyphens
    
    # Ensure it matches the regex: ^[a-z0-9-]+$
    slug = re.sub(r'[^a-z0-9-]', '', slug)
    
    # Limit to 100 characters (per schema constraint)
    if len(slug) > 100:
        slug = slug[:100].rstrip('-')
    
    # Ensure it's not empty
    if not slug:
        slug = 'table'
    
    return slug


def parse_table_from_tagged_section(table_content: str) -> Optional[Dict]:
    """
    Parse a table from a {TABLE}...{/TABLE} section.
    
    Format:
    - Title line (first line after {TABLE})
    - Optional subtitle/merged header row (may have mostly empty cells)
    - Header row with column names separated by |
    - Data rows with values separated by |
    
    Args:
        table_content: The content between {TABLE} and {/TABLE} tags
    
    Returns:
        Dict with 'title', 'name', 'columns', 'rows' or None if invalid
    """
    if not table_content:
        return None
    
    lines = [line.strip() for line in table_content.split('\n') if line.strip()]
    
    if len(lines) < 2:  # Need at least title + header + 1 data row
        return None
    
    # First line is always the title
    original_table_name = lines[0].strip()  # Keep original for pattern matching
    # Convert to proper Title Case for database storage
    table_name = to_proper_title_case(original_table_name)
    title = table_name
    
    # Check if second line is a subtitle/merged header row
    # Subtitle rows typically have mostly empty cells (like "     |       Whirlwind" or "         |  Vortex")
    line_idx = 1
    subtitle = None
    
    if line_idx < len(lines):
        second_line = lines[line_idx]
        second_parts = [p.strip() for p in second_line.split('|')]
        # Check if this looks like a subtitle (mostly empty cells)
        # Subtitle rows have many empty cells and typically only 1-2 non-empty cells
        non_empty_count = sum(1 for p in second_parts if p)
        total_parts = len(second_parts)
        # If we have multiple parts but most are empty, it's likely a subtitle
        if total_parts >= 2 and non_empty_count <= 2:
            # Likely a subtitle row - skip it
            subtitle = second_line
            line_idx += 1
    
    # Next line should be the header row
    if line_idx >= len(lines):
        return None
    
    header_line = lines[line_idx]
    header_parts = [p.strip() for p in header_line.split('|')]
    
    # Parse columns from header
    columns = []
    for idx, header in enumerate(header_parts):
        if header:  # Skip empty headers
            columns.append({
                'index': idx,
                'header': header,
                'span': None,
                'alignment': None  # Default to left
            })
    
    if not columns:
        return None
    
    # Parse data rows
    rows = []
    for row_idx, line in enumerate(lines[line_idx + 1:], start=0):
        row_parts = [p.strip() for p in line.split('|')]
        cells = []
        for col_idx, col in enumerate(columns):
            if col_idx < len(row_parts):
                cell_value = row_parts[col_idx] if row_parts[col_idx] else None
            else:
                cell_value = None
            cells.append({
                'columnIndex': col['index'],
                'value': cell_value,
                'colSpan': None,
                'rowSpan': None
            })
        
        # Only add rows that have at least one non-empty cell
        if any(cell['value'] for cell in cells):
            rows.append({
                'index': row_idx,
                'cells': cells
            })
    
    if not rows:
        return None
    
    return {
        'title': subtitle,  # Subtitle goes in description field
        'name': table_name,  # Title Case version for database
        'original_name': original_table_name,  # Original casing from source for pattern matching
        'columns': columns,
        'rows': rows
    }


def extract_tagged_section(content: str, tag_name: str) -> List[str]:
    """
    Extract all sections between {TAG} and {/TAG} from content.
    
    Args:
        content: The full file content as a string
        tag_name: The tag name (without braces), e.g., 'MAINMONSTER', 'VARIANT', 'STATBLOCK'
    
    Returns:
        List of extracted section contents (as strings)
    """
    pattern = rf'\{{{tag_name}\}}(.*?)\{{/{tag_name}\}}'
    matches = re.finditer(pattern, content, re.DOTALL)
    return [match.group(1).strip() for match in matches]


def extract_direct_child_tags(content: str, tag_name: str, exclude_nested_in: List[str] = None) -> List[str]:
    """
    Extract sections between {TAG} and {/TAG} that are direct children (not nested inside other specified tags).
    
    Args:
        content: The full file content as a string
        tag_name: The tag name (without braces), e.g., 'SA', 'STATBLOCK'
        exclude_nested_in: List of tag names to exclude from (e.g., ['VARIANT', 'CATEGORY', 'GROUP'])
                          If None, returns all tags (same as extract_tagged_section)
    
    Returns:
        List of extracted section contents (as strings) that are not nested in excluded tags
    """
    if exclude_nested_in is None:
        return extract_tagged_section(content, tag_name)
    
    # Find all positions of nested section boundaries
    nested_boundaries = []
    for nested_tag in exclude_nested_in:
        # Find all opening and closing tags
        open_pattern = rf'\{{{nested_tag}\}}'
        close_pattern = rf'\{{/{nested_tag}\}}'
        
        for match in re.finditer(open_pattern, content):
            nested_boundaries.append(('open', match.start(), nested_tag))
        for match in re.finditer(close_pattern, content):
            nested_boundaries.append(('close', match.end(), nested_tag))
    
    # Sort by position
    nested_boundaries.sort(key=lambda x: x[1])
    
    # Find all tags of the requested type
    pattern = rf'\{{{tag_name}\}}(.*?)\{{/{tag_name}\}}'
    all_matches = list(re.finditer(pattern, content, re.DOTALL))
    
    # Filter out tags that are inside nested sections
    direct_child_tags = []
    for match in all_matches:
        tag_start = match.start()
        
        # Check if this tag is inside any nested section by checking depth at tag_start
        is_nested = False
        depth = 0
        for boundary_type, pos, tag in nested_boundaries:
            if pos < tag_start:
                # Boundary is before our tag - update depth
                if boundary_type == 'open':
                    depth += 1
                elif boundary_type == 'close':
                    depth -= 1
        
        # If depth > 0 at tag_start, we're inside a nested section
        if depth > 0:
            is_nested = True
        
        if not is_nested:
            direct_child_tags.append(match.group(1).strip())
    
    return direct_child_tags


def parse_tagged_file(file_path: str) -> str:
    """Parse the tagged text file and return its content."""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    return content


def find_line_number_for_text(content: str, search_text: str, context_before: int = 5) -> Optional[int]:
    """
    Find the line number where a text snippet appears in the file content.
    
    Args:
        content: The full file content
        search_text: The text to search for (can be a substring)
        context_before: Number of lines before to include in search (for fuzzy matching)
    
    Returns:
        Line number (1-indexed) or None if not found
    """
    if not search_text:
        return None
    
    lines = content.split('\n')
    search_text_clean = search_text.strip()
    
    # Try exact match first
    for i, line in enumerate(lines, start=1):
        if search_text_clean in line:
            return i
    
    # Try fuzzy match - search for key parts of the text
    # Split search text into words and find line with most matches
    search_words = [w.strip() for w in search_text_clean.split() if len(w.strip()) > 2]
    if not search_words:
        return None
    
    best_match_line = None
    best_match_count = 0
    
    for i, line in enumerate(lines, start=1):
        match_count = sum(1 for word in search_words if word.lower() in line.lower())
        if match_count > best_match_count and match_count >= len(search_words) // 2:
            best_match_count = match_count
            best_match_line = i
    
    return best_match_line


def to_proper_title_case(text: str) -> str:
    """
    Convert text to proper Title Case, keeping prepositions, articles, and conjunctions lowercase
    unless they're the first word.
    
    Args:
        text: Text to convert
        
    Returns:
        Text in proper Title Case
    """
    # Words that should be lowercase in title case (unless first word)
    lowercase_words = {
        'a', 'an', 'the',  # Articles
        'as', 'at', 'by', 'for', 'from', 'in', 'of', 'on', 'to', 'with',  # Prepositions
        'and', 'but', 'or', 'nor',  # Conjunctions
    }
    
    words = text.split()
    if not words:
        return text
    
    result = []
    for i, word in enumerate(words):
        # Always capitalize first word
        if i == 0:
            result.append(word.capitalize())
        else:
            # Check if word (lowercase) is in the lowercase words set
            if word.lower() in lowercase_words:
                result.append(word.lower())
            else:
                result.append(word.capitalize())
    
    return ' '.join(result)


def process_extra_descriptions_from_section(section_content: str, monster_id: int, 
                                           db: DatabaseConnection, monster_name: str, update_existing: bool = False) -> None:
    """
    Process all extra description blocks from within a MAINMONSTER or VARIANT section.
    This relies on the tag structure - extra descriptions are extracted from the section
    they appear in, so we know which monster they belong to.
    
    Args:
        section_content: The content of a MAINMONSTER or VARIANT section
        monster_id: The ID of the monster this section belongs to
        db: DatabaseConnection instance
        monster_name: Name of the monster (for logging)
    """
    # Map of tag names to type names and type IDs
    # Note: CHARACTERS and ASCHARACTERS are different types:
    #   - CHARACTERS: Brief character information (uses 'Character' type, ID 3)
    #   - ASCHARACTERS: Detailed racial traits for player characters (uses 'AsCharacters' type, ID 8)
    extra_desc_configs = {
        'SIDEBAR': ('Sidebar', MONSTER_EXTRA_DESCRIPTION_TYPE['Sidebar']),
        'CHARACTERS': ('Character', MONSTER_EXTRA_DESCRIPTION_TYPE['Character']),
        'ASCHARACTERS': ('AsCharacters', MONSTER_EXTRA_DESCRIPTION_TYPE['AsCharacters']),
        'CREATING': ('Creating', MONSTER_EXTRA_DESCRIPTION_TYPE['Creating']),
        'SOCIETY': ('Society', MONSTER_EXTRA_DESCRIPTION_TYPE['Society']),
        'TACTICS': ('Tactics', MONSTER_EXTRA_DESCRIPTION_TYPE['Tactics']),
        'TRAINING': ('Training', MONSTER_EXTRA_DESCRIPTION_TYPE['Training']),
        'MOUNT': ('Mount', MONSTER_EXTRA_DESCRIPTION_TYPE['Mount']),
    }
    
    for tag_name, (type_name, desc_type) in extra_desc_configs.items():
        # Use extract_direct_child_tags to exclude nested VARIANT, CATEGORY, and GROUP sections
        # This prevents extracting extra descriptions that belong to child sections
        extra_desc_sections = extract_direct_child_tags(section_content, tag_name, exclude_nested_in=['VARIANT', 'CATEGORY', 'GROUP'])
        
        for extra_desc_content in extra_desc_sections:
            lines = extra_desc_content.strip().split('\n', 1)
            extra_desc_title = lines[0].strip() if lines else None
            
            if not extra_desc_title:
                logger.warning(f"Skipping {tag_name} block with no title in {monster_name}")
                continue
            
            # Convert title to proper Title Case (prepositions lowercase unless first word)
            extra_desc_title = to_proper_title_case(extra_desc_title)
            
            # Get the description text (everything after the title)
            extra_desc_body = lines[1].strip() if len(lines) > 1 else ''
            
            # Process for spell references first (preserving newlines)
            # The frontend will properly convert spell references within tables to spell links
            extra_desc_text = process_text_for_spell_references(extra_desc_body, db, preserve_newlines=True)
            
            # Process tables after spell references
            extra_desc_text, created_tables = process_tables_in_text(extra_desc_text, db, f"{monster_name} - {extra_desc_title}", update_existing=update_existing)
            if created_tables:
                logger.debug(f"Found {len(created_tables)} table(s) in {type_name} '{extra_desc_title}' for {monster_name}")
            
            description_text = f"### {extra_desc_title}\n\n{extra_desc_text}"
            query = """
                INSERT INTO MonsterExtraDescription (monsterId, type, description)
                VALUES (%s, %s, %s)
            """
            logger.debug(f"Inserting {type_name}: title='{extra_desc_title}', monster_id={monster_id}, type={desc_type}")
            db.execute_insert(query, (monster_id, desc_type, description_text), table_name='MonsterExtraDescription')
            logger.debug(f"Inserted {type_name} for '{extra_desc_title}' (monster: {monster_name}, ID: {monster_id}): type={desc_type}, length={len(description_text)}")


def replace_spell_names_with_markdown(text: str, db: DatabaseConnection, already_processed: Set[str] = None) -> str:
    """
    Replace spell names in text with markdown tags [spell:spellname].
    
    Processes plain text spell names (not already in markdown tags).
    
    Args:
        text: Text to process (plain text, no HTML)
        db: DatabaseConnection for spell lookups
        already_processed: Set of spell names already processed (to avoid double-processing)
    
    Returns:
        Text with spell names replaced by [spell:spellname] tags
    """
    if not text:
        return text
    
    if already_processed is None:
        already_processed = set()
    
    # Get all spell names from database (cache for performance)
    if not hasattr(replace_spell_names_with_markdown, '_spell_names_cache'):
        replace_spell_names_with_markdown._spell_names_cache = db.get_all_spell_names()
        # Sort by length (longest first) to match longer spell names first
        replace_spell_names_with_markdown._spell_names_cache.sort(key=len, reverse=True)
    
    spell_names = replace_spell_names_with_markdown._spell_names_cache
    result_text = text
    
    # Replace spell names (case-insensitive, whole word match)
    # Skip spell names that are already in markdown tags
    for spell_name in spell_names:
        if spell_name.lower() in already_processed:
            continue
        
        # Skip if already in markdown format
        if f'[spell:{spell_name}]' in result_text:
            continue
        
        # Escape special regex characters in spell name
        escaped_name = re.escape(spell_name)
        # Match whole word (word boundaries), case-insensitive
        # But don't match if it's already inside a markdown tag
        pattern = r'(?<!\[spell:)' + escaped_name + r'(?!\])'
        # Use word boundaries to avoid partial matches
        pattern = r'\b' + escaped_name + r'\b'
        
        # Replace with markdown tag
        result_text = re.sub(pattern, f'[spell:{spell_name}]', result_text, flags=re.IGNORECASE)
    
    # Also check for descriptor-prefixed spell names (e.g., "greater invisibility", "mass heal")
    # and convert them to the database format (e.g., "Invisibility, Greater", "Heal, Mass")
    for descriptor in SPELL_DESCRIPTORS:
        # Pattern to match descriptor + spell name (e.g., "greater invisibility", "mass heal")
        # Match whole words to avoid partial matches
        pattern = r'\b' + re.escape(descriptor) + r'\s+([a-z][a-z\s]+?)(?=\s|,|;|\.|$|\[spell:|\b)'
        matches = list(re.finditer(pattern, result_text, re.IGNORECASE))
        # Process matches in reverse order to maintain positions
        for match in reversed(matches):
            prefix_text = match.group(0).strip()
            base_spell_name = match.group(1).strip()
            
            # Skip if already processed or in a markdown tag
            if prefix_text.lower() in already_processed:
                continue
            if f'[spell:' in result_text[max(0, match.start()-10):match.end()+10]:
                continue
            
            # Try to find the reversed format in the database
            reversed_variants = [
                f"{base_spell_name.title()}, {descriptor.capitalize()}",  # "Invisibility, Greater"
                f"{base_spell_name}, {descriptor.capitalize()}",  # "invisibility, Greater"
            ]
            
            for reversed_name in reversed_variants:
                if db.get_spell_id(reversed_name) is not None:
                    # Replace with markdown link using database spell name
                    result_text = result_text[:match.start()] + f'[spell:{reversed_name}]' + result_text[match.end():]
                    already_processed.add(prefix_text.lower())
                    already_processed.add(reversed_name.lower())
                    break
    
    return result_text


def process_tables_in_text(text: str, db: DatabaseConnection, context_name: str = "text", update_existing: bool = False) -> Tuple[str, List[Dict]]:
    """
    Process text to detect tables in {TABLE}...{/TABLE} blocks, create reference tables, and replace with [table:slug] tags.
    
    Args:
        text: Text to process
        db: DatabaseConnection instance
        context_name: Name for context (e.g., monster name) for logging
        update_existing: If True, delete and recreate existing tables
    
    Returns:
        Tuple of (processed_text, list_of_created_tables)
    """
    if not text:
        return text, []
    
    created_tables = []
    
    # Extract all TABLE blocks
    table_sections = extract_tagged_section(text, 'TABLE')
    
    if not table_sections:
        return text, []
    
    # Process each table
    for table_content in table_sections:
        table_data = parse_table_from_tagged_section(table_content)
        
        if not table_data:
            logger.warning(f"Failed to parse table in {context_name}")
            continue
        
        table_name = table_data['name']  # Title Case version for database
        original_table_name = table_data.get('original_name', table_name)  # Original casing from source for pattern matching
        slug = generate_table_slug(table_name)
        
        # Check if table already exists
        existing_slug = db.get_reference_table_slug(slug)
        if existing_slug:
            if update_existing:
                # Delete existing table and recreate it
                logger.debug(f"Reference table '{slug}' already exists, deleting and recreating (update mode)")
                db.delete_reference_table(slug)
            else:
                logger.debug(f"Reference table '{slug}' already exists, reusing it")
        
        # Create the reference table (or recreate if it was deleted)
        if not existing_slug or update_existing:
            if not db.dry_run:
                db.create_reference_table(
                    slug=slug,
                    name=table_name,
                    description=table_data.get('title'),
                    columns=table_data['columns'],
                    rows=table_data['rows']
                )
                if update_existing:
                    logger.info(f"Recreated reference table: {table_name} (slug: {slug})")
                else:
                    logger.info(f"Created reference table: {table_name} (slug: {slug})")
            else:
                if update_existing:
                    logger.info(f"DRY RUN: Would delete and recreate reference table: {table_name} (slug: {slug})")
                else:
                    logger.info(f"DRY RUN: Would create reference table: {table_name} (slug: {slug})")
                logger.info(f"  Columns: {len(table_data['columns'])}")
                logger.info(f"  Rows: {len(table_data['rows'])}")
                # In dry-run, show the markdown tag that would be inserted
                logger.info(f"  Markdown tag: [table: {slug}]")
            
            created_tables.append({
                'slug': slug,
                'name': table_name,
                'title': table_data.get('title'),
                'columns': len(table_data['columns']),
                'rows': len(table_data['rows'])
            })
        
        # Replace the entire {TABLE}...{/TABLE} block with the markdown tag
        # Match by original table name (before Title Case conversion) to find the right block
        # Use original_table_name for pattern matching since the source text hasn't been converted
        original_table_name_escaped = re.escape(original_table_name)
        # Pattern: {TABLE} followed by optional whitespace/newlines, then the original table name, then everything until {/TABLE}
        table_block_pattern = rf'\{{TABLE\}}\s*{original_table_name_escaped}.*?\{{/TABLE\}}'
        text, replacement_count = re.subn(table_block_pattern, f'[table: {slug}]', text, flags=re.DOTALL)
        if replacement_count == 0:
            logger.warning(f"Could not replace table block for '{table_name}' in {context_name}")
        elif replacement_count > 1:
            logger.warning(f"Multiple table blocks replaced for '{table_name}' in {context_name} (expected 1, found {replacement_count})")
    
    return text, created_tables


def process_text_for_spell_references(text: str, db: DatabaseConnection, process_plain_text: bool = False, preserve_newlines: bool = False) -> str:
    """
    Process plain text to replace spell names with markdown tags.
    
    Processes spell names in plain text and replaces them with [spell:spellname] tags.
    Normalizes whitespace - collapses multiple spaces/newlines to single space (unless preserve_newlines=True).
    
    Args:
        text: Plain text to process
        db: DatabaseConnection for spell lookups
        process_plain_text: If True, processes spell names in plain text.
                           Should only be True for "Typical XX Spells Prepared" blocks.
                           Default False to avoid false positives (e.g., "affliction" in regular text).
        preserve_newlines: If True, preserves newlines and only normalizes multiple spaces to single space.
                          If False, collapses all whitespace (spaces/newlines) to single space.
    
    Returns:
        Text with spell names replaced by [spell:spellname] tags, normalized whitespace
    """
    if not text:
        return ''
    
    already_processed = set()
    
    # Normalize whitespace
    if preserve_newlines:
        # Preserve newlines: only collapse multiple spaces to single space, keep newlines
        text = re.sub(r'[ \t]+', ' ', text)  # Collapse spaces/tabs but keep newlines
    else:
        # Normalize all whitespace: collapse multiple spaces/newlines to single space
        text = re.sub(r'\s+', ' ', text)
    
    # Process plain text spell names if requested
    if process_plain_text:
        text = replace_spell_names_with_markdown(text, db, already_processed)
    
    return text.strip()


def extract_text_content(text: str) -> str:
    """Extract and normalize text content, preserving structure."""
    # Normalize whitespace but preserve paragraph breaks (double newlines)
    text = re.sub(r'[ \t]+', ' ', text)  # Collapse spaces/tabs
    text = re.sub(r'\n\s*\n', '\n\n', text)  # Normalize paragraph breaks
    return text.strip()


def clean_variant_name(variant_name: str, base_monster_name: str) -> str:
    """
    Clean variant name by removing base monster name prefix if present.
    
    If variant name is "BaseName, VariantName", strips "BaseName, " to get "VariantName".
    Special case: If "VariantName" is just a size (Tiny, Small, Medium, Large, Huge, Gargantuan, Colossal),
    keeps the full "BaseName, VariantName" format.
    Also handles "SAMPLE XXX" format where XXX matches the base monster name - strips "Sample" prefix.
    If variant name has no comma or doesn't start with base name, returns as-is.
    
    Args:
        variant_name: The variant name to clean
        base_monster_name: The base monster name
    
    Returns:
        Cleaned variant name
    """
    if not variant_name or not base_monster_name:
        return variant_name
    
    # Check for "SAMPLE XXX" format where XXX matches the base monster name
    variant_upper = variant_name.upper()
    base_upper = base_monster_name.upper()
    
    # Pattern: "SAMPLE GHOST" where "GHOST" matches base monster name
    if variant_upper.startswith('SAMPLE '):
        remaining = variant_upper[7:].strip()  # "SAMPLE " is 7 chars
        if remaining == base_upper:
            # The rest matches the base monster name, so remove "Sample" prefix
            # Preserve original case of the base name
            return base_monster_name
    
    # Check if variant name contains a comma and starts with base name
    if ',' in variant_name:
        # Check if it starts with the base name (case-insensitive)
        if variant_upper.startswith(base_upper):
            # Find the comma after the base name
            # Handle case where base name might be followed by comma and space
            prefix_pattern = base_upper + ','
            if variant_upper.startswith(prefix_pattern):
                # Extract everything after "BaseName, "
                remaining = variant_name[len(base_monster_name):]
                variant_part = None
                if remaining.startswith(', '):
                    variant_part = remaining[2:].strip()
                elif remaining.startswith(','):
                    variant_part = remaining[1:].strip()
                
                if variant_part:
                    # Check if variant part is just a size
                    # Sizes: Tiny, Small, Medium, Large, Huge, Gargantuan, Colossal
                    sizes = ['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan', 'Colossal']
                    if variant_part in sizes or variant_part.upper() in [s.upper() for s in sizes]:
                        # Keep the full "BaseName, Size" format
                        return variant_name
                    
                    # Check if variant part is a level indicator (e.g., "1st-Level Warrior", "10th-Level Wizard")
                    # Pattern: starts with ordinal number (1st, 2nd, 3rd, 4th, etc.) followed by "-Level" and a class name
                    level_pattern = r'^\d+[a-z]{0,2}-Level\s+\w+'
                    if re.match(level_pattern, variant_part, re.IGNORECASE):
                        # This is a level indicator, keep the full "BaseName, Level" format
                        return variant_name
                    
                    # Not a size or level indicator, strip the base name
                    return variant_part
    
    # No comma or doesn't start with base name - return as-is
    return variant_name


def normalize_monster_name(name: str) -> str:
    """
    Normalize monster name to title case (first letter of each word capitalized).
    Handles special cases like "10th-Level" and preserves existing proper case.
    
    Args:
        name: The monster name (may be all caps)
    
    Returns:
        Normalized name in title case
    """
    if not name:
        return name
    
    # If already in mixed case (not all caps or all lowercase), preserve it
    if name != name.upper() and name != name.lower():
        return name
    
    # Convert to title case, but handle special cases
    # Split on spaces and capitalize each word
    words = name.split()
    normalized_words = []
    
    for word in words:
        # Handle ordinal numbers like "10th-Level" -> "10th-Level" (preserve hyphenated)
        if '-' in word:
            parts = word.split('-')
            normalized_parts = [part.capitalize() for part in parts]
            normalized_words.append('-'.join(normalized_parts))
        else:
            normalized_words.append(word.capitalize())
    
    return ' '.join(normalized_words)


def is_statblock_label(text: str) -> bool:
    """Check if text is a statblock label."""
    text = text.strip().rstrip(':').strip()
    return text in STATBLOCK_LABELS


def parse_statblock_value(value: str) -> Optional[str]:
    """Parse a statblock value, returning None for empty/placeholder values."""
    if not value:
        return None
    value = value.strip()
    if value in ['--', '_', '—', '—']:
        return None
    return value if value else None


def parse_speed(speed_text: str) -> Tuple[Optional[int], List[Dict]]:
    """
    Parse speed text into base speed and alternate speeds.
    
    Returns:
        Tuple of (base_speed, alternate_speeds_list)
        - base_speed: Int (land speed, can be 0 for creatures with no land movement)
        - alternate_speeds_list: List of dicts with 'movementTypeId', 'speed', 'maneuverability' (nullable Int, references ManeuverabilityId enum)
    
    Examples:
        "30 ft. (6 squares)" -> (30, [])
        "Fly 60 ft. (perfect)" -> (0, [{'movementTypeId': 2, 'speed': 60, 'maneuverability': 1}])
        "40 ft. (8 squares), fly 90 ft. (good)" -> (40, [{'movementTypeId': 2, 'speed': 90, 'maneuverability': 2}])
        "30 ft. (6 squares), climb 20 ft., swim 15 ft." -> (30, [{'movementTypeId': 4, 'speed': 20, 'maneuverability': None}, {'movementTypeId': 3, 'speed': 15, 'maneuverability': None}])
    """
    if not speed_text:
        return None, []
    
    # Use global MOVEMENT_TYPE_MAP
    
    # Maneuverability mapping (matches ManeuverabilityId enum)
    maneuverability_map = {
        'perfect': 1,
        'good': 2,
        'average': 3,
        'poor': 4,
        'clumsy': 5,
    }
    
    base_speed = None
    alternate_speeds = []
    
    # Check if it starts with a movement type (e.g., "Fly 60 ft." or "Swim 40 ft.")
    # If so, there's no land speed
    starts_with_type = re.match(r'^(fly|swim|climb|burrow)\s+(\d+)\s*ft\.(?:\s*\(([^)]+)\))?', speed_text, re.IGNORECASE)
    if starts_with_type:
        # No land speed, starts with alternate movement
        base_speed = 0
        movement_type = starts_with_type.group(1).lower()
        speed_value = int(starts_with_type.group(2))
        maneuverability_str = starts_with_type.group(3)
        
        maneuverability = None
        if movement_type == 'fly' and maneuverability_str:
            maneuverability = maneuverability_map.get(maneuverability_str.lower())
        
        alternate_speeds.append({
            'movementTypeId': MOVEMENT_TYPE_MAP[movement_type],
            'speed': speed_value,
            'maneuverability': maneuverability
        })
        
        # Check for additional speeds after comma
        remaining = speed_text[starts_with_type.end():].strip()
        if remaining.startswith(','):
            remaining = remaining[1:].strip()
            # Parse remaining speeds (they're all alternate)
            _, additional_speeds = parse_speed(remaining)
            alternate_speeds.extend(additional_speeds)
    else:
        # Has land speed (or starts with number)
        # Extract land speed (first number before ft., may have parentheses after)
        land_match = re.search(r'^(\d+)\s*ft\.', speed_text)
        if land_match:
            base_speed = int(land_match.group(1))
        
        # Extract all alternate speeds (fly, swim, climb, burrow)
        # Pattern: ", fly 60 ft. (good)" or "fly 60 ft. (good)" or ", swim 40 ft." etc.
        for movement_type, type_id in MOVEMENT_TYPE_MAP.items():
            if movement_type == 'land':
                continue  # Skip land, already handled
            
            # Pattern: ", fly 60 ft. (good)" or "fly 60 ft. (good)" or "Fly 60 ft. (perfect)"
            # Match the movement type word, then speed, then optional maneuverability in parentheses
            pattern = rf'{movement_type}\s+(\d+)\s*ft\.(?:\s*\(([^)]+)\))?'
            matches = re.finditer(pattern, speed_text, re.IGNORECASE)
            for match in matches:
                speed_value = int(match.group(1))
                maneuverability = None
                if movement_type == 'fly' and match.group(2):
                    maneuverability_str = match.group(2).lower()
                    maneuverability = maneuverability_map.get(maneuverability_str)
                
                alternate_speeds.append({
                    'movementTypeId': type_id,
                    'speed': speed_value,
                    'maneuverability': maneuverability
                })
    
    return base_speed, alternate_speeds


def parse_ac_breakdown(ac_text: str) -> Tuple[Optional[int], Optional[int], Optional[int], List[Dict]]:
    """Parse AC text into base AC, touch AC, flat-footed AC, and breakdown components."""
    # Pattern: "15 (+2 Dex, +3 natural), touch 14, flat-footed 12"
    base_ac = None
    touch_ac = None
    flat_footed_ac = None
    breakdown = []
    
    # Extract base AC (first number)
    base_match = re.search(r'^(\d+)', ac_text)
    if base_match:
        base_ac = int(base_match.group(1))
    
    # Extract touch AC (can be negative)
    touch_match = re.search(r'touch\s+([+-]?\d+)', ac_text, re.IGNORECASE)
    if touch_match:
        touch_ac = int(touch_match.group(1))
    
    # Extract flat-footed AC (can be negative)
    flat_match = re.search(r'flat-footed\s+([+-]?\d+)', ac_text, re.IGNORECASE)
    if flat_match:
        flat_footed_ac = int(flat_match.group(1))
    
    # Parse breakdown components (in parentheses)
    breakdown_match = re.search(r'\(([^)]+)\)', ac_text)
    if breakdown_match:
        breakdown_text = breakdown_match.group(1)
        # Parse components like "+2 Dex", "+3 natural", "-1 size"
        component_pattern = r'([+-]?\d+)\s+(\w+)'
        for match in re.finditer(component_pattern, breakdown_text):
            value = int(match.group(1))
            component_name = match.group(2).lower()
            
            if component_name in ['natural', 'armor']:
                breakdown.append({
                    'type': MONSTER_ARMOR_COMPONENT_TYPE['NaturalArmor'],
                    'value': value,
                    'equipment_item_id': None,
                    'description': None
                })
            elif component_name in ['size', 'dex', 'dexterity']:
                # These are derivable, skip
                pass
            else:
                # Other component
                breakdown.append({
                    'type': MONSTER_ARMOR_COMPONENT_TYPE['Other'],
                    'value': value,
                    'equipment_item_id': None,
                    'description': component_name
                })
    
    return base_ac, touch_ac, flat_footed_ac, breakdown


def parse_abilities(abilities_text: str) -> Dict[str, Optional[int]]:
    """Parse abilities text into individual scores."""
    abilities = {
        'strength': None,
        'dexterity': None,
        'constitution': None,
        'intelligence': None,
        'wisdom': None,
        'charisma': None
    }
    
    # Pattern: "Str 22, Dex 18, Con 18, Int 18, Wis 18, Cha 20"
    ability_pattern = r'(Str|Dex|Con|Int|Wis|Cha)\s+(\d+|--)'
    for match in re.finditer(ability_pattern, abilities_text, re.IGNORECASE):
        ability_name = match.group(1).lower()
        value_str = match.group(2)
        
        if value_str == '--':
            value = None
        else:
            try:
                value = int(value_str)
            except ValueError:
                value = None
        
        ability_map = {
            'str': 'strength',
            'dex': 'dexterity',
            'con': 'constitution',
            'int': 'intelligence',
            'wis': 'wisdom',
            'cha': 'charisma'
        }
        
        if ability_name in ability_map:
            abilities[ability_map[ability_name]] = value
    
    return abilities


def parse_saves(saves_text: str) -> Dict[str, Optional[int]]:
    """Parse saves text into individual save values."""
    saves = {
        'fort': None,
        'ref': None,
        'will': None
    }
    
    # Pattern: "Fort +14 (+18 against poison), Ref +12, Will +12"
    save_pattern = r'(Fort|Ref|Will)\s*\+?(-?\d+)'
    for match in re.finditer(save_pattern, saves_text, re.IGNORECASE):
        save_name = match.group(1).lower()
        value = int(match.group(2))
        
        if save_name.startswith('fort'):
            saves['fort'] = value
        elif save_name.startswith('ref'):
            saves['ref'] = value
        elif save_name.startswith('will'):
            saves['will'] = value
    
    return saves


def parse_space_reach(space_reach_text: str) -> Tuple[Optional[float], Optional[int], Optional[int], Optional[str]]:
    """
    Parse space/reach text into values (in feet).
    
    Returns:
        Tuple of (space, reach, optional_reach, optional_reach_description)
        - space: Float (can be fractional, e.g., 2.5 for 2-1/2 ft.)
        - reach: Int (standard reach)
        - optional_reach: Int (optional reach for specific attacks)
        - optional_reach_description: String (e.g., "with bite", "with tentacle")
    
    Examples:
        "5 ft./5 ft." -> (5.0, 5, None, None)
        "10 ft./5 ft." -> (10.0, 5, None, None)
        "2-1/2 ft./0 ft." -> (2.5, 0, None, None)
        "2-1/2 ft./0 ft. (5 ft. with bite)" -> (2.5, 0, 5.0, "with bite")
        "10 ft./10 ft. (15 ft. with tentacle)" -> (10.0, 10, 15.0, "with tentacle")
        "15 ft./10 ft. (bite 15 ft.)" -> (15.0, 10, 15.0, "bite")
    """
    if not space_reach_text:
        return None, None, None, None
    
    space = None
    reach = None
    optional_reach = None
    optional_reach_description = None
    
    # Extract optional reach from parentheses: "(5 ft. with bite)" or "(bite 15 ft.)"
    optional_match = re.search(r'\(([^)]+)\)', space_reach_text)
    if optional_match:
        optional_text = optional_match.group(1).strip()
        # Pattern: "5 ft. with bite" or "bite 15 ft." or "15 ft. with tentacle"
        # Try pattern: "X ft. with Y"
        with_match = re.search(r'(\d+)\s*ft\.\s+with\s+(.+)', optional_text, re.IGNORECASE)
        if with_match:
            optional_reach = int(with_match.group(1))
            optional_reach_description = f"with {with_match.group(2).strip()}"
        else:
            # Try pattern: "Y X ft." (e.g., "bite 15 ft.")
            attack_match = re.search(r'(\w+)\s+(\d+)\s*ft\.', optional_text, re.IGNORECASE)
            if attack_match:
                optional_reach_description = attack_match.group(1).strip()
                optional_reach = int(attack_match.group(2))
            else:
                # Try just "X ft." (fallback)
                simple_match = re.search(r'(\d+)\s*ft\.', optional_text, re.IGNORECASE)
                if simple_match:
                    optional_reach = int(simple_match.group(1))
                    optional_reach_description = "special"
    
    # Remove optional reach from text for parsing base space/reach
    space_reach_clean = re.sub(r'\([^)]+\)', '', space_reach_text).strip()
    
    # Pattern: "5 ft./5 ft." or "10 ft./5 ft." or "2-1/2 ft./0 ft."
    # Split by "/" to separate space and reach
    parts = space_reach_clean.split('/')
    if len(parts) >= 1:
        # Extract space (first part)
        space_match = re.search(r'([\d\-]+(?:\s*[\d/]+)?)\s*ft\.', parts[0], re.IGNORECASE)
        if space_match:
            space_str = space_match.group(1).strip()
            # Handle fractional like "2-1/2" -> 2.5
            if '-' in space_str and '/' in space_str:
                # Pattern: "2-1/2"
                fractional_parts = space_str.split('-')
                whole = int(fractional_parts[0])
                fraction_part = fractional_parts[1]
                fraction_match = re.match(r'(\d+)/(\d+)', fraction_part)
                if fraction_match:
                    numerator = int(fraction_match.group(1))
                    denominator = int(fraction_match.group(2))
                    space = whole + (numerator / denominator)  # Keep as float
            else:
                # Whole number
                try:
                    space = float(space_str)
                except ValueError:
                    pass
    
    if len(parts) >= 2:
        # Extract reach (second part)
        reach_match = re.search(r'(\d+)\s*ft\.', parts[1], re.IGNORECASE)
        if reach_match:
            try:
                reach = int(reach_match.group(1))
            except ValueError:
                pass
    
    return space, reach, optional_reach, optional_reach_description


def parse_hit_dice(hit_dice_text: str) -> Tuple[Optional[float], Optional[int], Optional[int], Optional[int], List[Dict]]:
    """
    Parse hit dice text into primary hit dice and extra hit dice.
    
    Returns:
        Tuple of (qty, type, bonus_hp, average_hp, extra_hit_dice_list)
        extra_hit_dice_list contains dicts with 'qty' (float), 'type', 'bonus_hp'
        qty can be fractional (e.g., 0.5 for 1/2 HD, 0.33 for 1/3 HD)
    
    Examples:
        "4d8+4 (22 hp)" -> (4.0, 2, 4, 22, [])
        "6d8+18 plus 11d10+33" -> (6.0, 2, 18, None, [{'qty': 11.0, 'type': 3, 'bonus_hp': 33}])
        "1/2 d8 (2 hp)" -> (0.5, 2, 0, 2, [])  # Fractional die stored as 0.5
        "1/3 d6 (1 hp)" -> (0.333, 1, 0, 1, [])  # Fractional die stored as 0.333
    """
    if not hit_dice_text:
        return None, None, None, None, []
    
    # Dice type mapping (matches RpgDice enum)
    dice_type_map = {
        'd2': 7, 'd3': 8, 'd4': 0, 'd6': 1, 'd8': 2,
        'd10': 3, 'd12': 4, 'd20': 5, 'd100': 6
    }
    
    # Extract average HP if present: "4d8+4 (22 hp)"
    average_hp = None
    hp_match = re.search(r'\((\d+)\s*hp\)', hit_dice_text, re.IGNORECASE)
    if hp_match:
        average_hp = int(hp_match.group(1))
    
    # Remove average HP from text for parsing
    hit_dice_clean = re.sub(r'\([^)]*\)', '', hit_dice_text).strip()
    
    # Split by "plus" to handle multiple sets: "6d8+18 plus 11d10+33"
    parts = re.split(r'\s+plus\s+', hit_dice_clean, flags=re.IGNORECASE)
    
    primary_qty = None
    primary_type = None
    primary_bonus = None
    extra_hit_dice = []
    
    for i, part in enumerate(parts):
        part = part.strip()
        if not part:
            continue
        
        # Pattern: "4d8+4" or "1/2 d8" or "11d10+33" or "1/3 d6"
        # Handle fractional dice like "1/2 d8" or "1/3 d6"
        fractional_match = re.match(r'(\d+)/(\d+)\s*([d]\d+)', part)
        if fractional_match:
            numerator = int(fractional_match.group(1))
            denominator = int(fractional_match.group(2))
            dice_str = fractional_match.group(3).lower()
            
            # Calculate fractional value
            fractional_qty = numerator / denominator
            dice_type = dice_type_map.get(dice_str)
            
            if dice_type is None:
                logger.warning(f"Unknown dice type: {dice_str} in '{hit_dice_text}'")
                continue
            
            if i == 0:
                primary_qty = fractional_qty
                primary_type = dice_type
                primary_bonus = 0
            else:
                extra_hit_dice.append({
                    'qty': fractional_qty,
                    'type': dice_type,
                    'bonus_hp': 0
                })
            continue
        
        # Pattern: "4d8+4" or "11d10+33"
        match = re.match(r'(\d+)([d]\d+)(?:\+(\d+))?', part, re.IGNORECASE)
        if match:
            qty = float(match.group(1))  # Store as float for consistency
            dice_str = match.group(2).lower()
            bonus = int(match.group(3)) if match.group(3) else 0
            dice_type = dice_type_map.get(dice_str)
            
            if dice_type is None:
                logger.warning(f"Unknown dice type: {dice_str} in '{hit_dice_text}'")
                continue
            
            if i == 0:
                # Primary hit dice
                primary_qty = qty
                primary_type = dice_type
                primary_bonus = bonus
            else:
                # Extra hit dice
                extra_hit_dice.append({
                    'qty': qty,
                    'type': dice_type,
                    'bonus_hp': bonus
                })
    
    return primary_qty, primary_type, primary_bonus, average_hp, extra_hit_dice


def parse_type_and_subtypes(type_text: str, db: DatabaseConnection, monster_name: str) -> Tuple[List[int], List[int]]:
    """Parse type and subtypes from type line with validation."""
    types = []
    subtypes = []
    
    # Pattern: "Medium Outsider (Angel, Extraplanar, Good)" or "Large Magical Beast"
    # Try to match all known types (check multi-word types first, then single-word)
    # Build a list of all type names sorted by length (longest first) to match multi-word types first
    all_type_names = list(MONSTER_TYPE_MAP.keys())
    all_type_names.sort(key=len, reverse=True)  # Longest first (e.g., "Magical Beast" before "Magical")
    
    # Find all types in the type line (both before and after parentheses)
    # First, find types in the main part (before parentheses)
    main_part = type_text.split('(')[0].strip()  # Everything before the first parenthesis
    for type_name in all_type_names:
        # Case-insensitive word boundary match
        pattern = rf'\b{re.escape(type_name)}\b'
        match = re.search(pattern, main_part, re.IGNORECASE)
        if match:
            type_id = db.validate_type(type_name, monster_name)
            if type_id not in types:
                types.append(type_id)
    
    # Extract subtypes from parentheses, and also check for types in "Augmented X" patterns
    subtypes_match = re.search(r'\(([^)]+)\)', type_text)
    if subtypes_match:
        subtypes_text = subtypes_match.group(1)
        for subtype in subtypes_text.split(','):
            subtype = subtype.strip()
            if subtype:
                # Handle "Augmented X" format where X is the original type
                # e.g., "Augmented Magical Beast" -> subtype "Augmented" AND type "Magical Beast"
                augmented_match = re.match(r'Augmented\s+(.+)', subtype, re.IGNORECASE)
                if augmented_match:
                    # Extract "Augmented" as the subtype
                    subtype_id = db.validate_subtype('Augmented', monster_name)
                    subtypes.append(subtype_id)
                    # Also extract the original type (e.g., "Magical Beast", "Humanoid")
                    original_type_text = augmented_match.group(1).strip()
                    for type_name in all_type_names:
                        pattern = rf'\b{re.escape(type_name)}\b'
                        match = re.search(pattern, original_type_text, re.IGNORECASE)
                        if match:
                            type_id = db.validate_type(type_name, monster_name)
                            if type_id not in types:
                                types.append(type_id)
                            break
                else:
                    # Normal subtype
                    subtype_id = db.validate_subtype(subtype, monster_name)
                    subtypes.append(subtype_id)
    
    return types, subtypes


def split_spell_list_from_description(text: str) -> Tuple[str, str]:
    """
    Split spell-like abilities text into spell list and descriptive text.
    
    The spell list is always on the first line.
    All subsequent lines are treated as descriptive text.
    
    Format:
    {SA}
    Spell-Like Abilities:
        the spell list (at-will, 1/day, etc)  <- first line
        descriptive text                      <- subsequent lines
        maybe more descriptive text           <- subsequent lines
    {/SA}
    
    Args:
        text: Full text of the spell-like abilities block
        
    Returns:
        Tuple of (spell_list_text, descriptive_text)
    """
    lines = text.split('\n')
    
    if not lines:
        return text, ''
    
    # First line is the spell list
    spell_list_text = lines[0].strip()
    
    # All remaining lines are descriptive text
    if len(lines) > 1:
        descriptive_text = '\n'.join(lines[1:]).strip()
    else:
        descriptive_text = ''
    
    return spell_list_text, descriptive_text


def parse_spell_like_abilities(text: str) -> List[Dict]:
    """
    Parse spell-like abilities from text.
    
    This function is only called for the literal "Spell-Like Abilities" block,
    so we can assume the text is a valid spell list format.
    """
    spells = []
    
    # Pattern: "At will--aid, continual flame, detect evil (DC 19), dispel evil (DC 20); 3/day--mass enlarge (DC 19; into snake form only)"
    # Split by semicolons for different use frequencies, but ignore semicolons inside parentheses
    sections = []
    current_section = []
    paren_depth = 0
    
    for char in text:
        if char == '(':
            paren_depth += 1
            current_section.append(char)
        elif char == ')':
            paren_depth -= 1
            current_section.append(char)
        elif char == ';' and paren_depth == 0:
            # Only split on semicolon if we're not inside parentheses
            sections.append(''.join(current_section).strip())
            current_section = []
        else:
            current_section.append(char)
    
    # Add the last section
    if current_section:
        sections.append(''.join(current_section).strip())
    
    for section in sections:
        # Extract uses per day (e.g., "At will", "3/day", or "Once per round"/"1/round")
        uses_match = re.search(r'(At will|(\d+)/day|Once per round|(\d+)/round)', section, re.IGNORECASE)
        uses_per_day_id = MONSTER_SPELL_USES_PER_DAY['AtWill']
        if uses_match:
            match_text = uses_match.group(1).lower()
            if match_text == 'at will':
                uses_per_day_id = MONSTER_SPELL_USES_PER_DAY['AtWill']
            elif 'round' in match_text:
                # Handle "Once per round" or "1/round"
                if '1' in match_text or 'once' in match_text:
                    uses_per_day_id = MONSTER_SPELL_USES_PER_DAY['1/Round']
                else:
                    # Extract number for "X/round" patterns (if we add more in the future)
                    round_num_match = re.search(r'(\d+)/round', match_text, re.IGNORECASE)
                    if round_num_match:
                        round_str = round_num_match.group(1)
                        uses_key = f"{round_str}/Round"
                        if uses_key in MONSTER_SPELL_USES_PER_DAY:
                            uses_per_day_id = MONSTER_SPELL_USES_PER_DAY[uses_key]
            else:
                # Handle "X/day" patterns
                uses_str = uses_match.group(2)
                uses_key = f"{uses_str}/Day"
                if uses_key in MONSTER_SPELL_USES_PER_DAY:
                    uses_per_day_id = MONSTER_SPELL_USES_PER_DAY[uses_key]
        
        # Handle sections that start with descriptive text followed by a colon
        # (e.g., "Once per round, a devourer can use one of the following abilities: spell1, spell2")
        section_clean = section.strip()
        if not uses_match:
            # Check if there's a colon in the section (indicating descriptive text before spell list)
            colon_idx = section_clean.find(':')
            if colon_idx != -1:
                # Check for "Once per round" or "1/round" in the text before the colon
                text_before_colon = section_clean[:colon_idx].lower()
                if 'once per round' in text_before_colon or re.search(r'\d+/round', text_before_colon, re.IGNORECASE):
                    uses_per_day_id = MONSTER_SPELL_USES_PER_DAY['1/Round']
                else:
                    # Default to "At will" if no frequency marker was found
                    uses_per_day_id = MONSTER_SPELL_USES_PER_DAY['AtWill']
                # Extract everything after the colon as the spell list
                section_clean = section_clean[colon_idx + 1:].strip()
            else:
                # Skip if no uses pattern and no colon found
                continue
        else:
            # Remove the uses per day prefix (e.g., "At will--", "3/day--", or "Once per round,")
            # Use [,\-]* to match zero or more dashes/commas (handles both "--" and single "-")
            section_clean = re.sub(r'^(At will|(\d+)/day|Once per round|(\d+)/round)\s*[,\-]*\s*', '', section_clean, flags=re.IGNORECASE).strip()
            # After removing the frequency prefix, check if there's still descriptive text ending with a colon
            # (e.g., "a devourer can use one of the following abilities: spell1, spell2")
            colon_idx = section_clean.find(':')
            if colon_idx != -1:
                # Extract everything after the colon as the spell list
                section_clean = section_clean[colon_idx + 1:].strip()
        
        # Split by comma to get individual spells, but ignore commas inside parentheses
        spell_candidates = []
        current_candidate = []
        paren_depth = 0
        
        for char in section_clean:
            if char == '(':
                paren_depth += 1
                current_candidate.append(char)
            elif char == ')':
                paren_depth -= 1
                current_candidate.append(char)
            elif char == ',' and paren_depth == 0:
                # Only split on comma if we're not inside parentheses
                spell_candidates.append(''.join(current_candidate).strip())
                current_candidate = []
            else:
                current_candidate.append(char)
        
        # Add the last candidate
        if current_candidate:
            spell_candidates.append(''.join(current_candidate).strip())
        
        # Expand spell candidates that contain " or " (split on "or" when not inside parentheses)
        # e.g., "transmute rock to mud or mud to rock" -> ["transmute rock to mud", "mud to rock"]
        expanded_candidates = []
        for candidate in spell_candidates:
            # Check if candidate contains " or " (case-insensitive) and split if not inside parentheses
            if re.search(r'\s+or\s+', candidate, re.IGNORECASE):
                # Split on " or " but respect parentheses
                parts = []
                current_part = []
                paren_depth = 0
                i = 0
                candidate_lower = candidate.lower()
                while i < len(candidate):
                    # Check for " or " pattern (case-insensitive)
                    if i < len(candidate) - 3:
                        # Check if we're at " or " (case-insensitive)
                        if candidate_lower[i:i+4] == ' or ' and paren_depth == 0:
                            # Found " or " outside parentheses - split here
                            part_str = ''.join(current_part).strip()
                            if part_str:
                                parts.append(part_str)
                            current_part = []
                            i += 4  # Skip " or "
                            continue
                    
                    char = candidate[i]
                    if char == '(':
                        paren_depth += 1
                        current_part.append(char)
                    elif char == ')':
                        paren_depth -= 1
                        current_part.append(char)
                    else:
                        current_part.append(char)
                    i += 1
                
                # Add the last part
                if current_part:
                    part_str = ''.join(current_part).strip()
                    if part_str:
                        parts.append(part_str)
                
                # Add all parts to expanded candidates
                expanded_candidates.extend(parts)
            else:
                expanded_candidates.append(candidate)
        
        spell_candidates = expanded_candidates
        
        for spell_candidate in spell_candidates:
            # Stop at the first period that's NOT inside parentheses - spell lists end with a period, followed by descriptive text
            # (e.g., "mass enlarge. Caster level equals..." should become "mass enlarge")
            # But don't split on periods inside parentheses (e.g., "darkness (radius 40 ft.)" should stay intact)
            paren_depth = 0
            period_idx = -1
            for i, char in enumerate(spell_candidate):
                if char == '(':
                    paren_depth += 1
                elif char == ')':
                    paren_depth -= 1
                elif char == '.' and paren_depth == 0:
                    # Found a period outside parentheses - this is where we should split
                    period_idx = i
                    break
            
            if period_idx != -1:
                spell_candidate = spell_candidate[:period_idx].strip()
            else:
                # No period found outside parentheses, but check if there's a trailing period
                # that's not part of parentheses (shouldn't happen, but be safe)
                if spell_candidate.endswith('.') and not spell_candidate.rstrip('.').endswith(')'):
                    spell_candidate = spell_candidate.rstrip('.')
            
            # Remove leading "and " if present (e.g., "and invisibility (self only)" -> "invisibility (self only)")
            # Do this early so DC/notes extraction works correctly
            spell_candidate = re.sub(r'^and\s+', '', spell_candidate, flags=re.IGNORECASE).strip()
            
            # Skip if empty or too short
            if not spell_candidate or len(spell_candidate) < 3:
                continue
            
            # Check if this spell has a DC in parentheses, possibly with notes
            # Pattern: (DC 19) or (DC 19; notes) or (DC 19, notes) or (notes, save DC 11)
            # Support both semicolon and comma as delimiters between DC and notes
            # Also support "save DC XX" at the end of parentheses
            dc_match = re.search(r'\(DC\s+(\d+)(?:[;,]\s*([^)]+))?\)', spell_candidate, re.IGNORECASE)
            save_dc = int(dc_match.group(1)) if dc_match else None
            notes = dc_match.group(2).strip() if dc_match and dc_match.group(2) else None
            save_dc_match = None
            
            # If no DC at start, check for "save DC XX" at the end of parentheses
            if not dc_match:
                save_dc_match = re.search(r'\(([^)]*),\s*save\s+DC\s+(\d+)\)', spell_candidate, re.IGNORECASE)
                if save_dc_match:
                    save_dc = int(save_dc_match.group(2))
                    notes = save_dc_match.group(1).strip() if save_dc_match.group(1).strip() else None
                else:
                    # Check for general parenthetical notes (e.g., "polymorph (humanoid forms only, duration 1 hour)")
                    notes_match = re.search(r'\(([^)]+)\)', spell_candidate)
                    if notes_match:
                        notes = notes_match.group(1).strip()
            
            # Extract spell name (remove DC part and notes if present)
            # Support both semicolon and comma as delimiters for DC pattern
            spell_name = re.sub(r'\s*\(DC\s+\d+(?:[;,]\s*[^)]+)?\)', '', spell_candidate, flags=re.IGNORECASE).strip()
            # Also remove "save DC XX" pattern at end of parentheses if found
            if save_dc_match:
                spell_name = re.sub(r'\s*\([^)]*,\s*save\s+DC\s+\d+\)', '', spell_name, flags=re.IGNORECASE).strip()
            # Also remove general parenthetical notes if no DC was found
            elif not dc_match:
                spell_name = re.sub(r'\s*\([^)]+\)', '', spell_name).strip()
            
            # Final cleanup: remove any remaining trailing parentheses and their contents
            # This handles cases where parentheses don't match expected patterns or are malformed
            # First, try to remove properly closed parentheses at the end
            spell_name = re.sub(r'\s*\([^)]+\)\s*$', '', spell_name).strip()
            # Then, remove any trailing unclosed parentheses (malformed input)
            spell_name = re.sub(r'\s*\([^)]*$', '', spell_name).strip()
            
            # Skip if empty or too short after cleaning
            if spell_name and len(spell_name) >= 3:
                spells.append({
                    'spell_name': spell_name,
                    'spell_type': MONSTER_SPELL_TYPE['SpellLike'],
                    'uses_per_day_id': uses_per_day_id,
                    'save_dc': save_dc,
                    'quantity': None,
                    'notes': notes
                })
    
    return spells


def extract_flavor_text(section_content: str, exclude_nested: bool = False, exclude_list: List[str] = None) -> Optional[str]:
    """
    Extract flavor text from a section's FLAVORTEXT tag.
    
    Args:
        section_content: The content of a MAINMONSTER, GROUP, CATEGORY, or VARIANT section
        exclude_nested: If True, exclude FLAVORTEXT tags nested in specified sections.
        exclude_list: List of tag names to exclude when exclude_nested is True.
                     Defaults to ['VARIANT', 'CATEGORY', 'GROUP'] if not provided.
    
    Returns:
        Flavor text string or None
    """
    if exclude_list is None:
        exclude_list = ['VARIANT', 'CATEGORY', 'GROUP']
    if exclude_nested:
        flavor_sections = extract_direct_child_tags(section_content, 'FLAVORTEXT', exclude_nested_in=exclude_list)
    else:
        flavor_sections = extract_tagged_section(section_content, 'FLAVORTEXT')
    if flavor_sections:
        flavor_text = flavor_sections[0].strip()
        if flavor_text:
            logger.debug(f"Found flavorText ({len(flavor_text)} chars): {flavor_text[:100]}..." if len(flavor_text) > 100 else f"Found flavorText: {flavor_text}")
            return flavor_text
    return None


def extract_description(section_content: str, flavor_text: Optional[str], db: DatabaseConnection, 
                       monster_name: str, update_existing: bool = False, exclude_nested: bool = False, 
                       exclude_list: List[str] = None) -> Tuple[Optional[str], List[Dict]]:
    """
    Extract description from a section's DESCRIPTION tag.
    Also extracts "XXX Traits" abilities from the TRAITS tag if present.
    Processes tables and replaces them with [table:slug] tags.
    
    Args:
        section_content: The content of a MAINMONSTER, GROUP, CATEGORY, or VARIANT section
        flavor_text: Previously extracted flavor text (to skip if duplicated)
        db: DatabaseConnection instance
        monster_name: Name of monster (for logging)
        exclude_nested: If True, exclude DESCRIPTION tags nested in specified sections.
        exclude_list: List of tag names to exclude when exclude_nested is True.
                     Defaults to ['VARIANT', 'CATEGORY', 'GROUP'] if not provided.
    
    Returns:
        Tuple of (description_string, traits_abilities_list)
        - description_string: Description text
        - traits_abilities_list: List of Traits abilities found (same format as special_abilities)
    """
    if exclude_list is None:
        exclude_list = ['VARIANT', 'CATEGORY', 'GROUP']
    description_parts = []
    traits_abilities = []
    
    # Extract DESCRIPTION tag content
    if exclude_nested:
        description_sections = extract_direct_child_tags(section_content, 'DESCRIPTION', exclude_nested_in=exclude_list)
    else:
        description_sections = extract_tagged_section(section_content, 'DESCRIPTION')
    if description_sections:
        description_text = description_sections[0].strip()
        if description_text:
            # Process tables first (before spell references, to avoid interfering with table parsing)
            description_text, created_tables = process_tables_in_text(description_text, db, monster_name, update_existing=update_existing)
            if created_tables:
                logger.debug(f"Found {len(created_tables)} table(s) in description for {monster_name}")
            
            # Process for spell references
            description_text = process_text_for_spell_references(description_text, db)
            description_parts.append(description_text)
    
    # Extract TRAITS tag content if present
    if exclude_nested:
        traits_sections = extract_direct_child_tags(section_content, 'TRAITS', exclude_nested_in=exclude_list)
    else:
        traits_sections = extract_tagged_section(section_content, 'TRAITS')
    if traits_sections:
        traits_text = traits_sections[0].strip()
        if traits_text:
            # Process tables
            traits_text, created_tables = process_tables_in_text(traits_text, db, monster_name, update_existing=update_existing)
            if created_tables:
                logger.debug(f"Found {len(created_tables)} table(s) in traits for {monster_name}")
            
            # Process for spell references
            traits_text = process_text_for_spell_references(traits_text, db)
            
            # Create a Traits ability entry
            # The name is typically the monster type + "Traits" (e.g., "Angel Traits")
            # But we'll use a generic name if we can't determine it
            traits_name = f"{monster_name} Traits"
            traits_abilities.append({
                'name': traits_name,
                'description': traits_text,
                'type': MONSTER_SPECIAL_ABILITY_TYPE['Extraordinary'],
                'effective_caster_level': None,
                'save_ability': None,
                'spells': []  # Traits abilities don't have spells
            })
            logger.debug(f"Found Traits ability: '{traits_name}'")
    
    description = ' '.join(description_parts) if description_parts else None
    if description:
        logger.debug(f"Found description ({len(description)} chars): {description[:200]}..." if len(description) > 200 else f"Found description: {description}")
    else:
        logger.debug("No description found")
    
    if traits_abilities:
        logger.debug(f"Found {len(traits_abilities)} Traits ability/abilities")
    
    return description, traits_abilities


def extract_combat_description(section_content: str, db: DatabaseConnection, exclude_nested: bool = False, exclude_list: List[str] = None) -> Optional[str]:
    """
    Extract combat description from a section's COMBAT tag.
    
    Args:
        section_content: The content of a MAINMONSTER, GROUP, CATEGORY, or VARIANT section
        db: DatabaseConnection instance
        exclude_nested: If True, exclude COMBAT tags nested in specified sections.
        exclude_list: List of tag names to exclude when exclude_nested is True.
                     Defaults to ['VARIANT', 'CATEGORY', 'GROUP'] if not provided.
    
    Returns:
        Combat description string or None
    """
    if exclude_list is None:
        exclude_list = ['VARIANT', 'CATEGORY', 'GROUP']
    if exclude_nested:
        combat_sections = extract_direct_child_tags(section_content, 'COMBAT', exclude_nested_in=exclude_list)
    else:
        combat_sections = extract_tagged_section(section_content, 'COMBAT')
    if combat_sections:
        combat_text = combat_sections[0].strip()
        if combat_text:
            # Process for spell references
            combat_text = process_text_for_spell_references(combat_text, db)
            logger.debug(f"Found combatDescription ({len(combat_text)} chars): {combat_text[:200]}..." if len(combat_text) > 200 else f"Found combatDescription: {combat_text}")
            return combat_text
    logger.debug("No combatDescription found")
    return None


def extract_caster_level_and_save_ability(text: str) -> Tuple[Optional[int], Optional[int], str]:
    """
    Extract caster level and save ability from text, and return the text with those parts removed.
    Preserves newlines in the text.
    
    Args:
        text: Text to search for caster level and save ability info
        
    Returns:
        Tuple of (effective_caster_level, save_ability, cleaned_text)
    """
    effective_caster_level = None
    save_ability = None
    cleaned_text = text
    
    # Try to match "Effective caster level" or "Caster level" (with optional "th", "st", "nd", "rd" suffix)
    # Also handle "Caster level equals X" or "Caster level X"
    # Match the full phrase including ordinal suffix and trailing punctuation
    caster_level_patterns = [
        r'Effective\s+caster\s+level\s+(\d+)(?:th|st|nd|rd)?\s*\.',
        r'Caster\s+level\s+(?:equals\s+)?(\d+)(?:th|st|nd|rd)?\s*\.',
    ]
    
    for pattern in caster_level_patterns:
        caster_level_match = re.search(pattern, cleaned_text, re.IGNORECASE)
        if caster_level_match:
            effective_caster_level = int(caster_level_match.group(1))
            # Remove the matched text (with surrounding punctuation/whitespace)
            match_start = caster_level_match.start()
            match_end = caster_level_match.end()
            # Get text before and after
            before = cleaned_text[:match_start].rstrip()
            after = cleaned_text[match_end:].lstrip()
            # Remove trailing period/comma from before if present
            before = before.rstrip('.,')
            # Preserve newlines - only join with space if both parts are on same line
            if '\n' not in before[-1:] and '\n' not in after[:1]:
                cleaned_text = (before + ' ' + after).strip()
            else:
                cleaned_text = (before + after).strip()
            break
    
    # Extract save ability
    save_ability_map = {
        'strength': 1, 'str': 1, 'dexterity': 2, 'dex': 2,
        'constitution': 3, 'con': 3, 'intelligence': 4, 'int': 4,
        'wisdom': 5, 'wis': 5, 'charisma': 6, 'cha': 6,
    }
    # Match the full phrase including optional "The" at the beginning and trailing period
    # Support both "is" and "are" (e.g., "The save DC is Charisma-based." or "The save DCs are Charisma-based.")
    save_ability_patterns = [
        r'The\s+save\s+DCs?\s+(?:is|are)\s+(\w+)-based\s*\.',
        r'save\s+DCs?\s+(?:is|are)\s+(\w+)-based\s*\.',
        r'(\w+)-based\s+save\s+DCs?\s*\.',
    ]
    
    for pattern in save_ability_patterns:
        save_ability_match = re.search(pattern, cleaned_text, re.IGNORECASE)
        if save_ability_match:
            ability_name_lower = save_ability_match.group(1).lower()
            save_ability = save_ability_map.get(ability_name_lower)
            if save_ability:
                # Remove the matched text
                match_start = save_ability_match.start()
                match_end = save_ability_match.end()
                before = cleaned_text[:match_start].rstrip()
                after = cleaned_text[match_end:].lstrip()
                # Remove trailing period/comma from before if present
                before = before.rstrip('.,')
                # Preserve newlines - only join with space if both parts are on same line
                if '\n' not in before[-1:] and '\n' not in after[:1]:
                    cleaned_text = (before + ' ' + after).strip()
                else:
                    cleaned_text = (before + after).strip()
                break
    
    # Clean up multiple spaces but preserve newlines
    cleaned_text = re.sub(r'[ \t]+', ' ', cleaned_text)  # Collapse spaces/tabs but keep newlines
    cleaned_text = re.sub(r' \n', '\n', cleaned_text)  # Remove space before newline
    cleaned_text = re.sub(r'\n ', '\n', cleaned_text)  # Remove space after newline
    
    return effective_caster_level, save_ability, cleaned_text


def extract_combat_section(section_content: str, db: DatabaseConnection, 
                           monster_name: str, exclude_nested: bool = False, 
                           exclude_list: List[str] = None) -> Tuple[List[Dict], List[Dict], List[Dict]]:
    """
    Extract special abilities and prepared spells from section content.
    
    Args:
        section_content: The content of a MAINMONSTER, GROUP, CATEGORY, or VARIANT section
        db: DatabaseConnection instance
        monster_name: Name of monster (for logging)
        exclude_nested: If True, exclude SA tags that are nested in specified sections.
        exclude_list: List of tag names to exclude when exclude_nested is True.
                     Defaults to ['VARIANT', 'CATEGORY', 'GROUP'] if not provided.
    
    Returns:
        Tuple of (special_abilities, prepared_spells, prepared_spell_slots)
    """
    special_abilities = []
    prepared_spells = []
    prepared_spell_slots = []
    
    # Default exclude list for MAINMONSTER
    if exclude_list is None:
        exclude_list = ['VARIANT', 'CATEGORY', 'GROUP']
    
    # Extract all {SA} tags (special abilities)
    # If exclude_nested is True, only get direct children (not nested in specified sections)
    # This prevents extracting abilities from child sections
    if exclude_nested:
        sa_sections = extract_direct_child_tags(section_content, 'SA', exclude_nested_in=exclude_list)
    else:
        sa_sections = extract_tagged_section(section_content, 'SA')
    
    for sa_content in sa_sections:
        if not sa_content.strip():
                    continue
            
        # Parse the ability name and type from the first line
        lines = sa_content.strip().split('\n', 1)
        first_line = lines[0].strip()
        
        # Check if first line contains a colon that separates name from description
        # Pattern: "Ability Name: description" or "Ability Name (info): description"
        # But don't split on type marker colons like "(Sp):" - those are part of the name
        # Look for colon followed by space and content (not just a type marker)
        ability_name = first_line
        ability_description = ''
        
        # Check if there's a colon in the first line that separates name from description
        # Type markers are like "(Sp):", "(Su):", "(Ex):" - these should not be split points
        # Pattern: "Name (info): description" or "Name: description"
        colon_split_match = None
        
        # Check if the line ends with a type marker colon (like "(Sp):" or "(Su):" or "(Ex):")
        # Type markers are single letters in parentheses: (Sp), (Su), (Ex)
        type_marker_at_end = re.search(r'\(([A-Za-z]+)\)\s*:\s*$', first_line)
        
        if not type_marker_at_end:
            # No type marker colon at end - look for other colons that separate name from description
            # Pattern: colon followed by space and content (spell lists, etc.)
            # This handles cases like "Typical Sorcerer Spells Known (6/6/4; save DC 12 + spell level): 0--detect magic..."
            # Or "Ability Name: description text"
            colon_match = re.search(r':\s+(.+)$', first_line)
            if colon_match:
                # Found a colon with content after it - split here
                colon_pos = colon_match.start()
                ability_name = first_line[:colon_pos].strip()
                ability_description = colon_match.group(1).strip()
                colon_split_match = colon_match
        
        # If we didn't split on colon, check for newline-separated description
        if not colon_split_match:
            if len(lines) > 1:
                ability_description = lines[1]
                # Remove leading indentation (4 spaces) from each line while preserving newlines
                description_lines = ability_description.split('\n')
                dedented_lines = []
                for line in description_lines:
                    # Remove up to 4 leading spaces
                    if line.startswith('    '):
                        dedented_lines.append(line[4:])
                    elif line.strip():  # Non-empty line that doesn't start with 4 spaces
                        dedented_lines.append(line)
                    else:  # Empty line
                        dedented_lines.append('')
                ability_description = '\n'.join(dedented_lines).rstrip()
            else:
                ability_description = ''
        
        # Extract ability name and type marker
        # Pattern: "Ability Name (Sp):" or "Ability Name (Su):" or "Ability Name (Ex):" or "Ability Name:"
        # Also handle: "Typical Sorcerer Spells Known (6/6/4; save DC 12 + spell level): 0--..."
        ability_type = None
        
        # Check if ability_name contains parenthetical slot information (like "(6/6/4; save DC 12 + spell level)")
        # This should be moved to description, not kept in the name
        # Pattern: parenthetical containing numbers with slashes (slot counts like "6/6/4") or "save DC"
        # Match pattern like "(6/6/4; save DC 12 + spell level)" at the end of the name
        # Pattern matches: digits with slashes (like "6/6/4" or "5/3") or "save DC"
        slot_info_match = re.search(r'\s+\(([^)]*(?:\d+/\d+|save\s+DC)[^)]*)\)\s*$', ability_name)
        if slot_info_match:
            # Found slot information in parentheses - extract it to description
            slot_info = slot_info_match.group(0).strip()  # Full match including parentheses and spaces
            ability_name = ability_name[:slot_info_match.start()].strip()
            # Prepend slot info to description (with colon since we split on colon earlier)
            if colon_split_match:
                ability_description = slot_info + ': ' + ability_description
            else:
                ability_description = slot_info
        
        # Check for type markers
        if '(Sp)' in ability_name or '(Sp):' in ability_name:
                            ability_type = MONSTER_SPECIAL_ABILITY_TYPE['SpellLike']
        elif '(Su)' in ability_name or '(Su):' in ability_name:
                            ability_type = MONSTER_SPECIAL_ABILITY_TYPE['Supernatural']
        elif '(Ex)' in ability_name or '(Ex):' in ability_name:
                            ability_type = MONSTER_SPECIAL_ABILITY_TYPE['Extraordinary']
                    
        # Clean ability name (remove type markers and colons)
        clean_name = re.sub(r'\s*\([A-Za-z]+\)\s*:?\s*', '', ability_name).strip().rstrip(':')
        
        # Handle special cases
        is_spell_like_abilities = clean_name.lower() == 'spell-like abilities'
        is_skills_ability = clean_name.lower() == 'skills'
        is_spells_ability = clean_name.lower() == 'spells'
        is_possessions = clean_name.lower() == 'possessions'
        # Check for "Typical X Spells Known" or "Typical X Spells Prepared" abilities
        is_spells_known_or_prepared = 'spells known' in clean_name.lower() or 'spells prepared' in clean_name.lower()
        
        # Determine ability type for special cases
        if is_spell_like_abilities:
            ability_type = MONSTER_SPECIAL_ABILITY_TYPE['SpellLike']
        elif is_skills_ability or is_spells_ability or is_possessions:
            ability_type = MONSTER_SPECIAL_ABILITY_TYPE['Extraordinary']
        elif not ability_type:
            # Default to Extraordinary if no type marker found
            ability_type = MONSTER_SPECIAL_ABILITY_TYPE['Extraordinary']
        
        # Parse spell-like abilities for spells
        spells = []
        effective_caster_level = None
        save_ability = None
        
        if ability_type == MONSTER_SPECIAL_ABILITY_TYPE['SpellLike'] and is_spell_like_abilities:
            # Split spell list from descriptive text (before processing for spell references)
            spell_list_text, descriptive_text = split_spell_list_from_description(ability_description)
            
            # Extract effective caster level and save ability from both spell list and descriptive text
            # Check spell list first (e.g., "At will--spell1, spell2. Caster level 12th.")
            spell_list_cl, spell_list_sa, cleaned_spell_list = extract_caster_level_and_save_ability(spell_list_text)
            if spell_list_cl:
                effective_caster_level = spell_list_cl
            if spell_list_sa:
                save_ability = spell_list_sa
            
            # Check descriptive text (or full text if no split)
            search_text = descriptive_text if descriptive_text else ability_description
            desc_cl, desc_sa, cleaned_search_text = extract_caster_level_and_save_ability(search_text)
            if desc_cl:
                effective_caster_level = desc_cl
            if desc_sa:
                save_ability = desc_sa
            
            # Parse spells from the cleaned spell list text
            parsed_spells = parse_spell_like_abilities(cleaned_spell_list)
            for parsed_spell in parsed_spells:
                spell_name = parsed_spell.get('spell_name', '').strip()
                if spell_name and len(spell_name) >= 3:
                    spells.append({
                        'spell_name': spell_name,
                        'save_dc': parsed_spell.get('save_dc'),
                        'uses_per_day_id': parsed_spell.get('uses_per_day_id'),
                        'notes': parsed_spell.get('notes')
                    })
            
            # Use the cleaned descriptive text (with caster level/save ability removed) as the description
            # Process spell references first (before tables)
            # Use process_plain_text=True to convert spell names in descriptive text to markdown
            # Preserve newlines in the description
            if descriptive_text:
                ability_description = process_text_for_spell_references(cleaned_search_text, db, process_plain_text=True, preserve_newlines=True)
            else:
                # No descriptive text, but still process the full description for spell references
                if ability_description:
                    ability_description = process_text_for_spell_references(cleaned_search_text, db, process_plain_text=True, preserve_newlines=True)
            
            # Process tables after spell references
            if ability_description:
                ability_description, created_tables = process_tables_in_text(ability_description, db, f"{monster_name} - {clean_name}", update_existing=False)
                if created_tables:
                    logger.debug(f"Found {len(created_tables)} table(s) in {clean_name} ability for {monster_name}")
        else:
            # For individual spell-like abilities (type == SpellLike but not "Spell-Like Abilities" block),
            # or "Spells Known/Prepared" abilities, extract caster level and save ability from the description
            if ability_type == MONSTER_SPECIAL_ABILITY_TYPE['SpellLike'] or is_spells_known_or_prepared:
                desc_cl, desc_sa, cleaned_description = extract_caster_level_and_save_ability(ability_description)
                if desc_cl:
                    effective_caster_level = desc_cl
                if desc_sa:
                    save_ability = desc_sa
                ability_description = cleaned_description
            
            # Process description for spell references first (before tables)
            # For spell-like abilities (type == SpellLike) or "Spells Known/Prepared" abilities,
            # also process spell names in plain text
            # Preserve newlines in the description
            if ability_description:
                if ability_type == MONSTER_SPECIAL_ABILITY_TYPE['SpellLike'] or is_spells_known_or_prepared:
                    # Spell-like abilities and "Spells Known/Prepared" should have spell names converted to markdown
                    ability_description = process_text_for_spell_references(ability_description, db, process_plain_text=True, preserve_newlines=True)
                else:
                    # Non-spell-like abilities: process but don't convert plain text spell names
                    ability_description = process_text_for_spell_references(ability_description, db, preserve_newlines=True)
            
            # Process tables after spell references
            if ability_description:
                ability_description, created_tables = process_tables_in_text(ability_description, db, f"{monster_name} - {clean_name}", update_existing=False)
                if created_tables:
                    logger.debug(f"Found {len(created_tables)} table(s) in {clean_name} ability for {monster_name}")
        
        # Add to special abilities
        if clean_name:
            special_abilities.append({
                        'name': clean_name,
                        'description': ability_description,
                        'type': ability_type,
                'effective_caster_level': effective_caster_level,
                'save_ability': save_ability,
                'spells': spells
            })
    
    # Extract prepared spells from {PREPEDSPELLS} tag
    # If exclude_nested is True, only get direct children (not nested in specified sections)
    if exclude_nested:
        preped_spells_sections = extract_direct_child_tags(section_content, 'PREPEDSPELLS', exclude_nested_in=exclude_list)
    else:
        preped_spells_sections = extract_tagged_section(section_content, 'PREPEDSPELLS')
    for preped_content in preped_spells_sections:
        if not preped_content.strip():
                    continue
            
        # Parse prepared spells block
        # Pattern: "Typical XX Spells Prepared (X/X/X/X; save DC Y + spell level): 0--spell1, spell2; 1st--spell3, spell4"
        full_text = preped_content.strip()
        
        slots_match = re.search(r'\(([\d/]+);\s*save\s+DC\s+(\d+)\s*\+\s*spell\s+level\)', full_text, re.IGNORECASE)
        if slots_match:
            slots_str = slots_match.group(1)
            base_dc = int(slots_match.group(2))
            
            # Parse slot counts per level
            slot_counts = [int(x) for x in slots_str.split('/')]
            for level, count in enumerate(slot_counts):
                if count > 0:
                    prepared_spell_slots.append({
                        'level': level,
                        'num_slots': count
                    })
            
            # Extract spells by level
            header_end = full_text.find('):')
            if header_end != -1:
                spells_section = full_text[header_end + 2:].strip()
                # Pattern to match level markers: "0--", "1st--", "2nd--", etc.
                level_sections = re.split(r';\s*', spells_section)
                for level_section in level_sections:
                    level_section = level_section.strip()
                    if not level_section:
                        continue
                    # Match level marker: "0--", "1st--", "2nd--", "3rd--", "4th--", "5th--"
                    level_match = re.match(r'(\d+)(?:st|nd|rd|th)?--\s*(.+)', level_section, re.IGNORECASE)
                    if not level_match:
                        continue
                    spell_level = int(level_match.group(1))
                    spells_text = level_match.group(2).strip().rstrip(';').strip()
                    
                    # Parse individual spells (comma-separated)
                    spell_items = []
                    parts = []
                    current_part = ''
                    paren_depth = 0
                    for char in spells_text:
                        if char == '(':
                            paren_depth += 1
                            current_part += char
                        elif char == ')':
                            paren_depth -= 1
                            current_part += char
                        elif char == ',' and paren_depth == 0:
                            parts.append(current_part.strip())
                            current_part = ''
                        else:
                            current_part += char
                    if current_part.strip():
                        parts.append(current_part.strip())
                    
                    # Process parts and combine descriptors with previous spell names
                    # e.g., "dispel magic, greater" should be combined into "dispel magic, greater"
                    for i, part in enumerate(parts):
                        part = part.strip()
                        if not part:
                            continue
                        
                        # Check if this part is a descriptor (greater, mass, lesser, etc.)
                        is_descriptor = part.lower() in [d.lower() for d in SPELL_DESCRIPTORS]
                        
                        if is_descriptor and spell_items:
                            # Combine with the previous spell name
                            # Format: "previous_spell_name, descriptor"
                            previous_spell = spell_items[-1]
                            previous_spell['spell_name'] = f"{previous_spell['spell_name']}, {part}"
                            continue
                        
                        # Not a descriptor or no previous spell - process as normal spell
                        qty_match = re.search(r'\((\d+)\)\s*$', part)
                        if qty_match:
                            spell_name = part[:qty_match.start()].strip()
                            quantity = int(qty_match.group(1))
                        else:
                            spell_name = part.strip()
                            quantity = 1
                        
                        if spell_name and len(spell_name) >= 3:
                            save_dc = base_dc + spell_level
                            spell_items.append({
                                'spell_name': spell_name,
                                'quantity': quantity,
                                'save_dc': save_dc,
                                'spell_level': spell_level
                            })
                    
                    if spell_items:
                        prepared_spells.extend(spell_items)
        
        # Check for domain information in the next section (if present)
        # This would be in a separate paragraph or section after PREPEDSPELLS
    
    return special_abilities, prepared_spells, prepared_spell_slots


def _validate_statblock_completeness(statblock: Dict, monster_name: str) -> None:
    """
    Validate that a statblock dictionary contains all required labels in order.
    
    Args:
        statblock: The statblock dictionary to validate
        monster_name: Monster name (for error reporting)
    
    Raises:
        ImportError: If the statblock is incomplete or labels are out of order
    """
    if not statblock:
        return
    
    # Get the list of labels that should be present (up to and including "Level Adjustment")
    level_adjustment_index = STATBLOCK_LABELS_ORDERED.index('Level Adjustment')
    required_labels = STATBLOCK_LABELS_ORDERED[:level_adjustment_index + 1]
    
    # Check if monster type is Animal or Vermin - these don't have Treasure or Alignment
    # Check if monster type is Plant - these don't have Skills or Feats
    type_line = statblock.get('type_line', '')
    is_animal_or_vermin = False
    is_plant = False
    if type_line:
        type_line_upper = type_line.upper()
        # Check if type line contains "Animal" or "Vermin" (case-insensitive)
        if 'ANIMAL' in type_line_upper or 'VERMIN' in type_line_upper:
            is_animal_or_vermin = True
            # Remove "Treasure" and "Alignment" from required labels for Animal/Vermin
            if 'Treasure' in required_labels:
                required_labels.remove('Treasure')
            if 'Alignment' in required_labels:
                required_labels.remove('Alignment')
        # Check if type line contains "Plant" (case-insensitive)
        if 'PLANT' in type_line_upper:
            is_plant = True
            # Remove "Skills" and "Feats" from required labels for Plant
            if 'Skills' in required_labels:
                required_labels.remove('Skills')
            if 'Feats' in required_labels:
                required_labels.remove('Feats')
    
    # Check which labels are present in the statblock (excluding 'type_line' and 'variant_name')
    statblock_keys = set(k for k in statblock.keys() if k not in ['type_line', 'variant_name'])
    
    # Debug: log what keys are actually in the statblock
    logger.info(f"Statblock validation: statblock has {len(statblock_keys)} keys: {sorted(statblock_keys)}")
    logger.info(f"Statblock validation: required labels: {required_labels[:5]}... (showing first 5)")
    if is_animal_or_vermin:
        logger.info(f"Statblock validation: Animal/Vermin detected, Treasure and Alignment are optional")
    if is_plant:
        logger.info(f"Statblock validation: Plant detected, Skills and Feats are optional")
    
    # Find missing labels
    missing_labels = [label for label in required_labels if label not in statblock_keys]
    
    if missing_labels:
        found_labels = [label for label in required_labels if label in statblock_keys]
        raise ImportError(
            f"Statblock is incomplete. Missing required label(s): {', '.join(missing_labels[:5])}{'...' if len(missing_labels) > 5 else ''}. "
            f"Statblock must include all labels in order up to 'Level Adjustment'. "
            f"This may indicate a missing closing tag or malformed tagged text. "
            f"Monster: '{monster_name}'. "
            f"Found {len(found_labels)} labels: {', '.join(found_labels[:3])}{'...' if len(found_labels) > 3 else ''}. "
            f"Expected {len(required_labels)} labels.",
            monster_name=monster_name,
            field="Statblock"
        )
    
    # Validate order: check that labels appear in the correct order
    found_labels_in_order = [label for label in STATBLOCK_LABELS_ORDERED if label in statblock_keys]
    
    # Check if labels are in order by comparing their indices in STATBLOCK_LABELS_ORDERED
    for i in range(1, len(found_labels_in_order)):
        prev_label = found_labels_in_order[i - 1]
        curr_label = found_labels_in_order[i]
        prev_index = STATBLOCK_LABELS_ORDERED.index(prev_label)
        curr_index = STATBLOCK_LABELS_ORDERED.index(curr_label)
        
        if curr_index < prev_index:
            # Labels are out of order
            raise ImportError(
                f"Statblock labels out of order. "
                f"Found '{curr_label}' after '{prev_label}', but '{curr_label}' should come before '{prev_label}'. "
                f"This may indicate a missing closing tag or malformed tagged text. "
                f"Monster: '{monster_name}'.",
                monster_name=monster_name,
                field="Statblock"
            )


def extract_statblock_from_section(section_content: str, exclude_nested: bool = False, exclude_list: List[str] = None) -> Optional[Dict]:
    """
    Extract statblock from a section's STATBLOCK tag.
    
    Args:
        section_content: The content of a MAINMONSTER, GROUP, CATEGORY, or VARIANT section
        exclude_nested: If True, exclude STATBLOCK tags nested in specified sections.
        exclude_list: List of tag names to exclude when exclude_nested is True.
                     Defaults to ['VARIANT', 'CATEGORY', 'GROUP'] if not provided.
    
    Returns:
        Statblock dictionary or None if no statblock found
    """
    if exclude_list is None:
        exclude_list = ['VARIANT', 'CATEGORY', 'GROUP']
    if exclude_nested:
        statblock_sections = extract_direct_child_tags(section_content, 'STATBLOCK', exclude_nested_in=exclude_list)
    else:
        statblock_sections = extract_tagged_section(section_content, 'STATBLOCK')
    if not statblock_sections:
        return None
    
    statblock_text = statblock_sections[0].strip()
    if not statblock_text:
        return None
    
    # Parse statblock from text
    statblock = {}
    lines = statblock_text.split('\n')
    
    # Find the type line (size and type)
    # Pattern: First line might be "Variant Name, XX-Level Classname" (optional)
    #         Second line is always "Size Type (Subtypes)" - the type line with size
    size_keywords = ['Fine', 'Diminutive', 'Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan', 'Colossal']
    type_line = None
    type_line_index = None
    
    # Check first 2 lines for type line pattern (contains size keyword)
    for i, line in enumerate(lines[:2]):  # Check first 2 lines only
        line_stripped = line.strip()
        if not line_stripped:
            continue
        
        # Check if it looks like a type line (contains size keywords)
        if any(size in line_stripped for size in size_keywords):
            # Check if hit dice is on the same line
            hit_dice_match = re.search(r'Hit Dice:\s*(.+)$', line_stripped, re.IGNORECASE)
            if hit_dice_match:
                hit_dice_value = hit_dice_match.group(1).strip()
                statblock['Hit Dice'] = parse_statblock_value(hit_dice_value)
                type_line = re.sub(r'\s*Hit Dice:.*$', '', line_stripped, flags=re.IGNORECASE).strip()
            else:
                type_line = line_stripped
            type_line_index = i
            break
    
    if type_line:
        statblock['type_line'] = type_line
        # Remove the type line from processing (and any lines before it)
        lines = lines[type_line_index + 1:]
    
    # Parse remaining lines for statblock labels
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # Check if line starts with any statblock label
        for label in STATBLOCK_LABELS_ORDERED:
            # Pattern allows optional value after colon (for labels like "Level Adjustment:" with no value)
            label_pattern = rf'^{re.escape(label)}\s*:\s*(.*)$'
            match = re.match(label_pattern, line, re.IGNORECASE)
            if match:
                value = match.group(1).strip()
                statblock[label] = parse_statblock_value(value)
                break  # Found a match, move to next line
    
    return statblock if statblock else None


def _validate_statblock_completeness(statblock: Dict, monster_name: str) -> None:
    """
    Validate that a statblock dictionary contains all required labels in order.
    
    Args:
        statblock: The statblock dictionary to validate
        monster_name: Monster name (for error reporting)
    
    Raises:
        ImportError: If the statblock is incomplete or labels are out of order
    """
    if not statblock:
        return
    
    # Get the list of labels that should be present (up to and including "Level Adjustment")
    level_adjustment_index = STATBLOCK_LABELS_ORDERED.index('Level Adjustment')
    required_labels = STATBLOCK_LABELS_ORDERED[:level_adjustment_index + 1]
    
    # Check if monster type is Animal or Vermin - these don't have Treasure or Alignment
    # Check if monster type is Plant - these don't have Skills or Feats
    type_line = statblock.get('type_line', '')
    is_animal_or_vermin = False
    is_plant = False
    if type_line:
        type_line_upper = type_line.upper()
        # Check if type line contains "Animal" or "Vermin" (case-insensitive)
        if 'ANIMAL' in type_line_upper or 'VERMIN' in type_line_upper:
            is_animal_or_vermin = True
            # Remove "Treasure" and "Alignment" from required labels for Animal/Vermin
            if 'Treasure' in required_labels:
                required_labels.remove('Treasure')
            if 'Alignment' in required_labels:
                required_labels.remove('Alignment')
        # Check if type line contains "Plant" (case-insensitive)
        if 'PLANT' in type_line_upper:
            is_plant = True
            # Remove "Skills" and "Feats" from required labels for Plant
            if 'Skills' in required_labels:
                required_labels.remove('Skills')
            if 'Feats' in required_labels:
                required_labels.remove('Feats')
    
    # Check which labels are present in the statblock (excluding 'type_line' and 'variant_name')
    statblock_keys = set(k for k in statblock.keys() if k not in ['type_line', 'variant_name'])
    
    # Debug: log what keys are actually in the statblock
    logger.info(f"Statblock validation: statblock has {len(statblock_keys)} keys: {sorted(statblock_keys)}")
    logger.info(f"Statblock validation: required labels: {required_labels[:5]}... (showing first 5)")
    if is_animal_or_vermin:
        logger.info(f"Statblock validation: Animal/Vermin detected, Treasure and Alignment are optional")
    if is_plant:
        logger.info(f"Statblock validation: Plant detected, Skills and Feats are optional")
    
    # Find missing labels
    missing_labels = [label for label in required_labels if label not in statblock_keys]
    
    if missing_labels:
        found_labels = [label for label in required_labels if label in statblock_keys]
        raise ImportError(
            f"Statblock is incomplete. Missing required label(s): {', '.join(missing_labels[:5])}{'...' if len(missing_labels) > 5 else ''}. "
            f"Statblock must include all labels in order up to 'Level Adjustment'. "
            f"This may indicate a missing closing tag or malformed tagged text. "
            f"Monster: '{monster_name}'. "
            f"Found {len(found_labels)} labels: {', '.join(found_labels[:3])}{'...' if len(found_labels) > 3 else ''}. "
            f"Expected {len(required_labels)} labels.",
            monster_name=monster_name,
            field="Statblock"
        )
    
    # Validate order: check that labels appear in the correct order
    found_labels_in_order = [label for label in STATBLOCK_LABELS_ORDERED if label in statblock_keys]
    
    # Check if labels are in order by comparing their indices in STATBLOCK_LABELS_ORDERED
    for i in range(1, len(found_labels_in_order)):
        prev_label = found_labels_in_order[i - 1]
        curr_label = found_labels_in_order[i]
        prev_index = STATBLOCK_LABELS_ORDERED.index(prev_label)
        curr_index = STATBLOCK_LABELS_ORDERED.index(curr_label)
        
        if curr_index < prev_index:
            # Labels are out of order
            raise ImportError(
                f"Statblock labels out of order. "
                f"Found '{curr_label}' after '{prev_label}', but '{curr_label}' should come before '{prev_label}'. "
                f"This may indicate a missing closing tag or malformed tagged text. "
                f"Monster: '{monster_name}'.",
                monster_name=monster_name,
                field="Statblock"
            )


def extract_monster_data(content: str, db: DatabaseConnection, skip_existing: bool = False, update_existing: bool = False) -> Optional[Dict]:
    """
    Extract monster data from tagged text content.
    
    Args:
        content: The full file content as a string
        db: DatabaseConnection instance
        skip_existing: If True, skip monsters that already exist in database
    
    Returns:
        Dict with monster data or None if skipped/failed
    """
    # Store file content in db for line number tracking
    db.file_content = content
    
    # Extract main monster section
    main_sections = extract_tagged_section(content, 'MAINMONSTER')
    if not main_sections:
        logger.warning("Could not find {MAINMONSTER} section")
        return None
    
    main_content = main_sections[0]
    
    # Extract monster name from first line after {MAINMONSTER} tag
    lines = main_content.strip().split('\n', 1)
    monster_name_raw = lines[0].strip() if lines else None
    
    if not monster_name_raw:
        logger.warning("Could not find monster name in {MAINMONSTER} section")
        return None
    
    # Normalize to title case (will be overridden by statblock variant_name if available)
    monster_name = normalize_monster_name(monster_name_raw)
    
    # Check if monster already exists
    existing_monster_id = db.get_monster_id_by_name(monster_name)
    
    if existing_monster_id:
        if skip_existing:
            existing_name = db.get_existing_monster_name(monster_name)
            if existing_name != monster_name:
                logger.info(f"⊘ Skipping {monster_name} (already exists as '{existing_name}' in database)")
            else:
                logger.info(f"⊘ Skipping {monster_name} (already exists in database)")
            return None
        elif update_existing:
            logger.info(f"↻ Updating existing monster: {monster_name} (ID: {existing_monster_id})")
            delete_monster_and_related_data(existing_monster_id, db)
        else:
            # Default behavior: error if monster exists
            existing_name = db.get_existing_monster_name(monster_name)
            raise ImportError(
                f"Monster '{monster_name}' already exists in database as '{existing_name}'. Use --skip-existing to skip or --update to overwrite.",
                monster_name=monster_name,
                field="Monster",
                value=monster_name
            )
    
    base_statblock = extract_statblock_from_section(main_content, exclude_nested=True)
    if base_statblock:
        base_statblock['variant_name'] = ''
        _validate_statblock_completeness(base_statblock, monster_name)
        logger.debug(f"Found statblock for base monster with {len([k for k in base_statblock.keys() if k not in ['variant_name', 'type_line']])} fields")
    
    flavor_text = extract_flavor_text(main_content, exclude_nested=True)
    description, description_traits_abilities = extract_description(main_content, flavor_text, db, monster_name, update_existing=update_existing, exclude_nested=True)
    combat_description = extract_combat_description(main_content, db, exclude_nested=True)
    # Exclude nested SA tags to avoid extracting abilities from VARIANT/CATEGORY/GROUP sections
    special_abilities, prepared_spells, prepared_spell_slots = extract_combat_section(main_content, db, monster_name, exclude_nested=True)
    
    if description_traits_abilities:
        logger.debug(f"Adding {len(description_traits_abilities)} Traits ability/abilities from description to special_abilities")
        special_abilities.extend(description_traits_abilities)
    
    monster_name_normalized = re.sub(r',\s*\d+[a-z]{0,2}-Level\s+\w+.*$', '', monster_name, flags=re.IGNORECASE).strip().upper()
    
    if base_statblock:
        variant_name = base_statblock.get('variant_name', '').strip()
        if variant_name:
            variant_name_normalized = re.sub(r',\s*\d+[a-z]{0,2}-Level\s+\w+.*$', '', variant_name, flags=re.IGNORECASE).strip().upper()
            if variant_name_normalized == monster_name_normalized:
                variant_name_cleaned = re.sub(r',\s*\d+[a-z]{0,2}-Level\s+\w+.*$', '', variant_name, flags=re.IGNORECASE).strip()
                monster_name = normalize_monster_name(variant_name_cleaned)
                logger.debug(f"Using statblock variant_name '{variant_name}' (cleaned to '{monster_name}') for base monster name")
    
    base_data = {
        'name': monster_name,
        'flavor_text': flavor_text,
        'description': description,
        'combat_description': combat_description,
        'special_abilities': special_abilities,
        'prepared_spells': prepared_spells,
        'prepared_spell_slots': prepared_spell_slots,
        'statblock': base_statblock
    }
    
    db.begin_transaction()
    
    try:
        logger.debug(f"Inserting base monster: {monster_name} (statblock: {'present' if base_statblock else 'None'})")
        base_monster_id = insert_base_monster(base_data, db)
        logger.debug(f"Base monster inserted with ID: {base_monster_id}")
        
        if base_monster_id is None:
            raise ValueError(f"Failed to get base_monster_id after inserting base monster '{monster_name}'")
        
        base_monster_name_normalized = normalize_monster_name(base_data['name'])
        all_monster_names = {base_monster_name_normalized: base_monster_id}
        logger.debug(f"Initialized all_monster_names with base: '{base_monster_name_normalized}' -> {base_monster_id}")
        
        # Check for GROUP sections first (new hierarchy level)
        group_sections = extract_tagged_section(main_content, 'GROUP')
        
        groups_count = 0
        categories_count = 0
        variants_count = 0
        
        if group_sections:
            # Process four-level hierarchy: MAINMONSTER -> GROUP -> CATEGORY -> VARIANT
            # Or three-level: MAINMONSTER -> GROUP -> VARIANT
            logger.debug(f"Found {len(group_sections)} GROUP section(s)")
            
            for group_content in group_sections:
                group_lines = group_content.strip().split('\n', 1)
                group_name_raw = group_lines[0].strip() if group_lines else None
                
                if not group_name_raw:
                    logger.warning("Skipping group with no name")
                    continue
                
                group_name = normalize_monster_name(group_name_raw)
                logger.debug(f"Processing group: '{group_name}' (from '{group_name_raw}')")
                
                # Extract group data (flavor text, description, combat, special abilities)
                # Exclude nested CATEGORY and VARIANT tags to avoid extracting from child sections
                # For GROUP, exclude only VARIANT and CATEGORY (not GROUP itself)
                group_exclude_list = ['VARIANT', 'CATEGORY']
                group_statblock = extract_statblock_from_section(group_content, exclude_nested=True, exclude_list=group_exclude_list)
                if group_statblock:
                    group_statblock['variant_name'] = ''
                    _validate_statblock_completeness(group_statblock, group_name)
                
                group_flavor_text = extract_flavor_text(group_content, exclude_nested=True, exclude_list=group_exclude_list)
                group_description, group_description_traits_abilities = extract_description(group_content, group_flavor_text, db, group_name, update_existing=update_existing, exclude_nested=True, exclude_list=group_exclude_list)
                group_combat_description = extract_combat_description(group_content, db, exclude_nested=True, exclude_list=group_exclude_list)
                group_special_abilities, group_prepared_spells, group_prepared_spell_slots = extract_combat_section(group_content, db, group_name, exclude_nested=True, exclude_list=group_exclude_list)
                
                if group_description_traits_abilities:
                    logger.debug(f"Group {group_name}: Adding {len(group_description_traits_abilities)} Traits ability/abilities from description to special_abilities")
                    group_special_abilities.extend(group_description_traits_abilities)
                
                # Insert group as a monster with BaseMonsterId pointing to the MAINMONSTER
                group_data = {
                    'name': group_name,
                    'base_monster_id': base_monster_id,
                    'statblock': group_statblock,
                    'flavor_text': group_flavor_text,
                    'description': group_description,
                    'combat_description': group_combat_description,
                    'special_abilities': group_special_abilities,
                    'prepared_spells': group_prepared_spells,
                    'prepared_spell_slots': group_prepared_spell_slots
                }
                logger.debug(f"Inserting group '{group_name}' with base_monster_id: {base_monster_id}")
                group_monster_id = insert_variant_monster(group_data, db)
                all_monster_names[group_name] = group_monster_id
                groups_count += 1
                logger.debug(f"Tracked group '{group_name}' with ID {group_monster_id} in all_monster_names")
                
                # Process extra descriptions from within this GROUP section
                process_extra_descriptions_from_section(group_content, group_monster_id, db, group_name, update_existing=update_existing)
                
                # Check for CATEGORY sections within this GROUP
                category_sections = extract_tagged_section(group_content, 'CATEGORY')
                
                if category_sections:
                    # Process CATEGORY sections within GROUP: GROUP -> CATEGORY -> VARIANT
                    for category_content in category_sections:
                        category_lines = category_content.strip().split('\n', 1)
                        category_name_raw = category_lines[0].strip() if category_lines else None
                        
                        if not category_name_raw:
                            logger.warning(f"Skipping category with no name in group '{group_name}'")
                            continue
                        
                        category_name = normalize_monster_name(category_name_raw)
                        logger.debug(f"Processing category: '{category_name}' (from '{category_name_raw}') in group '{group_name}'")
                        
                        # Extract category data
                        # For CATEGORY, exclude only VARIANT (not CATEGORY or GROUP)
                        category_exclude_list = ['VARIANT']
                        category_statblock = extract_statblock_from_section(category_content, exclude_nested=True, exclude_list=category_exclude_list)
                        if category_statblock:
                            category_statblock['variant_name'] = ''
                            _validate_statblock_completeness(category_statblock, category_name)
                        
                        category_flavor_text = extract_flavor_text(category_content, exclude_nested=True, exclude_list=category_exclude_list)
                        category_description, category_description_traits_abilities = extract_description(category_content, category_flavor_text, db, category_name, update_existing=update_existing, exclude_nested=True, exclude_list=category_exclude_list)
                        category_combat_description = extract_combat_description(category_content, db, exclude_nested=True, exclude_list=category_exclude_list)
                        category_special_abilities, category_prepared_spells, category_prepared_spell_slots = extract_combat_section(category_content, db, category_name, exclude_nested=True, exclude_list=category_exclude_list)
                        
                        if category_description_traits_abilities:
                            logger.debug(f"Category {category_name}: Adding {len(category_description_traits_abilities)} Traits ability/abilities from description to special_abilities")
                            category_special_abilities.extend(category_description_traits_abilities)
                        
                        # Insert category with BaseMonsterId pointing to the GROUP
                        category_data = {
                            'name': category_name,
                            'base_monster_id': group_monster_id,  # Point to group, not main monster
                            'statblock': category_statblock,
                            'flavor_text': category_flavor_text,
                            'description': category_description,
                            'combat_description': category_combat_description,
                            'special_abilities': category_special_abilities,
                            'prepared_spells': category_prepared_spells,
                            'prepared_spell_slots': category_prepared_spell_slots
                        }
                        logger.debug(f"Inserting category '{category_name}' with base_monster_id: {group_monster_id} (group: {group_name})")
                        category_monster_id = insert_variant_monster(category_data, db)
                        all_monster_names[category_name] = category_monster_id
                        categories_count += 1
                        logger.debug(f"Tracked category '{category_name}' with ID {category_monster_id} in all_monster_names")
                        
                        # Process extra descriptions from within this CATEGORY section
                        process_extra_descriptions_from_section(category_content, category_monster_id, db, category_name, update_existing=update_existing)
                        
                        # Extract VARIANT sections from within this CATEGORY
                        variant_sections = extract_tagged_section(category_content, 'VARIANT')
                        
                        for variant_content in variant_sections:
                            variant_lines = variant_content.strip().split('\n', 1)
                            variant_name_raw = variant_lines[0].strip() if variant_lines else None
                            
                            if not variant_name_raw:
                                logger.warning(f"Skipping variant with no name in category '{category_name}'")
                                continue
                            
                            variant_name = clean_variant_name(variant_name_raw, category_name)
                            variant_name = normalize_monster_name(variant_name)
                            logger.debug(f"Processing variant: '{variant_name}' (from '{variant_name_raw}') in category '{category_name}' (group: {group_name})")
                            
                            variant_statblock = extract_statblock_from_section(variant_content)
                            if variant_statblock:
                                variant_statblock['variant_name'] = variant_name
                                _validate_statblock_completeness(variant_statblock, variant_name)
                            
                            variant_flavor_text = extract_flavor_text(variant_content)
                            variant_description, variant_description_traits_abilities = extract_description(variant_content, variant_flavor_text, db, variant_name, update_existing=update_existing)
                            variant_combat_description = extract_combat_description(variant_content, db)
                            variant_special_abilities, variant_prepared_spells, variant_prepared_spell_slots = extract_combat_section(variant_content, db, variant_name)
                            
                            if variant_description_traits_abilities:
                                logger.debug(f"Variant {variant_name}: Adding {len(variant_description_traits_abilities)} Traits ability/abilities from description to special_abilities")
                                variant_special_abilities.extend(variant_description_traits_abilities)
                            
                            variant_name_normalized = normalize_monster_name(variant_name)
                            
                            # Insert variant with BaseMonsterId pointing to the CATEGORY
                            variant_data = {
                                'name': variant_name_normalized,
                                'base_monster_id': category_monster_id,  # Point to category
                                'statblock': variant_statblock,
                                'flavor_text': variant_flavor_text,
                                'description': variant_description,
                                'combat_description': variant_combat_description,
                                'special_abilities': variant_special_abilities,
                                'prepared_spells': variant_prepared_spells,
                                'prepared_spell_slots': variant_prepared_spell_slots
                            }
                            logger.debug(f"Inserting variant '{variant_name_normalized}' (from '{variant_name}') with base_monster_id: {category_monster_id} (category: {category_name}, group: {group_name})")
                            if variant_data.get('base_monster_id') is None:
                                raise ValueError(f"base_monster_id is None for variant '{variant_name}'. Category monster ID was: {category_monster_id}")
                            variant_monster_id = insert_variant_monster(variant_data, db)
                            all_monster_names[variant_name_normalized] = variant_monster_id
                            variants_count += 1
                            logger.debug(f"Tracked variant '{variant_name_normalized}' with ID {variant_monster_id} in all_monster_names")
                            
                            # Process extra descriptions from within this VARIANT section
                            process_extra_descriptions_from_section(variant_content, variant_monster_id, db, variant_name_normalized, update_existing=update_existing)
                else:
                    # No CATEGORY sections within GROUP - check for VARIANT sections directly within GROUP
                    variant_sections = extract_tagged_section(group_content, 'VARIANT')
                    
                    for variant_content in variant_sections:
                        variant_lines = variant_content.strip().split('\n', 1)
                        variant_name_raw = variant_lines[0].strip() if variant_lines else None
                        
                        if not variant_name_raw:
                            logger.warning(f"Skipping variant with no name in group '{group_name}'")
                            continue
                        
                        variant_name = clean_variant_name(variant_name_raw, group_name)
                        variant_name = normalize_monster_name(variant_name)
                        logger.debug(f"Processing variant: '{variant_name}' (from '{variant_name_raw}') in group '{group_name}'")
                        
                        variant_statblock = extract_statblock_from_section(variant_content)
                        if variant_statblock:
                            variant_statblock['variant_name'] = variant_name
                            _validate_statblock_completeness(variant_statblock, variant_name)
                        
                        variant_flavor_text = extract_flavor_text(variant_content)
                        variant_description, variant_description_traits_abilities = extract_description(variant_content, variant_flavor_text, db, variant_name, update_existing=update_existing)
                        variant_combat_description = extract_combat_description(variant_content, db)
                        variant_special_abilities, variant_prepared_spells, variant_prepared_spell_slots = extract_combat_section(variant_content, db, variant_name)
                        
                        if variant_description_traits_abilities:
                            logger.debug(f"Variant {variant_name}: Adding {len(variant_description_traits_abilities)} Traits ability/abilities from description to special_abilities")
                            variant_special_abilities.extend(variant_description_traits_abilities)
                        
                        variant_name_normalized = normalize_monster_name(variant_name)
                        
                        # Insert variant with BaseMonsterId pointing to the GROUP
                        variant_data = {
                            'name': variant_name_normalized,
                            'base_monster_id': group_monster_id,  # Point to group, not main monster
                            'statblock': variant_statblock,
                            'flavor_text': variant_flavor_text,
                            'description': variant_description,
                            'combat_description': variant_combat_description,
                            'special_abilities': variant_special_abilities,
                            'prepared_spells': variant_prepared_spells,
                            'prepared_spell_slots': variant_prepared_spell_slots
                        }
                        logger.debug(f"Inserting variant '{variant_name_normalized}' (from '{variant_name}') with base_monster_id: {group_monster_id} (group: {group_name})")
                        if variant_data.get('base_monster_id') is None:
                            raise ValueError(f"base_monster_id is None for variant '{variant_name}'. Group monster ID was: {group_monster_id}")
                        variant_monster_id = insert_variant_monster(variant_data, db)
                        all_monster_names[variant_name_normalized] = variant_monster_id
                        variants_count += 1
                        logger.debug(f"Tracked variant '{variant_name_normalized}' with ID {variant_monster_id} in all_monster_names")
                        
                        # Process extra descriptions from within this VARIANT section
                        process_extra_descriptions_from_section(variant_content, variant_monster_id, db, variant_name_normalized, update_existing=update_existing)
        else:
            # No GROUP sections - check for CATEGORY sections (existing behavior)
            category_sections = extract_tagged_section(main_content, 'CATEGORY')
            
            if category_sections:
                # Process three-level hierarchy: MAINMONSTER -> CATEGORY -> VARIANT
                logger.debug(f"Found {len(category_sections)} CATEGORY section(s)")
                
                for category_content in category_sections:
                    category_lines = category_content.strip().split('\n', 1)
                    category_name_raw = category_lines[0].strip() if category_lines else None
                    
                    if not category_name_raw:
                        logger.warning("Skipping category with no name")
                        continue
                    
                    category_name = normalize_monster_name(category_name_raw)
                    logger.debug(f"Processing category: '{category_name}' (from '{category_name_raw}')")
                    
                    # Extract category data (flavor text, description, combat, special abilities)
                    # For CATEGORY, exclude only VARIANT (not CATEGORY or GROUP)
                    category_exclude_list = ['VARIANT']
                    category_statblock = extract_statblock_from_section(category_content, exclude_nested=True, exclude_list=category_exclude_list)
                    if category_statblock:
                        category_statblock['variant_name'] = ''
                        _validate_statblock_completeness(category_statblock, category_name)
                    
                    category_flavor_text = extract_flavor_text(category_content, exclude_nested=True, exclude_list=category_exclude_list)
                    category_description, category_description_traits_abilities = extract_description(category_content, category_flavor_text, db, category_name, update_existing=update_existing, exclude_nested=True, exclude_list=category_exclude_list)
                    category_combat_description = extract_combat_description(category_content, db, exclude_nested=True, exclude_list=category_exclude_list)
                    category_special_abilities, category_prepared_spells, category_prepared_spell_slots = extract_combat_section(category_content, db, category_name, exclude_nested=True, exclude_list=category_exclude_list)
                    
                    if category_description_traits_abilities:
                        logger.debug(f"Category {category_name}: Adding {len(category_description_traits_abilities)} Traits ability/abilities from description to special_abilities")
                        category_special_abilities.extend(category_description_traits_abilities)
                    
                    # Insert category as a monster with BaseMonsterId pointing to the MAINMONSTER
                    category_data = {
                        'name': category_name,
                        'base_monster_id': base_monster_id,
                        'statblock': category_statblock,
                        'flavor_text': category_flavor_text,
                        'description': category_description,
                        'combat_description': category_combat_description,
                        'special_abilities': category_special_abilities,
                        'prepared_spells': category_prepared_spells,
                        'prepared_spell_slots': category_prepared_spell_slots
                    }
                    logger.debug(f"Inserting category '{category_name}' with base_monster_id: {base_monster_id}")
                    category_monster_id = insert_variant_monster(category_data, db)
                    all_monster_names[category_name] = category_monster_id
                    categories_count += 1
                    logger.debug(f"Tracked category '{category_name}' with ID {category_monster_id} in all_monster_names")
                    
                    # Process extra descriptions from within this CATEGORY section
                    process_extra_descriptions_from_section(category_content, category_monster_id, db, category_name, update_existing=update_existing)
                    
                    # Extract VARIANT sections from within this CATEGORY
                    variant_sections = extract_tagged_section(category_content, 'VARIANT')
                    
                    for variant_content in variant_sections:
                        variant_lines = variant_content.strip().split('\n', 1)
                        variant_name_raw = variant_lines[0].strip() if variant_lines else None
                        
                        if not variant_name_raw:
                            logger.warning(f"Skipping variant with no name in category '{category_name}'")
                            continue
                        
                        variant_name = clean_variant_name(variant_name_raw, category_name)
                        variant_name = normalize_monster_name(variant_name)
                        logger.debug(f"Processing variant: '{variant_name}' (from '{variant_name_raw}') in category '{category_name}'")
                        
                        variant_statblock = extract_statblock_from_section(variant_content)
                        if variant_statblock:
                            variant_statblock['variant_name'] = variant_name
                            _validate_statblock_completeness(variant_statblock, variant_name)
                        
                        variant_flavor_text = extract_flavor_text(variant_content)
                        variant_description, variant_description_traits_abilities = extract_description(variant_content, variant_flavor_text, db, variant_name, update_existing=update_existing)
                        variant_combat_description = extract_combat_description(variant_content, db)
                        variant_special_abilities, variant_prepared_spells, variant_prepared_spell_slots = extract_combat_section(variant_content, db, variant_name)
                        
                        if variant_description_traits_abilities:
                            logger.debug(f"Variant {variant_name}: Adding {len(variant_description_traits_abilities)} Traits ability/abilities from description to special_abilities")
                            variant_special_abilities.extend(variant_description_traits_abilities)
                        
                        variant_name_normalized = normalize_monster_name(variant_name)
                        
                        # Insert variant with BaseMonsterId pointing to the CATEGORY
                        variant_data = {
                            'name': variant_name_normalized,
                            'base_monster_id': category_monster_id,  # Point to category, not main monster
                            'statblock': variant_statblock,
                            'flavor_text': variant_flavor_text,
                            'description': variant_description,
                            'combat_description': variant_combat_description,
                            'special_abilities': variant_special_abilities,
                            'prepared_spells': variant_prepared_spells,
                            'prepared_spell_slots': variant_prepared_spell_slots
                        }
                        logger.debug(f"Inserting variant '{variant_name_normalized}' (from '{variant_name}') with base_monster_id: {category_monster_id} (category: {category_name})")
                        if variant_data.get('base_monster_id') is None:
                            raise ValueError(f"base_monster_id is None for variant '{variant_name}'. Category monster ID was: {category_monster_id}")
                        variant_monster_id = insert_variant_monster(variant_data, db)
                        all_monster_names[variant_name_normalized] = variant_monster_id
                        variants_count += 1
                        logger.debug(f"Tracked variant '{variant_name_normalized}' with ID {variant_monster_id} in all_monster_names")
                        
                        # Process extra descriptions from within this VARIANT section
                        process_extra_descriptions_from_section(variant_content, variant_monster_id, db, variant_name_normalized, update_existing=update_existing)
            else:
                # No CATEGORY sections - process VARIANT sections directly from MAINMONSTER (original behavior)
                variant_sections = extract_tagged_section(main_content, 'VARIANT')
                
                for variant_content in variant_sections:
                    variant_lines = variant_content.strip().split('\n', 1)
                    variant_name_raw = variant_lines[0].strip() if variant_lines else None
                    
                    if not variant_name_raw:
                        logger.warning("Skipping variant with no name")
                        continue
                    
                    variant_name = clean_variant_name(variant_name_raw, monster_name)
                    variant_name = normalize_monster_name(variant_name)
                    logger.debug(f"Processing variant: '{variant_name}' (from '{variant_name_raw}')")
                    
                    variant_statblock = extract_statblock_from_section(variant_content)
                    if variant_statblock:
                        variant_statblock['variant_name'] = variant_name
                        _validate_statblock_completeness(variant_statblock, variant_name)
                    
                    variant_flavor_text = extract_flavor_text(variant_content)
                    variant_description, variant_description_traits_abilities = extract_description(variant_content, variant_flavor_text, db, variant_name, update_existing=update_existing)
                    variant_combat_description = extract_combat_description(variant_content, db)
                    variant_special_abilities, variant_prepared_spells, variant_prepared_spell_slots = extract_combat_section(variant_content, db, variant_name)
                    
                    if variant_description_traits_abilities:
                        logger.debug(f"Variant {variant_name}: Adding {len(variant_description_traits_abilities)} Traits ability/abilities from description to special_abilities")
                        variant_special_abilities.extend(variant_description_traits_abilities)
                    
                    variant_name_normalized = normalize_monster_name(variant_name)
                    
                    variant_data = {
                        'name': variant_name_normalized,
                        'base_monster_id': base_monster_id,
                        'statblock': variant_statblock,
                        'flavor_text': variant_flavor_text,
                        'description': variant_description,
                        'combat_description': variant_combat_description,
                        'special_abilities': variant_special_abilities,
                        'prepared_spells': variant_prepared_spells,
                        'prepared_spell_slots': variant_prepared_spell_slots
                    }
                    logger.debug(f"Inserting variant '{variant_name_normalized}' (from '{variant_name}') with base_monster_id: {base_monster_id}")
                    if variant_data.get('base_monster_id') is None:
                        raise ValueError(f"base_monster_id is None for variant '{variant_name}'. Base monster ID was: {base_monster_id}")
                    variant_monster_id = insert_variant_monster(variant_data, db)
                    all_monster_names[variant_name_normalized] = variant_monster_id
                    variants_count += 1
                    logger.debug(f"Tracked variant '{variant_name_normalized}' with ID {variant_monster_id} in all_monster_names")
                    
                    # Process extra descriptions from within this VARIANT section
                    process_extra_descriptions_from_section(variant_content, variant_monster_id, db, variant_name_normalized, update_existing=update_existing)
        
        # Process extra descriptions from the MAINMONSTER section
        process_extra_descriptions_from_section(main_content, base_monster_id, db, monster_name, update_existing=update_existing)
        
        db.commit()
        
        # Return counts for all hierarchy levels
        return {
            'base_monster_id': base_monster_id,
            'groups_count': groups_count,
            'categories_count': categories_count,
            'variants_count': variants_count
        }
    except Exception:
        db.rollback()
        raise


def import_monster_file(txt_file: Path, db: DatabaseConnection, skip_existing: bool = False, update_existing: bool = False) -> Tuple[bool, Optional[str]]:
    """
    Import a single monster file.
    
    Args:
        txt_file: Path to the tagged text file
        db: DatabaseConnection instance
        skip_existing: If True, skip monsters that already exist in database
    
    Returns:
        Tuple of (success: bool, error_message: Optional[str])
    """
    try:
        logger.info(f"Processing: {txt_file.name}")
        content = parse_tagged_file(str(txt_file))
        result = extract_monster_data(content, db, skip_existing=skip_existing, update_existing=update_existing)
        
        if result:
            logger.info(f"✓ Successfully processed {txt_file.name}")
            return True, None
        else:
            error_msg = f"Failed to extract monster data from {txt_file.name}"
            logger.error(f"✗ {error_msg}")
            return False, error_msg
    
    except ImportError as e:
        error_msg = f"Import validation error in {txt_file.name}: {str(e)}"
        logger.error(f"✗ {error_msg}")
        logger.error(f"  This may be an OCR error in the source tagged text file or a missing entry in the database.")
        logger.error(f"  Please check the source file and correct any errors, or add missing data to the database.")
        return False, error_msg
    
    except Exception as e:
        error_msg = f"Unexpected error processing {txt_file.name}: {str(e)}"
        logger.error(f"✗ {error_msg}", exc_info=True)
        return False, error_msg


def list_monsters_in_file(file_path: Path) -> None:
    """
    List all monster, group, category, and variant names found in a tagged text file.
    Shows the hierarchy and which parent each entry belongs to.
    
    Args:
        file_path: Path to the tagged text file
    """
    try:
        content = parse_tagged_file(str(file_path))
        
        # Extract main monster
        main_sections = extract_tagged_section(content, 'MAINMONSTER')
        main_monster_name = None
        main_content = None
        if main_sections:
            main_content = main_sections[0]
            lines = main_content.strip().split('\n', 1)
            main_monster_name = lines[0].strip() if lines else None
            if main_monster_name:
                print(f"Main Monster: {main_monster_name}")
        
        # Check for GROUP sections first
        if main_content:
            group_sections = extract_tagged_section(main_content, 'GROUP')
            if group_sections:
                # Four-level hierarchy: MAINMONSTER -> GROUP -> CATEGORY -> VARIANT
                # Or three-level: MAINMONSTER -> GROUP -> VARIANT
                for group_content in group_sections:
                    group_lines = group_content.strip().split('\n', 1)
                    group_name = group_lines[0].strip() if group_lines else None
                    if group_name:
                        print(f"  Group: {group_name}")
                    
                    # Check for CATEGORY sections within this GROUP
                    category_sections = extract_tagged_section(group_content, 'CATEGORY')
                    if category_sections:
                        # GROUP -> CATEGORY -> VARIANT
                        for category_content in category_sections:
                            category_lines = category_content.strip().split('\n', 1)
                            category_name = category_lines[0].strip() if category_lines else None
                            if category_name:
                                print(f"    Category: {category_name} (group: {group_name})")
                            
                            # Extract variants within this category
                            variant_sections = extract_tagged_section(category_content, 'VARIANT')
                            for variant_content in variant_sections:
                                variant_lines = variant_content.strip().split('\n', 1)
                                variant_name = variant_lines[0].strip() if variant_lines else None
                                if variant_name:
                                    print(f"      Variant: {variant_name} (category: {category_name}, group: {group_name})")
                    else:
                        # GROUP -> VARIANT (no category)
                        variant_sections = extract_tagged_section(group_content, 'VARIANT')
                        for variant_content in variant_sections:
                            variant_lines = variant_content.strip().split('\n', 1)
                            variant_name = variant_lines[0].strip() if variant_lines else None
                            if variant_name:
                                print(f"    Variant: {variant_name} (group: {group_name})")
            else:
                # No GROUP sections - check for CATEGORY sections
                category_sections = extract_tagged_section(main_content, 'CATEGORY')
                if category_sections:
                    # Three-level hierarchy: MAINMONSTER -> CATEGORY -> VARIANT
                    for category_content in category_sections:
                        category_lines = category_content.strip().split('\n', 1)
                        category_name = category_lines[0].strip() if category_lines else None
                        if category_name:
                            print(f"  Category: {category_name}")
                        
                        # Extract variants within this category
                        variant_sections = extract_tagged_section(category_content, 'VARIANT')
                        for variant_content in variant_sections:
                            variant_lines = variant_content.strip().split('\n', 1)
                            variant_name = variant_lines[0].strip() if variant_lines else None
                            if variant_name:
                                print(f"    Variant: {variant_name} (category: {category_name})")
                else:
                    # Two-level hierarchy: MAINMONSTER -> VARIANT
                    variant_sections = extract_tagged_section(main_content, 'VARIANT')
                    if variant_sections:
                        for variant_content in variant_sections:
                            variant_lines = variant_content.strip().split('\n', 1)
                            variant_name = variant_lines[0].strip() if variant_lines else None
                            if variant_name:
                                if main_monster_name:
                                    print(f"  Variant: {variant_name} (main monster: {main_monster_name})")
                                else:
                                    print(f"  Variant: {variant_name}")
    
    except Exception as e:
        logger.error(f"Error listing monsters in {file_path}: {e}")


def list_tables_in_file(file_path: Path) -> None:
    """
    List all reference tables found in a tagged text file.
    Shows the table name, slug, and location.
    
    Args:
        file_path: Path to the tagged text file
    """
    try:
        content = parse_tagged_file(str(file_path))
        
        # Extract all TABLE blocks
        table_sections = extract_tagged_section(content, 'TABLE')
        
        if not table_sections:
            print(f"No tables found in {file_path.name}")
            return
        
        tables_found = []
        lines = content.split('\n')
        
        # Find line numbers for each table
        for table_content in table_sections:
            table_data = parse_table_from_tagged_section(table_content)
            
            if not table_data:
                continue
            
            # Find the line number where this table appears
            # Search for the table name in the content
            table_name = table_data['name']
            slug = generate_table_slug(table_name)
            
            # Find line number by searching for {TABLE} followed by the table name
            line_num = None
            for i, line in enumerate(lines, start=1):
                if '{TABLE}' in line:
                    # Check if next non-empty line matches table name
                    for j in range(i, min(i + 3, len(lines))):
                        if table_name in lines[j - 1]:
                            line_num = j
                            break
                    if line_num:
                        break
            
            tables_found.append({
                'name': table_name,
                'slug': slug,
                'title': table_data.get('title'),
                'columns': len(table_data['columns']),
                'rows': len(table_data['rows']),
                'line': line_num
            })
        
        if tables_found:
            print(f"Tables found in {file_path.name}:")
            for table in tables_found:
                title_info = f" ({table['title']})" if table.get('title') else ""
                print(f"  {table['name']}{title_info}")
                print(f"    Slug: {table['slug']}")
                print(f"    Columns: {table['columns']}, Rows: {table['rows']}")
                if table['line']:
                    print(f"    Line: {table['line']}")
        else:
            print(f"No valid tables found in {file_path.name}")
    
    except Exception as e:
        logger.error(f"Error listing tables in {file_path}: {e}")


def list_sidebars_in_file(file_path: Path) -> None:
    """
    List all extra description entries (sidebars, ASCHARACTERS, etc.) found in a tagged text file.
    Shows the type, title, and which monster/category/variant each entry belongs to.
    Uses the tag structure to determine ownership - extra descriptions are extracted
    from within the MAINMONSTER, CATEGORY, or VARIANT section they appear in.
    
    Args:
        file_path: Path to the tagged text file
    """
    try:
        content = parse_tagged_file(str(file_path))
        
        # Extract main monster name and content
        main_sections = extract_tagged_section(content, 'MAINMONSTER')
        main_monster_name = None
        main_content = None
        if main_sections:
            main_content = main_sections[0]
            lines = main_content.strip().split('\n', 1)
            main_monster_name = lines[0].strip() if lines else None
        
        # Map of tag names to type names
        # Note: CHARACTERS and ASCHARACTERS are different types
        extra_desc_types = {
            'SIDEBAR': 'Sidebar',
            'CHARACTERS': 'Character',
            'ASCHARACTERS': 'AsCharacters',
            'CREATING': 'Creating',
            'SOCIETY': 'Society',
            'TACTICS': 'Tactics',
            'TRAINING': 'Training',
            'MOUNT': 'Mount',
        }
        
        found_any = False
        
        # Process extra descriptions from MAINMONSTER section
        if main_content and main_monster_name:
            for tag_name, type_name in extra_desc_types.items():
                sections = extract_tagged_section(main_content, tag_name)
                for section_content in sections:
                    lines = section_content.strip().split('\n', 1)
                    title = lines[0].strip() if lines else None
                    if title:
                        print(f"{type_name}: {title} (main monster: {main_monster_name})")
                        found_any = True
        
        # Check for GROUP sections first
        if main_content:
            group_sections = extract_tagged_section(main_content, 'GROUP')
            if group_sections:
                # Four-level hierarchy: MAINMONSTER -> GROUP -> CATEGORY -> VARIANT
                # Or three-level: MAINMONSTER -> GROUP -> VARIANT
                for group_content in group_sections:
                    group_lines = group_content.strip().split('\n', 1)
                    group_name = group_lines[0].strip() if group_lines else None
                    
                    if group_name:
                        # Process extra descriptions from each GROUP section
                        for tag_name, type_name in extra_desc_types.items():
                            sections = extract_tagged_section(group_content, tag_name)
                            for section_content in sections:
                                section_lines = section_content.strip().split('\n', 1)
                                title = section_lines[0].strip() if section_lines else None
                                if title:
                                    print(f"  {type_name}: {title} (group: {group_name})")
                                    found_any = True
                        
                        # Check for CATEGORY sections within this GROUP
                        category_sections = extract_tagged_section(group_content, 'CATEGORY')
                        if category_sections:
                            # GROUP -> CATEGORY -> VARIANT
                            for category_content in category_sections:
                                category_lines = category_content.strip().split('\n', 1)
                                category_name = category_lines[0].strip() if category_lines else None
                                
                                if category_name:
                                    # Process extra descriptions from each CATEGORY section
                                    for tag_name, type_name in extra_desc_types.items():
                                        sections = extract_tagged_section(category_content, tag_name)
                                        for section_content in sections:
                                            section_lines = section_content.strip().split('\n', 1)
                                            title = section_lines[0].strip() if section_lines else None
                                            if title:
                                                print(f"    {type_name}: {title} (category: {category_name}, group: {group_name})")
                                                found_any = True
                                    
                                    # Process extra descriptions from VARIANT sections within this CATEGORY
                                    variant_sections = extract_tagged_section(category_content, 'VARIANT')
                                    for variant_content in variant_sections:
                                        variant_lines = variant_content.strip().split('\n', 1)
                                        variant_name = variant_lines[0].strip() if variant_lines else None
                                        
                                        if variant_name:
                                            for tag_name, type_name in extra_desc_types.items():
                                                sections = extract_tagged_section(variant_content, tag_name)
                                                for section_content in sections:
                                                    section_lines = section_content.strip().split('\n', 1)
                                                    title = section_lines[0].strip() if section_lines else None
                                                    if title:
                                                        print(f"      {type_name}: {title} (variant: {variant_name}, category: {category_name}, group: {group_name})")
                                                        found_any = True
                        else:
                            # GROUP -> VARIANT (no category)
                            variant_sections = extract_tagged_section(group_content, 'VARIANT')
                            for variant_content in variant_sections:
                                variant_lines = variant_content.strip().split('\n', 1)
                                variant_name = variant_lines[0].strip() if variant_lines else None
                                
                                if variant_name:
                                    for tag_name, type_name in extra_desc_types.items():
                                        sections = extract_tagged_section(variant_content, tag_name)
                                        for section_content in sections:
                                            section_lines = section_content.strip().split('\n', 1)
                                            title = section_lines[0].strip() if section_lines else None
                                            if title:
                                                print(f"    {type_name}: {title} (variant: {variant_name}, group: {group_name})")
                                                found_any = True
            else:
                # No GROUP sections - check for CATEGORY sections
                category_sections = extract_tagged_section(main_content, 'CATEGORY')
                if category_sections:
                    # Three-level hierarchy: MAINMONSTER -> CATEGORY -> VARIANT
                    for category_content in category_sections:
                        category_lines = category_content.strip().split('\n', 1)
                        category_name = category_lines[0].strip() if category_lines else None
                        
                        if category_name:
                            # Process extra descriptions from each CATEGORY section
                            for tag_name, type_name in extra_desc_types.items():
                                sections = extract_tagged_section(category_content, tag_name)
                                for section_content in sections:
                                    section_lines = section_content.strip().split('\n', 1)
                                    title = section_lines[0].strip() if section_lines else None
                                    if title:
                                        print(f"  {type_name}: {title} (category: {category_name})")
                                        found_any = True
                            
                            # Process extra descriptions from VARIANT sections within this CATEGORY
                            variant_sections = extract_tagged_section(category_content, 'VARIANT')
                            for variant_content in variant_sections:
                                variant_lines = variant_content.strip().split('\n', 1)
                                variant_name = variant_lines[0].strip() if variant_lines else None
                                
                                if variant_name:
                                    for tag_name, type_name in extra_desc_types.items():
                                        sections = extract_tagged_section(variant_content, tag_name)
                                        for section_content in sections:
                                            section_lines = section_content.strip().split('\n', 1)
                                            title = section_lines[0].strip() if section_lines else None
                                            if title:
                                                print(f"    {type_name}: {title} (variant: {variant_name}, category: {category_name})")
                                                found_any = True
                else:
                    # Two-level hierarchy: MAINMONSTER -> VARIANT
                    variant_sections = extract_tagged_section(main_content, 'VARIANT')
                    for variant_content in variant_sections:
                        variant_lines = variant_content.strip().split('\n', 1)
                        variant_name = variant_lines[0].strip() if variant_lines else None
                        
                        if variant_name:
                            for tag_name, type_name in extra_desc_types.items():
                                sections = extract_tagged_section(variant_content, tag_name)
                                for section_content in sections:
                                    section_lines = section_content.strip().split('\n', 1)
                                    title = section_lines[0].strip() if section_lines else None
                                    if title:
                                        if main_monster_name:
                                            print(f"  {type_name}: {title} (variant: {variant_name}, main monster: {main_monster_name})")
                                        else:
                                            print(f"  {type_name}: {title} (variant: {variant_name})")
                                        found_any = True
        
        if not found_any:
            print(f"No extra descriptions found in {file_path.name}")
    
    except Exception as e:
        logger.error(f"Error listing extra descriptions in {file_path}: {e}")




def _validate_statblock_completeness(statblock: Dict, monster_name: str) -> None:
    """
    Validate that a statblock dictionary contains all required labels in order.
    
    Args:
        statblock: The statblock dictionary to validate
        monster_name: Monster name (for error reporting)
    
    Raises:
        ImportError: If the statblock is incomplete or labels are out of order
    """
    if not statblock:
        return
    
    # Get the list of labels that should be present (up to and including "Level Adjustment")
    level_adjustment_index = STATBLOCK_LABELS_ORDERED.index('Level Adjustment')
    required_labels = STATBLOCK_LABELS_ORDERED[:level_adjustment_index + 1]
    
    # Check if monster type is Animal or Vermin - these don't have Treasure or Alignment
    # Check if monster type is Plant - these don't have Skills or Feats
    type_line = statblock.get('type_line', '')
    is_animal_or_vermin = False
    is_plant = False
    if type_line:
        type_line_upper = type_line.upper()
        # Check if type line contains "Animal" or "Vermin" (case-insensitive)
        if 'ANIMAL' in type_line_upper or 'VERMIN' in type_line_upper:
            is_animal_or_vermin = True
            # Remove "Treasure" and "Alignment" from required labels for Animal/Vermin
            if 'Treasure' in required_labels:
                required_labels.remove('Treasure')
            if 'Alignment' in required_labels:
                required_labels.remove('Alignment')
        # Check if type line contains "Plant" (case-insensitive)
        if 'PLANT' in type_line_upper:
            is_plant = True
            # Remove "Skills" and "Feats" from required labels for Plant
            if 'Skills' in required_labels:
                required_labels.remove('Skills')
            if 'Feats' in required_labels:
                required_labels.remove('Feats')
    
    # Check which labels are present in the statblock (excluding 'type_line' and 'variant_name')
    statblock_keys = set(k for k in statblock.keys() if k not in ['type_line', 'variant_name'])
    
    # Debug: log what keys are actually in the statblock
    logger.info(f"Statblock validation: statblock has {len(statblock_keys)} keys: {sorted(statblock_keys)}")
    logger.info(f"Statblock validation: required labels: {required_labels[:5]}... (showing first 5)")
    if is_animal_or_vermin:
        logger.info(f"Statblock validation: Animal/Vermin detected, Treasure and Alignment are optional")
    if is_plant:
        logger.info(f"Statblock validation: Plant detected, Skills and Feats are optional")
    
    # Find missing labels
    missing_labels = [label for label in required_labels if label not in statblock_keys]
    
    if missing_labels:
        found_labels = [label for label in required_labels if label in statblock_keys]
        raise ImportError(
            f"Statblock is incomplete. Missing required label(s): {', '.join(missing_labels[:5])}{'...' if len(missing_labels) > 5 else ''}. "
            f"Statblock must include all labels in order up to 'Level Adjustment'. "
            f"This may indicate a missing closing tag or malformed tagged text. "
            f"Monster: '{monster_name}'. "
            f"Found {len(found_labels)} labels: {', '.join(found_labels[:3])}{'...' if len(found_labels) > 3 else ''}. "
            f"Expected {len(required_labels)} labels.",
            monster_name=monster_name,
            field="Statblock"
        )
    
    # Validate order: check that labels appear in the correct order
    found_labels_in_order = [label for label in STATBLOCK_LABELS_ORDERED if label in statblock_keys]
    
    # Check if labels are in order by comparing their indices in STATBLOCK_LABELS_ORDERED
    for i in range(1, len(found_labels_in_order)):
        prev_label = found_labels_in_order[i - 1]
        curr_label = found_labels_in_order[i]
        prev_index = STATBLOCK_LABELS_ORDERED.index(prev_label)
        curr_index = STATBLOCK_LABELS_ORDERED.index(curr_label)
        
        if curr_index < prev_index:
            # Labels are out of order
            raise ImportError(
                f"Statblock labels out of order. "
                f"Found '{curr_label}' after '{prev_label}', but '{curr_label}' should come before '{prev_label}'. "
                f"This may indicate a missing closing tag or malformed tagged text. "
                f"Monster: '{monster_name}'.",
                monster_name=monster_name,
                field="Statblock"
            )


def parse_statblock_for_insert(statblock: Dict, db: DatabaseConnection, monster_name: str) -> Dict:
    """
    Parse statblock data and return a dictionary of parsed values for INSERT/UPDATE.
    
    Args:
        statblock: Dictionary containing statblock data
        db: DatabaseConnection instance
        monster_name: Name of the monster (for error reporting)
    
    Returns:
        Dictionary with parsed statblock values
    """
    if not statblock:
        return {}
    
    # Parse statblock data
    hit_dice_text = statblock.get('Hit Dice', '')
    hit_dice_qty, hit_dice_type, bonus_hp, average_hp, extra_hit_dice = parse_hit_dice(hit_dice_text)
    
    initiative = None
    if statblock.get('Initiative'):
        try:
            initiative = int(statblock['Initiative'].replace('+', ''))
        except (ValueError, AttributeError):
            pass
    
    # Parse speed
    base_speed, alternate_speeds = parse_speed(statblock.get('Speed', ''))
    
    # Parse AC
    ac_data = parse_ac_breakdown(statblock.get('Armor Class', ''))
    base_ac, touch_ac, flat_footed_ac, ac_breakdown = ac_data
    
    # Parse Base Attack/Grapple
    base_attack = None
    grapple = None
    if statblock.get('Base Attack/Grapple'):
        bab_text = statblock['Base Attack/Grapple']
        match = re.search(r'\+?(-?\d+)/\+?(-?\d+)', bab_text)
        if match:
            base_attack = int(match.group(1))
            grapple = int(match.group(2))
    
    # Parse abilities
    abilities = parse_abilities(statblock.get('Abilities', ''))
    
    # Parse saves
    saves = parse_saves(statblock.get('Saves', ''))
    
    # Parse space/reach
    space, reach, optional_reach, optional_reach_description = parse_space_reach(statblock.get('Space/Reach', ''))
    
    # Process type line (types, subtypes, size)
    type_line = statblock.get('type_line', '')
    types, subtypes = parse_type_and_subtypes(type_line, db, monster_name) if type_line else ([], [])
    
    # Extract size from type line if available
    size_id = None
    if type_line:
        size_match = re.search(r'(Fine|Diminutive|Tiny|Small|Medium|Large|Huge|Gargantuan|Colossal)', type_line, re.IGNORECASE)
        if size_match:
            size_name = size_match.group(1)
            size_id = db.get_size_id(size_name)
    
    return {
        'hit_dice_qty': hit_dice_qty,
        'hit_dice_type': hit_dice_type,
        'bonus_hp': bonus_hp,
        'average_hp': average_hp,
        'extra_hit_dice': extra_hit_dice,
        'initiative': initiative,
        'base_speed': base_speed,
        'alternate_speeds': alternate_speeds,
        'base_ac': base_ac,
        'touch_ac': touch_ac,
        'flat_footed_ac': flat_footed_ac,
        'ac_breakdown': ac_breakdown,
        'base_attack': base_attack,
        'grapple': grapple,
        'abilities': abilities,
        'saves': saves,
        'space': space,
        'reach': reach,
        'optional_reach': optional_reach,
        'optional_reach_description': optional_reach_description,
        'types': types,
        'subtypes': subtypes,
        'size_id': size_id,
    }


def process_statblock_related_data(statblock: Dict, monster_id: int, monster_name: str, db: DatabaseConnection) -> None:
    """
    Process and insert statblock-related data (types, subtypes, skills, feats, etc.).
    This does NOT update the main Monster record - that should be done separately.
    
    Args:
        statblock: Dictionary containing statblock data
        monster_id: ID of the monster record
        monster_name: Name of the monster (for error reporting)
        db: DatabaseConnection instance
    """
    if not statblock:
        return
    
    parsed = parse_statblock_for_insert(statblock, db, monster_name)
    
    # Insert types and subtypes
    for type_id in parsed['types']:
        query = "INSERT INTO MonsterTypeMap (monsterId, typeId) VALUES (%s, %s)"
        db.execute_insert(query, (monster_id, type_id), table_name='MonsterTypeMap')
    for subtype_id in parsed['subtypes']:
        query = "INSERT INTO MonsterSubtypeMap (monsterId, subtypeId) VALUES (%s, %s)"
        db.execute_insert(query, (monster_id, subtype_id), table_name='MonsterSubtypeMap')
    
    # Insert extra hit dice if any
    for extra_hd in parsed['extra_hit_dice']:
        query = """
            INSERT INTO MonsterExtraHitDie (monsterId, hitDiceQty, hitDiceType, bonusHP)
            VALUES (%s, %s, %s, %s)
        """
        db.execute_insert(query, (
            monster_id,
            extra_hd['qty'],
            extra_hd['type'],
            extra_hd['bonus_hp']
        ), table_name='MonsterExtraHitDie')
    
    # Insert alternate speeds
    for alt_speed in parsed['alternate_speeds']:
        query = """
            INSERT INTO MonsterAlternateSpeed (
                monsterId, movementTypeId, speed, maneuverability
            ) VALUES (%s, %s, %s, %s)
        """
        db.execute_insert(query, (
            monster_id,
            alt_speed['movementTypeId'],
            alt_speed['speed'],
            alt_speed['maneuverability']
        ), table_name='MonsterAlternateSpeed')
    
    # Insert AC breakdown
    for component in parsed['ac_breakdown']:
        query = """
            INSERT INTO MonsterArmorBreakdown (
                monsterId, componentType, value, equipmentItemId, description
            ) VALUES (%s, %s, %s, %s, %s)
        """
        db.execute_insert(query, (
            monster_id,
            component['type'],
            component['value'],
            component['equipment_item_id'],
            component['description']
        ), table_name='MonsterArmorBreakdown')
    
    # Parse and insert skills
    if statblock.get('Skills'):
        skills_text = statblock['Skills']
        skill_pattern = r'([A-Za-z\s]+(?:\([^)]+\))?)\s*\+?(-?\d+)(?:\s*\(([^)]+)\))?(\*)?'
        for match in re.finditer(skill_pattern, skills_text):
            skill_full_name = match.group(1).strip().rstrip('*')
            ranks = int(match.group(2))
            additional_notes = match.group(3)
            has_asterisk = match.group(4) is not None
            
            # Check for "X or Y (any Z)" pattern (e.g., "Craft or Knowledge (any five)")
            # This means the monster has both skills with the same ranks and notes
            or_pattern = r'^([A-Za-z\s]+)\s+or\s+([A-Za-z\s]+)\s*\(([^)]+)\)$'
            or_match = re.match(or_pattern, skill_full_name, re.IGNORECASE)
            
            if or_match:
                # Split into two skills
                skill1_name = or_match.group(1).strip()
                skill2_name = or_match.group(2).strip()
                shared_notes = or_match.group(3).strip()
                
                # Process both skills with the same ranks and notes
                for skill_name_raw in [skill1_name, skill2_name]:
                    # Parse skill name and subtype (if any)
                    skill_name = skill_name_raw
                    subtype_name = None
                    skill_match = re.match(r'^([A-Za-z\s]+)\s*\(([^)]+)\)$', skill_name_raw)
                    if skill_match:
                        skill_name = skill_match.group(1).strip()
                        subtype_name = skill_match.group(2).strip()
                    
                    # Skip empty skill names
                    if not skill_name or not skill_name.strip():
                        logger.warning(f"Skipping empty skill name in '{match.group(0)}' for {monster_name}")
                        continue
                    
                    # Pass the full match text for better line number tracking
                    skill_id = db.validate_skill(skill_name, monster_name, source_text=match.group(0))
                    skill_subtype_id = None
                    notes_parts = []
                    
                    if subtype_name:
                        skill_subtype_id = db.get_skill_subtype_id(skill_id, subtype_name)
                        if not skill_subtype_id:
                            # Custom/unrecognized subtype, store in notes
                            notes_parts.append(f"({subtype_name})")
                    
                    # Add the shared notes (e.g., "any five", "any three")
                    if shared_notes:
                        notes_parts.append(shared_notes)
                    
                    if additional_notes:
                        notes_parts.append(additional_notes)
                    
                    notes = ' '.join(notes_parts) if notes_parts else None
                    
                    query = "INSERT INTO MonsterSkillMap (monsterId, skillId, skillSubId, ranks, notes) VALUES (%s, %s, %s, %s, %s)"
                    db.execute_insert(query, (monster_id, skill_id, skill_subtype_id, ranks, notes), table_name='MonsterSkillMap')
                continue  # Skip the normal parsing for this skill
            else:
                # Normal single skill parsing
                # Parse skill name and subtype
                skill_name = skill_full_name
                subtype_name = None
                skill_match = re.match(r'^([A-Za-z\s]+)\s*\(([^)]+)\)$', skill_full_name)
                if skill_match:
                    skill_name = skill_match.group(1).strip()
                    subtype_name = skill_match.group(2).strip()
                
                # Skip empty skill names
                if not skill_name or not skill_name.strip():
                    logger.warning(f"Skipping empty skill name in '{match.group(0)}' for {monster_name}")
                    continue
                
                # Pass the full match text for better line number tracking
                skill_id = db.validate_skill(skill_name, monster_name, source_text=match.group(0))
                skill_subtype_id = None
                notes_parts = []
                
                if subtype_name:
                    skill_subtype_id = db.get_skill_subtype_id(skill_id, subtype_name)
                    if not skill_subtype_id:
                        # Custom/unrecognized subtype, store in notes
                        notes_parts.append(f"({subtype_name})")
                
                if additional_notes:
                    notes_parts.append(additional_notes)
                
                notes = ' '.join(notes_parts) if notes_parts else None
                
                query = "INSERT INTO MonsterSkillMap (monsterId, skillId, skillSubId, ranks, notes) VALUES (%s, %s, %s, %s, %s)"
                db.execute_insert(query, (monster_id, skill_id, skill_subtype_id, ranks, notes), table_name='MonsterSkillMap')
    
    # Parse and insert feats
    if statblock.get('Feats'):
        feats_text = statblock['Feats']
        # Split by comma, but ignore commas inside parentheses
        # (e.g., "Improved Natural Attack (bite, claw)" should not be split)
        feat_names = []
        current_feat = []
        paren_depth = 0
        
        for char in feats_text:
            if char == '(':
                paren_depth += 1
                current_feat.append(char)
            elif char == ')':
                paren_depth -= 1
                current_feat.append(char)
            elif char == ',' and paren_depth == 0:
                # Only split on comma if we're not inside parentheses
                if current_feat:
                    feat_names.append(''.join(current_feat).strip())
                    current_feat = []
            else:
                current_feat.append(char)
        
        # Add the last feat
        if current_feat:
            feat_names.append(''.join(current_feat).strip())
        
        for feat_full_name in feat_names:
            if not feat_full_name:
                continue
            
            feat_name = feat_full_name
            feat_notes = None
            notes_parts = []
            
            # Check for bonus feat (ends with 'B')
            if feat_full_name.endswith('B'):
                feat_name = feat_full_name[:-1].strip()  # Strip the 'B'
                notes_parts.append('bonus')
            
            # Check for multiplier pattern (e.g., "Improved Natural Armor x 3")
            # Pattern matches: "FeatName x N" where N is a number
            multiplier_match = re.search(r'\s+x\s+(\d+)\s*$', feat_name, re.IGNORECASE)
            if multiplier_match:
                multiplier = multiplier_match.group(1)
                feat_name = feat_name[:multiplier_match.start()].strip()  # Remove " x N" from end
                notes_parts.append(f'x {multiplier}')
            
            # Check for parenthetical notes (e.g., "Spell Focus (illusion)" or "Quicken Spell-Like Ability(telekinesis)")
            # Handle cases where there might be no space before the parenthesis due to whitespace normalization
            # Pattern matches: "FeatName (note)" or "FeatName(note)" or "FeatName(note)," - allow hyphens, spaces, and other characters in feat names
            # Use non-greedy match to capture everything up to the parenthesis
            # Allow trailing comma/punctuation after the closing parenthesis (common when feats are comma-separated)
            feat_match = re.match(r'^(.+?)\s*\(([^)]+)\)\s*[,;]?\s*$', feat_name)
            if feat_match:
                feat_name = feat_match.group(1).strip()
                parenthetical_note = feat_match.group(2).strip()
                
                # Check if the parenthetical note contains commas (e.g., "bite, claw")
                # If so, split and create multiple feat entries
                if ',' in parenthetical_note:
                    # Split by comma and create one feat entry for each value
                    note_values = [n.strip() for n in parenthetical_note.split(',')]
                    for note_value in note_values:
                        if not note_value:
                            continue
                        # Create a copy of notes_parts for this iteration
                        current_notes_parts = notes_parts.copy()
                        current_notes_parts.append(note_value)
                        feat_notes = ', '.join(current_notes_parts) if current_notes_parts else None
                        
                        feat_id = db.validate_feat(feat_name, monster_name)
                        query = "INSERT INTO MonsterFeatMap (monsterId, featId, notes) VALUES (%s, %s, %s)"
                        db.execute_insert(query, (monster_id, feat_id, feat_notes), table_name='MonsterFeatMap')
                    # Skip the single entry creation below since we've created multiple entries
                    continue
                else:
                    # Single note value, add it to notes_parts
                    notes_parts.append(parenthetical_note)
            
            # Combine notes if any
            feat_notes = ', '.join(notes_parts) if notes_parts else None
            
            feat_id = db.validate_feat(feat_name, monster_name)
            query = "INSERT INTO MonsterFeatMap (monsterId, featId, notes) VALUES (%s, %s, %s)"
            db.execute_insert(query, (monster_id, feat_id, feat_notes), table_name='MonsterFeatMap')


def _insert_monster_abilities_and_spells(monster_id: int, monster_name: str, special_abilities: List[Dict], 
                                         prepared_spells: List[Dict], prepared_spell_slots: List[Dict], 
                                         db: DatabaseConnection) -> None:
    """Insert special abilities, prepared spells, and prepared spell slots for a monster."""
    # Track inserted abilities to detect duplicates
    inserted_ability_ids = {}
    # Map ability_id -> ability dict for error reporting
    ability_id_to_info = {}
    
    # Insert special abilities
    for idx, ability in enumerate(special_abilities):
        ability_id = db.get_or_create_special_ability(
            ability['name'],
            ability.get('description'),
            ability['type'],
            ability.get('effective_caster_level'),
            ability.get('save_ability')
        )
        
        # Check for duplicate within this import session
        if ability_id in inserted_ability_ids:
            first_occurrence_idx = inserted_ability_ids[ability_id]
            first_ability = ability_id_to_info[ability_id]
            
            # Find line number for better error reporting
            line_number = None
            if db.file_content:
                # Try to find the ability name in the file
                search_text = ability['name']
                if ability.get('description'):
                    # Use first part of description for better context
                    desc_preview = ability['description'][:100] if len(ability.get('description', '')) > 100 else ability.get('description', '')
                    search_text = f"{ability['name']} {desc_preview}"
                line_number = find_line_number_for_text(db.file_content, search_text)
            
            # Build detailed error message
            ability_type_name = MONSTER_SPECIAL_ABILITY_TYPE_ID_TO_NAME.get(ability['type'], f"Type {ability['type']}")
            error_msg = (
                f"Duplicate special ability '{ability['name']}' (ID: {ability_id}, Type: {ability_type_name}) "
                f"found for {monster_name}. "
                f"First occurrence at index {first_occurrence_idx}, duplicate at index {idx}. "
                f"This indicates the same ability appears multiple times in the special abilities list. "
                f"Please check the input file and remove the duplicate."
            )
            
            if line_number:
                error_msg += f" Found near line {line_number} in input file."
            
            # Add details about both occurrences
            error_msg += f"\nFirst occurrence: name='{first_ability['name']}', type={ability_type_name}"
            if first_ability.get('description'):
                desc_preview = first_ability['description'][:100] + "..." if len(first_ability['description']) > 100 else first_ability['description']
                error_msg += f", description='{desc_preview}'"
            
            error_msg += f"\nDuplicate occurrence: name='{ability['name']}', type={ability_type_name}"
            if ability.get('description'):
                desc_preview = ability['description'][:100] + "..." if len(ability['description']) > 100 else ability['description']
                error_msg += f", description='{desc_preview}'"
            
            raise ImportError(
                error_msg,
                monster_name=monster_name,
                field="Special Ability",
                value=ability['name'],
                line_number=line_number
            )
        
        # Check if ability already exists in database for this monster
        existing_check = db.execute(
            "SELECT abilityId FROM MonsterSpecialAbilityMap WHERE monsterId = %s AND abilityId = %s LIMIT 1",
            (monster_id, ability_id)
        )
        if existing_check:
            # Find line number for better error reporting
            line_number = None
            if db.file_content:
                search_text = ability['name']
                if ability.get('description'):
                    desc_preview = ability['description'][:100] if len(ability.get('description', '')) > 100 else ability.get('description', '')
                    search_text = f"{ability['name']} {desc_preview}"
                line_number = find_line_number_for_text(db.file_content, search_text)
            
            ability_type_name = MONSTER_SPECIAL_ABILITY_TYPE_ID_TO_NAME.get(ability['type'], f"Type {ability['type']}")
            error_msg = (
                f"Special ability '{ability['name']}' (ID: {ability_id}, Type: {ability_type_name}) "
                f"already exists in database for {monster_name}. "
                f"This may indicate a duplicate in the input file or the monster was partially imported previously. "
                f"Please check the input file and remove the duplicate, or use --update to re-import the monster."
            )
            
            if line_number:
                error_msg += f" Found near line {line_number} in input file."
            
            raise ImportError(
                error_msg,
                monster_name=monster_name,
                field="Special Ability",
                value=ability['name'],
                line_number=line_number
            )
        
        query = "INSERT INTO MonsterSpecialAbilityMap (monsterId, abilityId) VALUES (%s, %s)"
        db.execute_insert(query, (monster_id, ability_id), table_name='MonsterSpecialAbilityMap')
        inserted_ability_ids[ability_id] = idx
        ability_id_to_info[ability_id] = ability
        
        # For spell-like abilities, create MonsterSpell entries
        # Only extract spells if the ability name is literally "Spell-Like Abilities"
        # Individual (Sp) abilities like "Find Target (Sp)" should not have spells extracted
        if ability['type'] == MONSTER_SPECIAL_ABILITY_TYPE['SpellLike'] and ability['name'].lower() == 'spell-like abilities':
            spells = ability.get('spells', [])
            logger.debug(f"Processing {len(spells)} spells for {ability['name']} ability")
            if not spells:
                logger.warning(f"No spells found in {ability['name']} ability for {monster_name} (expected spell-like ability to have spells)")
            for idx, spell_data in enumerate(spells):
                spell_name = spell_data.get('spell_name', '').strip()
                if not spell_name or len(spell_name) < 3:
                    logger.warning(f"Skipping empty or invalid spell name in {ability['name']} ability for {monster_name} (index {idx}). Spell data: {spell_data}")
                    continue
                try:
                    spell_id, modifier, is_domain_spell = db.validate_spell(
                        spell_name, 
                        monster_name, 
                        context=f"{ability['name']} ability (spell {idx+1}/{len(spells)})",
                        source_html=str(spell_data)[:200]
                    )
                    # Modifier already includes all modifiers (parenthetical, spell modifiers, and domain spell)
                    # Combine with notes from spell-like ability parsing (e.g., "into snake form only")
                    notes_parts = []
                    if modifier:
                        notes_parts.append(modifier)
                    if spell_data.get('notes'):
                        notes_parts.append(spell_data.get('notes'))
                    notes = ', '.join(notes_parts) if notes_parts else None
                    logger.debug(f"  Inserting MonsterSpell: {spell_name} (ID: {spell_id}, DC: {spell_data.get('save_dc')}, uses: {spell_data.get('uses_per_day_id')}, notes: {notes})")
                except ImportError as e:
                    logger.error(f"Error validating spell '{spell_name}' in {ability['name']} ability for {monster_name}: {e}")
                    raise
                
                query = """
                    INSERT INTO MonsterSpell (
                        monsterId, spellId, spellType, usesPerDayId, saveDC, specialAbilityId, notes
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                """
                db.execute_insert(query, (
                    monster_id,
                    spell_id,
                    MONSTER_SPELL_TYPE['SpellLike'],
                    spell_data['uses_per_day_id'],
                    spell_data.get('save_dc'),
                    ability_id,
                    notes  # Spell modifier and/or notes from DC parentheses
                ), table_name='MonsterSpell')
    
    # Insert prepared spells
    logger.debug(f"Processing {len(prepared_spells)} prepared spells for {monster_name}")
    for idx, spell_data in enumerate(prepared_spells):
        spell_name = spell_data.get('spell_name', '').strip()
        if not spell_name or len(spell_name) < 3:
            logger.warning(f"Skipping empty or invalid spell name in prepared spells for {monster_name} (index {idx}). Spell data: {spell_data}")
            continue
        try:
            spell_id, modifier, is_domain_spell = db.validate_spell(
                spell_name, 
                monster_name, 
                context=f"prepared spells (spell {idx+1}/{len(prepared_spells)})",
                source_html=str(spell_data)[:200]
            )
            # Modifier already includes all modifiers (parenthetical, spell modifiers, and domain spell)
            notes = modifier
        except ImportError as e:
            logger.error(f"Error validating prepared spell '{spell_name}' for {monster_name} (index {idx}): {e}")
            logger.error(f"Full spell data: {spell_data}")
            raise
        query = """
            INSERT INTO MonsterSpell (
                monsterId, spellId, spellType, quantity, usesPerDayId, saveDC, level, notes
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        # Prepared spells don't have uses per day (they're prepared, not at-will)
        db.execute_insert(query, (
            monster_id,
            spell_id,
            MONSTER_SPELL_TYPE['Prepared'],
            spell_data.get('quantity', 1),
            None,  # Prepared spells don't have uses per day
            spell_data.get('save_dc'),
            spell_data.get('spell_level'),  # Spell level at which it's prepared
            notes  # Spell modifier and/or domain spell indicator
        ), table_name='MonsterSpell')
    
    # Insert prepared spell slots (and handle domain information)
    logger.debug(f"Processing {len(prepared_spell_slots)} prepared spell slot entries for {monster_name}")
    domain_names = []
    for slot_data in prepared_spell_slots:
        # Check if this is domain information (level == -1 is our marker)
        if slot_data.get('level') == -1:
            domain_names = slot_data.get('domain_names', [])
            logger.debug(f"Found domain information for {monster_name}: {domain_names}")
            continue
        
        query = """
            INSERT INTO MonsterPreparedSpellSlots (monsterId, spellLevel, numSlots)
            VALUES (%s, %s, %s)
        """
        db.execute_insert(query, (
            monster_id,
            slot_data['level'],
            slot_data['num_slots']
        ), table_name='MonsterPreparedSpellSlots')
    
    # Insert domain mappings if domains were found
    if domain_names:
        logger.debug(f"Inserting {len(domain_names)} domain mappings for {monster_name}")
        for domain_name in domain_names:
            domain_id = db.get_domain_id(domain_name)
            if domain_id is None:
                logger.warning(f"Domain '{domain_name}' not found in database for {monster_name}. Skipping domain mapping.")
                continue
            query = "INSERT INTO MonsterDomainMap (monsterId, domainId) VALUES (%s, %s)"
            db.execute_insert(query, (monster_id, domain_id), table_name='MonsterDomainMap')


def delete_monster_and_related_data(monster_id: int, db: DatabaseConnection) -> None:
    """
    Delete a monster and all related data from the database.
    
    This deletes all related records in the correct order to respect foreign key constraints.
    
    Args:
        monster_id: The ID of the monster to delete
        db: DatabaseConnection instance
    """
    logger.info(f"Deleting monster ID {monster_id} and all related data...")
    
    if db.dry_run:
        logger.debug(f"DRY RUN: Would delete monster ID {monster_id} and all related data")
        return
    
    # Delete in order to respect foreign key constraints
    # Start with child tables that reference Monster
    
    # Delete variants that have this monster as their base (must be done first)
    variant_ids = db.execute("SELECT id FROM Monster WHERE baseMonsterId = %s", (monster_id,))
    if variant_ids:
        for variant_row in variant_ids:
            variant_id = variant_row['id']
            logger.debug(f"Deleting variant monster ID {variant_id} (base: {monster_id})")
            delete_monster_and_related_data(variant_id, db)
    
    # Delete extra descriptions
    db.cursor.execute("DELETE FROM MonsterExtraDescription WHERE monsterId = %s", (monster_id,))
    
    # Delete source mappings
    db.cursor.execute("DELETE FROM MonsterSourceMap WHERE monsterId = %s", (monster_id,))
    
    # Delete domain mappings
    db.cursor.execute("DELETE FROM MonsterDomainMap WHERE monsterId = %s", (monster_id,))
    
    # Delete prepared spell slots
    db.cursor.execute("DELETE FROM MonsterPreparedSpellSlots WHERE monsterId = %s", (monster_id,))
    
    # Delete spells (MonsterSpell) - this includes both spell-like abilities and prepared spells
    db.cursor.execute("DELETE FROM MonsterSpell WHERE monsterId = %s", (monster_id,))
    
    # Get ability IDs used by this monster BEFORE deleting the mappings
    ability_ids = db.execute("SELECT DISTINCT abilityId FROM MonsterSpecialAbilityMap WHERE monsterId = %s", (monster_id,))
    ability_id_list = [row['abilityId'] for row in ability_ids] if ability_ids else []
    
    # Delete special ability mappings
    db.cursor.execute("DELETE FROM MonsterSpecialAbilityMap WHERE monsterId = %s", (monster_id,))
    
    # Delete special abilities (only if not referenced by other monsters)
    for ability_id in ability_id_list:
        other_monsters = db.execute(
            "SELECT COUNT(*) as count FROM MonsterSpecialAbilityMap WHERE abilityId = %s",
            (ability_id,)
        )
        if other_monsters and other_monsters[0]['count'] == 0:
            # No other monsters use this ability, delete it
            db.cursor.execute("DELETE FROM MonsterSpecialAbility WHERE id = %s", (ability_id,))
    
    # Delete feat mappings
    db.cursor.execute("DELETE FROM MonsterFeatMap WHERE monsterId = %s", (monster_id,))
    
    # Delete skill mappings
    db.cursor.execute("DELETE FROM MonsterSkillMap WHERE monsterId = %s", (monster_id,))
    
    # Delete AC breakdown
    db.cursor.execute("DELETE FROM MonsterArmorBreakdown WHERE monsterId = %s", (monster_id,))
    
    # Delete alternate speeds
    db.cursor.execute("DELETE FROM MonsterAlternateSpeed WHERE monsterId = %s", (monster_id,))
    
    # Delete extra hit dice
    db.cursor.execute("DELETE FROM MonsterExtraHitDie WHERE monsterId = %s", (monster_id,))
    
    # Delete subtype mappings
    db.cursor.execute("DELETE FROM MonsterSubtypeMap WHERE monsterId = %s", (monster_id,))
    
    # Delete type mappings
    db.cursor.execute("DELETE FROM MonsterTypeMap WHERE monsterId = %s", (monster_id,))
    
    # Finally, delete the monster itself
    db.cursor.execute("DELETE FROM Monster WHERE id = %s", (monster_id,))
    
    logger.debug(f"Deleted monster ID {monster_id} and all related data")


def insert_monster(data: Dict, db: DatabaseConnection, base_monster_id: Optional[int] = None) -> int:
    """
    Insert a monster entry (base or variant) with transaction support.
    
    Args:
        data: Dictionary containing monster data
        db: DatabaseConnection instance
        base_monster_id: Optional base monster ID (None for base monsters, provided for variants)
    
    Returns:
        The inserted monster ID
    """
    monster_name = data['name']
    statblock = data.get('statblock')
    has_statblock = statblock is not None
    
    # Log context for debugging
    monster_type = "variant" if base_monster_id else "base"
    logger.debug(f"Inserting {monster_type} monster: {monster_name}")
    
    # Note: Transaction should be started before calling insert_monster
    # (e.g., in extract_monster_data) to cover base + all variants
    if not db.in_transaction:
        logger.warning(f"Warning: No transaction in progress for {monster_name}. Starting one now.")
        db.begin_transaction()
    
    logger.debug(f"Special abilities count: {len(data.get('special_abilities', []))}")
    logger.debug(f"Prepared spells count: {len(data.get('prepared_spells', []))}")
    
    # Parse statblock if it exists
    parsed = None
    if has_statblock:
        parsed = parse_statblock_for_insert(statblock, db, monster_name)
    
    # Insert monster - use full INSERT if statblock exists, minimal INSERT otherwise
    if has_statblock:
        # Full INSERT with all statblock data
        query = """
            INSERT INTO Monster (
                name, baseMonsterId, editionId, isVisible,
                flavorText, description, combatDescription,
                hitDiceQty, hitDiceType, bonusHP, averageHP, initiative,
                baseSpeed,
                armorClass, touchAC, flatFootedAC,
                baseAttack, grapple,
                attack, fullAttack, space, reach, optionalReach, optionalReachDescription,
                fortSave, refSave, willSave,
                strength, dexterity, constitution, intelligence, wisdom, charisma,
                organization, treasure, alignment, advancement, challengeRating, levelAdjustment,
                specialAttacks, specialQualities,
                sizeId
            ) VALUES (
                %s, %s, %s, %s,
                %s, %s, %s,
                %s, %s, %s, %s, %s,
                %s,
                %s, %s, %s,
                %s, %s,
                %s, %s, %s, %s, %s, %s,
                %s, %s, %s,
                %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s,
                %s, %s,
                %s
            )
        """
        monster_id = db.execute_insert(query, (
            monster_name,
            base_monster_id,  # None for base, provided for variant
            EDITION_ID_DND_3_5,
            True,
            data.get('flavor_text'),
            data.get('description'),
            data.get('combat_description'),
            parsed['hit_dice_qty'],
            parsed['hit_dice_type'],
            parsed['bonus_hp'],
            parsed['average_hp'],
            parsed['initiative'],
            parsed['base_speed'],
            parsed['base_ac'],
            parsed['touch_ac'],
            parsed['flat_footed_ac'],
            parsed['base_attack'],
            parsed['grapple'],
            statblock.get('Attack'),
            statblock.get('Full Attack'),
            parsed['space'],
            parsed['reach'],
            parsed['optional_reach'],
            parsed['optional_reach_description'],
            parsed['saves']['fort'],
            parsed['saves']['ref'],
            parsed['saves']['will'],
            parsed['abilities']['strength'],
            parsed['abilities']['dexterity'],
            parsed['abilities']['constitution'],
            parsed['abilities']['intelligence'],
            parsed['abilities']['wisdom'],
            parsed['abilities']['charisma'],
            statblock.get('Organization'),
            statblock.get('Treasure'),
            statblock.get('Alignment'),
            statblock.get('Advancement'),
            statblock.get('Challenge Rating'),
            statblock.get('Level Adjustment'),
            statblock.get('Special Attacks'),
            statblock.get('Special Qualities'),
            parsed['size_id']
        ), table_name='Monster')
        
        if monster_id is None or monster_id == 0:
            raise ValueError(f"Failed to get monster_id after INSERT for '{monster_name}'. lastrowid was: {db.cursor.lastrowid if db.cursor else 'N/A'}")
        
        # Process related data (types, subtypes, skills, feats, etc.)
        process_statblock_related_data(statblock, monster_id, monster_name, db)
    else:
        # Minimal INSERT (base monster without statblock, like Angel)
        query = """
            INSERT INTO Monster (
                name, baseMonsterId, editionId, isVisible, flavorText, description, combatDescription
            ) VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        monster_id = db.execute_insert(query, (
            monster_name,
            base_monster_id,  # None for base, provided for variant
            EDITION_ID_DND_3_5,
            True,
            data.get('flavor_text'),
            data.get('description'),
            data.get('combat_description')
        ), table_name='Monster')
        
        if monster_id is None or monster_id == 0:
            raise ValueError(f"Failed to get monster_id after INSERT for '{monster_name}' (minimal insert). lastrowid was: {db.cursor.lastrowid if db.cursor else 'N/A'}")
    
    # Insert special abilities, prepared spells, and prepared spell slots
    _insert_monster_abilities_and_spells(
        monster_id,
        monster_name,
        data.get('special_abilities', []),
        data.get('prepared_spells', []),
        data.get('prepared_spell_slots', []),
        db
    )
    
    # Extra descriptions are now handled separately in extract_monster_data
    # after all variants are inserted, to ensure proper matching based on header content
    
    # Insert source book mapping (Monster Manual 3.5e, ID 44)
    query = "INSERT INTO MonsterSourceMap (monsterId, sourceBookId, pageNumber) VALUES (%s, %s, %s)"
    db.execute_insert(query, (monster_id, SOURCE_BOOK_ID_MONSTER_MANUAL_3_5, 0), table_name='MonsterSourceMap')
    
    # Don't commit here - transaction is managed at the extract_monster_data level
    # to cover base + all variants in a single transaction
    if db.dry_run:
        db.print_dry_run_summary(monster_name)
    else:
        monster_type_str = "variant" if base_monster_id else "base"
        logger.info(f"Inserted {monster_type_str} monster: {monster_name} (ID: {monster_id})")
    
    return monster_id


def insert_base_monster(data: Dict, db: DatabaseConnection) -> int:
    """Insert a base monster entry with transaction support."""
    return insert_monster(data, db, base_monster_id=None)


def insert_variant_monster(data: Dict, db: DatabaseConnection) -> int:
    """Insert a variant monster entry with transaction support and validation."""
    base_monster_id = data.get('base_monster_id')
    if base_monster_id is None:
        raise ValueError(f"Variant monster '{data['name']}' must have a base_monster_id")
    return insert_monster(data, db, base_monster_id=base_monster_id)




def main():
    """Main function."""
    parser = argparse.ArgumentParser(
        description='Import monsters from tagged text files',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Import all monsters
  python3 import_monsters.py --all
  
  # Import all monsters, skipping existing ones (resume)
  python3 import_monsters.py --all --skip-existing
  
  # Update an existing monster (delete and re-import)
  python3 import_monsters.py --monster "angel" --update
  
  # Import a single monster by name
  python3 import_monsters.py --monster "angel"
  
  # Dry run (validate without inserting)
  python3 import_monsters.py --monster "angel" --dry-run
  
  # List all monsters and variants in a file
  python3 import_monsters.py --monster "giant" --list-monsters
  
  # List all sidebars in a file
  python3 import_monsters.py --monster "giant" --list-sidebars
        """
    )
    parser.add_argument('--monster', '-m', type=str, help='Import only the specified monster by name (case-insensitive)')
    parser.add_argument('--all', '-a', action='store_true', help='Import all monsters from the tagged directory')
    parser.add_argument('--dry-run', action='store_true', help='Parse and validate without inserting into database')
    parser.add_argument('--skip-existing', action='store_true', help='Skip monsters that already exist in the database (resume functionality)')
    parser.add_argument('--update', action='store_true', help='Update existing monsters by deleting and re-importing them')
    parser.add_argument('--list-monsters', action='store_true', help='List all monster and variant names found in file(s)')
    parser.add_argument('--list-sidebars', action='store_true', help='List all extra description entries (sidebars, ASCHARACTERS, etc.) with their types')
    parser.add_argument('--list-tables', action='store_true', help='List all reference tables detected in file(s)')
    args = parser.parse_args()
    
    # Validate arguments
    if not args.monster and not args.all:
        parser.error("Either --monster or --all must be specified")
    
    if args.monster and args.all:
        parser.error("Cannot specify both --monster and --all")
    
    if args.skip_existing and args.update:
        parser.error("Cannot specify both --skip-existing and --update")
    
    # Setup
    monsters_dir = Path(__file__).parent / 'output' / 'monsters' / 'tagged'
    if not monsters_dir.exists():
        logger.error(f"Tagged monsters directory not found: {monsters_dir}")
        sys.exit(1)
    
    # Get list of tagged text files
    txt_files = list(monsters_dir.glob('*.txt'))
    
    # Handle information modes
    if args.list_monsters or args.list_sidebars or args.list_tables:
        if args.monster:
            # Filter by monster name (case-insensitive)
            matching_files = [f for f in txt_files if f.stem.lower() == args.monster.lower()]
            if not matching_files:
                logger.error(f"No monster files found matching '{args.monster}'")
                sys.exit(1)
            files_to_process = matching_files
        elif args.all:
            files_to_process = txt_files
        else:
            parser.error("Either --monster or --all must be specified for information modes")
        
        # Process files for information modes
        for txt_file in files_to_process:
            if args.list_monsters:
                list_monsters_in_file(txt_file)
            if args.list_sidebars:
                list_sidebars_in_file(txt_file)
            if args.list_tables:
                list_tables_in_file(txt_file)
        
        return  # Exit after listing information
    
    # Normal import mode
    db = DatabaseConnection(dry_run=args.dry_run)
    
    # Get source book ID (D&D 3.5e Monster Manual = 44)
    source_book_id = db.get_source_book_id('Monster Manual')
    if not source_book_id:
        logger.error("Monster Manual source book (ID 44) not found in database")
        db.close()
        sys.exit(1)
    
    if args.monster:
        # Filter by monster name (exact match, case-insensitive)
        matching_files = [f for f in txt_files if f.stem.lower() == args.monster.lower()]
        if not matching_files:
            logger.error(f"No monster files found matching '{args.monster}'")
            db.close()
            sys.exit(1)
        files_to_process = matching_files
        logger.info(f"Found {len(files_to_process)} file(s) matching '{args.monster}'")
    elif args.all:
        files_to_process = txt_files
        logger.info(f"Found {len(files_to_process)} monster file(s) to process")
    
    if args.skip_existing:
        logger.info("Resume mode: Will skip monsters that already exist in database")
    elif args.update:
        logger.info("Update mode: Will delete and re-import existing monsters")
    
    # Process monsters
    success_count = 0
    error_count = 0
    skipped_count = 0
    errors = []
    
    for txt_file in sorted(files_to_process):
        success, error_msg = import_monster_file(txt_file, db, skip_existing=args.skip_existing, update_existing=args.update)
        
        if success:
            success_count += 1
        else:
            error_count += 1
            if error_msg:
                errors.append((txt_file.name, error_msg))
    
    db.close()
    
    # Print summary
    logger.info("")
    logger.info("=" * 60)
    logger.info("IMPORT SUMMARY")
    logger.info("=" * 60)
    logger.info(f"Total files processed: {len(files_to_process)}")
    logger.info(f"✓ Successful: {success_count}")
    logger.info(f"✗ Failed: {error_count}")
    if args.skip_existing:
        logger.info(f"⊘ Skipped (already exists): {skipped_count}")
    
    if errors:
        logger.info("")
        logger.info("ERRORS:")
        for filename, error_msg in errors:
            logger.info(f"  {filename}: {error_msg}")
    
    if error_count > 0:
        sys.exit(1)


if __name__ == '__main__':
    main()

