#!/usr/bin/env python3
"""
Generate dragon variants from dragon-true.txt.

This script parses the dragon-true.txt file and generates a properly tagged
output file with all 12 age variants for each dragon category.
"""

import re
import logging
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
from collections import defaultdict
from dataclasses import dataclass, field

# Configure logging (will be set in main() based on command-line args)
logger = logging.getLogger(__name__)

# Age categories in order
AGE_CATEGORIES = [
    "Wyrmling", "Very young", "Young", "Juvenile",
    "Young adult", "Adult", "Mature adult", "Old",
    "Very old", "Ancient", "Wyrm", "Great wyrm"
]

AGE_CATEGORY_NUMBERS = {age: i + 1 for i, age in enumerate(AGE_CATEGORIES)}

# Size mapping for lookup
SIZE_ORDER = ["Fine", "Diminutive", "Tiny", "Small", "Medium", "Large", "Huge", "Gargantuan", "Colossal"]


@dataclass
class BlockNode:
    """Represents a tagged block in the file structure."""
    tag: str
    content: str = ""
    children: List['BlockNode'] = field(default_factory=list)
    parent: Optional['BlockNode'] = None
    
    def add_child(self, child: 'BlockNode'):
        """Add a child node and set its parent."""
        child.parent = self
        self.children.append(child)
    
    def remove_child(self, child: 'BlockNode'):
        """Remove a child node."""
        if child in self.children:
            self.children.remove(child)
            child.parent = None
    
    def find_children(self, tag: str) -> List['BlockNode']:
        """Find all direct children with the given tag."""
        return [child for child in self.children if child.tag == tag]
    
    def find_descendants(self, tag: str) -> List['BlockNode']:
        """Find all descendants (at any depth) with the given tag."""
        results = []
        for child in self.children:
            if child.tag == tag:
                results.append(child)
            results.extend(child.find_descendants(tag))
        return results
    
    def get_content_without_children(self) -> str:
        """
        Get content that's not part of any child blocks.
        
        This removes all child block tags and their content from the node's content.
        """
        if not self.children:
            return self.content
        
        content = self.content
        
        # Remove each child block by finding and removing {TAG}...{/TAG} pairs
        # We need to handle nesting, so we'll process from innermost to outermost
        # by sorting children by their position in content
        
        # Build list of child blocks with their positions
        child_blocks = []
        for child in self.children:
            open_pattern = rf'\{{{re.escape(child.tag)}\}}'
            close_pattern = rf'\{{/{re.escape(child.tag)}\}}'
            
            # Find all instances of this child tag
            for open_match in re.finditer(open_pattern, content):
                # Find matching closing tag (handle nesting)
                start_pos = open_match.end()
                depth = 1
                pos = start_pos
                close_pos = None
                
                while depth > 0 and pos < len(content):
                    next_open = re.search(open_pattern, content[pos:])
                    next_close = re.search(close_pattern, content[pos:])
                    
                    if not next_close:
                        break
                    
                    next_open_pos = next_open.start() + pos if next_open else len(content)
                    next_close_pos = next_close.start() + pos
                    next_close_end = next_close_pos + (next_close.end() - next_close.start())
                    
                    if next_open_pos < next_close_pos:
                        depth += 1
                        pos = next_open_pos + (next_open.end() - next_open.start())
                    else:
                        depth -= 1
                        if depth == 0:
                            close_pos = next_close_end
                            break
                        pos = next_close_end
                
                if close_pos:
                    child_blocks.append((open_match.start(), close_pos, child.tag))
        
        # Sort by start position (descending) so we can remove from end to start
        child_blocks.sort(key=lambda x: x[0], reverse=True)
        
        # Remove blocks from end to start (so positions don't shift)
        for start, end, tag in child_blocks:
            content = content[:start] + content[end:]
        
        return content.strip()
    
    def get_content_and_children_in_order(self) -> List[Tuple[int, str, Optional['BlockNode']]]:
        """
        Get content segments and children in their original order.
        
        Returns a list of tuples: (position, type, value)
        where type is 'content' or 'child', and value is either a string (content) or BlockNode (child).
        """
        if not self.children:
            return [(0, 'content', self.content)]
        
        # Find positions for each child block (one per child)
        child_positions = []
        used_positions = set()  # Track which positions we've already matched
        unmatched_children = []  # Children not found in original content (e.g., dynamically generated)
        
        for child in self.children:
            open_pattern = rf'\{{{re.escape(child.tag)}\}}'
            close_pattern = rf'\{{/{re.escape(child.tag)}\}}'
            
            matched = False
            # Find the first occurrence of this tag that matches this child's content
            for open_match in re.finditer(open_pattern, self.content):
                start_pos = open_match.start()
                
                # Skip if we've already used this position
                if start_pos in used_positions:
                    continue
                
                # Find matching closing tag (handle nesting)
                content_start = open_match.end()
                depth = 1
                pos = content_start
                close_pos = None
                
                while depth > 0 and pos < len(self.content):
                    next_open = re.search(open_pattern, self.content[pos:])
                    next_close = re.search(close_pattern, self.content[pos:])
                    
                    if not next_close:
                        break
                    
                    next_open_pos = next_open.start() + pos if next_open else len(self.content)
                    next_close_pos = next_close.start() + pos
                    next_close_end = next_close_pos + (next_close.end() - next_close.start())
                    
                    if next_open_pos < next_close_pos:
                        depth += 1
                        pos = next_open_pos + (next_open.end() - next_open.start())
                    else:
                        depth -= 1
                        if depth == 0:
                            close_pos = next_close_end
                            break
                        pos = next_close_end
                
                if close_pos:
                    # Verify this matches the child's content
                    block_content = self.content[content_start:close_pos - (next_close.end() - next_close.start())]
                    # Check if the content matches (allowing for whitespace differences)
                    child_content_stripped = child.content.strip()
                    block_content_stripped = block_content.strip()
                    
                    # If content matches (or if child has no content yet), use this position
                    if child_content_stripped == block_content_stripped or not child_content_stripped:
                        child_positions.append((start_pos, close_pos, child))
                        used_positions.add(start_pos)
                        matched = True
                        break  # Found the match for this child, move to next child
            
            # If child wasn't found in original content, add it to unmatched list
            if not matched:
                unmatched_children.append(child)
        
        # Sort by start position
        child_positions.sort(key=lambda x: x[0])
        
        # Add unmatched children at the end (they're dynamically generated, like VARIANTs)
        # Use a position after the end of content
        end_pos = len(self.content)
        for child in unmatched_children:
            child_positions.append((end_pos, end_pos, child))
            end_pos += 1  # Increment so they stay in order
        
        # Build ordered list of content segments and children
        result = []
        last_pos = 0
        
        for start, end, child in child_positions:
            # Add content before this child
            if start > last_pos:
                content_segment = self.content[last_pos:start].strip()
                if content_segment:
                    result.append((last_pos, 'content', content_segment))
            
            # Add the child
            result.append((start, 'child', child))
            last_pos = end
        
        # Add remaining content after last child
        if last_pos < len(self.content):
            content_segment = self.content[last_pos:].strip()
            if content_segment:
                result.append((last_pos, 'content', content_segment))
        
        return result


def parse_into_tree(content: str) -> BlockNode:
    """
    Parse the tagged file content into a tree structure.
    
    Structure: MAINMONSTER (root) -> GROUP (children) -> CATEGORY (children of GROUP)
    
    Returns the root node (MAINMONSTER).
    """
    # Define block hierarchy
    block_hierarchy = {
        'MAINMONSTER': 1,
        'GROUP': 2,
        'CATEGORY': 3,
        'VARIANT': 4,
        'INPUTDATA': 5,
        'DESCRIPTION': 5,
        'COMBAT': 5,
        'FLAVORTEXT': 5,
        'SA': 5,
        'TABLE': 5,
        'EXAMPLE': 5,
        'STATBLOCK': 5,
        'SIDEBAR': 5,
    }
    
    # Stack to track open blocks
    stack: List[Tuple[BlockNode, int]] = []  # (node, start_position)
    root: Optional[BlockNode] = None
    top_level_nodes: List[BlockNode] = []
    
    # Pattern to find all tags
    tag_pattern = r'\{/?(\w+)\}'
    
    pos = 0
    while pos < len(content):
        match = re.search(tag_pattern, content[pos:])
        if not match:
            break
        
        tag_start = pos + match.start()
        tag_end = pos + match.end()
        is_closing = match.group(0).startswith('{/')
        tag_name = match.group(1)
        
        if tag_name not in block_hierarchy:
            pos = tag_end
            continue
        
        if is_closing:
            # Find matching opening tag on stack
            found = False
            for i in range(len(stack) - 1, -1, -1):
                node, start_pos = stack[i]
                if node.tag == tag_name:
                    # Set content for this node (content between opening and closing tags)
                    # start_pos is after the opening tag, tag_start is before the closing tag
                    node.content = content[start_pos:tag_start]
                    # Remove from stack
                    stack.pop(i)
                    found = True
                    break
            
            if not found:
                line_num = content[:tag_start].count('\n') + 1
                raise ValueError(
                    f"Block nesting error: Found closing tag {{/{tag_name}}} at line {line_num} "
                    f"but no matching opening tag was found."
                )
        else:
            # Opening tag - create new node
            node = BlockNode(tag=tag_name)
            
            # Add to parent if stack is not empty
            if stack:
                parent_node, _ = stack[-1]
                parent_node.add_child(node)
            else:
                # Top-level node
                top_level_nodes.append(node)
                if root is None and tag_name == 'MAINMONSTER':
                    root = node
            
            # Push onto stack
            stack.append((node, tag_end))
        
        pos = tag_end
    
    # Check for unclosed blocks
    if stack:
        unclosed = ', '.join([f"{node.tag} (at line {content[:pos].count(chr(10)) + 1})" 
                             for node, pos in stack])
        raise ValueError(f"Block nesting error: Unclosed blocks found: {unclosed}")
    
    if not root:
        # If no MAINMONSTER found, check if we have top-level nodes
        if top_level_nodes:
            raise ValueError(f"No MAINMONSTER block found. Found top-level blocks: {[n.tag for n in top_level_nodes]}")
        raise ValueError("No MAINMONSTER block found in file")
    
    # If there are other top-level nodes (like GROUP), add them as siblings
    # But we return MAINMONSTER as the root for processing
    for node in top_level_nodes:
        if node != root and node.tag == 'GROUP':
            # GROUP should be a sibling, but for processing we'll add it to MAINMONSTER's parent
            # Actually, we'll process them separately, so just return MAINMONSTER
            pass
    
    return root


def process_inputdata_nodes(node: BlockNode, universal_tables: Dict[str, Dict], 
                            example_statblocks: Optional[Dict[str, str]] = None) -> None:
    """
    Walk the tree and process INPUTDATA nodes:
    - Extract tables and metadata from INPUTDATA
    - Generate VARIANT nodes for each age category
    - Add VARIANT nodes to their parent CATEGORY nodes
    
    Args:
        node: Current node in the tree
        universal_tables: Universal tables extracted from MAINMONSTER
        example_statblocks: Dictionary mapping variant names to example statblock content
    """
    if example_statblocks is None:
        example_statblocks = {}
    # Process children first (depth-first)
    for child in node.children[:]:  # Copy list since we may modify it
        process_inputdata_nodes(child, universal_tables, example_statblocks)
    
    # If this is a CATEGORY node, check for INPUTDATA children and generate variants
    if node.tag == 'CATEGORY':
        inputdata_nodes = node.find_children('INPUTDATA')
        if not inputdata_nodes:
            return
        
        # There should be exactly one INPUTDATA node per category
        inputdata_node = inputdata_nodes[0]
        
        # Extract category name (first line of category content)
        category_name = node.get_content_without_children().split('\n')[0].strip()
        
        # Parse metadata and tables from INPUTDATA
        category_metadata = parse_category_metadata_from_node(inputdata_node)
        stats_table, abilities_table = parse_category_tables_from_node(inputdata_node)
        
        if not stats_table or not abilities_table:
            logger.warning(f"    Missing tables for {category_name}, skipping variant generation")
            return
        
        # Extract breath weapon info from SA sections (outside INPUTDATA)
        breath_shape, breath_type = extract_breath_weapon_info_from_node(node)
        
        # Generate variants for each age
        # Track feats by age for cumulative progression
        previous_feats_by_age = {}  # age -> list of feat strings
        # Track skill ranks by age for progressive building
        previous_skill_ranks_by_age = {}  # age -> dict of skill_name -> ranks
        
        # Find the example age for this category (to know when to reach target ranks)
        example_age = None
        for example_name in example_statblocks.keys():
            if category_name.lower() in example_name.lower() or example_name.lower().endswith(category_name.lower()):
                # Extract age from example name (e.g., "Young Adult Black Dragon" -> "Young Adult")
                for age in AGE_CATEGORIES:
                    if age.lower() in example_name.lower():
                        example_age = age
                        break
                if example_age:
                    break
        
        # Extract category-specific class skills (once per category)
        category_class_skills = extract_category_class_skills(node)
        
        # Extract category skill priorities and target ranks from examples (once per category, not per variant)
        category_skill_priorities, target_skill_ranks = extract_category_skill_priorities(node, example_statblocks)
        
        # Track spell lists by age for cumulative progression
        previous_spell_lists_by_age = {}  # age -> dict of spell_level -> list of spells
        
        for age in AGE_CATEGORIES:
            stats_row = get_table_row_by_key(stats_table, 'Age', age)
            abilities_row = get_table_row_by_key(abilities_table, 'Age', age)
            
            if not stats_row or not abilities_row:
                # Debug: check what's in the tables
                if logger.isEnabledFor(logging.DEBUG):
                    logger.debug(f"      Debug for {category_name} {age}:")
                    logger.debug(f"        stats_table rows: {len(stats_table.get('rows', [])) if stats_table else 0}")
                    logger.debug(f"        abilities_table rows: {len(abilities_table.get('rows', [])) if abilities_table else 0}")
                    if stats_table and stats_table.get('rows'):
                        ages_in_stats = [r.get('Age', '') for r in stats_table['rows']]
                        logger.debug(f"        Ages in stats table: {ages_in_stats}")
                    if abilities_table and abilities_table.get('rows'):
                        ages_in_abilities = [r.get('Age', '') for r in abilities_table['rows']]
                        logger.debug(f"        Ages in abilities table: {ages_in_abilities}")
                logger.warning(f"      {category_name}: No stats or abilities row found for age: {age}, skipping variant.")
                continue
            
            # Get previous age's feats for cumulative progression
            age_index = AGE_CATEGORIES.index(age) if age in AGE_CATEGORIES else -1
            previous_feats = None
            if age_index > 0:
                # Find the most recent previous age that had feats
                for i in range(age_index - 1, -1, -1):
                    prev_age = AGE_CATEGORIES[i]
                    if prev_age in previous_feats_by_age:
                        prev_feats_str = previous_feats_by_age[prev_age]
                        if prev_feats_str:
                            previous_feats = [f.strip() for f in prev_feats_str.split(',')]
                            break
            
            # Get previous age's skill ranks for progressive building
            previous_skill_ranks = {}
            if age_index > 0:
                # Find the most recent previous age that had skill ranks
                for i in range(age_index - 1, -1, -1):
                    prev_age = AGE_CATEGORIES[i]
                    if prev_age in previous_skill_ranks_by_age:
                        previous_skill_ranks = previous_skill_ranks_by_age[prev_age].copy()
                        break
            
            # Convert both age and category name to Title Case
            age_title = to_title_case(age)
            category_name_title = to_title_case(category_name)
            variant_name = f"{age_title} {category_name_title}"
            
            statblock_text = generate_statblock(
                age, category_name_title, stats_row, abilities_row,
                universal_tables, category_metadata, breath_shape, breath_type,
                abilities_table, category_class_skills, previous_feats, category_name,  # Pass previous feats and category name
                category_skill_priorities, target_skill_ranks, previous_skill_ranks, example_age, age  # Pass current age
            )
            
            # Extract feats from generated statblock to track for next age
            feats_match = re.search(r'Feats:\s*(.+?)(?:\n|$)', statblock_text, re.MULTILINE)
            if feats_match:
                previous_feats_by_age[age] = feats_match.group(1).strip()
            
            # Extract skill ranks from generated statblock to track for next age
            skills_match = re.search(r'Skills:\s*(.+?)(?:\n|$)', statblock_text, re.MULTILINE)
            if skills_match:
                skills_text = skills_match.group(1).strip()
                # Get ability scores for reverse-calculating ranks from bonuses
                str_score = int(stats_row.get('Str', '0') or '0')
                dex_score = int(stats_row.get('Dex', '0') or '0')
                con_score = int(stats_row.get('Con', '0') or '0')
                int_score = int(stats_row.get('Int', '0') or '0')
                wis_score = int(stats_row.get('Wis', '0') or '0')
                cha_score = int(stats_row.get('Cha', '0') or '0')
                ability_scores = {
                    'Str': str_score, 'Dex': dex_score, 'Con': con_score,
                    'Int': int_score, 'Wis': wis_score, 'Cha': cha_score
                }
                # Get size for Hide skill size modifier
                size_abbr = stats_row.get('Size', '').strip()
                size_full = get_size_from_abbreviation(size_abbr)
                
                # Parse skill ranks from the skills text
                current_skill_ranks = parse_skill_ranks_from_text(skills_text, ability_scores, size_full)
                previous_skill_ranks_by_age[age] = current_skill_ranks
            
            # Create VARIANT node
            variant_node = BlockNode(tag='VARIANT', content=variant_name)
            
            # Add STATBLOCK child
            statblock_node = BlockNode(tag='STATBLOCK', content=statblock_text)
            variant_node.add_child(statblock_node)
            
            # Add age-specific SA sections (breath weapon, frightful presence)
            add_age_specific_sa_nodes(variant_node, age, stats_row, abilities_row, 
                                      breath_shape, breath_type, category_metadata, universal_tables)
            
            # Add appropriate SA blocks based on age, abilities, feats, and size
            # Pass spell-related parameters for "Typical Sorcerer Spells Known" generation
            add_variant_sa_blocks(variant_node, age, stats_row, abilities_row,
                                  inputdata_node, category_metadata, universal_tables,
                                  previous_spell_lists_by_age, category_name)
            
            # Add other category-level SA sections to each variant (from outside INPUTDATA)
            # Pass age so it can filter spell-like abilities
            add_category_sa_nodes_to_variant(variant_node, node, age)
            
            # Add variant to category
            node.add_child(variant_node)


def extract_category_class_skills(category_node: BlockNode) -> List[str]:
    """Extract category-specific class skills from SA blocks (including those inside INPUTDATA)."""
    class_skills = []
    
    def search_node(node: BlockNode):
        """Recursively search for SA blocks with class skills."""
        # Check direct children
        for child in node.children:
            if child.tag == 'SA':
                sa_content = child.content
                if 'skills' in sa_content.lower() and 'class skills' in sa_content.lower():
                    # Extract skills from pattern like "Skills: Hide, Move Silently, and Swim are considered class skills for black dragons."
                    skills_match = re.search(r'Skills:\s*([^.]+)', sa_content, re.IGNORECASE)
                    if skills_match:
                        skills_text = skills_match.group(1)
                        # Remove "are considered class skills for..." part
                        skills_text = re.sub(r'\s+are\s+considered\s+class\s+skills.*$', '', skills_text, flags=re.IGNORECASE)
                        # Split by comma and "and"
                        skills_list = re.split(r',\s*and\s+|\s+and\s+|,\s*', skills_text)
                        class_skills.extend([s.strip() for s in skills_list if s.strip()])
            # Recursively search children (including INPUTDATA)
            search_node(child)
    
    search_node(category_node)
    return class_skills


def get_ability_modifier(ability_score: int) -> int:
    """Calculate ability modifier from ability score."""
    return (ability_score - 10) // 2


def get_skill_key_ability(skill_name: str) -> str:
    """
    Return the key ability for a skill.
    Returns one of: 'Str', 'Dex', 'Con', 'Int', 'Wis', 'Cha'
    """
    skill_abilities = {
        # Strength-based
        'Climb': 'Str', 'Jump': 'Str', 'Swim': 'Str',
        # Dexterity-based
        'Balance': 'Dex', 'Escape Artist': 'Dex', 'Hide': 'Dex', 
        'Move Silently': 'Dex', 'Tumble': 'Dex',
        # Constitution-based
        'Concentration': 'Con',
        # Intelligence-based
        'Appraise': 'Int', 'Craft': 'Int', 'Knowledge': 'Int', 
        'Search': 'Int', 'Spellcraft': 'Int',
        # Wisdom-based
        'Heal': 'Wis', 'Listen': 'Wis', 'Sense Motive': 'Wis', 
        'Spot': 'Wis', 'Survival': 'Wis',
        # Charisma-based
        'Bluff': 'Cha', 'Diplomacy': 'Cha', 'Disguise': 'Cha',
        'Gather Information': 'Cha', 'Intimidate': 'Cha', 
        'Perform': 'Cha', 'Use Magic Device': 'Cha',
    }
    
    # Check for exact match first
    if skill_name in skill_abilities:
        return skill_abilities[skill_name]
    
    # Check for partial matches (e.g., "Knowledge (arcana)")
    for skill_key, ability in skill_abilities.items():
        if skill_name.startswith(skill_key):
            return ability
    
    # Default to Int for unknown skills
    return 'Int'


def parse_skill_ranks_from_text(skills_text: str, ability_scores: Dict[str, int], size_full: Optional[str] = None) -> Dict[str, int]:
    """
    Parse skill ranks from a skills text string.
    Returns a dictionary mapping skill names to their rank counts.
    Handles both "Skill +X" format and "Speak Language X ranks" format.
    
    Args:
        skills_text: Skills text from statblock (e.g., "Bluff +9, Climb +20, Speak Language 6 ranks")
        ability_scores: Dictionary of ability scores (Str, Dex, Con, Int, Wis, Cha)
        size_full: Full size name (e.g., "Medium", "Large") for Hide skill size modifier calculation
    """
    skill_ranks = {}
    
    # Split by comma and semicolon (skills can be separated by either)
    # First split by semicolon to handle cases like "Swim +20; Survival +37"
    parts = skills_text.split(';')
    all_skill_items = []
    for part in parts:
        # Then split each part by comma
        all_skill_items.extend(part.split(','))
    
    # Track seen skills to avoid duplicates (use the last value if duplicate)
    seen_skills = set()
    for skill_item in all_skill_items:
        skill_item = skill_item.strip()
        if not skill_item:
            continue
        
        # Check for "Speak Language X ranks" format
        language_match = re.search(r'Speak Language\s+(\d+)\s+ranks?', skill_item, re.IGNORECASE)
        if language_match:
            rank_count = int(language_match.group(1))
            skill_ranks['Speak Language'] = rank_count
            seen_skills.add('Speak Language')
            continue
        
        # Check for other skills with "X ranks" format
        ranks_match = re.search(r'(.+?)\s+(\d+)\s+ranks?', skill_item, re.IGNORECASE)
        if ranks_match:
            skill_name = ranks_match.group(1).strip()
            rank_count = int(ranks_match.group(2))
            # Only add if we haven't seen this skill before (or overwrite if duplicate)
            skill_ranks[skill_name] = rank_count
            seen_skills.add(skill_name)
            continue
        
        # Parse "Skill +X" or "Skill -X" format - extract skill name and reverse-calculate ranks from bonus
        # Format: "Bluff +9" or "Knowledge (arcana) +14" or "Hide -1"
        # Bonus = ranks + ability modifier, so ranks = bonus - ability_modifier
        # Handle malformed cases like "Hide -1 +4" by taking the LAST number as the total bonus
        # Find all numbers in the skill item
        all_numbers = re.findall(r'([+\-]?\d+)', skill_item)
        if all_numbers:
            # Use the last number as the total bonus (handles "Hide -1 +4" -> use +4)
            total_bonus_str = all_numbers[-1]
            # Extract skill name by removing all numbers and signs
            skill_name = re.sub(r'\s*[+\-]?\d+.*$', '', skill_item).strip()
            total_bonus = int(total_bonus_str)
        else:
            # Fallback to original regex if no numbers found
            skill_bonus_match = re.search(r'(.+?)\s*([+\-]?\d+)', skill_item)
            if skill_bonus_match:
                skill_name = skill_bonus_match.group(1).strip()
                total_bonus = int(skill_bonus_match.group(2))
            else:
                continue  # Skip this skill item if we can't parse it
        
            # Get key ability for this skill
            key_ability = get_skill_key_ability(skill_name)
            ability_mod = get_ability_modifier(ability_scores.get(key_ability, 10))
            
            # Calculate ranks: ranks = total_bonus - ability_modifier - size_modifier (for Hide)
            # For Hide skill, the total_bonus includes the size modifier, so we need to subtract it
            ranks = total_bonus - ability_mod
            if skill_name == 'Hide' and size_full:
                hide_size_mod = get_hide_size_modifier(size_full)
                ranks -= hide_size_mod
            
            if ranks >= 0:  # Only store non-negative ranks
                # Only add if we haven't seen this skill before (or overwrite if duplicate)
                skill_ranks[skill_name] = ranks
                seen_skills.add(skill_name)
    
    return skill_ranks


