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

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
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


def process_inputdata_nodes(node: BlockNode, universal_tables: Dict[str, Dict]) -> None:
    """
    Walk the tree and process INPUTDATA nodes:
    - Extract tables and metadata from INPUTDATA
    - Generate VARIANT nodes for each age category
    - Add VARIANT nodes to their parent CATEGORY nodes
    """
    # Process children first (depth-first)
    for child in node.children[:]:  # Copy list since we may modify it
        process_inputdata_nodes(child, universal_tables)
    
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
            
            # Convert both age and category name to Title Case
            age_title = to_title_case(age)
            category_name_title = to_title_case(category_name)
            variant_name = f"{age_title} {category_name_title}"
            # Extract category-specific class skills
            category_class_skills = extract_category_class_skills(node)
            
            statblock_text = generate_statblock(
                age, category_name_title, stats_row, abilities_row,
                universal_tables, category_metadata, breath_shape, breath_type,
                abilities_table, category_class_skills  # Pass class skills for calculation
            )
            
            # Create VARIANT node
            variant_node = BlockNode(tag='VARIANT', content=variant_name)
            
            # Add STATBLOCK child
            statblock_node = BlockNode(tag='STATBLOCK', content=statblock_text)
            variant_node.add_child(statblock_node)
            
            # Add age-specific SA sections (breath weapon, frightful presence)
            add_age_specific_sa_nodes(variant_node, age, stats_row, abilities_row, 
                                      breath_shape, breath_type, category_metadata, universal_tables)
            
            # Add other category-level SA sections to each variant (from outside INPUTDATA)
            add_category_sa_nodes_to_variant(variant_node, node)
            
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


