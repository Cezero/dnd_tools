import csv
import re

# Read spell names from CSV
def read_spell_names(csv_path):
    with open(csv_path, newline='') as f:
        reader = csv.reader(f)
        # Return the first column
        return [row[0] for row in reader]

# Read input text file
def read_text_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        return f.readlines()

# Main logic
def insert_delimiters(spell_names, lines):
    current_line = 0
    found_spells = []

    for spell in spell_names:
        print(f"Processing spell: {spell}")
        spell_lower = spell.lower()
        spell_len = len(lines)
        found = False

        while current_line < spell_len:
            line = lines[current_line]
            index = line.lower().find(spell_lower)

            if index != -1:
                # Auto-accept if spell starts the line and line is at top or after '---'
                if index == 0:
                    prev_line = lines[current_line - 1].strip() if current_line > 0 else ''
                    if current_line == 0 or prev_line == '---':
                        found_spells.append(spell)
                        current_line += 1
                        found = True
                        print(f"Found spell: {spell} with proper delimiter, moving to next spell")
                        break

                # Otherwise prompt
                context_start = max(0, current_line - 2)
                context_end = min(len(lines), current_line + 2)
                context = ''.join(lines[context_start:context_end])
                print(f"\n❓ Possible match for: **{spell}**")
                print("Context:\n---\n" + context + "---")
                choice = input("Insert delimiter and accept? (Y)es / (N)o: ").strip().lower()

                if choice == 'y':
                    before = line[:index].rstrip()
                    after = line[index:].lstrip()
                    new_lines = []
                    if before:
                        new_lines.append(before + '\n')
                    new_lines.extend(['---\n', after])

                    # Replace the current line with split content
                    lines = lines[:current_line] + new_lines + lines[current_line + 1:]
                    found_spells.append(spell)
                    current_line += len(new_lines)
                    found = True
                    break
                else:
                    current_line += 1
            else:
                current_line += 1

        if not found:
            print(f"⚠️ Spell not found: {spell}")

    return lines, found_spells

# Write updated text to file
def write_text_file(file_path, lines):
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(lines)

# ---- Run it ----
if __name__ == '__main__':
    spell_csv = '../data_extracts/phb_spells.csv'
    text_path = '../cache/raw_text/phb35/spells.txt'
    updated_text_path = '../cache/raw_text/phb35/spells_updated.txt'

    spell_names = read_spell_names(spell_csv)
    lines = read_text_file(text_path)

    updated_lines, found = insert_delimiters(spell_names, lines)

    write_text_file(updated_text_path, updated_lines)

    print(f"\n✅ Finished processing. {len(found)} spells found and marked.")
    print(f"✍️ Updated file saved to: {updated_text_path}")
