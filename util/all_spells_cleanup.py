import csv
from collections import defaultdict
import sys

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

spell_csv_file = "/home/countzero/git/dnd_tools/data_extracts/all_spells.csv"

class_name_abbr = {
    'Adept': 'Adpt',
    'Apostle of Peace': 'AoP',
    'Archivist': 'Archv',
    'Artificer': 'Arti',
    'Assassin': 'Asn',
    'Bard': 'Brd',
    'Beguiler': 'Begl',
    'Beloved of Valarian': 'BoV',
    'Blackguard': 'Bg',
    'Blighter': 'Blght',
    'Champion of Gwynharwyf': 'CoG',
    'Cleric': 'Clr',
    'Consecrated Harrier': 'ConHar',
    'Corrupt Avenger': 'CorAv',
    'Death Delver': 'DthDel',
    'Demonologist': 'Dmn',
    'Disciple of Thrym': 'DoT',
    'Divine Crusader': 'DivCru',
    'Dread Necromancer': 'DrdNec',
    'Druid': 'Drd',
    'Duskblade': 'DskBl',
    'Emissary of Barachiel': 'EoB',
    'Fatemaker': 'Ftmk',
    'Favored Soul': 'Fvs',
    'Gnome Artificer': 'GnArt',
    'Healer': 'Heal',
    'Hexblade': 'Hex',
    'Hoardstealer': 'HrdStl',
    'Holy Liberator': 'HoLib',
    'Hunter of the Dead': 'HotD',
    'Knight of the Chalice': 'KotC',
    'Mortal Hunter': 'MrtHnt',
    'Ocular Adept': 'OcAdp',
    'Paladin': 'Pal',
    'Pious Templar': 'PiTem',
    'Ranger': 'Rgr',
    'Shugenja': 'Shug',
    'Slayer of Domiel': 'SDm',
    'Sorcerer': 'Sor',
    'Spellthief': 'Sth',
    'Spirit Shaman': 'Ssh',
    'Sublime Chord': 'SubCh',
    'Suel Arcanamach': 'SlArcan',
    'Temple Raider of Olidammara': 'TRoO',
    'Ur-Priest': 'UrPrst',
    'Vassal of Bahamut': 'VB',
    'Vigilante': 'Vig',
    'Warlock': 'Wlk',
    'Warmage': 'Wmg',
    'Wizard': 'Wiz',
    'Wu Jen': 'Wuj'
}
columns_to_keep = [
    'Spell Name',
    'School',
    'Comp',
    'Cast',
    'Range',
    'Duration',
    'Save',
    'SR',
    'Description',
    'Short Refer',
    'Full Refer',
    'Book',
    'Page',
    'LevelStr'
    ]

records = parse_csv_to_dicts(spell_csv_file)

spell_list = []
for record in records:
    filtered = {k: v for k, v in record.items() if k in [*columns_to_keep, *class_name_abbr.keys()]}
    if filtered:
        levels = []
        for k, v in filtered.items():
            if k in class_name_abbr and v:
                levels.append(f'{class_name_abbr[k]} {v}')
        filtered['LevelStr'] = ', '.join(levels)
        for k in class_name_abbr.keys():
            filtered.pop(k, None)
        spell_list.append(filtered.values())

# write to stdout
school_w = csv.writer(sys.stdout, quoting=csv.QUOTE_ALL)
school_w.writerow(columns_to_keep)
school_w.writerows(spell_list)