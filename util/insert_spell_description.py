import mysql.connector
import re
import os
from dotenv import load_dotenv

def parse_markdown(filepath):
    spells = []
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Split the content by "---" to get individual spell blocks
    spell_blocks = content.split('---')

    for spell_block in spell_blocks:
        lines = spell_block.split('\n')
        spell_name = lines.pop(0)
        if spell_name == '':
            spell_name = lines.pop(0)
        spell_name = spell_name[2:].strip()
        if len(lines) > 0:
            lines.pop(0) # remove the school
        if len(lines) == 0:
            continue
        description_lines = []
        for line in lines:
            if not line.startswith('**'):
                description_lines.append(line)
        
        description = '\n'.join(description_lines).strip()

        spells.append({
            'name': spell_name,
            'description': description
        })
    return spells

def update_spell_descriptions(spells_data):
    try:
        conn = mysql.connector.connect(
            host=os.getenv('DB_HOST'),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASS'),
            database=os.getenv('DB_NAME')
        )
        cursor = conn.cursor()

        for spell in spells_data:
            update_query = "UPDATE spells SET spell_description = %s WHERE spell_name = %s"
            cursor.execute(update_query, (spell['description'], spell['name']))
            print(f"Updated description for {spell['name']}")

        conn.commit()

    except mysql.connector.Error as err:
        print(f"Error: {err}")
    finally:
        if 'conn' in locals() and conn.is_connected():
            cursor.close()
            conn.close()
            print("Database connection closed.")

if __name__ == "__main__":
    load_dotenv()

    markdown_filepath = '../cache/processed_spells/phb35_spells_cleaned.md'
    
    if not os.path.exists(markdown_filepath):
        print(f"Error: Markdown file not found at {markdown_filepath}")
    else:
        print(f"Parsing {markdown_filepath}...")
        spells = parse_markdown(markdown_filepath)
        print(f"Found {len(spells)} spells. Updating database...")
        update_spell_descriptions(spells) 