#!/usr/bin/env python3
"""
Monster File Tagging Script

Automatically tags untagged monster files from text_clean_p3 with XML-like tags
matching the manually tagged examples in the tagged folder.

Usage:
    python3 tag_monster_files.py [--overwrite] [--file FILENAME]

Options:
    --overwrite    Overwrite existing tagged files
    --file         Process only the specified file
"""

import argparse
import logging
import re
from pathlib import Path
from typing import Dict, List, Optional, Tuple

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(levelname)s: %(message)s'
)
logger = logging.getLogger(__name__)

# Stat block field patterns
STATBLOCK_FIELDS = [
    r'^Hit Dice:',
    r'^Initiative:',
    r'^Speed:',
    r'^Armor Class:',
    r'^Base Attack/Grapple:',
    r'^Attack:',
    r'^Full Attack:',
    r'^Space/Reach:',
    r'^Special Attacks:',
    r'^Special Qualities:',
    r'^Saves:',
    r'^Abilities:',
    r'^Skills:',
    r'^Feats:',
    r'^Environment:',
    r'^Organization:',
    r'^Challenge Rating:',
    r'^Treasure:',
    r'^Alignment:',
    r'^Advancement:',
    r'^Level Adjustment:',
]

# Creature type patterns (Size + Type)
CREATURE_TYPE_PATTERN = re.compile(
    r'^(Fine|Diminutive|Tiny|Small|Medium|Large|Huge|Gargantuan|Colossal)\s+'
    r'(Aberration|Animal|Construct|Dragon|Elemental|Fey|Giant|Humanoid|'
    r'Magical Beast|Monstrous Humanoid|Ooze|Outsider|Plant|Undead|Vermin)'
    r'(?:\s*\([^)]+\))?'
)

# Section headers that should be recognized
SECTION_HEADERS = {
    'COMBAT': 'COMBAT',
    'CREATING A': None,  # Template sections - skip for now
    'AS CHARACTERS': 'ASCHARACTERS',
    'TYPICAL': 'PREPEDSPELLS',  # "Typical ... Spells Prepared"
    'POSSESSIONS': 'POSSESSIONS',
}

# Special ability patterns
SPECIAL_ABILITY_PATTERN = re.compile(r'^[A-Z][^:]*\s*\((Ex|Su|Sp)\):\s*$')
SKILLS_PATTERN = re.compile(r'^Skills:\s*$')
FEATS_PATTERN = re.compile(r'^Feats:\s*$')


def is_statblock_field(line: str, context: Optional[str] = None) -> bool:
    """Check if a line is a stat block field.
    
    Args:
        line: The line to check
        context: Optional context - if 'post_statblock', Skills: is not a stat field
    """
    line_stripped = line.strip()
    
    # If we're past the stat block, "Skills:" and "Feats:" are special abilities, not stat fields
    if context == 'post_statblock' and (line_stripped == 'Skills:' or line_stripped == 'Feats:'):
        return False
    
    for pattern in STATBLOCK_FIELDS:
        if re.match(pattern, line_stripped):
            return True
    return False


def is_creature_type(line: str) -> bool:
    """Check if a line starts with a creature type."""
    return bool(CREATURE_TYPE_PATTERN.match(line.strip()))


def is_statblock_start(line: str, context: Optional[str] = None, statblock_already_seen: bool = False) -> bool:
    """Detect if a line starts a stat block.
    
    Args:
        line: The line to check
        context: Optional context ('post_statblock' if we're past a statblock)
        statblock_already_seen: If True, we've already seen a statblock in this monster/variant
    
    Returns:
        True if this line starts a statblock
    """
    line_stripped = line.strip()
    if not line_stripped:
        return False
    
    # If we've already seen a statblock in this monster/variant, don't start a new one
    # Each monster/variant only has one statblock
    if statblock_already_seen:
        return False
    
    # Statblocks must start with a creature type (Size + Type), not just a field
    # This ensures we don't mistake a standalone "Skills:" as a statblock
    if is_creature_type(line_stripped):
        return True
    
    # Only allow statblock fields to start a statblock if we haven't seen one yet
    # and it's not in post-statblock context (which would be a special ability)
    if context != 'post_statblock' and is_statblock_field(line_stripped, context):
        # But be more careful - if it's just "Skills:" or "Feats:" and we're past the main statblock area,
        # it's probably a special ability
        if (line_stripped == 'Skills:' or line_stripped == 'Feats:') and context is None:
            # This could be the start of a statblock if it's the very first thing
            # But if we're in a monster context, it's more likely a special ability
            # We'll let the special ability check handle it
            return False
        return True
    
    return False


def is_statblock_end(line: str, next_line: Optional[str] = None, in_statblock: bool = False) -> bool:
    """Detect if a line ends a stat block."""
    line_stripped = line.strip()
    
    # Empty line after stat block fields usually indicates end
    if not line_stripped:
        return True
    
    # If next line is description text (not all caps, not a stat field, not empty)
    if next_line:
        next_stripped = next_line.strip()
        if next_stripped and not next_stripped.isupper():
            # If we're in a stat block, check if next line is still a stat field
            if in_statblock:
                if not is_statblock_field(next_stripped, 'post_statblock') and not is_creature_type(next_stripped):
                    return True
            else:
                if not is_statblock_field(next_stripped, 'post_statblock') and not is_statblock_start(next_stripped, 'post_statblock'):
                    if not is_creature_type(next_stripped):
                        return True
    
    # If current line is not a stat block field and not empty, stat block probably ended
    if not is_statblock_field(line_stripped, 'post_statblock' if in_statblock else None) and not is_creature_type(line_stripped):
        return True
    
    return False


def identify_section_header(line: str, main_monster_name: Optional[str] = None) -> Optional[str]:
    """Identify section headers like COMBAT, CREATING A..., etc."""
    line_stripped = line.strip()
    line_upper = line_stripped.upper()
    
    # Check for exact matches
    if line_stripped == 'COMBAT':
        return 'COMBAT'
    
    if line_stripped.startswith('CREATING A'):
        return None  # Template sections - skip for now
    
    # Check for "XXX AS CHARACTERS" or "XXX CHARACTERS" (where XXX is the main monster name)
    if 'AS CHARACTERS' in line_upper:
        return 'ASCHARACTERS'
    
    # Also check for "XXX CHARACTERS" (without "AS") - this should be ASCHARACTERS too
    # But only if it contains the main monster name to avoid false positives
    if main_monster_name and line_upper.endswith(' CHARACTERS') and not line_upper.endswith(' AS CHARACTERS'):
        main_name_upper = main_monster_name.upper()
        # Check if the line starts with the main monster name
        if line_upper.startswith(main_name_upper + ' CHARACTERS'):
            return 'ASCHARACTERS'
        # Check plural forms
        plural_forms = [main_name_upper + 'S', main_name_upper + 'ES', main_name_upper + 'IES']
        for plural_form in plural_forms:
            if line_upper.startswith(plural_form + ' CHARACTERS'):
                return 'ASCHARACTERS'
    
    # Check for "Typical Spells Prepared" or "Typical Spells Known"
    if 'TYPICAL' in line_upper:
        if 'SPELLS PREPARED' in line_upper or 'SPELLS KNOWN' in line_upper:
            return 'PREPEDSPELLS'
    
    if line_stripped.startswith('Possessions:'):
        return 'POSSESSIONS'
    
    return None


def is_traits_start(line: str) -> bool:
    """Detect if a line starts a TRAITS block.
    
    Args:
        line: The line to check
    
    Returns:
        True if this line starts a TRAITS block (e.g., "Archon Traits:", "Tanar'ri Traits:", "Dwarf Traits (Ex):")
    """
    line_stripped = line.strip()
    # Check if line ends with "Traits:" (case-insensitive)
    if line_stripped.lower().endswith('traits:'):
        return True
    # Check if line matches pattern "XXX Traits (Ex):" or "XXX Traits (Su):" etc.
    # Pattern: word(s) + "Traits" + optional whitespace + "(Ex):" or "(Su):" etc.
    import re
    traits_pattern = re.compile(r'.*\bTraits\s*\([A-Za-z]+\)\s*:', re.IGNORECASE)
    if traits_pattern.match(line_stripped):
        return True
    return False


def is_special_ability_start(line: str, context: Optional[str] = None) -> bool:
    """Detect if a line starts a special ability.
    
    Args:
        line: The line to check
        context: Optional context - if 'post_statblock', Skills: is a special ability
    """
    line_stripped = line.strip()
    
    # Don't treat TRAITS as special abilities
    if is_traits_start(line_stripped):
        return False
    
    # Special ability pattern: "Ability Name (Ex):" or "Ability Name (Su):" etc.
    if SPECIAL_ABILITY_PATTERN.match(line_stripped):
        return True
    
    # Skills section - always a special ability if we're past the stat block
    if SKILLS_PATTERN.match(line_stripped):
        if context == 'post_statblock':
            return True
        # If in stat block context, it's a stat field, not a special ability
        return False
    
    # Feats section - always a special ability if we're past the stat block
    if FEATS_PATTERN.match(line_stripped):
        if context == 'post_statblock':
            return True
        # If in stat block context, it's a stat field, not a special ability
        return False
    
    # Other patterns that might indicate special abilities
    # Lines ending with just ":" that aren't stat block fields
    if line_stripped.endswith(':'):
        # Check if it's a stat block field (considering context)
        if not is_statblock_field(line_stripped, context):
            # Check if it's not a section header
            if not identify_section_header(line_stripped):
                # Might be a special ability
                return True
    
    return False


def is_tactics_round_by_round(line: str) -> bool:
    """Detect if a line is a "Tactics Round-by-Round" title.
    
    Pattern: "XXX Tactics Round-by-Round" where XXX is typically a monster/variant name.
    
    Args:
        line: The line to check
    
    Returns:
        True if this appears to be a Tactics Round-by-Round title
    """
    line_stripped = line.strip()
    
    # Check if line ends with "Tactics Round-by-Round" (case-insensitive)
    if 'TACTICS ROUND-BY-ROUND' in line_stripped.upper():
        return True
    
    return False


def is_society_title(line: str) -> bool:
    """Detect if a line is a "XXX SOCIETY" title.
    
    Pattern: "XXX SOCIETY" where XXX is typically a monster/variant name.
    
    Args:
        line: The line to check
    
    Returns:
        True if this appears to be a SOCIETY title
    """
    line_stripped = line.strip()
    
    # Check if line ends with " SOCIETY" (case-insensitive, with space before)
    if line_stripped.upper().endswith(' SOCIETY'):
        return True
    
    return False


def is_characters_title(line: str) -> bool:
    """Detect if a line is a "XXX CHARACTERS" title (without "AS").
    
    Pattern: "XXX CHARACTERS" where XXX is typically a monster/variant name.
    Note: "XXX AS CHARACTERS" is handled separately as an ASCHARACTERS section header.
    
    Args:
        line: The line to check
    
    Returns:
        True if this appears to be a CHARACTERS title (without "AS")
    """
    line_stripped = line.strip()
    line_upper = line_stripped.upper()
    
    # Check if line ends with " CHARACTERS" but NOT " AS CHARACTERS"
    if line_upper.endswith(' CHARACTERS') and not line_upper.endswith(' AS CHARACTERS'):
        return True
    
    return False


def is_weaknesses_title(line: str) -> bool:
    """Detect if a line is a "XXX WEAKNESSES" title.
    
    Pattern: "XXX WEAKNESSES" where XXX is typically a monster/variant name.
    
    Args:
        line: The line to check
    
    Returns:
        True if this appears to be a WEAKNESSES title
    """
    line_stripped = line.strip()
    
    # Check if line ends with " WEAKNESSES" (case-insensitive, with space before)
    if line_stripped.upper().endswith(' WEAKNESSES'):
        return True
    
    return False


def is_subraces_title(line: str) -> bool:
    """Detect if a line is a "SUBRACES" or similar SIDEBAR title.
    
    Pattern: Standalone all-caps words that are descriptive section headers.
    Examples: "SUBRACES", "VARIETIES", "TYPES", etc.
    
    Args:
        line: The line to check
    
    Returns:
        True if this appears to be a SUBRACES or similar title
    """
    line_stripped = line.strip()
    line_upper = line_stripped.upper()
    
    # Check for common SIDEBAR keywords
    sidebar_keywords = ['SUBRACES', 'VARIETIES', 'TYPES', 'KINDS', 'FORMS']
    
    # If it's a single all-caps word matching one of these keywords, it's a SIDEBAR
    if line_upper in sidebar_keywords:
        return True
    
    return False