def calculate_skills(stats_row: Dict, abilities_row: Dict, category_class_skills: List[str], 
                     category_skill_priorities: Optional[List[str]] = None,
                     target_skill_ranks: Optional[Dict[str, int]] = None,
                     previous_skill_ranks: Optional[Dict[str, int]] = None,
                     example_age: Optional[str] = None,
                     current_age: Optional[str] = None,
                     size_full: Optional[str] = None) -> str:
    """
    Calculate skills based on formula: (6 + Int modifier, minimum 1) x (Hit Dice + 3)
    Most dragons max out Listen, Search, and Spot.
    Remaining points go to: Concentration, Diplomacy, Escape Artist, Intimidate, Knowledge skills, Sense Motive, Use Magic Device
    Plus category-specific class skills.
    
    Args:
        stats_row: Row from stats table
        abilities_row: Row from abilities table
        category_class_skills: Category-specific class skills
        category_skill_priorities: List of skills prioritized based on category examples
            (e.g., ['Bluff', 'Climb', 'Knowledge (arcana)']). Skills earlier in the list get priority.
            If None, uses default priorities.
    
    Returns formatted string like "Bluff +9, Climb +20, ..."
    """
    # Get ability scores
    str_val = stats_row.get('Str', '').strip()
    dex_val = stats_row.get('Dex', '').strip()
    con_val = stats_row.get('Con', '').strip()
    int_val = stats_row.get('Int', '').strip()
    wis_val = stats_row.get('Wis', '').strip()
    cha_val = stats_row.get('Cha', '').strip()
    
    try:
        str_score = int(str_val)
        dex_score = int(dex_val)
        con_score = int(con_val)
        int_score = int(int_val)
        wis_score = int(wis_val)
        cha_score = int(cha_val)
    except (ValueError, TypeError):
        return ''  # Can't calculate without ability scores
    
    ability_scores = {
        'Str': str_score, 'Dex': dex_score, 'Con': con_score,
        'Int': int_score, 'Wis': wis_score, 'Cha': cha_score
    }
    
    # Get Hit Dice number
    hd_text = stats_row.get('Hit Dice (hp)', '').strip()
    hd_num = 0
    if hd_text:
        hd_match = re.search(r'(\d+)d', hd_text)
        if hd_match:
            hd_num = int(hd_match.group(1))
    
    # Calculate skill points: (6 + Int modifier, minimum 1) x (Hit Dice + 3)
    int_mod = get_ability_modifier(int_score)
    skill_points_per_level = max(6 + int_mod, 1)
    total_skill_points = skill_points_per_level * (hd_num + 3)
    
    # Always-maxed skills for all dragons
    always_maxed_skills = ['Listen', 'Search', 'Spot']
    
    # Build class skills list based on category priorities (from examples)
    # Only include skills that are actually in the examples or are category-specific class skills
    all_class_skills = []
    
    # Always include the three maxed skills
    all_class_skills.extend(always_maxed_skills)
    
    # Add category-specific class skills
    all_class_skills.extend(category_class_skills)
    
    # Add skills from category priorities (examples)
    if category_skill_priorities:
        for skill in category_skill_priorities:
            if skill not in all_class_skills:
                all_class_skills.append(skill)
    
    # Remove duplicates while preserving order
    seen = set()
    all_class_skills = [s for s in all_class_skills if not (s in seen or seen.add(s))]
    
    # Target ranks from examples (these will consume skill points)
    if target_skill_ranks is None:
        target_skill_ranks = {}
    if previous_skill_ranks is None:
        previous_skill_ranks = {}
    
    # Start with previous skill ranks (progressive building)
    skills_dict = previous_skill_ranks.copy()
    ranks_used = sum(previous_skill_ranks.values())
    
    # Get current age to calculate progression
    if current_age is None:
        current_age = stats_row.get('Age', '').strip()
    age_index = AGE_CATEGORIES.index(current_age) if current_age in AGE_CATEGORIES else -1
    example_age_index = AGE_CATEGORIES.index(example_age) if example_age and example_age in AGE_CATEGORIES else -1
    
    # Max out Listen, Search, and Spot first (these are always maxed, progressive)
    max_ranks = hd_num + 3
    for skill in ['Listen', 'Search', 'Spot']:
        if skill in all_class_skills:
            # These are always maxed at current HD, so use max_ranks (not previous ranks)
            skills_dict[skill] = max_ranks
            # Adjust ranks_used - subtract previous ranks if they existed, add new max
            if skill in previous_skill_ranks:
                ranks_used -= previous_skill_ranks[skill]
            ranks_used += max_ranks
    
    # Distribute remaining points to other skills
    # Priority order based on typical dragon skill usage and category examples
    remaining_points = total_skill_points - ranks_used
    
    # Calculate how many skill points we've gained since previous age
    # This helps us allocate progressively toward target ranks
    if age_index > 0:
        prev_age = AGE_CATEGORIES[age_index - 1]
        prev_hd_text = stats_row.get('Hit Dice (hp)', '').strip()  # This won't work, we need previous age's HD
        # We'll calculate based on current total points minus what we've already used
    
    other_skills = [s for s in all_class_skills if s not in ['Listen', 'Search', 'Spot']]
    
    # Allocate to skills with target ranks from examples (progressive building)
    # Calculate how many ranks to add based on progression toward example age
    for skill in category_skill_priorities or []:
        if skill in other_skills and skill in target_skill_ranks:
            target_ranks = target_skill_ranks[skill]
            current_ranks = skills_dict.get(skill, 0)
            
            # Calculate how many ranks we should have by this age
            # If we're at or past the example age, we should have the target
            # Otherwise, build progressively
            if example_age_index >= 0 and age_index >= 0:
                if age_index >= example_age_index:
                    # We're at or past example age - should have target ranks
                    desired_ranks = target_ranks
                else:
                    # Build progressively: distribute target ranks across ages up to example
                    # Simple linear progression
                    progress = (age_index + 1) / (example_age_index + 1)
                    desired_ranks = int(target_ranks * progress)
            else:
                # No example age - just use target if we have points
                desired_ranks = target_ranks
            
            # Calculate how many ranks to add
            ranks_to_add = max(0, desired_ranks - current_ranks)
            
            # Allocate ranks if we have enough points
            if ranks_to_add > 0 and remaining_points >= ranks_to_add:
                skills_dict[skill] = current_ranks + ranks_to_add
                ranks_used += ranks_to_add
                remaining_points -= ranks_to_add
            elif ranks_to_add > 0 and remaining_points > 0:
                # Allocate what we can
                skills_dict[skill] = current_ranks + remaining_points
                ranks_used += remaining_points
                remaining_points = 0
    
    # Build priority list: use category priorities from examples
    # Skip skills that already have target ranks allocated
    if category_skill_priorities:
        # Use category priorities - these are the skills from examples, in priority order
        priority_skills = []
        for skill in category_skill_priorities:
            if skill in other_skills and skill not in skills_dict and skill not in priority_skills:
                priority_skills.append(skill)
    else:
        # Fallback: default priority skills if no examples available
        default_priorities = ['Intimidate', 'Move Silently', 'Climb', 'Swim', 'Hide', 'Concentration', 
                            'Diplomacy', 'Escape Artist', 'Sense Motive', 'Use Magic Device']
        priority_skills = [s for s in default_priorities if s in other_skills and s not in skills_dict]
    
    # Allocate to remaining priority skills
    # Try to allocate enough points to get meaningful bonuses
    for skill in priority_skills:
        if skill in other_skills and skill not in skills_dict and remaining_points > 0:
            # For category priority skills, allocate more points to ensure they appear
            # Calculate a reasonable allocation based on remaining points and number of remaining priority skills
            remaining_priority_count = len([s for s in priority_skills if s not in skills_dict])
            if remaining_priority_count > 0:
                # Allocate more evenly across priority skills
                base_allocation = remaining_points // remaining_priority_count
                # Ensure at least some points for each priority skill
                allocation = max(1, min(max_ranks, base_allocation))
            else:
                allocation = min(max_ranks, remaining_points)
            
            if allocation > 0 and remaining_points >= allocation:
                skills_dict[skill] = allocation
                ranks_used += allocation
                remaining_points -= allocation
    
    # Distribute remaining points to other skills
    remaining_other_skills = [s for s in other_skills if s not in priority_skills and s not in skills_dict]
    if remaining_other_skills and remaining_points > 0:
        # Distribute remaining points more evenly
        # Give each skill at least some points if we have enough
        points_per_skill = remaining_points // len(remaining_other_skills) if remaining_other_skills else 0
        extra_points = remaining_points % len(remaining_other_skills) if remaining_other_skills else 0
        
        for i, skill in enumerate(remaining_other_skills):
            if remaining_points <= 0:
                break
            # Give base allocation plus 1 extra point to first few skills if there's a remainder
            allocation = points_per_skill + (1 if i < extra_points else 0)
            allocation = min(allocation, remaining_points, max_ranks)
            if allocation > 0:
                skills_dict[skill] = allocation
                ranks_used += allocation
                remaining_points -= allocation
    
    # Add category-specific skills that weren't in the standard list
    for skill in category_class_skills:
        if skill not in skills_dict and skill not in ['Listen', 'Search', 'Spot']:
            # Allocate some points to category-specific skills
            if remaining_points > 0:
                allocation = min(remaining_points, max_ranks // 2)
                if allocation > 0:
                    skills_dict[skill] = allocation
                    ranks_used += allocation
                    remaining_points -= allocation
    
    # Format skills string with total bonus (ranks + ability modifier + size modifier for Hide)
    skills_parts = []
    for skill, ranks in sorted(skills_dict.items()):
        if ranks == 0:
            continue
        
        # Get key ability for this skill
        key_ability = get_skill_key_ability(skill)
        ability_mod = get_ability_modifier(ability_scores[key_ability])
        
        # Total bonus = ranks + ability modifier
        total_bonus = ranks + ability_mod
        
        # Add size modifier for Hide skill
        if skill == 'Hide' and size_full:
            hide_size_mod = get_hide_size_modifier(size_full)
            total_bonus += hide_size_mod
        
        # Handle special cases like "Speak Language 6 ranks"
        if 'Language' in skill or skill == 'Speak Language':
            skills_parts.append(f"{skill} {ranks} ranks")
        else:
            # Format with sign (positive or negative)
            sign = '+' if total_bonus >= 0 else ''
            skills_parts.append(f"{skill} {sign}{total_bonus}")
    
    return ', '.join(skills_parts) if skills_parts else ''


def get_category_feat_priorities(category_name: str) -> Dict[str, List[str]]:
    """
    Get category-specific feat priorities based on examples.
    Returns a dict with 'high', 'medium', 'lower', and 'special' priority lists.
    """
    category_lower = category_name.lower()
    
    # Default priorities (used if category not found)
    default_priorities = {
        'high': ['Flyby Attack', 'Power Attack', 'Improved Initiative', 'Multiattack'],
        'medium': ['Hover', 'Alertness', 'Combat Expertise'],
        'lower': ['Wingover', 'Cleave', 'Snatch', 'Improved Natural Attack (bite)', 
                 'Weapon Focus (bite)', 'Improved Natural Armor', 'Blind-Fight', 'Improved Sunder'],
        'special': []
    }
    
    # Black Dragon: Improved Natural Armor, Multiattack, Power Attack, Snatch, Weapon Focus (bite), Wingover
    if 'black' in category_lower:
        return {
            'high': ['Wingover', 'Power Attack', 'Multiattack'],
            'medium': ['Improved Natural Armor', 'Snatch', 'Weapon Focus (bite)'],
            'lower': ['Flyby Attack', 'Improved Initiative', 'Hover', 'Alertness', 'Cleave',
                     'Improved Natural Attack (bite)', 'Blind-Fight', 'Improved Sunder'],
            'special': []
        }
    
    # Blue Dragon: Alertness, Combat Expertise, Eschew Materials, Flyby Attack, Hover, Improved Initiative, Multiattack, Power Attack, Ability Focus (frightful presence)
    if 'blue' in category_lower:
        return {
            'high': ['Flyby Attack', 'Power Attack', 'Improved Initiative', 'Multiattack'],
            'medium': ['Hover', 'Alertness', 'Combat Expertise'],
            'lower': ['Wingover', 'Cleave', 'Snatch', 'Improved Natural Attack (bite)',
                     'Weapon Focus (bite)', 'Improved Natural Armor', 'Blind-Fight', 'Improved Sunder'],
            'special': ['Eschew Materials', 'Ability Focus (frightful presence)']
        }
    
    # Green Dragon: Alertness, Cleave, Flyby Attack, Hover, Improved Natural Attack (bite), Power Attack, Wingover
    if 'green' in category_lower:
        return {
            'high': ['Flyby Attack', 'Power Attack', 'Wingover'],
            'medium': ['Hover', 'Alertness', 'Cleave', 'Improved Natural Attack (bite)'],
            'lower': ['Improved Initiative', 'Multiattack', 'Snatch', 'Weapon Focus (bite)',
                     'Improved Natural Armor', 'Blind-Fight', 'Improved Sunder'],
            'special': []
        }
    
    # Red Dragon: Awesome Blow, Flyby Attack, Cleave, Great Cleave, Improved Bull Rush, Improved Initiative, Iron Will, Lightning Reflexes, Power Attack, Snatch, Wingover
    if 'red' in category_lower:
        return {
            'high': ['Flyby Attack', 'Power Attack', 'Improved Initiative', 'Wingover'],
            'medium': ['Cleave', 'Snatch', 'Great Cleave'],
            'lower': ['Multiattack', 'Hover', 'Alertness', 'Improved Natural Attack (bite)',
                     'Weapon Focus (bite)', 'Improved Natural Armor', 'Blind-Fight', 'Improved Sunder'],
            'special': ['Awesome Blow', 'Improved Bull Rush', 'Iron Will', 'Lightning Reflexes']
        }
    
    # White Dragon: Flyby Attack, Improved Initiative, Improved Natural Attack (bite), Wingover
    if 'white' in category_lower:
        return {
            'high': ['Flyby Attack', 'Improved Initiative', 'Wingover'],
            'medium': ['Improved Natural Attack (bite)'],
            'lower': ['Power Attack', 'Multiattack', 'Hover', 'Alertness', 'Cleave', 'Snatch',
                     'Weapon Focus (bite)', 'Improved Natural Armor', 'Blind-Fight', 'Improved Sunder'],
            'special': []
        }
    
    # Brass Dragon: Flyby Attack, Improved Initiative
    if 'brass' in category_lower:
        return {
            'high': ['Flyby Attack', 'Improved Initiative'],
            'medium': ['Wingover', 'Multiattack', 'Hover'],
            'lower': ['Power Attack', 'Alertness', 'Cleave', 'Snatch', 'Improved Natural Attack (bite)',
                     'Weapon Focus (bite)', 'Improved Natural Armor', 'Blind-Fight', 'Improved Sunder'],
            'special': []
        }
    
    # Bronze Dragon: Flyby Attack, Hover, Improved Initiative, Multiattack, Weapon Focus (claw), Wingover
    if 'bronze' in category_lower:
        return {
            'high': ['Flyby Attack', 'Improved Initiative', 'Multiattack', 'Wingover'],
            'medium': ['Hover', 'Weapon Focus (claw)'],
            'lower': ['Power Attack', 'Alertness', 'Cleave', 'Snatch', 'Improved Natural Attack (bite)',
                     'Weapon Focus (bite)', 'Improved Natural Armor', 'Blind-Fight', 'Improved Sunder'],
            'special': []
        }
    
    # Copper Dragon: Combat Expertise, Hover, Multiattack, Wingover
    if 'copper' in category_lower:
        return {
            'high': ['Wingover', 'Multiattack', 'Hover'],
            'medium': ['Combat Expertise'],
            'lower': ['Flyby Attack', 'Power Attack', 'Improved Initiative', 'Alertness', 'Cleave', 'Snatch',
                     'Improved Natural Attack (bite)', 'Weapon Focus (bite)', 'Improved Natural Armor',
                     'Blind-Fight', 'Improved Sunder'],
            'special': []
        }
    
    # Gold Dragon: Alertness, Flyby Attack, Improved Initiative, Leadership, Negotiator, Power Attack, Stealthy, Wingover
    if 'gold' in category_lower:
        return {
            'high': ['Flyby Attack', 'Power Attack', 'Improved Initiative', 'Wingover'],
            'medium': ['Alertness'],
            'lower': ['Multiattack', 'Hover', 'Cleave', 'Snatch', 'Improved Natural Attack (bite)',
                     'Weapon Focus (bite)', 'Improved Natural Armor', 'Blind-Fight', 'Improved Sunder'],
            'special': ['Leadership', 'Negotiator', 'Stealthy']
        }
    
    # Silver Dragon: Acrobatic, Combat Casting, Flyby Attack, Improved Natural Armor, Persuasive, Toughness, Wingover
    if 'silver' in category_lower:
        return {
            'high': ['Flyby Attack', 'Wingover', 'Improved Natural Armor'],
            'medium': ['Combat Casting'],
            'lower': ['Power Attack', 'Improved Initiative', 'Multiattack', 'Hover', 'Alertness', 'Cleave',
                     'Snatch', 'Improved Natural Attack (bite)', 'Weapon Focus (bite)', 'Blind-Fight', 'Improved Sunder'],
            'special': ['Acrobatic', 'Persuasive', 'Toughness']
        }
    
    # Default (fallback)
    return default_priorities


def calculate_feats(stats_row: Dict, size_abbr: str = '', abilities_row: Optional[Dict] = None, 
                   previous_feats: Optional[List[str]] = None, category_name: str = '') -> str:
    """
    Calculate feats: 1 feat + 1 feat per 3 Hit Dice.
    Dragons favor: Alertness, Blind-Fight, Cleave, Flyby Attack, Hover, 
    Improved Initiative, Improved Sunder, Power Attack, Snatch, 
    Weapon Focus (claw or bite), Wingover, and metamagic feats.
    
    Feats are cumulative by age - each age inherits all feats from previous ages
    and only adds new ones if HD increased enough to grant another feat slot.
    
    Args:
        stats_row: Row from stats table
        size_abbr: Size abbreviation (for determining if certain feats are available)
        abilities_row: Row from abilities table (for checking caster level)
        previous_feats: List of feats from the previous age category (for cumulative progression)
    """
    # Get Hit Dice number
    hd_text = stats_row.get('Hit Dice (hp)', '').strip()
    hd_num = 0
    if hd_text:
        hd_match = re.search(r'(\d+)d', hd_text)
        if hd_match:
            hd_num = int(hd_match.group(1))
    
    # Calculate number of feats: 1 + (HD / 3)
    num_feats = 1 + (hd_num // 3)
    
    # Start with previous feats if provided (cumulative progression)
    selected_feats = []
    if previous_feats:
        selected_feats = previous_feats.copy()
    
    # If we already have enough feats, return them
    if len(selected_feats) >= num_feats:
        return ', '.join(selected_feats[:num_feats])
    
    # Calculate how many new feats we need
    new_feats_needed = num_feats - len(selected_feats)
    
    # Get category-specific feat priorities
    priorities = get_category_feat_priorities(category_name)
    high_priority_feats = priorities['high']
    medium_priority_feats = priorities['medium']
    lower_priority_feats = priorities['lower']
    special_feats = priorities['special']
    
    # Add high-priority feats first (only if not already present)
    for feat in high_priority_feats:
        if feat not in selected_feats and len(selected_feats) < num_feats:
            selected_feats.append(feat)
    
    # Add medium-priority feats (only if not already present)
    for feat in medium_priority_feats:
        if feat not in selected_feats and len(selected_feats) < num_feats:
            selected_feats.append(feat)
    
    # Add category-specific special feats BEFORE conditional special feats
    # This ensures feats like Iron Will and Lightning Reflexes get priority
    for feat in special_feats:
        if feat not in selected_feats and len(selected_feats) < num_feats:
            selected_feats.append(feat)
    
    # Add special feats based on conditions (after category-specific special feats)
    # For older dragons (Mature Adult+), add Ability Focus (frightful presence) if they have frightful presence
    if 'Ability Focus (frightful presence)' not in selected_feats and len(selected_feats) < num_feats and hd_num >= 24:  # Mature Adult or older
        selected_feats.append('Ability Focus (frightful presence)')
    
    # For spellcasters (with caster level), add Eschew Materials
    # Check if caster level exists in abilities_row (values like "1st", "3rd", "5th" or "--")
    has_caster_level = False
    if abilities_row:
        # Try different possible column names
        caster_level = (abilities_row.get('Caster Level', '') or 
                       abilities_row.get('Caster', '') or
                       abilities_row.get('Caster level', '')).strip()
        has_caster_level = caster_level and caster_level != '--' and caster_level.lower() != 'none'
    
    if 'Eschew Materials' not in selected_feats and len(selected_feats) < num_feats and has_caster_level:
        selected_feats.append('Eschew Materials')
    
    # Add lower-priority feats
    for feat in lower_priority_feats:
        if feat not in selected_feats and len(selected_feats) < num_feats:
            selected_feats.append(feat)
    
    # If still need more feats, cycle through all feats (avoid duplicates)
    all_feats = high_priority_feats + medium_priority_feats + lower_priority_feats + special_feats + ['Ability Focus (frightful presence)', 'Eschew Materials']
    iterations = 0
    max_iterations = new_feats_needed * 2
    while len(selected_feats) < num_feats and iterations < max_iterations:
        iterations += 1
        for feat in all_feats:
            if feat not in selected_feats and len(selected_feats) < num_feats:
                selected_feats.append(feat)
                break
    
    return ', '.join(selected_feats) if selected_feats else ''


def parse_category_metadata_from_node(inputdata_node: BlockNode) -> Dict[str, Any]:
    """Parse category-level metadata from INPUTDATA node."""
    metadata = {}
    inputdata_content = inputdata_node.content
    
    # Extract Type
    type_match = re.search(r'^Type:\s*(.+)$', inputdata_content, re.MULTILINE | re.IGNORECASE)
    if type_match:
        metadata['type'] = type_match.group(1).strip()
    
    # Extract Environment
    env_match = re.search(r'^Environment:\s*(.+)$', inputdata_content, re.MULTILINE | re.IGNORECASE)
    if env_match:
        metadata['environment'] = env_match.group(1).strip()
    
    # Extract Organization (multi-value)
    # Stop at next field that starts with capital letter or at block tags
    org_match = re.search(r'^Organization:\s*(.+?)(?=\n[A-Z][a-z]+:|$|\n\{)', inputdata_content, re.MULTILINE | re.IGNORECASE | re.DOTALL)
    if org_match:
        org_text = org_match.group(1).strip()
        metadata['organization'] = parse_multi_value_field(org_text, 'Organization')
    
    # Extract Challenge Rating (multi-value)
    cr_match = re.search(r'^Challenge Rating[s]?:\s*(.+)$', inputdata_content, re.MULTILINE | re.IGNORECASE)
    if cr_match:
        cr_text = cr_match.group(1).strip()
        metadata['challenge_rating'] = parse_multi_value_field(cr_text, 'Challenge Rating')
    
    # Extract Treasure
    # Handle both formats: "Treasure: value" on its own line, or "Treasure: value Alignment: value" on same line
    treasure_match = re.search(r'^Treasure:\s*(.+?)(?:\s+Alignment:|$)', inputdata_content, re.MULTILINE | re.IGNORECASE)
    if treasure_match:
        metadata['treasure'] = treasure_match.group(1).strip()
    
    # Extract Alignment
    # Handle both formats: "Alignment: value" on its own line, or inline after Treasure
    align_match = re.search(r'Alignment:\s*(.+?)(?:\n|$)', inputdata_content, re.IGNORECASE)
    if align_match:
        metadata['alignment'] = align_match.group(1).strip()
    
    # Extract Advancement (multi-value)
    adv_match = re.search(r'^Advancement:\s*(.+)$', inputdata_content, re.MULTILINE | re.IGNORECASE)
    if adv_match:
        adv_text = adv_match.group(1).strip()
        metadata['advancement'] = parse_multi_value_field(adv_text, 'Advancement')
    
    # Extract Level Adjustment (multi-value)
    la_match = re.search(r'^Level Adjustment:\s*(.+)$', inputdata_content, re.MULTILINE | re.IGNORECASE)
    if la_match:
        la_text = la_match.group(1).strip()
        metadata['level_adjustment'] = parse_multi_value_field(la_text, 'Level Adjustment')
    
    # Extract Skills (category-level, not an SA node)
    skills_match = re.search(r'^Skills:\s*(.+?)(?=\n[A-Z][a-z]+:|$|\n\{)', inputdata_content, re.MULTILINE | re.IGNORECASE | re.DOTALL)
    if skills_match:
        metadata['skills'] = skills_match.group(1).strip()
    
    # Extract Spell-Like Abilities (category-level, not an SA node)
    spell_like_match = re.search(r'^Spell-Like Abilities:\s*(.+?)(?=\n[A-Z][a-z]+:|$|\n\{)', inputdata_content, re.MULTILINE | re.IGNORECASE | re.DOTALL)
    if spell_like_match:
        metadata['spell_like_abilities'] = spell_like_match.group(1).strip()
    
    return metadata


def parse_category_tables_from_node(inputdata_node: BlockNode) -> Tuple[Optional[Dict], Optional[Dict]]:
    """Parse the two category tables from INPUTDATA node."""
    table_nodes = inputdata_node.find_children('TABLE')
    
    stats_table = None
    abilities_table = None
    
    for table_node in table_nodes:
        table = parse_table_from_tagged_section(table_node.content)
        if table:
            table_name = table['name']
            if 'by Age' in table_name and 'Abilities' in table_name:
                abilities_table = table
            elif 'by Age' in table_name:
                stats_table = table
    
    return stats_table, abilities_table


def extract_breath_weapon_info_from_node(category_node: BlockNode) -> Tuple[str, str]:
    """Extract breath weapon shape and type from category SA sections (outside INPUTDATA)."""
    # Get SA nodes that are NOT inside INPUTDATA
    sa_nodes = []
    for child in category_node.children:
        if child.tag == 'SA':
            sa_nodes.append(child)
        elif child.tag != 'INPUTDATA':
            # Recursively check children (but skip INPUTDATA)
            for sa_descendant in child.find_descendants('SA'):
                # Check if this SA is inside INPUTDATA
                parent = sa_descendant.parent
                is_in_inputdata = False
                while parent:
                    if parent.tag == 'INPUTDATA':
                        is_in_inputdata = True
                        break
                    parent = parent.parent
                
                if not is_in_inputdata:
                    sa_nodes.append(sa_descendant)
    
    shape = 'line'  # Default
    damage_type = ''  # Default
    
    for sa_node in sa_nodes:
        sa_content = sa_node.content
        if 'breath weapon' in sa_content.lower():
            if 'line' in sa_content.lower():
                shape = 'line'
            elif 'cone' in sa_content.lower():
                shape = 'cone'
            
            # Extract damage type
            damage_types = ['acid', 'fire', 'cold', 'electricity', 'lightning']
            for dt in damage_types:
                if dt in sa_content.lower():
                    damage_type = dt
                    break
    
    return shape, damage_type


def add_age_specific_sa_nodes(variant_node: BlockNode, age: str, stats_row: Dict, 
                               abilities_row: Dict, breath_shape: str, breath_type: str,
                               category_metadata: Dict, universal_tables: Dict[str, Dict]) -> None:
    """Add age-specific SA nodes (breath weapon, frightful presence) to variant."""
    # Breath weapon SA
    breath_dc_text = stats_row.get('Breath Weapon (DC)', '').strip()
    if breath_dc_text and breath_dc_text != '--':
        # Extract DC from text like "2d4 (13)"
        breath_dc_match = re.search(r'\((\d+)\)', breath_dc_text)
        breath_dc = breath_dc_match.group(1) if breath_dc_match else ""
        breath_damage = re.sub(r'\s*\(\d+\)', '', breath_dc_text).strip()
        
        # Get breath weapon dimensions from universal table
        size_abbr = stats_row.get('Size', '').strip()
        breath_table = universal_tables.get('Dragon Breath Weapons')
        if breath_shape.lower() == 'line':
            breath_dim = get_table_value_by_size(breath_table, size_abbr, 'Line* (Length)') or '30 ft.'
        else:
            breath_dim = get_table_value_by_size(breath_table, size_abbr, 'Cone** (Length)') or '15 ft.'
        
        breath_type_str = f" {breath_type}" if breath_type else ""
        breath_description = f"{breath_dim} {breath_shape}, damage {breath_damage}{breath_type_str}, Reflex DC {breath_dc} half."
        breath_text = format_sa_block("Breath Weapon", "Su", breath_description, age)
        
        sa_node = BlockNode(tag='SA', content=breath_text)
        variant_node.add_child(sa_node)
    
    # Frightful Presence SA
    fp_dc = stats_row.get('Frightful Presence DC', '').strip()
    if fp_dc and fp_dc != '--':
        age_num = AGE_CATEGORY_NUMBERS.get(age, 1)
        fp_radius = 30 * age_num
        # Parse HD to get the number
        hd_text = (stats_row.get('Hit Dice (hp)', '') or '0').strip()
        hd_clean = hd_text.replace(' ', '').split('d')[0]
        try:
            hd_num = int(hd_clean) - 1
        except ValueError:
            hd_num = 0
        fp_description = f"{fp_radius}-ft. radius, HD {hd_num} or less, Will DC {fp_dc} negates."
        fp_text = format_sa_block("Frightful Presence", "Ex", fp_description, age)
        sa_node = BlockNode(tag='SA', content=fp_text)
        variant_node.add_child(sa_node)


def extract_sa_templates_from_inputdata(inputdata_node: BlockNode) -> Dict[str, str]:
    """
    Extract SA block templates from INPUTDATA node.
    Returns a dictionary mapping ability names/keys to SA block content.
    If there are duplicates (header vs full description), prefer the one with more content.
    Excludes SA blocks that are inside EXAMPLE nodes.
    """
    sa_templates = {}
    
    def search_node(node: BlockNode):
        """Recursively search for SA blocks, but skip EXAMPLE nodes."""
        for child in node.children:
            # Skip EXAMPLE nodes - they contain example SA blocks, not templates
            if child.tag == 'EXAMPLE':
                continue
            if child.tag == 'SA':
                content = child.content.strip()
                # Extract key from content (first line or ability name)
                first_line = content.split('\n')[0].strip()
                # Remove trailing colon
                key = first_line.rstrip(':').strip()
                # Remove parenthetical markers for key matching
                key_normalized = re.sub(r'\s*\([^)]+\)\s*$', '', key).lower()
                
                # If we already have this template, prefer the one with more content
                if key_normalized in sa_templates:
                    existing_content = sa_templates[key_normalized]
                    if len(content) > len(existing_content):
                        sa_templates[key_normalized] = content
                else:
                    sa_templates[key_normalized] = content
            else:
                search_node(child)
    
    search_node(inputdata_node)
    return sa_templates


def get_cumulative_abilities_for_age(age: str, abilities_table: Dict) -> List[str]:
    """
    Get all cumulative abilities for a given age by checking all previous ages.
    """
    age_index = AGE_CATEGORIES.index(age) if age in AGE_CATEGORIES else -1
    if age_index < 0:
        return []
    
    all_abilities = []
    # Check all ages up to and including the current age
    for i in range(age_index + 1):
        check_age = AGE_CATEGORIES[i]
        row = get_table_row_by_key(abilities_table, 'Age', check_age)
        if row:
            abilities_text = row.get('Special Abilities', '').strip()
            if abilities_text:
                # Split and add unique abilities
                for ability in abilities_text.split(','):
                    ability = ability.strip()
                    if ability and ability not in all_abilities:
                        all_abilities.append(ability)
    
    return all_abilities


def check_age_requirement(age: str, requirement: str) -> bool:
    """
    Check if the given age meets the requirement.
    Requirements like "juvenile or older", "adult or older", etc.
    """
    age_index = AGE_CATEGORIES.index(age) if age in AGE_CATEGORIES else -1
    if age_index < 0:
        return False
    
    requirement_lower = requirement.lower()
    
    if 'juvenile or older' in requirement_lower:
        return age_index >= AGE_CATEGORIES.index('Juvenile')
    if 'young adult or older' in requirement_lower:
        return age_index >= AGE_CATEGORIES.index('Young adult')
    if 'adult or older' in requirement_lower:
        return age_index >= AGE_CATEGORIES.index('Adult')
    if 'mature adult or older' in requirement_lower:
        return age_index >= AGE_CATEGORIES.index('Mature adult')
    if 'old or older' in requirement_lower:
        return age_index >= AGE_CATEGORIES.index('Old')
    if 'very old or older' in requirement_lower:
        return age_index >= AGE_CATEGORIES.index('Very old')
    if 'ancient or older' in requirement_lower:
        return age_index >= AGE_CATEGORIES.index('Ancient')
    if 'wyrm or older' in requirement_lower:
        return age_index >= AGE_CATEGORIES.index('Wyrm')
    if 'great wyrm' in requirement_lower:
        return age == 'Great wyrm'
    
    return True  # Default to true if no specific requirement


def add_variant_sa_blocks(variant_node: BlockNode, age: str, stats_row: Dict, 
                          abilities_row: Dict, inputdata_node: BlockNode,
                          category_metadata: Dict, universal_tables: Dict[str, Dict],
                          previous_spell_lists_by_age: Optional[Dict[str, Dict[str, List[str]]]] = None,
                          category_name: str = '') -> None:
    """
    Add all appropriate SA blocks for a variant based on:
    - Cumulative abilities from the Abilities By Age table
    - Spell-like abilities with age requirements
    - Feats (like Snatch)
    - Size-based abilities (Crush, Tail Sweep)
    """
    # Extract SA templates from INPUTDATA
    sa_templates = extract_sa_templates_from_inputdata(inputdata_node)
    
    # Get cumulative abilities for this age
    # We already have inputdata_node passed in, so use it directly
    _, abilities_table = parse_category_tables_from_node(inputdata_node)
    
    if not abilities_table:
        logger.debug(f"      No abilities table found for variant")
        return
    
    cumulative_abilities = get_cumulative_abilities_for_age(age, abilities_table)
    logger.debug(f"      Cumulative abilities for {age}: {cumulative_abilities}")
    
    # Get size abbreviation
    size_abbr = stats_row.get('Size', '').strip()
    size_full = get_size_from_abbreviation(size_abbr)
    
    # Get feats from statblock (we need to parse it or calculate it)
    # For now, let's calculate feats to check for Snatch
    # Note: This is called during SA block generation, so we don't have previous_feats here
    # We'll calculate independently for this check
    feats_text = calculate_feats(stats_row, size_abbr, abilities_row, None)
    has_snatch = 'Snatch' in feats_text
    
    # Get age index for spell-like ability checks
    age_index = AGE_CATEGORIES.index(age) if age in AGE_CATEGORIES else -1
    
    # Add SA blocks based on cumulative abilities
    for ability in cumulative_abilities:
        ability_lower = ability.lower().strip().strip()
        
        # Skip generic abilities that are handled elsewhere
        if any(skip in ability_lower for skip in ['immunity', 'damage reduction', 'dr ', 'caster level', 'sr']):
            continue
        
        # Try to find matching SA template
        # Match by key words in ability name
        # Note: sa_templates keys are already normalized (lowercase, no parenthetical markers)
        matched_template = None
        matched_template_key = None
        for template_key_normalized, template_content in sa_templates.items():
            # Check if ability name matches template key
            if ability_lower in template_key_normalized or template_key_normalized in ability_lower:
                # Skip "Spell-Like Abilities" or "Other Spell-Like Abilities" - we'll handle that separately (it contains age requirements)
                if 'spell-like abilities' in template_key_normalized:
                    continue
                # Check age requirements for spell-like abilities
                if 'spell-like' in template_content.lower() or '(sp)' in template_content.lower():
                    # Check age requirement in template
                    age_req_match = re.search(r'\(([^)]+)\)', template_content)
                    if age_req_match:
                        age_req = age_req_match.group(1)
                        if not check_age_requirement(age, age_req):
                            continue
                matched_template = template_content
                matched_template_key = template_key_normalized
                break
        
        # If no exact match, check if it's a spell-like ability that should be in "Other Spell-Like Abilities"
        if not matched_template:
            # For abilities like "darkness", "plant growth", "insect plague", etc.
            # These are usually in "Other Spell-Like Abilities" block
            # We'll handle them in the "Other Spell-Like Abilities" section, so skip here
            if ability_lower in ['darkness', 'plant growth', 'insect plague', 'charm reptiles']:
                continue
        
        if matched_template:
            # Templates are for formatting only - they should already be properly formatted
            # Format: "Water Breathing (Ex):\n    description" (name on first line, description on next line indented 4 spaces)
            # Check if template is already formatted (has newline and indentation)
            if '\n' in matched_template and '    ' in matched_template:
                # Already formatted, but still need to process age-specific text
                # Extract the description part (everything after the first line)
                lines = matched_template.split('\n')
                first_line = lines[0]
                description_lines = lines[1:] if len(lines) > 1 else []
                # Join description lines, process as a whole, then split back
                description_text = '\n'.join(description_lines)
                processed_description_text = process_age_specific_text(description_text, age)
                # Reconstruct the formatted content
                sa_content = first_line + '\n' + processed_description_text if processed_description_text else matched_template
            else:
                # Need to format it - extract name, type, and description
                # Format: "Water Breathing (Ex): description" or "Water Breathing: description"
                first_line = matched_template.split('\n')[0].strip()
                # Extract name and type
                name_type_match = re.match(r'^([^(]+)(?:\(([^)]+)\))?\s*:\s*(.+)', first_line)
                if name_type_match:
                    ability_name = name_type_match.group(1).strip()
                    ability_type = name_type_match.group(2).strip() if name_type_match.group(2) else ""
                    description = name_type_match.group(3).strip()
                    # Get rest of description if there are more lines
                    if '\n' in matched_template:
                        description += '\n' + '\n'.join(matched_template.split('\n')[1:])
                    sa_content = format_sa_block(ability_name, ability_type, description, age)
                else:
                    # Fallback: use as-is
                    sa_content = matched_template
            
            sa_node = BlockNode(tag='SA', content=sa_content)
            variant_node.add_child(sa_node)
            logger.debug(f"      Added SA block for '{ability}': {matched_template_key}")
        else:
            # Debug: log why ability wasn't added
            if ability_lower not in ['darkness', 'plant growth', 'insect plague', 'charm reptiles']:
                logger.debug(f"      No SA template matched for '{ability}'")
    
    # Add Spells SA block if caster level is present
    caster_level = abilities_row.get('Caster Level', '').strip()
    if caster_level and caster_level != '--':
        # Look for Spells template
        spells_template = None
        for template_key, template_content in sa_templates.items():
            if 'spells' in template_key.lower() and 'typical' not in template_key.lower():
                spells_template = template_content
                break
        
        if spells_template:
            sa_node = BlockNode(tag='SA', content=spells_template)
            variant_node.add_child(sa_node)
        else:
            # Create a simple spells SA block
            spells_description = f"As {caster_level}-level sorcerer."
            spells_text = format_sa_block("Spells", "", spells_description, age)
            sa_node = BlockNode(tag='SA', content=spells_text)
            variant_node.add_child(sa_node)
        
        # Add "Typical Sorcerer Spells Known" PREPEDSPELLS block immediately after Spells block
        if previous_spell_lists_by_age is not None:
            caster_level_int = parse_caster_level(caster_level)
            if caster_level_int > 0:
                # Get previous age's spell list for cumulative progression
                age_index = AGE_CATEGORIES.index(age) if age in AGE_CATEGORIES else -1
                previous_spells = None
                if age_index > 0:
                    for i in range(age_index - 1, -1, -1):
                        prev_age = AGE_CATEGORIES[i]
                        if prev_age in previous_spell_lists_by_age:
                            previous_spells = previous_spell_lists_by_age[prev_age]
                            break
                
                # Extract spell-like abilities for this age (to exclude from sorcerer spells)
                spell_like_abilities = []
                spell_like_abilities_text = category_metadata.get('spell_like_abilities', '').strip()
                if spell_like_abilities_text:
                    # Parse spell-like abilities that are available at this age
                    template_clean = spell_like_abilities_text.rstrip('.').strip()
                    parts = []
                    current_part = ""
                    paren_depth = 0
                    for char in template_clean:
                        if char == '(':
                            paren_depth += 1
                            current_part += char
                        elif char == ')':
                            paren_depth -= 1
                            current_part += char
                        elif char == ';' and paren_depth == 0:
                            if current_part.strip():
                                parts.append(current_part.strip())
                            current_part = ""
                        else:
                            current_part += char
                    if current_part.strip():
                        parts.append(current_part.strip())
                    
                    for part in parts:
                        part = part.strip()
                        if not part:
                            continue
                        freq_match = re.match(r'(\d+/day|At will)--(.+)', part, re.IGNORECASE)
                        if freq_match:
                            abilities_text_part = freq_match.group(2)
                            ability_parts = []
                            current_ability = ""
                            paren_depth = 0
                            for char in abilities_text_part:
                                if char == '(':
                                    paren_depth += 1
                                    current_ability += char
                                elif char == ')':
                                    paren_depth -= 1
                                    current_ability += char
                                elif char == ',' and paren_depth == 0:
                                    if current_ability.strip():
                                        ability_parts.append(current_ability.strip())
                                    current_ability = ""
                                else:
                                    current_ability += char
                            if current_ability.strip():
                                ability_parts.append(current_ability.strip())
                            
                            for ability_part in ability_parts:
                                if not ability_part:
                                    continue
                                ability_match = re.match(r'([^(]+)\(([^)]+)\)', ability_part)
                                if ability_match:
                                    ability_name = ability_match.group(1).strip()
                                    details = ability_match.group(2)
                                    if check_age_requirement(age, details.lower()):
                                        spell_like_abilities.append(ability_name)
                
                # Generate spell list using pattern-based approach (always generate, never copy from examples)
                alignment = category_metadata.get('alignment', '').strip()
                cha_score = int(stats_row.get('Cha', '0') or '0')
                
                # Generate new spells for this caster level
                # Note: generate_spell_list_by_pattern already handles previous_spells filtering internally
                spell_list = generate_spell_list_by_pattern(
                    caster_level_int, alignment, category_name, cha_score, 
                    spell_like_abilities, previous_spells
                )
                
                # Filter out any spells that are available as spell-like abilities
                if spell_list and spell_like_abilities:
                    sla_lower = [sla.lower() for sla in spell_like_abilities]
                    for level in spell_list:
                        spell_list[level] = [s for s in spell_list[level] 
                                           if s.lower() not in sla_lower]
                
                # Format and add PREPEDSPELLS block
                if spell_list:
                    cha_score = int(stats_row.get('Cha', '0') or '0')
                    spells_text = format_typical_sorcerer_spells_known(spell_list, caster_level_int, cha_score)
                    spells_preped_node = BlockNode(tag='PREPEDSPELLS', content=spells_text)
                    variant_node.add_child(spells_preped_node)
                    
                    # Store spell list for next age
                    previous_spell_lists_by_age[age] = spell_list
    
    # Handle "Spell-Like Abilities" block (from category metadata, not SA templates)
    # This is now at the CATEGORY level in INPUTDATA content, not as an SA node
    spell_like_abilities_text = category_metadata.get('spell_like_abilities', '').strip()
    
    if spell_like_abilities_text:
        # Parse the text to extract abilities with age requirements
        # Format: "3/day--suggestion(adult or older),dominate person(ancient or older); 1/day--plant growth(old or older),command plants(great wyrm)."
        
        # Remove trailing period if present
        template_clean = spell_like_abilities_text.rstrip('.').strip()
        
        # Parse and filter by age, then reconstruct the block
        filtered_parts = []
        
        # Split by semicolon
        parts = []
        current_part = ""
        paren_depth = 0
        for char in template_clean:
            if char == '(':
                paren_depth += 1
                current_part += char
            elif char == ')':
                paren_depth -= 1
                current_part += char
            elif char == ';' and paren_depth == 0:
                if current_part.strip():
                    parts.append(current_part.strip())
                current_part = ""
            else:
                current_part += char
        if current_part.strip():
            parts.append(current_part.strip())
        
        # Parse each part and filter by age
        for part in parts:
            part = part.strip()
            if not part:
                continue
            
            # Check if this part starts with a frequency (including "At will")
            freq_match = re.match(r'(\d+/day|At will)--(.+)', part, re.IGNORECASE)
            if freq_match:
                frequency = freq_match.group(1)
                abilities_text_part = freq_match.group(2)
                
                # Split by comma to get individual abilities
                ability_parts = []
                current_ability = ""
                paren_depth = 0
                for char in abilities_text_part:
                    if char == '(':
                        paren_depth += 1
                        current_ability += char
                    elif char == ')':
                        paren_depth -= 1
                        current_ability += char
                    elif char == ',' and paren_depth == 0:
                        if current_ability.strip():
                            ability_parts.append(current_ability.strip())
                        current_ability = ""
                    else:
                        current_ability += char
                if current_ability.strip():
                    ability_parts.append(current_ability.strip())
                
                # Filter abilities by age requirement
                filtered_ability_parts = []
                for ability_part in ability_parts:
                    if not ability_part:
                        continue
                    ability_match = re.match(r'([^(]+)\(([^)]+)\)', ability_part)
                    if ability_match:
                        ability_name = ability_match.group(1).strip()
                        details = ability_match.group(2)
                        
                        # Check age requirement (cumulative - if age qualifies, include it)
                        if check_age_requirement(age, details.lower()):
                            # For "darkness", add radius note (10 ft. per age category)
                            if ability_name.lower().strip() == 'darkness':
                                age_category_num = AGE_CATEGORY_NUMBERS.get(age, 1)
                                radius = age_category_num * 10
                                filtered_ability_parts.append(f'darkness (radius {radius} ft.)')
                            else:
                                # Remove the age requirement from output - just use the ability name
                                filtered_ability_parts.append(ability_name)
                
                # If we have filtered abilities for this frequency, add them
                if filtered_ability_parts:
                    filtered_parts.append(f"{frequency}--{','.join(filtered_ability_parts)}")
        
        # If we have filtered abilities, create the "Spell-Like Abilities" SA block
        if filtered_parts:
            # Get caster level
            # Caster level is the higher of: age category number or sorcerer caster level
            age_category_num = AGE_CATEGORY_NUMBERS.get(age, 1)
            
            # Parse sorcerer caster level from abilities table
            sorcerer_caster_level = 0
            caster_level_text = abilities_row.get('Caster Level', '').strip()
            if caster_level_text and caster_level_text != '--':
                # Parse formats like "5th", "7th", "1st", etc.
                caster_level_match = re.search(r'(\d+)', caster_level_text)
                if caster_level_match:
                    sorcerer_caster_level = int(caster_level_match.group(1))
            
            # Use whichever is higher
            effective_caster_level = max(age_category_num, sorcerer_caster_level)
            
            # Format as ordinal (1st, 2nd, 3rd, 4th, etc.)
            def format_ordinal(n):
                if 10 <= n % 100 <= 20:
                    suffix = 'th'
                else:
                    suffix = {1: 'st', 2: 'nd', 3: 'rd'}.get(n % 10, 'th')
                return f"{n}{suffix}"
            
            caster_level = format_ordinal(effective_caster_level)
            
            # Calculate save DC base: 10 + Cha modifier
            cha_score = int(stats_row.get('Cha', '0') or '0')
            cha_mod = get_ability_modifier(cha_score)
            save_dc_base = 10 + cha_mod
            
            # Process each part to add DC to each spell
            formatted_parts = []
            for part in filtered_parts:
                # Parse format: "frequency--spell1,spell2" or "frequency--spell1 (notes)"
                freq_match = re.match(r'(\d+/day|At will)--(.+)', part, re.IGNORECASE)
                if freq_match:
                    frequency = freq_match.group(1)
                    abilities_part = freq_match.group(2)
                    
                    # Split abilities by comma (handling parentheses)
                    ability_list = []
                    current_ability = ""
                    paren_depth = 0
                    for char in abilities_part:
                        if char == '(':
                            paren_depth += 1
                            current_ability += char
                        elif char == ')':
                            paren_depth -= 1
                            current_ability += char
                        elif char == ',' and paren_depth == 0:
                            if current_ability.strip():
                                ability_list.append(current_ability.strip())
                            current_ability = ""
                        else:
                            current_ability += char
                    if current_ability.strip():
                        ability_list.append(current_ability.strip())
                    
                    # Add DC to each spell
                    abilities_with_dc = []
                    for ability in ability_list:
                        # Extract spell name (remove existing parentheses if any)
                        spell_match = re.match(r'([^(]+)(?:\(([^)]+)\))?', ability)
                        if spell_match:
                            spell_name = spell_match.group(1).strip()
                            existing_notes = spell_match.group(2) if spell_match.group(2) else None
                            
                            # Get spell level
                            spell_level = get_spell_level_from_name(spell_name)
                            if spell_level is None:
                                # Default to 0 if not found
                                spell_level = 0
                            
                            # Calculate DC: 10 + Cha mod + spell level
                            spell_dc = save_dc_base + spell_level
                            
                            # Format: "spell name (DC X)" or "spell name (DC X; notes)" if notes exist
                            if existing_notes:
                                abilities_with_dc.append(f"{spell_name} (DC {spell_dc}; {existing_notes})")
                            else:
                                abilities_with_dc.append(f"{spell_name} (DC {spell_dc})")
                    
                    formatted_parts.append(f"{frequency}--{','.join(abilities_with_dc)}")
                else:
                    # Fallback: just use the part as-is
                    formatted_parts.append(part)
            
            abilities_text = '; '.join(formatted_parts)
            
            # Format: Title on first line, content on second line with 4 spaces indentation
            # Add caster level and save DC information at the end
            spell_like_text = f"Spell-Like Abilities:\n    {abilities_text}. Caster level {caster_level}. The Save DCs are Charisma-based."
            
            sa_node = BlockNode(tag='SA', content=spell_like_text)
            variant_node.add_child(sa_node)
    
    # Add Snatch SA block if the variant has the Snatch feat
    # Check if we've already added Snatch
    existing_sa_names = set()
    for sa in variant_node.find_children('SA'):
        first_line = sa.content.split('\n')[0].strip()
        name_match = re.match(r'^([^(:]+)', first_line)
        if name_match:
            sa_name = name_match.group(1).strip().lower()
            existing_sa_names.add(sa_name)
    if has_snatch and 'snatch' not in existing_sa_names:
        # Calculate Snatch details from stats
        str_score = int(stats_row.get('Str', '0') or '0')
        str_mod = get_ability_modifier(str_score)
        
        # Get attack bonuses and damage from universal table
        attack_table = universal_tables.get('Dragon Space/Reach, Attacks, and Damage')
        
        # Get bite and claw damage
        bite_damage = get_table_value_by_size(attack_table, size_abbr, '1 Bite') or '1d8'
        claw_damage = get_table_value_by_size(attack_table, size_abbr, '2 Claws') or '1d6'
        
        # Calculate grapple bonus (Base Attack + Str mod + size mod)
        base_attack_text = stats_row.get('Base Attack/ Grapple', '').strip()
        grapple_match = re.search(r'\+(\d+)', base_attack_text.split('/')[-1] if '/' in base_attack_text else '')
        grapple_bonus = int(grapple_match.group(1)) if grapple_match else 0
        
        # Determine size categories for Snatch
        size_order = ["Fine", "Diminutive", "Tiny", "Small", "Medium", "Large", "Huge", "Gargantuan", "Colossal"]
        size_index = size_order.index(size_full) if size_full in size_order else 4
        
        # Claw can snatch creatures of Medium or smaller (if dragon is Large+)
        # Bite can snatch creatures of Large or smaller (if dragon is Huge+)
        claw_size_limit = "Medium or smaller" if size_index >= 4 else "Small or smaller"
        bite_size_limit = "Large or smaller" if size_index >= 5 else "Medium or smaller"
        
        # Calculate damage per round
        # Claw: claw_damage + str_mod/2
        claw_dmg_per_round = f"{claw_damage}+{str_mod//2}"
        # Bite: bite_damage + str_mod
        bite_dmg_per_round = f"{bite_damage}+{str_mod}"
        # If dragon doesn't move: bite_damage*2 + str_mod*2
        bite_dice_match = re.search(r'(\d+)d(\d+)', bite_damage)
        if bite_dice_match:
            num_dice = int(bite_dice_match.group(1))
            die_size = int(bite_dice_match.group(2))
            bite_dmg_no_move = f"{num_dice*2}d{die_size}+{str_mod*2}"
        else:
            bite_dmg_no_move = f"{bite_damage}+{str_mod*2}"
        
        # Calculate fling distance and damage
        # Fling distance: 10 feet per size category above Medium
        fling_distance = max(0, (size_index - 4) * 10)  # Medium is index 4
        fling_damage_dice = max(1, size_index - 3)  # 1d6 per size category above Small
        
        snatch_description = f"Grapple bonus +{grapple_bonus}; claw against creature of {claw_size_limit} for {claw_dmg_per_round}/round, bite against {bite_size_limit} for {bite_dmg_per_round}/round, or {bite_dmg_no_move} if the dragon does not move; snatched creature can be flung {fling_distance} ft. for {fling_damage_dice}d6 points of damage."
        snatch_text = format_sa_block("Snatch", "Ex", snatch_description, age)
        
        sa_node = BlockNode(tag='SA', content=snatch_text)
        variant_node.add_child(sa_node)
    
    # Add Crush SA block if size is Huge or larger
    if size_full in ['Huge', 'Gargantuan', 'Colossal']:
        attack_table = universal_tables.get('Dragon Space/Reach, Attacks, and Damage')
        # Get crush damage from universal table
        crush_damage = get_table_value_by_size(attack_table, size_abbr, '1 Crush') or '2d8'
        
        # Get breath weapon DC for Reflex save
        breath_dc_text = stats_row.get('Breath Weapon (DC)', '').strip()
        breath_dc_match = re.search(r'\((\d+)\)', breath_dc_text)
        breath_dc = breath_dc_match.group(1) if breath_dc_match else "10"
        
        str_score = int(stats_row.get('Str', '0') or '0')
        str_mod = get_ability_modifier(str_score)
        crush_dmg_with_str = f"{crush_damage}+{int(str_mod * 1.5)}"
        
        crush_description = f"This special attack allows this dragon, when flying or jumping, to land on opponents as a standard action, using its whole body to crush them. Crush attacks are effective only against opponents three or more size categories smaller than the dragon (though it can attempt normal overrun or grapple attacks against larger opponents).\n    A crush attack affects as many creatures as can fit under the dragon's body. Creatures in the affected area must succeed on a Reflex save (DC {breath_dc}) or be pinned, automatically taking bludgeoning damage during the next round unless the dragon moves off them. If the dragon chooses to maintain the pin, treat it as a normal grapple attack. Pinned opponents take damage from the crush each round if they don't escape.\n    A crush attack deals {crush_dmg_with_str} points of damage."
        crush_text = format_sa_block("Crush", "Ex", crush_description, age)
        
        sa_node = BlockNode(tag='SA', content=crush_text)
        variant_node.add_child(sa_node)
    
    # Add Tail Sweep SA block if size is Gargantuan or larger
    if size_full in ['Gargantuan', 'Colossal']:
        attack_table = universal_tables.get('Dragon Space/Reach, Attacks, and Damage')
        # Get tail sweep damage from universal table
        tail_sweep_damage = get_table_value_by_size(attack_table, size_abbr, '1 Tail Sweep') or '2d6'
        
        # Get breath weapon DC for Reflex save
        breath_dc_text = stats_row.get('Breath Weapon (DC)', '').strip()
        breath_dc_match = re.search(r'\((\d+)\)', breath_dc_text)
        breath_dc = breath_dc_match.group(1) if breath_dc_match else "10"
        
        str_score = int(stats_row.get('Str', '0') or '0')
        str_mod = get_ability_modifier(str_score)
        tail_sweep_dmg_with_str = f"{tail_sweep_damage}+{int(str_mod * 1.5)}"
        
        # Radius is 30 ft for Gargantuan, 40 ft for Colossal
        radius = "40 ft." if size_full == 'Colossal' else "30 ft."
        
        tail_sweep_description = f"This special attack allows this dragon to sweep with its tail as a standard action. The sweep affects a half-circle with a radius of {radius}, extending from an intersection on the edge of the dragon's space in any direction. Creatures within the swept area are affected if they are four or more size categories smaller than the dragon.\n    A tail sweep automatically deals {tail_sweep_dmg_with_str} points of damage.\n    Affected creatures can attempt Reflex saves to take half damage (DC {breath_dc})."
        tail_sweep_text = format_sa_block("Tail Sweep", "Ex", tail_sweep_description, age)
        
        sa_node = BlockNode(tag='SA', content=tail_sweep_text)
        variant_node.add_child(sa_node)


def add_category_sa_nodes_to_variant(variant_node: BlockNode, category_node: BlockNode, age: str = '') -> None:
    """
    Add category-level SA nodes to variant (excluding breath weapon and those in INPUTDATA).
    Also excludes SA blocks that are already handled by add_variant_sa_blocks:
    - Water Breathing (handled from cumulative abilities)
    - Other Spell-Like Abilities (parsed and added individually)
    - Spells (added based on caster level)
    - Darkness, Plant Growth, Insect Plague, Charm Reptiles (from Other Spell-Like Abilities)
    - Snatch (added based on feats)
    """
    # Get list of SA block names we're already handling
    existing_sa_names = set()
    for sa_child in variant_node.find_children('SA'):
        first_line = sa_child.content.split('\n')[0].strip()
        # Extract just the name part (before colon, remove parenthetical markers)
        name_part = first_line.split(':')[0].strip() if ':' in first_line else first_line
        sa_name = re.sub(r'\s*\([^)]+\)\s*$', '', name_part.rstrip(':')).lower().strip()
        existing_sa_names.add(sa_name)
    
    # Also add known abilities that we handle programmatically
    # Water Breathing is handled from cumulative abilities, so skip it here
    programmatic_abilities = {'water breathing', 'spells', 'darkness', 'plant growth', 
                             'insect plague', 'charm reptiles', 'snatch', 'crush', 'tail sweep', 'spell-like abilities'}
    existing_sa_names.update(programmatic_abilities)
    
    # Get age from variant name or pass it as parameter - we need age to filter spell-like abilities
    # Extract age from variant name
    variant_name = variant_node.content.strip()
    age_for_filtering = None
    for age in AGE_CATEGORIES:
        if age.lower() in variant_name.lower():
            age_for_filtering = age
            break
    
    for child in category_node.children:
        if child.tag == 'SA':
            sa_content = child.content
            first_line = sa_content.split('\n')[0].strip()
            # Extract just the name part (before colon, remove parenthetical markers)
            name_part = first_line.split(':')[0].strip() if ':' in first_line else first_line
            sa_name = re.sub(r'\s*\([^)]+\)\s*$', '', name_part.rstrip(':')).lower().strip()
            
            # Skip if already added (check both the normalized name and the programmatic abilities)
            if sa_name in existing_sa_names:
                continue
            # Also check if it's a programmatic ability (water breathing is handled from cumulative abilities)
            if sa_name in programmatic_abilities:
                continue
            # Skip breath weapon (already added) and universal descriptions
            if 'breath weapon' not in sa_content.lower() or 'one type' in sa_content.lower():
                # Skip "Other Spell-Like Abilities" - we parse and add individual abilities
                if 'other spell-like abilities' in sa_content.lower():
                    continue
                # Skip "Spell-Like Abilities" blocks that contain age requirements - these are templates
                # We handle spell-like abilities through the "Other Spell-Like Abilities" parsing
                # Check if it contains age requirements in parentheses (e.g., "(adult or older)", "(great wyrm)")
                # Also check if it starts with "Spell-Like Abilities:" followed by abilities with age requirements
                if 'spell-like abilities' in sa_content.lower() and 'other' not in sa_content.lower():
                    # Check for age requirement patterns - look for parentheses with age requirements
                    # Pattern matches: (adult or older), (ancient or older), (great wyrm), etc.
                    if re.search(r'\([^)]*(?:or older|great wyrm|ancient|old|adult|mature adult|young adult|juvenile|young|very young|wyrmling)[^)]*\)', sa_content.lower()):
                        continue
                # Skip "Skills" - this is metadata, not an SA block
                if sa_content.strip().lower().startswith('skills:'):
                    continue
                sa_node = BlockNode(tag='SA', content=sa_content)
                variant_node.add_child(sa_node)
        elif child.tag not in ('INPUTDATA', 'FLAVORTEXT', 'DESCRIPTION', 'COMBAT', 'EXAMPLE'):
            # Recursively check for SA nodes in other blocks (but not INPUTDATA or EXAMPLE)
            for sa_descendant in child.find_descendants('SA'):
                # Check if this SA is inside INPUTDATA or EXAMPLE
                parent = sa_descendant.parent
                is_in_inputdata = False
                is_in_example = False
                while parent:
                    if parent.tag == 'INPUTDATA':
                        is_in_inputdata = True
                        break
                    if parent.tag == 'EXAMPLE':
                        is_in_example = True
                        break
                    parent = parent.parent
                
                if not is_in_inputdata and not is_in_example:
                    sa_content = sa_descendant.content
                    first_line = sa_content.split('\n')[0].strip()
                    # Extract just the name part (before colon, remove parenthetical markers)
                    name_part = first_line.split(':')[0].strip() if ':' in first_line else first_line
                    sa_name = re.sub(r'\s*\([^)]+\)\s*$', '', name_part.rstrip(':')).lower().strip()
                    
                    # Skip if already added (check both the normalized name and the programmatic abilities)
                    if sa_name in existing_sa_names:
                        continue
                    # Also check if it's a programmatic ability (water breathing is handled from cumulative abilities)
                    if sa_name in programmatic_abilities:
                        continue
                    # Skip breath weapon (already added) and universal descriptions
                    if 'breath weapon' not in sa_content.lower() or 'one type' in sa_content.lower():
                        # Skip "Other Spell-Like Abilities" - we parse and add individual abilities
                        if 'other spell-like abilities' in sa_content.lower():
                            continue
                        # Skip "Spell-Like Abilities" blocks that contain age requirements - these are templates
                        # We handle spell-like abilities through the "Other Spell-Like Abilities" parsing
                        # Check if it contains age requirements in parentheses (e.g., "(adult or older)", "(great wyrm)")
                        if 'spell-like abilities' in sa_content.lower():
                            # Check for age requirement patterns - look for parentheses with age requirements
                            # Pattern matches: (adult or older), (ancient or older), (great wyrm), etc.
                            if re.search(r'\([^)]*(?:or older|great wyrm|ancient|old|adult|mature adult|young adult|juvenile|young|very young|wyrmling)[^)]*\)', sa_content.lower()):
                                continue
                        # Skip "Skills" - this is metadata, not an SA block
                        if sa_content.strip().lower().startswith('skills:'):
                            continue
                        
                        # Format the SA block if it's not already formatted
                        # Check if it's already formatted (has newline and indentation)
                        if '\n' in sa_content and '    ' in sa_content:
                            # Already formatted, but still need to process age-specific text
                            # Extract the description part (everything after the first line)
                            lines = sa_content.split('\n')
                            first_line = lines[0]
                            description_lines = lines[1:] if len(lines) > 1 else []
                            # Join description lines, process as a whole, then split back
                            description_text = '\n'.join(description_lines)
                            processed_description_text = process_age_specific_text(description_text, age_for_filtering)
                            # Reconstruct the formatted content
                            formatted_content = first_line + '\n' + processed_description_text if processed_description_text else sa_content
                        else:
                            # Need to format it - extract name, type, and description
                            # Format: "Water Breathing (Ex): description" or "Water Breathing: description"
                            first_line = sa_content.split('\n')[0].strip()
                            # Extract name and type
                            name_type_match = re.match(r'^([^(]+)(?:\(([^)]+)\))?\s*:\s*(.+)', first_line)
                            if name_type_match:
                                ability_name = name_type_match.group(1).strip()
                                ability_type = name_type_match.group(2).strip() if name_type_match.group(2) else ""
                                description = name_type_match.group(3).strip()
                                # Get rest of description if there are more lines
                                if '\n' in sa_content:
                                    description += '\n' + '\n'.join(sa_content.split('\n')[1:])
                                formatted_content = format_sa_block(ability_name, ability_type, description, age_for_filtering)
                            else:
                                # Fallback: use as-is
                                formatted_content = sa_content
                        
                        sa_node = BlockNode(tag='SA', content=formatted_content)
                        variant_node.add_child(sa_node)
                        existing_sa_names.add(sa_name)


def output_tree(node: BlockNode, output_lines: List[str], exclude_tags: set = None) -> None:
    """
    Walk the tree and output all nodes except those with tags in exclude_tags.
    
    Args:
        node: The node to output
        output_lines: List to append output lines to
        exclude_tags: Set of tag names to exclude from output (default: {'INPUTDATA', 'EXAMPLE', 'TABLE'})
    """
    if exclude_tags is None:
        exclude_tags = {'INPUTDATA', 'EXAMPLE', 'TABLE'}
    
    # Skip excluded tags
    if node.tag in exclude_tags:
        return
    
    # Output opening tag
    output_lines.append(f"{{{node.tag}}}")
    
    # For SIDEBAR nodes, don't exclude TABLE children
    child_exclude_tags = exclude_tags.copy()
    if node.tag == 'SIDEBAR':
        child_exclude_tags = child_exclude_tags - {'TABLE'}
    
    # Output content and children in their original order
    if node.children:
        ordered_items = node.get_content_and_children_in_order()
        for pos, item_type, item_value in ordered_items:
            if item_type == 'content':
                # Output content segment
                if item_value:
                    output_lines.append(item_value)
            elif item_type == 'child':
                # Output child node
                child = item_value
                if child.tag not in child_exclude_tags:
                    output_tree(child, output_lines, child_exclude_tags)
    else:
        # No children, just output content
        content = node.content.strip()
        if content:
            output_lines.append(content)
    
    # Output closing tag
    output_lines.append(f"{{/{node.tag}}}")


# ============================================================================
# Helper Functions
# ============================================================================

def parse_table_from_tagged_section(table_content: str) -> Optional[Dict]:
    """
    Parse a table from a {TABLE}...{/TABLE} section.
    
    Returns dict with 'name', 'columns', 'rows' or None if invalid.
    """
    if not table_content:
        return None
    
    lines = [line.strip() for line in table_content.split('\n') if line.strip()]
    
    if len(lines) < 2:
        return None
    
    # First line is the title
    table_name = lines[0].strip()
    
    # Check if second line is a subtitle/merged header row
    line_idx = 1
    if line_idx < len(lines):
        second_line = lines[line_idx]
        second_parts = [p.strip() for p in second_line.split('|')]
        non_empty_count = sum(1 for p in second_parts if p)
        total_parts = len(second_parts)
        if total_parts >= 2 and non_empty_count <= 2:
            line_idx += 1
    
    # Next line should be the header row
    if line_idx >= len(lines):
        return None
    
    header_line = lines[line_idx]
    header_parts = [p.strip() for p in header_line.split('|')]
    
    # Parse columns from header
    columns = []
    for idx, header in enumerate(header_parts):
        if header:
            columns.append({
                'index': idx,
                'header': header
            })
    
    if not columns:
        return None
    
    # Parse data rows
    rows = []
    for row_idx, line in enumerate(lines[line_idx + 1:], start=0):
        # Skip lines that start with * (footnotes/explanatory text)
        if line.strip().startswith('*'):
            continue
        
        row_parts = [p.strip() for p in line.split('|')]
        row_dict = {}
        for col in columns:
            col_idx = col['index']
            if col_idx < len(row_parts):
                row_dict[col['header']] = row_parts[col_idx] if row_parts[col_idx] else ''
            else:
                row_dict[col['header']] = ''
        
        # Only add rows that have at least one non-empty value
        if any(row_dict.values()):
            rows.append(row_dict)
    
    if not rows:
        return None
    
    return {
        'name': table_name,
        'columns': columns,
        'rows': rows
    }


def parse_multi_value_field(text: str, field_name: str) -> Dict[str, str]:
    """
    Parse a multi-value field like "Wyrmling 3; very young 4; young 5; ..."
    or "Wyrmling, very young: value; adult, old: value" (for Organization).
    Returns a dict mapping age to value.
    """
    result = {}
    
    # Special handling for Organization field which has format:
    # "age1, age2, age3: value; age4, age5: value"
    if field_name.lower() == 'organization':
        # Split by semicolon to get each group
        parts = [p.strip() for p in text.split(';')]
        
        # Sort age categories by length (longest first) to avoid matching "Adult" before "Mature adult"
        sorted_ages = sorted(AGE_CATEGORIES, key=len, reverse=True)
        
        for part in parts:
            if not part:
                continue
            # Find the colon that separates age list from value
            colon_idx = part.find(':')
            if colon_idx == -1:
                continue
            
            age_list_str = part[:colon_idx].strip()
            value = part[colon_idx + 1:].strip()
            
            # Parse the age list (e.g., "Wyrmling, very young, young, juvenile, and young adult")
            # Split by comma and "and"
            age_list = []
            # Remove "and" and split by commas
            age_list_clean = re.sub(r'\s+and\s+', ', ', age_list_str)
            for age_part in age_list_clean.split(','):
                age_part = age_part.strip()
                if not age_part:  # Skip empty parts
                    continue
                # Remove leading "or" if present
                age_part = re.sub(r'^\s*or\s+', '', age_part, flags=re.IGNORECASE).strip()
                if not age_part:  # Skip if empty after removing "or"
                    continue
                # Try to match against AGE_CATEGORIES
                # First check for exact matches (all categories, shortest first for preference)
                matched = False
                for age in AGE_CATEGORIES:
                    if age.lower() == age_part.lower():
                        if age not in result:
                            result[age] = value
                        matched = True
                        break
                
                # If no exact match, check for contained matches (part contained in age)
                # Check shorter categories first to prefer more specific matches
                if not matched:
                    for age in sorted(AGE_CATEGORIES, key=len):  # Shortest first
                        age_lower = age.lower()
                        part_lower = age_part.lower()
                        # Part is contained in age as a whole word (e.g., "young" in "young adult")
                        if re.search(rf'\b{re.escape(part_lower)}\b', age_lower, re.IGNORECASE):
                            if age not in result:
                                result[age] = value
                            break
    else:
        # Standard format: "Wyrmling 3; very young 4; young 5; ..." or "Wyrmling +3; others --"
        # Split by semicolon
        parts = [p.strip() for p in text.split(';')]
        
        # Track which ages have been explicitly set
        explicitly_set = set()
        others_value = None
        
        # Sort age categories by length (longest first) to avoid matching "Young" before "Young Adult"
        sorted_ages = sorted(AGE_CATEGORIES, key=len, reverse=True)
        
        for part in parts:
            if not part:
                continue
            
            # Check for "others" catch-all pattern (e.g., "others --" or "others: --")
            # Match "others" followed by optional whitespace, then capture everything after (including optional colon/dash)
            others_match = re.search(r'\bothers?\s+(.+?)(?:\s*;|\s*$)', part, re.IGNORECASE)
            if others_match:
                others_value = others_match.group(1).strip()
                continue
            
            # Try to match age categories (check longer names first to avoid partial matches)
            for age in sorted_ages:
                pattern = rf'\b{re.escape(age)}\s*[:\-]?\s*(.+?)(?:\s*;|\s*$)'
                match = re.search(pattern, part, re.IGNORECASE)
                if match:
                    result[age] = match.group(1).strip()
                    explicitly_set.add(age)
                    break
        
        # Apply "others" value to all ages that weren't explicitly set
        if others_value is not None:
            for age in AGE_CATEGORIES:
                if age not in explicitly_set:
                    result[age] = others_value
    
    return result


def get_table_row_by_key(table: Dict, key_column: str, key_value: str) -> Optional[Dict]:
    """Get a row from a table where the key column matches the key value."""
    if not table or 'rows' not in table:
        return None
    
    for row in table['rows']:
        if row.get(key_column, '').strip() == key_value.strip():
            return row
    
    return None


def get_table_value_by_size(table: Optional[Dict], size: str, column_name: str) -> Optional[str]:
    """Get a value from a table by matching the Size column."""
    if not table:
        return None
    
    size_full = get_size_from_abbreviation(size)
    
    for row in table.get('rows', []):
        row_size = row.get('Size', '').strip()
        if row_size == size or row_size == size_full:
            return row.get(column_name, '').strip()
    
    return None


def get_size_from_abbreviation(abbr: str) -> str:
    """Convert size abbreviation (T, S, M, etc.) to full word."""
    size_map = {
        'T': 'Tiny',
        'S': 'Small',
        'M': 'Medium',
        'L': 'Large',
        'H': 'Huge',
        'G': 'Gargantuan',
        'C': 'Colossal'
    }
    return size_map.get(abbr.strip().upper(), abbr)


def get_size_modifier(size_full: str) -> int:
    """
    Get the size modifier for attack rolls and AC.
    In D&D 3.5, larger creatures get better attack bonuses but worse AC.
    
    Size modifiers:
    Fine: +8, Diminutive: +4, Tiny: +2, Small: +1, Medium: +0,
    Large: -1, Huge: -2, Gargantuan: -4, Colossal: -8
    """
    size_mod_map = {
        'Fine': 8,
        'Diminutive': 4,
        'Tiny': 2,
        'Small': 1,
        'Medium': 0,
        'Large': -1,
        'Huge': -2,
        'Gargantuan': -4,
        'Colossal': -8
    }
    return size_mod_map.get(size_full, 0)


def get_hide_size_modifier(size_full: str) -> int:
    """
    Get the size modifier for Hide skill checks.
    A creature larger or smaller than Medium takes a size bonus or penalty on Hide checks.
    
    Size modifiers for Hide:
    Fine: +16, Diminutive: +12, Tiny: +8, Small: +4, Medium: +0,
    Large: -4, Huge: -8, Gargantuan: -12, Colossal: -16
    """
    hide_size_mod_map = {
        'Fine': 16,
        'Diminutive': 12,
        'Tiny': 8,
        'Small': 4,
        'Medium': 0,
        'Large': -4,
        'Huge': -8,
        'Gargantuan': -12,
        'Colossal': -16
    }
    return hide_size_mod_map.get(size_full, 0)


# Dragon damage progressions for Improved Natural Attack
NORMAL_DAMAGE_PROGRESSION = ['1d2', '1d3', '1d4', '1d6', '1d8', '2d6', '3d6', '4d6', '6d6', '8d6', '12d6']
D10_DAMAGE_PROGRESSION = ['1d10', '2d8', '3d8', '4d8', '6d8', '8d8', '12d8']


def get_improved_natural_attack_damage(current_damage: str) -> Optional[str]:
    """
    Get the next damage value in the dragon damage progression for Improved Natural Attack.
    
    Dragons use two progression tables:
    - Normal progression: 1d2, 1d3, 1d4, 1d6, 1d8, 2d6, 3d6, 4d6, 6d6, 8d6, 12d6
    - d10 progression: 1d10, 2d8, 3d8, 4d8, 6d8, 8d8, 12d8
    
    Search normal progression first, then d10 progression. Return the next value in the progression.
    Returns None if current_damage is not found in either progression (should generate error).
    
    Args:
        current_damage: Current damage dice (e.g., "2d8", "4d6")
    
    Returns:
        Next damage value in progression, or None if not found
    """
    if not current_damage:
        return None
    
    # Normalize damage string (remove any +modifier, strip whitespace)
    damage_clean = current_damage.split('+')[0].split('-')[0].strip()
    
    # Search normal progression first
    if damage_clean in NORMAL_DAMAGE_PROGRESSION:
        idx = NORMAL_DAMAGE_PROGRESSION.index(damage_clean)
        if idx < len(NORMAL_DAMAGE_PROGRESSION) - 1:
            return NORMAL_DAMAGE_PROGRESSION[idx + 1]
        else:
            # Already at max in normal progression
            return None
    
    # Search d10 progression
    if damage_clean in D10_DAMAGE_PROGRESSION:
        idx = D10_DAMAGE_PROGRESSION.index(damage_clean)
        if idx < len(D10_DAMAGE_PROGRESSION) - 1:
            return D10_DAMAGE_PROGRESSION[idx + 1]
        else:
            # Already at max in d10 progression
            return None
    
    # Not found in either progression
    return None


def calculate_weapon_attack(
    weapon_name: str,
    table_column: str,
    display_name: str,
    is_secondary: bool,
    base_attack_num: int,
    str_mod: int,
    size_mod: int,
    secondary_penalty: int,
    weapon_focus_weapons: set,
    improved_natural_attack_weapons: set,
    space_reach_table: Dict,
    size_abbr: str
) -> Optional[str]:
    """
    Calculate attack bonus and damage for a weapon, returning formatted attack string.
    
    Args:
        weapon_name: Name for weapon focus lookup (e.g., 'bite', 'claw', 'wing', 'tail')
        table_column: Column name in universal table (e.g., '1 Bite', '2 Claws')
        display_name: Display name for output (e.g., 'bite', '2x claws', 'tail slap')
        is_secondary: Whether this is a secondary attack
        base_attack_num: Base attack bonus number
        str_mod: Strength modifier
        size_mod: Size modifier (negative for Large+)
        secondary_penalty: Penalty for secondary attacks (-2 with Multiattack, -5 without)
        weapon_focus_weapons: Set of weapons with Weapon Focus feat
        improved_natural_attack_weapons: Set of weapons with Improved Natural Attack feat
        space_reach_table: Universal table for damage values
        size_abbr: Size abbreviation for table lookup
    
    Returns:
        Formatted attack string (e.g., "bite +20 melee (2d6+4)") or None if weapon not available
    """
    # Get base damage from table
    damage = get_table_value_by_size(space_reach_table, size_abbr, table_column)
    if not damage or damage == '--':
        return None
    
    # If weapon has Improved Natural Attack, increase damage using progression tables
    if weapon_name in improved_natural_attack_weapons:
        improved_damage = get_improved_natural_attack_damage(damage)
        if improved_damage:
            damage = improved_damage
        else:
            # Log error if damage not found in progression tables
            logger.warning(f"Improved Natural Attack: Could not find next progression for damage '{damage}' (weapon: {weapon_name})")
    
    # Calculate attack bonus
    attack_bonus = base_attack_num + str_mod + size_mod
    if is_secondary:
        attack_bonus += secondary_penalty
    if weapon_name in weapon_focus_weapons:
        attack_bonus += 1
    
    # Calculate damage with strength modifier
    if weapon_name == 'tail':
        # Tail slap uses 1.5x strength modifier (even though it's a secondary attack)
        str_damage_mod = int(str_mod * 1.5)
    elif is_secondary:
        # Secondary attacks use half strength modifier
        str_damage_mod = str_mod // 2
    else:
        # Primary attacks use full strength modifier
        str_damage_mod = str_mod
    
    if str_damage_mod > 0:
        damage_with_str = f"{damage}+{str_damage_mod}"
    else:
        damage_with_str = damage
    
    return f"{display_name} +{attack_bonus} melee ({damage_with_str})"


def to_title_case(text: str) -> str:
    """Convert text to proper Title Case, handling multi-word phrases."""
    return ' '.join(word.capitalize() for word in text.split())


def parse_weapon_focus_feats(feats_text: str) -> set:
    """
    Parse feats text to extract all weapons that have Weapon Focus.
    
    Args:
        feats_text: Comma-separated string of feats (e.g., "Weapon Focus (bite), Weapon Focus (claw)")
    
    Returns:
        Set of weapon types that have Weapon Focus (e.g., {'bite', 'claw'})
    """
    weapon_focus_weapons = set()
    
    if not feats_text:
        return weapon_focus_weapons
    
    # Split feats by comma, but be careful with parentheses
    # Pattern: "Weapon Focus (weapon)" or "Weapon Focus(weapon)"
    pattern = r'Weapon Focus\s*\(([^)]+)\)'
    matches = re.findall(pattern, feats_text, re.IGNORECASE)
    
    for weapon in matches:
        # Normalize weapon name (lowercase, strip whitespace)
        weapon_normalized = weapon.strip().lower()
        weapon_focus_weapons.add(weapon_normalized)
    
    return weapon_focus_weapons


def parse_improved_natural_attack_feats(feats_text: str) -> set:
    """
    Parse feats text to extract all weapons that have Improved Natural Attack.
    Improved Natural Attack increases damage as though the creature was one size category larger.
    
    Args:
        feats_text: Comma-separated string of feats (e.g., "Improved Natural Attack (bite)")
    
    Returns:
        Set of weapon types that have Improved Natural Attack (e.g., {'bite'})
    """
    improved_attack_weapons = set()
    
    if not feats_text:
        return improved_attack_weapons
    
    # Pattern: "Improved Natural Attack (weapon)" or "Improved Natural Attack(weapon)"
    pattern = r'Improved Natural Attack\s*\(([^)]+)\)'
    matches = re.findall(pattern, feats_text, re.IGNORECASE)
    
    for weapon in matches:
        # Normalize weapon name (lowercase, strip whitespace)
        weapon_normalized = weapon.strip().lower()
        improved_attack_weapons.add(weapon_normalized)
    
    return improved_attack_weapons


def process_age_specific_text(text: str, age: str = None) -> str:
    """
    Process text to replace age-specific phrases.
    
    Args:
        text: Text to process
        age: Optional age category for processing age-specific text replacements
    
    Returns:
        Processed text with age-specific replacements
    """
    if not age:
        return text
    
    processed_text = text
    
    # Replace "A/An [age requirement] or older [color] dragon can" with "This dragon can"
    # Pattern matches: "A juvenile or older blue dragon can", "An old or older white dragon can", etc.
    # This pattern handles the case where the SA block only appears for dragons meeting the age requirement
    age_pattern = r'An?\s+(?:juvenile|very young|young|young adult|adult|mature adult|old|very old|ancient|wyrm|great wyrm)\s+or\s+older\s+\w+\s+dragon\s+can'
    processed_text = re.sub(age_pattern, 'This dragon can', processed_text, flags=re.IGNORECASE)
    
    # Remove "usable by a [age] [color] dragon" phrases
    # Pattern matches: "usable by a great wyrm brass dragon", "usable by an ancient red dragon", etc.
    # This handles cases where the ability description mentions the age requirement
    usable_by_pattern = r',\s*usable\s+by\s+an?\s+(?:juvenile|very young|young|young adult|adult|mature adult|old|very old|ancient|wyrm|great wyrm)\s+\w+\s+dragon'
    processed_text = re.sub(usable_by_pattern, '', processed_text, flags=re.IGNORECASE)
    
    # Clean up leftover commas: "This ability, works" -> "This ability works"
    # Pattern matches a comma followed by whitespace and a lowercase letter (start of next word)
    processed_text = re.sub(r'(\w+),\s+([a-z])', r'\1 \2', processed_text)
    
    # Replace "a flying or jumping dragon of at least [size]" with "this dragon, when flying or jumping"
    # Pattern matches: "a flying or jumping dragon of at least Huge size"
    size_pattern1 = r'a\s+flying\s+or\s+jumping\s+dragon\s+of\s+at\s+least\s+\w+\s+size'
    processed_text = re.sub(size_pattern1, 'this dragon, when flying or jumping', processed_text, flags=re.IGNORECASE)
    
    # Replace "a dragon of at least [size]" with "this dragon"
    # Pattern matches: "a dragon of at least Gargantuan size"
    size_pattern2 = r'a\s+dragon\s+of\s+at\s+least\s+\w+\s+size'
    processed_text = re.sub(size_pattern2, 'this dragon', processed_text, flags=re.IGNORECASE)
    
    # Replace "once per day per age category" with actual X/day
    # The age category number corresponds to the number of uses per day
    if 'once per day per age category' in processed_text.lower():
        age_num = AGE_CATEGORY_NUMBERS.get(age, 1)
        processed_text = re.sub(
            r'once per day per age category',
            f'{age_num}/day',
            processed_text,
            flags=re.IGNORECASE
        )
    
    return processed_text


def format_sa_block(ability_name: str, ability_type: str, description: str, age: str = None) -> str:
    """
    Format an SA block with proper Title Case, spacing, and indentation.
    
    Args:
        ability_name: Name of the ability (will be converted to Title Case)
        ability_type: Type marker like "Sp", "Ex", "Su" (empty string if no type)
        description: Description text (will be placed on next line with 4-space indent)
        age: Optional age category for processing age-specific text replacements
    
    Returns:
        Formatted SA block content
    """
    # Process description for age-specific replacements if age is provided
    processed_description = process_age_specific_text(description, age)
    
    # Convert ability name to Title Case
    name_title = to_title_case(ability_name)
    
    # Format: "Ability Name (Type):\n    Description" or "Ability Name:\n    Description" if no type
    if ability_type:
        return f"{name_title} ({ability_type}):\n    {processed_description}"
    else:
        return f"{name_title}:\n    {processed_description}"


def parse_caster_level(caster_level_text: str) -> int:
    """
    Parse caster level text like "1st", "3rd", "5th", "7th" to integer.
    Handles edge cases like "--" or empty strings.
    
    Returns:
        Caster level as integer, or 0 if cannot parse
    """
    if not caster_level_text or caster_level_text.strip() == '--':
        return 0
    
    # Extract number from text like "1st", "3rd", "5th", "7th"
    match = re.search(r'(\d+)', caster_level_text)
    if match:
        return int(match.group(1))
    
    return 0


def get_sorcerer_spell_slots(caster_level: int) -> Dict[str, int]:
    """
    Get sorcerer spell slots per level based on caster level.
    Uses standard D&D 3.5 sorcerer progression table.
    
    Returns:
        Dict mapping spell level to number of slots: {'0': 5, '1st': 3, ...}
    """
    # D&D 3.5 Sorcerer spell slot progression
    # Format: (caster_level: {spell_level: slots})
    sorcerer_progression = {
        1: {'0': 5, '1st': 3},
        2: {'0': 6, '1st': 4},
        3: {'0': 6, '1st': 5},
        4: {'0': 6, '1st': 6, '2nd': 3},
        5: {'0': 6, '1st': 6, '2nd': 4},
        6: {'0': 6, '1st': 6, '2nd': 5, '3rd': 3},
        7: {'0': 6, '1st': 6, '2nd': 6, '3rd': 4},
        8: {'0': 6, '1st': 6, '2nd': 6, '3rd': 5, '4th': 3},
        9: {'0': 6, '1st': 6, '2nd': 6, '3rd': 6, '4th': 4},
        10: {'0': 6, '1st': 6, '2nd': 6, '3rd': 6, '4th': 5, '5th': 3},
        11: {'0': 6, '1st': 6, '2nd': 6, '3rd': 6, '4th': 6, '5th': 4},
        12: {'0': 6, '1st': 6, '2nd': 6, '3rd': 6, '4th': 6, '5th': 5, '6th': 3},
        13: {'0': 6, '1st': 6, '2nd': 6, '3rd': 6, '4th': 6, '5th': 6, '6th': 4},
        14: {'0': 6, '1st': 6, '2nd': 6, '3rd': 6, '4th': 6, '5th': 6, '6th': 5, '7th': 3},
        15: {'0': 6, '1st': 6, '2nd': 6, '3rd': 6, '4th': 6, '5th': 6, '6th': 6, '7th': 4},
        16: {'0': 6, '1st': 6, '2nd': 6, '3rd': 6, '4th': 6, '5th': 6, '6th': 6, '7th': 5, '8th': 3},
        17: {'0': 6, '1st': 6, '2nd': 6, '3rd': 6, '4th': 6, '5th': 6, '6th': 6, '7th': 6, '8th': 4},
        18: {'0': 6, '1st': 6, '2nd': 6, '3rd': 6, '4th': 6, '5th': 6, '6th': 6, '7th': 6, '8th': 5, '9th': 3},
        19: {'0': 6, '1st': 6, '2nd': 6, '3rd': 6, '4th': 6, '5th': 6, '6th': 6, '7th': 6, '8th': 6, '9th': 4},
        20: {'0': 6, '1st': 6, '2nd': 6, '3rd': 6, '4th': 6, '5th': 6, '6th': 6, '7th': 6, '8th': 6, '9th': 6},
    }
    
    # Clamp to valid range
    level = max(1, min(caster_level, 20))
    
    # Get slots for this level
    slots = sorcerer_progression.get(level, {})
    
    # If level is higher than 20, use level 20 progression
    if caster_level > 20:
        slots = sorcerer_progression[20].copy()
    
    return slots


def get_max_spell_level_for_caster_level(caster_level: int) -> int:
    """
    Get the maximum spell level available to a sorcerer at the given caster level.
    
    Returns:
        Maximum spell level (0-9) available at this caster level
    """
    # Based on sorcerer progression: spell levels become available at:
    # Level 1: 0th, 1st
    # Level 4: 2nd
    # Level 6: 3rd
    # Level 8: 4th
    # Level 10: 5th
    # Level 12: 6th
    # Level 14: 7th
    # Level 16: 8th
    # Level 18: 9th
    if caster_level >= 18:
        return 9
    elif caster_level >= 16:
        return 8
    elif caster_level >= 14:
        return 7
    elif caster_level >= 12:
        return 6
    elif caster_level >= 10:
        return 5
    elif caster_level >= 8:
        return 4
    elif caster_level >= 6:
        return 3
    elif caster_level >= 4:
        return 2
    elif caster_level >= 1:
        return 1
    else:
        return 0


def get_category_spells(category_name: str) -> Dict[str, List[str]]:
    """
    Get category-specific spells for a dragon category.
    
    Returns:
        Dict mapping spell levels to lists of spells for this category
    """
    category_lower = category_name.lower()
    
    if 'black' in category_lower:
        return {
            '0': ['daze', 'ray of frost'],
            '1st': ['mage armor', 'protection from good'],
            '2nd': ['shatter', 'spider climb', 'web'],
            '3rd': ['stinking cloud', 'water breathing'],
            '4th': ['fear', 'phantasmal killer', 'wall of ice'],
            '5th': ['cloudkill', 'cone of cold', 'wall of stone'],
            '6th': ['acid fog', 'chain lightning']
        }
    elif 'blue' in category_lower:
        return {
            '0': ['dancing lights', 'mage hand', 'ray of frost'],
            '1st': ['alarm', "Nystul's magic aura", 'shield of faith', 'command', 'magic missile'],
            '2nd': ['shatter', 'darkness', 'invisibility'],
            '3rd': ['cure serious wounds', 'dispel magic', 'protection from energy'],
            '4th': ['ice storm'],
            '5th': ['cone of cold'],
            '6th': ['chain lightning', 'wall of iron'],
            '7th': ['delayed blast fireball'],
            '8th': ['polar ray'],
            '9th': ['meteor swarm']
        }
    elif 'green' in category_lower:
        return {
            '0': ['arcane mark', 'dancing lights', 'ghost sound'],
            '1st': ['expeditious retreat', "Nystul's magic aura", 'shield', 'true strike'],
            '2nd': ['blur', 'detect thoughts', 'spider climb', 'web'],
            '3rd': ['suggestion', 'tongues', 'water breathing'],
            '4th': ['polymorph'],
            '5th': ['mind fog'],
            '6th': ['repel wood', 'veil']
        }
    elif 'red' in category_lower:
        return {
            '0': ['arcane mark', 'dancing lights', 'guidance', 'mage hand', 'prestidigitation'],
            '1st': ['alarm', 'chill touch', 'divine favor', 'magic missile', 'shield'],
            '2nd': ['cat\'s grace', 'cure moderate wounds', 'darkness', 'detect thoughts', 'invisibility'],
            '3rd': ['deeper darkness', 'dispel magic', 'haste', 'protection from energy'],
            '4th': ['charm monster', 'crushing despair', 'restoration', 'spell immunity'],
            '5th': ['inflict light wounds, mass', 'feeblemind', 'shadow evocation'],
            '6th': ['acid fog', 'heal'],
            '7th': ['delayed blast fireball'],
            '8th': ['incendiary cloud'],
            '9th': ['meteor swarm']
        }
    elif 'white' in category_lower:
        return {
            '0': ['ray of frost', 'daze'],
            '1st': ['mage armor', 'obscuring mist'],
            '2nd': ['blur', 'shatter', 'spider climb'],
            '3rd': ['fireball', 'sleet storm'],
            '4th': ['ice storm', 'wall of ice'],
            '5th': ['cone of cold'],
            '6th': ['chain lightning', 'wall of iron'],
            '7th': ['delayed blast fireball'],
            '8th': ['polar ray'],
            '9th': ['meteor swarm']
        }
    elif 'brass' in category_lower:
        return {
            '0': ['dancing lights', 'mage hand', 'ray of frost', 'prestidigitation'],
            '1st': ['animate rope', 'charm person', 'comprehend languages', 'unseen servant'],
            '2nd': ['blur', 'cat\'s grace'],
            '3rd': ['fireball', 'fly', 'tongues'],
            '4th': ['fire shield'],
            '5th': ['cone of cold'],
            '6th': ['chain lightning', 'repel wood'],
            '7th': ['delayed blast fireball'],
            '8th': ['incendiary cloud'],
            '9th': ['meteor swarm']
        }
    elif 'bronze' in category_lower:
        return {
            '0': ['dancing lights', 'mage hand', 'ray of frost', 'read magic'],
            '1st': ['animate rope', 'magic missile', 'shield'],
            '2nd': ['blur', 'cat\'s grace'],
            '3rd': ['lightning bolt', 'protection from energy', 'tongues'],
            '5th': ['cone of cold'],
            '6th': ['chain lightning', 'wall of iron'],
            '7th': ['delayed blast fireball'],
            '8th': ['polar ray'],
            '9th': ['meteor swarm']
        }
    elif 'copper' in category_lower:
        return {
            '0': ['dancing lights', 'mage hand', 'prestidigitation'],
            '1st': ['charm person', 'comprehend languages', 'true strike', 'unseen servant'],
            '2nd': ['blur', 'spider climb'],
            '3rd': ['suggestion', 'tongues', 'water breathing'],
            '5th': ['cone of cold'],
            '6th': ['chain lightning', 'wall of iron']
        }
    elif 'gold' in category_lower:
        return {
            '0': ['arcane mark', 'flare', 'light', 'mage hand', 'prestidigitation', 'read magic'],
            '1st': ['charm person', 'magic missile', 'protection from evil', 'shield of faith', 'true strike'],
            '2nd': ['fog cloud', 'cure moderate wounds', 'resist energy'],
            '3rd': ['searing light', 'suggestion'],
            '5th': ['cone of cold'],
            '6th': ['chain lightning']
        }
    elif 'silver' in category_lower:
        return {
            '0': ['dancing lights', 'detect poison', 'mage hand', 'mending', 'prestidigitation'],
            '1st': ['chill touch', 'divine favor', 'protection from evil', 'unseen servant'],
            '2nd': ['cat\'s grace', 'cure moderate wounds'],
            '3rd': ['tongues'],
            '5th': ['cone of cold'],
            '6th': ['chain lightning']
        }
    
    return {}


def get_spell_lists_by_theme() -> Dict[str, Dict[str, List[str]]]:
    """
    Get all spell lists organized by theme (common, good, evil, fire, general pools).
    These are shared between generate_spell_list_by_pattern and fill_spell_list_to_required_count.
    
    Returns:
        Dict with keys: 'common', 'good', 'evil', 'fire', 'general_pools'
    """
    return {
        'common': {
            '0': ['detect magic', 'read magic', 'resistance', 'ghost sound'],
            '1st': ['magic missile', 'shield'],
            '2nd': ['invisibility'],
            '3rd': ['dispel magic', 'haste'],
            '4th': ['charm monster', 'confusion', 'dimension door', 'wall of fire'],
            '5th': ['dominate person', 'feeblemind', 'hold monster', 'teleport', 'wall of force'],
            '6th': ['disintegrate', 'dispel magic, greater', 'mass suggestion', 'true seeing'],
            '7th': ['power word blind', 'prismatic spray'],
            '8th': ['power word stun'],
            '9th': ['wish']
        },
        'good': {
            '1st': ['protection from evil', 'shield of faith'],
            '2nd': ['cure moderate wounds', 'resist energy'],
            '3rd': ['searing light', 'magic circle against evil'],
            '4th': ['freedom of movement', 'remove curse', 'polymorph'],
            '5th': ['teleport', 'hold monster'],
            '6th': ['heal'],
            '7th': ['holy word'],
            '8th': ['holy aura', 'sunburst'],
            '9th': ['gate', 'miracle']
        },
        'evil': {
            '1st': ['chill touch', 'command'],
            '2nd': ['darkness'],
            '3rd': ['deeper darkness', 'vampiric touch'],
            '4th': ['charm monster', 'confusion'],
            '5th': ['dominate person', 'feeblemind'],
            '6th': ['flesh to stone'],
            '7th': ['finger of death'],
            '8th': ['horrid wilting', 'trap the soul'],
            '9th': ['power word kill', 'wail of the banshee']
        },
        'fire': {
            '2nd': ['scorching ray', 'resist energy'],
            '3rd': ['fireball', 'searing light'],
            '4th': ['fire shield', 'wall of fire'],
            '5th': ['cone of cold'],  # Actually cold, but useful
            '6th': ['chain lightning'],
            '7th': ['delayed blast fireball', 'prismatic spray'],
            '8th': ['incendiary cloud', 'horrid wilting'],
            '9th': ['meteor swarm', 'wish']
        },
        'general_pools': {
            '0': ['arcane mark', 'daze', 'detect poison', 'disrupt undead', 'flare', 'ghost sound', 
                  'guidance', 'light', 'mending', 'message', 'open/close', 'prestidigitation'],
            '1st': ['alarm', 'charm person', 'comprehend languages', 'detect secret doors', 'disguise self',
                    'expeditious retreat', 'feather fall', 'grease', 'identify', 'jump', 'mage armor',
                    'obscuring mist', 'sleep', 'true strike', 'unseen servant', 'ventriloquism'],
            '2nd': ['alter self', 'blur', 'cat\'s grace', 'darkness', 'detect thoughts', 'eagle\'s splendor',
                    'fog cloud', 'invisibility', 'knock', 'levitate', 'mirror image', 'resist energy',
                    'scorching ray', 'see invisibility', 'spider climb', 'whispering wind'],
            '3rd': ['blink', 'dispel magic', 'fireball', 'fly', 'haste', 'hold person', 'invisibility sphere',
                    'lightning bolt', 'magic circle against evil', 'magic circle against good', 'protection from elements',
                    'suggestion', 'tongues', 'water breathing', 'wind wall'],
            '4th': ['charm monster', 'confusion', 'dimension door', 'fire shield', 'freedom of movement',
                    'greater invisibility', 'ice storm', 'lesser globe of invulnerability', 'phantasmal killer',
                    'polymorph', 'remove curse', 'stoneskin', 'wall of fire', 'wall of ice'],
            '5th': ['baleful polymorph', 'cone of cold', 'dominate person', 'feeblemind', 'hold monster',
                    'mind fog', 'overland flight', 'prying eyes', 'seeming', 'teleport', 'wall of force',
                    'wall of stone', 'waves of fatigue'],
            '6th': ['chain lightning', 'disintegrate', 'eyebite', 'flesh to stone', 'dispel magic, greater',
                    'mass suggestion', 'repel wood', 'stone to flesh', 'true seeing', 'veil', 'wall of iron'],
            '7th': ['delayed blast fireball', 'ethereal jaunt', 'finger of death', 'scrying, greater',
                    'mass hold person', 'power word blind', 'prismatic spray', 'reverse gravity', 'spell turning', 'holy word'],
            '8th': ['horrid wilting', 'incendiary cloud', 'mass charm', 'maze', 'polar ray', 'power word stun',
                    'sunburst', 'trap the soul'],
            '9th': ['astral projection', 'gate', 'meteor swarm', 'miracle', 'power word kill', 'prismatic sphere',
                    'time stop', 'wail of the banshee', 'wish']
        }
    }


def add_category_spells_to_dict(spell_dict: Dict[str, List[str]], category_spells: Dict[str, List[str]], 
                                 max_spell_level: int, sla_lower: List[str]) -> None:
    """
    Add category-specific spells to the spell dictionary, filtering by max spell level and excluding spell-like abilities.
    
    Args:
        spell_dict: Dictionary to add spells to
        category_spells: Dictionary mapping spell levels to lists of spells
        max_spell_level: Maximum spell level available at current caster level
        sla_lower: List of spell-like abilities (lowercase) to exclude
    """
    for level, spells in category_spells.items():
        # Calculate level number
        if level == '0':
            level_num = 0
        else:
            level_num = int(level[0])
        
        # Only add spells for levels that are available at this caster level
        # For 0th level, always allow. For other levels, only if level_num <= max_spell_level
        # This is a critical check - we must never add spells above max_spell_level
        if level_num > max_spell_level:
            # Explicitly skip levels above max_spell_level
            continue
        
        # For 0th level or levels <= max_spell_level, add the spells
        if level not in spell_dict:
            spell_dict[level] = []
        for spell in spells:
            if spell.lower() not in sla_lower and spell not in spell_dict[level]:
                spell_dict[level].append(spell)


def get_sorcerer_spells_known(caster_level: int) -> Dict[str, int]:
    """
    Get sorcerer spells known per level based on caster level.
    Uses standard D&D 3.5 sorcerer spells known table.
    
    Returns:
        Dict mapping spell level to number of spells known: {'0': 4, '1st': 2, ...}
    """
    # D&D 3.5 Sorcerer spells known progression
    # Format: (caster_level: {spell_level: spells_known})
    sorcerer_spells_known = {
        1: {'0': 4, '1st': 2},
        2: {'0': 5, '1st': 2},
        3: {'0': 5, '1st': 3},
        4: {'0': 6, '1st': 3, '2nd': 1},
        5: {'0': 6, '1st': 4, '2nd': 2},
        6: {'0': 7, '1st': 4, '2nd': 2, '3rd': 1},
        7: {'0': 7, '1st': 5, '2nd': 3, '3rd': 2},
        8: {'0': 8, '1st': 5, '2nd': 3, '3rd': 2, '4th': 1},
        9: {'0': 8, '1st': 5, '2nd': 4, '3rd': 3, '4th': 2},
        10: {'0': 9, '1st': 5, '2nd': 4, '3rd': 3, '4th': 2, '5th': 1},
        11: {'0': 9, '1st': 5, '2nd': 5, '3rd': 4, '4th': 3, '5th': 2},
        12: {'0': 9, '1st': 5, '2nd': 5, '3rd': 4, '4th': 3, '5th': 2, '6th': 1},
        13: {'0': 9, '1st': 5, '2nd': 5, '3rd': 4, '4th': 4, '5th': 3, '6th': 2},
        14: {'0': 9, '1st': 5, '2nd': 5, '3rd': 4, '4th': 4, '5th': 3, '6th': 2, '7th': 1},
        15: {'0': 9, '1st': 5, '2nd': 5, '3rd': 4, '4th': 4, '5th': 4, '6th': 3, '7th': 2},
        16: {'0': 9, '1st': 5, '2nd': 5, '3rd': 4, '4th': 4, '5th': 4, '6th': 3, '7th': 2, '8th': 1},
        17: {'0': 9, '1st': 5, '2nd': 5, '3rd': 4, '4th': 4, '5th': 4, '6th': 3, '7th': 3, '8th': 2},
        18: {'0': 9, '1st': 5, '2nd': 5, '3rd': 4, '4th': 4, '5th': 4, '6th': 3, '7th': 3, '8th': 2, '9th': 1},
        19: {'0': 9, '1st': 5, '2nd': 5, '3rd': 4, '4th': 4, '5th': 4, '6th': 3, '7th': 3, '8th': 3, '9th': 2},
        20: {'0': 9, '1st': 5, '2nd': 5, '3rd': 4, '4th': 4, '5th': 4, '6th': 3, '7th': 3, '8th': 3, '9th': 3},
    }
    
    # Clamp to valid range
    level = max(1, min(caster_level, 20))
    
    # Get spells known for this level
    spells_known = sorcerer_spells_known.get(level, {})
    
    # If level is higher than 20, use level 20 progression
    if caster_level > 20:
        spells_known = sorcerer_spells_known[20].copy()
    
    return spells_known


def generate_spell_list_by_pattern(caster_level: int, alignment: str, category_name: str, cha_score: int, 
                                   spell_like_abilities: Optional[List[str]] = None,
                                   previous_spells: Optional[Dict[str, List[str]]] = None) -> Dict[str, List[str]]:
    """
    Generate spell list when no example is available, using pattern-based selection.
    
    Args:
        caster_level: Sorcerer level (determines max spell level)
        alignment: "lawful good", "chaotic evil", etc. (affects spell selection)
        category_name: Dragon type (affects thematic spells)
        cha_score: Charisma score (for save DC calculation)
        spell_like_abilities: List of spell names available as spell-like abilities (to exclude)
        previous_spells: Previous age's spell list for cumulative progression
    
    Returns:
        Dict mapping spell levels to lists of spells: {'0': [...], '1st': [...], ...}
    """
    if spell_like_abilities is None:
        spell_like_abilities = []
    
    # Normalize spell-like abilities to lowercase for comparison
    sla_lower = [sla.lower() for sla in spell_like_abilities]
    
    # Get maximum spell level available at this caster level
    max_spell_level = get_max_spell_level_for_caster_level(caster_level)
    
    # Start with previous spells if available (cumulative progression)
    # Filter to only include spell levels available at this caster level
    spell_dict = {}
    if previous_spells:
        for level, spells in previous_spells.items():
            if level == '0':
                spell_dict[level] = spells.copy()
            else:
                level_num = int(level[0])
                if level_num <= max_spell_level:
                    spell_dict[level] = spells.copy()
    
    # Determine alignment type
    alignment_lower = alignment.lower()
    is_good = 'good' in alignment_lower
    is_evil = 'evil' in alignment_lower
    is_lawful = 'lawful' in alignment_lower
    is_chaotic = 'chaotic' in alignment_lower
    
    # Category-specific spell selection
    category_lower = category_name.lower()
    
    # Get shared spell lists
    spell_lists = get_spell_lists_by_theme()
    
    # PRIORITY ORDER: Category-specific spells FIRST (most important)
    category_spells = get_category_spells(category_name)
    if category_spells:
        add_category_spells_to_dict(spell_dict, category_spells, max_spell_level, sla_lower)
    
    # Then universal 0-level spells (always include these basics)
    # Some dragons prefer read magic (bronze, gold), others prefer resistance (black)
    if '0' not in spell_dict:
        spell_dict['0'] = []
    
    # Always add detect magic
    if 'detect magic' not in spell_dict['0'] and 'detect magic'.lower() not in sla_lower:
        spell_dict['0'].append('detect magic')
    
    # Check if category spells already include read magic
    category_has_read_magic = category_spells and 'read magic' in [s.lower() for s in category_spells.get('0', [])]
    has_read_magic = 'read magic' in spell_dict['0']
    has_resistance = 'resistance' in spell_dict['0']
    
    # Add read magic or resistance (but not both)
    if category_has_read_magic or has_read_magic:
        # Category wants read magic or it's already there - add read magic if not present
        if not has_read_magic and 'read magic'.lower() not in sla_lower:
            spell_dict['0'].append('read magic')
    else:
        # Category doesn't specify read magic - add resistance if not present
        if not has_resistance and 'resistance'.lower() not in sla_lower:
            spell_dict['0'].append('resistance')
    
    # Then alignment-based spells (common to all dragons of that alignment)
    if is_good:
        add_category_spells_to_dict(spell_dict, spell_lists['good'], max_spell_level, sla_lower)
    
    if is_evil:
        add_category_spells_to_dict(spell_dict, spell_lists['evil'], max_spell_level, sla_lower)
    
    # DO NOT add common spells here - they will be added during filling only if needed
    # This ensures category-specific spells take priority
    
    
    # Final filter BEFORE filling: remove any spell levels above the maximum available at this caster level
    # This ensures we don't pass invalid spell levels to fill_spell_list_to_required_count
    max_spell_level_final = get_max_spell_level_for_caster_level(caster_level)
    pre_filtered_dict = {}
    for level, spells in spell_dict.items():
        if level == '0':
            pre_filtered_dict[level] = spells
        else:
            level_num = int(level[0])
            if level_num <= max_spell_level_final:
                pre_filtered_dict[level] = spells
    spell_dict = pre_filtered_dict
    
    # Fill spell list to required numbers based on sorcerer spells known (separate from spell slots)
    spell_dict = fill_spell_list_to_required_count(spell_dict, caster_level, alignment, category_name, sla_lower)
    
    # Final filter: remove any spell levels above the maximum available at this caster level
    # (Double-check in case fill_spell_list_to_required_count added any invalid levels)
    filtered_dict = {}
    for level, spells in spell_dict.items():
        if level == '0':
            filtered_dict[level] = spells
        else:
            level_num = int(level[0])
            if level_num <= max_spell_level_final:
                filtered_dict[level] = spells
    
    return filtered_dict


def fill_spell_list_to_required_count(spell_dict: Dict[str, List[str]], caster_level: int, 
                                      alignment: str, category_name: str, 
                                      sla_lower: List[str]) -> Dict[str, List[str]]:
    """
    Fill spell list to required counts based on sorcerer spells known table.
    Uses the spells known table (separate from spell slots per day).
    Uses appropriate spells from 3.5e Player's Handbook based on alignment and category.
    
    Args:
        spell_dict: Current spell dictionary
        caster_level: Sorcerer caster level
        alignment: Dragon alignment
        category_name: Dragon category
        sla_lower: List of spell-like abilities (lowercase) to exclude
    
    Returns:
        Filled spell dictionary with required number of spells per level (capped to spells known)
    """
    # Get required spell counts based on sorcerer spells known (not spell slots)
    spells_known = get_sorcerer_spells_known(caster_level)
    
    alignment_lower = alignment.lower()
    is_good = 'good' in alignment_lower
    is_evil = 'evil' in alignment_lower
    is_lawful = 'lawful' in alignment_lower
    is_chaotic = 'chaotic' in alignment_lower
    category_lower = category_name.lower()
    
    # Get shared spell lists
    spell_lists = get_spell_lists_by_theme()
    spell_pools = spell_lists['general_pools']
    good_spells_by_level = spell_lists['good']
    evil_spells_by_level = spell_lists['evil']
    fire_spells_by_level = spell_lists['fire']
    common_spells_by_level = spell_lists['common']
    
    # Get maximum spell level available at this caster level
    max_spell_level = get_max_spell_level_for_caster_level(caster_level)
    
    # First, remove any spell levels above the maximum available at this caster level
    # This ensures we don't keep spells from previous ages that are no longer valid
    filtered_dict = {}
    for level, spells in spell_dict.items():
        if level == '0':
            filtered_dict[level] = spells
        else:
            level_num = int(level[0])
            if level_num <= max_spell_level:
                filtered_dict[level] = spells
    spell_dict = filtered_dict
    
    # Fill each level to required count based on sorcerer spells known
    for level in ['0', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th']:
        # Check if this level is available at this caster level
        if level == '0':
            level_num = 0
        else:
            level_num = int(level[0])
        
        # Only include spell levels available at this caster level
        if level_num > max_spell_level:
            continue
        
        # Get required count from sorcerer spells known table
        required_count = spells_known.get(level, 0)
        
        # Skip if this level isn't available at this caster level
        if required_count == 0:
            continue
        
        if level not in spell_dict:
            spell_dict[level] = []
        
        current_count = len(spell_dict[level])
        
        if current_count < required_count:
            needed = required_count - current_count
            
            # Build candidate list with priority order:
            # 1. Category-specific spells (already added, but check for more)
            # 2. Alignment-based spells
            # 3. Fire-themed spells (for brass/red)
            # 4. General pool spells
            candidates = []
            
            # Get category-specific spells for this category
            category_spells_dict = get_category_spells(category_name)
            category_spells_for_level = category_spells_dict.get(level, [])
            
            # Priority 1: Category-specific spells (if not already in list)
            for spell in category_spells_for_level:
                if spell.lower() not in sla_lower and spell not in spell_dict[level] and spell not in candidates:
                    candidates.append(spell)
            
            # Priority 2: Alignment-based spells (but only if category doesn't already have enough)
            # Only add alignment spells if we still need more and category spells are exhausted
            if len(candidates) < needed:
                if is_good and level in good_spells_by_level:
                    for spell in good_spells_by_level[level]:
                        if spell.lower() not in sla_lower and spell not in spell_dict[level] and spell not in candidates:
                            candidates.append(spell)
                
                if is_evil and level in evil_spells_by_level:
                    for spell in evil_spells_by_level[level]:
                        if spell.lower() not in sla_lower and spell not in spell_dict[level] and spell not in candidates:
                            candidates.append(spell)
            
            # Priority 3: Fire-themed spells for brass/red (if still needed)
            if len(candidates) < needed and ('brass' in category_lower or 'red' in category_lower) and level in fire_spells_by_level:
                for spell in fire_spells_by_level[level]:
                    if spell.lower() not in sla_lower and spell not in spell_dict[level] and spell not in candidates:
                        candidates.append(spell)
            
            # Priority 4: Common dragon spells (if still needed)
            if len(candidates) < needed and level in common_spells_by_level:
                for spell in common_spells_by_level[level]:
                    if spell.lower() not in sla_lower and spell not in spell_dict[level] and spell not in candidates:
                        candidates.append(spell)
            
            # Priority 5: Universal 0-level spells (detect magic, resistance, read magic) if 0th level
            if level == '0' and len(candidates) < needed:
                universal_0 = ['detect magic', 'resistance', 'read magic']
                for spell in universal_0:
                    if spell.lower() not in sla_lower and spell not in spell_dict[level] and spell not in candidates:
                        candidates.append(spell)
            
            # Priority 6: General pool spells (last resort)
            if len(candidates) < needed and level in spell_pools:
                for spell in spell_pools[level]:
                    if spell.lower() not in sla_lower and spell not in spell_dict[level] and spell not in candidates:
                        candidates.append(spell)
            
            # Add needed spells
            for spell in candidates[:needed]:
                spell_dict[level].append(spell)
    
    return spell_dict


def merge_spell_lists(previous_spells: Dict[str, List[str]], new_spells: Dict[str, List[str]], 
                      new_caster_level: int) -> Dict[str, List[str]]:
    """
    Merge previous age's spells with new spells for cumulative progression.
    
    Args:
        previous_spells: Previous age's spell list
        new_spells: New spells to add
        new_caster_level: New caster level (determines max spell level)
    
    Returns:
        Merged spell list with all previous spells plus new ones (filtered to max spell level)
    """
    # Get maximum spell level available at this caster level
    max_spell_level = get_max_spell_level_for_caster_level(new_caster_level)
    
    merged = {}
    
    # Keep spells from previous list, but only those within the max spell level
    for level, spells in previous_spells.items():
        if level == '0':
            merged[level] = spells.copy()
        else:
            level_num = int(level[0])
            if level_num <= max_spell_level:
                merged[level] = spells.copy()
    
    # Add new spells that aren't already present
    for level, spells in new_spells.items():
        # Check if this spell level is valid for the new caster level
        if level == '0':
            if level not in merged:
                merged[level] = []
            for spell in spells:
                if spell not in merged[level]:
                    merged[level].append(spell)
        else:
            level_num = int(level[0])
            if level_num <= max_spell_level:
                if level not in merged:
                    merged[level] = []
                for spell in spells:
                    if spell not in merged[level]:
                        merged[level].append(spell)
    
    return merged


def get_spell_level_from_name(spell_name: str) -> Optional[int]:
    """
    Get spell level (0-9) for a spell name by looking it up in spell lists.
    Returns None if spell not found.
    """
    spell_lists = get_spell_lists_by_theme()
    spell_name_lower = spell_name.lower()
    
    # Check all spell lists
    all_lists = [
        spell_lists['common'],
        spell_lists['good'],
        spell_lists['evil'],
        spell_lists['fire'],
        spell_lists['general_pools']
    ]
    
    for spell_dict in all_lists:
        for level, spells in spell_dict.items():
            if spell_name_lower in [s.lower() for s in spells]:
                if level == '0':
                    return 0
                else:
                    return int(level[0])
    
    return None


def format_typical_sorcerer_spells_known(spell_list: Dict[str, List[str]], caster_level: int, cha_score: int) -> str:
    """
    Format spell list into "Typical Sorcerer Spells Known" PREPEDSPELLS block format.
    
    Args:
        spell_list: Dict mapping spell levels to lists of spells: {'0': [...], '1st': [...], ...}
        caster_level: Sorcerer caster level
        cha_score: Charisma score (for save DC calculation)
    
    Returns:
        Formatted PREPEDSPELLS block content with title on first line and content on second line indented 4 spaces.
        Format: "Typical Sorcerer Spells Known\n    (5/4; save DC 12 + spell level): 0--detect magic, read magic, ..."
    """
    # Get maximum spell level available at this caster level
    max_spell_level = get_max_spell_level_for_caster_level(caster_level)
    
    # Filter spell_list to only include valid spell levels (safety check)
    filtered_spell_list = {}
    for level, spells in spell_list.items():
        if level == '0':
            filtered_spell_list[level] = spells
        else:
            level_num = int(level[0])
            if level_num <= max_spell_level:
                filtered_spell_list[level] = spells
    
    # Get spell slots per level (for display in parentheses)
    slots = get_sorcerer_spell_slots(caster_level)
    
    # Get spells known per level (to limit displayed spells)
    spells_known = get_sorcerer_spells_known(caster_level)
    
    # Calculate save DC base (10 + Cha modifier)
    cha_mod = get_ability_modifier(cha_score)
    save_dc_base = 10 + cha_mod
    
    # Build spell slots string (e.g., "5/3" or "6/6/3")
    slot_parts = []
    level_order = ['0', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th']
    for level in level_order:
        if level in slots:
            slot_parts.append(str(slots[level]))
    
    slots_str = '/'.join(slot_parts)
    
    # Build spell list string, limiting to spells known count
    spell_parts = []
    for level in level_order:
        if level in filtered_spell_list and filtered_spell_list[level]:
            # Limit to the number of spells known for this level
            max_spells = spells_known.get(level, 0)
            spells_to_show = filtered_spell_list[level][:max_spells] if max_spells > 0 else filtered_spell_list[level]
            if spells_to_show:
                spells_str = ', '.join(spells_to_show)
                spell_parts.append(f"{level}--{spells_str}")
    
    spells_str = '; '.join(spell_parts)
    
    # Format: Title on first line, content on second line with 4 spaces indentation
    # Include save DC in parentheses: "save DC XX + spell level"
    return f"Typical Sorcerer Spells Known\n    ({slots_str}; save DC {save_dc_base} + spell level): {spells_str}"


def generate_statblock(
    age: str,
    category_name: str,
    stats_row: Dict,
    abilities_row: Dict,
    universal_tables: Dict[str, Dict],
    category_metadata: Dict,
    breath_weapon_shape: str,
    breath_weapon_type: str = '',
    abilities_table: Optional[Dict] = None,
    category_class_skills: Optional[List[str]] = None,
    previous_feats: Optional[List[str]] = None,
    category_name_for_feats: str = '',
    category_skill_priorities: Optional[List[str]] = None,
    target_skill_ranks: Optional[Dict[str, int]] = None,
    previous_skill_ranks: Optional[Dict[str, int]] = None,
    example_age: Optional[str] = None,
    current_age_for_skills: Optional[str] = None
) -> str:
    """
    Generate a statblock for a dragon variant.
    
    Returns the statblock as a formatted string with full labels.
    """
    statblock_lines = []
    
    # Type (name is in VARIANT tag, not in STATBLOCK)
    size_abbr = stats_row.get('Size', '').strip()
    size_full = get_size_from_abbreviation(size_abbr)
    type_line = category_metadata.get('type', 'Dragon')
    statblock_lines.append(f"{size_full} {type_line}")
    
    # Hit Dice
    hd_text = stats_row.get('Hit Dice (hp)', '').strip()
    statblock_lines.append(f"Hit Dice: {hd_text}")
    
    # Calculate feats early so we can use them for AC, attack, and initiative adjustments
    feats_text = calculate_feats(stats_row, size_abbr, abilities_row, previous_feats, category_name_for_feats)
    
    # Initiative - adjust for Improved Initiative feat (+4 bonus)
    init = abilities_row.get('Initiative', '').strip()
    if 'Improved Initiative' in feats_text:
        # Parse current initiative value and add +4
        init_match = re.search(r'([+\-]?\d+)', init)
        if init_match:
            current_init = int(init_match.group(1))
            new_init = current_init + 4
            init = f"+{new_init}" if new_init >= 0 else str(new_init)
    statblock_lines.append(f"Initiative: {init}")
    
    # Speed
    speed = abilities_row.get('Speed', '').strip()
    statblock_lines.append(f"Speed: {speed}")
    has_improved_natural_armor = 'Improved Natural Armor' in feats_text
    has_multiattack = 'Multiattack' in feats_text
    weapon_focus_weapons = parse_weapon_focus_feats(feats_text)
    improved_natural_attack_weapons = parse_improved_natural_attack_feats(feats_text)
    
    # Calculate size modifier
    size_mod = get_size_modifier(size_full)
    
    # Armor Class - adjust for Improved Natural Armor
    ac = abilities_row.get('AC', '').strip()
    if has_improved_natural_armor and ac:
        # Parse AC line: "24 (-1 size, +15 natural), touch 9, flat-footed 24"
        # Extract natural armor bonus and increment it
        ac_match = re.search(r'(\d+)\s*\([^)]*\+(\d+)\s+natural[^)]*\)', ac)
        if ac_match:
            total_ac = int(ac_match.group(1))
            natural_bonus = int(ac_match.group(2))
            new_natural_bonus = natural_bonus + 1
            new_total_ac = total_ac + 1
            
            # Reconstruct AC line with new values
            # Replace the natural bonus in parentheses
            ac = re.sub(r'\+(\d+)\s+natural', f'+{new_natural_bonus} natural', ac)
            # Replace total AC at the start
            ac = re.sub(r'^\d+', str(new_total_ac), ac)
            # Update flat-footed AC if it matches the original total
            flat_footed_match = re.search(r'flat-footed\s+(\d+)', ac)
            if flat_footed_match and int(flat_footed_match.group(1)) == total_ac:
                ac = re.sub(r'flat-footed\s+\d+', f'flat-footed {new_total_ac}', ac)
    
    statblock_lines.append(f"Armor Class: {ac}")
    
    # Base Attack/Grapple
    base_attack = stats_row.get('Base Attack/ Grapple', '').strip()
    statblock_lines.append(f"Base Attack/Grapple: {base_attack}")
    
    # Calculate Strength modifier
    str_val = stats_row.get('Str', '').strip()
    try:
        str_num = int(str_val)
        str_mod = (str_num - 10) // 2
    except (ValueError, TypeError):
        str_mod = 0
    
    # Parse Base Attack to get the number
    base_attack_text = stats_row.get('Base Attack/ Grapple', '').strip()
    base_attack_num = 0
    if base_attack_text:
        base_attack_match = re.search(r'\+(\d+)', base_attack_text)
        if base_attack_match:
            base_attack_num = int(base_attack_match.group(1))
    
    # Attack - calculate from universal table
    # Size modifier affects attack rolls (larger creatures have penalty, smaller have bonus)
    # size_mod is negative for Large+, so we add it directly (negative + negative = more negative)
    space_reach_table = universal_tables.get('Dragon Space/Reach, Attacks, and Damage')
    if space_reach_table:
        # Determine secondary attack penalty: -5 normally, -2 with Multiattack
        secondary_penalty = -2 if has_multiattack else -5
        
        # Calculate single attack (bite)
        bite_attack = calculate_weapon_attack(
            weapon_name='bite',
            table_column='1 Bite',
            display_name='bite',
            is_secondary=False,
            base_attack_num=base_attack_num,
            str_mod=str_mod,
            size_mod=size_mod,
            secondary_penalty=secondary_penalty,
            weapon_focus_weapons=weapon_focus_weapons,
            improved_natural_attack_weapons=improved_natural_attack_weapons,
            space_reach_table=space_reach_table,
            size_abbr=size_abbr
        )
        
        if bite_attack:
            # Extract just the attack part (remove "bite +X melee (Y)" -> "bite +X melee (Y)")
            statblock_lines.append(f"Attack: {bite_attack}")
        else:
            # Fallback to table value
            attack = stats_row.get('Attack', '').strip()
            if attack:
                statblock_lines.append(f"Attack: {attack}")
    else:
        # Fallback to table value
        attack = stats_row.get('Attack', '').strip()
        if attack:
            statblock_lines.append(f"Attack: {attack}")
    
    # Full Attack - calculate from universal table
    if space_reach_table:
        # Determine secondary attack penalty: -5 normally, -2 with Multiattack
        secondary_penalty = -2 if has_multiattack else -5
        
        # Define weapons in order: (weapon_name, table_column, display_name, is_secondary)
        weapons = [
            ('bite', '1 Bite', 'bite', False),
            ('claw', '2 Claws', '2x claws', True),
            ('wing', '2 Wings', '2x wings', True),
            ('tail', '1 Tail Slap', 'tail slap', True),
        ]
        
        full_attack_parts = []
        for weapon_name, table_column, display_name, is_secondary in weapons:
            attack_str = calculate_weapon_attack(
                weapon_name=weapon_name,
                table_column=table_column,
                display_name=display_name,
                is_secondary=is_secondary,
                base_attack_num=base_attack_num,
                str_mod=str_mod,
                size_mod=size_mod,
                secondary_penalty=secondary_penalty,
                weapon_focus_weapons=weapon_focus_weapons,
                improved_natural_attack_weapons=improved_natural_attack_weapons,
                space_reach_table=space_reach_table,
                size_abbr=size_abbr
            )
            if attack_str:
                full_attack_parts.append(attack_str)
        
        if full_attack_parts:
            statblock_lines.append(f"Full Attack: {', '.join(full_attack_parts)}")
    
    # Space/Reach
    if space_reach_table:
        space_reach = get_table_value_by_size(space_reach_table, size_abbr, 'Space/Reach*')
        if space_reach:
            statblock_lines.append(f"Space/Reach: {space_reach}")
    
    # Special Attacks
    special_attacks = []
    breath_dc = stats_row.get('Breath Weapon (DC)', '').strip()
    if breath_dc and breath_dc != '--':
        special_attacks.append('breath weapon')
    fp_dc = stats_row.get('Frightful Presence DC', '').strip()
    if fp_dc and fp_dc != '--':
        special_attacks.append('frightful presence')
    
    # Add Crush if size is Huge or larger
    if size_full in ['Huge', 'Gargantuan', 'Colossal']:
        special_attacks.append('crush')
    
    # Add Snatch if the variant has the Snatch feat
    if 'Snatch' in feats_text:
        special_attacks.append('snatch')
    
    # Add Tail Sweep if size is Gargantuan or larger
    if size_full in ['Gargantuan', 'Colossal']:
        special_attacks.append('tail sweep')
    
    # Add spell-like abilities from Special Abilities column
    # Abilities accumulate - check current age and all previous ages
    all_abilities_text = ''
    if abilities_table and abilities_table.get('rows'):
        current_age_index = AGE_CATEGORIES.index(age) if age in AGE_CATEGORIES else -1
        # Collect abilities from current age and all previous ages
        for i in range(current_age_index + 1):
            if i < len(abilities_table['rows']):
                row_age = abilities_table['rows'][i].get('Age', '').strip()
                if row_age.lower() == AGE_CATEGORIES[i].lower():
                    row_abilities = abilities_table['rows'][i].get('Special Abilities', '').strip()
                    if row_abilities:
                        all_abilities_text += ' ' + row_abilities
    else:
        # Fallback to just current row
        special_abilities = abilities_row.get('Special Abilities', '').strip()
        all_abilities_text = special_abilities if special_abilities else ''
    
    all_abilities_text = all_abilities_text.lower()
    
    # Track if we have any spell-like abilities
    has_spell_like_abilities = False
    
    # Check for spell-like abilities that should be in Special Attacks
    if 'darkness' in all_abilities_text:
        # Just list "darkness" in Special Attacks (radius note goes in Spell-Like Abilities SA block)
        special_attacks.append('darkness')
        has_spell_like_abilities = True
    if 'corrupt water' in all_abilities_text:
        special_attacks.append('corrupt water')
        has_spell_like_abilities = True
    if 'plant growth' in all_abilities_text:
        special_attacks.append('plant growth')
        has_spell_like_abilities = True
    if 'insect plague' in all_abilities_text:
        special_attacks.append('insect plague')
        has_spell_like_abilities = True
    if 'charm reptiles' in all_abilities_text:
        special_attacks.append('charm reptiles')
        has_spell_like_abilities = True
    
    # Check for other spell-like abilities in cumulative abilities
    # These should be added individually to Special Attacks
    if abilities_table:
        cumulative_abilities = get_cumulative_abilities_for_age(age, abilities_table)
        for ability in cumulative_abilities:
            ability_lower = ability.lower().strip()
            # Common spell-like abilities that should be listed individually
            # Note: "speak with animals" is NOT listed individually - it's only in "spell-like abilities"
            if ability_lower in ['create/destroy water', 'sound imitation']:
                if ability_lower not in [sa.lower() for sa in special_attacks]:
                    special_attacks.append(ability_lower)
                    has_spell_like_abilities = True
            # "speak with animals" and other spell-like abilities are covered by "spell-like abilities" entry
            elif ability_lower in ['speak with animals']:
                has_spell_like_abilities = True
            # Check for other spell-like abilities (like "Suggestion")
            # These are typically spell-like abilities if they're not standard dragon abilities
            elif ability_lower in ['suggestion', 'ventriloquism', 'hallucinatory terrain', 'veil', 'mirage arcana']:
                has_spell_like_abilities = True
    
    # Check Spell-Like Abilities metadata to see if there are any abilities at this age
    # (including "At will" abilities that are always available)
    spell_like_abilities_text = category_metadata.get('spell_like_abilities', '').strip()
    if spell_like_abilities_text:
        # Check for "At will" abilities (always available)
        if re.search(r'at\s+will', spell_like_abilities_text, re.IGNORECASE):
            has_spell_like_abilities = True
        # Check for abilities with age requirements that match this age
        # Parse the text to see if any abilities are available at this age
        template_clean = spell_like_abilities_text.rstrip('.').strip()
        # Split by semicolon to get frequency groups
        parts = []
        current_part = ""
        paren_depth = 0
        for char in template_clean:
            if char == '(':
                paren_depth += 1
                current_part += char
            elif char == ')':
                paren_depth -= 1
                current_part += char
            elif char == ';' and paren_depth == 0:
                if current_part.strip():
                    parts.append(current_part.strip())
                current_part = ""
            else:
                current_part += char
        if current_part.strip():
            parts.append(current_part.strip())
        
        # Check each part for abilities available at this age
        for part in parts:
            part = part.strip()
            if not part:
                continue
            # Check if this part starts with a frequency (including "At will")
            freq_match = re.match(r'(\d+/day|At will)--(.+)', part, re.IGNORECASE)
            if freq_match:
                frequency = freq_match.group(1)
                abilities_text_part = freq_match.group(2)
                # If it's "At will", all abilities are available
                if frequency.lower() == 'at will':
                    has_spell_like_abilities = True
                    break
                # Otherwise, check if any abilities have age requirements that match
                # Split by comma to get individual abilities
                ability_parts = []
                current_ability = ""
                paren_depth = 0
                for char in abilities_text_part:
                    if char == '(':
                        paren_depth += 1
                        current_ability += char
                    elif char == ')':
                        paren_depth -= 1
                        current_ability += char
                    elif char == ',' and paren_depth == 0:
                        if current_ability.strip():
                            ability_parts.append(current_ability.strip())
                        current_ability = ""
                    else:
                        current_ability += char
                if current_ability.strip():
                    ability_parts.append(current_ability.strip())
                
                # Check if any ability matches this age
                for ability_part in ability_parts:
                    ability_match = re.match(r'([^(]+)\(([^)]+)\)', ability_part)
                    if ability_match:
                        details = ability_match.group(2)
                        if check_age_requirement(age, details.lower()):
                            has_spell_like_abilities = True
                            break
                if has_spell_like_abilities:
                    break
    
    # Add "spell-like abilities" to the list if we have any spell-like abilities
    # This is a catch-all term for spell-like abilities
    if has_spell_like_abilities:
        special_attacks.append('spell-like abilities')
    
    # Add spells if caster level is present
    caster_level = abilities_row.get('Caster Level', '').strip()
    if caster_level and caster_level != '--':
        special_attacks.append('spells')
    
    if special_attacks:
        statblock_lines.append(f"Special Attacks: {', '.join(special_attacks)}")
    
    # Special Qualities - build from standard dragon abilities + table data
    special_qualities = []
    
    # Standard dragon abilities (all dragons have these)
    special_qualities.append('blindsense 60 ft.')
    special_qualities.append('darkvision 120 ft.')
    
    # Extract immunity from Special Abilities column (category-specific)
    # Format is typically "Immunity to [element], [other abilities]"
    # All dragons have immunity to sleep and paralysis
    immunity_text = ''
    if all_abilities_text:
        # Look for immunity pattern: "immunity to [element]" or "Immunity to [element]"
        immunity_match = re.search(r'immunity\s+to\s+([^,]+)', all_abilities_text, re.IGNORECASE)
        if immunity_match:
            immunity_element = immunity_match.group(1).strip()
            # Split on "and" to handle "acid and cold" -> ["acid", "cold"]
            immunity_elements = [e.strip() for e in re.split(r'\s+and\s+', immunity_element, flags=re.IGNORECASE)]
            # Combine with sleep and paralysis, format as comma-separated list with "and" before last
            all_immunity_elements = immunity_elements + ['sleep', 'paralysis']
            if len(all_immunity_elements) == 1:
                immunity_text = f'immunity to {all_immunity_elements[0]}'
            elif len(all_immunity_elements) == 2:
                immunity_text = f'immunity to {all_immunity_elements[0]} and {all_immunity_elements[1]}'
            else:
                # Format: "immunity to acid, cold, sleep, and paralysis"
                immunity_text = f'immunity to {", ".join(all_immunity_elements[:-1])}, and {all_immunity_elements[-1]}'
        else:
            # Fallback: check if it's in the original (non-lowercased) abilities text
            # Rebuild original abilities text for this check
            original_abilities_text = ''
            if abilities_table and abilities_table.get('rows'):
                current_age_index = AGE_CATEGORIES.index(age) if age in AGE_CATEGORIES else -1
                for i in range(current_age_index + 1):
                    if i < len(abilities_table['rows']):
                        row_age = abilities_table['rows'][i].get('Age', '').strip()
                        if row_age.lower() == AGE_CATEGORIES[i].lower():
                            row_abilities = abilities_table['rows'][i].get('Special Abilities', '').strip()
                            if row_abilities:
                                original_abilities_text += ' ' + row_abilities
            
            if not original_abilities_text:
                special_abilities = abilities_row.get('Special Abilities', '').strip()
                original_abilities_text = special_abilities if special_abilities else ''
            
            immunity_match = re.search(r'[Ii]mmunity\s+to\s+([^,]+)', original_abilities_text)
            if immunity_match:
                immunity_element = immunity_match.group(1).strip()
                # Split on "and" to handle "acid and cold" -> ["acid", "cold"]
                immunity_elements = [e.strip() for e in re.split(r'\s+and\s+', immunity_element, flags=re.IGNORECASE)]
                # Combine with sleep and paralysis, format as comma-separated list with "and" before last
                all_immunity_elements = immunity_elements + ['sleep', 'paralysis']
                if len(all_immunity_elements) == 1:
                    immunity_text = f'immunity to {all_immunity_elements[0]}'
                elif len(all_immunity_elements) == 2:
                    immunity_text = f'immunity to {all_immunity_elements[0]} and {all_immunity_elements[1]}'
                else:
                    # Format: "immunity to acid, cold, sleep, and paralysis"
                    immunity_text = f'immunity to {", ".join(all_immunity_elements[:-1])}, and {all_immunity_elements[-1]}'
    
    # If no immunity found in table, default to acid (for Black dragons)
    if not immunity_text:
        immunity_text = 'immunity to acid, sleep, and paralysis'
    
    special_qualities.append(immunity_text)
    special_qualities.append('low-light vision')
    
    # Add water breathing if it's in cumulative abilities or if it's a water dragon
    has_water_breathing = False
    if abilities_table:
        cumulative_abilities = get_cumulative_abilities_for_age(age, abilities_table)
        for ability in cumulative_abilities:
            if 'water breathing' in ability.lower():
                has_water_breathing = True
                break
    if has_water_breathing or 'water' in type_line.lower():
        special_qualities.append('water breathing')
    
    # Add spell resistance if present
    sr = abilities_row.get('SR', '').strip()
    if sr and sr != '--':
        special_qualities.append(f'spell resistance {sr}')
    
    # Add damage reduction and other special abilities from table
    # Check cumulative abilities directly to avoid parsing issues with concatenated text
    if abilities_table:
        cumulative_abilities = get_cumulative_abilities_for_age(age, abilities_table)
        vulnerability_added = False
        
        # Find the maximum DR value (DR increases with age, so we need the highest)
        max_dr_value = 0
        for ability in cumulative_abilities:
            ability_lower = ability.lower().strip()
            dr_match = re.search(r'dr\s+(\d+)/magic', ability_lower, re.IGNORECASE)
            if dr_match:
                dr_value = int(dr_match.group(1))
                if dr_value > max_dr_value:
                    max_dr_value = dr_value
        
        # Add DR if we found one
        if max_dr_value > 0:
            special_qualities.append(f'damage reduction {max_dr_value}/magic')
        
        for ability in cumulative_abilities:
            ability_lower = ability.lower().strip()
            
            # Extract vulnerability if present (only once)
            if not vulnerability_added and 'vulnerability to' in ability_lower:
                # Extract just the vulnerability part (stop at comma or end)
                vuln_match = re.search(r'vulnerability\s+to\s+([^,]+)', ability_lower)
                if vuln_match:
                    vulnerability_type = vuln_match.group(1).strip()
                    # Remove any trailing ability keywords that might have been captured
                    vulnerability_type = re.sub(r'\s+(feather\s+fall|fog\s+cloud|dr\s+\d+|damage\s+reduction|alternate\s+form|cloudwalking|icewalking|spider\s+climb).*$', '', vulnerability_type, flags=re.IGNORECASE)
                    if vulnerability_type:
                        special_qualities.append(f'vulnerability to {vulnerability_type}')
                        vulnerability_added = True
                        continue
            
            # Skip abilities already handled or that go in Special Attacks
            if any(skip in ability_lower for skip in ['immunity', 'damage reduction', 'dr ', 'vulnerability', 
                                                      'caster level', 'sr', 'water breathing', 'alternate form',
                                                      'darkness', 'corrupt water', 'plant growth', 'insect plague',
                                                      'charm reptiles', 'suggestion', 'speak with animals',
                                                      'create food and water', 'fog cloud', 'detect thoughts',
                                                      'control water', 'control weather', 'endure elements',
                                                      'feather fall', 'bless', 'geas/quest', 'detect gems']):
                continue
            
            # Add special qualities that aren't spell-like abilities
            if ability_lower in ['icewalking', 'spider climb', 'cloudwalking', 'luck bonus']:
                # Use lowercase for consistency with examples
                special_qualities.append(ability_lower)
        
        # Extract alternate form if present (check all_abilities_text as fallback)
        if not any('alternate form' in sq.lower() for sq in special_qualities):
            if re.search(r'\balternate\s+form\b', all_abilities_text, re.IGNORECASE):
                special_qualities.append('alternate form')
    
    if special_qualities:
        statblock_lines.append(f"Special Qualities: {', '.join(special_qualities)}")
    
    # Saves
    fort_save = stats_row.get('Fort Save', '').strip()
    ref_save = stats_row.get('Ref Save', '').strip()
    will_save = stats_row.get('Will Save', '').strip()
    
    # Adjust Ref save for Lightning Reflexes feat (+2 bonus)
    if 'Lightning Reflexes' in feats_text and ref_save:
        # Parse current Ref save value and add +2
        ref_match = re.search(r'([+\-]?\d+)', ref_save)
        if ref_match:
            current_ref = int(ref_match.group(1))
            new_ref = current_ref + 2
            # Preserve any additional notes in parentheses (e.g., "(+18 against poison)")
            ref_save_notes_match = re.search(r'(\s*\(.+\))', ref_save)
            ref_save_notes = ref_save_notes_match.group(1) if ref_save_notes_match else ''
            ref_save = f"+{new_ref}{ref_save_notes}" if new_ref >= 0 else f"{new_ref}{ref_save_notes}"
    
    # Adjust Will save for Iron Will feat (+2 bonus)
    if 'Iron Will' in feats_text and will_save:
        # Parse current Will save value and add +2
        will_match = re.search(r'([+\-]?\d+)', will_save)
        if will_match:
            current_will = int(will_match.group(1))
            new_will = current_will + 2
            # Preserve any additional notes in parentheses
            will_save_notes_match = re.search(r'(\s*\(.+\))', will_save)
            will_save_notes = will_save_notes_match.group(1) if will_save_notes_match else ''
            will_save = f"+{new_will}{will_save_notes}" if new_will >= 0 else f"{new_will}{will_save_notes}"
    
    saves_parts = []
    if fort_save:
        saves_parts.append(f"Fort {fort_save}")
    if ref_save:
        saves_parts.append(f"Ref {ref_save}")
    if will_save:
        saves_parts.append(f"Will {will_save}")
    if saves_parts:
        statblock_lines.append(f"Saves: {', '.join(saves_parts)}")
    
    # Abilities (str_val already defined above for calculations)
    dex_val = stats_row.get('Dex', '').strip()
    con_val = stats_row.get('Con', '').strip()
    int_val = stats_row.get('Int', '').strip()
    wis_val = stats_row.get('Wis', '').strip()
    cha_val = stats_row.get('Cha', '').strip()
    abilities_parts = []
    if str_val:
        abilities_parts.append(f"Str {str_val}")
    if dex_val:
        abilities_parts.append(f"Dex {dex_val}")
    if con_val:
        abilities_parts.append(f"Con {con_val}")
    if int_val:
        abilities_parts.append(f"Int {int_val}")
    if wis_val:
        abilities_parts.append(f"Wis {wis_val}")
    if cha_val:
        abilities_parts.append(f"Cha {cha_val}")
    if abilities_parts:
        statblock_lines.append(f"Abilities: {', '.join(abilities_parts)}")
    
    # Skills
    if category_class_skills is None:
        category_class_skills = []
    if target_skill_ranks is None:
        target_skill_ranks = {}
    if previous_skill_ranks is None:
        previous_skill_ranks = {}
    # Get size for Hide skill size modifier
    size_abbr = stats_row.get('Size', '').strip()
    size_full = get_size_from_abbreviation(size_abbr)
    
    skills_text = calculate_skills(stats_row, abilities_row, category_class_skills, category_skill_priorities, 
                                   target_skill_ranks, previous_skill_ranks, example_age, current_age_for_skills or age, size_full)
    if skills_text:
        statblock_lines.append(f"Skills: {skills_text}")
    
    # Feats (already calculated above for AC and attack adjustments)
    if feats_text:
        statblock_lines.append(f"Feats: {feats_text}")
    
    # Environment
    env = category_metadata.get('environment', '').strip()
    if env:
        statblock_lines.append(f"Environment: {env}")
    
    # Organization
    org = category_metadata.get('organization', {})
    if isinstance(org, dict):
        org_value = org.get(age, '').strip()
        if org_value:
            statblock_lines.append(f"Organization: {org_value}")
    elif org:
        statblock_lines.append(f"Organization: {org}")
    
    # Challenge Rating
    cr = category_metadata.get('challenge_rating', {})
    if isinstance(cr, dict):
        cr_value = cr.get(age, '').strip()
        if cr_value:  # Only add if there's a non-empty value
            statblock_lines.append(f"Challenge Rating: {cr_value}")
    elif cr:
        statblock_lines.append(f"Challenge Rating: {cr}")
    
    # Treasure
    treasure = category_metadata.get('treasure', '').strip()
    if treasure:
        statblock_lines.append(f"Treasure: {treasure}")
    
    # Alignment
    alignment = category_metadata.get('alignment', '').strip()
    if alignment:
        statblock_lines.append(f"Alignment: {alignment}")
    
    # Advancement
    adv = category_metadata.get('advancement', {})
    if isinstance(adv, dict):
        adv_value = adv.get(age, '').strip()
        if adv_value:  # Only add if there's a non-empty value
            statblock_lines.append(f"Advancement: {adv_value}")
    elif adv:
        statblock_lines.append(f"Advancement: {adv}")
    
    # Level Adjustment
    # Note: This should always be present, even if value is "--"
    la = category_metadata.get('level_adjustment', {})
    if isinstance(la, dict):
        if age in la:
            la_value = la.get(age, '').strip()
            # Always add Level Adjustment if the age is in the dict, using "--" if value is empty
            statblock_lines.append(f"Level Adjustment: {la_value if la_value else '--'}")
    elif la:
        statblock_lines.append(f"Level Adjustment: {la}")
    
    return "\n".join(statblock_lines)


def extract_universal_tables_from_mainmonster(mainmonster_node: BlockNode) -> Dict[str, Dict]:
    """Extract universal tables from MAINMONSTER INPUTDATA blocks."""
    universal_tables = {}
    
    # Find INPUTDATA nodes in MAINMONSTER
    inputdata_nodes = mainmonster_node.find_descendants('INPUTDATA')
    for inputdata_node in inputdata_nodes:
        # Check if this INPUTDATA is directly under MAINMONSTER
        if inputdata_node.parent and inputdata_node.parent.tag == 'MAINMONSTER':
            # Extract tables from this INPUTDATA
            table_nodes = inputdata_node.find_children('TABLE')
            for table_node in table_nodes:
                table = parse_table_from_tagged_section(table_node.content)
                if table:
                    universal_tables[table['name']] = table
    
    return universal_tables


# ============================================================================
# Main Function
# ============================================================================

def parse_into_tree(content: str) -> BlockNode:
    """
    Parse the tagged file content into a tree structure.
    
    Returns the root node (MAINMONSTER).
    """
    # Define block hierarchy
    block_hierarchy = {
        'MAINMONSTER': 1,
        'GROUP': 2,
        'CATEGORY': 3,
        'VARIANT': 4,
        'INPUTDATA': 5,
        'DESCRIPTION': 5,
        'COMBAT': 5,
        'FLAVORTEXT': 5,
        'SA': 5,
        'TABLE': 5,
        'EXAMPLE': 5,
        'STATBLOCK': 5,
        'SIDEBAR': 5,
    }
    
    # Stack to track open blocks
    stack: List[Tuple[BlockNode, int]] = []  # (node, start_position)
    root: Optional[BlockNode] = None
    
    # Pattern to find all tags
    tag_pattern = r'\{/?(\w+)\}'
    
    pos = 0
    while pos < len(content):
        match = re.search(tag_pattern, content[pos:])
        if not match:
            break
        
        tag_start = pos + match.start()
        tag_end = pos + match.end()
        is_closing = match.group(0).startswith('{/')
        tag_name = match.group(1)
        
        if tag_name not in block_hierarchy:
            pos = tag_end
            continue
        
        if is_closing:
            # Find matching opening tag on stack
            found = False
            for i in range(len(stack) - 1, -1, -1):
                node, start_pos = stack[i]
                if node.tag == tag_name:
                    # Set content for this node (content between opening and closing tags)
                    # start_pos is after the opening tag, tag_start is before the closing tag
                    node.content = content[start_pos:tag_start]
                    # Remove from stack
                    stack.pop(i)
                    found = True
                    break
            
            if not found:
                line_num = content[:tag_start].count('\n') + 1
                raise ValueError(
                    f"Block nesting error: Found closing tag {{/{tag_name}}} at line {line_num} "
                    f"but no matching opening tag was found."
                )
        else:
            # Opening tag - create new node
            node = BlockNode(tag=tag_name)
            
            # Add to parent if stack is not empty
            if stack:
                parent_node, _ = stack[-1]
                parent_node.add_child(node)
            else:
                # Top-level node - should be MAINMONSTER
                if root is not None:
                    line_num = content[:tag_start].count('\n') + 1
                    raise ValueError(
                        f"Found multiple top-level blocks. Expected only MAINMONSTER as root, "
                        f"but found {root.tag} and {tag_name} at line {line_num}."
                    )
                root = node
            
            # Push onto stack
            stack.append((node, tag_end))
        
        pos = tag_end
    
    # Check for unclosed blocks
    if stack:
        unclosed = ', '.join([f"{node.tag} (at line {content[:pos].count(chr(10)) + 1})" 
                             for node, pos in stack])
        raise ValueError(f"Block nesting error: Unclosed blocks found: {unclosed}")
    
    if not root:
        raise ValueError("No MAINMONSTER block found in file")
    
    if root.tag != 'MAINMONSTER':
        raise ValueError(f"Expected MAINMONSTER as root, got {root.tag}. "
                        f"Make sure MAINMONSTER is the first block in the file.")
    
    return root


def extract_example_statblocks(root: BlockNode) -> Dict[str, str]:
    """Extract EXAMPLE statblocks from the tree, keyed by full example name."""
    examples = {}
    
    # Find all CATEGORY nodes
    categories = root.find_descendants('CATEGORY')
    for category_node in categories:
        category_name = category_node.get_content_without_children().split('\n')[0].strip()
        
        # Find EXAMPLE nodes within this category's INPUTDATA
        inputdata_nodes = category_node.find_children('INPUTDATA')
        for inputdata_node in inputdata_nodes:
            # EXAMPLE might be a direct child or a descendant
            example_nodes = inputdata_node.find_children('EXAMPLE')
            if not example_nodes:
                example_nodes = inputdata_node.find_descendants('EXAMPLE')
            
            for example_node in example_nodes:
                example_content = example_node.content
                # Extract full name from first non-empty line (e.g., "Adult Green Dragon:")
                lines = [l.strip() for l in example_content.split('\n') if l.strip()]
                if not lines:
                    continue
                first_line = lines[0]
                # Remove trailing colon if present
                example_name = first_line.rstrip(':').strip()
                # Use the full example name as the key (e.g., "Adult Green Dragon")
                examples[example_name] = example_content
    
    return examples


def extract_skills_from_example(example_statblock: str) -> List[str]:
    """
    Extract all skills from an example statblock (removing bonuses).
    Returns a list of skill names (e.g., ['Bluff', 'Climb', 'Knowledge (arcana)', 'Knowledge (nature)']).
    """
    skills = []
    
    # Try to find Skills line in the example
    # Format: "Skills: Bluff +9, Knowledge (arcana) +14, Knowledge (nature) +13, ..."
    lines = example_statblock.split('\n')
    for line in lines:
        line_lower = line.lower()
        if 'skills:' in line_lower or line_lower.startswith('skills'):
            # Extract skills from this line
            # Handle both "Skills: ..." and "Skills ..." formats
            if ':' in line:
                skills_text = line.split(':', 1)[1].strip()
            else:
                skills_text = line[6:].strip()  # Remove "Skills" prefix
            
            # Remove trailing semicolon
            skills_text = skills_text.rstrip(';').strip()
            
            # Split by comma and extract skill names (remove bonuses)
            for skill_item in skills_text.split(','):
                skill_item = skill_item.strip()
                # Remove bonus values (e.g., "+9", "+14", etc.)
                # Pattern: skill name followed by optional bonus
                skill_name = re.sub(r'\s*\+\s*\d+\s*$', '', skill_item, flags=re.IGNORECASE)
                skill_name = skill_name.strip()
                
                # Handle special cases like "Speak Language 6 ranks"
                if 'ranks' in skill_name.lower():
                    # Extract just the skill name part
                    skill_name = re.sub(r'\s+\d+\s+ranks.*$', '', skill_name, flags=re.IGNORECASE)
                    skill_name = skill_name.strip()
                
                if skill_name:
                    # Normalize to Title Case for consistency
                    skill_name = skill_name.title()
                    # Handle Knowledge (xxx) properly
                    if skill_name.lower().startswith('knowledge'):
                        # Keep the format as "Knowledge (xxx)"
                        knowledge_match = re.search(r'Knowledge\s*\(([^)]+)\)', skill_item, re.IGNORECASE)
                        if knowledge_match:
                            knowledge_type = knowledge_match.group(1).strip()
                            skill_name = f"Knowledge ({knowledge_type})"
                    # Handle Perform (xxx) similarly
                    elif skill_name.lower().startswith('perform'):
                        perform_match = re.search(r'Perform\s*\(([^)]+)\)', skill_item, re.IGNORECASE)
                        if perform_match:
                            perform_type = perform_match.group(1).strip()
                            skill_name = f"Perform ({perform_type})"
                    # Handle Craft (xxx) similarly
                    elif skill_name.lower().startswith('craft'):
                        craft_match = re.search(r'Craft\s*\(([^)]+)\)', skill_item, re.IGNORECASE)
                        if craft_match:
                            craft_type = craft_match.group(1).strip()
                            skill_name = f"Craft ({craft_type})"
                    
                    if skill_name and skill_name not in skills:
                        skills.append(skill_name)
    
    return skills


def extract_category_skill_priorities(category_node: BlockNode, example_statblocks: Dict[str, str]) -> tuple[List[str], Dict[str, int]]:
    """
    Extract skill priorities and target ranks from all examples in a category.
    Returns a tuple of:
    - List of skill names prioritized based on examples (e.g., ['Bluff', 'Climb', 'Knowledge (arcana)'])
    - Dictionary mapping skill names to target rank counts from examples (e.g., {'Speak Language': 6})
      These target ranks will be used to allocate skill points, consuming points as normal.
    """
    category_name = category_node.get_content_without_children().split('\n')[0].strip()
    all_skills = []
    target_ranks = {}  # Skills with target rank counts from examples (these consume skill points)
    
    # Find all examples for this category
    for example_name, example_content in example_statblocks.items():
        # Check if this example belongs to this category
        # Example names are like "Adult Green Dragon", category is "Green Dragon"
        if category_name.lower() in example_name.lower() or example_name.lower().endswith(category_name.lower()):
            # Extract skills and target ranks
            skills, ranks = extract_skills_and_ranks_from_example(example_content)
            # Add skills, maintaining order (first seen = higher priority)
            for skill in skills:
                if skill not in all_skills:
                    all_skills.append(skill)
            # Store target ranks (use first value seen if multiple examples have different values)
            for skill, rank_count in ranks.items():
                if skill not in target_ranks:
                    target_ranks[skill] = rank_count
    
    return all_skills, target_ranks


def extract_skills_and_ranks_from_example(example_statblock: str) -> tuple[List[str], Dict[str, int]]:
    """
    Extract all skills from an example statblock, including fixed rank counts for special skills.
    Returns a tuple of:
    - List of skill names (e.g., ['Bluff', 'Climb', 'Knowledge (arcana)'])
    - Dictionary mapping skills with fixed ranks to their rank counts (e.g., {'Speak Language': 6})
    """
    skills = []
    fixed_ranks = {}
    
    # Try to find Skills line in the example
    # Format: "Skills: Bluff +9, Knowledge (arcana) +14, Speak Language 6 ranks, ..."
    lines = example_statblock.split('\n')
    for line in lines:
        line_lower = line.lower()
        if 'skills:' in line_lower or line_lower.startswith('skills'):
            # Extract skills from this line
            # Handle both "Skills: ..." and "Skills ..." formats
            if ':' in line:
                skills_text = line.split(':', 1)[1].strip()
            else:
                skills_text = line[6:].strip()  # Remove "Skills" prefix
            
            # Remove trailing semicolon
            skills_text = skills_text.rstrip(';').strip()
            
            # Split by comma and extract skill names (remove bonuses)
            for skill_item in skills_text.split(','):
                skill_item = skill_item.strip()
                
                # Check for "Speak Language X ranks" pattern
                language_match = re.search(r'Speak Language\s+(\d+)\s+ranks?', skill_item, re.IGNORECASE)
                if language_match:
                    rank_count = int(language_match.group(1))
                    skill_name = "Speak Language"
                    if skill_name not in skills:
                        skills.append(skill_name)
                    fixed_ranks[skill_name] = rank_count
                    continue
                
                # Remove bonus values (e.g., "+9", "+14", etc.)
                # Pattern: skill name followed by optional bonus
                skill_name = re.sub(r'\s*\+\s*\d+\s*$', '', skill_item, flags=re.IGNORECASE)
                skill_name = skill_name.strip()
                
                # Handle other skills with ranks notation
                if 'ranks' in skill_name.lower():
                    # Extract skill name and rank count
                    rank_match = re.search(r'(.+?)\s+(\d+)\s+ranks?', skill_name, re.IGNORECASE)
                    if rank_match:
                        skill_name = rank_match.group(1).strip()
                        rank_count = int(rank_match.group(2))
                        if skill_name not in skills:
                            skills.append(skill_name)
                        fixed_ranks[skill_name] = rank_count
                        continue
                
                if skill_name:
                    # Normalize to Title Case for consistency
                    skill_name = skill_name.title()
                    # Handle Knowledge (xxx) properly
                    if skill_name.lower().startswith('knowledge'):
                        # Keep the format as "Knowledge (xxx)"
                        knowledge_match = re.search(r'Knowledge\s*\(([^)]+)\)', skill_item, re.IGNORECASE)
                        if knowledge_match:
                            knowledge_type = knowledge_match.group(1).strip()
                            skill_name = f"Knowledge ({knowledge_type})"
                    # Handle Perform (xxx) similarly
                    elif skill_name.lower().startswith('perform'):
                        perform_match = re.search(r'Perform\s*\(([^)]+)\)', skill_item, re.IGNORECASE)
                        if perform_match:
                            perform_type = perform_match.group(1).strip()
                            skill_name = f"Perform ({perform_type})"
                    # Handle Craft (xxx) similarly
                    elif skill_name.lower().startswith('craft'):
                        craft_match = re.search(r'Craft\s*\(([^)]+)\)', skill_item, re.IGNORECASE)
                        if craft_match:
                            craft_type = craft_match.group(1).strip()
                            skill_name = f"Craft ({craft_type})"
                    
                    if skill_name and skill_name not in skills:
                        skills.append(skill_name)
    
    return skills, fixed_ranks


def normalize_field_value(value: str, field_name: str = '') -> str:
    """
    Normalize a field value for comparison by:
    - Converting to lowercase
    - Removing extra whitespace
    - Removing punctuation differences that don't affect meaning
    - Normalizing common formatting variations
    """
    if not value:
        return ''
    
    # Convert to lowercase
    normalized = value.lower()
    
    # Remove extra whitespace
    normalized = re.sub(r'\s+', ' ', normalized)
    
    # Remove leading/trailing whitespace
    normalized = normalized.strip()
    
    # Field-specific normalizations
    if field_name == 'armor class':
        # For AC, extract just the main number and touch/flat-footed values
        # Ignore the breakdown in parentheses (e.g., "(-1 size, +16 natural)")
        # Extract: "25, touch 9, flat-footed 25" from "25 (-1 size, +16 natural), touch 9, flat-footed 25"
        ac_match = re.match(r'(\d+).*?touch\s+(\d+).*?flat-footed\s+(\d+)', normalized)
        if ac_match:
            normalized = f"{ac_match.group(1)}, touch {ac_match.group(2)}, flat-footed {ac_match.group(3)}"
        else:
            # Try simpler pattern
            ac_match = re.match(r'(\d+).*?touch\s+(\d+)', normalized)
            if ac_match:
                normalized = f"{ac_match.group(1)}, touch {ac_match.group(2)}"
    
    elif field_name in ['attack', 'full attack']:
        # For attacks, normalize weapon order and format
        # Handle both formats:
        # - "bite +20 melee (2d6+4)" (weapon name first)
        # - "+20 melee (2d6+4, bite)" (weapon name in parentheses)
        # - "2x claws +17 melee (1d8+2)" (multiplier and weapon name first)
        
        attacks = []
        
        # Split by commas to handle multiple attacks in Full Attack
        # But be careful - commas might be inside parentheses
        attack_parts = []
        paren_depth = 0
        current_part = ''
        for char in normalized:
            if char == '(':
                paren_depth += 1
            elif char == ')':
                paren_depth -= 1
            elif char == ',' and paren_depth == 0:
                # This comma is a separator between attacks
                if current_part.strip():
                    attack_parts.append(current_part.strip())
                current_part = ''
                continue
            current_part += char
        if current_part.strip():
            attack_parts.append(current_part.strip())
        
        # If no commas found or only one part, treat as single attack
        if not attack_parts:
            attack_parts = [normalized]
        
        for attack_str in attack_parts:
            attack_str = attack_str.strip()
            if not attack_str:
                continue
            
            # Extract weapon name (could be before bonus or in parentheses after damage)
            weapon_name = None
            weapon_patterns = [
                r'\b(2x\s+)?(bite|claw|claws|wing|wings|tail\s+slap|tail)\b',
            ]
            
            # Try to find weapon name before the bonus
            for pattern in weapon_patterns:
                match = re.search(pattern, attack_str, re.IGNORECASE)
                if match:
                    weapon_name = match.group(0).lower().strip()
                    # Remove it from the string for further processing
                    attack_str = re.sub(re.escape(match.group(0)), '', attack_str, count=1, flags=re.IGNORECASE)
                    break
            
            # Extract attack bonus: look for +XX or -XX
            bonus_match = re.search(r'([+\-]?\d+)', attack_str)
            if not bonus_match:
                continue
            bonus = int(bonus_match.group(1))
            
            # Extract damage: look for (XdY+Z) or (XdY-Z) or (XdY)
            damage_match = re.search(r'\(([^)]+)\)', attack_str)
            if damage_match:
                damage_str = damage_match.group(1)
                # Remove weapon name if it's in the damage parentheses
                damage_str = re.sub(r'\b(bite|claw|claws|wing|wings|tail\s+slap|tail)\b', '', damage_str, flags=re.IGNORECASE)
                # Remove weapon count numbers (like "2" from "2 claws" or "2 wings")
                # But be careful not to remove numbers that are part of damage dice (like "2d6" or "+2")
                # Pattern: standalone "2" or "2," or ",2" that's NOT preceded by "d" (dice) or "+"/"-" (modifier)
                # Match "2" or "2," or ",2" but not "d2" or "+2" or "-2"
                damage_str = re.sub(r'(?<![d+\-])\b(2|3|4)\b(?![d+\-])', '', damage_str)
                damage_str = damage_str.strip().strip(',').strip()
                # Clean up multiple commas
                damage_str = re.sub(r',\s*,+', ',', damage_str)  # Remove double/triple commas
                damage_str = damage_str.strip(',').strip()
                # Normalize damage: remove extra spaces, normalize + signs
                damage_str = re.sub(r'\s+', '', damage_str)
            else:
                damage_str = ''
            
            # Store attack as (bonus, damage, weapon) tuple
            # Weapon name is optional for comparison
            attacks.append((bonus, damage_str, weapon_name))
        
        # Sort by bonus value for consistent comparison
        if attacks:
            attacks.sort(key=lambda x: (x[0], x[1]))  # Sort by bonus, then damage
            # Create normalized string: bonus(damage) for each attack
            normalized_parts = []
            for bonus, damage, weapon in attacks:
                if damage:
                    normalized_parts.append(f"{'+' if bonus >= 0 else ''}{bonus}({damage})")
                else:
                    normalized_parts.append(f"{'+' if bonus >= 0 else ''}{bonus}")
            normalized = ','.join(normalized_parts)
    
    elif field_name == 'space/reach':
        # Normalize "10 ft./5 ft. (10 ft. with bite)" vs "10 ft./5 ft. (bite 10 ft.)"
        # Also handle "2-1/2 ft./0 ft. (5 ft. with bite)" vs "2-1/2 ft./0 ft. (bite 5 ft.)"
        # Extract the main space/reach and optional reach
        # Match pattern like "2-1/2 ft./0 ft." or "10 ft./5 ft."
        match = re.match(r'([\d\-/]+\s*ft\.?/[\d\-/]+\s*ft\.?)(.*)', normalized)
        if match:
            main = match.group(1)
            optional = match.group(2)
            # Normalize optional reach part - handle both "5 ft. with bite" and "bite 5 ft."
            # Extract the reach value and normalize to "bite X ft." format
            bite_match = re.search(r'(\d+\s*ft\.?)\s*(?:with\s+)?bite|bite\s+(\d+\s*ft\.?)', optional, re.IGNORECASE)
            if bite_match:
                reach_value = bite_match.group(1) or bite_match.group(2)
                optional = f' (bite {reach_value})'
            else:
                # Keep original if no bite pattern found
                optional = re.sub(r'\(.*?(\d+\s*ft\.?).*?\)', r'(\1)', optional)
            normalized = main + optional
    
    elif field_name in ['special attacks', 'special qualities']:
        # Normalize order and formatting differences
        # Split by comma, normalize each item, sort
        items = [item.strip() for item in normalized.split(',')]
        # Normalize each item (remove extra spaces, normalize hyphens)
        items = [re.sub(r'\s+', ' ', item) for item in items]
        items = [item.replace('blind-sense', 'blindsense') for item in items]
        items = [item.replace('120ft.', '120 ft.') for item in items]
        items = [item.replace('120ft', '120 ft.') for item in items]
        # Sort for consistent comparison
        items.sort()
        normalized = ','.join(items)
    
    elif field_name == 'abilities':
        # Remove trailing period
        normalized = normalized.rstrip('.')
    
    elif field_name == 'saves':
        # Normalize spacing around "+" signs: "Ref+14" vs "Ref +14" should match
        normalized = re.sub(r'\s*\+\s*', '+', normalized)
        # Normalize spacing around commas
        normalized = re.sub(r'\s*,\s*', ',', normalized)
    
    # General normalizations
    # Remove spaces around parentheses and commas
    normalized = re.sub(r'\s*\(\s*', '(', normalized)
    normalized = re.sub(r'\s*\)\s*', ')', normalized)
    if field_name != 'saves':  # Already handled above
        normalized = re.sub(r'\s*,\s*', ',', normalized)
    normalized = re.sub(r'\s*-\s*', '-', normalized)
    
    # Normalize "x" vs "×" for multipliers
    normalized = normalized.replace('×', 'x')
    
    # Normalize "ft" vs "ft." vs "feet"
    normalized = re.sub(r'\bft\.?\b', 'ft', normalized)
    
    return normalized


def parse_example_statblock_inline(example_text: str) -> Dict[str, str]:
    """
    Parse example statblock that uses inline format:
    "AC 25, touch 9, flat-footed 25; Base Atk +16; Grp +24; Atk +20 melee (2d6+4, bite); ..."
    """
    fields = {}
    
    # Split by semicolons to get major sections
    sections = [s.strip() for s in example_text.split(';')]
    
    for section in sections:
        section_lower = section.lower()
        
        # AC: "AC 25, touch 9, flat-footed 25"
        if section_lower.startswith('ac '):
            ac_value = section[3:].strip()  # Remove "AC "
            fields['armor class'] = ac_value
        
        # Attack: "Atk +20 melee (2d6+4, bite)"
        elif section_lower.startswith('atk ') and not section_lower.startswith('full atk'):
            # Single attack (not Full Atk)
            atk_value = section[4:].strip()  # Remove "Atk "
            # Check if "Full Atk" appears later in the same section (can happen if they're on separate lines)
            if 'Full Atk' in atk_value or 'full atk' in atk_value.lower():
                # Split at "Full Atk" and take only the first part for "Atk"
                full_atk_idx = atk_value.lower().find('full atk')
                if full_atk_idx >= 0:
                    # Extract Full Atk value
                    full_atk_value = atk_value[full_atk_idx:].strip()
                    # Remove "Full Atk" prefix
                    if full_atk_value.lower().startswith('full atk'):
                        full_atk_value = full_atk_value[9:].strip()  # Remove "Full Atk "
                    fields['full attack'] = full_atk_value
                    
                    # Extract just the Atk part (before Full Atk)
                    atk_value = atk_value[:full_atk_idx].strip()
                    # Remove trailing comma if present
                    atk_value = atk_value.rstrip(',').strip()
            fields['attack'] = atk_value
        
        # Full Attack: "Full Atk +20 melee (2d6+4, bite), +17 melee (1d8+2, 2 claws), ..."
        elif section_lower.startswith('full atk '):
            full_atk_value = section[9:].strip()  # Remove "Full Atk "
            fields['full attack'] = full_atk_value
        
        # Space/Reach: "Space/Reach 10 ft./5 ft. (bite 10 ft.)"
        elif 'space/reach' in section_lower or 'space' in section_lower and 'reach' in section_lower:
            # Extract after "Space/Reach" or similar
            match = re.search(r'space[/\s]*reach\s+(.+)', section_lower)
            if match:
                fields['space/reach'] = match.group(1)
            else:
                # Try to extract from the section
                parts = section.split()
                if 'space' in parts or 'reach' in parts:
                    idx = max([i for i, p in enumerate(parts) if p.lower() in ['space', 'reach']], default=-1)
                    if idx >= 0:
                        fields['space/reach'] = ' '.join(parts[idx+1:])
        
        # Special Attacks: "SA breath weapon, darkness, frightful presence, spells;"
        elif section_lower.startswith('sa '):
            sa_value = section[3:].strip()  # Remove "SA "
            fields['special attacks'] = sa_value
        
        # Special Qualities: "SQ blind-sense 60 ft., damage reduction 5/magic, ..."
        elif section_lower.startswith('sq '):
            sq_value = section[3:].strip()  # Remove "SQ "
            fields['special qualities'] = sq_value
        
        # Saves: "SV Fort +13, Ref +10, Will +11"
        elif section_lower.startswith('sv '):
            sv_value = section[3:].strip()  # Remove "SV "
            fields['saves'] = sv_value
        
        # Abilities: "Str 19, Dex 10, Con 17, Int 12, Wis 13, Cha 12."
        elif any(ability in section_lower for ability in ['str ', 'dex ', 'con ', 'int ', 'wis ', 'cha ']):
            # This section contains ability scores
            # Extract just the abilities part (stop at period or before "Skills")
            abilities_match = re.search(r'(Str\s+\d+.*?Cha\s+\d+)', section, re.IGNORECASE)
            if abilities_match:
                abilities_value = abilities_match.group(1).rstrip('.')
                fields['abilities'] = abilities_value
        
        # Skills: "Skills: Bluff +9, Climb +20, Diplomacy +10, ..."
        elif section_lower.startswith('skills:'):
            skills_value = section[7:].strip().rstrip(';').strip()  # Remove "Skills:" and trailing semicolon
            fields['skills'] = skills_value
        
        # Feats: "Feats: Improved Natural Armor, Multiattack, Power Attack, ..."
        elif section_lower.startswith('feats:'):
            feats_value = section[6:].strip().rstrip(';').strip().rstrip('.').strip()  # Remove "Feats:" and trailing semicolon/period
            fields['feats'] = feats_value
    
    return fields


def validate_statblock_against_example(generated_statblock: str, example_statblock: str, 
                                       variant_name: str) -> List[str]:
    """Compare generated statblock to example and return list of discrepancies."""
    discrepancies = []
    
    # Normalize generated statblock (uses "Field: value" format)
    def normalize_statblock_labeled(text: str) -> Dict[str, str]:
        """Extract key fields from statblock text with labeled format."""
        fields = {}
        lines = text.split('\n')
        for line in lines:
            line = line.strip()
            if not line:
                continue
            # Match field: value pattern
            if ':' in line:
                parts = line.split(':', 1)
                if len(parts) == 2:
                    field = parts[0].strip()
                    value = parts[1].strip()
                    fields[field.lower()] = value
        return fields
    
    generated_fields = normalize_statblock_labeled(generated_statblock)
    
    # Parse example statblock (uses inline format like "AC 25, touch 9; Atk +20 melee...")
    # First try inline format, then fall back to labeled format
    example_fields = parse_example_statblock_inline(example_statblock)
    if not example_fields:
        example_fields = normalize_statblock_labeled(example_statblock)
    
    # Compare key fields
    key_fields = ['armor class', 'attack', 'full attack', 'space/reach', 
                  'special attacks', 'special qualities', 'saves', 'abilities']
    
    for field in key_fields:
        gen_value = generated_fields.get(field, '')
        ex_value = example_fields.get(field, '')
        
        # Skip if both are empty
        if not gen_value and not ex_value:
            continue
        
        # Normalize both values for comparison
        gen_normalized = normalize_field_value(gen_value, field)
        ex_normalized = normalize_field_value(ex_value, field)
        
        if gen_normalized != ex_normalized:
            # For attack fields, show normalized comparison to highlight actual differences
            if field in ['attack', 'full attack']:
                # Show both original and normalized for clarity
                gen_display = gen_value if len(gen_value) <= 120 else gen_value[:120] + '...'
                ex_display = ex_value if len(ex_value) <= 120 else ex_value[:120] + '...'
                discrepancies.append(
                    f"  {field}:\n    Generated: {gen_display}\n    Example:   {ex_display}\n    Normalized comparison: '{gen_normalized}' vs '{ex_normalized}'"
                )
            else:
                # Show full values (or at least more of them) for comparison
                gen_display = gen_value if len(gen_value) <= 120 else gen_value[:120] + '...'
                ex_display = ex_value if len(ex_value) <= 120 else ex_value[:120] + '...'
                discrepancies.append(
                    f"  {field}:\n    Generated: {gen_display}\n    Example:   {ex_display}"
                )
    
    return discrepancies


def extract_sa_from_example(example_statblock: str) -> Dict[str, str]:
    """
    Extract SA block content from example statblock text.
    The example format has SA information in the "SA:" line and may have separate {SA} blocks.
    Returns a dict mapping ability names to their full descriptions.
    """
    sa_blocks = {}
    
    # First, check for separate {SA} blocks in the example
    sa_pattern = r'\{SA\}(.*?)\{/SA\}'
    sa_matches = re.finditer(sa_pattern, example_statblock, re.DOTALL | re.IGNORECASE)
    for match in sa_matches:
        sa_content = match.group(1).strip()
        # Extract ability name from first line
        first_line = sa_content.split('\n')[0].strip()
        # Extract the part before the colon (if present)
        colon_idx = first_line.find(':')
        if colon_idx != -1:
            ability_name = first_line[:colon_idx].strip()
        else:
            ability_name = first_line.strip()
        # Remove parenthetical markers
        ability_name = re.sub(r'\s*\([^)]+\)\s*$', '', ability_name).lower()
        sa_blocks[ability_name] = sa_content
    
    # Also extract from the "SA:" line in the statblock
    # Format: "SA breath weapon, darkness, frightful presence, spells;"
    lines = example_statblock.split('\n')
    for line in lines:
        line = line.strip()
        # Look for SA: line (but not {SA} tags)
        if line.lower().startswith('sa ') and not line.lower().startswith('{sa'):
            # Extract the SA content
            sa_content = line[3:].strip().rstrip(';').strip()
            # Split by comma to get individual abilities
            abilities = [a.strip().lower() for a in sa_content.split(',')]
            # Add these as simple ability names (they may not have full descriptions)
            for ability in abilities:
                if ability and ability not in sa_blocks:
                    sa_blocks[ability] = ability  # Use ability name as content
    
    return sa_blocks


def extract_spells_from_example(example_statblock: str) -> Optional[Dict[str, List[str]]]:
    """
    Extract spell list from "Typical Sorcerer Spells Known" SA block in example.
    
    Returns dict mapping spell levels to lists of spells: {'0': ['detect magic', ...], '1st': ['magic missile', ...], ...}
    Returns None if no spell list found.
    """
    # Look for {SA} blocks containing "Typical Sorcerer Spells Known"
    sa_pattern = r'\{SA\}(.*?)\{/SA\}'
    sa_matches = re.finditer(sa_pattern, example_statblock, re.DOTALL | re.IGNORECASE)
    
    for match in sa_matches:
        sa_content = match.group(1).strip()
        first_line = sa_content.split('\n')[0].strip()
        
        # Check if this is the "Typical Sorcerer Spells Known" block
        if 'typical sorcerer spells known' in first_line.lower():
            # Parse format: "Typical Sorcerer Spells Known (X/Y/Z; save DC N + spell level): 0--spell1, spell2; 1st--spell3, spell4; ..."
            # Extract the spell list part (after the colon)
            colon_idx = sa_content.find(':')
            if colon_idx == -1:
                continue
            
            spells_text = sa_content[colon_idx + 1:].strip()
            
            # Parse spell levels and spells
            spell_dict = {}
            # Split by semicolon to get each spell level
            level_parts = spells_text.split(';')
            
            for part in level_parts:
                part = part.strip()
                if not part:
                    continue
                
                # Format: "0--spell1, spell2" or "1st--spell3, spell4" or "0-- spell1" (with space)
                # Use regex to match level followed by -- (with optional spaces)
                level_match = re.match(r'^(\d+(?:st|nd|rd|th)?)\s*--\s*(.+)', part)
                if not level_match:
                    continue
                
                level = level_match.group(1).strip()
                spells_str = level_match.group(2).strip()
                
                # Remove trailing period if present
                spells_str = spells_str.rstrip('.')
                
                # Split spells by comma
                spells = [s.strip() for s in spells_str.split(',') if s.strip()]
                if spells:
                    spell_dict[level] = spells
            
            if spell_dict:
                return spell_dict
    
    return None


def extract_category_spell_templates(category_node: BlockNode, example_statblocks: Dict[str, str]) -> Dict[str, Dict[str, List[str]]]:
    """
    Extract spell lists from all examples in a category.
    
    Returns dict keyed by example age category: {'Young Adult': {'0': [...], '1st': [...]}, ...}
    """
    category_name = category_node.get_content_without_children().split('\n')[0].strip()
    spell_templates = {}
    
    # Find all examples for this category
    for example_name, example_content in example_statblocks.items():
        # Check if this example belongs to this category
        if category_name.lower() in example_name.lower() or example_name.lower().endswith(category_name.lower()):
            # Extract age from example name (e.g., "Young Adult Black Dragon" -> "Young Adult")
            age = None
            for age_cat in AGE_CATEGORIES:
                if age_cat.lower() in example_name.lower():
                    age = age_cat
                    break
            
            if age:
                spells = extract_spells_from_example(example_content)
                if spells:
                    spell_templates[age] = spells
    
    return spell_templates


def compare_sa_blocks(generated_statblock: str, example_statblock: str, variant_name: str) -> List[str]:
    """
    Compare Special Attacks and Special Qualities lists from generated and example statblocks.
    Splits on commas and compares as unordered lists.
    
    Args:
        generated_statblock: Generated statblock text
        example_statblock: Example statblock text
        variant_name: Name of variant for error reporting
    """
    discrepancies = []
    
    def extract_comma_separated_list(statblock: str, field_name: str) -> set:
        """
        Extract a comma-separated list field from statblock.
        Handles both labeled format ("Field: item1, item2") and inline format ("Field item1, item2;").
        """
        # Try labeled format first: "Special Attacks: breath weapon, darkness, spells"
        lines = statblock.split('\n')
        for line in lines:
            if ':' in line:
                parts = line.split(':', 1)
                if len(parts) == 2:
                    field = parts[0].strip().lower()
                    if field == field_name.lower():
                        value = parts[1].strip()
                        # Split on commas and normalize each item
                        items = []
                        for item in value.split(','):
                            item = item.strip().lower()
                            if item:
                                # Normalize formatting differences
                                item = item.replace('blind-sense', 'blindsense')
                                item = item.replace('120ft.', '120 ft.')
                                item = item.replace('120ft', '120 ft.')
                                item = re.sub(r'\s+', ' ', item)  # Normalize whitespace
                                items.append(item)
                        return set(items)
        
        # Try inline format: "SA breath weapon, darkness, spells;" or "SQ item1, item2;"
        # Map field names to inline prefixes
        inline_prefixes = {
            'special attacks': r'sa\s+',
            'special qualities': r'sq\s+'
        }
        prefix = inline_prefixes.get(field_name.lower(), '')
        if prefix:
            pattern = prefix + r'([^;]+)'
            match = re.search(pattern, statblock, re.IGNORECASE)
            if match:
                value = match.group(1).strip()
                # Split on commas and normalize each item
                items = []
                for item in value.split(','):
                    item = item.strip().lower()
                    if item:
                        # Normalize formatting differences
                        item = item.replace('blind-sense', 'blindsense')
                        item = item.replace('120ft.', '120 ft.')
                        item = item.replace('120ft', '120 ft.')
                        item = re.sub(r'\s+', ' ', item)  # Normalize whitespace
                        items.append(item)
                return set(items)
        
        return set()
    
    # Compare Special Attacks
    generated_sa_set = extract_comma_separated_list(generated_statblock, 'special attacks')
    example_sa_set = extract_comma_separated_list(example_statblock, 'special attacks')
    
    missing_sa = example_sa_set - generated_sa_set
    if missing_sa:
        discrepancies.append(f"  Special Attacks missing in generated: {', '.join(sorted(missing_sa))}")
    
    extra_sa = generated_sa_set - example_sa_set
    if extra_sa:
        discrepancies.append(f"  Special Attacks extra in generated: {', '.join(sorted(extra_sa))}")
    
    # Compare Special Qualities
    generated_sq_set = extract_comma_separated_list(generated_statblock, 'special qualities')
    example_sq_set = extract_comma_separated_list(example_statblock, 'special qualities')
    
    missing_sq = example_sq_set - generated_sq_set
    if missing_sq:
        discrepancies.append(f"  Special Qualities missing in generated: {', '.join(sorted(missing_sq))}")
    
    extra_sq = generated_sq_set - example_sq_set
    if extra_sq:
        discrepancies.append(f"  Special Qualities extra in generated: {', '.join(sorted(extra_sq))}")
    
    return discrepancies


def compare_skills_and_feats(generated_statblock: str, example_statblock: str, variant_name: str) -> List[str]:
    """
    Compare Skills and Feats lists from generated and example statblocks.
    Splits on commas and compares as unordered lists.
    
    Args:
        generated_statblock: Generated statblock text
        example_statblock: Example statblock text
        variant_name: Name of variant for error reporting
    """
    discrepancies = []
    
    def extract_comma_separated_list(statblock: str, field_name: str) -> set:
        """
        Extract a comma-separated list field from statblock.
        Handles both labeled format ("Field: item1, item2") and inline format ("Field item1, item2;").
        For Skills and Feats, we need to handle values with bonuses (e.g., "Bluff +9") and normalize them.
        """
        # Try labeled format first: "Skills: Bluff +9, Climb +20, ..." or "Feats: Improved Natural Armor, Multiattack, ..."
        lines = statblock.split('\n')
        for line in lines:
            if ':' in line:
                parts = line.split(':', 1)
                if len(parts) == 2:
                    field = parts[0].strip().lower()
                    if field == field_name.lower():
                        value = parts[1].strip()
                        # Split on commas and semicolons, then normalize each item
                        # First split by semicolon to handle cases like "Swim +20; Survival +37"
                        parts_list = value.split(';')
                        all_items = []
                        for part in parts_list:
                            all_items.extend(part.split(','))
                        
                        items = []
                        seen_skills = set()  # Track seen skills to avoid duplicates
                        for item in all_items:
                            item = item.strip().rstrip(';').rstrip('.').strip()  # Remove trailing semicolons and periods
                            if item:
                                # For Skills, normalize by removing bonus values for comparison
                                # e.g., "Bluff +9" -> "bluff"
                                # For Feats, just normalize case and whitespace
                                if field_name.lower() == 'skills':
                                    # Remove bonus values (e.g., "+9", "+20", etc.)
                                    # Pattern: skill name followed by optional bonus
                                    item_normalized = re.sub(r'\s*\+\s*\d+\s*$', '', item, flags=re.IGNORECASE)
                                    item_normalized = item_normalized.strip().lower()
                                    # Also handle skills with parentheses like "Knowledge (arcana) +14"
                                    item_normalized = re.sub(r'\s*\+\s*\d+\s*$', '', item_normalized)
                                    item_normalized = re.sub(r'\s+', ' ', item_normalized)  # Normalize whitespace
                                else:  # Feats
                                    item_normalized = item.strip().lower()
                                    item_normalized = item_normalized.rstrip('.')  # Remove trailing period
                                    item_normalized = re.sub(r'\s+', ' ', item_normalized)  # Normalize whitespace
                                
                                if item_normalized and item_normalized not in seen_skills:
                                    items.append(item_normalized)
                                    seen_skills.add(item_normalized)
                        return set(items)
        
        # Try inline format: "Skills: item1, item2;" or "Feats: item1, item2;"
        inline_prefixes = {
            'skills': r'skills:\s*',
            'feats': r'feats:\s*'
        }
        prefix = inline_prefixes.get(field_name.lower(), '')
        if prefix:
            pattern = prefix + r'([^;]+)'
            match = re.search(pattern, statblock, re.IGNORECASE | re.DOTALL)
            if match:
                value = match.group(1).strip().rstrip(';').strip().rstrip('.').strip()
                # Split on commas and normalize each item
                items = []
                for item in value.split(','):
                    item = item.strip().rstrip(';').rstrip('.').strip()  # Remove trailing semicolons and periods
                    if item:
                        if field_name.lower() == 'skills':
                            # Remove bonus values for comparison
                            item_normalized = re.sub(r'\s*\+\s*\d+\s*$', '', item, flags=re.IGNORECASE)
                            item_normalized = item_normalized.strip().lower()
                            item_normalized = re.sub(r'\s*\+\s*\d+\s*$', '', item_normalized)  # Handle cases with multiple bonuses
                            item_normalized = re.sub(r'\s+', ' ', item_normalized)
                        else:  # Feats
                            item_normalized = item.strip().lower()
                            item_normalized = item_normalized.rstrip('.')  # Remove trailing period
                            item_normalized = re.sub(r'\s+', ' ', item_normalized)
                        
                        if item_normalized:
                            items.append(item_normalized)
                return set(items)
        
        return set()
    
    # Compare Skills
    generated_skills_set = extract_comma_separated_list(generated_statblock, 'skills')
    example_skills_set = extract_comma_separated_list(example_statblock, 'skills')
    
    missing_skills = example_skills_set - generated_skills_set
    if missing_skills:
        discrepancies.append(f"  Skills missing in generated: {', '.join(sorted(missing_skills))}")
    
    extra_skills = generated_skills_set - example_skills_set
    if extra_skills:
        discrepancies.append(f"  Skills extra in generated: {', '.join(sorted(extra_skills))}")
    
    # Compare Feats
    generated_feats_set = extract_comma_separated_list(generated_statblock, 'feats')
    example_feats_set = extract_comma_separated_list(example_statblock, 'feats')
    
    missing_feats = example_feats_set - generated_feats_set
    if missing_feats:
        discrepancies.append(f"  Feats missing in generated: {', '.join(sorted(missing_feats))}")
    
    extra_feats = generated_feats_set - example_feats_set
    if extra_feats:
        discrepancies.append(f"  Feats extra in generated: {', '.join(sorted(extra_feats))}")
    
    return discrepancies


def compare_sa_block_content(variant_node: BlockNode, example_statblock: str, variant_name: str) -> List[str]:
    """
    Compare SA blocks from variant node with SA blocks from example.
    Specifically validates "Typical Sorcerer Spells Known" blocks (now in PREPEDSPELLS).
    
    Args:
        variant_node: Variant node containing SA and PREPEDSPELLS blocks
        example_statblock: Example statblock text
        variant_name: Name of variant for error reporting
    
    Returns:
        List of discrepancy messages
    """
    discrepancies = []
    
    # Extract SA blocks from variant node
    variant_sa_nodes = variant_node.find_children('SA')
    variant_sa_blocks = {}
    for sa_node in variant_sa_nodes:
        sa_content = sa_node.content.strip()
        first_line = sa_content.split('\n')[0].strip()
        # Extract ability name (remove parenthetical markers)
        ability_name = first_line.rstrip(':').strip()
        ability_name = re.sub(r'\s*\([^)]+\)\s*$', '', ability_name).lower()
        variant_sa_blocks[ability_name] = sa_content
    
    # Extract PREPEDSPELLS blocks from variant node (for "Typical Sorcerer Spells Known")
    variant_preped_nodes = variant_node.find_children('PREPEDSPELLS')
    variant_preped_blocks = {}
    for preped_node in variant_preped_nodes:
        preped_content = preped_node.content.strip()
        first_line = preped_content.split('\n')[0].strip()
        # Extract block name (remove parenthetical markers)
        block_name = first_line.rstrip(':').strip()
        block_name = re.sub(r'\s*\([^)]+\)\s*$', '', block_name).lower()
        variant_preped_blocks[block_name] = preped_content
    
    # Extract SA blocks from example (examples might still have it in SA blocks)
    example_sa_blocks = extract_sa_from_example(example_statblock)
    
    # Also check for PREPEDSPELLS in example (in case examples use PREPEDSPELLS)
    example_preped_blocks = {}
    preped_pattern = r'\{PREPEDSPELLS\}(.*?)\{/PREPEDSPELLS\}'
    preped_matches = re.finditer(preped_pattern, example_statblock, re.DOTALL | re.IGNORECASE)
    for match in preped_matches:
        preped_content = match.group(1).strip()
        first_line = preped_content.split('\n')[0].strip()
        # Extract the part before the colon (if present)
        colon_idx = first_line.find(':')
        if colon_idx != -1:
            block_name = first_line[:colon_idx].strip()
        else:
            block_name = first_line.strip()
        block_name = re.sub(r'\s*\([^)]+\)\s*$', '', block_name).lower()
        example_preped_blocks[block_name] = preped_content
    
    # Compare "Typical Sorcerer Spells Known" specifically
    # Check both SA and PREPEDSPELLS blocks (examples might have it in SA, generated has it in PREPEDSPELLS)
    spells_key = 'typical sorcerer spells known'
    example_spells = None
    generated_spells = None
    
    # Debug: log what blocks we found
    logger.debug(f"  Validation for {variant_name}:")
    logger.debug(f"    Example SA blocks keys: {list(example_sa_blocks.keys())}")
    logger.debug(f"    Example PREPEDSPELLS blocks keys: {list(example_preped_blocks.keys())}")
    logger.debug(f"    Generated SA blocks keys: {list(variant_sa_blocks.keys())}")
    logger.debug(f"    Generated PREPEDSPELLS blocks keys: {list(variant_preped_blocks.keys())}")
    
    # Find in example (check both SA and PREPEDSPELLS)
    if spells_key in example_sa_blocks:
        example_spells = example_sa_blocks[spells_key]
        logger.debug(f"    Found example spells in SA block")
    elif spells_key in example_preped_blocks:
        example_spells = example_preped_blocks[spells_key]
        logger.debug(f"    Found example spells in PREPEDSPELLS block")
    else:
        logger.debug(f"    Example spells NOT found (looking for '{spells_key}')")
    
    # Find in generated (should be in PREPEDSPELLS now)
    if spells_key in variant_preped_blocks:
        generated_spells = variant_preped_blocks[spells_key]
        logger.debug(f"    Found generated spells in PREPEDSPELLS block")
    elif spells_key in variant_sa_blocks:
        # Fallback: might still be in SA for some reason
        generated_spells = variant_sa_blocks[spells_key]
        logger.debug(f"    Found generated spells in SA block (fallback)")
    else:
        logger.debug(f"    Generated spells NOT found (looking for '{spells_key}')")
    
    if example_spells:
        if generated_spells:
            
            # Normalize both for comparison (remove extra whitespace, normalize formatting)
            example_normalized = re.sub(r'\s+', ' ', example_spells).strip().lower()
            generated_normalized = re.sub(r'\s+', ' ', generated_spells).strip().lower()
            
            # Extract just the spell list part (after the colon) for comparison
            example_colon = example_normalized.find(':')
            generated_colon = generated_normalized.find(':')
            
            if example_colon != -1 and generated_colon != -1:
                example_spell_list = example_normalized[example_colon + 1:].strip()
                generated_spell_list = generated_normalized[generated_colon + 1:].strip()
                
                # Compare spell lists (normalize order differences)
                example_spells_dict = {}
                generated_spells_dict = {}
                
                # Parse example spell list
                for part in example_spell_list.split(';'):
                    part = part.strip()
                    if not part:
                        continue
                    # Remove trailing period if present (last spell level might have one)
                    part = part.rstrip('.')
                    level_match = re.match(r'^(\d+(?:st|nd|rd|th)?)\s*--\s*(.+)', part)
                    if level_match:
                        level = level_match.group(1).strip()
                        spells_str = level_match.group(2).strip()
                        # Remove trailing period from spells string if present
                        spells_str = spells_str.rstrip('.')
                        spells = [s.strip().lower() for s in spells_str.split(',') if s.strip()]
                        if spells:
                            example_spells_dict[level] = set(spells)
                    else:
                        logger.debug(f"    Failed to parse example spell part: {part[:50]}")
                
                # Parse generated spell list
                for part in generated_spell_list.split(';'):
                    part = part.strip()
                    if not part:
                        continue
                    # Remove trailing period if present (last spell level might have one)
                    part = part.rstrip('.')
                    level_match = re.match(r'^(\d+(?:st|nd|rd|th)?)\s*--\s*(.+)', part)
                    if level_match:
                        level = level_match.group(1).strip()
                        spells_str = level_match.group(2).strip()
                        # Remove trailing period from spells string if present
                        spells_str = spells_str.rstrip('.')
                        spells = [s.strip().lower() for s in spells_str.split(',') if s.strip()]
                        if spells:
                            generated_spells_dict[level] = set(spells)
                    else:
                        logger.debug(f"    Failed to parse generated spell part: {part[:50]}")
                
                # Compare spell lists by level
                all_levels = set(example_spells_dict.keys()) | set(generated_spells_dict.keys())
                logger.debug(f"    Comparing {len(all_levels)} spell levels: {sorted(all_levels)}")
                for level in all_levels:
                    example_spells_set = example_spells_dict.get(level, set())
                    generated_spells_set = generated_spells_dict.get(level, set())
                    
                    missing = example_spells_set - generated_spells_set
                    extra = generated_spells_set - example_spells_set
                    
                    logger.debug(f"    Level {level}: example has {len(example_spells_set)} spells, generated has {len(generated_spells_set)} spells")
                    if missing:
                        logger.debug(f"    Level {level}: missing {len(missing)} spells: {sorted(missing)}")
                        discrepancies.append(f"  Typical Sorcerer Spells Known ({level}): missing spells: {', '.join(sorted(missing))}")
                    if extra:
                        logger.debug(f"    Level {level}: extra {len(extra)} spells: {sorted(extra)}")
                        discrepancies.append(f"  Typical Sorcerer Spells Known ({level}): extra spells: {', '.join(sorted(extra))}")
        else:
            discrepancies.append(f"  Typical Sorcerer Spells Known: missing in generated (present in example)")
    elif generated_spells:
        # Generated has it but example doesn't (this is okay, examples might not always have it)
        pass
    
    return discrepancies


def generate_dragon_variants(input_file: Path, output_file: Path) -> None:
    """Main function to generate dragon variants using tree-based approach."""
    logger.info(f"Reading input file: {input_file}")
    content = input_file.read_text(encoding='utf-8')
    
    # Parse into tree structure (MAINMONSTER is root, GROUP is child, CATEGORY is child of GROUP)
    logger.info("Parsing file into tree structure...")
    root = parse_into_tree(content)
    
    if root.tag != 'MAINMONSTER':
        raise ValueError(f"Expected MAINMONSTER as root, got {root.tag}")
    
    # Extract universal tables from MAINMONSTER INPUTDATA
    logger.info("Extracting universal tables...")
    universal_tables = extract_universal_tables_from_mainmonster(root)
    
    logger.info(f"Found {len(universal_tables)} universal tables")
    for table_name in universal_tables.keys():
        logger.info(f"  - {table_name}")
    
    # Extract EXAMPLE statblocks for validation
    logger.info("Extracting EXAMPLE statblocks for validation...")
    example_statblocks = extract_example_statblocks(root)
    logger.info(f"Found {len(example_statblocks)} EXAMPLE statblocks")
    
    # Process INPUTDATA nodes and generate variants
    # This will recursively process all CATEGORY nodes under GROUPs
    logger.info("Processing INPUTDATA nodes and generating variants...")
    process_inputdata_nodes(root, universal_tables, example_statblocks)
    
    # Validate generated statblocks against examples
    logger.info("Validating generated statblocks against EXAMPLES...")
    validation_errors = []
    categories = root.find_descendants('CATEGORY')
    for category_node in categories:
        category_name = category_node.get_content_without_children().split('\n')[0].strip()
        variants = category_node.find_children('VARIANT')
        for variant_node in variants:
            variant_name = variant_node.content.strip()
            # Match variant name exactly against example names
            if variant_name in example_statblocks:
                # Find STATBLOCK child
                statblock_nodes = variant_node.find_children('STATBLOCK')
                if statblock_nodes:
                    generated_statblock = statblock_nodes[0].content
                    example_statblock = example_statblocks[variant_name]
                    discrepancies = validate_statblock_against_example(
                        generated_statblock, example_statblock, variant_name
                    )
                    
                    # Also compare SA lists (Special Attacks field)
                    sa_discrepancies = compare_sa_blocks(generated_statblock, example_statblock, variant_name)
                    if sa_discrepancies:
                        discrepancies.extend(sa_discrepancies)
                    
                    # Compare Skills and Feats lists
                    skills_feats_discrepancies = compare_skills_and_feats(generated_statblock, example_statblock, variant_name)
                    if skills_feats_discrepancies:
                        discrepancies.extend(skills_feats_discrepancies)
                    
                    # Compare SA blocks (including "Typical Sorcerer Spells Known")
                    sa_block_discrepancies = compare_sa_block_content(variant_node, example_statblock, variant_name)
                    if sa_block_discrepancies:
                        discrepancies.extend(sa_block_discrepancies)
                    
                    if discrepancies:
                        validation_errors.append(f"{variant_name}:")
                        validation_errors.extend(discrepancies)
    
    if validation_errors:
        logger.warning("Statblock validation found discrepancies:")
        for error in validation_errors[:30]:  # Limit output
            logger.warning(error)
        if len(validation_errors) > 30:
            logger.warning(f"... and {len(validation_errors) - 30} more discrepancies")
    else:
        logger.info("All statblocks match their EXAMPLES!")
    
    # Output the tree (excluding INPUTDATA, EXAMPLE, and TABLE nodes)
    logger.info("Generating output...")
    output_lines = []
    output_tree(root, output_lines, exclude_tags={'INPUTDATA', 'EXAMPLE', 'TABLE'})
    
    # Write output file
    logger.info(f"Writing output file: {output_file}")
    output_file.parent.mkdir(parents=True, exist_ok=True)
    output_file.write_text("\n".join(output_lines), encoding='utf-8')
    logger.info("Done!")


def main():
    """Main entry point."""
    import sys
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Generate dragon variants from dragon-true.txt input file.',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s
  %(prog)s input.txt output.txt
  %(prog)s -i dragon-true.txt -o generated.txt
        """
    )
    
    parser.add_argument(
        '-i', '--input',
        type=Path,
        default=Path("util/monster_extractor/dragon-true.txt"),
        help='Input file path (default: util/monster_extractor/dragon-true.txt)'
    )
    
    parser.add_argument(
        '-o', '--output',
        type=Path,
        default=Path("util/monster_extractor/output/dragons/dragon-true-generated.txt"),
        help='Output file path (default: util/monster_extractor/output/dragons/dragon-true-generated.txt)'
    )
    
    # Support positional arguments for backward compatibility
    parser.add_argument(
        'input_file',
        nargs='?',
        type=Path,
        help='Input file path (alternative to -i/--input)'
    )
    
    parser.add_argument(
        'output_file',
        nargs='?',
        type=Path,
        help='Output file path (alternative to -o/--output)'
    )
    
    parser.add_argument(
        '-d', '--debug',
        action='store_true',
        help='Enable debug logging'
    )
    
    parser.add_argument(
        '-v', '--verbose',
        action='store_true',
        help='Enable verbose (DEBUG) logging (same as --debug)'
    )
    
    args = parser.parse_args()
    
    # Configure logging level based on command-line arguments
    if args.debug or args.verbose:
        logging.basicConfig(level=logging.DEBUG, format='%(levelname)s: %(message)s')
    else:
        logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
    
    # Use positional arguments if provided, otherwise use named arguments
    input_file = args.input_file if args.input_file else args.input
    output_file = args.output_file if args.output_file else args.output
    
    if not input_file.exists():
        logger.error(f"Input file not found: {input_file}")
        sys.exit(1)
    
    try:
        generate_dragon_variants(input_file, output_file)
    except Exception as e:
        logger.error(f"Error: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
