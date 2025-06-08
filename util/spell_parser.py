import csv
import argparse
from collections import defaultdict

def make_unique_headers(headers):
    counter = defaultdict(int)
    unique_headers = []
    
    for h in headers:
        if counter[h] == 0:
            unique_headers.append(h)
        else:
            unique_headers.append(f"{h}{counter[h]}")
        counter[h] += 1
    return unique_headers

def parse_csv_to_dicts(file_path):
    data = []
    try:
        with open(file_path, newline='', encoding='cp1252') as csvfile:
            reader = csv.reader(csvfile)
            raw_headers = next(reader)
            headers = make_unique_headers(raw_headers)
            
            for row in reader:
                row_dict = dict(zip(headers, row))
                data.append(row_dict)
        return data
    except FileNotFoundError:
        print(f"Error: File '{file_path}' not found.")
        return []
    except Exception as e:
        print(f'An error occurred: {e}')
        return []

def main():
    classes = ['Adept','Apostle of Peace','Archivist','Artificer','Assassin','Bard','Beguiler','Beloved of Valarian','Blackguard','Blighter','Champion of Gwynharwyf','Cleric','Consecrated Harrier','Corrupt Avenger','Death Delver','Demonologist','Disciple of Thrym','Divine Crusader','Dread Necromancer','Druid','Duskblade','Emissary of Barachiel','Fatemaker','Favored Soul','Friar','Gnome Artificer','Healer','Hexblade','Hoardstealer','Holy Liberator','Hunter of the Dead','Knight of the Chalice','Mortal Hunter','Ocular Adept','Paladin','Pious Templar','Ranger','Shugenja','Slayer of Domiel','Sorcerer','Spellthief','Spirit Shaman','Sublime Chord','Suel Arcanamach','Temple Raider of Olidammara','Universal Caster','Ur-Priest','Vassal of Bahamut','Vigilante','Warlock','Warmage','Wizard','Wu Jen']
    class_map = {c: i for i, c in enumerate(classes)}
    keys_to_print = ['Spell Name','School','Comp','Cast','Range','Duration','Save','SR','Description']

    parser = argparse.ArgumentParser(description='Parse a CSV file.')
    parser.add_argument('-f', '--file', help='Path to the CSV file', required=True)
    args = parser.parse_args()

    spell_list = []
    records = parse_csv_to_dicts(args.file)
    for record in records:
        filtered = {k: v for k, v in record.items() if k in classes and v and str(v).strip()}
        if filtered:
            book_info = []
            books = record['Full Refer'].split(',')
            for b in books:
                book_info.append(dict(zip(['Book','Page'],[x.strip() for x in b.split(': pg')])))
            class_list = [{'Class': class_map[k], 'Level': v} for k, v in filtered.items()]
            spell_list.append({key: record[key] for key in keys_to_print if key in record}|{'Source': book_info, 'Classes': class_list})

    for index, spell in enumerate(spell_list):
        print(index, spell)

if __name__ == '__main__':
    main()