def is_training_title(line: str) -> bool:
    """Detect if a line is a "TRAINING A ..." SIDEBAR title.
    
    Pattern: "TRAINING A XXX" where XXX is typically a monster name.
    Examples: "TRAINING A PEGASUS", "TRAINING A GRIFFON", etc.
    
    Args:
        line: The line to check
    
    Returns:
        True if this appears to be a TRAINING title
    """
    line_stripped = line.strip()
    line_upper = line_stripped.upper()
    
    # Check if line starts with "TRAINING A " (case-insensitive)
    if line_upper.startswith('TRAINING A '):
        return True
    
    return False


def sidebar_contains_monster_name(sidebar_title: str, main_monster_name: Optional[str] = None) -> bool:
    """Check if a sidebar title contains the main monster name.
    
    Args:
        sidebar_title: The sidebar title line (e.g., "VAMPIRE WEAKNESSES")
        main_monster_name: The main monster name (e.g., "VAMPIRE")
    
    Returns:
        True if the sidebar title contains the main monster name or a variation
    """
    if not main_monster_name:
        return False
    
    sidebar_upper = sidebar_title.strip().upper()
    main_name_upper = main_monster_name.upper()
    
    # Check if the sidebar title contains the main monster name
    # Handle both singular and plural forms
    if main_name_upper in sidebar_upper:
        return True
    
    # Also check plural forms
    plural_forms = [
        main_name_upper + 'S',
        main_name_upper + 'ES',
        main_name_upper + 'IES',
    ]
    for plural_form in plural_forms:
        if plural_form in sidebar_upper:
            return True
    
    # Check for variations (e.g., "LYCANTHROPY" vs "LYCANTHROPE")
    # If the sidebar title starts with a variation of the main name (at least 4 characters match), it's likely related
    if len(main_name_upper) >= 4:
        # Check if sidebar starts with a prefix of the main name
        for i in range(4, len(main_name_upper) + 1):
            prefix = main_name_upper[:i]
            if sidebar_upper.startswith(prefix):
                # Check if the next character in sidebar is not a letter (space, etc.) or if it's a variation
                if len(sidebar_upper) > i:
                    next_char = sidebar_upper[i]
                    if not next_char.isalpha() or sidebar_upper.startswith(prefix):
                        return True
                else:
                    return True
    
    # Also check if sidebar contains a significant portion of the main name
    # (e.g., "LYCANTHROPY" contains "LYCANTHROP" which is most of "LYCANTHROPE")
    if len(main_name_upper) >= 6:
        # Check for at least 6 characters of overlap
        for i in range(6, len(main_name_upper) + 1):
            substring = main_name_upper[:i]
            if substring in sidebar_upper:
                return True
    
    return False


def is_sidebar_title(line: str, main_monster_name: Optional[str] = None) -> bool:
    """Detect if a line is a SIDEBAR title.
    
    A SIDEBAR title has the pattern:
    - Starts with plural form of main monster name
    - Followed by an all-caps phrase that doesn't look like a name (e.g., "BY CHALLENGE RATING")
    - OR contains "Tactics Round-by-Round"
    - OR ends with " SOCIETY"
    - OR ends with " CHARACTERS" (but not " AS CHARACTERS")
    - OR is a standalone keyword like "SUBRACES", "VARIETIES", etc.
    
    Args:
        line: The line to check
        main_monster_name: The main monster name (singular form)
    
    Returns:
        True if this appears to be a SIDEBAR title
    """
    line_stripped = line.strip()
    
    # Exclude table headers (lines containing "|" are typically table headers, not sidebar titles)
    if '|' in line_stripped:
        return False
    
    # Check for "Tactics Round-by-Round" pattern first
    if is_tactics_round_by_round(line_stripped):
        return True
    
    # Check for "XXX SOCIETY" pattern
    if is_society_title(line_stripped):
        return True
    
    # Check for "XXX CHARACTERS" pattern (without "AS")
    if is_characters_title(line_stripped):
        return True
    
    # Check for "XXX WEAKNESSES" pattern
    if is_weaknesses_title(line_stripped):
        return True
    
    # Check for "XXX AS AN AFFLICTION" or similar patterns
    # Pattern: "XXX AS AN YYY" or "XXX AS A YYY" where XXX is a variation of the main monster name
    if main_monster_name:
        main_name_upper = main_monster_name.upper()
        line_upper = line_stripped.upper()
        # Check if line contains the main monster name (or a variation) followed by " AS AN " or " AS A "
        # This handles cases like "LYCANTHROPY AS AN AFFLICTION" where "LYCANTHROPY" is a variation of "LYCANTHROPE"
        if ' AS AN ' in line_upper or ' AS A ' in line_upper:
            # Check if the part before " AS AN " or " AS A " contains the main monster name or a variation
            if ' AS AN ' in line_upper:
                prefix = line_upper.split(' AS AN ')[0]
            else:
                prefix = line_upper.split(' AS A ')[0]
            
            # Check if prefix starts with main monster name or a variation
            if prefix.startswith(main_name_upper):
                return True
            # Check plural forms
            plural_forms = [main_name_upper + 'S', main_name_upper + 'ES', main_name_upper + 'IES']
            for plural_form in plural_forms:
                if prefix.startswith(plural_form):
                    return True
            # Check for variations (e.g., "LYCANTHROPY" vs "LYCANTHROPE")
            # If the prefix starts with a substring of the main name (at least 4 characters), it's likely a variation
            if len(main_name_upper) >= 4:
                for i in range(4, len(main_name_upper) + 1):
                    if prefix.startswith(main_name_upper[:i]):
                        return True
    
    # Check for "TRAINING A ..." pattern
    if is_training_title(line_stripped):
        return True
    
    # Check for "THE XXX'S YYY" pattern (e.g., "THE LICH'S PHYLACTERY")
    # This pattern indicates a sidebar about a specific aspect of the monster
    if main_monster_name:
        main_name_upper = main_monster_name.upper()
        line_upper = line_stripped.upper()
        if line_upper.startswith('THE '):
            # Extract the part after "THE "
            after_the = line_upper[4:].strip()
            # Check if it contains the main monster name followed by "'S"
            # Pattern: "THE LICH'S PHYLACTERY" -> "LICH'S PHYLACTERY"
            if "'S " in after_the:
                # Get the part before "'S"
                before_apostrophe = after_the.split("'S ")[0]
                # Check if it matches the main monster name or a variation
                if before_apostrophe == main_name_upper:
                    return True
                # Check plural forms
                plural_forms = [main_name_upper + 'S', main_name_upper + 'ES', main_name_upper + 'IES']
                for plural_form in plural_forms:
                    if before_apostrophe == plural_form:
                        return True
                # Check for variations (e.g., "LYCANTHROPY" vs "LYCANTHROPE")
                # If the prefix starts with a substring of the main name (at least 4 characters), it's likely a variation
                if len(main_name_upper) >= 4:
                    for i in range(4, len(main_name_upper) + 1):
                        if before_apostrophe.startswith(main_name_upper[:i]):
                            return True
    
    # Check for standalone keywords like "SUBRACES"
    if is_subraces_title(line_stripped):
        return True
    
    # Check for title case patterns like "Vulnerabilities of Swarms"
    # These are descriptive phrases that should be sidebars
    # BUT exclude special abilities (lines ending with "(Ex):", "(Su):", or "(Sp):")
    if line_stripped and not line_stripped.isupper() and not line_stripped.islower():
        # Don't treat special abilities as sidebars
        if SPECIAL_ABILITY_PATTERN.match(line_stripped):
            return False
        
        words = line_stripped.split()
        if words:
            # Check if it contains prepositions/articles that indicate a descriptive phrase
            phrase_indicators = ['of', 'for', 'with', 'and', 'or', 'the', 'a', 'an', 'in', 'on', 'at', 'to', 'by']
            has_phrase_indicator = any(word.lower() in phrase_indicators for word in words)
            
            # Title case check: first letter of each non-preposition word should be uppercase
            # Prepositions/articles can be lowercase
            is_title_case = all(
                (word[0].isupper() if word and word[0].isalpha() else True) or 
                (word.lower() in phrase_indicators)
                for word in words
            )
            
            # If it has phrase indicators and is 2+ words, it's likely a sidebar title
            if has_phrase_indicator and len(words) >= 2 and is_title_case:
                return True
    
    if not line_stripped or not line_stripped.isupper():
        return False
    
    if not main_monster_name:
        return False
    
    main_name_upper = main_monster_name.upper()
    
    # Check if line starts with main monster name (singular or plural)
    # Common plural forms: add 'S', 'ES', or other variations
    plural_forms = [
        main_name_upper + 'S',
        main_name_upper + 'ES',
        main_name_upper + 'IES',  # e.g., DEMON -> DEMONIES (unlikely but possible)
    ]
    
    # Check if line starts with main monster name (singular) or any plural form
    starts_with_monster_name = False
    remaining_text = ''
    
    # First check if it starts with the base name (singular)
    if line_stripped.startswith(main_name_upper):
        # Check if there's a space after the name (not just the name itself)
        if len(line_stripped) > len(main_name_upper) and line_stripped[len(main_name_upper)] == ' ':
            starts_with_monster_name = True
            remaining_text = line_stripped[len(main_name_upper):].strip()
    
    # If not, check plural forms (including possessive forms like "GIANTS'")
    if not starts_with_monster_name:
        for plural_form in plural_forms:
            if line_stripped.startswith(plural_form):
                # Check if there's a space or apostrophe after the plural form
                if len(line_stripped) > len(plural_form):
                    next_char = line_stripped[len(plural_form)]
                    if next_char == ' ' or (next_char == "'" and len(line_stripped) > len(plural_form) + 1 and line_stripped[len(plural_form) + 1] in ['S', ' ']):
                        starts_with_monster_name = True
                        # Skip past the apostrophe if present
                        if next_char == "'":
                            remaining_text = line_stripped[len(plural_form) + 2:].strip() if len(line_stripped) > len(plural_form) + 1 else ''
                        else:
                            remaining_text = line_stripped[len(plural_form):].strip()
                        break
    
    if not starts_with_monster_name:
        return False
    
    # The remaining text should be an all-caps phrase that doesn't look like a name
    # It should contain words like "BY", "OF", "FOR", etc. (prepositions/articles)
    # or be a descriptive phrase
    if not remaining_text:
        return False
    
    # Check if it contains common prepositions/articles that indicate a phrase
    phrase_indicators = ['BY', 'OF', 'FOR', 'WITH', 'AND', 'OR', 'THE', 'A', 'AN', 'IN', 'ON', 'AT', 'TO']
    words = remaining_text.split()
    has_phrase_indicator = any(word in phrase_indicators for word in words)
    
    # If it has phrase indicators, it's likely a SIDEBAR
    if has_phrase_indicator:
        return True
    
    # Also check if it's a multi-word phrase (more than 2 words suggests a phrase, not a name)
    if len(words) >= 2:
        return True
    
    # Also check if it's a single descriptive word (like "COVEY", "EYE") - these are sidebars
    # But only if it's not a common variant name pattern
    if len(words) == 1:
        # Single word after monster name - likely a sidebar if it's descriptive
        # Common descriptive words that indicate sidebars
        descriptive_words = ['COVEY', 'EYE', 'EYES', 'TRAITS', 'SOCIETY', 'CHARACTERS', 'WEAKNESSES', 'BAGS']
        if words[0] in descriptive_words:
            return True
    
    return False


