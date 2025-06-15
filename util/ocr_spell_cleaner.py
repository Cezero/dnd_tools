import csv
import re
import os

DESCRIPTION_HINTS = re.compile(
    r"""(?x)  # verbose mode
    \b(
        Mass\b
        |You\b
        |This\b
        |The\b
        |It\b
        |A\b
        |An\b
    )"""
)

def split_targets_and_description(text):
    # Look for sentence-ending punctuation followed by likely description starter
    matches = list(re.finditer(r'(?<=[.;?!])\s+(?=[A-Z])', text))
    for match in matches:
        idx = match.start()
        # Check what comes next
        remainder = text[idx:].lstrip()
        if DESCRIPTION_HINTS.match(remainder):
            return text[:idx].strip(), remainder.strip()

    # If nothing found, assume whole string is targets (fallback)
    return text.strip(), ''

def validate_spell_block(block_content: str, min_length: int = 100, min_keywords: int = 2) -> bool:
    """
    Validates if a given block of text is likely a full spell description.
    Checks for minimum length and presence of a certain number of spell-related keywords.
    """
    # Keywords expected in a valid spell block (case-insensitive for robustness)
    SPELL_KEYWORDS = [
        "Level", "Components", "Casting Time", "Range", "Effect", "Duration", "Target", "Targets", "Enchantment",
        "Saving Throw", "Spell Resistance", "Divination", "Evocation", "Conjuration", "Necromancy", "Abjuration", "Transmutation"
    ]

    if len(block_content) < min_length:
        return False

    found_keywords_count = 0
    for keyword in SPELL_KEYWORDS:
        if re.search(r'\b' + re.escape(keyword) + r'\b', block_content, re.IGNORECASE):
            found_keywords_count += 1
            if found_keywords_count >= min_keywords:
                return True
    
    return False

def find_block_end(end_token: str, buffer: str) -> int:
    search_start_pos = 0
    buffer_end = len(buffer) - len(end_token)
    possible_block_end = 0
    while (search_start_pos < buffer_end):
        possible_end_pos = buffer[search_start_pos:].find(end_token)
        # found a possible end, check if it's a valid spell block
        if possible_end_pos != -1:
            possible_block_end = search_start_pos + possible_end_pos
            if validate_spell_block(buffer[:possible_block_end]):
                # valid spell block, return the end position
                return possible_block_end
            else:
                # invalid spell block, continue searching
                search_start_pos = possible_block_end + 1
        else:
            # no more possible ends, return -1
            return -1
    # no room in buffer for another end token, return -1
    return -1