def calculate_skills(stats_row: Dict, abilities_row: Dict, category_class_skills: List[str]) -> str:
    """
    Calculate skills based on formula: (6 + Int modifier, minimum 1) x (Hit Dice + 3)
    Most dragons max out Listen, Search, and Spot.
    Remaining points go to: Concentration, Diplomacy, Escape Artist, Intimidate, Knowledge (any), Sense Motive, Use Magic Device
    Plus category-specific class skills.
    
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
    
    # Standard class skills for all dragons
    standard_class_skills = ['Listen', 'Search', 'Spot', 'Concentration', 'Diplomacy', 
                            'Escape Artist', 'Intimidate', 'Knowledge (any)', 'Sense Motive', 'Use Magic Device']
    
    # Combine with category-specific class skills
    all_class_skills = list(set(standard_class_skills + category_class_skills))
    
    # Max out Listen, Search, and Spot first (these are always maxed)
    skills_dict = {}  # skill_name -> ranks
    ranks_used = 0
    
    # Max out Listen, Search, Spot (ranks = HD + 3)
    max_ranks = hd_num + 3
    for skill in ['Listen', 'Search', 'Spot']:
        if skill in all_class_skills:
            skills_dict[skill] = max_ranks
            ranks_used += max_ranks
    
    # Distribute remaining points to other skills
    # Priority order based on typical dragon skill usage
    remaining_points = total_skill_points - ranks_used
    other_skills = [s for s in all_class_skills if s not in ['Listen', 'Search', 'Spot']]
    
    # Priority skills that dragons typically invest heavily in
    priority_skills = ['Intimidate', 'Move Silently', 'Climb', 'Swim', 'Hide']
    
    # Allocate to priority skills first (up to max_ranks)
    for skill in priority_skills:
        if skill in other_skills and remaining_points > 0:
            # Allocate significant points to priority skills
            allocation = min(max_ranks, remaining_points // 2) if remaining_points >= max_ranks else remaining_points
            if allocation > 0:
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
    
    # Format skills string with total bonus (ranks + ability modifier)
    skills_parts = []
    for skill, ranks in sorted(skills_dict.items()):
        if ranks == 0:
            continue
        
        # Get key ability for this skill
        key_ability = get_skill_key_ability(skill)
        ability_mod = get_ability_modifier(ability_scores[key_ability])
        
        # Total bonus = ranks + ability modifier
        total_bonus = ranks + ability_mod
        
        # Handle special cases like "Speak Language 6 ranks"
        if 'Language' in skill or skill == 'Speak Language':
            skills_parts.append(f"{skill} {ranks} ranks")
        else:
            # Format with sign (positive or negative)
            sign = '+' if total_bonus >= 0 else ''
            skills_parts.append(f"{skill} {sign}{total_bonus}")
    
    return ', '.join(skills_parts) if skills_parts else ''


def calculate_feats(stats_row: Dict, size_abbr: str = '') -> str:
    """
    Calculate feats: 1 feat + 1 feat per 3 Hit Dice.
    Dragons favor: Alertness, Blind-Fight, Cleave, Flyby Attack, Hover, 
    Improved Initiative, Improved Sunder, Power Attack, Snatch, 
    Weapon Focus (claw or bite), Wingover, and metamagic feats.
    
    Args:
        stats_row: Row from stats table
        size_abbr: Size abbreviation (for determining if certain feats are available)
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
    
    # Core feats that most dragons have (in priority order)
    core_feats = [
        'Improved Natural Armor',  # Common defensive feat
        'Multiattack',  # Important for secondary attacks
        'Power Attack',  # Common offensive feat
        'Wingover',  # Common flight feat
    ]
    
    # Additional preferred feats
    additional_feats = [
        'Snatch',  # For grabbing opponents
        'Weapon Focus (bite)',  # Improves primary attack
        'Flyby Attack',  # Flight combat
        'Hover',  # Flight maneuverability
        'Improved Initiative',  # Combat advantage
        'Alertness',  # Perception
        'Cleave',  # Melee combat
        'Improved Sunder',  # Combat option
        'Blind-Fight',  # Combat utility
    ]
    
    # Select feats: start with core, then add from additional list
    selected_feats = []
    
    # Always include core feats (up to available slots)
    for feat in core_feats:
        if len(selected_feats) < num_feats:
            selected_feats.append(feat)
    
    # Fill remaining slots from additional feats
    for feat in additional_feats:
        if len(selected_feats) < num_feats:
            selected_feats.append(feat)
    
    # If still need more feats, add more from the list (cycling)
    # Limit iterations to prevent infinite loop
    max_iterations = num_feats * 2
    iterations = 0
    while len(selected_feats) < num_feats and additional_feats and iterations < max_iterations:
        iterations += 1
        # Add more from additional list (avoid duplicates)
        for feat in additional_feats:
            if feat not in selected_feats and len(selected_feats) < num_feats:
                selected_feats.append(feat)
                break  # Only add one per iteration
    
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
    org_match = re.search(r'^Organization:\s*(.+)$', inputdata_content, re.MULTILINE | re.IGNORECASE | re.DOTALL)
    if org_match:
        org_text = org_match.group(1).strip()
        metadata['organization'] = parse_multi_value_field(org_text, 'Organization')
    
    # Extract Challenge Rating (multi-value)
    cr_match = re.search(r'^Challenge Rating[s]?:\s*(.+)$', inputdata_content, re.MULTILINE | re.IGNORECASE)
    if cr_match:
        cr_text = cr_match.group(1).strip()
        metadata['challenge_rating'] = parse_multi_value_field(cr_text, 'Challenge Rating')
    
    # Extract Treasure
    treasure_match = re.search(r'^Treasure:\s*(.+)$', inputdata_content, re.MULTILINE | re.IGNORECASE)
    if treasure_match:
        metadata['treasure'] = treasure_match.group(1).strip()
    
    # Extract Alignment
    align_match = re.search(r'^Alignment:\s*(.+)$', inputdata_content, re.MULTILINE | re.IGNORECASE)
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
        breath_text = f"Breath Weapon (Su): {breath_dim} {breath_shape}, damage {breath_damage}{breath_type_str}, Reflex DC {breath_dc} half."
        
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
        fp_text = f"Frightful Presence (Ex): {fp_radius}-ft. radius, HD {hd_num} or less, Will DC {fp_dc} negates."
        sa_node = BlockNode(tag='SA', content=fp_text)
        variant_node.add_child(sa_node)