def is_variant_name(line: str, is_first_line: bool, previous_section: Optional[str] = None, next_line: Optional[str] = None, main_monster_name: Optional[str] = None) -> bool:
    """Detect if a line is a variant monster name.
    
    Args:
        line: The line to check
        is_first_line: Whether this is the first line of the file
        previous_section: Previous section type (unused, kept for compatibility)
        next_line: Optional next line to check if it's a statblock
        main_monster_name: The main monster name (to check for SIDEBAR patterns)
    
    Returns:
        True if this appears to be a variant name
    """
    line_stripped = line.strip()
    
    # Not the first line
    if is_first_line:
        return False
    
    # Not empty
    if not line_stripped:
        return False
    
    # Not a section header
    if identify_section_header(line_stripped):
        return False
    
    # Not a template section header
    if line_stripped.startswith('CREATING A') or line_stripped.startswith('CREATING AN'):
        return False
    
    # Not a SIDEBAR title
    if is_sidebar_title(line_stripped, main_monster_name):
        return False
    
    # Not a SUBRACES title (explicit check)
    if is_subraces_title(line_stripped):
        return False
    
    # Should be a reasonable monster name (at least 2 characters, not just punctuation)
    if len(line_stripped) < 2:
        return False
    
    # Check if it's all caps (traditional variant format)
    if line_stripped.isupper():
        return True
    
    # Check if it's title case (e.g., "Animated Object, Tiny")
    # Title case: first letter of each word is uppercase, rest lowercase
    words = line_stripped.split()
    if words:
        is_title_case = all(
            word[0].isupper() and (len(word) == 1 or word[1:].islower())
            for word in words
            if word and word[0].isalpha()
        )
        
        # If it's title case and followed by a statblock, it's likely a variant
        if is_title_case and next_line:
            next_stripped = next_line.strip()
            # Check if next line is a creature type (statblock start)
            if is_creature_type(next_stripped):
                return True
    
    return False


def find_statblock_boundaries(lines: List[str], start_idx: int) -> Optional[Tuple[int, int]]:
    """Find the start and end indices of a stat block."""
    if start_idx >= len(lines):
        return None
    
    # Start is already identified
    stat_start = start_idx
    
    # Find the end
    stat_end = stat_start
    in_statblock = True
    for i in range(stat_start + 1, len(lines)):
        line = lines[i]
        next_line = lines[i + 1] if i + 1 < len(lines) else None
        
        if is_statblock_end(line, next_line, in_statblock):
            # Check if this line itself is still part of stat block
            if is_statblock_field(line.strip(), 'post_statblock') or is_creature_type(line.strip()):
                stat_end = i + 1
            else:
                stat_end = i
            break
    else:
        # Reached end of file
        stat_end = len(lines)
    
    return (stat_start, stat_end)


def find_special_ability_end(lines: List[str], start_idx: int, context: Optional[str] = None, main_monster_name: Optional[str] = None) -> int:
    """Find the end of a special ability (ends at next special ability, section header, or empty line + non-indented text)."""
    if start_idx >= len(lines):
        return start_idx + 1
    
    for i in range(start_idx + 1, len(lines)):
        line = lines[i]
        line_stripped = line.strip()
        
        # Check for CREATING section - this ends the special ability
        if line_stripped.startswith('CREATING A') or line_stripped.startswith('CREATING AN'):
            return i
        
        # Check for SIDEBAR titles - this ends the special ability
        # But skip if the line is indented - indented lines are continuations of the current SA
        if not line.startswith(' ') and not line.startswith('\t'):
            if (is_tactics_round_by_round(line_stripped) or is_society_title(line_stripped) or 
                is_characters_title(line_stripped) or is_weaknesses_title(line_stripped) or 
                is_subraces_title(line_stripped) or is_training_title(line_stripped) or
                is_sidebar_title(line_stripped, main_monster_name)):
                return i
        
        # Check if this line (even if indented) is a variant name followed by a statblock
        # This handles cases like "    DIRE BEAR" followed by "    Large Animal"
        # We need to return BEFORE the variant name so it can be processed in the main loop
        if line_stripped:
            next_check_line = lines[i + 1] if i + 1 < len(lines) else None
            # Check if the stripped line is a variant name and next line is a statblock
            if next_check_line:
                next_stripped = next_check_line.strip()
                # If current line is all caps (potential variant) and next line is a creature type (statblock start)
                # Note: next line might also be indented, so we check the stripped version
                if line_stripped.isupper() and is_creature_type(next_stripped):
                    # This looks like a variant name followed by a statblock
                    # Return BEFORE this line so the variant name can be processed in the main loop
                    if is_variant_name(line_stripped, False, None, next_check_line, main_monster_name):
                        return i
        
        # Empty line might end the ability, but check next line
        if not line_stripped:
            if i + 1 < len(lines):
                next_line = lines[i + 1]
                next_stripped = next_line.strip()
                # If next line is indented, continue the ability
                if next_stripped and not next_line.startswith(' ') and not next_line.startswith('\t'):
                    # Next line is not indented, ability probably ended
                    if is_special_ability_start(next_stripped, context) or identify_section_header(next_stripped):
                        return i
                    # Check if next line is CREATING section
                    if next_stripped.startswith('CREATING A') or next_stripped.startswith('CREATING AN'):
                        return i
                    # Check if next line is a SIDEBAR title
                    # But skip if the next line is indented - indented lines are continuations of the current SA
                    if next_line and not next_line.startswith(' ') and not next_line.startswith('\t'):
                        if (is_tactics_round_by_round(next_stripped) or is_society_title(next_stripped) or 
                            is_characters_title(next_stripped) or is_weaknesses_title(next_stripped) or 
                            is_subraces_title(next_stripped) or is_training_title(next_stripped) or
                            is_sidebar_title(next_stripped, main_monster_name)):
                            return i
            continue
        
        # Next special ability starts
        # But skip if the line is indented - indented lines are continuations of the current SA
        if not line.startswith(' ') and not line.startswith('\t'):
            if is_special_ability_start(line_stripped, context):
                return i
        
        # Section header
        if identify_section_header(line_stripped):
            return i
        
        # If line is not indented and not empty, might be end of ability
        if not line.startswith(' ') and not line.startswith('\t') and line_stripped:
            # But check if it's a variant name or something else
            next_check_line = lines[i + 1] if i + 1 < len(lines) else None
            if is_variant_name(line_stripped, False, None, next_check_line, main_monster_name):
                return i
            # Check if it's a SIDEBAR title
            # But skip if the line is indented - indented lines are continuations of the current SA
            if not line.startswith(' ') and not line.startswith('\t'):
                if (is_tactics_round_by_round(line_stripped) or is_society_title(line_stripped) or 
                    is_characters_title(line_stripped) or is_weaknesses_title(line_stripped) or 
                    is_subraces_title(line_stripped) or is_sidebar_title(line_stripped, main_monster_name)):
                    return i
            # If it looks like description text, ability ended
            if not line_stripped.isupper():
                return i
    
    return len(lines)