def format_spell_block(block: str) -> str:
    """
    Formats a spell block into a markdown string, cleaning up common OCR errors.
    """
    spell_name = ""
    spell_school = ""
    spell_level = ""
    # Normalize whitespace: replace multiple spaces with a single space
    block = re.sub(r'\s+', ' ', block)

    # Split the block into lines initially
    lines = block.split('\n')
    cleaned_lines = []
    for line in lines:
        line = line.strip()
        if line:
            cleaned_lines.append(line)
    
    clean_block = " ".join(cleaned_lines)
    spell_schools = ['Abjuration', 'Conjuration', 'Divination', 'Enchantment', 'Evocation', 'Illusion', 'Necromancy', 'Transmutation', 'Universal']
    class_abbreviations = ['Bbn', 'Brd', 'Clr', 'Drd', 'Ftr', 'Mnk', 'Pal', 'Rgr', 'Rog', 'Sor/Wiz', 'Wiz']
    spell_domains = ['Air', 'Animal', 'Chaos', 'Death', 'Destruction', 'Earth', 'Evil', 'Fire', 'Good', 'Healing', 'Knowledge', 'Law', 'Luck', 'Magic', 'Plant', 'Protection', 'Strength', 'Sun', 'Travel', 'Trickery', 'War', 'Water']
    level_types = [*class_abbreviations, *spell_domains]
    level_types.sort()
    optional_labels = ['Components', 'Casting Time', 'Range', 'Area','Effect', 'Target', 'Targets', 'Duration', 'Saving Throw', 'Spell Resistance']
    duration_pattern = re.compile(
        r"""
        ^                            # start of string
        (?:                          # non-capturing group
            (?:\d+|One)              # number or "One"
            \s+
            \w+(?:\.)?            # unit like min., round, day, etc.
            (?:/level)?              # optional /level
            (?:\s*\(*D*\)*)?          # optional (D), (F), etc.
        |
            \w+                      # standalone like Concentration, Instantaneous
        )
        (?:                          # optional additional duration
            \s+or\s+
            (?:\d+|One)\s+\w+(?:\.\w+)?(?:/level)?(?:\s*\(.*?\))?
        )?
        """,
        re.VERBOSE | re.IGNORECASE)
    component_pattern = re.compile(
        r"""
        [\s,\.]*                         # allow spaces, commas, or periods before the component
        (
            F\s*[/\.]?\s*DF             # F/DF, F.DF, F DF, F DF, F DF, F DF
            |DF
            |XP
            |[VSMF]                     # V, S, M, F
        )
        """,
        re.IGNORECASE | re.VERBOSE
    )
    # the first words prior to a spell school is the spell name
    for school in spell_schools:
        school_index = clean_block.find(school)
        if school_index != -1:
            spell_name = clean_block[:school_index].strip()
            clean_block = clean_block[school_index:].strip()
            break
    else:
        spell_name = clean_block.split()[0] # no spell school found, use the first word as the spell name
    # after the spell school there should be the Level entry
    level_index = clean_block.find("Level")
    levels = []
    if level_index != -1:
        spell_school = clean_block[:level_index].strip()
        # the spell level block consists of one or more class abbreviations and level numbers, each pair separated by a comma
        # this sequence is the spell level block
        clean_block = clean_block[level_index + 5:]
        # go through each level type and if found, add to level array with the level number
        for level_type in level_types:
            # bail out if the block starts with a component entry
            if clean_block.startswith(' Components'):
                break
            match = re.search(f"{level_type}\s*(\d+)", clean_block)
            if match:
                # find the level number
                level_number = match.group(1)
                levels.append(f"{level_type} {level_number}")
                clean_block = clean_block[match.end():]
        if len(levels) > 0:
            spell_level = ", ".join(levels)
        else:
            print(f"Unable to parse spell levels for {spell_name}, cannot format spell block")
            return clean_block
    else:
        print(f"Unable to find 'Level' for {spell_name}, cannot format spell block")
        return clean_block.strip()
    
    optional_entries_found = []
    optional_entries = {}
    # go through each optional entry and if found, add to the formatted block
    for entry in optional_labels:
        entry_index = clean_block.find(entry)
        if entry_index != -1:
            optional_entries_found.append((entry, entry_index))

    if (len(optional_entries_found) > 0):
        filtered_oe = []
        for i in range(len(optional_entries_found)-1):
            field, index = optional_entries_found[i]
            next_field, next_index = optional_entries_found[i+1]
            if index <= next_index:
                filtered_oe.append((field, index))

        filtered_oe.append(optional_entries_found[-1])
        optional_entries_found = filtered_oe

    # optional entries end at the start of the next optional entry or the end of the block
    while (optional_entries_found):
        label, index = optional_entries_found.pop(0)
        if len(optional_entries_found) > 0:
            n_label, n_index = optional_entries_found[0]
            optional_entries[label] = clean_block[index + len(label):n_index].strip()
        else:
            optional_entries[label] = clean_block[index + len(label):].strip()

    spell_description = ""
    # if spell resistance is found, validate the value and the remainder will be the spell description
    if "Spell Resistance" in optional_entries:
        #valid_values = ['No or Yes (harmless)', 'Yes (harmless)', 'Yes (object)', 'Yes (harmless, object)', 'Yes (harmless) or Yes (harmless, object)', 'Yes; See text', 'No; See text', 'No (object) and Yes; see text', 'Yes', 'No', 'See text']
        SPELL_RESISTANCE_RE = re.compile(
            r"""
            ^
            (
                (?:
                    (?:Yes|No)                               # Yes or No
                    (?:\s*\(\s*(?:harmless|object|harmless\s*,\s*object)\s*\))?  # optional parens
                )
                (?:                                          # optionally followed by or/and clause
                    \s*(?:or|and)\s*
                    (?:Yes|No)
                    (?:\s*\(\s*(?:harmless|object|harmless\s*,\s*object)\s*\))?
                )*
                |
                See\s+text
            )
            (?:\s*;\s*See\s+text)?                           # optional '; See text'
            (?=\b|[\s.;])                                    # must be followed by a boundary
            """,
            re.VERBOSE | re.IGNORECASE
        )
        sr_value = optional_entries["Spell Resistance"].rstrip()
        match = SPELL_RESISTANCE_RE.match(sr_value)
        if match:
            spell_description = sr_value[match.end():].strip()
            optional_entries["Spell Resistance"] = match.group(1)
        else:
            print(f"Invalid spell resistance value for {spell_name}: {optional_entries['Spell Resistance']}")
    
    if "Duration" in optional_entries:
        duration_match = duration_pattern.match(optional_entries["Duration"])
        if duration_match:
            if spell_description == "":
                spell_description = optional_entries["Duration"][duration_match.end():].strip()
            optional_entries["Duration"] = duration_match.group(0)
        else:
            print(f"Invalid duration value for {spell_name}: {optional_entries['Duration']}")

    if "Components" in optional_entries:
        pos = 0
        found_components = []
        while (pos < len(optional_entries["Components"])):
            match = component_pattern.match(optional_entries["Components"], pos)
            if not match:
                break
            token = match.group(1).upper().replace(' ', '').replace('.', '')
            if token == 'FDF':
                token = 'F/DF'
            found_components.append(token)
            pos = match.end()
        if len(found_components) > 0:
            if spell_description == "":
                spell_description = optional_entries["Components"][pos:].strip()
            cleaned = ', '.join(found_components)
            optional_entries["Components"] = cleaned
        else:
            print(f"No components found for {spell_name}")

    if "Targets" in optional_entries and spell_description == "":
        targets, spell_description = split_targets_and_description(optional_entries["Targets"])
        optional_entries["Targets"] = targets

    if "Target" in optional_entries and spell_description == "":
        targets, spell_description = split_targets_and_description(optional_entries["Target"])
        optional_entries["Target"] = targets

    if "Saving Throw" in optional_entries and spell_description == "":
        SAVING_THROW_RE = re.compile(
            r"""
            ^(
                (?:
                    None |
                    (?:Fortitude|Reflex|Will)
                    \s+(?:negates|half|partial|reduces|none)
                    (?:\s*\(.*?\))?
                    (?:\s*(?:or|and)\s*
                        (?:Fortitude|Reflex|Will)
                        \s+(?:negates|half|partial|reduces|none)
                        (?:\s*\(.*?\))?
                    )*
                    (?:\s*;\s*see\s+text(?:\s+for\s+\w+(?:\s+\w+)*)?)?
                )
            )
            (?=\s+(?:This|You|Creatures|Mass|One|The|An|A)\b)
            """,
            re.IGNORECASE | re.VERBOSE,
        )
        saving_throw = optional_entries["Saving Throw"]
        match = SAVING_THROW_RE.match(saving_throw)
        if match:
            spell_description = saving_throw[match.end():].strip()
            optional_entries["Saving Throw"] = match.group(1)
        else:
            print(f"Invalid saving throw value for {spell_name}: {optional_entries['Saving Throw']}")

    if spell_description == "":
        print(f"No description found for {spell_name}, using entire block as description")
        spell_description = clean_block

    formatted_block = f"## {spell_name}\n"
    formatted_block += f"{spell_school}\n"
    formatted_block += f"**Level:** {spell_level}\n"
    for entry in optional_entries:
        if optional_entries[entry] != "":
            formatted_block += f"**{entry}:** {optional_entries[entry]}\n"
    formatted_block += f"{spell_description.rstrip()}"

    return formatted_block

# read source text file
source_text_file = "/home/countzero/git/dnd_tools/cache/raw_text/phb35/spells.txt"
with open(source_text_file, 'r') as f:
    source_text = f.read()

# write detected spell blocks to a new file
output_file_path = "/home/countzero/git/dnd_tools/cache/processed_spells/phb35_spells_cleaned.md"

os.makedirs(os.path.dirname(output_file_path), exist_ok=True)

spells = source_text.split('---')
with open(output_file_path, 'w', encoding='utf-8') as f:
    for spell in spells:
        f.write(format_spell_block(spell))
        f.write("\n---\n") # Separator for clarity between spells

print(f"✅ Extracted {len(spells)} spells. Output saved to {output_file_path}")