def add_category_sa_nodes_to_variant(variant_node: BlockNode, category_node: BlockNode) -> None:
    """Add category-level SA nodes to variant (excluding breath weapon and those in INPUTDATA)."""
    for child in category_node.children:
        if child.tag == 'SA':
            sa_content = child.content
            # Skip breath weapon (already added) and universal descriptions
            if 'breath weapon' not in sa_content.lower() or 'one type' in sa_content.lower():
                sa_node = BlockNode(tag='SA', content=sa_content)
                variant_node.add_child(sa_node)
        elif child.tag not in ('INPUTDATA', 'FLAVORTEXT', 'DESCRIPTION'):
            # Recursively check for SA nodes in other blocks (but not INPUTDATA)
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
                    sa_content = sa_descendant.content
                    if 'breath weapon' not in sa_content.lower() or 'one type' in sa_content.lower():
                        sa_node = BlockNode(tag='SA', content=sa_content)
                        variant_node.add_child(sa_node)


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
    Returns a dict mapping age to value.
    """
    result = {}
    # Split by semicolon
    parts = [p.strip() for p in text.split(';')]
    
    for part in parts:
        if not part:
            continue
        # Try to match age categories
        for age in AGE_CATEGORIES:
            pattern = rf'\b{re.escape(age)}\s*[:\-]?\s*(.+?)(?:\s*;|\s*$)'
            match = re.search(pattern, part, re.IGNORECASE)
            if match:
                result[age] = match.group(1).strip()
                break
    
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


def to_title_case(text: str) -> str:
    """Convert text to proper Title Case, handling multi-word phrases."""
    return ' '.join(word.capitalize() for word in text.split())


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
    category_class_skills: Optional[List[str]] = None
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
    
    # Initiative
    init = abilities_row.get('Initiative', '').strip()
    statblock_lines.append(f"Initiative: {init}")
    
    # Speed
    speed = abilities_row.get('Speed', '').strip()
    statblock_lines.append(f"Speed: {speed}")
    
    # Armor Class
    ac = abilities_row.get('AC', '').strip()
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
    space_reach_table = universal_tables.get('Dragon Space/Reach, Attacks, and Damage')
    if space_reach_table:
        bite_damage = get_table_value_by_size(space_reach_table, size_abbr, '1 Bite')
        if bite_damage and bite_damage != '--':
            attack_bonus = base_attack_num + str_mod
            bite_damage_with_str = f"{bite_damage}+{str_mod}" if str_mod > 0 else bite_damage
            statblock_lines.append(f"Attack: +{attack_bonus} melee ({bite_damage_with_str}, bite)")
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
        full_attack_parts = []
        bite_damage = get_table_value_by_size(space_reach_table, size_abbr, '1 Bite')
        claw_damage = get_table_value_by_size(space_reach_table, size_abbr, '2 Claws')
        wing_damage = get_table_value_by_size(space_reach_table, size_abbr, '2 Wings')
        tail_damage = get_table_value_by_size(space_reach_table, size_abbr, '1 Tail Slap')
        
        if bite_damage and bite_damage != '--':
            bite_bonus = base_attack_num + str_mod
            bite_damage_with_str = f"{bite_damage}+{str_mod}" if str_mod > 0 else bite_damage
            full_attack_parts.append(f"+{bite_bonus} melee ({bite_damage_with_str}, bite)")
        
        if claw_damage and claw_damage != '--':
            claw_bonus = base_attack_num + str_mod - 5  # Secondary attack
            claw_damage_with_str = f"{claw_damage}+{str_mod//2}" if str_mod > 0 else claw_damage
            full_attack_parts.append(f"+{claw_bonus} melee ({claw_damage_with_str}, 2 claws)")
        
        if wing_damage and wing_damage != '--':
            wing_bonus = base_attack_num + str_mod - 5  # Secondary attack
            wing_damage_with_str = f"{wing_damage}+{str_mod//2}" if str_mod > 0 else wing_damage
            full_attack_parts.append(f"+{wing_bonus} melee ({wing_damage_with_str}, 2 wings)")
        
        if tail_damage and tail_damage != '--':
            tail_bonus = base_attack_num + str_mod - 5  # Secondary attack
            tail_damage_with_str = f"{tail_damage}+{int(str_mod * 1.5)}" if str_mod > 0 else tail_damage
            full_attack_parts.append(f"+{tail_bonus} melee ({tail_damage_with_str}, tail slap)")
        
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
    
    # Check for spell-like abilities that should be in Special Attacks
    if 'darkness' in all_abilities_text:
        special_attacks.append('darkness')
    if 'corrupt water' in all_abilities_text:
        special_attacks.append('corrupt water')
    if 'plant growth' in all_abilities_text:
        special_attacks.append('plant growth')
    if 'insect plague' in all_abilities_text:
        special_attacks.append('insect plague')
    if 'charm reptiles' in all_abilities_text:
        special_attacks.append('charm reptiles')
    
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
    special_qualities.append('immunity to acid, sleep, and paralysis')
    special_qualities.append('low-light vision')
    
    # Add water breathing for water dragons
    if 'water' in type_line.lower():
        special_qualities.append('water breathing')
    
    # Add spell resistance if present
    sr = abilities_row.get('SR', '').strip()
    if sr and sr != '--':
        special_qualities.append(f'spell resistance {sr}')
    
    # Add damage reduction and other special abilities from table
    # Use all_abilities_text which was built from accumulated abilities
    if all_abilities_text:
        # Extract DR if present
        dr_match = re.search(r'dr\s+(\d+)/magic', all_abilities_text, re.IGNORECASE)
        if dr_match:
            dr_value = dr_match.group(1)
            special_qualities.append(f'damage reduction {dr_value}/magic')
        # Add other special abilities that aren't spell-like
        # (darkness, corrupt water, etc. are already in Special Attacks)
    
    if special_qualities:
        statblock_lines.append(f"Special Qualities: {', '.join(special_qualities)}")
    
    # Saves
    fort_save = stats_row.get('Fort Save', '').strip()
    ref_save = stats_row.get('Ref Save', '').strip()
    will_save = stats_row.get('Will Save', '').strip()
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
    skills_text = calculate_skills(stats_row, abilities_row, category_class_skills)
    if skills_text:
        statblock_lines.append(f"Skills: {skills_text}")
    
    # Feats
    feats_text = calculate_feats(stats_row, size_abbr)
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
        if cr_value:
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
        if adv_value:
            statblock_lines.append(f"Advancement: {adv_value}")
    elif adv:
        statblock_lines.append(f"Advancement: {adv}")
    
    # Level Adjustment
    la = category_metadata.get('level_adjustment', {})
    if isinstance(la, dict):
        la_value = la.get(age, '').strip()
        if la_value:
            statblock_lines.append(f"Level Adjustment: {la_value}")
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
    """Extract EXAMPLE statblocks from the tree, keyed by category and age."""
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
                # Extract age from first non-empty line (e.g., "Young Adult Black Dragon:")
                lines = [l.strip() for l in example_content.split('\n') if l.strip()]
                if not lines:
                    continue
                first_line = lines[0]
                # Try to match age (normalize both for comparison)
                first_line_lower = first_line.lower()
                for age in AGE_CATEGORIES:
                    age_lower = age.lower()
                    # Check if age appears in first line (handle "Young adult" vs "Young Adult")
                    if age_lower in first_line_lower or age_lower.replace(' ', '') in first_line_lower.replace(' ', ''):
                        key = f"{category_name}|{age}"
                        examples[key] = example_content
                        break
    
    return examples


def validate_statblock_against_example(generated_statblock: str, example_statblock: str, 
                                       variant_name: str) -> List[str]:
    """Compare generated statblock to example and return list of discrepancies."""
    discrepancies = []
    
    # Normalize both statblocks for comparison
    def normalize_statblock(text: str) -> Dict[str, str]:
        """Extract key fields from statblock text."""
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
    
    generated_fields = normalize_statblock(generated_statblock)
    example_fields = normalize_statblock(example_statblock)
    
    # Compare key fields
    key_fields = ['armor class', 'attack', 'full attack', 'space/reach', 
                  'special attacks', 'special qualities', 'saves', 'abilities']
    
    for field in key_fields:
        gen_value = generated_fields.get(field, '').lower()
        ex_value = example_fields.get(field, '').lower()
        
        if gen_value != ex_value:
            # Normalize for comparison (remove extra spaces, etc.)
            gen_normalized = re.sub(r'\s+', ' ', gen_value)
            ex_normalized = re.sub(r'\s+', ' ', ex_value)
            
            if gen_normalized != ex_normalized:
                discrepancies.append(
                    f"  {field}: Generated='{gen_value[:60]}...' vs Example='{ex_value[:60]}...'"
                )
    
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
    process_inputdata_nodes(root, universal_tables)
    
    # Validate generated statblocks against examples
    logger.info("Validating generated statblocks against EXAMPLES...")
    validation_errors = []
    categories = root.find_descendants('CATEGORY')
    for category_node in categories:
        category_name = category_node.get_content_without_children().split('\n')[0].strip()
        variants = category_node.find_children('VARIANT')
        for variant_node in variants:
            variant_name = variant_node.content.strip()
            # Extract age from variant name
            for age in AGE_CATEGORIES:
                if age.lower() in variant_name.lower():
                    key = f"{category_name}|{age}"
                    if key in example_statblocks:
                        # Find STATBLOCK child
                        statblock_nodes = variant_node.find_children('STATBLOCK')
                        if statblock_nodes:
                            generated_statblock = statblock_nodes[0].content
                            example_statblock = example_statblocks[key]
                            discrepancies = validate_statblock_against_example(
                                generated_statblock, example_statblock, variant_name
                            )
                            if discrepancies:
                                validation_errors.append(f"{variant_name}:")
                                validation_errors.extend(discrepancies)
                    break
    
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
    
    args = parser.parse_args()
    
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