def parse_monster_file(content: str) -> Tuple[List[str], List[str]]:
    """
    Parse a monster file and return tagged content and any errors.
    
    Returns:
        Tuple of (tagged_lines, errors)
    """
    lines = content.split('\n')
    tagged_lines: List[str] = []
    errors: List[str] = []
    i = 0
    
    # Track what we've processed
    processed_indices = set()
    current_monster_type = None  # 'main' or 'variant'
    in_main_monster = False
    in_variant = False
    main_monster_name = None  # Track the main monster name for SIDEBAR detection
    statblock_seen_in_current = False  # Track if we've seen a statblock in current monster/variant
    content_seen_in_current = False  # Track if we've seen any content in current MAINMONSTER/VARIANT
    
    while i < len(lines):
        line = lines[i]
        line_stripped = line.strip()
        
        # Skip already processed lines
        if i in processed_indices:
            i += 1
            continue
        
        # Check if this is a CREATING section (template section - tag as one large block)
        # CREATING blocks will be moved to end of MAINMONSTER in post-processing
        if line_stripped.startswith('CREATING A') or line_stripped.startswith('CREATING AN'):
            # If we're currently in a VARIANT, close it first
            if in_variant:
                tagged_lines.append('{/VARIANT}')
                in_variant = False
                in_main_monster = False  # VARIANT was closed, so we're not in MAINMONSTER either
            
            # Tag the entire CREATING section as one block (don't try to reopen MAINMONSTER)
            tagged_lines.append('{CREATING}')
            tagged_lines.append(line)
            processed_indices.add(i)
            i += 1
            
            # Collect all content until we hit a new variant/sidebar or end of file
            while i < len(lines):
                if i in processed_indices:
                    i += 1
                    continue
                next_line = lines[i]
                next_stripped = next_line.strip()
                
                # Stop if we hit a SIDEBAR title (like "VAMPIRE WEAKNESSES", "VAMPIRE CHARACTERS", etc.)
                if (is_tactics_round_by_round(next_stripped) or is_society_title(next_stripped) or 
                    is_characters_title(next_stripped) or is_weaknesses_title(next_stripped) or
                    is_subraces_title(next_stripped) or is_training_title(next_stripped) or 
                    is_sidebar_title(next_stripped, main_monster_name)):
                    break
                
                # Stop if we hit a new variant (all caps or title case line that's a variant name)
                next_next_line = lines[i + 1] if i + 1 < len(lines) else None
                if is_variant_name(next_stripped, False, current_monster_type, next_next_line, main_monster_name):
                    break
                
                # Stop if we hit a section header (unlikely in CREATING section, but check anyway)
                if identify_section_header(next_stripped):
                    break
                
                # Add the line to the CREATING block
                tagged_lines.append(next_line)
                processed_indices.add(i)
                i += 1
            
            tagged_lines.append('{/CREATING}')
            continue
        
        # Check if this is the first line (main monster name)
        if i == 0 and line_stripped.isupper() and line_stripped:
            # Start main monster - reset statblock tracking
            tagged_lines.append('{MAINMONSTER}')
            tagged_lines.append(line)
            in_main_monster = True
            current_monster_type = 'main'
            main_monster_name = line_stripped  # Store main monster name for SIDEBAR detection
            statblock_seen_in_current = False  # Reset for main monster
            content_seen_in_current = False  # Reset content tracking
            processed_indices.add(i)
            i += 1
            continue
        
        # Check if this is a section header (ASCHARACTERS, etc.) BEFORE checking for SIDEBAR
        # This ensures "XXX AS CHARACTERS" or "XXX CHARACTERS" is detected as ASCHARACTERS, not SIDEBAR
        section_type = identify_section_header(line_stripped, main_monster_name)
        if section_type == 'ASCHARACTERS':
            tagged_lines.append('{ASCHARACTERS}')
            tagged_lines.append(line)
            content_seen_in_current = True  # Mark that we've seen content
            processed_indices.add(i)
            i += 1
            # This is complex, collect until we find CHARTRAITS or end
            while i < len(lines):
                if i in processed_indices:
                    i += 1
                    continue
                next_line = lines[i]
                next_stripped = next_line.strip()
                next_next_line = lines[i + 1] if i + 1 < len(lines) else None
                if (is_special_ability_start(next_stripped) or 
                    (identify_section_header(next_stripped, main_monster_name) and identify_section_header(next_stripped, main_monster_name) != 'ASCHARACTERS') or
                    is_variant_name(next_stripped, False, current_monster_type, next_next_line, main_monster_name) or
                    is_sidebar_title(next_stripped, main_monster_name)):
                    break
                # Check for CHARTRAITS
                if 'CHARTRAITS' in next_stripped.upper() or 'CHARACTER TRAITS' in next_stripped.upper():
                    tagged_lines.append('{CHARTRAITS}')
                    tagged_lines.append(next_line)
                    content_seen_in_current = True  # Mark that we've seen content
                    processed_indices.add(i)
                    i += 1
                    # Collect chartraits content
                    while i < len(lines):
                        if i in processed_indices:
                            i += 1
                            continue
                        chart_line = lines[i]
                        chart_stripped = chart_line.strip()
                        next_chart_line = lines[i + 1] if i + 1 < len(lines) else None
                        if (is_special_ability_start(chart_stripped) or 
                            identify_section_header(chart_stripped, main_monster_name) or
                            is_variant_name(chart_stripped, False, current_monster_type, next_chart_line, main_monster_name) or
                            is_sidebar_title(chart_stripped, main_monster_name)):
                            break
                        tagged_lines.append(chart_line)
                        processed_indices.add(i)
                        i += 1
                    tagged_lines.append('{/CHARTRAITS}')
                    continue
                tagged_lines.append(next_line)
                processed_indices.add(i)
                i += 1
            tagged_lines.append('{/ASCHARACTERS}')
            continue
        
        # Check if this is a SIDEBAR title
        # SIDEBAR blocks are nested within MAINMONSTER or VARIANT, similar to CREATING blocks
        # Check for "Tactics Round-by-Round", "XXX SOCIETY", "XXX CHARACTERS", "XXX WEAKNESSES", or "SUBRACES" first
        # Note: "SUBRACES" and other sidebars can appear after CREATING blocks or after MAINMONSTER closes
        is_subraces = is_subraces_title(line_stripped)
        is_training = is_training_title(line_stripped)
        is_sidebar_pattern = (is_tactics_round_by_round(line_stripped) or is_society_title(line_stripped) or 
                             is_characters_title(line_stripped) or is_weaknesses_title(line_stripped) or 
                             is_subraces or is_training)
        # Allow sidebars if we're in MAINMONSTER/VARIANT, or if it's a SUBRACES, or if main_monster_name is set (we're still in the same file)
        in_context = in_main_monster or in_variant or is_subraces or (is_sidebar_pattern and main_monster_name)
        if is_sidebar_pattern and in_context:
            # Tag the entire SIDEBAR section as one block (similar to CREATING)
            tagged_lines.append('{SIDEBAR}')
            tagged_lines.append(line)
            processed_indices.add(i)
            i += 1
            
            # Collect all content until we hit a new variant, section header, or end of file
            while i < len(lines):
                if i in processed_indices:
                    i += 1
                    continue
                next_line = lines[i]
                next_stripped = next_line.strip()
                
                # Stop if we hit another SIDEBAR title (e.g., "SUBRACES" after "DWARF SOCIETY")
                if (is_tactics_round_by_round(next_stripped) or is_society_title(next_stripped) or 
                    is_characters_title(next_stripped) or is_weaknesses_title(next_stripped) or 
                    is_subraces_title(next_stripped) or is_training_title(next_stripped) or 
                    is_sidebar_title(next_stripped, main_monster_name)):
                    break
                
                # Stop if we hit a new variant (all caps or title case line that's a variant name)
                next_next_line = lines[i + 1] if i + 1 < len(lines) else None
                if is_variant_name(next_stripped, False, current_monster_type, next_next_line, main_monster_name):
                    break
                
                # Don't stop at section headers (like COMBAT) - they're part of the SIDEBAR content
                # Stop if we hit a statblock start (new variant might start with statblock)
                context_check = 'post_statblock' if statblock_seen_in_current else None
                if is_statblock_start(next_stripped, context_check, statblock_seen_in_current):
                    break
                
                # For "XXX CHARACTERS" sidebars, continue to end of file (they contain special abilities)
                # Don't stop at special abilities for CHARACTERS sidebars
                if not is_characters_title(line_stripped):
                    # Stop if we hit a special ability (might be start of new section)
                    # But only if it's a clear special ability pattern (like "Ability Name (Ex):")
                    # Lines ending with ":" that are descriptive text should continue
                    if is_special_ability_start(next_stripped, context_check):
                        # Check if it's a clear special ability pattern (not just a line ending with ":")
                        if SPECIAL_ABILITY_PATTERN.match(next_stripped):
                            # This is a real special ability, stop here
                            break
                        # Otherwise, it might just be descriptive text in the sidebar, continue
                
                # Add the line to the SIDEBAR block (including section headers like "COMBAT")
                tagged_lines.append(next_line)
                processed_indices.add(i)
                i += 1
            
            tagged_lines.append('{/SIDEBAR}')
            continue
        
        # Check for other SIDEBAR patterns (plural + phrase, like "DEMONS BY CHALLENGE RATING")
        # These can appear within MAINMONSTER or after it closes (still in the same file)
        if is_sidebar_title(line_stripped, main_monster_name) and (in_main_monster or main_monster_name):
            # Check if it has a statblock - if so, it's not a SIDEBAR
            # Look ahead to see if there's a statblock in the next ~50 lines
            has_statblock = False
            lookahead_end = min(i + 50, len(lines))
            for j in range(i + 1, lookahead_end):
                if j in processed_indices:
                    continue
                check_line = lines[j].strip()
                if is_creature_type(check_line):
                    has_statblock = True
                    break
                # Also check if we hit a new variant
                next_check_line = lines[j + 1] if j + 1 < len(lines) else None
                if is_variant_name(check_line, False, current_monster_type, next_check_line, main_monster_name):
                    break
            
            # SIDEBAR should not have a statblock
            if not has_statblock:
                # Tag the entire SIDEBAR section as one block (similar to CREATING)
                tagged_lines.append('{SIDEBAR}')
                tagged_lines.append(line)
                processed_indices.add(i)
                i += 1
                
                # Collect all content until we hit a new variant or end of file
                while i < len(lines):
                    if i in processed_indices:
                        i += 1
                        continue
                    next_line = lines[i]
                    next_stripped = next_line.strip()
                    
                    # Stop if we hit another SIDEBAR title (e.g., "SUBRACES" after "DWARF SOCIETY")
                    if (is_tactics_round_by_round(next_stripped) or is_society_title(next_stripped) or 
                        is_characters_title(next_stripped) or is_weaknesses_title(next_stripped) or 
                        is_subraces_title(next_stripped) or is_training_title(next_stripped) or 
                        is_sidebar_title(next_stripped, main_monster_name)):
                        break
                    
                    # Stop if we hit a new variant (all caps or title case line that's a variant name)
                    next_next_line = lines[i + 1] if i + 1 < len(lines) else None
                    if is_variant_name(next_stripped, False, current_monster_type, next_next_line, main_monster_name):
                        break
                    
                    # Don't stop at section headers (like COMBAT) - they're part of the SIDEBAR content
                    # Stop if we hit a statblock start (new variant might start with statblock)
                    context_check = 'post_statblock' if statblock_seen_in_current else None
                    if is_statblock_start(next_stripped, context_check, statblock_seen_in_current):
                        break
                    
                    # Don't stop at special abilities that are part of the sidebar content
                    # (e.g., lines ending with ":" that are descriptive text, not actual special abilities)
                    # Only stop if it's a clear special ability pattern (like "Ability Name (Ex):")
                    # and it's not indented (indented lines are continuations)
                    if not next_line.startswith(' ') and not next_line.startswith('\t'):
                        if is_special_ability_start(next_stripped, context_check):
                            # Check if it's a clear special ability pattern (not just a line ending with ":")
                            if SPECIAL_ABILITY_PATTERN.match(next_stripped):
                                # This is a real special ability, stop here
                                break
                            # Otherwise, it might just be descriptive text in the sidebar, continue
                    
                    # Add the line to the SIDEBAR block
                    tagged_lines.append(next_line)
                    processed_indices.add(i)
                    i += 1
                
                tagged_lines.append('{/SIDEBAR}')
                continue
        
        # Check if this is a variant name (even if indented)
        # But skip if it's a SIDEBAR title (like "SUBRACES")
        # Check next line to see if it's a statblock (for title-case variants)
        # Also check if the line itself is indented but followed by a statblock
        next_line_for_check = lines[i + 1] if i + 1 < len(lines) else None
        # Don't treat SIDEBAR titles as variants - but they should have been caught by the SIDEBAR check above
        # If we get here and it's a SIDEBAR title, it means the SIDEBAR check didn't catch it (maybe because we're not in MAINMONSTER)
        # So we need to handle it here
        if is_subraces_title(line_stripped):
            # This is a SIDEBAR, not a variant - process it as a SIDEBAR
            # Tag the entire SIDEBAR section as one block
            tagged_lines.append('{SIDEBAR}')
            tagged_lines.append(line)
            processed_indices.add(i)
            i += 1
            
            # Collect all content until we hit a new variant, section header, or end of file
            while i < len(lines):
                if i in processed_indices:
                    i += 1
                    continue
                next_line = lines[i]
                next_stripped = next_line.strip()
                
                # Stop if we hit another SIDEBAR title (e.g., another "SUBRACES" or "VARIETIES")
                if (is_tactics_round_by_round(next_stripped) or is_society_title(next_stripped) or 
                    is_characters_title(next_stripped) or is_weaknesses_title(next_stripped) or
                    is_subraces_title(next_stripped) or is_training_title(next_stripped) or 
                    is_sidebar_title(next_stripped, main_monster_name)):
                    break
                
                # Stop if we hit a new variant (all caps or title case line that's a variant name)
                next_next_line = lines[i + 1] if i + 1 < len(lines) else None
                if is_variant_name(next_stripped, False, current_monster_type, next_next_line, main_monster_name):
                    break
                
                # Don't stop at section headers (like COMBAT) - they're part of the SIDEBAR content
                # Stop if we hit a statblock start (new variant might start with statblock)
                context_check = 'post_statblock' if statblock_seen_in_current else None
                if is_statblock_start(next_stripped, context_check, statblock_seen_in_current):
                    break
                
                # Stop if we hit a special ability (might be start of new section)
                if is_special_ability_start(next_stripped, context_check):
                    break
                
                # Add the line to the SIDEBAR block
                tagged_lines.append(next_line)
                processed_indices.add(i)
                i += 1
            
            tagged_lines.append('{/SIDEBAR}')
            continue
        else:
            # Check if this is a monster name + statblock immediately after opening MAINMONSTER/VARIANT
            # If we're in MAINMONSTER/VARIANT and haven't seen any content yet, and this line is a monster name
            # (possibly with class info like "Dwarf, 1st-Level Warrior") followed by a statblock, treat it as part of the current block
            is_immediate_statblock_entry = False
            if (in_main_monster or in_variant) and not content_seen_in_current and next_line_for_check:
                next_stripped = next_line_for_check.strip()
                # Check if next line is a statblock start (creature type)
                if is_creature_type(next_stripped):
                    # This looks like a monster name followed by a statblock
                    # Extract base monster name from "XXX, Y-level Classname" format
                    base_name = line_stripped.split(',')[0].strip()
                    # If we're in MAINMONSTER, check if base name matches main monster name (case-insensitive)
                    if in_main_monster and main_monster_name:
                        if base_name.upper() == main_monster_name.upper():
                            # This is the main monster's statblock entry, not a variant
                            is_immediate_statblock_entry = True
                    # If we're in VARIANT, any monster name + statblock immediately after opening is part of that variant
                    elif in_variant:
                        is_immediate_statblock_entry = True
            
            # If this is an immediate statblock entry, just add the line and continue to statblock processing
            if is_immediate_statblock_entry:
                tagged_lines.append(line)
                processed_indices.add(i)
                content_seen_in_current = True
                i += 1
                # Continue to next iteration - the statblock check below will handle the statblock itself
                continue
            
            # Check if this line (even if indented) is a variant name followed by a statblock
            if not is_immediate_statblock_entry:
                is_indented_variant = False
                if (line.startswith(' ') or line.startswith('\t')) and line_stripped:
                    # Line is indented - check if it's a variant name followed by a statblock
                    if next_line_for_check:
                        next_stripped = next_line_for_check.strip()
                        # If current line is all caps (potential variant) and next line is a creature type (statblock start)
                        if line_stripped.isupper() and is_creature_type(next_stripped):
                            # This looks like an indented variant name followed by a statblock
                            if is_variant_name(line_stripped, i == 0, current_monster_type, next_line_for_check, main_monster_name):
                                is_indented_variant = True
                
                if is_indented_variant or is_variant_name(line_stripped, i == 0, current_monster_type, next_line_for_check, main_monster_name):
                    # End previous monster/variant if needed
                    # VARIANT blocks are siblings of MAINMONSTER, not nested
                    if in_variant:
                        tagged_lines.append('{/VARIANT}')
                    elif in_main_monster:
                        tagged_lines.append('{/MAINMONSTER}')
                    
                    # Start variant - reset statblock tracking
                    tagged_lines.append('{VARIANT}')
                    tagged_lines.append(line)
                    in_variant = True
                    in_main_monster = False  # Variants are siblings, not children
                    current_monster_type = 'variant'
                    statblock_seen_in_current = False  # Reset for new variant
                    content_seen_in_current = False  # Reset content tracking
                    processed_indices.add(i)
                    i += 1
                    
                    # Check if the next line is description text (not a statblock, variant, etc.)
                    # But first check if it's a monster name + statblock entry (like "Elite Vampire, 13th-Level Half-Elf Monk/Shadowdancer")
                    if i < len(lines):
                        next_line = lines[i]
                        next_stripped = next_line.strip()
                        next_next_line = lines[i + 1] if i + 1 < len(lines) else None
                        next_next_stripped = next_next_line.strip() if next_next_line else None
                        
                        # Check if this is a monster name + statblock entry (followed by a statblock start)
                        is_monster_name_statblock = False
                        if next_stripped and next_next_stripped:
                            # Check if next line is a statblock start (creature type)
                            context_check = None
                            if is_statblock_start(next_next_stripped, context_check, statblock_seen_in_current):
                                # This looks like a monster name followed by a statblock
                                is_monster_name_statblock = True
                        
                        if not is_monster_name_statblock and next_stripped and not next_stripped.isupper():
                            # Check if it's not a statblock, variant, section header, special ability, or traits
                            context_check = None
                            if (not is_statblock_start(next_stripped, context_check, statblock_seen_in_current) and
                                not is_variant_name(next_stripped, False, current_monster_type, next_next_line, main_monster_name) and
                                not identify_section_header(next_stripped, main_monster_name) and
                                not is_special_ability_start(next_stripped, context_check) and
                                not is_traits_start(next_stripped) and
                                not is_sidebar_title(next_stripped, main_monster_name)):
                                # This looks like description text - collect it
                                desc_start = i
                                desc_end = i
                                while desc_end < len(lines):
                                    if desc_end in processed_indices:
                                        desc_end += 1
                                        continue
                                    desc_line = lines[desc_end]
                                    desc_stripped = desc_line.strip()
                                    if not desc_stripped:
                                        desc_end += 1
                                        continue
                                    next_desc_line = lines[desc_end + 1] if desc_end + 1 < len(lines) else None
                                    if (is_special_ability_start(desc_stripped, context_check) or
                                        identify_section_header(desc_stripped, main_monster_name) or
                                        is_variant_name(desc_stripped, False, current_monster_type, next_desc_line, main_monster_name) or
                                        is_sidebar_title(desc_stripped, main_monster_name) or
                                        is_statblock_start(desc_stripped, context_check, statblock_seen_in_current) or
                                        is_traits_start(desc_stripped)):
                                        break
                                    desc_end += 1
                                
                                if desc_end > desc_start:
                                    tagged_lines.append('{DESCRIPTION}')
                                    content_seen_in_current = True
                                    for j in range(desc_start, desc_end):
                                        if j < len(lines):
                                            tagged_lines.append(lines[j])
                                            processed_indices.add(j)
                                    tagged_lines.append('{/DESCRIPTION}')
                                    i = desc_end
                    
                    continue
        
        # Check if this is a section header (but skip ASCHARACTERS - already handled above)
        section_type = identify_section_header(line_stripped, main_monster_name)
        if section_type:
            if section_type == 'ASCHARACTERS':
                # Already handled above, skip
                i += 1
                continue
            elif section_type == 'COMBAT':
                # Don't include the "COMBAT" header line in the tag
                tagged_lines.append('{COMBAT}')
                content_seen_in_current = True  # Mark that we've seen content
                processed_indices.add(i)
                i += 1
                # Collect combat content until next section/ability
                # Inside COMBAT, treat as post_statblock context so "Skills:" etc. are detected as special abilities
                while i < len(lines):
                    if i in processed_indices:
                        i += 1
                        continue
                    next_line = lines[i]
                    next_stripped = next_line.strip()
                    # Inside COMBAT section, always use post_statblock context for special ability detection
                    context = 'post_statblock'
                    next_next_line = lines[i + 1] if i + 1 < len(lines) else None
                    if (is_special_ability_start(next_stripped, context) or 
                        identify_section_header(next_stripped, main_monster_name) or
                        is_variant_name(next_stripped, False, current_monster_type, next_next_line, main_monster_name) or
                        is_sidebar_title(next_stripped, main_monster_name)):
                        break
                    tagged_lines.append(next_line)
                    processed_indices.add(i)
                    i += 1
                tagged_lines.append('{/COMBAT}')
                continue
            elif section_type == 'PREPEDSPELLS':
                tagged_lines.append('{PREPEDSPELLS}')
                tagged_lines.append(line)
                content_seen_in_current = True  # Mark that we've seen content
                processed_indices.add(i)
                i += 1
                # Collect until next section
                while i < len(lines):
                    if i in processed_indices:
                        i += 1
                        continue
                    next_line = lines[i]
                    next_stripped = next_line.strip()
                    context = 'post_statblock' if statblock_seen_in_current else None
                    next_next_line = lines[i + 1] if i + 1 < len(lines) else None
                    if (is_special_ability_start(next_stripped, context) or 
                        identify_section_header(next_stripped, main_monster_name) or
                        is_variant_name(next_stripped, False, current_monster_type, next_next_line, main_monster_name) or
                        is_sidebar_title(next_stripped, main_monster_name)):
                        break
                    tagged_lines.append(next_line)
                    processed_indices.add(i)
                    i += 1
                tagged_lines.append('{/PREPEDSPELLS}')
                continue
            elif section_type == 'POSSESSIONS':
                tagged_lines.append('{POSSESSIONS}')
                tagged_lines.append(line)
                content_seen_in_current = True  # Mark that we've seen content
                processed_indices.add(i)
                i += 1
                # Collect until next section
                while i < len(lines):
                    if i in processed_indices:
                        i += 1
                        continue
                    next_line = lines[i]
                    next_stripped = next_line.strip()
                    context = 'post_statblock' if statblock_seen_in_current else None
                    next_next_line = lines[i + 1] if i + 1 < len(lines) else None
                    # Stop if we hit CREATING section
                    if next_stripped.startswith('CREATING A') or next_stripped.startswith('CREATING AN'):
                        break
                    if (is_special_ability_start(next_stripped, context) or 
                        identify_section_header(next_stripped, main_monster_name) or
                        is_variant_name(next_stripped, False, current_monster_type, next_next_line, main_monster_name) or
                        is_sidebar_title(next_stripped, main_monster_name)):
                        break
                    tagged_lines.append(next_line)
                    processed_indices.add(i)
                    i += 1
                tagged_lines.append('{/POSSESSIONS}')
                continue
            elif section_type == 'ASCHARACTERS':
                tagged_lines.append('{ASCHARACTERS}')
                tagged_lines.append(line)
                content_seen_in_current = True  # Mark that we've seen content
                processed_indices.add(i)
                i += 1
                # This is complex, collect until we find CHARTRAITS or end
                while i < len(lines):
                    if i in processed_indices:
                        i += 1
                        continue
                    next_line = lines[i]
                    next_stripped = next_line.strip()
                    next_next_line = lines[i + 1] if i + 1 < len(lines) else None
                    if (is_special_ability_start(next_stripped) or 
                        (identify_section_header(next_stripped, main_monster_name) and identify_section_header(next_stripped, main_monster_name) != 'ASCHARACTERS') or
                        is_variant_name(next_stripped, False, current_monster_type, next_next_line, main_monster_name) or
                        is_sidebar_title(next_stripped, main_monster_name)):
                        break
                    # Check for CHARTRAITS
                    if 'CHARTRAITS' in next_stripped.upper() or 'CHARACTER TRAITS' in next_stripped.upper():
                        tagged_lines.append('{CHARTRAITS}')
                        tagged_lines.append(next_line)
                        content_seen_in_current = True  # Mark that we've seen content
                        processed_indices.add(i)
                        i += 1
                        # Collect chartraits content
                        while i < len(lines):
                            if i in processed_indices:
                                i += 1
                                continue
                            chart_line = lines[i]
                            chart_stripped = chart_line.strip()
                            next_chart_line = lines[i + 1] if i + 1 < len(lines) else None
                            if (is_special_ability_start(chart_stripped) or 
                                identify_section_header(chart_stripped, main_monster_name) or
                                is_variant_name(chart_stripped, False, current_monster_type, next_chart_line, main_monster_name) or
                                is_sidebar_title(chart_stripped, main_monster_name)):
                                break
                            tagged_lines.append(chart_line)
                            processed_indices.add(i)
                            i += 1
                        tagged_lines.append('{/CHARTRAITS}')
                        continue
                    tagged_lines.append(next_line)
                    processed_indices.add(i)
                    i += 1
                tagged_lines.append('{/ASCHARACTERS}')
                continue
        
        # Check if this is a stat block start (even if indented, if we're in a variant)
        # Only check if we haven't seen a stat block yet in current monster/variant
        context = 'post_statblock' if statblock_seen_in_current else None
        # If we're in a variant and the line is indented, check if it's a statblock start
        is_indented_statblock = False
        if in_variant and (line.startswith(' ') or line.startswith('\t')) and line_stripped:
            # Check if this indented line is a creature type (statblock start)
            if is_creature_type(line_stripped):
                is_indented_statblock = True
        
        if is_indented_statblock or is_statblock_start(line_stripped, context, statblock_seen_in_current):
            tagged_lines.append('{STATBLOCK}')
            statblock_range = find_statblock_boundaries(lines, i)
            if statblock_range:
                stat_start, stat_end = statblock_range
                # Add all stat block lines
                for j in range(stat_start, stat_end):
                    if j < len(lines):
                        tagged_lines.append(lines[j])
                        processed_indices.add(j)
                tagged_lines.append('{/STATBLOCK}')
                statblock_seen_in_current = True  # Mark that we've seen a statblock
                content_seen_in_current = True  # Mark that we've seen content
                i = stat_end
                
                # Check for flavor text (first descriptive paragraph after stat block)
                if i < len(lines):
                    # Look for flavor text pattern
                    flavor_candidate_start = i
                    flavor_candidate_end = i
                    # Skip empty lines
                    while flavor_candidate_start < len(lines) and not lines[flavor_candidate_start].strip():
                        flavor_candidate_start += 1
                        flavor_candidate_end += 1
                    
                    if flavor_candidate_start < len(lines):
                        # Check if it looks like flavor text (descriptive, might start with "A" or "The")
                        first_line = lines[flavor_candidate_start].strip()
                        context_check = 'post_statblock' if statblock_seen_in_current else None
                        if first_line and not first_line.isupper() and not is_statblock_start(first_line, context_check, statblock_seen_in_current):
                            # Might be flavor text - collect until description or combat
                            flavor_end = flavor_candidate_start
                            while flavor_end < len(lines):
                                if flavor_end in processed_indices:
                                    flavor_end += 1
                                    continue
                                flavor_line = lines[flavor_end]
                                flavor_stripped = flavor_line.strip()
                                if not flavor_stripped:
                                    # Empty line might end flavor text
                                    if flavor_end + 1 < len(lines):
                                        next_flavor = lines[flavor_end + 1]
                                        if next_flavor.strip() and not next_flavor.strip().isupper():
                                            # Next line is description, flavor ended
                                            break
                                elif (is_special_ability_start(flavor_stripped, 'post_statblock' if statblock_seen_in_current else None) or
                                      identify_section_header(flavor_stripped, main_monster_name) or
                                      is_variant_name(flavor_stripped, False, current_monster_type, lines[flavor_end + 1] if flavor_end + 1 < len(lines) else None, main_monster_name) or
                                      is_sidebar_title(flavor_stripped, main_monster_name) or
                                      is_statblock_start(flavor_stripped, 'post_statblock' if statblock_seen_in_current else None, statblock_seen_in_current)):
                                    break
                                flavor_end += 1
                            
                            # Check if we found reasonable flavor text (at least one line)
                            if flavor_end > flavor_candidate_start:
                                tagged_lines.append('{FLAVORTEXT}')
                                content_seen_in_current = True  # Mark that we've seen content
                                for j in range(flavor_candidate_start, flavor_end):
                                    if j < len(lines):
                                        tagged_lines.append(lines[j])
                                        processed_indices.add(j)
                                tagged_lines.append('{/FLAVORTEXT}')
                                i = flavor_end
                                continue
                
                continue
        
        # Check if this is a CREATING section (check again here in case it wasn't caught earlier)
        # This is a safety check - CREATING sections should be caught above, but check here too
        # CREATING blocks will be moved to end of MAINMONSTER in post-processing
        if line_stripped.startswith('CREATING A') or line_stripped.startswith('CREATING AN'):
            # If we're currently in a VARIANT, close it first
            if in_variant:
                tagged_lines.append('{/VARIANT}')
                in_variant = False
                in_main_monster = False  # VARIANT was closed, so we're not in MAINMONSTER either
            
            # Tag the entire CREATING section as one block (don't try to reopen MAINMONSTER)
            tagged_lines.append('{CREATING}')
            tagged_lines.append(line)
            processed_indices.add(i)
            i += 1
            
            # Collect all content until we hit a new variant/sidebar or end of file
            while i < len(lines):
                if i in processed_indices:
                    i += 1
                    continue
                next_line = lines[i]
                next_stripped = next_line.strip()
                
                # Stop if we hit a new variant or sidebar (all caps or title case line that's a variant name)
                next_next_line = lines[i + 1] if i + 1 < len(lines) else None
                if is_variant_name(next_stripped, False, current_monster_type, next_next_line, main_monster_name) or is_sidebar_title(next_stripped, main_monster_name):
                    break
                
                # Stop if we hit a section header (unlikely in CREATING section, but check anyway)
                if identify_section_header(next_stripped):
                    break
                
                # Add the line to the CREATING block
                tagged_lines.append(next_line)
                processed_indices.add(i)
                i += 1
            
            tagged_lines.append('{/CREATING}')
            continue
        
        # Check if this is a TRAITS block
        # This check must come before description text collection
        if is_traits_start(line_stripped):
            tagged_lines.append('{TRAITS}')
            tagged_lines.append(line)
            content_seen_in_current = True  # Mark that we've seen content
            processed_indices.add(i)
            i += 1
            # Collect until next section, special ability, variant, or description
            context = 'post_statblock' if statblock_seen_in_current else None
            while i < len(lines):
                if i in processed_indices:
                    i += 1
                    continue
                next_line = lines[i]
                next_stripped = next_line.strip()
                next_next_line = lines[i + 1] if i + 1 < len(lines) else None
                # Stop at special ability, section header, variant, sidebar, or new description block
                if (is_special_ability_start(next_stripped, context) or
                    identify_section_header(next_stripped, main_monster_name) or
                    is_variant_name(next_stripped, False, current_monster_type, next_next_line, main_monster_name) or
                    is_sidebar_title(next_stripped, main_monster_name) or
                    is_traits_start(next_stripped)):
                    break
                # Also stop if we hit a non-indented line that looks like description start
                # (but not if it's part of the traits content)
                if next_stripped and not next_line.startswith(' ') and not next_line.startswith('\t'):
                    # Check if it's a new section
                    if (not next_stripped.isupper() and 
                        not is_statblock_start(next_stripped, context, statblock_seen_in_current) and
                        not is_special_ability_start(next_stripped, context)):
                        # Might be description - but only break if we're past the traits content
                        # (traits content is usually indented or bulleted)
                        if i > 0:
                            prev_line = lines[i - 1].strip()
                            # If previous line was empty or looks like end of traits, break
                            if not prev_line or (prev_line and not prev_line.startswith('-') and not prev_line.startswith('    ')):
                                break
                tagged_lines.append(next_line)
                processed_indices.add(i)
                i += 1
            tagged_lines.append('{/TRAITS}')
            continue
        
        # Check if this is a special ability
        # After a statblock, "Skills:" and other fields are special abilities, not statblock fields
        # Also treat as post_statblock if we're in MAINMONSTER/VARIANT and have seen a COMBAT section
        # (this handles cases where MAINMONSTER has no statblock but has COMBAT + special abilities)
        has_seen_combat = any('{COMBAT}' in l for l in tagged_lines[-50:])
        context = 'post_statblock' if (statblock_seen_in_current or (has_seen_combat and (in_main_monster or in_variant))) else None
        if is_special_ability_start(line_stripped, context):
            tagged_lines.append('{SA}')
            content_seen_in_current = True  # Mark that we've seen content
            sa_end = find_special_ability_end(lines, i, context, main_monster_name)
            
            # Check if this SA contains "Typical Spells Known" - if so, split it
            typical_spells_idx = None
            for j in range(i + 1, sa_end):
                if j < len(lines):
                    line_check = lines[j].strip()
                    if 'TYPICAL' in line_check.upper() and ('SPELLS KNOWN' in line_check.upper() or 'SPELLS PREPARED' in line_check.upper()):
                        typical_spells_idx = j
                        break
            
            if typical_spells_idx is not None:
                # Split the SA: everything before "Typical Spells Known" stays in SA
                for j in range(i, typical_spells_idx):
                    if j < len(lines):
                        tagged_lines.append(lines[j])
                        processed_indices.add(j)
                tagged_lines.append('{/SA}')
                
                # Now tag "Typical Spells Known" as PREPEDSPELLS
                tagged_lines.append('{PREPEDSPELLS}')
                # Find where the PREPEDSPELLS section ends
                prepedspells_end = typical_spells_idx
                for j in range(typical_spells_idx, sa_end):
                    if j < len(lines):
                        line_check = lines[j].strip()
                        # Stop if we hit a new special ability, section header, variant, or sidebar
                        next_check_line = lines[j + 1] if j + 1 < len(lines) else None
                        if (is_special_ability_start(line_check, context) or
                            identify_section_header(line_check, main_monster_name) or
                            is_variant_name(line_check, False, current_monster_type, next_check_line, main_monster_name) or
                            is_sidebar_title(line_check, main_monster_name)):
                            prepedspells_end = j
                            break
                else:
                    prepedspells_end = sa_end
                
                # Add all lines in the PREPEDSPELLS section
                for j in range(typical_spells_idx, prepedspells_end):
                    if j < len(lines):
                        tagged_lines.append(lines[j])
                        processed_indices.add(j)
                tagged_lines.append('{/PREPEDSPELLS}')
                i = prepedspells_end
            else:
                # No "Typical Spells Known" - process normally
                for j in range(i, sa_end):
                    if j < len(lines):
                        tagged_lines.append(lines[j])
                        processed_indices.add(j)
                tagged_lines.append('{/SA}')
                i = sa_end
            continue
        
        # Check if this is description text (between stat block and COMBAT, or after flavor text)
        context = 'post_statblock' if statblock_seen_in_current else None
        # Don't collect description if this is a SIDEBAR title (should be caught above)
        if (is_tactics_round_by_round(line_stripped) or is_society_title(line_stripped) or 
            is_characters_title(line_stripped) or is_weaknesses_title(line_stripped) or 
            is_subraces_title(line_stripped) or is_training_title(line_stripped)):
            i += 1
            continue
        
        if line_stripped and not line_stripped.isupper() and not is_statblock_start(line_stripped, context, statblock_seen_in_current):
            # Don't collect description if this is a TRAITS line (should have been caught above)
            if is_traits_start(line_stripped):
                i += 1
                continue
            
            # Might be description - collect until COMBAT, special ability, variant, or TRAITS
            desc_start = i
            desc_end = i
            while desc_end < len(lines):
                if desc_end in processed_indices:
                    desc_end += 1
                    continue
                desc_line = lines[desc_end]
                desc_stripped = desc_line.strip()
                if not desc_stripped:
                    # Empty line might be part of description
                    desc_end += 1
                    continue
                next_desc_line = lines[desc_end + 1] if desc_end + 1 < len(lines) else None
                if (is_special_ability_start(desc_stripped, context) or
                    identify_section_header(desc_stripped) or
                    is_variant_name(desc_stripped, False, current_monster_type, next_desc_line, main_monster_name) or
                    is_sidebar_title(desc_stripped, main_monster_name) or
                    is_statblock_start(desc_stripped, context, statblock_seen_in_current) or
                    is_traits_start(desc_stripped)):
                    break
                desc_end += 1
            
            if desc_end > desc_start:
                # Check if we should tag this as description
                # Only if we're in a monster/variant and haven't seen COMBAT yet
                # (SIDEBAR blocks don't have sub-blocks like DESCRIPTION)
                if (in_main_monster or in_variant) and not any('{COMBAT}' in l for l in tagged_lines[-20:]):
                    tagged_lines.append('{DESCRIPTION}')
                    content_seen_in_current = True  # Mark that we've seen content
                    for j in range(desc_start, desc_end):
                        if j < len(lines):
                            tagged_lines.append(lines[j])
                            processed_indices.add(j)
                    tagged_lines.append('{/DESCRIPTION}')
                    i = desc_end
                    continue
        
        # Unprocessed line - this is an error
        if line_stripped:  # Only error on non-empty lines
            errors.append(f"Line {i+1}: Unable to identify content: {line_stripped[:50]}")
            # Still add it to preserve text
            tagged_lines.append(line)
            processed_indices.add(i)
        
        i += 1
    
    # Close any open tags
    # VARIANT blocks are siblings of MAINMONSTER, not nested
    # SIDEBAR blocks are nested within MAINMONSTER, so they're already closed
    if in_variant:
        tagged_lines.append('{/VARIANT}')
    if in_main_monster:
        tagged_lines.append('{/MAINMONSTER}')
    
    # Post-process: 
    # 1. If a monster/variant has FLAVORTEXT but no DESCRIPTION, convert FLAVORTEXT to DESCRIPTION
    # 2. Remove empty COMBAT sections (just open/close tags with no content)
    # 3. Move CREATING blocks to the end of MAINMONSTER blocks (before {/MAINMONSTER})
    # 4. Move SIDEBAR blocks that contain the main monster name into MAINMONSTER (before {/MAINMONSTER})
    # 5. Move ASCHARACTERS blocks that contain the main monster name into MAINMONSTER (before {/MAINMONSTER})
    # First, extract the main monster name and collect blocks that need to be moved
    main_monster_name = None
    outside_creating_blocks = []
    outside_sidebars_to_move = []  # Sidebars that contain main monster name and are outside MAINMONSTER
    outside_ascharacters_to_move = []  # ASCHARACTERS blocks that contain main monster name and are outside MAINMONSTER
    
    # Extract main monster name
    i = 0
    while i < len(tagged_lines):
        if tagged_lines[i] == '{MAINMONSTER}' and i + 1 < len(tagged_lines):
            main_monster_name = tagged_lines[i + 1].strip()
            break
        i += 1
    
    # Collect variant names to check if sidebars contain variant names (and shouldn't be moved)
    variant_names = []
    i = 0
    while i < len(tagged_lines):
        if tagged_lines[i] == '{VARIANT}' and i + 1 < len(tagged_lines):
            variant_name = tagged_lines[i + 1].strip()
            if variant_name:
                variant_names.append(variant_name.upper())
        i += 1
    
    # Collect CREATING blocks and sidebars that are outside MAINMONSTER or inside VARIANTs
    i = 0
    depth = 0
    in_mainmonster = False
    in_variant = False
    current_variant_name = None  # Track the current variant name when inside a VARIANT
    while i < len(tagged_lines):
        line = tagged_lines[i]
        if line == '{MAINMONSTER}':
            in_mainmonster = True
            in_variant = False
            # Skip the entire block
            depth = 1
            i += 1
            while i < len(tagged_lines) and depth > 0:
                if tagged_lines[i].startswith('{/') and not tagged_lines[i].startswith('{//'):
                    depth -= 1
                    if tagged_lines[i] == '{/MAINMONSTER}':
                        in_mainmonster = False
                elif tagged_lines[i].startswith('{') and not tagged_lines[i].startswith('{/') and not tagged_lines[i].startswith('{//'):
                    depth += 1
                i += 1
        elif line == '{VARIANT}':
            in_variant = True
            in_mainmonster = False
            # Get the variant name
            if i + 1 < len(tagged_lines):
                current_variant_name = tagged_lines[i + 1].strip()
            # Process the VARIANT block to check for sidebars inside it
            depth = 1
            i += 1
            while i < len(tagged_lines) and depth > 0:
                variant_line = tagged_lines[i]
                # Check if this is a SIDEBAR inside the VARIANT
                if variant_line == '{SIDEBAR}':
                    # Collect this SIDEBAR block if it contains the main monster name
                    sidebar_block = [variant_line]
                    sidebar_depth = 1
                    sidebar_title = None
                    sidebar_start_idx = i
                    i += 1
                    # Get the sidebar title (first non-tag line after {SIDEBAR})
                    while i < len(tagged_lines) and sidebar_depth > 0:
                        sidebar_line = tagged_lines[i]
                        sidebar_block.append(sidebar_line)
                        if sidebar_line == '{/SIDEBAR}':
                            sidebar_depth -= 1
                        elif sidebar_line == '{SIDEBAR}':
                            sidebar_depth += 1
                        elif sidebar_title is None and not sidebar_line.startswith('{'):
                            sidebar_title = sidebar_line.strip()
                        i += 1
                    # Check if this sidebar contains the main monster name
                    # BUT also check if it contains a variant name - if it does, don't move it
                    should_move = False
                    if sidebar_title and main_monster_name and sidebar_contains_monster_name(sidebar_title, main_monster_name):
                        # Check if it also contains a variant name - if so, it's variant-specific and shouldn't be moved
                        contains_variant_name = False
                        sidebar_upper = sidebar_title.upper()
                        for variant_name in variant_names:
                            if variant_name in sidebar_upper:
                                contains_variant_name = True
                                break
                        # Only move if it contains main monster name but NOT a variant name
                        if not contains_variant_name:
                            should_move = True
                    if should_move:
                        # Inside a VARIANT - add to list to move
                        outside_sidebars_to_move.append((sidebar_block, sidebar_start_idx))
                    # Continue processing the VARIANT block
                    continue
                elif variant_line.startswith('{/') and not variant_line.startswith('{//'):
                    depth -= 1
                    if variant_line == '{/VARIANT}':
                        in_variant = False
                        current_variant_name = None
                elif variant_line.startswith('{') and not variant_line.startswith('{/') and not variant_line.startswith('{//'):
                    depth += 1
                i += 1
        elif line == '{CREATING}':
            # Collect this CREATING block (it's outside MAINMONSTER/VARIANT)
            creating_block = [line]
            creating_depth = 1
            i += 1
            while i < len(tagged_lines) and creating_depth > 0:
                creating_line = tagged_lines[i]
                creating_block.append(creating_line)
                if creating_line == '{/CREATING}':
                    creating_depth -= 1
                elif creating_line == '{CREATING}':
                    creating_depth += 1
                i += 1
            outside_creating_blocks.append(creating_block)
        elif line == '{SIDEBAR}':
            # Collect this SIDEBAR block if it contains the main monster name
            # It can be outside MAINMONSTER or inside a VARIANT - both should be moved to MAINMONSTER
            sidebar_block = [line]
            sidebar_depth = 1
            sidebar_title = None
            sidebar_start_idx = i
            i += 1
            # Get the sidebar title (first non-tag line after {SIDEBAR})
            while i < len(tagged_lines) and sidebar_depth > 0:
                sidebar_line = tagged_lines[i]
                sidebar_block.append(sidebar_line)
                if sidebar_line == '{/SIDEBAR}':
                    sidebar_depth -= 1
                elif sidebar_line == '{SIDEBAR}':
                    sidebar_depth += 1
                elif sidebar_title is None and not sidebar_line.startswith('{'):
                    sidebar_title = sidebar_line.strip()
                i += 1
            # Check if this sidebar contains the main monster name
            # If it's outside MAINMONSTER or inside a VARIANT, it should be moved to MAINMONSTER
            # BUT also check if it contains a variant name - if it does, don't move it
            if sidebar_title and main_monster_name and sidebar_contains_monster_name(sidebar_title, main_monster_name):
                # Check if it also contains a variant name - if so, it's variant-specific and shouldn't be moved
                contains_variant_name = False
                sidebar_upper = sidebar_title.upper()
                for variant_name in variant_names:
                    if variant_name in sidebar_upper:
                        contains_variant_name = True
                        break
                # Only move if it contains main monster name but NOT a variant name
                if not contains_variant_name and not in_mainmonster:
                    # Outside MAINMONSTER or inside a VARIANT - add to list to move
                    outside_sidebars_to_move.append((sidebar_block, sidebar_start_idx))
        elif line == '{ASCHARACTERS}' and not in_mainmonster:
            # Collect this ASCHARACTERS block if it's outside MAINMONSTER and contains the main monster name
            ascharacters_block = [line]
            ascharacters_depth = 1
            ascharacters_title = None
            i += 1
            # Get the ASCHARACTERS title (first non-tag line after {ASCHARACTERS})
            while i < len(tagged_lines) and ascharacters_depth > 0:
                ascharacters_line = tagged_lines[i]
                ascharacters_block.append(ascharacters_line)
                if ascharacters_line == '{/ASCHARACTERS}':
                    ascharacters_depth -= 1
                elif ascharacters_line == '{ASCHARACTERS}':
                    ascharacters_depth += 1
                elif ascharacters_title is None and not ascharacters_line.startswith('{'):
                    ascharacters_title = ascharacters_line.strip()
                i += 1
            # Check if this ASCHARACTERS block contains the main monster name
            if ascharacters_title and main_monster_name and sidebar_contains_monster_name(ascharacters_title, main_monster_name):
                outside_ascharacters_to_move.append(ascharacters_block)
        else:
            i += 1
    
    # Now process the blocks
    result_lines = []
    i = 0
    while i < len(tagged_lines):
        line = tagged_lines[i]
        
        # Check if we're starting a MAINMONSTER block
        if line == '{MAINMONSTER}':
            result_lines.append(line)
            # Collect all lines until the closing tag
            block_lines = []
            i += 1
            depth = 1
            has_description = False
            has_flavortext = False
            flavortext_start = -1
            flavortext_end = -1
            creating_blocks = []  # Collect CREATING blocks to move (from inside MAINMONSTER)
            
            while i < len(tagged_lines) and depth > 0:
                current_line = tagged_lines[i]
                
                if current_line == '{DESCRIPTION}':
                    has_description = True
                    block_lines.append(current_line)
                elif current_line == '{/DESCRIPTION}':
                    block_lines.append(current_line)
                elif current_line == '{FLAVORTEXT}':
                    has_flavortext = True
                    flavortext_start = len(block_lines)
                    block_lines.append(current_line)
                elif current_line == '{/FLAVORTEXT}':
                    flavortext_end = len(block_lines)
                    block_lines.append(current_line)
                elif current_line == '{CREATING}':
                    # Start collecting a CREATING block
                    creating_block = [current_line]
                    creating_depth = 1
                    j = i + 1
                    while j < len(tagged_lines) and creating_depth > 0:
                        creating_line = tagged_lines[j]
                        creating_block.append(creating_line)
                        if creating_line == '{/CREATING}':
                            creating_depth -= 1
                        elif creating_line == '{CREATING}':
                            creating_depth += 1
                        j += 1
                    creating_blocks.append(creating_block)
                    i = j - 1  # j is already past the block, so -1 to account for the i += 1 below
                else:
                    block_lines.append(current_line)
                
                if current_line.startswith('{/') and not current_line.startswith('{//'):
                    depth -= 1
                elif current_line.startswith('{') and not current_line.startswith('{/') and not current_line.startswith('{//'):
                    depth += 1
                
                i += 1
            
            # If we have FLAVORTEXT but no DESCRIPTION, convert FLAVORTEXT to DESCRIPTION
            if has_flavortext and not has_description and flavortext_start >= 0 and flavortext_end >= 0:
                block_lines[flavortext_start] = '{DESCRIPTION}'
                block_lines[flavortext_end] = '{/DESCRIPTION}'
            
            # Remove empty COMBAT sections
            filtered_block_lines = []
            j = 0
            while j < len(block_lines):
                if block_lines[j] == '{COMBAT}':
                    # Check if this is an empty COMBAT section
                    combat_start = j
                    j += 1
                    has_content = False
                    # Look for the closing tag
                    while j < len(block_lines) and block_lines[j] != '{/COMBAT}':
                        # If we find any non-empty line before the closing tag, it's not empty
                        if block_lines[j].strip():
                            has_content = True
                        j += 1
                    
                    if has_content:
                        # Not empty, keep the entire COMBAT section
                        while combat_start <= j and combat_start < len(block_lines):
                            filtered_block_lines.append(block_lines[combat_start])
                            combat_start += 1
                        j += 1  # Move past the closing tag
                    else:
                        # Empty - skip both opening and closing tags
                        if j < len(block_lines):
                            j += 1  # Skip the closing tag
                        # j is already at the position after {/COMBAT}, continue to next iteration
                else:
                    filtered_block_lines.append(block_lines[j])
                    j += 1
            
            # Combine multiple DESCRIPTION blocks into one
            combined_block_lines = []
            description_contents = []  # Collect all description content
            first_desc_position = -1  # Track where the first DESCRIPTION was in filtered_block_lines
            j = 0
            while j < len(filtered_block_lines):
                if filtered_block_lines[j] == '{DESCRIPTION}':
                    # Track position of first DESCRIPTION
                    if first_desc_position == -1:
                        first_desc_position = len(combined_block_lines)
                    # Start collecting description content
                    desc_content = []
                    j += 1
                    while j < len(filtered_block_lines) and filtered_block_lines[j] != '{/DESCRIPTION}':
                        desc_content.append(filtered_block_lines[j])
                        j += 1
                    # Skip the closing tag
                    if j < len(filtered_block_lines):
                        j += 1
                    # Add the content (preserve order)
                    description_contents.append(desc_content)
                else:
                    combined_block_lines.append(filtered_block_lines[j])
                    j += 1
            
            # If we found DESCRIPTION blocks, combine them and insert at the original position
            if description_contents:
                # Combine all description contents in order
                combined_description = ['{DESCRIPTION}']
                for desc_content in description_contents:
                    combined_description.extend(desc_content)
                combined_description.append('{/DESCRIPTION}')
                
                # Insert the combined DESCRIPTION at the original position
                if first_desc_position == -1:
                    first_desc_position = 0
                
                # Insert in reverse order to maintain position
                for line in reversed(combined_description):
                    combined_block_lines.insert(first_desc_position, line)
            
            filtered_block_lines = combined_block_lines
            
            # Move CREATING blocks to the end (before {/MAINMONSTER})
            # Include both blocks from inside MAINMONSTER and blocks from outside
            all_creating_blocks = creating_blocks + outside_creating_blocks
            if all_creating_blocks:
                # Find the {/MAINMONSTER} tag
                mainmonster_end_idx = -1
                for k in range(len(filtered_block_lines) - 1, -1, -1):
                    if filtered_block_lines[k] == '{/MAINMONSTER}':
                        mainmonster_end_idx = k
                        break
                
                if mainmonster_end_idx >= 0:
                    # Insert all CREATING blocks before {/MAINMONSTER}
                    for creating_block in all_creating_blocks:
                        # Insert in reverse order to maintain order
                        for creating_line in reversed(creating_block):
                            filtered_block_lines.insert(mainmonster_end_idx, creating_line)
            
            # Move SIDEBAR blocks that contain the main monster name into MAINMONSTER (before {/MAINMONSTER})
            # These should come after CREATING blocks
            if outside_sidebars_to_move:
                # Find the {/MAINMONSTER} tag
                mainmonster_end_idx = -1
                for k in range(len(filtered_block_lines) - 1, -1, -1):
                    if filtered_block_lines[k] == '{/MAINMONSTER}':
                        mainmonster_end_idx = k
                        break
                
                if mainmonster_end_idx >= 0:
                    # Insert all SIDEBAR blocks before {/MAINMONSTER} (after CREATING blocks)
                    # Reverse the list of blocks to maintain original order (since we insert in reverse)
                    for sidebar_block, sidebar_start_idx in reversed(outside_sidebars_to_move):
                        # Insert in reverse order to maintain order
                        for sidebar_line in reversed(sidebar_block):
                            filtered_block_lines.insert(mainmonster_end_idx, sidebar_line)
            
            # Move ASCHARACTERS blocks that contain the main monster name into MAINMONSTER (before {/MAINMONSTER})
            # These should come after SIDEBAR blocks
            if outside_ascharacters_to_move:
                # Find the {/MAINMONSTER} tag
                mainmonster_end_idx = -1
                for k in range(len(filtered_block_lines) - 1, -1, -1):
                    if filtered_block_lines[k] == '{/MAINMONSTER}':
                        mainmonster_end_idx = k
                        break
                
                if mainmonster_end_idx >= 0:
                    # Insert all ASCHARACTERS blocks before {/MAINMONSTER} (after SIDEBAR blocks)
                    for ascharacters_block in outside_ascharacters_to_move:
                        # Insert in reverse order to maintain order
                        for ascharacters_line in reversed(ascharacters_block):
                            filtered_block_lines.insert(mainmonster_end_idx, ascharacters_line)
            
            result_lines.extend(filtered_block_lines)
        elif line == '{VARIANT}':
            # For VARIANT blocks, just do the FLAVORTEXT/DESCRIPTION conversion and empty COMBAT removal
            # Also remove SIDEBARs that contain the main monster name (they'll be moved to MAINMONSTER)
            result_lines.append(line)
            block_lines = []
            i += 1
            depth = 1
            has_description = False
            has_flavortext = False
            flavortext_start = -1
            flavortext_end = -1
            
            while i < len(tagged_lines) and depth > 0:
                current_line = tagged_lines[i]
                
                # Check if this is a SIDEBAR that should be removed (moved to MAINMONSTER)
                if current_line == '{SIDEBAR}':
                    # Get the sidebar title
                    sidebar_title = None
                    j = i + 1
                    while j < len(tagged_lines) and not tagged_lines[j].startswith('{'):
                        if tagged_lines[j].strip():
                            sidebar_title = tagged_lines[j].strip()
                            break
                        j += 1
                    
                    # If this sidebar contains the main monster name, skip it (it will be moved to MAINMONSTER)
                    # BUT also check if it contains a variant name - if it does, keep it in the variant
                    if sidebar_title and main_monster_name and sidebar_contains_monster_name(sidebar_title, main_monster_name):
                        # Check if it also contains a variant name - if so, it's variant-specific and shouldn't be moved
                        contains_variant_name = False
                        sidebar_upper = sidebar_title.upper()
                        for variant_name in variant_names:
                            if variant_name in sidebar_upper:
                                contains_variant_name = True
                                break
                        # Only skip if it contains main monster name but NOT a variant name
                        if not contains_variant_name:
                            # Skip the entire SIDEBAR block
                            sidebar_depth = 1
                            i += 1
                            while i < len(tagged_lines) and sidebar_depth > 0:
                                if tagged_lines[i] == '{/SIDEBAR}':
                                    sidebar_depth -= 1
                                elif tagged_lines[i] == '{SIDEBAR}':
                                    sidebar_depth += 1
                                i += 1
                            continue
                
                block_lines.append(current_line)
                
                if current_line == '{DESCRIPTION}':
                    has_description = True
                elif current_line == '{FLAVORTEXT}':
                    has_flavortext = True
                    flavortext_start = len(block_lines) - 1
                elif current_line == '{/FLAVORTEXT}':
                    flavortext_end = len(block_lines) - 1
                
                if current_line.startswith('{/') and not current_line.startswith('{//'):
                    depth -= 1
                elif current_line.startswith('{') and not current_line.startswith('{/') and not current_line.startswith('{//'):
                    depth += 1
                
                i += 1
            
            # If we have FLAVORTEXT but no DESCRIPTION, convert FLAVORTEXT to DESCRIPTION
            if has_flavortext and not has_description and flavortext_start >= 0 and flavortext_end >= 0:
                block_lines[flavortext_start] = '{DESCRIPTION}'
                block_lines[flavortext_end] = '{/DESCRIPTION}'
            
            # Remove empty COMBAT sections
            filtered_block_lines = []
            j = 0
            while j < len(block_lines):
                if block_lines[j] == '{COMBAT}':
                    # Check if this is an empty COMBAT section
                    combat_start = j
                    j += 1
                    has_content = False
                    # Look for the closing tag
                    while j < len(block_lines) and block_lines[j] != '{/COMBAT}':
                        # If we find any non-empty line before the closing tag, it's not empty
                        if block_lines[j].strip():
                            has_content = True
                        j += 1
                    
                    if has_content:
                        # Not empty, keep the entire COMBAT section
                        while combat_start <= j and combat_start < len(block_lines):
                            filtered_block_lines.append(block_lines[combat_start])
                            combat_start += 1
                        j += 1  # Move past the closing tag
                    else:
                        # Empty - skip both opening and closing tags
                        if j < len(block_lines):
                            j += 1  # Skip the closing tag
                else:
                    filtered_block_lines.append(block_lines[j])
                    j += 1
            
            # Combine multiple DESCRIPTION blocks into one
            combined_block_lines = []
            description_contents = []  # Collect all description content
            first_desc_position = -1  # Track where the first DESCRIPTION was in filtered_block_lines
            j = 0
            while j < len(filtered_block_lines):
                if filtered_block_lines[j] == '{DESCRIPTION}':
                    # Track position of first DESCRIPTION
                    if first_desc_position == -1:
                        first_desc_position = len(combined_block_lines)
                    # Start collecting description content
                    desc_content = []
                    j += 1
                    while j < len(filtered_block_lines) and filtered_block_lines[j] != '{/DESCRIPTION}':
                        desc_content.append(filtered_block_lines[j])
                        j += 1
                    # Skip the closing tag
                    if j < len(filtered_block_lines):
                        j += 1
                    # Add the content (preserve order)
                    description_contents.append(desc_content)
                else:
                    combined_block_lines.append(filtered_block_lines[j])
                    j += 1
            
            # If we found DESCRIPTION blocks, combine them and insert at the original position
            if description_contents:
                # Combine all description contents in order
                combined_description = ['{DESCRIPTION}']
                for desc_content in description_contents:
                    combined_description.extend(desc_content)
                combined_description.append('{/DESCRIPTION}')
                
                # Insert the combined DESCRIPTION at the original position
                if first_desc_position == -1:
                    first_desc_position = 0
                
                # Insert in reverse order to maintain position
                for line in reversed(combined_description):
                    combined_block_lines.insert(first_desc_position, line)
            
            filtered_block_lines = combined_block_lines
            
            result_lines.extend(filtered_block_lines)
        elif line == '{SIDEBAR}':
            # Check if this SIDEBAR should be moved into MAINMONSTER
            # Get the sidebar title to check
            sidebar_title = None
            j = i + 1
            while j < len(tagged_lines) and not tagged_lines[j].startswith('{'):
                if tagged_lines[j].strip():
                    sidebar_title = tagged_lines[j].strip()
                    break
                j += 1
            
            # If this sidebar contains the main monster name and is in outside_sidebars_to_move, skip it
            # (it will be moved into MAINMONSTER)
            should_skip = False
            if sidebar_title and main_monster_name and sidebar_contains_monster_name(sidebar_title, main_monster_name):
                # Check if this sidebar is in outside_sidebars_to_move
                for sidebar_block, sidebar_start_idx in outside_sidebars_to_move:
                    if sidebar_block[0] == '{SIDEBAR}' and len(sidebar_block) > 1:
                        block_title = sidebar_block[1].strip() if not sidebar_block[1].startswith('{') else None
                        if block_title == sidebar_title:
                            should_skip = True
                            break
            
            if should_skip:
                # Skip this sidebar - it will be moved into MAINMONSTER
                sidebar_depth = 1
                i += 1
                while i < len(tagged_lines) and sidebar_depth > 0:
                    if tagged_lines[i] == '{/SIDEBAR}':
                        sidebar_depth -= 1
                    elif tagged_lines[i] == '{SIDEBAR}':
                        sidebar_depth += 1
                    i += 1
            else:
                # SIDEBAR blocks just pass through (no post-processing needed)
                result_lines.append(line)
                i += 1
                depth = 1
                while i < len(tagged_lines) and depth > 0:
                    result_lines.append(tagged_lines[i])
                    if tagged_lines[i].startswith('{/') and not tagged_lines[i].startswith('{//'):
                        depth -= 1
                    elif tagged_lines[i].startswith('{') and not tagged_lines[i].startswith('{/') and not tagged_lines[i].startswith('{//'):
                        depth += 1
                    i += 1
        elif line == '{ASCHARACTERS}':
            # Check if this ASCHARACTERS should be moved into MAINMONSTER
            # Get the ASCHARACTERS title to check
            ascharacters_title = None
            j = i + 1
            while j < len(tagged_lines) and not tagged_lines[j].startswith('{'):
                if tagged_lines[j].strip():
                    ascharacters_title = tagged_lines[j].strip()
                    break
                j += 1
            
            # If this ASCHARACTERS contains the main monster name and is in outside_ascharacters_to_move, skip it
            # (it will be moved into MAINMONSTER)
            should_skip = False
            if ascharacters_title and main_monster_name and sidebar_contains_monster_name(ascharacters_title, main_monster_name):
                # Check if this ASCHARACTERS is in outside_ascharacters_to_move
                for ascharacters_block in outside_ascharacters_to_move:
                    if ascharacters_block[0] == '{ASCHARACTERS}' and len(ascharacters_block) > 1:
                        block_title = ascharacters_block[1].strip() if not ascharacters_block[1].startswith('{') else None
                        if block_title == ascharacters_title:
                            should_skip = True
                            break
            
            if should_skip:
                # Skip this ASCHARACTERS - it will be moved into MAINMONSTER
                ascharacters_depth = 1
                i += 1
                while i < len(tagged_lines) and ascharacters_depth > 0:
                    if tagged_lines[i] == '{/ASCHARACTERS}':
                        ascharacters_depth -= 1
                    elif tagged_lines[i] == '{ASCHARACTERS}':
                        ascharacters_depth += 1
                    i += 1
            else:
                # ASCHARACTERS blocks just pass through (no post-processing needed)
                result_lines.append(line)
                i += 1
                depth = 1
                while i < len(tagged_lines) and depth > 0:
                    result_lines.append(tagged_lines[i])
                    if tagged_lines[i].startswith('{/') and not tagged_lines[i].startswith('{//'):
                        depth -= 1
                    elif tagged_lines[i].startswith('{') and not tagged_lines[i].startswith('{/') and not tagged_lines[i].startswith('{//'):
                        depth += 1
                    i += 1
        elif line == '{CREATING}':
            # Skip CREATING blocks that are outside MAINMONSTER - they'll be moved in post-processing
            # (We already collected them in outside_creating_blocks, so skip them here)
            creating_depth = 1
            i += 1
            while i < len(tagged_lines) and creating_depth > 0:
                if tagged_lines[i] == '{/CREATING}':
                    creating_depth -= 1
                elif tagged_lines[i] == '{CREATING}':
                    creating_depth += 1
                i += 1
        else:
            result_lines.append(line)
            i += 1
    
    return result_lines, errors


def tag_monster_file(input_path: Path, output_path: Path, overwrite: bool = False, suppress_skip_messages: bool = False, show_output_on_error: bool = False) -> Tuple[bool, Optional[str]]:
    """
    Process a single monster file.
    
    Args:
        input_path: Path to input file
        output_path: Path to output file
        overwrite: Whether to overwrite existing files
        suppress_skip_messages: If True, don't log skip messages
        show_output_on_error: If True, output tagged content to STDOUT even when there are errors
    
    Returns:
        Tuple of (success: bool, error_message: Optional[str])
    """
    if output_path.exists() and not overwrite:
        if not suppress_skip_messages:
            logger.info(f"Skipping {input_path.name} (already exists in tagged folder)")
        return True, None
    
    try:
        with open(input_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        tagged_lines, errors = parse_monster_file(content)
        
        if errors:
            error_msg = f"Errors in {input_path.name}:\n" + "\n".join(f"  - {e}" for e in errors)
            logger.error(error_msg)
            logger.error(f"Skipping {input_path.name} due to tagging errors")
            
            # If show_output_on_error is set, output the tagged content to STDOUT
            if show_output_on_error:
                print("\n" + "="*80)
                print(f"TAGGED OUTPUT FOR {input_path.name} (with errors):")
                print("="*80)
                print('\n'.join(tagged_lines))
                if tagged_lines:  # Add newline at end if file has content
                    print()
                print("="*80 + "\n")
            
            return False, error_msg
        
        # Write tagged content
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(tagged_lines))
            if tagged_lines:  # Add newline at end if file has content
                f.write('\n')
        
        logger.info(f"✓ Tagged {input_path.name}")
        return True, None
    
    except Exception as e:
        error_msg = f"Error processing {input_path.name}: {str(e)}"
        logger.error(error_msg, exc_info=True)
        return False, error_msg


def main():
    """Main function."""
    parser = argparse.ArgumentParser(description='Tag monster files with XML-like tags')
    parser.add_argument('--overwrite', action='store_true', help='Overwrite existing tagged files')
    parser.add_argument('--file', type=str, help='Process only the specified file')
    parser.add_argument('--debug', action='store_true', help='Enable debug logging')
    parser.add_argument('--untagged', action='store_true', help='Suppress skip messages for already-tagged files')
    parser.add_argument('--show-output-on-error', action='store_true', help='Output tagged content to STDOUT even when there are parsing errors (for debugging)')
    
    args = parser.parse_args()
    
    if args.debug:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Set up paths
    script_dir = Path(__file__).parent
    input_dir = script_dir / 'output' / 'monsters' / 'text_clean_p3'
    output_dir = script_dir / 'output' / 'monsters' / 'tagged'
    
    if not input_dir.exists():
        logger.error(f"Input directory not found: {input_dir}")
        return 1
    
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Get files to process
    if args.file:
        input_files = [input_dir / args.file]
        if not input_files[0].exists():
            logger.error(f"File not found: {input_files[0]}")
            return 1
    else:
        input_files = sorted(input_dir.glob('*.txt'))
    
    if not input_files:
        logger.info("No files to process")
        return 0
    
    logger.info(f"Processing {len(input_files)} file(s)...")
    
    success_count = 0
    error_count = 0
    
    for input_file in input_files:
        output_file = output_dir / input_file.name
        success, error = tag_monster_file(input_file, output_file, args.overwrite, args.untagged, args.show_output_on_error)
        
        if success:
            success_count += 1
        else:
            error_count += 1
    
    logger.info(f"\nCompleted: {success_count} succeeded, {error_count} failed")
    
    return 0 if error_count == 0 else 1


if __name__ == '__main__':
    exit(main())

